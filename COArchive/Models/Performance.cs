using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace COArchive.Models
{
    public class Performance
    {
        public int Id { get; set; }

        [Required]
        public int ProductionId { get; set; }

        [Required]
        public DateTime PerformanceDate { get; set; }

        [MaxLength(200)]
        public string? Venue { get; set; }

        [MaxLength(50)]
        public string? PerformanceType { get; set; }

        public bool IsSoldOut { get; set; }

        public int? Attendance { get; set; }

        [MaxLength(2000)]
        public string? Notes { get; set; }

        [ForeignKey(nameof(ProductionId))]
        public Production Production { get; set; } = null!;

        public ICollection<CastMember> CastMembers { get; set; } = new List<CastMember>();

    }
}
