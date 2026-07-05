using System.Net.Http.Json;
using ReportsService.Core.Models;

namespace ReportsService.Core.HttpClients
{
    public class CoreApiClient : ICoreApiClient
    {
        private readonly HttpClient _httpClient;

        public CoreApiClient(HttpClient httpClient)
        {
            _httpClient = httpClient;
        }

        public async Task<ReportResult> QueryAsync(ReportRequest request)
        {
            var response = await _httpClient.PostAsJsonAsync(
                "/api/ReportsQuery/query", request);

            response.EnsureSuccessStatusCode();

            var result = await response.Content
                .ReadFromJsonAsync<ReportResult>();

            result!.ReportTitle = request.ReportTitle;
            result.GeneratedAt = DateTime.UtcNow;

            return result;
        }
    }
}