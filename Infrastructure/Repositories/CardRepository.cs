using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Infrastructure.Repositories
{
    using Domain.Entities;
    using Domain.Interfaces;
    using Microsoft.EntityFrameworkCore;
    using System.Collections.Generic;
    using System.Threading.Tasks;

    public class CardRepository : ICardRepository
    {
        private readonly AppDbContext _ctx;
        public CardRepository(AppDbContext ctx) => _ctx = ctx;

        public async Task<IEnumerable<Card>> GetAllAsync() =>
            await _ctx.Cards.AsNoTracking().ToListAsync();

        public async Task<Card?> GetByIdAsync(int id) =>
            await _ctx.Cards.FindAsync(id);

        public async Task<Card> AddAsync(Card card)
        {
            _ctx.Cards.Add(card);
            await _ctx.SaveChangesAsync();
            return card;
        }

        public async Task<Card?> UpdateAsync(Card card)
        {
            var existing = await _ctx.Cards.FindAsync(card.Id);
            if (existing is null) return null;
            existing.Title = card.Title;
            existing.ImageUrl = card.ImageUrl;
            existing.ContentUrl = card.ContentUrl;
            await _ctx.SaveChangesAsync();
            return existing;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var e = await _ctx.Cards.FindAsync(id);
            if (e is null) return false;
            _ctx.Cards.Remove(e);
            await _ctx.SaveChangesAsync();
            return true;
        }
    }
}
