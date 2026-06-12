namespace COArchive.API.DataTransferObjects
{
    public class ProductionDataTransferObject
    {
        public string Title { get; set; } = string.Empty;
        public int SeasonId { get; set; }
        public int EventTypeId { get; set; }
        public int VenueId { get; set; }
        public int? OperaId { get; set; }
        public int? WrittenLanguageId { get; set; }
        public int? SungLanguageId { get; set; }
        public int? RuntimeMinutes { get; set; }
        public string? ProgramPdfUrl { get; set; }
        public string? Notes { get; set; }
    }

    public class UpdateProductionDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public int SeasonId { get; set; }
        public int EventTypeId { get; set; }
        public int VenueId { get; set; }
        public int? OperaId { get; set; }
        public int? WrittenLanguageId { get; set; }
        public int? SungLanguageId { get; set; }
        public int? RuntimeMinutes { get; set; }
        public string? ProgramPdfUrl { get; set; }
        public string? Notes { get; set; }
    }
}

