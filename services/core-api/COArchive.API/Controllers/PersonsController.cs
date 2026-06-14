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

        // GET /api/persons/1
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var person = await _db.Persons
                .Where(p => p.Id == id)
                .Include(p => p.VoiceType)
                .Include(p => p.Nationalities)
                .FirstOrDefaultAsync();

            if (person == null) return NotFound();

            var appearances = await _db.Appearances
                .Where(a => a.PersonId == id)
                .Include(a => a.Production)
                    .ThenInclude(pr => pr.Season)
                .Include(a => a.Production)
                    .ThenInclude(pr => pr.EventType)
                .Include(a => a.ContributorType)
                .Include(a => a.Position)
                .Include(a => a.Character)
                .ToListAsync();

            var result = new
            {
                person.Id,
                person.FirstName,
                person.LastName,
                person.Email,
                person.IsActive,
                person.ProfileImageUrl,
                VoiceType = person.VoiceType?.Name,
                Nationalities = person.Nationalities
                    .Select(n => n.Name)
                    .ToList(),
                ContributorTypes = appearances
                    .Select(a => a.ContributorType.Name)
                    .Distinct()
                    .ToList(),
                Appearances = appearances
                    .Where(a => a.Production.EventType.TrackMilestones)
                    .GroupBy(a => a.Production)
                    .Select(g => new
                    {
                        ProductionId = g.Key.Id,
                        ProductionTitle = g.Key.Title,
                        Season = g.Key.Season.Label,
                        EventType = g.Key.EventType.Name,
                        Roles = g.Select(a => new
                        {
                            ContributorType = a.ContributorType.Name,
                            Character = a.Character?.Name,
                            Position = a.Position?.Name,
                        }).ToList()
                    })
                    .OrderByDescending(a => a.Season)
                    .ToList(),
                MainStageProductionCount = appearances
                    .Where(a => a.Production.EventType.TrackMilestones)
                    .Select(a => a.ProductionId)
                    .Distinct()
                    .Count(),
                PerformanceCount = appearances
                    .Where(a => a.ContributorType.TrackPerformances
                             && a.Production.EventType.TrackMilestones)
                    .Select(a => a.ProductionId)
                    .Distinct()
                    .Count(),
            };

            return Ok(result);
        }
    }
}