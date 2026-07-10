using Azure;
using Azure.AI.OpenAI;
using OpenAI.Chat;
using Microsoft.AspNetCore.Mvc;

namespace ChatbotService.Controllers
{
  [ApiController]
  [Route("api/[controller]")]
  public class ChatController : ControllerBase
  {
    private readonly IConfiguration _config;
    private readonly ILogger<ChatController> _logger;

    private const string SystemPrompt =
        "You are the Calgary Opera Archive Assistant. You only answer questions using " +
        "information from the Calgary Opera archive database. You do not have access to " +
        "that database yet in this version of the assistant. " +
        "If asked about specific productions, people, characters, seasons, or any other " +
        "archive data, respond with: \"I don't have access to the archive database yet, " +
        "so I can't answer that accurately.\" Do not guess, invent, or use general " +
        "knowledge to answer archive-related questions, even if you believe it might be correct.";

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
        var endpoint = _config["AzureAI:Endpoint"]
            ?? throw new InvalidOperationException("AzureAI:Endpoint is not configured.");
        var apiKey = _config["AzureAI:ApiKey"]
            ?? throw new InvalidOperationException("AzureAI:ApiKey is not configured.");
        var modelDeployment = _config["AzureAI:ModelDeployment"]
            ?? throw new InvalidOperationException("AzureAI:ModelDeployment is not configured.");

        var azureOpenAIClient = new AzureOpenAIClient(new Uri(endpoint), new AzureKeyCredential(apiKey));
        var chatClient = azureOpenAIClient.GetChatClient(modelDeployment);

        var response = await chatClient.CompleteChatAsync(
            new SystemChatMessage(SystemPrompt),
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