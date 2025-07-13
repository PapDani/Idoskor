using Microsoft.AspNetCore.Http;

namespace Domain.Interfaces
{
    public interface IFileStorageService
    {
        /// <summary>
        /// Ment egy feltöltött képet a wwwroot/images mappába,
        /// és visszaadja a publikus URL-jét (relatív útvonal).
        /// </summary>
        Task<string> SaveImageAsync(IFormFile file);

        /// <summary>
        /// Törli a korábban mentett képet a fájlrendszerbõl.
        /// </summary>
        Task DeleteImageAsync(string publicUrl);
    }
}
