using System.ComponentModel.DataAnnotations;

namespace COArchive.Models
{
    public class VoiceType
    {
        public int Id { get; set; }

        [Required, MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        // Navigation
        public ICollection<Person> Persons { get; set; } = new List<Person>();
    }
}
