using ReportsService.Core.Models;

namespace ReportsService.Core.HttpClients
{
    public interface ICoreApiClient
    {
        Task<ReportResult> QueryAsync(ReportRequest request);
    }
}