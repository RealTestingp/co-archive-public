using COArchive.Data;
using COArchive.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;


using COArchive.API.DataTransferObjects;
using Microsoft.AspNetCore.Authorization;

namespace COArchive.API.Controllers
{
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
        [Authorize(Roles = "Admin")]
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

            try
            {
                _db.Appearances.Add(appearance);
                await _db.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                return StatusCode(500, "An error occurred saving the appearance.");
            }

            // Check for milestones
            await CheckMilestoneAsync(dto.PersonId, dto.ProductionId);

            return CreatedAtAction(nameof(GetAll), new { personId = dto.PersonId }, new { appearance.Id });
        }

        // DELETE /api/appearances/1
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(int id)
        {
            var appearance = await _db.Appearances.FindAsync(id);
            if (appearance == null) return NotFound();

            try
            {
                _db.Appearances.Remove(appearance);
                await _db.SaveChangesAsync();
                return NoContent();
            }
            catch (DbUpdateException)
            {
                return StatusCode(500, "An error occurred deleting the appearance.");
            }
        }

        // Milestone Notifications

        private async Task CheckMilestoneAsync(int personId, int productionId)
        {
            var person = await _db.Persons
                .Include(p => p.Appearances)
                    .ThenInclude(a => a.ContributorType)
                .FirstOrDefaultAsync(p => p.Id == personId);

            if (person == null) return;

            // Check if the production has a performance within the next 7 days
            var upcomingPerformance = await _db.Performances
                .Where(p => p.ProductionId == productionId
                         && p.Date >= DateTime.UtcNow
                         && p.Date <= DateTime.UtcNow.AddDays(7))
                .AnyAsync();

            if (!upcomingPerformance) return;

            // MainStage Production Milestone
            var mainStageProductionCount = await _db.Appearances
                .Where(a => a.PersonId == personId
                         && a.Production.EventType.TrackMilestones == true)
                .Select(a => a.ProductionId)
                .Distinct()
                .CountAsync();

            if (mainStageProductionCount > 0 && mainStageProductionCount % 5 == 0)
            {
                var exists = await _db.Notifications
                    .AnyAsync(n => n.PersonId == personId
                                && n.MilestoneCount == mainStageProductionCount
                                && n.MilestoneType == "Production");

                if (!exists)
                {
                    _db.Notifications.Add(new Notification
                    {
                        PersonId = personId,
                        MilestoneType = "Production",
                        MilestoneCount = mainStageProductionCount,
                        Message = $"{person.FirstName} {person.LastName}'s {mainStageProductionCount}{GetOrdinalSuffix(mainStageProductionCount)} MainStage production is coming up this week — consider arranging a card or gift!",
                        CreatedAt = DateTime.UtcNow,
                        IsRead = false,
                        EmailSent = false,
                    });
                    await _db.SaveChangesAsync();
                }
            }

            // Performance Milestone (equity members only)
            // Only check if this person's contributor type tracks performances
            var tracksPerformances = await _db.Appearances
                .Where(a => a.PersonId == personId
                         && a.ContributorType.TrackPerformances == true)
                .AnyAsync();

            if (tracksPerformances)
            {
                // Count total performances across all tracked productions
                var performanceCount = await _db.Appearances
                    .Where(a => a.PersonId == personId
                             && a.ContributorType.TrackPerformances == true
                             && a.Production.EventType.TrackMilestones == true)
                    .Join(_db.Performances,
                        a => a.ProductionId,
                        p => p.ProductionId,
                        (a, p) => p)
                    .CountAsync();

                if (performanceCount > 0 && performanceCount % 5 == 0)
                {
                    var exists = await _db.Notifications
                        .AnyAsync(n => n.PersonId == personId
                                    && n.MilestoneCount == performanceCount
                                    && n.MilestoneType == "Performance");

                    if (!exists)
                    {
                        _db.Notifications.Add(new Notification
                        {
                            PersonId = personId,
                            MilestoneType = "Performance",
                            MilestoneCount = performanceCount,
                            Message = $"{person.FirstName} {person.LastName}'s {performanceCount}{GetOrdinalSuffix(performanceCount)} performance is coming up this week — consider arranging a card or gift!",
                            CreatedAt = DateTime.UtcNow,
                            IsRead = false,
                            EmailSent = false,
                        });
                        await _db.SaveChangesAsync();
                    }
                }
            }
        }

        // Helper — turns 5 into "5th", 10 into "10th" etc.
        private static string GetOrdinalSuffix(int number)
        {
            return (number % 100) switch
            {
                11 or 12 or 13 => "th",
                _ => (number % 10) switch
                {
                    1 => "st",
                    2 => "nd",
                    3 => "rd",
                    _ => "th"
                }
            };
        }
    }
}