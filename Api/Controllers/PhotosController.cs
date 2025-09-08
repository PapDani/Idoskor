using Infrastructure;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Api.Controllers;

public record UpdatePhotoDto(string? Title, string? Description, bool IsVisible);

[ApiController]
[Route("api/[controller]")]
public class PhotosController : ControllerBase
{
    private readonly AppDbContext _db;
    public PhotosController(AppDbContext db) => _db = db;

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdatePhotoDto dto)
    {
        var p = await _db.Photos.FindAsync(id);
        if (p is null) return NotFound();
        p.Title = dto.Title;
        p.Description = dto.Description;
        p.IsVisible = dto.IsVisible;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var p = await _db.Photos.FindAsync(id);
        if (p is null) return NotFound();
        _db.Photos.Remove(p);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
