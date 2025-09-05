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
                Title = "Bemutatkozás",
                Content = "<p>Üdv az oldalon!</p>",
                UpdatedUtc = DateTime.UtcNow
            };
            db.Pages.Add(about);
            await db.SaveChangesAsync();
        }

        // 2) Menü gyökér + gyerek
        if (!await db.MenuItems.AnyAsync(m => m.Label == "Üdvözöljük!"))
        {
            var root = new MenuItem
            {
                Label = "Üdvözöljük!",
                Slug = "welcome",
                Order = 0,
                IsEnabled = true
            };
            db.MenuItems.Add(root);
            await db.SaveChangesAsync();

            var child = new MenuItem
            {
                Label = "Rólunk: Rövid bemutatkozás",
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
