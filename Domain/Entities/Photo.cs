namespace Domain.Entities;

public class Photo
{
    public int Id { get; set; }
    public int AlbumId { get; set; }
    public Album Album { get; set; } = null!;

    public string ImageUrl { get; set; } = string.Empty;
    public string? Title { get; set; }
    public string? Description { get; set; }

    public bool IsVisible { get; set; } = true;
    public int Order { get; set; } = 0;
    public DateTime CreatedUtc { get; set; } // SQL default
}
