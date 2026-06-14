using COArchive.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace COArchive.API.Controllers
{
    //TODO add auth
    [ApiController]
    [Route("api/[controller]")]
    
    public class PersonsController : ControllerBase
    {
        private readonly ApplicationDbContext _db;

        public PersonsController(ApplicationDbContext db)
        {
            _db = db;
        }

        // GET /api/persons?search=noftall
        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] string? search)
        {
            if (search != null && search.Length > 100)
                return BadRequest("Search term too long.");

            var query = _db.Persons
                .Include(p => p.VoiceType)
                .Include(p => p.Appearances)
                    .ThenInclude(a => a.ContributorType)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
                query = query.Where(p =>
                    p.FirstName.Contains(search) ||
                    p.LastName.Contains(search));

            var results = await query
                .OrderBy(p => p.LastName)
                .ThenBy(p => p.FirstName)
                .Select(p => new
                {
                    p.Id,
                    p.FirstName,
                    p.LastName,
                    p.IsActive,
                    VoiceType = p.VoiceType != null ? p.VoiceType.Name : null,
                    ContributorTypes = p.Appearances
                        .Select(a => a.ContributorType.Name)
                        .Distinct()
                        .ToList()
                })
                .ToListAsync();

            return Ok(results);
        }
    }
}