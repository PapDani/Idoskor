using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;

namespace Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IConfiguration _config;

    public AuthController(IConfiguration config)
    {
        _config = config;
    }

    // Közös helper: config + env
    private string? GetEnv(string key) =>
        _config[key] ?? Environment.GetEnvironmentVariable(key);

    public class LoginRequest
    {
        public string? Username { get; set; }
        public string? Password { get; set; }
    }

    [HttpPost("login")]
    [Produces("application/json")]
    public IActionResult Login([FromBody] LoginRequest body)
    {
        if (body == null || string.IsNullOrWhiteSpace(body.Username) || string.IsNullOrWhiteSpace(body.Password))
        {
            return BadRequest(new { error = "Hiányzó felhasználónév vagy jelszó." });
        }

        // Admin user env-bõl:
        var adminUser =
            GetEnv("AdminUser:Username") ??
            GetEnv("AdminUser__Username");

        var adminPass =
            GetEnv("AdminUser:Password") ??
            GetEnv("AdminUser__Password");

        if (string.IsNullOrWhiteSpace(adminUser) || string.IsNullOrWhiteSpace(adminPass))
        {
            return StatusCode(500, new { error = "Az admin felhasználó nincs konfigurálva a szerveren." });
        }

        // Egyezés ellenõrzés
        if (!string.Equals(body.Username, adminUser, StringComparison.Ordinal) ||
            !string.Equals(body.Password, adminPass, StringComparison.Ordinal))
        {
            return Unauthorized(new { error = "Hibás felhasználónév vagy jelszó." });
        }

        // JWT paraméterek (ugyanaz, mint Program.cs-ben)
        var jwtKey = GetEnv("JWT__KEY") ?? "ChangeMe_DevOnly_12345678901234567890";
        var jwtIssuer = GetEnv("JWT__ISSUER") ?? "Idoskor";
        var jwtAudience = GetEnv("JWT__AUDIENCE") ?? "";

        var keyBytes = Encoding.UTF8.GetBytes(jwtKey);
        var signingKey = new SymmetricSecurityKey(keyBytes);
        var creds = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.Name, adminUser),
            new Claim(ClaimTypes.Role, "Admin")
        };

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddHours(8),
            Issuer = jwtIssuer,
            Audience = string.IsNullOrWhiteSpace(jwtAudience) ? null : jwtAudience,
            SigningCredentials = creds
        };

        var handler = new JwtSecurityTokenHandler();
        var token = handler.CreateToken(tokenDescriptor);
        var jwt = handler.WriteToken(token);

        return Ok(new
        {
            token = jwt,
            username = adminUser
        });
    }

    // Diagnosztika – ugyanazt az infót adja vissza, amit korábban használtunk
    [HttpGet("diag2")]
    [Produces("application/json")]
    public IActionResult Diag2()
    {
        var adminUser = GetEnv("AdminUser__Username") ?? GetEnv("AdminUser:Username");
        var adminPass = GetEnv("AdminUser__Password") ?? GetEnv("AdminUser:Password");
        var key = GetEnv("JWT__KEY");
        var issuer = GetEnv("JWT__ISSUER") ?? "Idoskor";
        var audience = GetEnv("JWT__AUDIENCE") ?? "";

        return Ok(new
        {
            aspNetEnv = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT"),
            adminUser_Username_Configured = !string.IsNullOrWhiteSpace(adminUser),
            adminUser_Password_Configured = !string.IsNullOrWhiteSpace(adminPass),
            jwt_Key_Length = key?.Length ?? 0,
            jwt_Issuer = issuer,
            jwt_Audience = audience,
            utc = DateTime.UtcNow
        });
    }
}
