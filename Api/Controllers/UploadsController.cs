// Api/Controllers/UploadsController.cs
using Domain.Interfaces;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;

namespace Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UploadsController : ControllerBase
    {
        private readonly IFileStorageService _files;
        public UploadsController(IFileStorageService files) => _files = files;

        // [Authorize(Roles = "Admin")]
        [HttpPost]
        [RequestSizeLimit(50_000_000)]
        public async Task<IActionResult> Upload([FromForm] IFormFile file)
        {
            if (file is null || file.Length == 0)
                return BadRequest("No file uploaded.");

            // Ha a service visszaadja a relatív elérési utat (pl. "/images/xyz.png"),
            // akkor ezt egyből vissza lehet küldeni:
            var url = await _files.SaveImageAsync(file);

            // Opcionális: alaptípus ellenőrzés (ha szeretnéd):
            // var allowed = new[] {"image/png","image/jpeg","image/webp","image/gif"};
            // if (!allowed.Contains(file.ContentType)) return BadRequest("Unsupported type");

            return Ok(new { url });
        }
    }
}
