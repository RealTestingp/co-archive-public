namespace ReportsService.Core.Models
{
    public class ReportRequest
    {
        public int? SeasonId { get; set; }
        public List<int>? NationalityIds { get; set; }
        public List<int>? ContributorTypeIds { get; set; }
        public List<int>? PositionIds { get; set; }
        public List<int>? CharacterIds { get; set; }
        public int? ProductionId { get; set; }
        public int? EventTypeId { get; set; }
        public List<int>? VoiceTypeIds { get; set; }
        public string ExportFormat { get; set; } = "xlsx"; // "xlsx" or "pdf"
        public string ReportTitle { get; set; } = "Calgary Opera Report";
    }
}