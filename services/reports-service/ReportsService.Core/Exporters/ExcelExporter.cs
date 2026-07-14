using ClosedXML.Excel;
using ReportsService.Core.Models;
using System.Drawing;

namespace ReportsService.Core.Exporters
{
    public class ExcelExporter : IReportExporter
    {
        public string Format => "xlsx";

        public byte[] Export(ReportResult result)
        {
            using var workbook = new XLWorkbook();
            var sheet = workbook.Worksheets.Add("Report");

            // Title row
            sheet.Cell(1, 1).Value = result.ReportTitle;
            sheet.Cell(1, 1).Style.Font.Bold = true;
            sheet.Cell(1, 1).Style.Font.FontSize = 14;
            sheet.Range(1, 1, 1, 9).Merge();

            // Generated date row
            sheet.Cell(2, 1).Value =
                $"Generated: {result.GeneratedAt:yyyy-MM-dd HH:mm} UTC";
            sheet.Range(2, 1, 2, 9).Merge();

            // Header row
            int headerRow = 4;
            string[] headers = {
                "Full Name", "Email", "Contributor Type",
                "Position", "Character", "Production",
                "Season", "Nationality", "Voice Type"
            };

            for (int i = 0; i < headers.Length; i++)
            {
                var cell = sheet.Cell(headerRow, i + 1);
                cell.Value = headers[i];
                cell.Style.Font.Bold = true;
                cell.Style.Fill.BackgroundColor =
                    XLColor.FromHtml("#1a3a5c");
                cell.Style.Font.FontColor = XLColor.White;
            }

            // Data rows
            int dataRow = headerRow + 1;
            foreach (var row in result.Rows)
            {
                sheet.Cell(dataRow, 1).Value = row.FullName;
                sheet.Cell(dataRow, 2).Value = row.Email ?? "";
                sheet.Cell(dataRow, 3).Value = row.ContributorType;
                sheet.Cell(dataRow, 4).Value = row.Position ?? "";
                sheet.Cell(dataRow, 5).Value = row.Character ?? "";
                sheet.Cell(dataRow, 6).Value = row.Production ?? "";
                sheet.Cell(dataRow, 7).Value = row.Season ?? "";
                sheet.Cell(dataRow, 8).Value = row.Nationality ?? "";
                sheet.Cell(dataRow, 9).Value = row.VoiceType ?? "";
                dataRow++;
            }

            // Total count row
            int totalRow = dataRow + 1;
            sheet.Cell(totalRow, 1).Value =
                $"Total: {result.TotalCount} record(s)";
            sheet.Cell(totalRow, 1).Style.Font.Bold = true;
            sheet.Range(totalRow, 1, totalRow, 9).Merge();

            // Auto-fit columns
            sheet.Columns().AdjustToContents();

            using var stream = new MemoryStream();
            workbook.SaveAs(stream);
            return stream.ToArray();
        }
    }
}