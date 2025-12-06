using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Infrastructure
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options)
        {
        }

        public DbSet<Card> Cards { get; set; } = null!;
        public DbSet<Page> Pages => Set<Page>();
        public DbSet<MenuItem> MenuItems => Set<MenuItem>();
        public DbSet<Album> Albums => Set<Album>();
        public DbSet<Photo> Photos => Set<Photo>();


        protected override void OnModelCreating(ModelBuilder b)
        {
            base.OnModelCreating(b);

            b.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
        }

        public override int SaveChanges()
        {
            SetCreatedUtcForAddedEntities();
            return base.SaveChanges();
        }

        public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            SetCreatedUtcForAddedEntities();
            return base.SaveChangesAsync(cancellationToken);
        }

        private void SetCreatedUtcForAddedEntities()
        {
            // Ha több entitásodban is van CreatedUtc, ide felveheted őket.
            foreach (var e in ChangeTracker.Entries())
            {
                if (e.State == EntityState.Added)
                {
                    var prop = e.Properties.FirstOrDefault(p =>
                        string.Equals(p.Metadata.Name, "CreatedUtc", StringComparison.OrdinalIgnoreCase));
                    if (prop is { CurrentValue: null } or { CurrentValue: DateTime dt and { Year: 1 } })
                    {
                        prop.CurrentValue = DateTime.UtcNow;
                    }
                }
            }
        }
    }
}
