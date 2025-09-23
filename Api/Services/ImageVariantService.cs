using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Processing;
using SixLabors.ImageSharp.Formats.Webp;

namespace Api.Services;

public class ImageVariantService
{
    private readonly IWebHostEnvironment _env;
    public ImageVariantService(IWebHostEnvironment env) => _env = env;

    public sealed class VariantResult
    {
        public required string OriginalUrl { get; init; }
        public required string W320Url { get; init; }
        public required string W640Url { get; init; }
        public required string W1024Url { get; init; }
        public string? W1600Url { get; init; }
        public required string BasePath { get; init; }
        public required string BaseName { get; init; }
    }

    public async Task<VariantResult> SaveWithVariantsAsync(Stream input, string originalFileName, CancellationToken ct = default)
    {
        var guid = Guid.NewGuid().ToString("N");
        var now = DateTime.UtcNow;
        var relBase = $"/uploads/{now:yyyy}/{now:MM}/{guid}/";
        var absBase = Path.Combine(_env.WebRootPath ?? Path.Combine(_env.ContentRootPath, "wwwroot"),
                                   "uploads", now.ToString("yyyy"), now.ToString("MM"), guid);
        Directory.CreateDirectory(absBase);

        var ext = Path.GetExtension(originalFileName);
        var originalRel = $"{relBase}{guid}_orig{ext}";
        var originalAbs = Path.Combine(absBase, $"{guid}_orig{ext}");
        using (var fs = File.Create(originalAbs))
            await input.CopyToAsync(fs, ct);

        using var image = await Image.LoadAsync(originalAbs, ct);

        async Task<string> Make(int width, int quality)
        {
            using var clone = image.Clone(ctx => ctx.Resize(new ResizeOptions
            {
                Mode = ResizeMode.Max,
                Size = new Size(width, 0)
            }));
            var rel = $"{relBase}{guid}_w{width}.webp";
            var abs = Path.Combine(absBase, $"{guid}_w{width}.webp");
            var enc = new WebpEncoder { Quality = quality, FileFormat = WebpFileFormatType.Lossy };
            await clone.SaveAsWebpAsync(abs, enc, ct);
            return rel;
        }

        var w320 = await Make(320, 80);
        var w640 = await Make(640, 80);
        var w1024 = await Make(1024, 80);
        string? w1600 = null;
        if (image.Width > 1200) w1600 = await Make(1600, 82);

        return new VariantResult
        {
            OriginalUrl = originalRel,
            W320Url = w320,
            W640Url = w640,
            W1024Url = w1024,
            W1600Url = w1600,
            BasePath = relBase,
            BaseName = guid
        };
    }
}
