using COArchive.API.Controllers;
using COArchive.API.DataTransferObjects;
using COArchive.Data;
using COArchive.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;


namespace COArchive.Tests.Controllers
{
    public class ProductionsControllerTests
    {
        private ApplicationDbContext GetInMemoryDb(string dbName)
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: dbName)
                .Options;
            return new ApplicationDbContext(options);
        }

        private void SeedLookupData(ApplicationDbContext db)
        {
            db.Seasons.Add(new Season { Id = 1, Label = "2025-2026" });
            db.EventTypes.Add(new EventType { Id = 1, Name = "MainStage", TrackMilestones = true });
            db.Venues.Add(new Venue { Id = 1, Name = "Southern Alberta Jubilee Auditorium" });
            db.SaveChanges();
        }

        // ── GET /api/productions ──────────────────────────────────────────

        [Fact]
        public async Task GetAll_ReturnsOk_WithEmptyList_WhenNoProductions()
        {
            // Arrange
            var db = GetInMemoryDb("GetAll_Empty");
            SeedLookupData(db);
            var controller = new ProductionsController(db);

            // Act
            var result = await controller.GetAll(null);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(okResult.Value);
        }

        [Fact]
        public async Task GetAll_ReturnsOk_WithProductions_WhenProductionsExist()
        {
            // Arrange
            var db = GetInMemoryDb("GetAll_WithData");
            SeedLookupData(db);
            db.Productions.Add(new Production
            {
                Id = 1,
                Title = "Madama Butterfly",
                SeasonId = 1,
                EventTypeId = 1,
                VenueId = 1,
            });
            db.SaveChanges();
            var controller = new ProductionsController(db);

            // Act
            var result = await controller.GetAll(null);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(okResult.Value);
        }

        [Fact]
        public async Task GetAll_ReturnsBadRequest_WhenSearchTermTooLong()
        {
            // Arrange
            var db = GetInMemoryDb("GetAll_SearchTooLong");
            var controller = new ProductionsController(db);
            var longSearch = new string('a', 101);

            // Act
            var result = await controller.GetAll(longSearch);

            // Assert
            Assert.IsType<BadRequestObjectResult>(result);
        }

        // ── GET /api/productions/{id} ─────────────────────────────────────

        [Fact]
        public async Task GetById_ReturnsNotFound_WhenProductionDoesNotExist()
        {
            // Arrange
            var db = GetInMemoryDb("GetById_NotFound");
            var controller = new ProductionsController(db);

            // Act
            var result = await controller.GetById(999);

            // Assert
            Assert.IsType<NotFoundResult>(result);
        }

        // ── POST /api/productions ─────────────────────────────────────────

        [Fact]
        public async Task Create_ReturnsCreated_WhenValidDtoProvided()
        {
            // Arrange
            var db = GetInMemoryDb("Create_Valid");
            SeedLookupData(db);
            var controller = new ProductionsController(db);
            var dto = new CreateProductionDto
            {
                Title = "Test Production",
                SeasonId = 1,
                EventTypeId = 1,
                VenueId = 1,
            };

            // Act
            var result = await controller.Create(dto);

            // Assert
            Assert.IsType<CreatedAtActionResult>(result);
            Assert.Equal(1, await db.Productions.CountAsync());
        }

        // ── PUT /api/productions/{id} ─────────────────────────────────────

        [Fact]
        public async Task Update_ReturnsNotFound_WhenProductionDoesNotExist()
        {
            // Arrange
            var db = GetInMemoryDb("Update_NotFound");
            var controller = new ProductionsController(db);
            var dto = new UpdateProductionDto
            {
                Id = 999,
                Title = "Updated",
                SeasonId = 1,
                EventTypeId = 1,
                VenueId = 1,
            };

            // Act
            var result = await controller.Update(999, dto);

            // Assert
            Assert.IsType<NotFoundResult>(result);
        }

        [Fact]
        public async Task Update_ReturnsBadRequest_WhenIdMismatch()
        {
            // Arrange
            var db = GetInMemoryDb("Update_IdMismatch");
            var controller = new ProductionsController(db);
            var dto = new UpdateProductionDto { Id = 5, Title = "Test", SeasonId = 1, EventTypeId = 1, VenueId = 1 };

            // Act
            var result = await controller.Update(999, dto);

            // Assert
            Assert.IsType<BadRequestObjectResult>(result);
        }

        [Fact]
        public async Task Update_ReturnsNoContent_WhenProductionExists()
        {
            // Arrange
            var db = GetInMemoryDb("Update_Valid");
            SeedLookupData(db);
            db.Productions.Add(new Production { Id = 1, Title = "Original", SeasonId = 1, EventTypeId = 1, VenueId = 1 });
            db.SaveChanges();
            var controller = new ProductionsController(db);
            var dto = new UpdateProductionDto
            {
                Id = 1,
                Title = "Updated Title",
                SeasonId = 1,
                EventTypeId = 1,
                VenueId = 1,
            };

            // Act
            var result = await controller.Update(1, dto);

            // Assert
            Assert.IsType<NoContentResult>(result);
            Assert.Equal("Updated Title", db.Productions.Find(1)!.Title);
        }

        // ── DELETE /api/productions/{id} ──────────────────────────────────

        [Fact]
        public async Task Delete_ReturnsNotFound_WhenProductionDoesNotExist()
        {
            // Arrange
            var db = GetInMemoryDb("Delete_NotFound");
            var controller = new ProductionsController(db);

            // Act
            var result = await controller.Delete(999);

            // Assert
            Assert.IsType<NotFoundResult>(result);
        }

        [Fact]
        public async Task Delete_ReturnsNoContent_WhenProductionExistsWithNoAppearances()
        {
            // Arrange
            var db = GetInMemoryDb("Delete_Valid");
            SeedLookupData(db);
            db.Productions.Add(new Production { Id = 1, Title = "Test", SeasonId = 1, EventTypeId = 1, VenueId = 1 });
            db.SaveChanges();
            var controller = new ProductionsController(db);

            // Act
            var result = await controller.Delete(1);

            // Assert
            Assert.IsType<NoContentResult>(result);
            Assert.Equal(0, await db.Productions.CountAsync());
        }
    }
}