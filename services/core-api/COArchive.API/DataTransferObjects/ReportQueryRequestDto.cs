namespace COArchive.API.DataTransferObjects
{
    public class ReportQueryRequestDto
    {
        public ReportMode Mode { get; set; } = ReportMode.List;
        public int? SeasonId { get; set; }
        public int? NationalityId { get; set; }
        public int? ContributorTypeId { get; set; }
        public int? PositionId { get; set; }
        public int? CharacterId { get; set; }
        public int? ProductionId { get; set; }
        public int? EventTypeId { get; set; }
        public int? VoiceTypeId { get; set; }
    }
}