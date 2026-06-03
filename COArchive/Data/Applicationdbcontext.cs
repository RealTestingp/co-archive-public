using Microsoft.EntityFrameworkCore;
using COArchive.Models;

namespace COArchive.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options) { }

        public DbSet<Contributor> Contributors => Set<Contributor>();
        public DbSet<Venue> Venues => Set<Venue>();
        public DbSet<Event> Events => Set<Event>();
        public DbSet<Performance> Performances => Set<Performance>();
        public DbSet<Character> Characters => Set<Character>();
        public DbSet<EventContributor> EventContributors => Set<EventContributor>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Contributor
            modelBuilder.Entity<Contributor>()
                .Property(c => c.ContributorType)
                .HasConversion<string>(); // Store as readable string in DB

            // Event
            modelBuilder.Entity<Event>()
                .Property(e => e.EventType)
                .HasConversion<string>();

            modelBuilder.Entity<Event>()
                .HasIndex(e => e.Season);

            modelBuilder.Entity<Event>()
                .HasOne(e => e.Venue)
                .WithMany(v => v.Events)
                .HasForeignKey(e => e.VenueId)
                .OnDelete(DeleteBehavior.SetNull);

            // Performance → Event
            modelBuilder.Entity<Performance>()
                .HasOne(p => p.Event)
                .WithMany(e => e.Performances)
                .HasForeignKey(p => p.EventId)
                .OnDelete(DeleteBehavior.Cascade);

            // Performance → Venue (override, no cascade conflict)
            modelBuilder.Entity<Performance>()
                .HasOne(p => p.Venue)
                .WithMany()
                .HasForeignKey(p => p.VenueId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<Performance>()
                .HasIndex(p => p.PerformanceDate);

            // Character → Event
            modelBuilder.Entity<Character>()
                .HasOne(c => c.Event)
                .WithMany(e => e.Characters)
                .HasForeignKey(c => c.EventId)
                .OnDelete(DeleteBehavior.Cascade);

            // EventContributor → Event
            modelBuilder.Entity<EventContributor>()
                .HasOne(ec => ec.Event)
                .WithMany(e => e.EventContributors)
                .HasForeignKey(ec => ec.EventId)
                .OnDelete(DeleteBehavior.Cascade);

            // EventContributor → Contributor
            modelBuilder.Entity<EventContributor>()
                .HasOne(ec => ec.Contributor)
                .WithMany(c => c.EventContributors)
                .HasForeignKey(ec => ec.ContributorId)
                .OnDelete(DeleteBehavior.Restrict);

            // EventContributor → Character (optional)
            modelBuilder.Entity<EventContributor>()
                .HasOne(ec => ec.Character)
                .WithMany(c => c.EventContributors)
                .HasForeignKey(ec => ec.CharacterId)
                .OnDelete(DeleteBehavior.NoAction);

            // Prevent duplicate contributor in the same role for the same event
            modelBuilder.Entity<EventContributor>()
                .HasIndex(ec => new { ec.EventId, ec.ContributorId, ec.Role })
                .IsUnique();
        }
    }
}