using System.ComponentModel.DataAnnotations;

namespace COArchive.Models
{

    /// A physical location where Calgary Opera events are held.
    /// e.g. Southern Alberta Jubilee Auditorium, Opera Centre, Petroleum Club.

    public class Venue
    {
        public int Id { get; set; }

        [Required, MaxLength(200)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(200)]
        public string? StreetAddress { get; set; }

        [MaxLength(100)]
        public string? City { get; set; }

        [MaxLength(100)]
        public string? Province { get; set; }

        [MaxLength(20)]
        public string? PostalCode { get; set; }

        [MaxLength(100)]
        public string? Country { get; set; }

        // Navigation properties
        public ICollection<Events> Events { get; set; } = new List<Events>();
    }
}