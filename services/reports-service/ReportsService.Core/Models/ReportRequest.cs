namespace ReportsService.Core.Models
{
    public class ReportRequest
    {
        public List<int>? SeasonIds { get; set; }
        public List<int>? NationalityIds { get; set; }
        public List<int>? ContributorTypeIds { get; set; }
        public List<int>? PositionIds { get; set; }
        public List<int>? CharacterIds { get; set; }
        public List<int>? ProductionIds { get; set; }
        public List<int>? EventTypeIds { get; set; }
        public List<int>? VoiceTypeIds { get; set; }
        public List<int>? WrittenLanguageIds { get; set; }
        public List<int>? SungLanguageIds { get; set; }
        public string ExportFormat { get; set; } = "xlsx"; // "xlsx" or "pdf"
        public string ReportTitle { get; set; } = "Calgary Opera Report";
    }
}