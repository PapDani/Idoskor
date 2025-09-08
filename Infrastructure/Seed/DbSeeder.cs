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
                Title = "R�lunk: R�vid bemutatkoz�s",
                Content = "<p>�dv�z�lj�k az Akt�v Id�skor oldal�n!</p>",
                UpdatedUtc = DateTime.UtcNow
            };
            db.Pages.Add(about);
            await db.SaveChangesAsync();
        }

        // MENU: ha nincs ��dv�z�lj�k!� gy�k�r, l�trehozzuk
        if (!await db.MenuItems.AnyAsync())
        {
            var root = new MenuItem { Label = "�dv�z�lj�k!", Order = 0, IsEnabled = true };
            db.MenuItems.Add(root);
            await db.SaveChangesAsync();

            var child = new MenuItem
            {
                Label = "R�lunk: R�vid bemutatkoz�s",
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
