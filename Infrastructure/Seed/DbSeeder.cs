using Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Seed;

public static class DbSeeder
{
    public static async Task EnsureSeededAsync(AppDbContext db)
    {
        // 1) Page: about
        var about = await db.Pages.FirstOrDefaultAsync(p => p.Key == "about");
        if (about is null)
        {
            about = new Page
            {
                Key = "about",
                Title = "Bemutatkoz�s",
                Content = "<p>�dv az oldalon!</p>",
                UpdatedUtc = DateTime.UtcNow
            };
            db.Pages.Add(about);
            await db.SaveChangesAsync();
        }

        // 2) Men� gy�k�r + gyerek
        if (!await db.MenuItems.AnyAsync(m => m.Label == "�dv�z�lj�k!"))
        {
            var root = new MenuItem
            {
                Label = "�dv�z�lj�k!",
                Slug = "welcome",
                Order = 0,
                IsEnabled = true
            };
            db.MenuItems.Add(root);
            await db.SaveChangesAsync();

            var child = new MenuItem
            {
                Label = "R�lunk: R�vid bemutatkoz�s",
                Slug = "rolunk-bemutatkozas",
                ParentId = root.Id,
                Order = 0,
                IsEnabled = true,
                PageId = about.Id
            };
            db.MenuItems.Add(child);
            await db.SaveChangesAsync();
        }
    }
}
