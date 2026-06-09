using COArchive.Data;
using COArchive.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace COArchive.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProductionsController : ControllerBase
    {
        private readonly ApplicationDbContext _db;

        public ProductionsController(ApplicationDbContext db)
        {
            _db = db;
        }

        // GET /api/productions
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var events = await _db.Productions
                .Include(e => e.Season)
                .Include(e => e.EventType)
                .Include(e => e.Venue)
                .Include(e => e.Opera)
                .Include(e => e.Performances)
                .OrderBy(e => e.Season.Label)
                .ToListAsync();
            return Ok(events);
        }

        // GET /api/productions/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var ev = await _db.Productions
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
                .Include(e => e.Appearances)
                    .ThenInclude(a => a.Person)
                .Include(e => e.Appearances)
                    .ThenInclude(a => a.ContributorType)
                .Include(e => e.Appearances)
                    .ThenInclude(a => a.Position)
                .Include(e => e.Appearances)
                    .ThenInclude(a => a.Character)
                .FirstOrDefaultAsync(e => e.Id == id);

            if (ev == null) return NotFound();
            return Ok(ev);
        }

        // POST /api/productions
        [HttpPost]
        public async Task<IActionResult> Create(Production ev)
        {
            _db.Productions.Add(ev);
            await _db.SaveChangesAsync();
            return CreatedAtAction(nameof(GetById), new { id = ev.Id }, ev);
        }

        // PUT /api/productions/5
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, Production ev)
        {
            if (id != ev.Id) return BadRequest();
            _db.Entry(ev).State = EntityState.Modified;
            await _db.SaveChangesAsync();
            return NoContent();
        }

        // DELETE /api/productions/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var ev = await _db.Productions.FindAsync(id);
            if (ev == null) return NotFound();
            _db.Productions.Remove(ev);
            await _db.SaveChangesAsync();
            return NoContent();
        }
    }
}