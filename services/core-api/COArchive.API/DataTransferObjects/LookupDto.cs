namespace COArchive.API.DataTransferObjects
{
    public class CreateSeasonDto
    {
        public string Label { get; set; } = string.Empty;
    }

    public class CreateVenueDto
    {
        public string Name { get; set; } = string.Empty;
        public string? StreetAddress { get; set; }
        public string? City { get; set; }
        public string? Province { get; set; }
        public string? PostalCode { get; set; }
        public string? Country { get; set; }
    }

    public class UpdateVenueDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? StreetAddress { get; set; }
        public string? City { get; set; }
        public string? Province { get; set; }
        public string? PostalCode { get; set; }
        public string? Country { get; set; }
    }

    public class CreateLanguageDto
    {
        public string Name { get; set; } = string.Empty;
    }
}