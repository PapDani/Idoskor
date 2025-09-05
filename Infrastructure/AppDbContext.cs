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

        protected override void OnModelCreating(ModelBuilder b)
        {
            base.OnModelCreating(b);

            b.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

            b.Entity<Card>().HasData(
                new Card { Id = 1, Title = "Welcome", ImageUrl = "/images/welcome.jpg", ContentUrl = "/content/welcome" },
                new Card { Id = 2, Title = "About Us", ImageUrl = "/images/about.jpg", ContentUrl = "/content/about" },
                new Card { Id = 3, Title = "Contact", ImageUrl = "/images/contact.jpg", ContentUrl = "/content/contact" }
            );

            b.Entity<Page>(e =>
            {
                e.ToTable("Pages");               // tábla neve
                e.HasKey(x => x.Id);
                e.Property(x => x.Key)
                    .IsRequired()
                    .HasMaxLength(100);
                e.HasIndex(x => x.Key).IsUnique();
                e.Property(x => x.Title).HasMaxLength(200);
                e.Property(x => x.Content).HasColumnType("nvarchar(max)");
                e.Property(x => x.UpdatedUtc).HasDefaultValueSql("GETUTCDATE()");
            });
        }
    }
}
