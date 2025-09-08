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
    }
}
