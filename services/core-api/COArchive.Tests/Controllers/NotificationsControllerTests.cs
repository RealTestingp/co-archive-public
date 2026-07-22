using COArchive.API.Controllers;
using COArchive.API.DataTransferObjects;
using COArchive.Data;
using COArchive.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace COArchive.Tests.Controllers
{
    public class NotificationsControllerTests
    {
        private ApplicationDbContext GetInMemoryDb(string dbName)
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: dbName)
                .Options;
            return new ApplicationDbContext(options);
        }

        private void SeedBaseData(ApplicationDbContext db)
        {
            db.Seasons.Add(new Season { Id = 1, Label = "2025-2026" });
            db.EventTypes.Add(new EventType { Id = 1, Name = "MainStage", TrackMilestones = true });
            db.EventTypes.Add(new EventType { Id = 2, Name = "Brunch", TrackMilestones = false });
            db.Venues.Add(new Venue { Id = 1, Name = "Southern Alberta Jubilee Auditorium" });
            db.ContributorTypes.Add(new ContributorType { Id = 1, Name = "Artist", TrackPerformances = true });
            db.ContributorTypes.Add(new ContributorType { Id = 3, Name = "Creative", TrackPerformances = false });
            db.Persons.Add(new Person { Id = 1, FirstName = "Luke", LastName = "Noftall" });

            for (int i = 1; i <= 4; i++)
            {
                db.Productions.Add(new Production
                {
                    Id = i,
                    Title = $"Production {i}",
                    SeasonId = 1,
                    EventTypeId = 1,
                    VenueId = 1,
                });
                db.Performances.Add(new Performance
                {
                    Id = i,
                    ProductionId = i,
                    Date = DateTime.UtcNow.AddDays(3)
                });
            }

            db.Productions.Add(new Production
            {
                Id = 5,
                Title = "Production 5 — Milestone",
                SeasonId = 1,
                EventTypeId = 1,
                VenueId = 1,
            });
            db.Performances.Add(new Performance
            {
                Id = 5,
                ProductionId = 5,
                Date = DateTime.UtcNow.AddDays(3)
            });

            for (int i = 1; i <= 4; i++)
            {
                db.Appearances.Add(new Appearance
                {
                    Id = i,
                    PersonId = 1,
                    ProductionId = i,
                    ContributorTypeId = 1,
                });
            }

            db.SaveChanges();
        }

        // ── MILESTONE NOTIFICATION TESTS ──────────────────────────────────

        [Fact]
        public async Task AddAppearance_CreatesNotification_WhenPersonReaches5thMainStageProduction()
        {
            // Arrange
            var db = GetInMemoryDb("Milestone_5th_Production");
            SeedBaseData(db);
            var controller = new AppearancesController(db);
            var dto = new CreateAppearanceDto
            {
                PersonId = 1,
                ProductionId = 5,
                ContributorTypeId = 1
            };

            // Act
            var result = await controller.Create(dto);

            // Assert — check specifically for the Production milestone notification
            // Note: a Performance milestone may also be created simultaneously — that is correct behaviour
            Assert.IsType<CreatedAtActionResult>(result);
            var notifications = await db.Notifications.ToListAsync();
            var productionNotification = notifications
                .FirstOrDefault(n => n.MilestoneType == "Production");
            Assert.NotNull(productionNotification);
            Assert.Equal(1, productionNotification.PersonId);
            Assert.Equal(5, productionNotification.MilestoneCount);
            Assert.Equal("Production", productionNotification.MilestoneType);
            Assert.False(productionNotification.IsRead);
        }

        [Fact]
        public async Task AddAppearance_DoesNotCreateNotification_WhenNotAtMilestone()
        {
            // Arrange — Luke has 3 appearances, adding his 4th (not a milestone)
            var db = GetInMemoryDb("NoMilestone_4th_Production");
            db.Seasons.Add(new Season { Id = 1, Label = "2025-2026" });
            db.EventTypes.Add(new EventType { Id = 1, Name = "MainStage", TrackMilestones = true });
            db.Venues.Add(new Venue { Id = 1, Name = "Jubilee" });
            db.ContributorTypes.Add(new ContributorType { Id = 1, Name = "Artist", TrackPerformances = true });
            db.Persons.Add(new Person { Id = 1, FirstName = "Luke", LastName = "Noftall" });

            for (int i = 1; i <= 3; i++)
            {
                db.Productions.Add(new Production { Id = i, Title = $"Prod {i}", SeasonId = 1, EventTypeId = 1, VenueId = 1 });
                db.Performances.Add(new Performance { Id = i, ProductionId = i, Date = DateTime.UtcNow.AddDays(3) });
                db.Appearances.Add(new Appearance { Id = i, PersonId = 1, ProductionId = i, ContributorTypeId = 1 });
            }
            db.Productions.Add(new Production { Id = 4, Title = "Prod 4", SeasonId = 1, EventTypeId = 1, VenueId = 1 });
            db.Performances.Add(new Performance { Id = 4, ProductionId = 4, Date = DateTime.UtcNow.AddDays(3) });
            db.SaveChanges();

            var controller = new AppearancesController(db);
            var dto = new CreateAppearanceDto { PersonId = 1, ProductionId = 4, ContributorTypeId = 1 };

            // Act
            var result = await controller.Create(dto);

            // Assert — no notifications of either type
            Assert.IsType<CreatedAtActionResult>(result);
            var notifications = await db.Notifications.ToListAsync();
            Assert.Empty(notifications);
        }

        [Fact]
        public async Task AddAppearance_DoesNotCreateNotification_WhenProductionHasNoUpcomingPerformances()
        {
            // Arrange — all performances are in the past
            var db = GetInMemoryDb("Milestone_NoUpcomingPerformance");
            db.Seasons.Add(new Season { Id = 1, Label = "2025-2026" });
            db.EventTypes.Add(new EventType { Id = 1, Name = "MainStage", TrackMilestones = true });
            db.Venues.Add(new Venue { Id = 1, Name = "Jubilee" });
            db.ContributorTypes.Add(new ContributorType { Id = 1, Name = "Artist", TrackPerformances = true });
            db.Persons.Add(new Person { Id = 1, FirstName = "Luke", LastName = "Noftall" });

            for (int i = 1; i <= 4; i++)
            {
                db.Productions.Add(new Production { Id = i, Title = $"Prod {i}", SeasonId = 1, EventTypeId = 1, VenueId = 1 });
                db.Performances.Add(new Performance { Id = i, ProductionId = i, Date = DateTime.UtcNow.AddDays(-10) });
                db.Appearances.Add(new Appearance { Id = i, PersonId = 1, ProductionId = i, ContributorTypeId = 1 });
            }
            db.Productions.Add(new Production { Id = 5, Title = "Prod 5", SeasonId = 1, EventTypeId = 1, VenueId = 1 });
            db.Performances.Add(new Performance { Id = 5, ProductionId = 5, Date = DateTime.UtcNow.AddDays(-5) });
            db.SaveChanges();

            var controller = new AppearancesController(db);
            var dto = new CreateAppearanceDto { PersonId = 1, ProductionId = 5, ContributorTypeId = 1 };

            // Act
            var result = await controller.Create(dto);

            // Assert — no notification because all performances are in the past
            Assert.IsType<CreatedAtActionResult>(result);
            var notifications = await db.Notifications.ToListAsync();
            Assert.Empty(notifications);
        }

        [Fact]
        public async Task AddAppearance_DoesNotDuplicateProductionNotification_WhenMilestoneAlreadyNotified()
        {
            // Arrange — Production milestone notification already exists
            var db = GetInMemoryDb("Milestone_NoDuplicate");
            SeedBaseData(db);

            db.Notifications.Add(new Notification
            {
                Id = 1,
                PersonId = 1,
                MilestoneType = "Production",
                MilestoneCount = 5,
                Message = "Luke Noftall is approaching their 5th MainStage production milestone!",
                IsRead = false,
                CreatedAt = DateTime.UtcNow.AddDays(-1),
                EmailSent = false
            });
            db.SaveChanges();

            var controller = new AppearancesController(db);
            var dto = new CreateAppearanceDto { PersonId = 1, ProductionId = 5, ContributorTypeId = 1 };

            // Act
            await controller.Create(dto);

            // Assert — still only one Production notification, no duplicate
            // A Performance notification may also exist — that is correct behaviour
            var productionNotifications = await db.Notifications
                .Where(n => n.MilestoneType == "Production")
                .ToListAsync();
            Assert.Single(productionNotifications);
        }

        [Fact]
        public async Task AddAppearance_DoesNotCreateNotification_WhenEventTypeDoesNotTrackMilestones()
        {
            // Arrange — brunch production, TrackMilestones = false
            var db = GetInMemoryDb("Milestone_BrunchNotTracked");
            db.Seasons.Add(new Season { Id = 1, Label = "2025-2026" });
            db.EventTypes.Add(new EventType { Id = 1, Name = "MainStage", TrackMilestones = true });
            db.EventTypes.Add(new EventType { Id = 2, Name = "Brunch", TrackMilestones = false });
            db.Venues.Add(new Venue { Id = 1, Name = "Jubilee" });
            db.ContributorTypes.Add(new ContributorType { Id = 1, Name = "Artist", TrackPerformances = true });
            db.Persons.Add(new Person { Id = 1, FirstName = "Luke", LastName = "Noftall" });

            for (int i = 1; i <= 4; i++)
            {
                db.Productions.Add(new Production { Id = i, Title = $"MainStage {i}", SeasonId = 1, EventTypeId = 1, VenueId = 1 });
                db.Performances.Add(new Performance { Id = i, ProductionId = i, Date = DateTime.UtcNow.AddDays(3) });
                db.Appearances.Add(new Appearance { Id = i, PersonId = 1, ProductionId = i, ContributorTypeId = 1 });
            }

            db.Productions.Add(new Production { Id = 5, Title = "Brunch", SeasonId = 1, EventTypeId = 2, VenueId = 1 });
            db.Performances.Add(new Performance { Id = 5, ProductionId = 5, Date = DateTime.UtcNow.AddDays(3) });
            db.SaveChanges();

            var controller = new AppearancesController(db);
            var dto = new CreateAppearanceDto { PersonId = 1, ProductionId = 5, ContributorTypeId = 1 };

            // Act
            await controller.Create(dto);

            // Assert — no notification because Brunch doesn't track milestones
            var notifications = await db.Notifications.ToListAsync();
            Assert.Empty(notifications);
        }

        [Fact]
        public async Task AddAppearance_CreatesProductionNotification_At10thMilestone()
        {
            // Arrange — Luke has 9 MainStage appearances, adding his 10th
            var db = GetInMemoryDb("Milestone_10th_Production");
            db.Seasons.Add(new Season { Id = 1, Label = "2025-2026" });
            db.EventTypes.Add(new EventType { Id = 1, Name = "MainStage", TrackMilestones = true });
            db.Venues.Add(new Venue { Id = 1, Name = "Jubilee" });
            db.ContributorTypes.Add(new ContributorType { Id = 1, Name = "Artist", TrackPerformances = true });
            db.Persons.Add(new Person { Id = 1, FirstName = "Luke", LastName = "Noftall" });

            for (int i = 1; i <= 9; i++)
            {
                db.Productions.Add(new Production { Id = i, Title = $"Prod {i}", SeasonId = 1, EventTypeId = 1, VenueId = 1 });
                db.Performances.Add(new Performance { Id = i, ProductionId = i, Date = DateTime.UtcNow.AddDays(3) });
                db.Appearances.Add(new Appearance { Id = i, PersonId = 1, ProductionId = i, ContributorTypeId = 1 });
            }
            db.Productions.Add(new Production { Id = 10, Title = "Prod 10", SeasonId = 1, EventTypeId = 1, VenueId = 1 });
            db.Performances.Add(new Performance { Id = 10, ProductionId = 10, Date = DateTime.UtcNow.AddDays(3) });
            db.SaveChanges();

            var controller = new AppearancesController(db);
            var dto = new CreateAppearanceDto { PersonId = 1, ProductionId = 10, ContributorTypeId = 1 };

            // Act
            await controller.Create(dto);

            // Assert — check specifically for Production milestone at count 10
            // Note: a Performance milestone may also be created — that is correct behaviour
            var notifications = await db.Notifications.ToListAsync();
            var productionNotification = notifications
                .FirstOrDefault(n => n.MilestoneType == "Production" && n.MilestoneCount == 10);
            Assert.NotNull(productionNotification);
            Assert.Equal(10, productionNotification.MilestoneCount);
            Assert.Equal("Production", productionNotification.MilestoneType);
        }

        // ── NOTIFICATIONS CONTROLLER TESTS ────────────────────────────────

        [Fact]
        public async Task GetAll_ReturnsOnlyUnreadNotifications()
        {
            // Arrange
            var db = GetInMemoryDb("GetAll_Unread");
            db.Persons.Add(new Person { Id = 1, FirstName = "Luke", LastName = "Noftall" });
            db.Notifications.Add(new Notification
            {
                Id = 1,
                PersonId = 1,
                MilestoneType = "Production",
                MilestoneCount = 5,
                Message = "Test",
                IsRead = false,
                CreatedAt = DateTime.UtcNow,
                EmailSent = false
            });
            db.Notifications.Add(new Notification
            {
                Id = 2,
                PersonId = 1,
                MilestoneType = "Production",
                MilestoneCount = 10,
                Message = "Test 2",
                IsRead = true,
                CreatedAt = DateTime.UtcNow,
                EmailSent = false
            });
            db.SaveChanges();
            var controller = new NotificationsController(db);

            // Act
            var result = await controller.GetAll();

            // Assert — only returns the unread one
            var okResult = Assert.IsType<OkObjectResult>(result);
            var notifications = okResult.Value as IEnumerable<object>;
            Assert.NotNull(notifications);
            Assert.Single(notifications);
        }

        [Fact]
        public async Task MarkAsRead_ReturnsNoContent_AndMarksNotificationRead()
        {
            // Arrange
            var db = GetInMemoryDb("MarkAsRead_Valid");
            db.Persons.Add(new Person { Id = 1, FirstName = "Luke", LastName = "Noftall" });
            db.Notifications.Add(new Notification
            {
                Id = 1,
                PersonId = 1,
                MilestoneType = "Production",
                MilestoneCount = 5,
                Message = "Test",
                IsRead = false,
                CreatedAt = DateTime.UtcNow,
                EmailSent = false
            });
            db.SaveChanges();
            var controller = new NotificationsController(db);

            // Act
            var result = await controller.MarkAsRead(1);

            // Assert
            Assert.IsType<NoContentResult>(result);
            Assert.True(db.Notifications.Find(1)!.IsRead);
        }

        [Fact]
        public async Task MarkAsRead_ReturnsNotFound_WhenNotificationDoesNotExist()
        {
            // Arrange
            var db = GetInMemoryDb("MarkAsRead_NotFound");
            var controller = new NotificationsController(db);

            // Act
            var result = await controller.MarkAsRead(999);

            // Assert
            Assert.IsType<NotFoundResult>(result);
        }

        [Fact]
        public async Task MarkAllAsRead_MarksAllUnreadNotificationsAsRead()
        {
            // Arrange
            var db = GetInMemoryDb("MarkAllAsRead");
            db.Persons.Add(new Person { Id = 1, FirstName = "Luke", LastName = "Noftall" });
            for (int i = 1; i <= 3; i++)
            {
                db.Notifications.Add(new Notification
                {
                    Id = i,
                    PersonId = 1,
                    MilestoneType = "Production",
                    MilestoneCount = i * 5,
                    Message = $"Test {i}",
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow,
                    EmailSent = false
                });
            }
            db.SaveChanges();
            var controller = new NotificationsController(db);

            // Act
            var result = await controller.MarkAllAsRead();

            // Assert
            Assert.IsType<NoContentResult>(result);
            var allRead = await db.Notifications.AllAsync(n => n.IsRead);
            Assert.True(allRead);
        }
    }
}