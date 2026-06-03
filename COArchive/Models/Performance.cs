using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace COArchive.Models
{
    /// A single dated performance within an Event.
    /// e.g. "Madama Butterfly — Saturday 1 November 2025 7:30pm".
    /// The source data stores multiple dates as a comma-separated string;
    /// each date is split into its own Performance row on import.
    public class Performance
    {
        public int Id { get; set; }

        [Required]
        public int EventId { get; set; }

        [Required]
        public DateTime PerformanceDate { get; set; }

        /// Optional per-performance venue override.
        /// Falls back to Event.Venue when null.
        public int? VenueId { get; set; }

        /// e.g. "Opening Night", "Matinee", "Gala", "Closing".
        [MaxLength(50)]
        public string? PerformanceType { get; set; }

        public bool IsSoldOut { get; set; }

        public int? Attendance { get; set; }

        [MaxLength(2000)]
        public string? Notes { get; set; }

        // Navigation properties
        [ForeignKey(nameof(EventId))]
        public Event Event { get; set; } = null!;

        [ForeignKey(nameof(VenueId))]
        public Venue? Venue { get; set; }
    }
}