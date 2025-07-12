using Domain.Entities;
using Domain.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CardsController : ControllerBase
    {
        private readonly ICardService _service;

        public CardsController(ICardService service)
        {
            _service = service;
        }

        /// <summary>
        /// Retrieves all cards.
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var cards = await _service.GetAllAsync();
            return Ok(cards);
        }

        /// <summary>
        /// Retrieves a single card by its Id.
        /// </summary>
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var card = await _service.GetByIdAsync(id);
            if (card is null)
                return NotFound();
            return Ok(card);
        }

        /// <summary>
        /// Creates a new card.
        /// </summary>
        [Authorize]  // only authenticated admins can create
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Card card)
        {
            var created = await _service.CreateAsync(card);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }

        /// <summary>
        /// Updates an existing card.
        /// </summary>
        [Authorize]
        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] Card card)
        {
            var updated = await _service.UpdateAsync(id, card);
            if (updated is null)
                return NotFound();
            return Ok(updated);
        }

        /// <summary>
        /// Deletes a card by its Id.
        /// </summary>
        [Authorize]
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var success = await _service.DeleteAsync(id);
            if (!success)
                return NotFound();
            return NoContent();
        }
    }
}
