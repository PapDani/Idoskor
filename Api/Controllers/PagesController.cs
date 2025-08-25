using Api.DTOs;
using Domain.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PagesController : ControllerBase
    {
        private readonly IPageService _service;
        public PagesController(IPageService service) => _service = service;

        [HttpGet]
        public async Task<IEnumerable<PageDto>> List()
        {
            var list = await _service.ListAsync();
            return list.Select(p => new PageDto(
                p.Key, p.Title, p.Content, p.UpdatedUtc.ToString("o")
            ));
        }

        [HttpGet("{key}")]
        public async Task<ActionResult<PageDto>> Get(string key)
        {
            var p = await _service.GetAsync(key);
            if (p == null) return NotFound();
            return new PageDto(p.Key, p.Title, p.Content, p.UpdatedUtc.ToString("o"));
        }

        // [Authorize(Roles = "Admin")]
        [HttpPut("{key}")]
        public async Task<IActionResult> Upsert(string key, [FromBody] UpsertPageDto dto)
        {
            await _service.UpsertAsync(key, dto.Title, dto.Content);
            return NoContent();
        }
    }
}
