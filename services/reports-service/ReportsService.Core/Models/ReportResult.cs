namespace ReportsService.Core.Models
{
    public class ReportResult
    {
        public List<ReportRow> Rows { get; set; } = new();
        public int TotalCount { get; set; }
        public string ReportTitle { get; set; } = string.Empty;
        public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
    }
}