namespace COArchive.API.DataTransferObjects
{
    public class ReportQueryRequestDto
    {
        public ReportMode Mode { get; set; } = ReportMode.List;
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
    }
}