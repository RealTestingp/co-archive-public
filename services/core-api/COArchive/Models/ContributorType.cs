using System.ComponentModel.DataAnnotations;

namespace COArchive.Models
{
    public class ContributorType
    {
        public int Id { get; set; }

        [Required, MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        public bool TrackPerformances { get; set; } = false;

        // Navigation
        public ICollection<Position> Positions { get; set; } = new List<Position>();
        public ICollection<Appearance> Appearances { get; set; } = new List<Appearance>();
    }
}
