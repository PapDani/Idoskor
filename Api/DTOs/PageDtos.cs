namespace Api.DTOs
{
    public record PageDto(string Key, string Title, string Content, string UpdatedUtc);
    public record UpsertPageDto(string Title, string Content);
}
