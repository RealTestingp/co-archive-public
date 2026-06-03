using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace COArchive.Models
{

    /// Represents a Calgary Opera production or event within a season.
    /// e.g. "Madama Butterfly" (MainStage), "Barber of Seville - Brunch" (Brunch).
    /// A single Event can have multiple Performances on different dates.

    public class Event
    {
        public int Id { get; set; }

        [Required, MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        [Required]
        public EventType EventType { get; set; }

        /// <summary>Season label, e.g. "2025-2026".</summary>
        [Required, MaxLength(20)]
        public string Season { get; set; } = string.Empty;

        // Opera-specific metadata (nullable — not all event types are operas)
        [MaxLength(150)]
        public string? Composer { get; set; }

        [MaxLength(150)]
        public string? Librettist { get; set; }

        /// <summary>Language the libretto was originally written in.</summary>
        [MaxLength(50)]
        public string? WrittenLanguage { get; set; }

        /// <summary>Language the opera is performed in for this production.</summary>
        [MaxLength(50)]
        public string? SungLanguage { get; set; }

        /// <summary>Total runtime description, e.g. "3h including one 25m intermission".</summary>
        [MaxLength(100)]
        public string? Duration { get; set; }

        [MaxLength(500)]
        public string? ProgramPdfUrl { get; set; }

        [MaxLength(2000)]
        public string? Notes { get; set; }


        /// Whether milestone tracking is enabled for this event.
        /// True for MainStage events; false for Brunch, Cabaret, etc.
        public bool TrackMilestones { get; set; }

        public int? VenueId { get; set; }

        // Navigation properties
        [ForeignKey(nameof(VenueId))]
        public Venue? Venue { get; set; }

        public ICollection<Performance> Performances { get; set; } = new List<Performance>();
        public ICollection<Character> Characters { get; set; } = new List<Character>();
        public ICollection<EventContributor> EventContributors { get; set; } = new List<EventContributor>();
    }
}