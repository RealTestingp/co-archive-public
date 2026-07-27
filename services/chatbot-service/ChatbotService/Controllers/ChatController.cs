using Azure;
using Azure.AI.OpenAI;
using Azure.Search.Documents;
using Azure.Search.Documents.Models;
using OpenAI.Chat;
using Microsoft.AspNetCore.Mvc;
using System.Text;

namespace ChatbotService.Controllers
{
  [ApiController]
  [Route("api/[controller]")]
  public class ChatController : ControllerBase
  {
    private readonly IConfiguration _config;
    private readonly ILogger<ChatController> _logger;

    // This is the guardrail layer. It's injected as a "system" message on
    // every single request, regardless of what the user asks — it's what
    // stops the assistant from hallucinating archive data it doesn't
    // actually have, and enforces our content-safety rules (no hate
    // speech, no violent content, calm de-escalation for hostile users).
    //
    // Note: we call Azure AI Search + Azure OpenAI directly from this
    // controller, rather than going through Azure AI Foundry's full
    // "agent" framework. Foundry's agent has its own separate instructions
    // field and knowledge base, but calling it requires identity-based
    // auth (DefaultAzureCredential), which would mean every teammate
    // needing an Azure sign-in just to run this locally. We chose the
    // simpler direct-API-key approach so the whole team could develop
    // and test this easily — which is also why this prompt duplicates
    // (rather than references) the rules documented in our Foundry
    // grounding document.
    private const string SystemPromptTemplate =
        "You are the Calgary Opera Archive Assistant. You answer questions using ONLY " +
        "the archive data provided below in the 'Archive data' section. " +
        "If the answer isn't in the provided data, say: \"I don't have that information " +
        "in the archive.\" Do not guess or use general knowledge about opera or Calgary Opera. " +
        "\n\nYou MUST NOT generate, endorse, or repeat hate speech, slurs, or discriminatory " +
        "content targeting race, ethnicity, religion, gender, sexual orientation, disability, " +
        "or other protected characteristics. You MUST NOT generate or describe graphic violence, " +
        "gore, or content that glorifies harm to real people. You MUST NOT generate content that " +
        "promotes, incites, or provides instructions for violence, self-harm, or illegal acts. " +
        "\n\nIf the user is hostile, abusive, or uses profanity directed at you, respond calmly: " +
        "\"I'm here to help with questions about the Calgary Opera Archive. Let me know if there's " +
        "something I can look up for you.\" Do not lecture or escalate. " +
        "\n\nArchive data:\n{0}";

    public ChatController(IConfiguration config, ILogger<ChatController> logger)
    {
      _config = config;
      _logger = logger;
    }

    // POST /api/chat
    // This endpoint implements the full RAG (Retrieval-Augmented Generation) pipeline.
    // Retrieval (Step 1, search real archive data), 
    // Augmentation (inject that data into the prompt),
    // Generation (Step 2, call the model to produce an answer). 

