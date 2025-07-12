using Domain.Entities;
using Domain.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Infrastructure.Services
{
    public class CardService : ICardService
    {
        private readonly ICardRepository _repo;
        public CardService(ICardRepository repo) => _repo = repo;

        public Task<IEnumerable<Card>> GetAllAsync() => _repo.GetAllAsync();
        public Task<Card?> GetByIdAsync(int id) => _repo.GetByIdAsync(id);

        public Task<Card> CreateAsync(Card card) => _repo.AddAsync(card);

        public async Task<Card?> UpdateAsync(int id, Card card)
        {
            card.Id = id;
            return await _repo.UpdateAsync(card);
        }

        public Task<bool> DeleteAsync(int id) => _repo.DeleteAsync(id);
    }
}
