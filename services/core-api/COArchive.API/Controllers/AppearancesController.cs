using COArchive.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

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
    }
}