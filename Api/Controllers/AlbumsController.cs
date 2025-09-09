using Domain.Entities;
using Infrastructure;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Api.Controllers;

public record AlbumListItemDto(int Id, string Title, string Slug, string? CoverImageUrl, bool IsPublished, int PhotoCount, int Order);
public record AlbumDto(int Id, string Title, string Slug, string? Description, string? CoverImageUrl, bool IsPublished, int Order, DateTime CreatedUtc, List<PhotoDto> Photos);
public record PhotoDto(int Id, string ImageUrl, string? Title, string? Description, bool IsVisible, int Order, DateTime CreatedUtc);

public record CreateAlbumDto(string Title, string Slug, string? Description);
public record UpdateAlbumDto(string Title, string Slug, string? Description, bool IsPublished);
public record AlbumReorderDto(int Id, int Order);
public record SetCoverDto(int PhotoId);
public record AddPhotosDto(List<NewPhoto> Photos);
public record NewPhoto(string ImageUrl, string? Title, string? Description);

[ApiController]
[Route("api/[controller]")]
public class AlbumsController : ControllerBase
{
    private readonly AppDbContext _db;
    public AlbumsController(AppDbContext db) => _db = db;

    // Publikus: album lista (csak publikáltak)
    [HttpGet]
    public async Task<ActionResult<IEnumerable<AlbumListItemDto>>> PublicList()
    {
        var data = await _db.Albums
            .AsNoTracking()
            .Where(a => a.IsPublished)
            .OrderBy(a => a.Order).ThenBy(a => a.Id)
            .Select(a => new AlbumListItemDto(
                a.Id, a.Title, a.Slug, a.CoverImageUrl, a.IsPublished,
                _db.Photos.Count(p => p.AlbumId == a.Id && p.IsVisible),
                a.Order))
            .ToListAsync();

        return Ok(data);
    }

    // Publikus: album részletek slug alapján (csak publikált)
    [HttpGet("{slug}")]
    public async Task<ActionResult<AlbumDto>> GetBySlug(string slug)
    {
        var a = await _db.Albums
            .Include(x => x.Photos.Where(p => p.IsVisible))
            .AsNoTracking()
            .SingleOrDefaultAsync(x => x.Slug == slug && x.IsPublished);

        if (a is null) return NotFound();

        return Ok(new AlbumDto(
            a.Id, a.Title, a.Slug, a.Description, a.CoverImageUrl, a.IsPublished, a.Order, a.CreatedUtc,
            a.Photos.OrderBy(p => p.Order).ThenBy(p => p.Id)
             .Select(p => new PhotoDto(p.Id, p.ImageUrl, p.Title, p.Description, p.IsVisible, p.Order, p.CreatedUtc))
             .ToList()
        ));
    }

    // Admin: album lista (minden)
    [HttpGet("admin")]
    public async Task<ActionResult<IEnumerable<AlbumListItemDto>>> AdminList()
    {
        var data = await _db.Albums
            .AsNoTracking()
            .OrderBy(a => a.Order).ThenBy(a => a.Id)
            .Select(a => new AlbumListItemDto(
                a.Id, a.Title, a.Slug, a.CoverImageUrl, a.IsPublished,
                _db.Photos.Count(p => p.AlbumId == a.Id),
                a.Order))
            .ToListAsync();

        return Ok(data);
    }

    [HttpPost]
    public async Task<ActionResult<AlbumListItemDto>> Create([FromBody] CreateAlbumDto dto)
    {
        if (await _db.Albums.AnyAsync(a => a.Slug == dto.Slug))
            return BadRequest("Slug already exists.");

        var a = new Album
        {
            Title = dto.Title,
            Slug = dto.Slug,
            Description = dto.Description,
            IsPublished = true
        };
        _db.Albums.Add(a);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetBySlug), new { slug = a.Slug },
            new AlbumListItemDto(a.Id, a.Title, a.Slug, a.CoverImageUrl, a.IsPublished, 0, a.Order));
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateAlbumDto dto)
    {
        var a = await _db.Albums.FindAsync(id);
        if (a is null) return NotFound();

        if (!string.Equals(a.Slug, dto.Slug, StringComparison.OrdinalIgnoreCase) &&
            await _db.Albums.AnyAsync(x => x.Slug == dto.Slug))
            return BadRequest("Slug already exists.");

        a.Title = dto.Title;
        a.Slug = dto.Slug;
        a.Description = dto.Description;
        a.IsPublished = dto.IsPublished;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var a = await _db.Albums.FindAsync(id);
        if (a is null) return NotFound();
        _db.Albums.Remove(a);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("reorder")]
    public async Task<IActionResult> Reorder([FromBody] List<AlbumReorderDto> items)
    {
        var ids = items.Select(i => i.Id).ToHashSet();
        var albums = await _db.Albums.Where(a => ids.Contains(a.Id)).ToListAsync();
        foreach (var a in albums)
        {
            a.Order = items.First(i => i.Id == a.Id).Order;
        }
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPut("{id:int}/cover")]
    public async Task<IActionResult> SetCover(int id, [FromBody] SetCoverDto dto)
    {
        var photo = await _db.Photos.AsNoTracking().SingleOrDefaultAsync(p => p.Id == dto.PhotoId && p.AlbumId == id);
        if (photo is null) return NotFound("Photo not found in this album.");
        var a = await _db.Albums.FindAsync(id);
        if (a is null) return NotFound();
        a.CoverImageUrl = photo.ImageUrl;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("{id:int}/photos")]
    public async Task<IActionResult> AddPhotos(int id, [FromBody] AddPhotosDto dto)
    {
        if (!await _db.Albums.AnyAsync(a => a.Id == id)) return NotFound("Album not found");
        var maxOrder = await _db.Photos.Where(p => p.AlbumId == id).MaxAsync(p => (int?)p.Order) ?? -1;
        int start = maxOrder + 1;

        foreach (var p in dto.Photos)
        {
            _db.Photos.Add(new Photo
            {
                AlbumId = id,
                ImageUrl = p.ImageUrl,
                Title = p.Title,
                Description = p.Description,
                Order = start++
            });
        }
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("{id:int}/photos/reorder")]
    public async Task<IActionResult> ReorderPhotos(int id, [FromBody] List<AlbumReorderDto> items)
    {
        var ids = items.Select(i => i.Id).ToHashSet();
        var photos = await _db.Photos.Where(p => p.AlbumId == id && ids.Contains(p.Id)).ToListAsync();
        foreach (var p in photos) p.Order = items.First(i => i.Id == p.Id).Order;
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
