using ReportsService.Core.Exporters;
using ReportsService.Core.HttpClients;
using ReportsService.Core.Models;

namespace ReportsService.Core.Services
{
    public class ReportGeneratorService : IReportGenerator
    {
        private readonly ICoreApiClient _coreApiClient;
        private readonly IEnumerable<IReportExporter> _exporters;

        public ReportGeneratorService(
            ICoreApiClient coreApiClient,
            IEnumerable<IReportExporter> exporters)
        {
            _coreApiClient = coreApiClient;
            _exporters = exporters;
        }

        public async Task<byte[]> GenerateAsync(ReportRequest request)
        {
            var result = await _coreApiClient.QueryAsync(request);

            var exporter = _exporters.FirstOrDefault(e =>
                e.Format == request.ExportFormat.ToLower())
                ?? throw new NotSupportedException(
                    $"Export format '{request.ExportFormat}' is not supported.");

            return exporter.Export(result);
        }
    }
}