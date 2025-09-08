using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Configurations;

public class PhotoConfiguration : IEntityTypeConfiguration<Photo>
{
    public void Configure(EntityTypeBuilder<Photo> b)
    {
        b.Property(x => x.ImageUrl).HasMaxLength(2048).IsRequired();
        b.Property(x => x.Title).HasMaxLength(200);
        b.Property(x => x.Description).HasMaxLength(2000);
        b.Property(x => x.CreatedUtc).HasDefaultValueSql("GETUTCDATE()");
        b.Property(x => x.IsVisible).HasDefaultValue(true);
        b.Property(x => x.Order).HasDefaultValue(0);

        b.HasIndex(x => new { x.AlbumId, x.Order });
    }
}
