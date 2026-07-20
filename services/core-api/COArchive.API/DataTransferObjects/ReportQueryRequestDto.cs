namespace COArchive.API.DataTransferObjects
{
    public class ReportQueryRequestDto
    {
        public ReportMode Mode { get; set; } = ReportMode.List;
        public int? SeasonId { get; set; }
        public List<int>? NationalityIds { get; set; }
        public List<int>? ContributorTypeIds { get; set; }
        public List<int>? PositionIds { get; set; }
        public List<int>? CharacterIds { get; set; }
        public int? ProductionId { get; set; }
        public int? EventTypeId { get; set; }
        public List<int>? VoiceTypeIds { get; set; }
    }
}