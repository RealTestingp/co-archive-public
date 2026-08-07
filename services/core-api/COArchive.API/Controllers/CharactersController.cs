using COArchive.API.DataTransferObjects;
using COArchive.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace COArchive.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class CharactersController : ControllerBase
    {
        private readonly ApplicationDbContext _db;

        public CharactersController(ApplicationDbContext db)
        {
            _db = db;
        }

        // GET /api/characters?search=figaro
        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] string? search, [FromQuery] int? operaId)
        {
            if (search != null && search.Length > 100)
                return BadRequest("Search term too long.");

            var effectiveSearch = string.IsNullOrWhiteSpace(search) || search.Trim().Length < 2
                ? null
                : search.Trim();

            var query = _db.Characters
                .Include(c => c.Opera)
                .AsQueryable();

            if (effectiveSearch != null)
                query = query.Where(c => c.Name.Contains(effectiveSearch));

            if (operaId.HasValue)
                query = query.Where(c => c.OperaId == operaId);

            var orderedQuery = effectiveSearch != null
                ? query
                    .OrderByDescending(c => c.Name.StartsWith(effectiveSearch))
                    .ThenBy(c => c.Name)
                : query.OrderBy(c => c.Name);

            var results = await orderedQuery
                .Select(c => new
                {
                    c.Id,
                    c.Name,
                    Opera = c.Opera.Title,
                    OperaId = c.Opera.Id,
                })
                .ToListAsync();

            return Ok(results);
        }

        // GET /api/characters/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var character = await _db.Characters
                .Include(c => c.Opera)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (character == null) return NotFound();

            var appearances = await _db.Appearances
                .Where(a => a.CharacterId == id)
                .Include(a => a.Person)
                .Include(a => a.Production)
                    .ThenInclude(pr => pr.Season)
                .Include(a => a.ContributorType)
                .ToListAsync();

            var result = new
            {
                character.Id,
                character.Name,
                Opera = character.Opera.Title,
                OperaId = character.OperaId,
                ProductionHistory = appearances
                    .GroupBy(a => a.Production)
                    .Select(g => new
                    {
                        ProductionId = g.Key.Id,
                        ProductionTitle = g.Key.Title,
                        Season = g.Key.Season.Label,
                        Performers = g.Select(a => new
                        {
                            PersonId = a.Person.Id,
                            a.Person.FirstName,
                            a.Person.LastName,
                            ContributorType = a.ContributorType.Name,
                        }).ToList()
                    })
                    .OrderByDescending(p => p.Season)
                    .ToList()
            };

            return Ok(result);
        }

        // POST /api/characters
        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Create([FromBody] CreateCharacterDto dto)
        {
            var character = new COArchive.Models.Character
            {
                Name = dto.Name,
                OperaId = dto.OperaId,
            };

            try
            {
                _db.Characters.Add(character);
                await _db.SaveChangesAsync();
                return CreatedAtAction(nameof(GetById), new { id = character.Id }, new { character.Id });
            }
            catch (DbUpdateException)
            {
                return StatusCode(500, "An error occurred saving the character.");
            }
        }

        // PUT /api/characters/1
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateCharacterDto dto)
        {
            if (id != dto.Id) return BadRequest("ID mismatch.");

            var existing = await _db.Characters.FindAsync(id);
            if (existing == null) return NotFound();

            existing.Name = dto.Name;
            existing.OperaId = dto.OperaId;

            try
            {
                await _db.SaveChangesAsync();
                return NoContent();
            }
            catch (DbUpdateException)
            {
                return StatusCode(500, "An error occurred updating the character.");
            }
        }



        // DELETE /api/characters/5
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(int id)
        {
            var character = await _db.Characters.FindAsync(id);
            if (character == null) return NotFound();

            try
            {
                _db.Characters.Remove(character);
                await _db.SaveChangesAsync();
                return NoContent();
            }
            catch (DbUpdateException)
            {
                return StatusCode(500, "An error occurred deleting the character. Consider checking for any linked appearances.");
            }
        }
    }
}