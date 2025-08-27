using Microsoft.AspNetCore.Http;

namespace Api.DTOs
{
    public class FileUploadRequest
    {
        public IFormFile File { get; set; } = null!;
    }
}
