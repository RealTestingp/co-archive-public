namespace COArchive.API.DataTransferObjects
{
    public class CreateProductionDto
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

        // All event types except for Tour = multiple specific dates
        public List<DateTime>? PerformanceDates { get; set; }

        // Tour - store a range (single row of data, start date and end date)
        public DateTime? TourStartDate { get; set; }
        public DateTime? TourEndDate { get; set; }

        public List<CreateAppearanceDto>? Appearances { get; set; }
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

        // All event types except for Tour = multiple specific dates
        public List<DateTime>? PerformanceDates { get; set; }

        // Tour - store a range (single row of data, start date and end date)
        public DateTime? TourStartDate { get; set; }
        public DateTime? TourEndDate { get; set; }
    }
}