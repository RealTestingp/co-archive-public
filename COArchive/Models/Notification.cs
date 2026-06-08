using System.ComponentModel.DataAnnotations;

namespace COArchive.Models
{
    public class Notification
    {
        public int Id { get; set; }

        public int PersonId { get; set; }

        [Required, MaxLength(50)]
        public string MilestoneType { get; set; } = string.Empty;

        public int MilestoneCount { get; set; }

        public DateTime CreatedAt { get; set; }

        public bool EmailSent { get; set; } = false;

        // Navigation
        public Person Person { get; set; } = null!;
    }
}
