using System.ComponentModel.DataAnnotations;

namespace COArchive.Models
{
    public class EventType
    {
        public int Id { get; set; }

        [Required, MaxLength(100)]
        public string Name { get; set; } = string.Empty;
        public bool TrackMilestones { get; set; } = false;

        public ICollection<Events> Events { get; set; } = new List<Events>();
    }
}
