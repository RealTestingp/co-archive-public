using System.ComponentModel.DataAnnotations;

namespace COArchive.Models

namespace COArchive.Models
{
    public class Production
    {
        public int Id { get; set; }

        [Required, MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        [MaxLength(200)]
        public string? OriginalTitle { get; set; }

        [Required, MaxLength(150)]
        public string Composer { get; set; } = string.Empty;

        [MaxLength(150)]
        public string? Librettist { get; set; }

        [Required, MaxLength(20)]
        public string Season { get; set; } = string.Empty;

        [MaxLength(50)]
        public string? PerformedInLanguage { get; set; }

        public bool HasSupertitles { get; set; }

        [MaxLength(2000)]
        public string? Notes { get; set; }

        public ICollection<Performance> Performances { get; set; } = new List<Performance>();
        public ICollection<ProductionCreative> ProductionCreatives { get; set; } = new List<ProductionCreative>();
        public ICollection<Role> Roles { get; set; } = new List<Role>();
    }
}

