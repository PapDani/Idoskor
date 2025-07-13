using Domain.Entities;
using Domain.Interfaces;
using Microsoft.AspNetCore.Http;
// ahol az AppDbContext/ICardRepository van

namespace Infrastructure.Services
{
    public class CardService : ICardService
    {
        private readonly ICardRepository _repo;
        private readonly IFileStorageService _files;

        public CardService(ICardRepository repo, IFileStorageService files)
        {
            _repo = repo;
            _files = files;
        }

        public async Task<Card> CreateAsync(string title, string contentUrl, IFormFile imageFile)
        {
            var imageUrl = await _files.SaveImageAsync(imageFile);
            var card = new Card { Title = title, ContentUrl = contentUrl, ImageUrl = imageUrl };
            await _repo.AddAsync(card);
            return card;
        }

        public async Task UpdateAsync(int id, string title, string contentUrl, IFormFile? imageFile)
        {
            var card = await _repo.GetByIdAsync(id)
                       ?? throw new KeyNotFoundException($"Card #{id} not found");

            if (imageFile != null)
            {
                await _files.DeleteImageAsync(card.ImageUrl);
                card.ImageUrl = await _files.SaveImageAsync(imageFile);
            }

            card.Title = title;
            card.ContentUrl = contentUrl;
            await _repo.UpdateAsync(card);
        }

        public async Task DeleteAsync(int id)
        {
            var card = await _repo.GetByIdAsync(id)
                       ?? throw new KeyNotFoundException($"Card #{id} not found");

            await _files.DeleteImageAsync(card.ImageUrl);
            await _repo.DeleteAsync(card.Id);
        }

        public Task<Card?> GetByIdAsync(int id) => _repo.GetByIdAsync(id);
        public async Task<IReadOnlyList<Card>> ListAsync()
        {
            var items = await _repo.GetAllAsync();
            return items.ToList();
        }
    }
}
