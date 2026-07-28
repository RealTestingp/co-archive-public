using Azure.Core;
using Azure.Identity;
using Microsoft.AspNetCore.Mvc;
using System.Text;
using System.Text.Json;

namespace ChatbotService.Controllers
{
  [ApiController]
  [Route("api/[controller]")]
  public class ChatController : ControllerBase
  {
    private readonly IConfiguration _config;
    private readonly ILogger<ChatController> _logger;
    private readonly IWebHostEnvironment _env;
    private static readonly HttpClient _httpClient = new();

    public ChatController(IConfiguration config, ILogger<ChatController> logger, IWebHostEnvironment env)
    {
      _config = config;
      _logger = logger;
      _env = env;
    }

    // POST /api/chat
    [HttpPost]
    public async Task<IActionResult> Chat([FromBody] ChatRequestDto request)
    {
      if (string.IsNullOrWhiteSpace(request.Message))
        return BadRequest("Message cannot be empty.");

      try
      {
        var agentEndpoint = _config["AzureAI:AgentEndpoint"]
            ?? throw new InvalidOperationException("AzureAI:AgentEndpoint is not configured.");

        // Get an Entra ID bearer token via the same identity DefaultAzureCredential
        // already uses (your az login session locally, Managed Identity in Azure).
        // NOTE: this scope is an assumption based on how Azure AI/Cognitive Services
        // data-plane auth typically works — if this 401s, that's the first thing to check.
        TokenCredential credential = _env.IsDevelopment()
          ? new AzureCliCredential()
          : new DefaultAzureCredential();
        var tokenRequestContext = new TokenRequestContext(new[] { "https://ai.azure.com/.default" });
        var token = await credential.GetTokenAsync(tokenRequestContext, CancellationToken.None);

        // Build the conversation as role-tagged input items, matching the
        // OpenAI Responses API JSON shape (input: [{ role, content: [{ type, text }] }]).
        var inputItems = new List<object>();
        foreach (var turn in request.History)
        {
          inputItems.Add(new
          {
            role = turn.Role == "user" ? "user" : "assistant",
            content = new[] { new { type = "input_text", text = turn.Content } }
          });
        }
        inputItems.Add(new
        {
          role = "user",
          content = new[] { new { type = "input_text", text = request.Message } }
        });

        var requestBody = new { input = inputItems };
        var jsonBody = JsonSerializer.Serialize(requestBody);

        using var httpRequest = new HttpRequestMessage(HttpMethod.Post, agentEndpoint)
        {
          Content = new StringContent(jsonBody, Encoding.UTF8, "application/json")
        };
        httpRequest.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token.Token);

        var httpResponse = await _httpClient.SendAsync(httpRequest);
        var responseText = await httpResponse.Content.ReadAsStringAsync();

        if (!httpResponse.IsSuccessStatusCode)
        {
          _logger.LogError("Foundry error ({StatusCode}): {Body}", httpResponse.StatusCode, responseText);
          return StatusCode((int)httpResponse.StatusCode, "An error occurred while contacting the Foundry agent.");
        }

        using var doc = JsonDocument.Parse(responseText);
        var root = doc.RootElement;

        string? replyText = null;
        if (root.TryGetProperty("output", out var outputArray))
        {
          foreach (var item in outputArray.EnumerateArray())
          {
            if (item.TryGetProperty("type", out var typeProp) && typeProp.GetString() == "message"
                && item.TryGetProperty("content", out var contentArray))
            {
              foreach (var contentItem in contentArray.EnumerateArray())
              {
                if (contentItem.TryGetProperty("type", out var contentType) && contentType.GetString() == "output_text"
                    && contentItem.TryGetProperty("text", out var textProp))
                {
                  replyText = textProp.GetString();
                  break;
                }
              }
            }
            if (replyText != null) break;
          }
        }

        if (replyText == null)
        {
          _logger.LogWarning("Could not find output_text in Foundry response: {Body}", responseText);
          return StatusCode(500, "Unexpected response format from Foundry agent.");
        }

        return Ok(new { reply = replyText });
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Error calling Foundry agent");
        return StatusCode(500, "An error occurred while processing your request.");
      }
    }
  }

  public class ChatMessageDto
  {
    public string Role { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
  }

  public class ChatRequestDto
  {
    public string Message { get; set; } = string.Empty;
    public List<ChatMessageDto> History { get; set; } = new();
  }
}