using System;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;

namespace Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Produces("application/json")]
    public class AuthController : ControllerBase
    {
        private readonly IConfiguration _cfg;
        private readonly ILogger<AuthController> _log;

        public AuthController(IConfiguration cfg, ILogger<AuthController> log)
        {
            _cfg = cfg;
            _log = log;
        }

        public record LoginRequest(string Username, string Password);
        public record LoginResponse(string token, DateTime expiresAt);

        [HttpPost("login")]
        [AllowAnonymous]
        public IActionResult Login([FromBody] LoginRequest req)
        {
            try
            {
                if (req is null)
                    return BadRequest(new { error = "Empty body." });

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

                // 32+ karakter javasolt
                if (jwtKey.Length < 32)
                    _log.LogWarning("Jwt:Key is short ({Len} chars). Consider 32+ chars.", jwtKey.Length);

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
                return new JsonResult(new LoginResponse(tokenStr, expires));
            }
            catch (Exception ex)
            {
                _log.LogError(ex, "Auth/login failed.");
                return StatusCode(500, new { error = "Login failed.", details = ex.Message });
            }
        }

        // Gyors diagnosztika: ellenõrzi, hogy az ENV-ek be vannak-e állítva a BACKEND service-en
        [HttpGet("diag")]
        [AllowAnonymous]
        public IActionResult Diag()
        {
            var data = new
            {
                AspNetEnv = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT"),
                AdminUser_Username_Configured = !string.IsNullOrWhiteSpace(_cfg["AdminUser:Username"]),
                AdminUser_Password_Configured = !string.IsNullOrWhiteSpace(_cfg["AdminUser:Password"]),
                Jwt_Key_Length = (_cfg["Jwt:Key"] ?? "").Length,
                Jwt_Issuer = _cfg["Jwt:Issuer"] ?? "(null)",
                Jwt_Audience = _cfg["Jwt:Audience"] ?? "(null)",
                Utc = DateTime.UtcNow
            };
            return new JsonResult(data);
        }

        // Opcionális echo debuggoláshoz
        [HttpPost("echo")]
        [AllowAnonymous]
        public IActionResult Echo([FromBody] object body)
            => new JsonResult(new { ok = true, received = body, ts = DateTime.UtcNow });
    }
}
