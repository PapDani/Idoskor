using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Domain.Entities;
using Domain.Interfaces;
using Api.DTOs;

[ApiController]
[Route("api/[controller]")]
public class CardsController : ControllerBase
{
    private readonly ICardService _cards;
    public CardsController(ICardService cards) => _cards = cards;

    [HttpGet]
    public Task<IReadOnlyList<Card>> GetAll() => _cards.ListAsync();

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var card = await _cards.GetByIdAsync(id);
        return card is null ? NotFound() : Ok(card);
    }

    [HttpPost]
    [Consumes("multipart/form-data")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<Card>> Create([FromForm] CreateCardForm form)
    {
        if (form.Image is null || form.Image.Length == 0)
            return BadRequest("Image is required.");

        var created = await _cards.CreateAsync(form.Title, form.ContentUrl, form.Image);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id:int}")]
    [Consumes("multipart/form-data")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(int id, [FromForm] UpdateCardForm form)
    {
        var exists = await _cards.GetByIdAsync(id);
        if (exists is null) return NotFound();

        await _cards.UpdateAsync(id, form.Title, form.ContentUrl, form.Image);

        return NoContent(); // 204, nincs törzs
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        await _cards.DeleteAsync(id);
        return NoContent();
    }
}
