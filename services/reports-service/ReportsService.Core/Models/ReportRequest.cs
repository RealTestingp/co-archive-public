namespace ReportsService.Core.Models
{
    public class ReportRequest
    {
        public int? SeasonId { get; set; }
        public int? NationalityId { get; set; }
        public int? ContributorTypeId { get; set; }
        public int? PositionId { get; set; }
        public int? CharacterId { get; set; }
        public int? ProductionId { get; set; }
        public int? EventTypeId { get; set; }
        public int? VoiceTypeId { get; set; }
        public string ExportFormat { get; set; } = "xlsx"; // "xlsx" or "pdf"
        public string ReportTitle { get; set; } = "Calgary Opera Report";
    }
}