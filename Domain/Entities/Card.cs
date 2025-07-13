
namespace Domain.Entities
{
    public class Card
    {
        public int Id { get; set; }
        public string Title { get; set; } = default!;
        public string ImageUrl { get; set; } = default!;
        public string ContentUrl { get; set; } = default!;
    }
}
