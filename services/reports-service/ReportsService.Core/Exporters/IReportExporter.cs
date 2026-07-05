namespace ReportsService.Core.Exporters
{
    public interface IReportExporter
    {
        string Format { get; } // "xlsx" or "pdf"
        byte[] Export(ReportsService.Core.Models.ReportResult result);
    }
}