using System.ComponentModel.DataAnnotations;

namespace COArchive.Models
{
    public class AuditLog
    {
        public int Id { get; set; }

        [Required, MaxLength(100)]
        public string TableName { get; set; } = string.Empty;

        public int RecordId { get; set; }

        [Required, MaxLength(50)]
        public string Action { get; set; } = string.Empty;

        [Required, MaxLength(200)]
        public string ChangedBy { get; set; } = string.Empty;

        public DateTime ChangedAt { get; set; }

        public string? OldValues { get; set; }  // No MaxLength — stores JSON, can be large

        public string? NewValues { get; set; }  // No MaxLength — stores JSON, can be large
    }
}
