namespace COArchive.Models
{
    public class Appearance
    {
        public int Id { get; set; }

        public int PersonId { get; set; }
        public int EventId { get; set; }
        public int ContributorTypeId { get; set; }
        public int? PositionId { get; set; }
        public int? CharacterId { get; set; }

        // Navigation
        public Person Person { get; set; } = null!;
        public Events Event { get; set; } = null!;
        public ContributorType ContributorType { get; set; } = null!;
        public Position? Position { get; set; }
        public Character? Character { get; set; }
    }
}
