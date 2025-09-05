namespace Domain.Entities;

public class MenuItem
{
    public int Id { get; set; }
    public string Label { get; set; } = "";
    public string? Slug { get; set; }
    public int? ParentId { get; set; }
    public int Order { get; set; }
    public bool IsEnabled { get; set; } = true;

    // Kapcsolat a cikkhez (Page)
    public int? PageId { get; set; }
    public Page? Page { get; set; }
}
