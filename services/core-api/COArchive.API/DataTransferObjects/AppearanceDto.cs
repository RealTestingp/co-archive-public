namespace COArchive.API.DataTransferObjects
{
    public class CreateAppearanceDto
    {
        public int PersonId { get; set; }
        public int ProductionId { get; set; }
        public int ContributorTypeId { get; set; }
        public int? PositionId { get; set; }
        public int? CharacterId { get; set; }
    }
}