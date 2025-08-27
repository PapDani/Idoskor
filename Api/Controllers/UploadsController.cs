using Api.DTOs;
using Domain.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UploadsController : ControllerBase
    {
        private readonly IFileStorageService _files;
        public UploadsController(IFileStorageService files) => _files = files;

        // [Authorize(Roles = "Admin")]  // ha szeretnéd védeni, nyugodtan tedd vissza
        [HttpPost]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> Upload([FromForm] FileUploadRequest form)
        {
            if (form.File is null || form.File.Length == 0)
                return BadRequest("No file uploaded.");

            var url = await _files.SaveImageAsync(form.File); // ← a te szervized szignatúrája
            return Ok(new { url });
        }
    }
}
