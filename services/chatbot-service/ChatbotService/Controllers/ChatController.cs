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
        // --- Step 1: Search Azure AI Search for relevant archive data ---
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

        var searchOptions = new SearchOptions { Size = 20 };
        var searchResults = await searchClient.SearchAsync<SearchDocument>(request.Message, searchOptions);

        var contextBuilder = new StringBuilder();
        await foreach (var result in searchResults.Value.GetResultsAsync())
        {
          foreach (var field in result.Document)
          {
            if (field.Key.EndsWith("_vector")) continue; // skip raw vector data, not useful as text context
            contextBuilder.Append($"{field.Key}: {field.Value}, ");
          }
          contextBuilder.AppendLine();
        }

        var archiveContext = contextBuilder.Length > 0
            ? contextBuilder.ToString()
            : "No matching records found.";

        // --- Step 2: Send the message + retrieved context to the model ---
        var endpoint = _config["AzureAI:Endpoint"]
            ?? throw new InvalidOperationException("AzureAI:Endpoint is not configured.");
        var apiKey = _config["AzureAI:ApiKey"]
            ?? throw new InvalidOperationException("AzureAI:ApiKey is not configured.");
        var modelDeployment = _config["AzureAI:ModelDeployment"]
            ?? throw new InvalidOperationException("AzureAI:ModelDeployment is not configured.");

        var azureOpenAIClient = new AzureOpenAIClient(new Uri(endpoint), new AzureKeyCredential(apiKey));
        var chatClient = azureOpenAIClient.GetChatClient(modelDeployment);

        var systemPrompt = string.Format(SystemPromptTemplate, archiveContext);

        var response = await chatClient.CompleteChatAsync(
            new SystemChatMessage(systemPrompt),
            new UserChatMessage(request.Message)
        );

        return Ok(new { reply = response.Value.Content[0].Text });
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Error calling AI agent");
        return StatusCode(500, "An error occurred while processing your request.");
      }
    }
  }

  public class ChatRequestDto
  {
    public string Message { get; set; } = string.Empty;
  }
}