using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Configurations
{
    public class PageConfiguration : IEntityTypeConfiguration<Page>
    {
        public void Configure(EntityTypeBuilder<Page> builder)
        {
            builder.HasKey(p => p.Id);

            builder.Property(p => p.Key)
                   .IsRequired()
                   .HasMaxLength(100);

            builder.HasIndex(p => p.Key)
                   .IsUnique();

            builder.Property(p => p.Title)
                   .IsRequired()
                   .HasMaxLength(200);

            builder.Property(p => p.Content)
                   .HasColumnType("nvarchar(max)");

            builder.Property(p => p.UpdatedUtc)
                   .HasDefaultValueSql("GETUTCDATE()");
        }
    }
}
