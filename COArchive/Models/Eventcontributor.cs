using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace COArchive.Models
{
    /// Links a Contributor to an Event in a specific role.
    /// This is the single join table that replaces both CastMember and ProductionCreative.
    ///
    /// Examples:
    ///   Contributor: "Daniela Musca"  |  Role: "Stage Director"     |  Character: null
    ///   Contributor: "Grisha Mart."   |  Role: "Cio-Cio-San"        |  Character: (FK)
    ///   Contributor: "Mike Johnson"   |  Role: "Chorus - Baritone"  |  Character: null
    ///   Contributor: "John Lowry"     |  Role: "Concertmaster"      |  Character: null
    public class EventContributor
    {
        public int Id { get; set; }

        [Required]
        public int EventId { get; set; }

        [Required]
        public int ContributorId { get; set; }

        /// The role this contributor held for this event.
        /// For artists: the character name (e.g. "Cio-Cio-San").
        /// For creatives: the production role (e.g. "Stage Director", "Conductor").
        /// For crew/orchestra: their position (e.g. "Head of Props", "Concertmaster").
        [Required, MaxLength(150)]
        public string Role { get; set; } = string.Empty;

        /// Optional FK to a Character record when the contributor is playing
        /// a named character in the opera. Null for creatives, crew, orchestra, etc.
        public int? CharacterId { get; set; }

        /// Whether this contributor is a McPhee artist for this specific event.
        /// Stored here (not only on Contributor) because a person can be McPhee
        /// for one event but not another.
        public bool IsMcPhee { get; set; }

        /// True if this artist stepped in as a last-minute substitute.
        public bool IsSubstitute { get; set; }

        [MaxLength(500)]
        public string? Notes { get; set; }

        // Navigation properties
        [ForeignKey(nameof(EventId))]
        public Event Event { get; set; } = null!;

        [ForeignKey(nameof(ContributorId))]
        public Contributor Contributor { get; set; } = null!;

        [ForeignKey(nameof(CharacterId))]
        public Character? Character { get; set; }
    }
}