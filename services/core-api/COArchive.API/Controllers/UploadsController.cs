using COArchive.API.Services;
using COArchive.Data;
using COArchive.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;

namespace COArchive.API.Controllers
{
    [ApiController]
    [Route("api/uploads")]
    [Authorize]
    public class UploadsController : ControllerBase
    {
        private static readonly string[] AllowedImageTypes = { "image/jpeg", "image/png", "image/webp" };
        private const long MaxImageSizeBytes = 5 * 1024 * 1024; // 5MB

        private const string AllowedPdfType = "application/pdf";
        private const long MaxPdfSizeBytes = 50 * 1024 * 1024; // 50MB

        private readonly BlobStorageService _blobStorageService;
        private readonly ApplicationDbContext _context;

        public UploadsController(BlobStorageService blobStorageService, ApplicationDbContext context)
        {
            _blobStorageService = blobStorageService;
            _context = context;
        }

        [HttpPost("profile-image/{personId}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UploadProfileImage(int personId, IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest("No file was uploaded.");

            if (!AllowedImageTypes.Contains(file.ContentType))
                return BadRequest("Invalid file type. Only JPEG, PNG, and WebP are allowed.");

            if (file.Length > MaxImageSizeBytes)
                return BadRequest("File exceeds the 5MB size limit.");

            var person = await _context.Persons.FindAsync(personId);
            if (person == null)
                return NotFound($"Person with id {personId} not found.");

            using var stream = file.OpenReadStream();
            var url = await _blobStorageService.UploadProfileImageAsync(stream, file.FileName, file.ContentType);

            person.ProfileImageUrl = url;
            await _context.SaveChangesAsync();

            return Ok(new { url });
        }

        [HttpPost("program-pdf/{productionId}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UploadProgramPdf(int productionId, IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest("No file was uploaded.");

            if (file.ContentType != AllowedPdfType)
                return BadRequest("Invalid file type. Only PDF is allowed.");

            if (file.Length > MaxPdfSizeBytes)
                return BadRequest("File exceeds the 50MB size limit.");

            var production = await _context.Productions.FindAsync(productionId);
            if (production == null)
                return NotFound($"Production with id {productionId} not found.");

            using var stream = file.OpenReadStream();
            var url = await _blobStorageService.UploadProgramPdfAsync(stream, file.FileName, file.ContentType);

            production.ProgramPdfUrl = url;
            await _context.SaveChangesAsync();

            return Ok(new { url });
        }
    }
}