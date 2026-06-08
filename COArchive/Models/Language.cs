using System.ComponentModel.DataAnnotations;

namespace COArchive.Models
{
    public class Language
    {
        public int Id { get; set; }

        [Required, MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        // Navigation
        public ICollection<Events> WrittenLanguageEvents { get; set; } = new List<Events>();
        public ICollection<Events> SungLanguageEvents { get; set; } = new List<Events>();
    }
}

