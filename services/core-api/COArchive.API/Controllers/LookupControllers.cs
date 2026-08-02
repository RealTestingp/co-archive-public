using COArchive.API.DataTransferObjects;
using COArchive.Data;
using COArchive.Models;
using Microsoft.AspNetCore.Authorization;
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
            
            try
            {
                _db.Seasons.Add(season);
                await _db.SaveChangesAsync();
                return CreatedAtAction(nameof(GetAll), new { id = season.Id }, new { season.Id, season.Label });
            }
            catch (DbUpdateException)
            {
                return StatusCode(500, "An error occurred saving the season.");
            }
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

            
            try
            {
                _db.Venues.Add(venue);
                await _db.SaveChangesAsync();
                return CreatedAtAction(nameof(GetAll), new { id = venue.Id }, new { venue.Id, venue.Name });
            }
            catch (DbUpdateException)
            {
                return StatusCode(500, "An error occurred saving the venue.");
            }
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

            try
            {
                _db.Operas.Add(opera);
                await _db.SaveChangesAsync();
                return CreatedAtAction(nameof(GetAll), new { id = opera.Id }, new { opera.Id, opera.Title });
            }
            catch (DbUpdateException)
            {
                return StatusCode(500, "An error occurred saving the opera.");
            }
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

            try
            {
                await _db.SaveChangesAsync();
                return NoContent();
            }
            catch (DbUpdateException)
            {
                return StatusCode(500, "An error occurred updating the opera.");
            }
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
            
            try
            {
                _db.Languages.Add(language);
                await _db.SaveChangesAsync();
                return CreatedAtAction(nameof(GetAll), new { id = language.Id }, new { language.Id, language.Name });
            }
            catch (DbUpdateException)
            {
                return StatusCode(500, "An error occurred saving the language.");
            }
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

    // ── COMPOSERS ─────────────────────────────────────────────────
    [ApiController]
    [Route("api/[controller]")]
    public class ComposersController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        public ComposersController(ApplicationDbContext db) => _db = db;

        [HttpGet]
        public async Task<IActionResult> GetAll() =>
            Ok(await _db.Composers
                .OrderBy(c => c.Name)
                .Select(c => new { c.Id, c.Name })
                .ToListAsync());

        //[Authorize(Roles = "Admin")]
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateComposerDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Name))
                return BadRequest("Name is required.");

            if (await _db.Composers.AnyAsync(c => c.Name == dto.Name))
                return Conflict("A composer with this name already exists.");

            var composer = new Composer { Name = dto.Name };

            try
            {
                _db.Composers.Add(composer);
                await _db.SaveChangesAsync();
                return CreatedAtAction(nameof(GetAll), new { id = composer.Id }, new { composer.Id, composer.Name });
            }
            catch (DbUpdateException)
            {
                return StatusCode(500, "An error occurred saving the composer.");
            }
        }

        // DELETE /api/composers/5
        //[Authorize(Roles = "Admin")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var composer = await _db.Composers.FindAsync(id);
            if (composer == null) return NotFound();

            // Check if composer is linked to any operas
            var hasOperas = await _db.Operas
                .AnyAsync(o => o.Composers.Any(c => c.Id == id));
            if (hasOperas)
                return Conflict("This composer is linked to one or more operas and cannot be deleted.");

            try
            {
                _db.Composers.Remove(composer);
                await _db.SaveChangesAsync();
                return NoContent();
            }
            catch (DbUpdateException)
            {
                return Conflict("This composer could not be deleted due to existing related records.");
            }
        }
    }

    // ── LIBRETTISTS ───────────────────────────────────────────────
    [ApiController]
    [Route("api/[controller]")]
    public class LibrettistsController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        public LibrettistsController(ApplicationDbContext db) => _db = db;

        [HttpGet]
        public async Task<IActionResult> GetAll() =>
            Ok(await _db.Librettists
                .OrderBy(l => l.Name)
                .Select(l => new { l.Id, l.Name })
                .ToListAsync());

        //[Authorize(Roles = "Admin")]
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateLibrettistDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Name))
                return BadRequest("Name is required.");

            if (await _db.Librettists.AnyAsync(l => l.Name == dto.Name))
                return Conflict("A librettist with this name already exists.");

            var librettist = new Librettist { Name = dto.Name };
            
            try
            {
                _db.Librettists.Add(librettist);
                await _db.SaveChangesAsync();
                return CreatedAtAction(nameof(GetAll), new { id = librettist.Id }, new { librettist.Id, librettist.Name });
            }
            catch (DbUpdateException)
            {
                return StatusCode(500, "An error occurred saving the librettist.");
            }
        }

        // DELETE /api/librettists/5
        //[Authorize(Roles = "Admin")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var librettist = await _db.Librettists.FindAsync(id);
            if (librettist == null) return NotFound();

            var hasOperas = await _db.Operas
                .AnyAsync(o => o.Librettists.Any(l => l.Id == id));
            if (hasOperas)
                return Conflict("This librettist is linked to one or more operas and cannot be deleted.");

            try
            {
                _db.Librettists.Remove(librettist);
                await _db.SaveChangesAsync();
                return NoContent();
            }
            catch (DbUpdateException)
            {
                return Conflict("This librettist could not be deleted due to existing related records.");
            }
        }



    }
}