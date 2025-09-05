namespace Domain.Entities;

public class Page
{
    public int Id { get; set; }
    public string Key { get; set; } = null!;
    public string Title { get; set; } = "";
    public string Content { get; set; } = "";
    public DateTime UpdatedUtc { get; set; }
}
