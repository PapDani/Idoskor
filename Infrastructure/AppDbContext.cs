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

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

            modelBuilder.Entity<Card>().HasData(
                new Card { Id = 1, Title = "Welcome", ImageUrl = "/images/welcome.jpg", ContentUrl = "/content/welcome" },
                new Card { Id = 2, Title = "About Us", ImageUrl = "/images/about.jpg", ContentUrl = "/content/about" },
                new Card { Id = 3, Title = "Contact", ImageUrl = "/images/contact.jpg", ContentUrl = "/content/contact" }
            );
        }
    }
}
