using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace COArchive.Models
{
    /// A character or role within a specific Event/production.
    /// e.g. "Cio-Cio-San" in Madama Butterfly, "Figaro" in Barber of Seville.
    /// Characters are linked to Events, not individual Performances,
    /// since the same character exists across all performances of a production.
    public class Character
    {
        public int Id { get; set; }

        [Required]
        public int EventId { get; set; }

        [Required, MaxLength(150)]
        public string Name { get; set; } = string.Empty;

        /// Expected voice type for this character, e.g. "Soprano", "Tenor".
        [MaxLength(50)]
        public string? VoiceType { get; set; }

        /// Brief description of the character in the story.
        [MaxLength(500)]
        public string? Description { get; set; }

        public bool IsPrincipal { get; set; } = true;

        // Navigation properties
        [ForeignKey(nameof(EventId))]
        public Event Event { get; set; } = null!;

        public ICollection<EventContributor> EventContributors { get; set; } = new List<EventContributor>();
    }
}