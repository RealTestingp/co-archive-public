using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace COArchive.Models
{

    /// Represents a Calgary Opera production or event within a season.
    /// e.g. "Madama Butterfly" (MainStage), "Barber of Seville - Brunch" (Brunch).
    /// A single Production can have multiple Performances on different dates.

    public class Production : IAuditable
    {
        public int Id { get; set; }

        public int SeasonId { get; set; }
        public int EventTypeId { get; set; }
        public int VenueId { get; set; }
        public int? OperaId { get; set; }
        public int? WrittenLanguageId { get; set; }
        public int? SungLanguageId { get; set; }

        [Required, MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        public int? RuntimeMinutes { get; set; }

        [MaxLength(500)]
        public string? ProgramPdfUrl { get; set; }

        [MaxLength(1000)]
        public string? Notes { get; set; }

        // Navigation
        public Season Season { get; set; } = null!;
        public EventType EventType { get; set; } = null!;
        public Venue Venue { get; set; } = null!;
        public Opera? Opera { get; set; }
        public Language? WrittenLanguage { get; set; }
        public Language? SungLanguage { get; set; }
        public ICollection<Performance> Performances { get; set; } = new List<Performance>();
        public ICollection<Appearance> Appearances { get; set; } = new List<Appearance>();

    }
}