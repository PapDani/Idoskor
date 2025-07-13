using Microsoft.AspNetCore.Http;

namespace Domain.Interfaces
{
    public interface IFileStorageService
    {
        /// <summary>
        /// Ment egy felt�lt�tt k�pet a wwwroot/images mapp�ba,
        /// �s visszaadja a publikus URL-j�t (relat�v �tvonal).
        /// </summary>
        Task<string> SaveImageAsync(IFormFile file);

        /// <summary>
        /// T�rli a kor�bban mentett k�pet a f�jlrendszerb�l.
        /// </summary>
        Task DeleteImageAsync(string publicUrl);
    }
}
