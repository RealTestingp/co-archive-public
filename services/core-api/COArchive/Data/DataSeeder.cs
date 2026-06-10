using COArchive.Models;
using Microsoft.EntityFrameworkCore;

namespace COArchive.Data
{
    public static class DataSeeder
    {
        public static async Task SeedAsync(ApplicationDbContext db)
        {
            await SeedEventTypesAsync(db);
            await SeedVoiceTypesAsync(db);
            await SeedLanguagesAsync(db);
            await SeedNationalitiesAsync(db);
            await SeedContributorTypesAsync(db);
            await SeedSeasonsAsync(db);
            await SeedVenuesAsync(db);
            await SeedPositionsAsync(db);
        }

        // ── EventTypes ────────────────────────────────────────────────────
        private static async Task SeedEventTypesAsync(ApplicationDbContext db)
        {
            if (await db.EventTypes.AnyAsync()) return;

            db.EventTypes.AddRange(
                new EventType { Name = "MainStage", TrackMilestones = true },
                new EventType { Name = "Brunch", TrackMilestones = false },
                new EventType { Name = "Cabaret", TrackMilestones = false },
                new EventType { Name = "Tour", TrackMilestones = false },
                new EventType { Name = "Family", TrackMilestones = false }
            );
            await db.SaveChangesAsync();
        }

        // ── VoiceTypes ────────────────────────────────────────────────────
        private static async Task SeedVoiceTypesAsync(ApplicationDbContext db)
        {
            if (await db.VoiceTypes.AnyAsync()) return;

            db.VoiceTypes.AddRange(
                new VoiceType { Name = "Soprano" },
                new VoiceType { Name = "Mezzo-Soprano" },
                new VoiceType { Name = "Contralto" },
                new VoiceType { Name = "Tenor" },
                new VoiceType { Name = "Baritone" },
                new VoiceType { Name = "Bass" },
                new VoiceType { Name = "Bass-Baritone" },
                new VoiceType { Name = "Counter-Tenor" }
            );
            await db.SaveChangesAsync();
        }

        // ── Languages ─────────────────────────────────────────────────────
        private static async Task SeedLanguagesAsync(ApplicationDbContext db)
        {
            if (await db.Languages.AnyAsync()) return;

            db.Languages.AddRange(
                new Language { Name = "Italian" },
                new Language { Name = "English" },
                new Language { Name = "German" },
                new Language { Name = "French" },
                new Language { Name = "Russian" },
                new Language { Name = "Czech" },
                new Language { Name = "Spanish" },
                new Language { Name = "Hungarian" }
            );
            await db.SaveChangesAsync();
        }

        // ── Nationalities ─────────────────────────────────────────────────
        private static async Task SeedNationalitiesAsync(ApplicationDbContext db)
        {
            if (await db.Nationalities.AnyAsync()) return;

            db.Nationalities.AddRange(
                new Nationality { Name = "Canadian" },
                new Nationality { Name = "American" },
                new Nationality { Name = "British" },
                new Nationality { Name = "Australian" },
                new Nationality { Name = "Italian" },
                new Nationality { Name = "German" },
                new Nationality { Name = "French" },
                new Nationality { Name = "Japanese" },
                new Nationality { Name = "South Korean" },
                new Nationality { Name = "Chinese" },
                new Nationality { Name = "Russian" },
                new Nationality { Name = "Czech" },
                new Nationality { Name = "Spanish" },
                new Nationality { Name = "Hungarian" },
                new Nationality { Name = "Austrian" },
                new Nationality { Name = "New Zealander" },
                new Nationality { Name = "Irish" }
            );
            await db.SaveChangesAsync();
        }

        // ── ContributorTypes ──────────────────────────────────────────────
        private static async Task SeedContributorTypesAsync(ApplicationDbContext db)
        {
            if (await db.ContributorTypes.AnyAsync()) return;

            db.ContributorTypes.AddRange(
                new ContributorType { Name = "Artist", TrackPerformances = true },
                new ContributorType { Name = "McPhee", TrackPerformances = true },
                new ContributorType { Name = "Creative", TrackPerformances = false },
                new ContributorType { Name = "Crew", TrackPerformances = false },
                new ContributorType { Name = "Chorus", TrackPerformances = false },
                new ContributorType { Name = "Orchestra", TrackPerformances = false },
                new ContributorType { Name = "Supernumerary", TrackPerformances = false },
                new ContributorType { Name = "Understudy", TrackPerformances = false },
                new ContributorType { Name = "Staff", TrackPerformances = false },
                new ContributorType { Name = "Board", TrackPerformances = false }
            );
            await db.SaveChangesAsync();
        }

