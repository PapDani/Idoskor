using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Interfaces
{
    using Domain.Entities;
    using System.Collections.Generic;
    using System.Threading.Tasks;

    public interface ICardRepository
    {
        Task<IEnumerable<Card>> GetAllAsync();
        Task<Card?> GetByIdAsync(int id);
        Task<Card> AddAsync(Card card);
        Task<Card?> UpdateAsync(Card card);
        Task<bool> DeleteAsync(int id);
    }
}
