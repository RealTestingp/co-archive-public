using System.Security.Claims;
using System.Text.Json;
using COArchive.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace COArchive.Infrastructure
{
    public class AuditSaveChangesInterceptor : SaveChangesInterceptor
    {
        private readonly IHttpContextAccessor _httpContextAccessor;

        public AuditSaveChangesInterceptor(IHttpContextAccessor httpContextAccessor)
        {
            _httpContextAccessor = httpContextAccessor;
        }

        public override InterceptionResult<int> SavingChanges(
            DbContextEventData eventData, InterceptionResult<int> result)
        {
            AddAuditEntries(eventData.Context);
            return base.SavingChanges(eventData, result);
        }

        public override ValueTask<InterceptionResult<int>> SavingChangesAsync(
            DbContextEventData eventData, InterceptionResult<int> result,
            CancellationToken cancellationToken = default)
        {
            AddAuditEntries(eventData.Context);
            return base.SavingChangesAsync(eventData, result, cancellationToken);
        }

        private void AddAuditEntries(DbContext? context)
        {
            if (context is null) return;

            var changedBy = GetCurrentUser();
            var auditLogs = new List<AuditLog>();

            foreach (var entry in context.ChangeTracker.Entries<IAuditable>())
            {
                if (entry.State is EntityState.Detached or EntityState.Unchanged)
                    continue;

                var action = entry.State switch
                {
                    EntityState.Added => "Created",
                    EntityState.Modified => "Updated",
                    EntityState.Deleted => "Deleted",
                    _ => null
                };
                if (action is null) continue;

                var log = new AuditLog
                {
                    TableName = entry.Metadata.GetTableName() ?? entry.Entity.GetType().Name,
                    RecordId = GetPrimaryKeyValue(entry),
                    Action = action,
                    ChangedBy = changedBy,
                    ChangedAt = DateTime.UtcNow
                };

                switch (entry.State)
                {
                    case EntityState.Added:
                        log.NewValues = JsonSerializer.Serialize(
                            entry.Properties.ToDictionary(p => p.Metadata.Name, p => p.CurrentValue));
                        break;

                    case EntityState.Deleted:
                        log.OldValues = JsonSerializer.Serialize(
                            entry.Properties.ToDictionary(p => p.Metadata.Name, p => p.OriginalValue));
                        break;

                    case EntityState.Modified:
                        var oldValues = new Dictionary<string, object?>();
                        var newValues = new Dictionary<string, object?>();
                        foreach (var prop in entry.Properties.Where(p => p.IsModified))
                        {
                            oldValues[prop.Metadata.Name] = prop.OriginalValue;
                            newValues[prop.Metadata.Name] = prop.CurrentValue;
                        }
                        // Skip no-op saves where nothing actually changed
                        if (oldValues.Count == 0) continue;

                        log.OldValues = JsonSerializer.Serialize(oldValues);
                        log.NewValues = JsonSerializer.Serialize(newValues);
                        break;
                }

                auditLogs.Add(log);
            }

            if (auditLogs.Count > 0)
            {
                context.Set<AuditLog>().AddRange(auditLogs);
            }
        }

        private static int GetPrimaryKeyValue(EntityEntry entry)
        {
            var key = entry.Metadata.FindPrimaryKey();
            if (key is null || key.Properties.Count != 1) return 0;

            var value = entry.Property(key.Properties[0].Name).CurrentValue;
            return value is int intValue ? intValue : 0;
        }

        private string GetCurrentUser()
        {
            var user = _httpContextAccessor.HttpContext?.User;

            if (user?.Identity?.IsAuthenticated != true)
                return "system"; // TODO: revisit once Entra auth is enabled

            // Entra ID JWTs typically expose the user via one of these claims
            return user.FindFirst("preferred_username")?.Value
                ?? user.FindFirst(ClaimTypes.Email)?.Value
                ?? user.FindFirst("oid")?.Value
                ?? user.Identity.Name
                ?? "unknown";
        }
    }
}