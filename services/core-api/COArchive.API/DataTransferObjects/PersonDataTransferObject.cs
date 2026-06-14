namespace COArchive.API.DataTransferObjects
{
    public class CreatePersonDto
    {
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string? MiddleName { get; set; }
        public string? Email { get; set; }
        public int? VoiceTypeId { get; set; }
        public string? ProfileImageUrl { get; set; }
        public bool IsActive { get; set; } = true;
        public List<int> NationalityIds { get; set; } = new List<int>();
    }

    public class UpdatePersonDto
    {
        public int Id { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string? MiddleName { get; set; }
        public string? Email { get; set; }
        public int? VoiceTypeId { get; set; }
        public string? ProfileImageUrl { get; set; }
        public bool IsActive { get; set; }
        public List<int> NationalityIds { get; set; } = new List<int>();
    }
}