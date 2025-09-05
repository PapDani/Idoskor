using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Infrastructure;
using Domain.Entities;
using PageEntity = Domain.Entities.Page;

namespace Api.Controllers;

public record PageDto(string Key, string Title, string Content, DateTime UpdatedUtc);
public record UpdatePageDto(string Title, string Content);

[ApiController]
[Route("api/[controller]")]
public class PagesController : ControllerBase
{
    private readonly AppDbContext _db;
    public PagesController(AppDbContext db) => _db = db;

    // LISTA: admin oldallistának
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

    // GET /api/Pages/{key}
    [HttpGet("{key}")]
    public async Task<ActionResult<PageDto>> GetByKey(string key)
    {
        var page = await _db.Pages.AsNoTracking().SingleOrDefaultAsync(p => p.Key == key);
        if (page is null) return NotFound();

        var dto = new PageDto(page.Key, page.Title, page.Content, page.UpdatedUtc);
        return Ok(dto);
    }

    // PUT upsert: ha nincs, létrehozza; ha van, frissíti
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
