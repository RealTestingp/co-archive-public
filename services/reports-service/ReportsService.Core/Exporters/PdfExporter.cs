using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using ReportsService.Core.Models;
using System.Reflection.Metadata;

namespace ReportsService.Core.Exporters
{
    public class PdfExporter : IReportExporter
    {
        public string Format => "pdf";

        public byte[] Export(ReportResult result)
        {
            QuestPDF.Settings.License = LicenseType.Community;

            var document = QuestPDF.Fluent.Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4.Landscape());
                    page.Margin(30);
                    page.DefaultTextStyle(x => x.FontSize(9));

                    page.Header().Column(col =>
                    {
                        col.Item().Text(result.ReportTitle)
                            .FontSize(16).Bold()
                            .FontColor(Color.FromHex("#1a3a5c"));

                        col.Item().Text(
                            $"Generated: {result.GeneratedAt:yyyy-MM-dd HH:mm} UTC")
                            .FontSize(8).FontColor(Colors.Grey.Medium);

                        col.Item().PaddingTop(4)
                            .LineHorizontal(1)
                            .LineColor(Color.FromHex("#1a3a5c"));
                    });

                    page.Content().PaddingTop(10).Table(table =>
                    {
                        table.ColumnsDefinition(cols =>
                        {
                            cols.RelativeColumn(2); // Full Name
                            cols.RelativeColumn(2); // Email
                            cols.RelativeColumn(1); // Contributor Type
                            cols.RelativeColumn(1); // Position
                            cols.RelativeColumn(1); // Character
                            cols.RelativeColumn(2); // Production
                            cols.RelativeColumn(1); // Season
                            cols.RelativeColumn(1); // Nationality
                            cols.RelativeColumn(1); // Voice Type
                        });

                        // Header
                        string[] headers = {
                            "Full Name", "Email", "Contributor Type",
                            "Position", "Character", "Production",
                            "Season", "Nationality", "Voice Type"
                        };

                        foreach (var header in headers)
                        {
                            table.Header(h =>
                            {
                                foreach (var hdr in headers)
                                {
                                    h.Cell().Background(Color.FromHex("#1a3a5c"))
                                        .Padding(4)
                                        .Text(hdr)
                                        .FontColor(Colors.White)
                                        .Bold();
                                }
                            });
                            break;
                        }

                        // Data rows
                        bool alternate = false;
                        foreach (var row in result.Rows)
                        {
                            var bg = alternate
                                ? Color.FromHex("#f2f2f2")
                                : Colors.White;
                            alternate = !alternate;

                            string[] cells = {
                                row.FullName,
                                row.Email ?? "",
                                row.ContributorType,
                                row.Position ?? "",
                                row.Character ?? "",
                                row.Production ?? "",
                                row.Season ?? "",
                                row.Nationality ?? "",
                                row.VoiceType ?? ""
                            };

                            foreach (var cell in cells)
                            {
                                table.Cell().Background(bg)
                                    .Padding(4)
                                    .Text(cell);
                            }
                        }
                    });

                    page.Footer().AlignCenter()
                        .Text(text =>
                        {
                            text.Span(
                                $"Total records: {result.TotalCount}   |   ");
                            text.Span("Page ");
                            text.CurrentPageNumber();
                            text.Span(" of ");
                            text.TotalPages();
                        });
                });
            });

            return document.GeneratePdf();
        }
    }
}