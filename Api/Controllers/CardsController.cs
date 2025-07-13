using Domain.Entities;
using Domain.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/[controller]")]
public class CardsController : ControllerBase
{
    private readonly ICardService _cards;
    public CardsController(ICardService cards) => _cards = cards;

    [HttpGet]
    public Task<IReadOnlyList<Card>> GetAll() => _cards.ListAsync();

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var card = await _cards.GetByIdAsync(id);
        if (card == null) return NotFound();
        return Ok(card);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create([FromForm] IFormFile imageFile,
                                            [FromForm] string title,
                                            [FromForm] string contentUrl)
    {
        var card = await _cards.CreateAsync(title, contentUrl, imageFile);
        return CreatedAtAction(nameof(GetById), new { id = card.Id }, card);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(int id,
                                            [FromForm] IFormFile? imageFile,
                                            [FromForm] string title,
                                            [FromForm] string contentUrl)
    {
        await _cards.UpdateAsync(id, title, contentUrl, imageFile);
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        await _cards.DeleteAsync(id);
        return NoContent();
    }
}
