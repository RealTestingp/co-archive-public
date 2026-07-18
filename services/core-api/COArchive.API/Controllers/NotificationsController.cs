using COArchive.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace COArchive.API.Controllers
{
    //TODO add auth
    [ApiController]
    [Route("api/[controller]")]
    public class NotificationsController : ControllerBase
    {
        private readonly ApplicationDbContext _db;

        public NotificationsController(ApplicationDbContext db)
        {
            _db = db;
        }

        // GET /api/notifications — all unread notifications
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var notifications = await _db.Notifications
                .Include(n => n.Person)
                .Where(n => !n.IsRead)
                .OrderByDescending(n => n.CreatedAt)
                .Select(n => new
                {
                    n.Id,
                    n.Message,
                    n.MilestoneType,
                    n.MilestoneCount,
                    n.CreatedAt,
                    n.IsRead,
                    Person = new { n.Person.FirstName, n.Person.LastName }
                })
                .ToListAsync();

            return Ok(notifications);
        }

        // PUT /api/notifications/{id}/read — mark one as read
        [HttpPut("{id}/read")]
        public async Task<IActionResult> MarkAsRead(int id)
        {
            var notification = await _db.Notifications.FindAsync(id);
            if (notification == null) return NotFound();

            notification.IsRead = true;
            await _db.SaveChangesAsync();
            return NoContent();
        }

        // PUT /api/notifications/read-all — mark all as read
        [HttpPut("read-all")]
        public async Task<IActionResult> MarkAllAsRead()
        {
            var unread = await _db.Notifications
                .Where(n => !n.IsRead)
                .ToListAsync();

            foreach (var n in unread)
                n.IsRead = true;

            await _db.SaveChangesAsync();
            return NoContent();
        }
    }
}