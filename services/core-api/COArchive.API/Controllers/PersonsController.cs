using COArchive.API.DataTransferObjects;
using COArchive.Data;
using COArchive.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;


namespace COArchive.API.Controllers
{
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

            var effectiveSearch = string.IsNullOrWhiteSpace(search) || search.Trim().Length < 2
                ? null
                : search.Trim();

            var query = _db.Persons
                .Include(p => p.VoiceType)
                .Include(p => p.Appearances)
                    .ThenInclude(a => a.ContributorType)
                .AsQueryable();

            if (effectiveSearch != null)
            {
                var terms = effectiveSearch
                    .Split(' ', StringSplitOptions.RemoveEmptyEntries);
                foreach (var term in terms)
                {
                    var t = term;
                    query = query.Where(p =>
                        p.FirstName.Contains(t) ||
                        p.LastName.Contains(t) ||
                        (p.MiddleName != null && p.MiddleName.Contains(t)));
                }
            }

            // Rank names that start with the search term first, then alphabetical
            var orderedQuery = effectiveSearch != null
                ? query
                    .OrderByDescending(p => p.FirstName.StartsWith(effectiveSearch) || p.LastName.StartsWith(effectiveSearch))
                    .ThenBy(p => p.LastName)
                    .ThenBy(p => p.FirstName)
                : query
                    .OrderBy(p => p.LastName)
                    .ThenBy(p => p.FirstName);

            var results = await orderedQuery
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
                .Include(a => a.Production)
                    .ThenInclude(pr => pr.Performances)
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
                Nationalities = person.Nationalities?
                .Select(n => n.Name)
                .ToList() ?? new List<string>(),
                ContributorTypes = appearances
                .Select(a => a.ContributorType.Name)
                .Distinct()
                .ToList() ?? new List<string>(),
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
                    .SelectMany(a => a.Production.Performances)
                    .DistinctBy(perf => perf.Id)
                    .Count(),
            };

            return Ok(result);
        }

        // POST /api/persons
        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Create([FromBody] CreatePersonDto dto)
        {
            var person = new Person
            {
                FirstName = dto.FirstName,
                LastName = dto.LastName,
                MiddleName = dto.MiddleName,
                Email = dto.Email,
                VoiceTypeId = dto.VoiceTypeId,
                ProfileImageUrl = dto.ProfileImageUrl,
                IsActive = dto.IsActive,
            };

            // Handle nationalities — many-to-many
            if (dto.NationalityIds.Any())
            {
                var nationalities = await _db.Nationalities
                    .Where(n => dto.NationalityIds.Contains(n.Id))
                    .ToListAsync();
                person.Nationalities = nationalities;
            }

            try
            {
                _db.Persons.Add(person);
                await _db.SaveChangesAsync();
                return CreatedAtAction(nameof(GetById), new { id = person.Id }, new { person.Id });
            }
            catch (DbUpdateException)
            {
                return StatusCode(500, "An error occurred saving the person.");
            }
        }

        // DELETE /api/persons/1
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(int id)
        {
            var person = await _db.Persons.FindAsync(id);
            if (person == null) return NotFound();

            // Check for linked appearances before attempting delete
            var hasAppearances = await _db.Appearances.AnyAsync(a => a.PersonId == id);
            if (hasAppearances)
                return Conflict("This person has appearance records and cannot be deleted.");

            try
            {
                _db.Persons.Remove(person);
                await _db.SaveChangesAsync();
                return NoContent();
            }
            catch (DbUpdateException)
            {
                return StatusCode(500, "An error occurred deleting the person.");
            }
        }

        // PUT /api/persons/5
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdatePersonDto dto)
        {
            if (id != dto.Id) return BadRequest("ID mismatch.");

            var existing = await _db.Persons
                .Include(p => p.Nationalities)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (existing == null) return NotFound();

            existing.FirstName = dto.FirstName;
            existing.LastName = dto.LastName;
            existing.MiddleName = dto.MiddleName;
            existing.Email = dto.Email;
            existing.VoiceTypeId = dto.VoiceTypeId;
            existing.ProfileImageUrl = dto.ProfileImageUrl;
            existing.IsActive = dto.IsActive;

            // Update nationalities — clear existing and replace
            existing.Nationalities.Clear();
            if (dto.NationalityIds.Any())
            {
                var nationalities = await _db.Nationalities
                    .Where(n => dto.NationalityIds.Contains(n.Id))
                    .ToListAsync();
                existing.Nationalities = nationalities;
            }

            try
            {
                await _db.SaveChangesAsync();
                return NoContent();
            }
            catch (DbUpdateException)
            {
                return StatusCode(500, "An error occurred updating the person.");
            }
        }
    }
}