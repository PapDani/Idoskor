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

public record CreateMenuItemDto(
    string Label,
    string? Slug,
    int? ParentId,
    int Order,
    bool IsEnabled,
    string? PageKey
);

public record UpdateMenuItemDto(
    string Label,
    string? Slug,
    int? ParentId,
    int Order,
    bool IsEnabled,
    string? PageKey
);

public record ReorderItemDto(
    int Id,
    int? ParentId,
    int Order
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
            new List<MenuNodeDto>()));

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

    [HttpPost]
    public async Task<ActionResult<MenuNodeDto>> Create([FromBody] CreateMenuItemDto dto)
    {
        Page? page = null;
        if (!string.IsNullOrWhiteSpace(dto.PageKey))
            page = await _db.Pages.FirstOrDefaultAsync(p => p.Key == dto.PageKey);

        MenuItem? parent = null;
        if (dto.ParentId is int pid)
        {
            parent = await _db.MenuItems.FindAsync(pid);
            if (parent is null) return BadRequest("Parent not found.");
        }

        var item = new MenuItem
        {
            Label = dto.Label.Trim(),
            Slug = string.IsNullOrWhiteSpace(dto.Slug) ? null : dto.Slug.Trim(),
            ParentId = dto.ParentId,
            Order = dto.Order,
            IsEnabled = dto.IsEnabled,
            PageId = page?.Id
        };

        _db.MenuItems.Add(item);
        await _db.SaveChangesAsync();

        var result = new MenuNodeDto(
            item.Id, item.Label, item.Slug, item.IsEnabled,
            item.PageId, page?.Key, item.ParentId, item.Order, new List<MenuNodeDto>());

        return CreatedAtAction(nameof(GetTree), new { id = item.Id }, result);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateMenuItemDto dto)
    {
        var item = await _db.MenuItems.Include(m => m.Page).FirstOrDefaultAsync(m => m.Id == id);
        if (item is null) return NotFound();

        if (dto.ParentId == id) return BadRequest("Item cannot be its own parent.");

        if (dto.ParentId is int pid)
        {
            // tiltjuk a ciklikus szülõt: nem lehet a saját leszármazottja
            if (await IsDescendantAsync(id, pid)) return BadRequest("Cannot move under its descendant.");
            if (!await _db.MenuItems.AnyAsync(m => m.Id == pid)) return BadRequest("Parent not found.");
        }

        Page? page = null;
        if (!string.IsNullOrWhiteSpace(dto.PageKey))
        {
            page = await _db.Pages.FirstOrDefaultAsync(p => p.Key == dto.PageKey);
            if (page is null) return BadRequest("PageKey not found.");
        }

        item.Label = dto.Label?.Trim() ?? item.Label;
        item.Slug = string.IsNullOrWhiteSpace(dto.Slug) ? null : dto.Slug.Trim();
        item.ParentId = dto.ParentId;
        item.Order = dto.Order;
        item.IsEnabled = dto.IsEnabled;
        item.PageId = page?.Id;

        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var hasChildren = await _db.MenuItems.AnyAsync(m => m.ParentId == id);
        if (hasChildren) return BadRequest("Item has children. Delete or move them first.");

        var item = await _db.MenuItems.FindAsync(id);
        if (item is null) return NotFound();

        _db.MenuItems.Remove(item);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("reorder")]
    public async Task<IActionResult> Reorder([FromBody] IEnumerable<ReorderItemDto> changes)
    {
        var list = changes.ToList();
        var ids = list.Select(c => c.Id).ToHashSet();
        var items = await _db.MenuItems.Where(m => ids.Contains(m.Id)).ToListAsync();
        var byId = items.ToDictionary(m => m.Id);

        foreach (var c in list)
        {
            if (!byId.TryGetValue(c.Id, out var item)) return BadRequest($"Item {c.Id} not found.");
            if (c.ParentId == c.Id) return BadRequest("Item cannot be its own parent.");
            if (c.ParentId is int pid)
            {
                if (await IsDescendantAsync(item.Id, pid)) return BadRequest("Cannot move under its descendant.");
                if (!await _db.MenuItems.AnyAsync(m => m.Id == pid)) return BadRequest($"Parent {pid} not found.");
            }
            item.ParentId = c.ParentId;
            item.Order = c.Order;
        }

        await _db.SaveChangesAsync();
        return NoContent();
    }

    private async Task<bool> IsDescendantAsync(int ancestorId, int nodeId)
    {
        // ellenõrizzük, hogy nodeId felmenõi közt szerepel-e ancestorId
        var current = await _db.MenuItems.AsNoTracking().FirstOrDefaultAsync(m => m.Id == nodeId);
        while (current?.ParentId is int pid)
        {
            if (pid == ancestorId) return true;
            current = await _db.MenuItems.AsNoTracking().FirstOrDefaultAsync(m => m.Id == pid);
        }
        return false;
    }
}
