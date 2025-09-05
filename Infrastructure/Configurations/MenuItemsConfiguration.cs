using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Configurations;

public class MenuItemConfiguration : IEntityTypeConfiguration<MenuItem>
{
    public void Configure(EntityTypeBuilder<MenuItem> e)
    {
        e.ToTable("MenuItems");
        e.HasKey(x => x.Id);

        e.Property(x => x.Label).IsRequired().HasMaxLength(200);
        e.Property(x => x.Slug).HasMaxLength(200);
        e.Property(x => x.Order).HasDefaultValue(0);
        e.Property(x => x.IsEnabled).HasDefaultValue(true);

        e.HasOne(x => x.Page)
         .WithMany()
         .HasForeignKey(x => x.PageId)
         .OnDelete(DeleteBehavior.SetNull);

        e.HasIndex(x => new { x.ParentId, x.Order });
    }
}
