using ReportsService.Core.Models;

namespace ReportsService.Core.Services
{
    public interface IReportGenerator
    {
        Task<byte[]> GenerateAsync(ReportRequest request);
    }
}