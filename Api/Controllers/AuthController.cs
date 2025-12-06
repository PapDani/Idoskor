using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace Api.Controllers
{
    public record LoginRequest(string Username, string Password);

    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IConfiguration _config;
        public AuthController(IConfiguration config) => _config = config;

        [HttpPost("login")]
        public IActionResult Login([FromBody] LoginRequest req)
        {
            // 1) Ellenõrzés a statikus admin felhasználóval
            //var admin = _config.GetSection("AdminUser");

            var u = _config["AdminUsername"];
            var p = _config["AdminPassword"];
            if (!string.Equals(req.Username, u, StringComparison.Ordinal) ||
            !string.Equals(req.Password, p, StringComparison.Ordinal))
                return Unauthorized();

            // 2) Token generálás
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt_key"]!));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, req.Username),
                new Claim(ClaimTypes.Role, "Admin")
            };

            var token = new JwtSecurityToken(
                issuer: jwt["Issuer"],
                audience: jwt["Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddHours(4),
                signingCredentials: creds);

            return Ok(new { token = new JwtSecurityTokenHandler().WriteToken(token) });
        }
    }
}
