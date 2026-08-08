using System.ComponentModel.DataAnnotations;

namespace COArchive.Models
{
    public class Person : IAuditable
    {
        public int Id { get; set; }

        [Required, MaxLength(100)]
        public string FirstName { get; set; } = string.Empty;

        [MaxLength(100)]
        public string? MiddleName { get; set; }

        [Required, MaxLength(100)]
        public string LastName { get; set; } = string.Empty;

        [MaxLength(200)]
        public string? Email { get; set; }

        public int? VoiceTypeId { get; set; }

        [MaxLength(500)]
        public string? ProfileImageUrl { get; set; }

        public bool IsActive { get; set; } = true;

        // Computed property — no database column created
        public string FullName => MiddleName != null
            ? $"{FirstName} {MiddleName} {LastName}"
            : $"{FirstName} {LastName}";

        // Navigation
        public VoiceType? VoiceType { get; set; }
        public ICollection<Nationality> Nationalities { get; set; } = new List<Nationality>();
        public ICollection<Appearance> Appearances { get; set; } = new List<Appearance>();
        public ICollection<Notification> Notifications { get; set; } = new List<Notification>();
    }
}