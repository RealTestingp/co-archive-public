using Microsoft.AspNetCore.Mvc;
using ReportsService.Core.Models;
using ReportsService.Core.Services;

namespace ReportsService.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReportsController : ControllerBase
    {
        private readonly IReportGenerator _reportGenerator;

        public ReportsController(IReportGenerator reportGenerator)
        {
            _reportGenerator = reportGenerator;
        }

        [HttpPost("generate")]
        public async Task<IActionResult> Generate([FromBody] ReportRequest request)
        {
            var fileBytes = await _reportGenerator.GenerateAsync(request);

            var (contentType, fileName) = request.ExportFormat.ToLower() switch
            {
                "pdf" => ("application/pdf",
                    $"report_{DateTime.UtcNow:yyyyMMdd_HHmm}.pdf"),
                _ => ("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    $"report_{DateTime.UtcNow:yyyyMMdd_HHmm}.xlsx")
            };

            return File(fileBytes, contentType, fileName);
        }
    }
}