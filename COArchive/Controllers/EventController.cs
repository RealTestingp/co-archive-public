using COArchive.Data;
using COArchive.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace COArchive.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class EventsController : ControllerBase
    {
        private readonly ApplicationDbContext _db;

        public EventsController(ApplicationDbContext db)
        {
            _db = db;
        }

        // GET /api/events
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var events = await _db.Events
                .Include(e => e.Venue)
                .Include(e => e.Performances)
                .OrderBy(e => e.Season)
                .ToListAsync();

            return Ok(events);
        }

        // GET /api/events/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var ev = await _db.Events
                .Include(e => e.Venue)
                .Include(e => e.Performances)
                .Include(e => e.Characters)
                .Include(e => e.EventContributors)
                    .ThenInclude(ec => ec.Contributor)
                .FirstOrDefaultAsync(e => e.Id == id);

            if (ev == null) return NotFound();
            return Ok(ev);
        }

        // POST /api/events
        [HttpPost]
        public async Task<IActionResult> Create(Event ev)
        {
            _db.Events.Add(ev);
            await _db.SaveChangesAsync();
            return CreatedAtAction(nameof(GetById), new { id = ev.Id }, ev);
        }

        // PUT /api/events/5
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, Event ev)
        {
            if (id != ev.Id) return BadRequest();
            _db.Entry(ev).State = EntityState.Modified;
            await _db.SaveChangesAsync();
            return NoContent();
        }

        // DELETE /api/events/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var ev = await _db.Events.FindAsync(id);
            if (ev == null) return NotFound();
            _db.Events.Remove(ev);
            await _db.SaveChangesAsync();
            return NoContent();
        }
    }
}