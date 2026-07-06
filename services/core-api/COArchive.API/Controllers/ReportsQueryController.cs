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

            if (request.ContributorTypeId.HasValue)
                query = query.Where(a => a.ContributorTypeId == request.ContributorTypeId);

            if (request.PositionId.HasValue)
                query = query.Where(a => a.PositionId == request.PositionId);

            if (request.CharacterId.HasValue)
                query = query.Where(a => a.CharacterId == request.CharacterId);

            if (request.ProductionId.HasValue)
                query = query.Where(a => a.ProductionId == request.ProductionId);

            if (request.EventTypeId.HasValue)
                query = query.Where(a => a.Production.EventTypeId == request.EventTypeId);

            if (request.VoiceTypeId.HasValue)
                query = query.Where(a => a.Person.VoiceTypeId == request.VoiceTypeId);

            if (request.NationalityId.HasValue)
                query = query.Where(a =>
                    a.Person.Nationalities.Any(n => n.Id == request.NationalityId));

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