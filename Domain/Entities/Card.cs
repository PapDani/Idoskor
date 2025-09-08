namespace Domain.Entities;

public class Card
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public string? ContentUrl { get; set; }

    // ÚJ: rendezéshez
    public DateTime CreatedUtc { get; set; }

    // ÚJ: cikk hozzárendelés (Page)
    public int? PageId { get; set; }
    public Page? Page { get; set; }
}
