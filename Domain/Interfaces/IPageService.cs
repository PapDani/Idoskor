using Domain.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Domain.Interfaces
{
    public interface IPageService
    {
        Task<IEnumerable<Page>> ListAsync();
        Task<Page?> GetAsync(string key);
        Task<Page> UpsertAsync(string key, string title, string content);
    }
}
