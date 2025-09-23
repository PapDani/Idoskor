using Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UploadsController : ControllerBase
{
    private readonly IWebHostEnvironment _env;
    private readonly ImageVariantService _variants;

    public UploadsController(IWebHostEnvironment env, ImageVariantService variants)
    {
        _env = env;
        _variants = variants;
    }

    // MEGLÉVŐ: egyszerű feltöltés – egyetlen URL-t ad vissza (visszafelé kompatibilitás)
    [HttpPost("image")]
    [RequestSizeLimit(30_000_000)]
    public async Task<ActionResult<string>> UploadImage(IFormFile file, CancellationToken ct)
    {
        if (file is null || file.Length == 0) return BadRequest("No file");
        var guid = Guid.NewGuid().ToString("N");
        var now = DateTime.UtcNow;
        var relBase = $"/uploads/{now:yyyy}/{now:MM}/";
        var absBase = Path.Combine(_env.WebRootPath ?? Path.Combine(_env.ContentRootPath, "wwwroot"),
            "uploads", now.ToString("yyyy"), now.ToString("MM"));
        Directory.CreateDirectory(absBase);

        var ext = Path.GetExtension(file.FileName);
        var rel = $"{relBase}{guid}{ext}";
        var abs = Path.Combine(absBase, $"{guid}{ext}");
        using (var fs = System.IO.File.Create(abs))
            await file.CopyToAsync(fs, ct);

        return Ok(rel);
    }

    // ÚJ: variánsokat készít (WebP 320/640/1024/1600) és mindegyik URL-t visszaadja
    public record VariantResponse(string original, string w320, string w640, string w1024, string? w1600);

    [HttpPost("image-variants")]
    [RequestSizeLimit(30_000_000)]
    public async Task<ActionResult<VariantResponse>> UploadImageVariants(IFormFile file, CancellationToken ct)
    {
        if (file is null || file.Length == 0) return BadRequest("No file");
        await using var ms = new MemoryStream();
        await file.CopyToAsync(ms, ct);
        ms.Position = 0;

        var result = await _variants.SaveWithVariantsAsync(ms, file.FileName, ct);
        return Ok(new VariantResponse(result.OriginalUrl, result.W320Url, result.W640Url, result.W1024Url, result.W1600Url));
    }
}
