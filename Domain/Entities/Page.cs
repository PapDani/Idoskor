using System;

namespace Domain.Entities
{
    public class Page
    {
        public int Id { get; set; }
        public string Key { get; set; } = null!;      // pl. "about"
        public string Title { get; set; } = null!;
        public string Content { get; set; } = string.Empty; // HTML
        public DateTime UpdatedUtc { get; set; } = DateTime.UtcNow;
    }
}
