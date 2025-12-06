using System;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Produces("application/json")]
    public class AuthController : ControllerBase
    {
        private readonly IConfiguration _cfg;

        public AuthController(IConfiguration cfg) => _cfg = cfg;

        public record LoginRequest(string Username, string Password);
        public record LoginResponse(string token, DateTime expiresAt);

        /// <summary>
        /// Egyszerû admin login ENV-bõl: AdminUser__Username / AdminUser__Password.
        /// Visszaad egy JWT tokent.
        /// </summary>
        [HttpPost("login")]
        [AllowAnonymous]
        public IActionResult Login([FromBody] LoginRequest req)
        {
            var envUser = _cfg["AdminUser:Username"];
            var envPass = _cfg["AdminUser:Password"];
            if (string.IsNullOrWhiteSpace(envUser) || string.IsNullOrWhiteSpace(envPass))
                return StatusCode(500, new { error = "Admin credentials are not configured on the server." });

            if (!string.Equals(req.Username, envUser, StringComparison.Ordinal) ||
                !string.Equals(req.Password, envPass, StringComparison.Ordinal))
                return Unauthorized(new { error = "Invalid username or password." });

            var jwtKey = _cfg["Jwt:Key"];
            if (string.IsNullOrWhiteSpace(jwtKey))
                return StatusCode(500, new { error = "JWT:Key is not configured." });

            var issuer = _cfg["Jwt:Issuer"] ?? "Idoskor";
            var audience = _cfg["Jwt:Audience"] ?? "IdoskorAdmin";

            var now = DateTime.UtcNow;
            var expires = now.AddHours(12);

            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, envUser),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new Claim(ClaimTypes.Name, envUser),
                new Claim(ClaimTypes.Role, "Admin")
            };

            var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
            var creds = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256);

            var jwtToken = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                notBefore: now,
                expires: expires,
                signingCredentials: creds
            );

            var tokenStr = new JwtSecurityTokenHandler().WriteToken(jwtToken);
            return Ok(new LoginResponse(tokenStr, expires));
        }

        /// <summary>
        /// Gyors ellenõrzés: mûködik-e a token és az Authorize pipeline.
        /// </summary>
        [HttpGet("whoami")]
        [Authorize]
        public IActionResult WhoAmI()
        {
            var name = User.Identity?.Name ?? "(unknown)";
            var roles = User.Claims.Where(c => c.Type == ClaimTypes.Role).Select(c => c.Value).ToArray();
            return Ok(new { name, roles });
        }
    }
}
