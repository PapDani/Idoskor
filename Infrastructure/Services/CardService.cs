using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Domain.Entities;
using Domain.Interfaces;
using Microsoft.AspNetCore.Http;

namespace Infrastructure.Services
{
    public class CardService : ICardService
    {
        private readonly ICardRepository _repo;
        private readonly IFileStorageService _fileStorage;

        public CardService(ICardRepository repo, IFileStorageService fileStorage)
        {
            _repo = repo ?? throw new ArgumentNullException(nameof(repo));
            _fileStorage = fileStorage ?? throw new ArgumentNullException(nameof(fileStorage));
        }

        // Ha az interfészed úgy szól, hogy az imageFile kötelező, hagyd így.
        public async Task<Card> CreateAsync(string title, string contentUrl, IFormFile imageFile)
        {
            if (imageFile == null) throw new ArgumentNullException(nameof(imageFile));

            var imageUrl = await _fileStorage.SaveImageAsync(imageFile);
            var card = new Card
            {
                Title = title,
                ContentUrl = contentUrl,
                ImageUrl = imageUrl
            };

            await _repo.AddAsync(card);
            return card;
        }

        public async Task UpdateAsync(int id, string title, string contentUrl, IFormFile? imageFile)
        {
            var card = await _repo.GetByIdAsync(id)
                       ?? throw new KeyNotFoundException($"Card #{id} not found");

            // Új kép érkezett: régit (ha van) töröljük, újat feltöltjük
            if (imageFile != null)
            {
                await DeleteImageIfAnyAsync(card.ImageUrl);
                card.ImageUrl = await _fileStorage.SaveImageAsync(imageFile);
            }

            card.Title = title;
            card.ContentUrl = contentUrl;

            await _repo.UpdateAsync(card);
        }

        public async Task DeleteAsync(int id)
        {
            var card = await _repo.GetByIdAsync(id)
                       ?? throw new KeyNotFoundException($"Card #{id} not found");

            await DeleteImageIfAnyAsync(card.ImageUrl);

            // Ha a repository int-et vár, ez jó; ha entitást, akkor: await _repo.DeleteAsync(card);
            await _repo.DeleteAsync(id);
        }

        public Task<Card?> GetByIdAsync(int id) => _repo.GetByIdAsync(id);

        public async Task<IReadOnlyList<Card>> ListAsync()
        {
            var items = await _repo.GetAllAsync();
            return items.ToList();
        }

        // Null-safe képtörlés mindenhol ezt használd
        private Task DeleteImageIfAnyAsync(string? publicUrl) =>
            string.IsNullOrWhiteSpace(publicUrl)
                ? Task.CompletedTask
                : _fileStorage.DeleteImageAsync(publicUrl);
    }
}