    // The point of RAG is that the model never answers from its own general knowledge alone.
    // It only ever works from what we actually give it, which is what keeps answers grounded
    // in the real database instead of plausible-sounding guesses.
    [HttpPost]
    public async Task<IActionResult> Chat([FromBody] ChatRequestDto request)
    {
      if (string.IsNullOrWhiteSpace(request.Message))
        return BadRequest("Message cannot be empty.");

      try
      {
        // Step 1: Search Azure AI Search, using recent conversation as extra context
        var searchEndpoint = _config["AzureSearch:Endpoint"]
            ?? throw new InvalidOperationException("AzureSearch:Endpoint is not configured.");
        var searchApiKey = _config["AzureSearch:ApiKey"]
            ?? throw new InvalidOperationException("AzureSearch:ApiKey is not configured.");
        var indexName = _config["AzureSearch:IndexName"]
            ?? throw new InvalidOperationException("AzureSearch:IndexName is not configured.");

        var searchClient = new SearchClient(
            new Uri(searchEndpoint),
            indexName,
            new AzureKeyCredential(searchApiKey)
        );

        // Conversation memory (search side, part 1 of 2):
        // Without this, a follow-up question would be searched on its own, with no idea 
        // what the previous message contained and would almost certainly return no useful
        // matches. By folding in the last few turns of conversation, the search query itself
        // carries enough context to actually find the right archive records. 
        var recentContext = string.Join(" ", request.History.TakeLast(4).Select(h => h.Content));
        var searchQuery = string.IsNullOrWhiteSpace(recentContext)
            ? request.Message
            : $"{recentContext} {request.Message}";

        // We're using plain keyword search (Size = 20 candidate matches), not vector/semantic search.
        // I actually tried adding vector search on top of this earlier in the project and it actually made
        // results worse, and mixing vector + keyword search seemed to crowd out matches that keyword search 
        // alone found correctly. I rolled that back in favor of this simpler, more reliable approach.
        var searchOptions = new SearchOptions { Size = 20 };
        var searchResults = await searchClient.SearchAsync<SearchDocument>(searchQuery, searchOptions);

        // Build a plain-text block out of whatever fields came back from each matching record.
        // This is the "Augmentation" step. Turning structured search results into a text blob 
        // the model can actually read as context.
        var contextBuilder = new StringBuilder();
        await foreach (var result in searchResults.Value.GetResultsAsync())
        {
          foreach (var field in result.Document)
          {
            // Skip the raw embedding vector field — it's just a long
            // array of numbers, meaningless as text context for the model.
            if (field.Key.EndsWith("_vector")) continue;
            contextBuilder.Append($"{field.Key}: {field.Value}, ");
          }
          contextBuilder.AppendLine();
        }

        var archiveContext = contextBuilder.Length > 0
            ? contextBuilder.ToString()
            : "No matching records found.";

        // Step 2: Send the full conversation and retrieved context to the model
        var endpoint = _config["AzureAI:Endpoint"]
            ?? throw new InvalidOperationException("AzureAI:Endpoint is not configured.");
        var apiKey = _config["AzureAI:ApiKey"]
            ?? throw new InvalidOperationException("AzureAI:ApiKey is not configured.");
        var modelDeployment = _config["AzureAI:ModelDeployment"]
            ?? throw new InvalidOperationException("AzureAI:ModelDeployment is not configured.");

        var azureOpenAIClient = new AzureOpenAIClient(new Uri(endpoint), new AzureKeyCredential(apiKey));
        var chatClient = azureOpenAIClient.GetChatClient(modelDeployment);

        // Insert the retrieved archive data into the system prompt template. This is the actual 
        // Grounding step. The {0} placeholder gets replaced with the real records found above.
        var systemPrompt = string.Format(SystemPromptTemplate, archiveContext);

        // Conversation memory (model side, part 2 of 2):
        // We build the full conversation as one ordered list of messages —
        // the system prompt first, then every past user/assistant turn in
        // order, then the new user message last. 
        // 
        // Sending the whole thread (instead of just the latest message) is 
        // what lets the model figure out what a follow-up like "when was that production?" actually
        // refers to. Before this fix, each message was sent completely on its own, so the model 
        // had no earlier context to work from and couldn't resolve what "that" meant.
        var messages = new List<ChatMessage> { new SystemChatMessage(systemPrompt) };
        foreach (var turn in request.History)
        {
          messages.Add(turn.Role == "user"
              ? new UserChatMessage(turn.Content)
              : new AssistantChatMessage(turn.Content));
        }
        messages.Add(new UserChatMessage(request.Message));

        var response = await chatClient.CompleteChatAsync(messages);

        return Ok(new { reply = response.Value.Content[0].Text });
      }
      catch (Exception ex)
      {
        // Catch-all so a failure anywhere in the pipeline returns a clean 500 HTTP response to the frontend
        // instead of an unhandled exception, and gets logged server-side for debugging.
        _logger.LogError(ex, "Error calling AI agent");
        return StatusCode(500, "An error occurred while processing your request.");
      }
    }
  }

  // Shape of one turn in the conversation history sent from the frontend.
  public class ChatMessageDto
  {
    public string Role { get; set; } = string.Empty; // "user" or "assistant"
    public string Content { get; set; } = string.Empty;
  }

  // Shape of the full request body: the new message plus the full
  // conversation history built up so far (ChatWidget.tsx assembles this before calling this endpoint).
  public class ChatRequestDto
  {
    public string Message { get; set; } = string.Empty;
    public List<ChatMessageDto> History { get; set; } = new();
  }
}