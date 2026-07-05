namespace ReportsService.Core.Models
{
    public class ReportRow
    {
        public string FullName { get; set; } = string.Empty;
        public string? Email { get; set; }
        public string ContributorType { get; set; } = string.Empty;
        public string? Position { get; set; }
        public string? Character { get; set; }
        public string? Production { get; set; }
        public string? Season { get; set; }
        public string? Nationality { get; set; }
        public string? VoiceType { get; set; }
    }
}