        // ── Seasons ───────────────────────────────────────────────────────
        private static async Task SeedSeasonsAsync(ApplicationDbContext db)
        {
            if (await db.Seasons.AnyAsync()) return;

            var seasons = new List<Season>();
            for (int year = 1972; year <= 2025; year++)
            {
                seasons.Add(new Season { Label = $"{year}-{year + 1}" });
            }
            db.Seasons.AddRange(seasons);
            await db.SaveChangesAsync();
        }

        // ── Venues ────────────────────────────────────────────────────────
        private static async Task SeedVenuesAsync(ApplicationDbContext db)
        {
            if (await db.Venues.AnyAsync()) return;

            db.Venues.AddRange(
                new Venue
                {
                    Name = "Southern Alberta Jubilee Auditorium",
                    StreetAddress = "1415 14 Avenue NW",
                    City = "Calgary",
                    Province = "AB",
                    PostalCode = "T2N 1M4",
                    Country = "Canada"
                },
                new Venue
                {
                    Name = "Opera Centre",
                    StreetAddress = "1315 7 Street SW",
                    City = "Calgary",
                    Province = "AB",
                    PostalCode = "T2R 1A5",
                    Country = "Canada"
                },
                new Venue
                {
                    Name = "Calgary Petroleum Club",
                    StreetAddress = "319 5 Avenue SW",
                    City = "Calgary",
                    Province = "AB",
                    PostalCode = "T2P 0L5",
                    Country = "Canada"
                }
            );
            await db.SaveChangesAsync();
        }

        private static async Task SeedPositionsAsync(ApplicationDbContext db)
        {
            if (await db.Positions.AnyAsync()) return;

            // Get contributor type IDs
            var creative = await db.ContributorTypes.FirstAsync(ct => ct.Name == "Creative");
            var crew = await db.ContributorTypes.FirstAsync(ct => ct.Name == "Crew");
            var artist = await db.ContributorTypes.FirstAsync(ct => ct.Name == "Artist");

            db.Positions.AddRange(
                // Creative positions
                new Position { Name = "Conductor", ContributorTypeId = creative.Id },
                new Position { Name = "Stage Director", ContributorTypeId = creative.Id },
                new Position { Name = "Set Designer", ContributorTypeId = creative.Id },
                new Position { Name = "Lighting Designer", ContributorTypeId = creative.Id },
                new Position { Name = "Costume Designer", ContributorTypeId = creative.Id },
                new Position { Name = "Choreographer", ContributorTypeId = creative.Id },
                new Position { Name = "Intimacy Director", ContributorTypeId = creative.Id },
                new Position { Name = "Chorus Director", ContributorTypeId = creative.Id },
                new Position { Name = "Head Coach", ContributorTypeId = creative.Id },
                new Position { Name = "Répétiteur", ContributorTypeId = creative.Id },
                new Position { Name = "Chorus Répétiteur", ContributorTypeId = creative.Id },
                new Position { Name = "Assistant to the Lighting Designer", ContributorTypeId = creative.Id },
                new Position { Name = "Music Director", ContributorTypeId = creative.Id },
                new Position { Name = "Scenic, Lighting, and Projection Design", ContributorTypeId = creative.Id },
                new Position { Name = "Set & Prop Designer", ContributorTypeId = creative.Id },
                
                // Crew positions
                new Position { Name = "Head of Props", ContributorTypeId = crew.Id },
                new Position { Name = "Head of Wardrobe", ContributorTypeId = crew.Id },
                new Position { Name = "Head of Hair and Wigs", ContributorTypeId = crew.Id },
                new Position { Name = "Head of Makeup", ContributorTypeId = crew.Id },
                new Position { Name = "Director of Production", ContributorTypeId = crew.Id },
                new Position { Name = "Production & Facility Coordinator", ContributorTypeId = crew.Id },
                new Position { Name = "Projected English Titles", ContributorTypeId = crew.Id },
                new Position { Name = "Titles Operator", ContributorTypeId = crew.Id },
                new Position { Name = "Assistant Technical Director", ContributorTypeId = crew.Id },
                // Artist positions (equity)
                new Position { Name = "Stage Manager", ContributorTypeId = artist.Id },
                new Position { Name = "Assistant Stage Manager", ContributorTypeId = artist.Id },
                new Position { Name = "Puppeteer", ContributorTypeId = artist.Id },
                new Position { Name = "Apprentice Stage Manager", ContributorTypeId = artist.Id }
            );
            await db.SaveChangesAsync();
        }
    }
}