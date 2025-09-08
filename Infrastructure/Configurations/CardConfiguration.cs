using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Configurations;

public class CardConfiguration : IEntityTypeConfiguration<Card>
{
    public void Configure(EntityTypeBuilder<Card> builder)
    {
        builder.Property(c => c.Title).HasMaxLength(200).IsRequired();
        builder.Property(c => c.ImageUrl).HasMaxLength(2048);
        builder.Property(c => c.ContentUrl).HasMaxLength(2048);

        // �J: alap�rtelmezett UTC id� (SQL oldalon is)
        builder.Property(c => c.CreatedUtc)
               .HasDefaultValueSql("GETUTCDATE()");

        // �J: kapcsolat Page-hez (nullable), t�rl�sn�l NULL-ra �ll
        builder.HasOne(c => c.Page)
               .WithMany()
               .HasForeignKey(c => c.PageId)
               .OnDelete(DeleteBehavior.SetNull);
    }
}
