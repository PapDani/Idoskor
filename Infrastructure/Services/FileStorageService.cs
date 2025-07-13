using Domain.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Hosting;

namespace Infrastructure.Services
{
    public class FileStorageService : IFileStorageService
    {
        private readonly IWebHostEnvironment _env;
        public FileStorageService(IWebHostEnvironment env) => _env = env;

        public async Task<string> SaveImageAsync(IFormFile file)
        {
            var imagesFolder = Path.Combine(_env.WebRootPath, "images");
            Directory.CreateDirectory(imagesFolder);

            var fileName = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
            var filePath = Path.Combine(imagesFolder, fileName);

            using var stream = File.Create(filePath);
            await file.CopyToAsync(stream);

            return $"/images/{fileName}";
        }

        public Task DeleteImageAsync(string publicUrl)
        {
            var relative = publicUrl.TrimStart('/');
            var path = Path.Combine(_env.WebRootPath, relative);
            if (File.Exists(path))
                File.Delete(path);
            return Task.CompletedTask;
        }
    }
}
