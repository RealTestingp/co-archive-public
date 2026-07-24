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
    //[Authorize] // all endpoints require login
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
            if (search != null && search.Length > 100)
                return BadRequest("Search term too long.");

            // Ignore search terms under 2 characters, avoids single-letter queries
            //TODO FIX - display error or stop search - less than 2 chars returns entire db
            if (search!= null && search.Trim().Length > 0 && search.Trim().Length < 2)
            {
                return Ok(new List<object>());
            }

            var effectiveSearch = string.IsNullOrWhiteSpace(search)
                ? null
                : search.Trim();

            var query = _db.Productions
                .Include(e => e.Season)
                .Include(e => e.EventType)
                .Include(e => e.Venue)
                .Include(e => e.Opera)
                .AsQueryable();

            if (effectiveSearch != null)
                query = query.Where(e => e.Title.Contains(effectiveSearch));

            // Rank titles that start with the search term first, then fall back to the existing season-descending ordering
            var orderedQuery = effectiveSearch != null
                ? query
                    .OrderByDescending(e => e.Season.Label)
                    : query.OrderByDescending(e => e.Season.Label);

            var results = await orderedQuery
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
                OperaId = production.Opera?.Id,
                Opera = production.Opera?.Title,
                Composers = production.Opera?.Composers
                    .Select(c => c.Name).ToList() ?? new List<string>(),
                Librettists = production.Opera?.Librettists
                    .Select(l => l.Name).ToList() ?? new List<string>(),
                WrittenLanguage = production.WrittenLanguage?.Name,
                SungLanguage = production.SungLanguage?.Name,
                Performances = production.Performances
                    .OrderBy(p => p.Date)
                    .Select(p => new { p.Id, p.Date, p.DateTo })
                    .ToList(),
                Cast = appearances
                    .Where(a => a.ContributorType.Name == "Artist"
                             || a.ContributorType.Name == "McPhee")
                    .Select(a => new
                    {
                        AppearanceId = a.Id,
                        PersonId = a.Person.Id,
                        a.Person.FirstName,
                        a.Person.LastName,
                        ContributorType = a.ContributorType.Name,
                        CharacterId = a.Character?.Id,
                        Character = a.Character?.Name,
                        Position = a.Position?.Name,
                    })
                    .OrderBy(a => a.LastName)
                    .ToList(),
                Creative = appearances
                    .Where(a => a.ContributorType.Name == "Creative")
                    .Select(a => new
                    {
                        AppearanceId = a.Id,
                        PersonId = a.Person.Id,
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
                        AppearanceId = a.Id,
                        PersonId = a.Person.Id,
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
                        AppearanceId = a.Id,
                        PersonId = a.Person.Id,
                        a.Person.FirstName,
                        a.Person.LastName,
                    })
                    .OrderBy(a => a.LastName)
                    .ToList(),
                Chorus = appearances
                    .Where(a => a.ContributorType.Name == "Chorus")
                    .Select(a => new
                    {
                        AppearanceId = a.Id,
                        PersonId = a.Person.Id,
                        a.Person.FirstName,
                        a.Person.LastName,
                    })
                    .OrderBy(a => a.LastName)
                    .ToList(),
            };

            return Ok(result);
        }

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

            // Update performance dates if provided — clear existing and replace
            if (dto.PerformanceDates != null || dto.TourStartDate.HasValue)
            {
                // Remove all existing performances for this production
                var existingPerformances = await _db.Performances
                    .Where(p => p.ProductionId == id)
                    .ToListAsync();
                _db.Performances.RemoveRange(existingPerformances);

                // Add specific dates — MainStage, Brunch, Family, Cabaret
                if (dto.PerformanceDates != null && dto.PerformanceDates.Any())
                {
                    foreach (var date in dto.PerformanceDates)
                    {
                        _db.Performances.Add(new Performance
                        {
                            ProductionId = id,
                            Date = date,
                        });
                    }
                }
                // Add tour date range
                else if (dto.TourStartDate.HasValue && dto.TourEndDate.HasValue)
                {
                    _db.Performances.Add(new Performance
                    {
                        ProductionId = id,
                        Date = dto.TourStartDate.Value,
                    });
                    _db.Performances.Add(new Performance
                    {
                        ProductionId = id,
                        Date = dto.TourEndDate.Value,
                    });
                }

                await _db.SaveChangesAsync();
            }

            return NoContent();
        }

        // POST /api/productions
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateProductionDto dto)
        {
            using var transaction = await _db.Database.BeginTransactionAsync();
            try
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

                // Add performance dates
                if (dto.PerformanceDates != null && dto.PerformanceDates.Any())
                {
                    foreach (var date in dto.PerformanceDates)
                    {
                        _db.Performances.Add(new Performance
                        {
                            ProductionId = production.Id,
                            Date = date,
                            DateTo = null,
                        });
                    }
                }
                else if (dto.TourStartDate.HasValue && dto.TourEndDate.HasValue)
                {
                    _db.Performances.Add(new Performance
                    {
                        ProductionId = production.Id,
                        Date = dto.TourStartDate.Value,
                        DateTo = dto.TourEndDate.Value,
                    });
                }

                // Add appearances
                if (dto.Appearances != null && dto.Appearances.Any())
                {
                    foreach (var a in dto.Appearances)
                    {
                        _db.Appearances.Add(new Appearance
                        {
                            PersonId = a.PersonId,
                            ProductionId = production.Id, // always from new production
                            ContributorTypeId = a.ContributorTypeId,
                            PositionId = a.PositionId,
                            CharacterId = a.CharacterId,
                        });
                    }
                }

                await _db.SaveChangesAsync();
                await transaction.CommitAsync();

                return CreatedAtAction(nameof(GetById), new { id = production.Id }, new { production.Id });
            }
            catch (Exception)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, "An error occurred creating the production. No data was saved.");
            }
        }

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