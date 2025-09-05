using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Infrastructure;
using Domain.Entities;
using PageEntity = Domain.Entities.Page;

namespace Api.Controllers;

public record PageDto(string Key, string Title, string Content, DateTime UpdatedUtc);
public record UpdatePageDto(string Title, string Content);

// �J: admin list�hoz � a men�pontok ��tvonal�t� is visszaadjuk (pl. "�dv�z�lj�k! / R�lunk...")
public record PageWithMenuDto(string Key, string Title, DateTime UpdatedUtc, string[] MenuPaths);

[ApiController]
[Route("api/[controller]")]
public class PagesController : ControllerBase
{
    private readonly AppDbContext _db;
    public PagesController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<PageDto>>> List()
    {
        var items = await _db.Pages
            .AsNoTracking()
            .OrderBy(p => p.Key)
            .Select(p => new PageDto(p.Key, p.Title, p.Content, p.UpdatedUtc))
            .ToListAsync();

        return Ok(items);
    }

    // �J: Admin list � men�hivatkoz�sokkal
    [HttpGet("admin-list")]
    public async Task<ActionResult<IEnumerable<PageWithMenuDto>>> AdminList()
    {
        var pages = await _db.Pages.AsNoTracking().OrderBy(p => p.Key).ToListAsync();

        // �sszes men�pont a fa-�tvonal kisz�m�t�s�hoz
        var allMenu = await _db.MenuItems.AsNoTracking().ToListAsync();
        var byId = allMenu.ToDictionary(m => m.Id);
        string BuildPath(Domain.Entities.MenuItem item)
        {
            var parts = new List<string>();
            var cur = item;
            while (cur is not null)
            {
                parts.Add(cur.Label);
                if (cur.ParentId is int pid && byId.TryGetValue(pid, out var parent)) cur = parent;
                else break;
            }
            parts.Reverse();
            return string.Join(" / ", parts);
        }

        // PageId -> men� pathok
        var pathsByPageId = allMenu
            .Where(m => m.PageId != null)
            .GroupBy(m => m.PageId!.Value)
            .ToDictionary(g => g.Key, g => g.Select(BuildPath).ToArray());

        var result = pages.Select(p =>
        {
            var paths = pathsByPageId.TryGetValue(p.Id, out var arr) ? arr : Array.Empty<string>();
            return new PageWithMenuDto(p.Key, p.Title, p.UpdatedUtc, paths);
        }).ToList();

        return Ok(result);
    }

    [HttpGet("{key}")]
    public async Task<ActionResult<PageDto>> GetByKey(string key)
    {
        var page = await _db.Pages.AsNoTracking().SingleOrDefaultAsync(p => p.Key == key);
        if (page is null) return NotFound();

        var dto = new PageDto(page.Key, page.Title, page.Content, page.UpdatedUtc);
        return Ok(dto);
    }

    // PUT upsert
    [HttpPut("{key}")]
    public async Task<IActionResult> Update(string key, [FromBody] UpdatePageDto dto)
    {
        var page = await _db.Pages.SingleOrDefaultAsync(p => p.Key == key);
        if (page is null)
        {
            page = new PageEntity { Key = key };
            _db.Pages.Add(page);
        }

        page.Title = dto.Title ?? string.Empty;
        page.Content = dto.Content ?? string.Empty;
        page.UpdatedUtc = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return NoContent();
    }
}
