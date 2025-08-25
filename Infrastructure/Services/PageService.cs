using Domain.Entities;
using Domain.Interfaces;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Infrastructure.Services
{
	public class PageService : IPageService
	{
		private readonly IPageRepository _repo;
		public PageService(IPageRepository repo) => _repo = repo;

		public Task<IEnumerable<Page>> ListAsync() => _repo.GetAllAsync();
		public Task<Page?> GetAsync(string key) => _repo.GetByKeyAsync(key);
		public Task<Page> UpsertAsync(string key, string title, string content)
			=> _repo.UpsertAsync(new Page { Key = key, Title = title, Content = content });
	}
}
