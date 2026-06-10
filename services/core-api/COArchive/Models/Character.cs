using System.ComponentModel.DataAnnotations;

namespace COArchive.Models
{
    public class Character
    {
        public int Id { get; set; }

        public int OperaId { get; set; }

        [Required, MaxLength(200)]
        public string Name { get; set; } = string.Empty;

        // Navigation
        public Opera Opera { get; set; } = null!;
        public ICollection<Appearance> Appearances { get; set; } = new List<Appearance>();
    }
}
