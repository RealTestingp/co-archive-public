using COArchive.API.DataTransferObjects;
using COArchive.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
namespace COArchive.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReportsQueryController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        public ReportsQueryController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet("fields")]
        public IActionResult GetAvailableFields()
        {
            var fields = new
            {
                Season = true,
                ContributorType = true,
                Position = true,
                Character = true,
                Production = true,
                EventType = true,
                VoiceType = true,
                Nationality = true
            };
            return Ok(fields);
        }

        [HttpPost("query")]
        public async Task<ActionResult<ReportQueryResultDto>> Query(
            [FromBody] ReportQueryRequestDto request)
        {
            var query = _context.Appearances
                .Include(a => a.Person)
                    .ThenInclude(p => p.Nationalities)
                .Include(a => a.Person)
                    .ThenInclude(p => p.VoiceType)
                .Include(a => a.ContributorType)
                .Include(a => a.Position)
                .Include(a => a.Character)
                .Include(a => a.Production)
                    .ThenInclude(p => p.Season)
                .AsQueryable();

            if (request.SeasonId.HasValue)
                query = query.Where(a => a.Production.SeasonId == request.SeasonId);

            if (request.ContributorTypeIds?.Any() == true)
                query = query.Where(a =>
                    request.ContributorTypeIds.Contains(a.ContributorTypeId));

            if (request.PositionIds?.Any() == true)
                query = query.Where(a =>
                    a.PositionId.HasValue &&
                    request.PositionIds.Contains(a.PositionId.Value));

            if (request.CharacterIds?.Any() == true)
                query = query.Where(a =>
                    a.CharacterId.HasValue &&
                    request.CharacterIds.Contains(a.CharacterId.Value));

            if (request.ProductionId.HasValue)
                query = query.Where(a => a.ProductionId == request.ProductionId);

            if (request.EventTypeId.HasValue)
                query = query.Where(a => a.Production.EventTypeId == request.EventTypeId);

            if (request.VoiceTypeIds?.Any() == true)
                query = query.Where(a =>
                    a.Person.VoiceTypeId.HasValue &&
                    request.VoiceTypeIds.Contains(a.Person.VoiceTypeId.Value));

            if (request.NationalityIds?.Any() == true)
                query = query.Where(a =>
                    a.Person.Nationalities.Any(n => request.NationalityIds.Contains(n.Id)));

            if (request.Mode == ReportMode.Count)
            {
                var count = await query.CountAsync();
                return Ok(new ReportQueryResultDto
                {
                    Rows = new List<ReportRowDto>(),
                    TotalCount = count
                });
            }

            var appearances = await query.ToListAsync();
            var rows = appearances.Select(a => new ReportRowDto
            {
                FullName = a.Person.FullName,
                Email = a.Person.Email,
                ContributorType = a.ContributorType.Name,
                Position = a.Position?.Name,
                Character = a.Character?.Name,
                Production = a.Production.Title,
                Season = a.Production.Season.Label,
                Nationality = a.Person.Nationalities
                    .FirstOrDefault()?.Name,
                VoiceType = a.Person.VoiceType?.Name
            }).ToList();
            return Ok(new ReportQueryResultDto
            {
                Rows = rows,
                TotalCount = rows.Count
            });
        }
    }
}