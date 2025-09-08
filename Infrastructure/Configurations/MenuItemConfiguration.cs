using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Configurations;

public class MenuItemConfiguration : IEntityTypeConfiguration<MenuItem>
{
    public void Configure(EntityTypeBuilder<MenuItem> builder)
    {
        builder.Property(m => m.Label).HasMaxLength(200).IsRequired();
        builder.Property(m => m.Slug).HasMaxLength(200);
        builder.HasOne(m => m.Page)
               .WithMany()
               .HasForeignKey(m => m.PageId)
               .OnDelete(DeleteBehavior.SetNull);
        builder.HasIndex(m => new { m.ParentId, m.Order });
    }
}
