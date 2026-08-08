using System.ComponentModel.DataAnnotations;

namespace COArchive.Models
{
    public class Opera : IAuditable
    {
        public int Id { get; set; }

        [Required, MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        // Navigation
        public ICollection<Composer> Composers { get; set; } = new List<Composer>();
        public ICollection<Librettist> Librettists { get; set; } = new List<Librettist>();
        public ICollection<Character> Characters { get; set; } = new List<Character>();
        public ICollection<Production> Productions { get; set; } = new List<Production>();
    }
}