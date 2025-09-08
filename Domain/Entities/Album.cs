namespace Domain.Entities;

public class Album
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty; // egyedi
    public string? Description { get; set; }
    public string? CoverImageUrl { get; set; }
    public bool IsPublished { get; set; } = true;
    public int Order { get; set; } = 0;
    public DateTime CreatedUtc { get; set; } // SQL default

    public ICollection<Photo> Photos { get; set; } = new List<Photo>();
}
