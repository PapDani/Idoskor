using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Infrastructure;
using Domain.Entities;
using Ganss.Xss;
using PageEntity = Domain.Entities.Page;

namespace Api.Controllers;

public record PageDto(string Key, string Title, string Content, DateTime UpdatedUtc);
public record UpdatePageDto(string Title, string Content);
public record PageWithMenuDto(string Key, string Title, DateTime UpdatedUtc, string[] MenuPaths);

[ApiController]
[Route("api/[controller]")]
public class PagesController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly HtmlSanitizer _sanitizer = new();

    public PagesController(AppDbContext db)
    {
        _db = db;
        // (opcionális) finomhangolás: engedjük az 'img' src, alt
        _sanitizer.AllowedTags.UnionWith(new[] { "img", "figure", "figcaption" });
        _sanitizer.AllowedSchemes.Add("data"); // ha base64-es képeket is engednél (Quill alapból nem)
        _sanitizer.AllowedAttributes.UnionWith(new[] { "src", "alt", "title" });
    }

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

    [HttpGet("admin-list")]
    public async Task<ActionResult<IEnumerable<PageWithMenuDto>>> AdminList()
    {
        var pages = await _db.Pages.AsNoTracking().OrderBy(p => p.Key).ToListAsync();

        var allMenu = await _db.MenuItems.AsNoTracking().ToListAsync();
        var byId = allMenu.ToDictionary(m => m.Id);
        string BuildPath(MenuItem item)
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
        page.Content = _sanitizer.Sanitize(dto.Content ?? string.Empty);
        page.UpdatedUtc = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return NoContent();
    }
}
