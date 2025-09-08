using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Configurations;

public class AlbumConfiguration : IEntityTypeConfiguration<Album>
{
    public void Configure(EntityTypeBuilder<Album> b)
    {
        b.Property(x => x.Title).HasMaxLength(200).IsRequired();
        b.Property(x => x.Slug).HasMaxLength(100).IsRequired();
        b.HasIndex(x => x.Slug).IsUnique();
        b.Property(x => x.CoverImageUrl).HasMaxLength(2048);
        b.Property(x => x.Description).HasMaxLength(2000);
        b.Property(x => x.CreatedUtc).HasDefaultValueSql("GETUTCDATE()");
        b.Property(x => x.IsPublished).HasDefaultValue(true);
        b.Property(x => x.Order).HasDefaultValue(0);

        b.HasMany(x => x.Photos)
         .WithOne(x => x.Album)
         .HasForeignKey(x => x.AlbumId)
         .OnDelete(DeleteBehavior.Cascade);
    }
}
