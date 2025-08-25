using Domain.Entities;
using Domain.Interfaces;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Infrastructure.Repositories
{
    public class PageRepository : IPageRepository
    {
        private readonly AppDbContext _db;
        public PageRepository(AppDbContext db) => _db = db;

        public async Task<IEnumerable<Page>> GetAllAsync()
            => await _db.Pages.AsNoTracking().OrderBy(p => p.Key).ToListAsync();

        public Task<Page?> GetByKeyAsync(string key)
            => _db.Pages.AsNoTracking().SingleOrDefaultAsync(p => p.Key == key);

        public async Task<Page> UpsertAsync(Page page)
        {
            var existing = await _db.Pages.SingleOrDefaultAsync(p => p.Key == page.Key);
            if (existing == null)
            {
                page.UpdatedUtc = DateTime.UtcNow;
                await _db.Pages.AddAsync(page);
            }
            else
            {
                existing.Title = page.Title;
                existing.Content = page.Content;
                existing.UpdatedUtc = DateTime.UtcNow;
            }

            await _db.SaveChangesAsync();
            return existing ?? page;
        }
    }
}
