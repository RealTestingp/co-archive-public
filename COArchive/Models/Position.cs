using System.ComponentModel.DataAnnotations;

namespace COArchive.Models
{
    public class Position
    {
        public int Id { get; set; }

        public int ContributorTypeId { get; set; }

        [Required, MaxLength(200)]
        public string Name { get; set; } = string.Empty;

        // Navigation
        public ContributorType ContributorType { get; set; } = null!;
        public ICollection<Appearance> Appearances { get; set; } = new List<Appearance>();
    }
}
