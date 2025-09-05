using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Infrastructure;
using Domain.Entities;

namespace Api.Controllers;

public record MenuNodeDto(
    int Id, string Label, string? Slug, bool IsEnabled,
    int? PageId, string? PageKey, int? ParentId, int Order,
    List<MenuNodeDto> Children
);

[ApiController]
[Route("api/[controller]")]
public class MenuController : ControllerBase
{
    private readonly AppDbContext _db;
    public MenuController(AppDbContext db) => _db = db;

    [HttpGet("tree")]
    public async Task<ActionResult<IEnumerable<MenuNodeDto>>> GetTree()
    {
        var items = await _db.MenuItems
            .Include(m => m.Page)
            .AsNoTracking()
            .OrderBy(m => m.ParentId).ThenBy(m => m.Order)
            .ToListAsync();

        var dict = items.ToDictionary(m => m.Id, m => new MenuNodeDto(
            m.Id, m.Label, m.Slug, m.IsEnabled,
            m.PageId, m.Page?.Key, m.ParentId, m.Order,
            new List<MenuNodeDto>()
        ));

        List<MenuNodeDto> roots = new();
        foreach (var m in items)
        {
            var node = dict[m.Id];
            if (m.ParentId is null) roots.Add(node);
            else if (dict.TryGetValue(m.ParentId.Value, out var parent))
                parent.Children.Add(node);
        }

        return Ok(roots);
    }

    [HttpGet("by-page/{key}")]
    public async Task<ActionResult<IEnumerable<MenuNodeDto>>> GetByPage(string key)
    {
        var res = await _db.MenuItems
            .Include(m => m.Page)
            .Where(m => m.Page != null && m.Page.Key == key)
            .OrderBy(m => m.ParentId).ThenBy(m => m.Order)
            .Select(m => new MenuNodeDto(
                m.Id, m.Label, m.Slug, m.IsEnabled,
                m.PageId, m.Page!.Key, m.ParentId, m.Order, new List<MenuNodeDto>()))
            .ToListAsync();

        return Ok(res);
    }
}
