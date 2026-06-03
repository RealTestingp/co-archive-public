using System.ComponentModel.DataAnnotations;

namespace COArchive.Models
{
    /// Represents any individual associated with Calgary Opera:
    /// singers, conductors, crew, chorus members, orchestra, staff, board, etc.
    public class Contributor
    {
        public int Id { get; set; }

        [Required, MaxLength(100)]
        public string FirstName { get; set; } = string.Empty;

        [Required, MaxLength(100)]
        public string LastName { get; set; } = string.Empty;

        [Required]
        public ContributorType ContributorType { get; set; }

        /// McPhee Artists are a special designation that can overlap with Artist type.
        /// A person can be both an Artist and a McPhee artist simultaneously for one event.
        public bool IsMcPhee { get; set; }

        /// Voice classification — only relevant for singers (Artist, Chorus).
        /// e.g. Soprano, Mezzo-Soprano, Tenor, Baritone, Bass.
        [MaxLength(50)]
        public string? VoiceType { get; set; }

        [MaxLength(200)]
        public string? Email { get; set; }

        [MaxLength(100)]
        public string? Nationality { get; set; }

        [MaxLength(500)]
        public string? ProfileImageUrl { get; set; }

        [MaxLength(1000)]
        public string? Biography { get; set; }

        public string FullName => $"{FirstName} {LastName}";

        // Navigation properties
        public ICollection<EventContributor> EventContributors { get; set; } = new List<EventContributor>();
    }
}