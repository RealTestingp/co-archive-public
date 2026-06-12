using COArchive.Data;
using COArchive.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using COArchive.API.DataTransferObjects;

namespace COArchive.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProductionsController : ControllerBase
    {
        private readonly ApplicationDbContext _db;

        public ProductionsController(ApplicationDbContext db)
        {
            _db = db;
        }

        // GET /api/productions?search=butterfly - search terms
        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] string? search)
        {
            var query = _db.Productions
                .Include(e => e.Season)
                .Include(e => e.EventType)
                .Include(e => e.Venue)
                .Include(e => e.Opera)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
                query = query.Where(e => e.Title.Contains(search));

            var results = await query
                .OrderByDescending(e => e.Season.Label)
                .Select(e => new
                {
                    e.Id,
                    e.Title,
                    Season = e.Season.Label,
                    EventType = e.EventType.Name,
                    Opera = e.Opera != null ? e.Opera.Title : null,
                    Venue = e.Venue.Name,
                })
                .ToListAsync();

            return Ok(results);
        }

        // GET /api/productions/1 - specific production
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var production = await _db.Productions
                .Include(e => e.Season)
                .Include(e => e.EventType)
                .Include(e => e.Venue)
                .Include(e => e.Opera)
                    .ThenInclude(o => o.Composers)
                .Include(e => e.Opera)
                    .ThenInclude(o => o.Librettists)
                .Include(e => e.WrittenLanguage)
                .Include(e => e.SungLanguage)
                .Include(e => e.Performances)
                .FirstOrDefaultAsync(e => e.Id == id);

            if (production == null) return NotFound();

            var appearances = await _db.Appearances
                .Where(a => a.ProductionId == id)
                .Include(a => a.Person)
                .Include(a => a.ContributorType)
                .Include(a => a.Position)
                .Include(a => a.Character)
                .ToListAsync();

            var result = new
            {
                production.Id,
                production.Title,
                production.RuntimeMinutes,
                production.ProgramPdfUrl,
                production.Notes,
                Season = production.Season.Label,
                EventType = production.EventType.Name,
                Venue = production.Venue.Name,
                Opera = production.Opera?.Title,
                Composers = production.Opera?.Composers
                    .Select(c => c.Name).ToList() ?? new List<string>(),
                Librettists = production.Opera?.Librettists
                    .Select(l => l.Name).ToList() ?? new List<string>(),
                WrittenLanguage = production.WrittenLanguage?.Name,
                SungLanguage = production.SungLanguage?.Name,
                Performances = production.Performances
                    .OrderBy(p => p.Date)
                    .Select(p => new { p.Id, p.Date })
                    .ToList(),
                Cast = appearances
                    .Where(a => a.ContributorType.Name == "Artist"
                             || a.ContributorType.Name == "McPhee")
                    .Select(a => new
                    {
                        a.Person.FirstName,
                        a.Person.LastName,
                        ContributorType = a.ContributorType.Name,
                        Character = a.Character?.Name,
                        Position = a.Position?.Name,
                    })
                    .OrderBy(a => a.LastName)
                    .ToList(),
                Creative = appearances
                    .Where(a => a.ContributorType.Name == "Creative")
                    .Select(a => new
                    {
                        a.Person.FirstName,
                        a.Person.LastName,
                        Position = a.Position?.Name,
                    })
                    .OrderBy(a => a.Position)
                    .ToList(),
                Crew = appearances
                    .Where(a => a.ContributorType.Name == "Crew")
                    .Select(a => new
                    {
                        a.Person.FirstName,
                        a.Person.LastName,
                        Position = a.Position?.Name,
                    })
                    .OrderBy(a => a.Position)
                    .ToList(),
                Orchestra = appearances
                    .Where(a => a.ContributorType.Name == "Orchestra")
                    .Select(a => new
                    {
                        a.Person.FirstName,
                        a.Person.LastName,
                    })
                    .OrderBy(a => a.LastName)
                    .ToList(),
                Chorus = appearances
                    .Where(a => a.ContributorType.Name == "Chorus")
                    .Select(a => new
                    {
                        a.Person.FirstName,
                        a.Person.LastName,
                    })
                    .OrderBy(a => a.LastName)
                    .ToList(),
            };

            return Ok(result);
        }

        // TODO: Add [Authorize(Roles = "Admin")] once Entra ID is configured
        // PUT /api/productions/5
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateProductionDto dto)
        {
            if (id != dto.Id) return BadRequest("ID mismatch.");

            var existing = await _db.Productions.FindAsync(id);
            if (existing == null) return NotFound();

            existing.Title = dto.Title;
            existing.SeasonId = dto.SeasonId;
            existing.EventTypeId = dto.EventTypeId;
            existing.VenueId = dto.VenueId;
            existing.OperaId = dto.OperaId;
            existing.WrittenLanguageId = dto.WrittenLanguageId;
            existing.SungLanguageId = dto.SungLanguageId;
            existing.RuntimeMinutes = dto.RuntimeMinutes;
            existing.ProgramPdfUrl = dto.ProgramPdfUrl;
            existing.Notes = dto.Notes;

            await _db.SaveChangesAsync();
            return NoContent();
        }

        // TODO: Add [Authorize(Roles = "Admin")] once Entra ID is configured
        // POST /api/productions
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateProductionDto dto)
        {
            var production = new Production
            {
                Title = dto.Title,
                SeasonId = dto.SeasonId,
                EventTypeId = dto.EventTypeId,
                VenueId = dto.VenueId,
                OperaId = dto.OperaId,
                WrittenLanguageId = dto.WrittenLanguageId,
                SungLanguageId = dto.SungLanguageId,
                RuntimeMinutes = dto.RuntimeMinutes,
                ProgramPdfUrl = dto.ProgramPdfUrl,
                Notes = dto.Notes,
            };

            _db.Productions.Add(production);
            await _db.SaveChangesAsync();
            return CreatedAtAction(nameof(GetById), new { id = production.Id }, production);
        }

        // TODO: Add [Authorize(Roles = "Admin")] once Entra ID is configured
        // DELETE /api/productions/1
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var production = await _db.Productions.FindAsync(id);
            if (production == null) return NotFound();

            _db.Productions.Remove(production);
            await _db.SaveChangesAsync();
            return NoContent();
        }
    }
}