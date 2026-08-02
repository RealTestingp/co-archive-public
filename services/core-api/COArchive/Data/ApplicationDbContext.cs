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
        public DbSet<Production> Productions => Set<Production>();
        public DbSet<Performance> Performances => Set<Performance>();
        public DbSet<Appearance> Appearances => Set<Appearance>();

        // System tables
        public DbSet<Notification> Notifications => Set<Notification>();
        public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);


            // ── Many-to-many join tables ──────────────────────────────────

            // Opera ↔ Composer — one opera has many composers, one composer wrote many operas
            modelBuilder.Entity<Opera>()
                .HasMany(o => o.Composers)
                .WithMany(c => c.Operas)
                .UsingEntity(j => j.ToTable("OperaComposer"));

            // Opera ↔ Librettist — one opera has many librettists, one librettist wrote many operas
            modelBuilder.Entity<Opera>()
                .HasMany(o => o.Librettists)
                .WithMany(l => l.Operas)
                .UsingEntity(j => j.ToTable("OperaLibrettist"));

            // Person ↔ Nationality — one person can have many nationalities, one nationality belongs to many persons
            modelBuilder.Entity<Person>()
                .HasMany(p => p.Nationalities)
                .WithMany(n => n.Persons)
                .UsingEntity(j => j.ToTable("PersonNationality"));

            // ── Language — two FKs pointing to same table ─────────────────
            // Must be explicit — EF Core can't auto-resolve two FKs
            // pointing to the same table

            // One Language → many Productions (written in that language)
            modelBuilder.Entity<Production>()
                .HasOne(e => e.WrittenLanguage)
                .WithMany(l => l.WrittenLanguageProductions)
                .HasForeignKey(e => e.WrittenLanguageId)
                .OnDelete(DeleteBehavior.Restrict);

            // One Language → many Productions (sung in that language)
            modelBuilder.Entity<Production>()
                .HasOne(e => e.SungLanguage)
                .WithMany(l => l.SungLanguageProductions)
                .HasForeignKey(e => e.SungLanguageId)
                .OnDelete(DeleteBehavior.Restrict);

            // ── Events relationships ───────────────────────────────────────

            // One Season → many Productions
            modelBuilder.Entity<Production>()
                .HasOne(e => e.Season)
                .WithMany(s => s.Productions)
                .HasForeignKey(e => e.SeasonId)
                .OnDelete(DeleteBehavior.Restrict);
            // Restrict — can't delete a Season that still has Events

            // One EventType → many Productions
            modelBuilder.Entity<Production>()
                .HasOne(e => e.EventType)
                .WithMany(et => et.Productions)
                .HasForeignKey(e => e.EventTypeId)
                .OnDelete(DeleteBehavior.Restrict);
            // Restrict — can't delete an EventType that still has Events

            // One Venue → many Productions
            modelBuilder.Entity<Production>()
                .HasOne(e => e.Venue)
                .WithMany(v => v.Productions)
                .HasForeignKey(e => e.VenueId)
                .OnDelete(DeleteBehavior.Restrict);
            // Restrict — can't delete a Venue that still has Events

            // One Opera → many Productions
            modelBuilder.Entity<Production>()
                .HasOne(e => e.Opera)
                .WithMany(o => o.Productions)
                .HasForeignKey(e => e.OperaId)
                .OnDelete(DeleteBehavior.Restrict);
            // Restrict — can't delete an Opera that still has Events

            // ── Performance relationships ──────────────────────────────────

            // One Production → many Performances
            modelBuilder.Entity<Performance>()
                .HasOne(p => p.Production)
                .WithMany(e => e.Performances)
                .HasForeignKey(p => p.ProductionId)
                .OnDelete(DeleteBehavior.Cascade);
            // Cascade — deleting a Production deletes its Performances too

            // ── Appearance relationships ───────────────────────────────────

            // One Production → many Appearances
            modelBuilder.Entity<Appearance>()
                .HasOne(a => a.Production)
                .WithMany(e => e.Appearances)
                .HasForeignKey(a => a.ProductionId)
                .OnDelete(DeleteBehavior.Cascade);
            // Cascade — deleting a Production deletes its Appearances too

            // One Person → many Appearances
            modelBuilder.Entity<Appearance>()
                .HasOne(a => a.Person)
                .WithMany(p => p.Appearances)
                .HasForeignKey(a => a.PersonId)
                .OnDelete(DeleteBehavior.Restrict);
            // Restrict — can't delete a Person who has Appearances

            // One ContributorType → many Appearances
            modelBuilder.Entity<Appearance>()
                .HasOne(a => a.ContributorType)
                .WithMany(ct => ct.Appearances)
                .HasForeignKey(a => a.ContributorTypeId)
                .OnDelete(DeleteBehavior.Restrict);

            // One Position → many Appearances
            modelBuilder.Entity<Appearance>()
                .HasOne(a => a.Position)
                .WithMany(p => p.Appearances)
                .HasForeignKey(a => a.PositionId)
                .OnDelete(DeleteBehavior.Restrict);

            // One Character → many Appearances
            modelBuilder.Entity<Appearance>()
                .HasOne(a => a.Character)
                .WithMany(c => c.Appearances)
                .HasForeignKey(a => a.CharacterId)
                .OnDelete(DeleteBehavior.Restrict);

            // ── Character relationships ────────────────────────────────────

            // One Opera → many Characters
            modelBuilder.Entity<Character>()
                .HasOne(c => c.Opera)
                .WithMany(o => o.Characters)
                .HasForeignKey(c => c.OperaId)
                .OnDelete(DeleteBehavior.Restrict);
            // Restrict — can't delete an Opera that still has Characters

            // ── Position relationships ─────────────────────────────────────

            // One ContributorType → many Positions
            modelBuilder.Entity<Position>()
                .HasOne(p => p.ContributorType)
                .WithMany(ct => ct.Positions)
                .HasForeignKey(p => p.ContributorTypeId)
                .OnDelete(DeleteBehavior.Restrict);

            // ── Person relationships ───────────────────────────────────────

            // One VoiceType → many Persons
            modelBuilder.Entity<Person>()
                .HasOne(p => p.VoiceType)
                .WithMany(vt => vt.Persons)
                .HasForeignKey(p => p.VoiceTypeId)
                .OnDelete(DeleteBehavior.Restrict);

            // ── Notification relationships ─────────────────────────────────

            // One Person → many Notifications
            modelBuilder.Entity<Notification>()
                .HasOne(n => n.Person)
                .WithMany(p => p.Notifications)
                .HasForeignKey(n => n.PersonId)
                .OnDelete(DeleteBehavior.Cascade);
            // Cascade — deleting a Person deletes their Notifications too
        }
    }
}