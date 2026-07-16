using COArchive.API.DataTransferObjects;
using COArchive.Data;
using COArchive.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace COArchive.API.Controllers
{

    //TODO add auth in this controller
    [ApiController]
    [Route("api/[controller]")]
    public class SeasonsController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        public SeasonsController(ApplicationDbContext db) => _db = db;

        [HttpGet]
        public async Task<IActionResult> GetAll() =>
            Ok(await _db.Seasons
                .OrderByDescending(s => s.Label)
                .Select(s => new { s.Id, s.Label })
                .ToListAsync());

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateSeasonDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Label))
                return BadRequest("Label (e.g. 2025-2026) is required.");

            if (await _db.Seasons.AnyAsync(s => s.Label == dto.Label))
                return Conflict("A season with this label already exists.");

            var season = new Season { Label = dto.Label };
            _db.Seasons.Add(season);
            await _db.SaveChangesAsync();
            return CreatedAtAction(nameof(GetAll), new { id = season.Id }, new { season.Id, season.Label });
        }
    }

    [ApiController]
    [Route("api/[controller]")]
    public class VenuesController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        public VenuesController(ApplicationDbContext db) => _db = db;

        [HttpGet]
        public async Task<IActionResult> GetAll() =>
        Ok(await _db.Venues
        .OrderBy(v => v.Name)
        .Select(v => new
        {
            v.Id,
            v.Name,
            v.StreetAddress,
            v.City,
            v.Province,
            v.PostalCode,
            v.Country
        })
        .ToListAsync());

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateVenueDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Name))
                return BadRequest("Name is required.");

            if (await _db.Venues.AnyAsync(v => v.Name == dto.Name))
                return Conflict("A venue with this name already exists.");

            var venue = new Venue
            {
                Name = dto.Name,
                StreetAddress = dto.StreetAddress,
                City = dto.City,
                Province = dto.Province,
                PostalCode = dto.PostalCode,
                Country = dto.Country,
            };

            _db.Venues.Add(venue);
            await _db.SaveChangesAsync();
            return CreatedAtAction(nameof(GetAll), new { id = venue.Id }, new { venue.Id, venue.Name });
        }

    }

    [ApiController]
    [Route("api/[controller]")]
    public class EventTypesController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        public EventTypesController(ApplicationDbContext db) => _db = db;

        [HttpGet]
        public async Task<IActionResult> GetAll() =>
            Ok(await _db.EventTypes
                .OrderBy(e => e.Name)
                .Select(e => new { e.Id, e.Name, e.TrackMilestones })
                .ToListAsync());
    }

    [ApiController]
    [Route("api/[controller]")]
    public class VoiceTypesController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        public VoiceTypesController(ApplicationDbContext db) => _db = db;

        [HttpGet]
        public async Task<IActionResult> GetAll() =>
            Ok(await _db.VoiceTypes
                .OrderBy(v => v.Name)
                .Select(v => new { v.Id, v.Name })
                .ToListAsync());
    }

    [ApiController]
    [Route("api/[controller]")]
    public class NationalitiesController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        public NationalitiesController(ApplicationDbContext db) => _db = db;

        [HttpGet]
        public async Task<IActionResult> GetAll() =>
            Ok(await _db.Nationalities
                .OrderBy(n => n.Name)
                .Select(n => new { n.Id, n.Name })
                .ToListAsync());
    }

    [ApiController]
    [Route("api/[controller]")]
    public class ContributorTypesController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        public ContributorTypesController(ApplicationDbContext db) => _db = db;

        [HttpGet]
        public async Task<IActionResult> GetAll() =>
            Ok(await _db.ContributorTypes
                .OrderBy(c => c.Name)
                .Select(c => new { c.Id, c.Name, c.TrackPerformances })
                .ToListAsync());
    }

    [ApiController]
    [Route("api/[controller]")]
    public class OperasController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        
        public OperasController(ApplicationDbContext db) => _db = db;

        [HttpGet]
        public async Task<IActionResult> GetAll() =>
            Ok(await _db.Operas
                .OrderBy(o => o.Title)
                .Select(o => new { o.Id, o.Title })
                .ToListAsync());

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateOperaDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Title))
                return BadRequest("Title is required.");

            if (await _db.Operas.AnyAsync(o => o.Title == dto.Title))
                return Conflict("An opera with this title already exists.");

            var opera = new Opera { Title = dto.Title };

            if (dto.ComposerIds.Any())
            {
                var composers = await _db.Composers
                    .Where(c => dto.ComposerIds.Contains(c.Id))
                    .ToListAsync();
                opera.Composers = composers;
            }

            if (dto.LibrettistIds.Any())
            {
                var librettists = await _db.Librettists
                    .Where(l => dto.LibrettistIds.Contains(l.Id))
                    .ToListAsync();
                opera.Librettists = librettists;
            }

            _db.Operas.Add(opera);
            await _db.SaveChangesAsync();
            return CreatedAtAction(nameof(GetAll), new { id = opera.Id }, new { opera.Id, opera.Title });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateOperaDto dto)
        {
            if (id != dto.Id) return BadRequest("ID mismatch.");

            var existing = await _db.Operas
                .Include(o => o.Composers)
                .Include(o => o.Librettists)
                .FirstOrDefaultAsync(o => o.Id == id);

            if (existing == null) return NotFound();

            // Check title isn't already taken by another opera
            if (await _db.Operas.AnyAsync(o => o.Title == dto.Title && o.Id != id))
                return Conflict("An opera with this title already exists.");

            existing.Title = dto.Title;

            // Update composers — clear and replace
            existing.Composers.Clear();
            if (dto.ComposerIds.Any())
            {
                var composers = await _db.Composers
                    .Where(c => dto.ComposerIds.Contains(c.Id))
                    .ToListAsync();
                existing.Composers = composers;
            }

            // Update librettists — clear and replace
            existing.Librettists.Clear();
            if (dto.LibrettistIds.Any())
            {
                var librettists = await _db.Librettists
                    .Where(l => dto.LibrettistIds.Contains(l.Id))
                    .ToListAsync();
                existing.Librettists = librettists;
            }

            await _db.SaveChangesAsync();
            return NoContent();
        }
    }

    [ApiController]
    [Route("api/[controller]")]
    public class LanguagesController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        public LanguagesController(ApplicationDbContext db) => _db = db;

        [HttpGet]
        public async Task<IActionResult> GetAll() =>
            Ok(await _db.Languages
                .OrderBy(l => l.Name)
                .Select(l => new { l.Id, l.Name })
                .ToListAsync());

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateLanguageDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Name))
                return BadRequest("Name is required.");

            if (await _db.Languages.AnyAsync(l => l.Name == dto.Name))
                return Conflict("A language with this name already exists.");

            var language = new Language { Name = dto.Name };
            _db.Languages.Add(language);
            await _db.SaveChangesAsync();
            return CreatedAtAction(nameof(GetAll), new { id = language.Id }, new { language.Id, language.Name });
        }
    }

    [ApiController]
    [Route("api/[controller]")]
    public class PositionsController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        public PositionsController(ApplicationDbContext db) => _db = db;

        // GET /api/positions?contributorTypeId=3
        // Aurora can filter by contributor type to show relevant positions in dropdown
        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] int? contributorTypeId)
        {
            var query = _db.Positions.AsQueryable();

            if (contributorTypeId.HasValue)
                query = query.Where(p => p.ContributorTypeId == contributorTypeId);

            return Ok(await query
                .OrderBy(p => p.Name)
                .Select(p => new { p.Id, p.Name, p.ContributorTypeId })
                .ToListAsync());
        }
    }
}