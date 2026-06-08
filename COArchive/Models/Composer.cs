using System.ComponentModel.DataAnnotations;

namespace COArchive.Models
{
    public class Composer
    {
        public int Id { get; set; }

        [Required, MaxLength(200)]
        public string Name { get; set; } = string.Empty;

        // Navigation
        public ICollection<Opera> Operas { get; set; } = new List<Opera>();
    }
}
