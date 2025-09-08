using Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Seed;

public static class DbSeeder
{
    public static async Task SeedAsync(AppDbContext db)
    {
        await db.Database.MigrateAsync();

        // PAGE: about
        var about = await db.Pages.SingleOrDefaultAsync(p => p.Key == "about");
        if (about is null)
        {
            about = new Page
            {
                Key = "about",
                Title = "Rólunk: Rövid bemutatkozás",
                Content = "<p>Üdvözöljük az Aktív Idõskor oldalán!</p>",
                UpdatedUtc = DateTime.UtcNow
            };
            db.Pages.Add(about);
            await db.SaveChangesAsync();
        }

        // MENU: ha nincs „Üdvözöljük!” gyökér, létrehozzuk
        if (!await db.MenuItems.AnyAsync())
        {
            var root = new MenuItem { Label = "Üdvözöljük!", Order = 0, IsEnabled = true };
            db.MenuItems.Add(root);
            await db.SaveChangesAsync();

            var child = new MenuItem
            {
                Label = "Rólunk: Rövid bemutatkozás",
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
