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
    public class AuthController : ControllerBase
    {
        private readonly IConfiguration _cfg;

        public AuthController(IConfiguration cfg)
        {
            _cfg = cfg;
        }

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
            var envUser = _cfg["AdminUsername"];
            var envPass = _cfg["AdminPassword"];

            if (string.IsNullOrWhiteSpace(envUser) || string.IsNullOrWhiteSpace(envPass))
                return StatusCode(500, new { error = "Admin credentials are not configured on the server." });

            if (!string.Equals(req.Username, envUser, StringComparison.Ordinal) ||
                !string.Equals(req.Password, envPass, StringComparison.Ordinal))
                return Unauthorized(new { error = "Hibás felhasználónév vagy jelszó." });

            var jwtKey = _cfg["Jwt_Key"];
            if (string.IsNullOrWhiteSpace(jwtKey))
                return StatusCode(500, new { error = "JWT:Key is not configured." });

            var issuer = _cfg["Jwt_Issuer"] ?? "Idoskor";
            var audience = _cfg["Jwt_Auidence"] ?? "IdoskorAdmin";

            var now = DateTime.UtcNow;
            var expires = now.AddHours(4); // igény szerint állítható

            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, envUser),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new Claim(ClaimTypes.Name, envUser),
                new Claim(ClaimTypes.Role, "Admin")
            };

            var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
            var creds = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                notBefore: now,
                expires: expires,
                signingCredentials: creds
            );

            var tokenStr = new JwtSecurityTokenHandler().WriteToken(token);
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
