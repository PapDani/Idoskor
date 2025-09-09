using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Infrastructure;
using Domain.Entities;

namespace Api.Controllers;

public record CardDto(
    int Id,
    string Title,
    string? ImageUrl,
    string? ContentUrl,
    string? PageKey,
    DateTime CreatedUtc
);

public record UpsertCardDto(
    string Title,
    string? ImageUrl,
    string? ContentUrl
);

public record SetCardPageDto(string? PageKey);

// ⬇️ Egyedi név: NEM ütközik más controllerekkel
public record CardReorderDto(int Id, int Order);

[ApiController]
[Route("api/[controller]")]
public class CardsController : ControllerBase
{
    private readonly AppDbContext _db;
    public CardsController(AppDbContext db) => _db = db;

    // LISTA – sort: "created" (alap) vagy "manual" (admin DnD)
    [HttpGet]
    public async Task<ActionResult<IEnumerable<CardDto>>> List(
        [FromQuery] string? order = "desc",
        [FromQuery] string? sort = "created")
    {
        var q = _db.Cards.Include(c => c.Page).AsNoTracking();

        IOrderedQueryable<Card> ordered = string.Equals(sort, "manual", StringComparison.OrdinalIgnoreCase)
            ? q.OrderBy(c => c.Order).ThenBy(c => c.Id)
            : (order?.ToLowerInvariant() == "asc"
                ? q.OrderBy(c => c.CreatedUtc).ThenBy(c => c.Id)
                : q.OrderByDescending(c => c.CreatedUtc).ThenByDescending(c => c.Id));

        var result = await ordered
            .Select(c => new CardDto(
                c.Id, c.Title, c.ImageUrl, c.ContentUrl,
                c.Page != null ? c.Page.Key : null, c.CreatedUtc))
            .ToListAsync();

        return Ok(result);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<CardDto>> Get(int id)
    {
        var c = await _db.Cards.Include(x => x.Page).AsNoTracking()
            .SingleOrDefaultAsync(x => x.Id == id);
        if (c is null) return NotFound();

        return Ok(new CardDto(
            c.Id, c.Title, c.ImageUrl, c.ContentUrl, c.Page?.Key, c.CreatedUtc));
    }

    [HttpPost]
    public async Task<ActionResult<CardDto>> Create([FromBody] UpsertCardDto dto)
    {
        var c = new Card
        {
            Title = dto.Title,
            ImageUrl = dto.ImageUrl,
            ContentUrl = dto.ContentUrl,
            CreatedUtc = DateTime.UtcNow
        };
        _db.Cards.Add(c);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(Get), new { id = c.Id },
            new CardDto(c.Id, c.Title, c.ImageUrl, c.ContentUrl, null, c.CreatedUtc));
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpsertCardDto dto)
    {
        var c = await _db.Cards.FindAsync(id);
        if (c is null) return NotFound();

        c.Title = dto.Title;
        c.ImageUrl = dto.ImageUrl;
        c.ContentUrl = dto.ContentUrl;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // Cikk hozzárendelés / leválasztás
    [HttpPut("{id:int}/page")]
    public async Task<IActionResult> SetPage(int id, [FromBody] SetCardPageDto dto)
    {
        var card = await _db.Cards.Include(x => x.Page).SingleOrDefaultAsync(x => x.Id == id);
        if (card is null) return NotFound();

        if (string.IsNullOrWhiteSpace(dto.PageKey))
        {
            card.PageId = null; // leválasztás
        }
        else
        {
            var page = await _db.Pages.SingleOrDefaultAsync(p => p.Key == dto.PageKey);
            if (page is null) return BadRequest("PageKey not found.");
            card.PageId = page.Id;
        }

        await _db.SaveChangesAsync();
        return NoContent();
    }

    // Drag&drop sorrend mentése (admin)
    [HttpPost("reorder")]
    public async Task<IActionResult> Reorder([FromBody] List<CardReorderDto> items)
    {
        if (items is null || items.Count == 0) return BadRequest();

        var ids = items.Select(i => i.Id).ToHashSet();
        var cards = await _db.Cards.Where(c => ids.Contains(c.Id)).ToListAsync();

        foreach (var c in cards)
            c.Order = items.First(i => i.Id == c.Id).Order;

        await _db.SaveChangesAsync();
        return NoContent();
    }
}
