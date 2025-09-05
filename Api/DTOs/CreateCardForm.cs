namespace Api.DTOs
{
    public class CreateCardForm
    {
        public string Title { get; set; } = null!;
        public string ContentUrl { get; set; } = null!;
        public IFormFile? Image { get; set; }
    }
}
