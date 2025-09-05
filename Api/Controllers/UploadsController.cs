using Microsoft.AspNetCore.Mvc;

public record FileUploadRequest(IFormFile File);

[ApiController]
[Route("api/[controller]")]
public class UploadsController : ControllerBase
{
    private readonly IWebHostEnvironment _env;
    public UploadsController(IWebHostEnvironment env) => _env = env;

    [HttpPost]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(20_000_000)] // 20 MB – igény szerint
    public async Task<IActionResult> Upload([FromForm] FileUploadRequest request)
    {
        if (request.File == null || request.File.Length == 0)
            return BadRequest("No file provided.");

        var imagesDir = Path.Combine(_env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"), "images");
        Directory.CreateDirectory(imagesDir);

        var ext = Path.GetExtension(request.File.FileName);
        var name = $"{Guid.NewGuid():N}{ext}";
        var path = Path.Combine(imagesDir, name);
        using (var stream = System.IO.File.Create(path))
            await request.File.CopyToAsync(stream);

        var url = $"/images/{name}";
        return Ok(new { url });
    }
}
