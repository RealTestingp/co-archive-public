using COArchive.Data;
using COArchive.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;


using COArchive.API.DataTransferObjects;

namespace COArchive.API.Controllers
{

    //TODO add auth
    [ApiController]
    [Route("api/[controller]")]
    public class AppearancesController : ControllerBase
    {
        private readonly ApplicationDbContext _db;

        public AppearancesController(ApplicationDbContext db)
        {
            _db = db;
        }

        // GET /api/appearances?productionId=1 - all appearances for one production for production page
        // GET /api/appearances?personId=10 - all appearances for one person for person profile
        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] int? productionId, [FromQuery] int? personId)
        {
            var query = _db.Appearances
                .Include(a => a.Person)
                .Include(a => a.Production)
                .Include(a => a.ContributorType)
                .Include(a => a.Position)
                .Include(a => a.Character)
                .AsQueryable();

            if (productionId.HasValue)
                query = query.Where(a => a.ProductionId == productionId);

            if (personId.HasValue)
                query = query.Where(a => a.PersonId == personId);

            var results = await query
                .Select(a => new
                {
                    a.Id,
                    Person = new { a.Person.FirstName, a.Person.LastName },
                    Production = a.Production.Title,
                    ContributorType = a.ContributorType.Name,
                    Position = a.Position != null ? a.Position.Name : null,
                    Character = a.Character != null ? a.Character.Name : null,
                })
                .ToListAsync();

            return Ok(results);
        }

        // POST /api/appearances
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateAppearanceDto dto)
        {
            // Validate person exists
            var person = await _db.Persons.FindAsync(dto.PersonId);
            if (person == null) return BadRequest("Person not found.");

            // Validate production exists
            var production = await _db.Productions.FindAsync(dto.ProductionId);
            if (production == null) return BadRequest("Production not found.");

            // Validate contributor type exists
            var contributorType = await _db.ContributorTypes.FindAsync(dto.ContributorTypeId);
            if (contributorType == null) return BadRequest("Contributor type not found.");

            // Validate position exists if provided
            if (dto.PositionId.HasValue)
            {
                var position = await _db.Positions.FindAsync(dto.PositionId.Value);
                if (position == null) return BadRequest("Position not found.");
            }

            // Validate character exists if provided
            if (dto.CharacterId.HasValue)
            {
                var character = await _db.Characters.FindAsync(dto.CharacterId.Value);
                if (character == null) return BadRequest("Character not found.");
            }

            // Check for duplicate
            var duplicate = await _db.Appearances
                .AnyAsync(a =>
                    a.PersonId == dto.PersonId &&
                    a.ProductionId == dto.ProductionId &&
                    a.ContributorTypeId == dto.ContributorTypeId &&
                    a.CharacterId == dto.CharacterId &&
                    a.PositionId == dto.PositionId);

            if (duplicate) return Conflict("This appearance already exists.");

            var appearance = new Appearance
            {
                PersonId = dto.PersonId,
                ProductionId = dto.ProductionId,
                ContributorTypeId = dto.ContributorTypeId,
                PositionId = dto.PositionId,
                CharacterId = dto.CharacterId,
            };

            _db.Appearances.Add(appearance);
            await _db.SaveChangesAsync();
            return CreatedAtAction(nameof(GetAll), new { personId = dto.PersonId }, new { appearance.Id });
        }

        // DELETE /api/appearances/1
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var appearance = await _db.Appearances.FindAsync(id);
            if (appearance == null) return NotFound();

            _db.Appearances.Remove(appearance);
            await _db.SaveChangesAsync();
            return NoContent();
        }
    }
}