using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Configurations;

public class PageConfiguration : IEntityTypeConfiguration<Page>
{
    public void Configure(EntityTypeBuilder<Page> builder)
    {
        builder.HasIndex(p => p.Key).IsUnique();
        builder.Property(p => p.Key).HasMaxLength(100).IsRequired();
        builder.Property(p => p.Title).HasMaxLength(200);
        builder.Property(p => p.UpdatedUtc).HasDefaultValueSql("GETUTCDATE()");
    }
}
