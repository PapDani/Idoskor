using Domain.Entities;
using Microsoft.AspNetCore.Http;

namespace Domain.Interfaces
{
    public interface ICardService
    {
        Task<Card> CreateAsync(string title, string contentUrl, IFormFile imageFile);
        Task UpdateAsync(int id, string title, string contentUrl, IFormFile? imageFile);
        Task DeleteAsync(int id);
        Task<Card?> GetByIdAsync(int id);
        Task<IReadOnlyList<Card>> ListAsync();
    }
}
