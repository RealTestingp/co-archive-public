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

    // One shared HttpClient for the whole app's lifetime — creating a new one per request wastes sockets/resources.
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
        // The Foundry agent's REST endpoint URL, read from config. Must include ?api-version=... or Foundry rejects the request.
        var agentEndpoint = _config["AzureAI:AgentEndpoint"]
            ?? throw new InvalidOperationException("AzureAI:AgentEndpoint is not configured.");

        // Pick how to authenticate depending on where this is running:
        // locally it uses your own `az login` session, but once deployed to Azure it
        // switches to Managed Identity so no login or secret is ever needed in production.
        TokenCredential credential = _env.IsDevelopment()
          ? new AzureCliCredential()
          : new DefaultAzureCredential();
        var tokenRequestContext = new TokenRequestContext(new[] { "https://ai.azure.com/.default" });
        var token = await credential.GetTokenAsync(tokenRequestContext, CancellationToken.None);

        // Foundry's Responses API expects the whole conversation as a list of "input items,"
        // not just the newest message — so we rebuild the full history here every time.
        var inputItems = new List<object>();
        foreach (var turn in request.History)
        {
          var isUser = turn.Role == "user";

          // Foundry is picky here: a user turn must use type "input_text", while an assistant
          // turn must use type "output_text" AND include an (empty is fine) annotations array.
          // Getting this pairing wrong causes a 400 error from Foundry.
          object contentItem = isUser
            ? new { type = "input_text", text = turn.Content }
            : new { type = "output_text", text = turn.Content, annotations = new object[] { } };

          inputItems.Add(new
          {
            role = isUser ? "user" : "assistant",
            content = new[] { contentItem }
          });
        }

        // Finally, add the brand-new question the user just typed. This has to be a separate
        // step from the history loop above — forgetting this line means Foundry only ever
        // sees old messages and never actually answers what was just asked.
        inputItems.Add(new
        {
          role = "user",
          content = new[] { new { type = "input_text", text = request.Message } }
        });

        var requestBody = new { input = inputItems };
        var jsonBody = JsonSerializer.Serialize(requestBody);

        // Logs the exact JSON being sent to Foundry — useful while debugging, safe to delete later.
        _logger.LogInformation("Outgoing request body: {Body}", jsonBody);

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

        // Logs Foundry's full raw JSON reply — useful while debugging, safe to delete later.
        _logger.LogInformation("Foundry raw success response: {Body}", responseText);

        using var doc = JsonDocument.Parse(responseText);
        var root = doc.RootElement;

        // Foundry's response can contain several kinds of output items (its internal reasoning
        // steps, tool calls, etc.) mixed together — we specifically want the one with
        // type "message", since that's the actual reply meant for the user.
        string? replyText = null;
        if (root.TryGetProperty("output", out var outputArray))
        {
          foreach (var item in outputArray.EnumerateArray())
          {
            if (item.TryGetProperty("type", out var typeProp) && typeProp.GetString() == "message"
                && item.TryGetProperty("content", out var contentArray))
            {
              // Even inside a "message" item, content can include multiple pieces (e.g. a
              // refusal). We only want the plain "output_text" piece — the actual answer text.
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

        // Foundry sometimes appends citation markers like 【8:0†source】 to the reply text.
        // These aren't meant for end users, so we remove them here before sending the reply on.
        if (replyText != null)
        {
          replyText = System.Text.RegularExpressions.Regex.Replace(replyText, @"【\d+:\d+†source】", "").Trim();
        }

        // If we got this far and still have no reply text, something about Foundry's response
        // shape didn't match what we expected — log it so we can see why, and fail gracefully.
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

  // Shape of one past message, as sent by the frontend.
  public class ChatMessageDto
  {
    public string Role { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
  }

  // Shape of the whole incoming request: the new message plus the full conversation so far.
  public class ChatRequestDto
  {
    public string Message { get; set; } = string.Empty;
    public List<ChatMessageDto> History { get; set; } = new();
  }
}