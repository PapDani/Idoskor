using Domain.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Domain.Interfaces
{
    public interface IPageRepository
    {
        Task<IEnumerable<Page>> GetAllAsync();
        Task<Page?> GetByKeyAsync(string key);
        Task<Page> UpsertAsync(Page page);
    }
}
