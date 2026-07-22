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
    [HttpPost]
    public async Task<IActionResult> Chat([FromBody] ChatRequestDto request)
    {
      if (string.IsNullOrWhiteSpace(request.Message))
        return BadRequest("Message cannot be empty.");

      try
      {
        // --- Step 1: Search Azure AI Search, using recent conversation as extra context ---
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

        // Pull in the last few turns so follow-up questions ("when was that production?")
        // still retrieve the right records, even though the entity name isn't repeated.
        var recentContext = string.Join(" ", request.History.TakeLast(4).Select(h => h.Content));
        var searchQuery = string.IsNullOrWhiteSpace(recentContext)
            ? request.Message
            : $"{recentContext} {request.Message}";

        var searchOptions = new SearchOptions { Size = 20 };
        var searchResults = await searchClient.SearchAsync<SearchDocument>(searchQuery, searchOptions);

        var contextBuilder = new StringBuilder();
        await foreach (var result in searchResults.Value.GetResultsAsync())
        {
          foreach (var field in result.Document)
          {
            if (field.Key.EndsWith("_vector")) continue;
            contextBuilder.Append($"{field.Key}: {field.Value}, ");
          }
          contextBuilder.AppendLine();
        }

        var archiveContext = contextBuilder.Length > 0
            ? contextBuilder.ToString()
            : "No matching records found.";

        // --- Step 2: Send the full conversation + retrieved context to the model ---
        var endpoint = _config["AzureAI:Endpoint"]
            ?? throw new InvalidOperationException("AzureAI:Endpoint is not configured.");
        var apiKey = _config["AzureAI:ApiKey"]
            ?? throw new InvalidOperationException("AzureAI:ApiKey is not configured.");
        var modelDeployment = _config["AzureAI:ModelDeployment"]
            ?? throw new InvalidOperationException("AzureAI:ModelDeployment is not configured.");

        var azureOpenAIClient = new AzureOpenAIClient(new Uri(endpoint), new AzureKeyCredential(apiKey));
        var chatClient = azureOpenAIClient.GetChatClient(modelDeployment);

        var systemPrompt = string.Format(SystemPromptTemplate, archiveContext);

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
        _logger.LogError(ex, "Error calling AI agent");
        return StatusCode(500, "An error occurred while processing your request.");
      }
    }
  }

  public class ChatMessageDto
  {
    public string Role { get; set; } = string.Empty; // "user" or "assistant"
    public string Content { get; set; } = string.Empty;
  }

  public class ChatRequestDto
  {
    public string Message { get; set; } = string.Empty;
    public List<ChatMessageDto> History { get; set; } = new();
  }
}