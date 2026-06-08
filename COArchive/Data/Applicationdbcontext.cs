using Microsoft.EntityFrameworkCore;
using COArchive.Models;

namespace COArchive.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options) { }

        // ── DbSets ────────────────────────────────────────────────────────
        // Lookup tables
        public DbSet<Season> Seasons => Set<Season>();
        public DbSet<EventType> EventTypes => Set<EventType>();
        public DbSet<Venue> Venues => Set<Venue>();
        public DbSet<Language> Languages => Set<Language>();
        public DbSet<VoiceType> VoiceTypes => Set<VoiceType>();
        public DbSet<Nationality> Nationalities => Set<Nationality>();
        public DbSet<Composer> Composers => Set<Composer>();
        public DbSet<Librettist> Librettists => Set<Librettist>();
        public DbSet<Opera> Operas => Set<Opera>();
        public DbSet<Character> Characters => Set<Character>();
        public DbSet<ContributorType> ContributorTypes => Set<ContributorType>();
        public DbSet<Position> Positions => Set<Position>();

        // Core tables
        public DbSet<Person> Persons => Set<Person>();
        public DbSet<Events> Events => Set<Events>();
        public DbSet<Performance> Performances => Set<Performance>();
        public DbSet<Appearance> Appearances => Set<Appearance>();

        // System tables
        public DbSet<Notification> Notifications => Set<Notification>();
        public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);


            // ── Many-to-many join tables ──────────────────────────────────

            // Opera ↔ Composer
            modelBuilder.Entity<Opera>()
                .HasMany(o => o.Composers)
                .WithMany(c => c.Operas)
                .UsingEntity(j => j.ToTable("OperaComposer"));

            // Opera ↔ Librettist
            modelBuilder.Entity<Opera>()
                .HasMany(o => o.Librettists)
                .WithMany(l => l.Operas)
                .UsingEntity(j => j.ToTable("OperaLibrettist"));

            // Person ↔ Nationality
            modelBuilder.Entity<Person>()
                .HasMany(p => p.Nationalities)
                .WithMany(n => n.Persons)
                .UsingEntity(j => j.ToTable("PersonNationality"));

            // ── Language — two FKs pointing to same table ─────────────────
            // Must be explicit — EF Core can't auto-resolve two FKs
            // pointing to the same table

            modelBuilder.Entity<Events>()
                .HasOne(e => e.WrittenLanguage)
                .WithMany(l => l.WrittenLanguageEvents)
                .HasForeignKey(e => e.WrittenLanguageId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Events>()
                .HasOne(e => e.SungLanguage)
                .WithMany(l => l.SungLanguageEvents)
                .HasForeignKey(e => e.SungLanguageId)
                .OnDelete(DeleteBehavior.Restrict);

            // ── Events relationships ───────────────────────────────────────

            modelBuilder.Entity<Events>()
                .HasOne(e => e.Season)
                .WithMany(s => s.Events)
                .HasForeignKey(e => e.SeasonId)
                .OnDelete(DeleteBehavior.Restrict);
            // Restrict — can't delete a Season that still has Events

            modelBuilder.Entity<Events>()
                .HasOne(e => e.EventType)
                .WithMany(et => et.Events)
                .HasForeignKey(e => e.EventTypeId)
                .OnDelete(DeleteBehavior.Restrict);
            // Restrict — can't delete an EventType that still has Events

            modelBuilder.Entity<Events>()
                .HasOne(e => e.Venue)
                .WithMany(v => v.Events)
                .HasForeignKey(e => e.VenueId)
                .OnDelete(DeleteBehavior.Restrict);
            // Restrict — can't delete a Venue that still has Events

            modelBuilder.Entity<Events>()
                .HasOne(e => e.Opera)
                .WithMany(o => o.Events)
                .HasForeignKey(e => e.OperaId)
                .OnDelete(DeleteBehavior.Restrict);
            // Restrict — can't delete an Opera that still has Events

            // ── Performance relationships ──────────────────────────────────

            modelBuilder.Entity<Performance>()
                .HasOne(p => p.Event)
                .WithMany(e => e.Performances)
                .HasForeignKey(p => p.EventId)
                .OnDelete(DeleteBehavior.Cascade);
            // Cascade — deleting an Event deletes its Performances too

            // ── Appearance relationships ───────────────────────────────────

            modelBuilder.Entity<Appearance>()
                .HasOne(a => a.Event)
                .WithMany(e => e.Appearances)
                .HasForeignKey(a => a.EventId)
                .OnDelete(DeleteBehavior.Cascade);
            // Cascade — deleting an Event deletes its Appearances too

            modelBuilder.Entity<Appearance>()
                .HasOne(a => a.Person)
                .WithMany(p => p.Appearances)
                .HasForeignKey(a => a.PersonId)
                .OnDelete(DeleteBehavior.Restrict);
            // Restrict — can't delete a Person who has Appearances

            modelBuilder.Entity<Appearance>()
                .HasOne(a => a.ContributorType)
                .WithMany(ct => ct.Appearances)
                .HasForeignKey(a => a.ContributorTypeId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Appearance>()
                .HasOne(a => a.Position)
                .WithMany(p => p.Appearances)
                .HasForeignKey(a => a.PositionId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Appearance>()
                .HasOne(a => a.Character)
                .WithMany(c => c.Appearances)
                .HasForeignKey(a => a.CharacterId)
                .OnDelete(DeleteBehavior.Restrict);

            // ── Character relationships ────────────────────────────────────

            modelBuilder.Entity<Character>()
                .HasOne(c => c.Opera)
                .WithMany(o => o.Characters)
                .HasForeignKey(c => c.OperaId)
                .OnDelete(DeleteBehavior.Restrict);
            // Restrict — can't delete an Opera that still has Characters

            // ── Position relationships ─────────────────────────────────────

            modelBuilder.Entity<Position>()
                .HasOne(p => p.ContributorType)
                .WithMany(ct => ct.Positions)
                .HasForeignKey(p => p.ContributorTypeId)
                .OnDelete(DeleteBehavior.Restrict);

            // ── Person relationships ───────────────────────────────────────

            modelBuilder.Entity<Person>()
                .HasOne(p => p.VoiceType)
                .WithMany(vt => vt.Persons)
                .HasForeignKey(p => p.VoiceTypeId)
                .OnDelete(DeleteBehavior.Restrict);

            // ── Notification relationships ─────────────────────────────────

            modelBuilder.Entity<Notification>()
                .HasOne(n => n.Person)
                .WithMany(p => p.Notifications)
                .HasForeignKey(n => n.PersonId)
                .OnDelete(DeleteBehavior.Cascade);
            // Cascade — deleting a Person deletes their Notifications too
        }
    }
}