using System.ComponentModel.DataAnnotations;

namespace COArchive.Models
{
    public class Season
    {
        public int Id { get; set; }

        [Required, MaxLength(50)]
        public string Label { get; set; } = string.Empty; //e.g. 2023-2024

        // Navigation
        public ICollection<Production> Productions { get; set; } = new List<Production>(); 
    }
}
