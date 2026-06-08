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

        public int EventId { get; set; }

        public DateTime Date { get; set; }

        public DateTime? DateTo { get; set; }

        // Navigation
        public Events Event { get; set; } = null!;
    }
}