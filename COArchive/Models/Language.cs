using System.ComponentModel.DataAnnotations;

namespace COArchive.Models
{
    public class Language
    {
        public int Id { get; set; }

        [Required, MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        // Navigation
        public ICollection<Production> WrittenLanguageProductions { get; set; } = new List<Production>();
        public ICollection<Production> SungLanguageProductions { get; set; } = new List<Production>();
    }
}

