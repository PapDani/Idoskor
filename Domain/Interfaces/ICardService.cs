using Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Interfaces
{
    public interface ICardService
    {
        Task<IEnumerable<Card>> GetAllAsync();
        Task<Card?> GetByIdAsync(int id);
        Task<Card> CreateAsync(Card card);
        Task<Card?> UpdateAsync(int id, Card card);
        Task<bool> DeleteAsync(int id);
    }
}
