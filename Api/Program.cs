using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Infrastructure;
using Infrastructure.Seed;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// ---------- Services ----------
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// CORS – alapból engedi a Render frontend + aktividoskor domain-t
var defaultAllowedOrigins = new[]
{
    "https://idoskor-1-frontend.onrender.com",
    "https://www.aktividoskor.hu",
    "https://aktividoskor.hu"
};

var allowedOriginsEnv = builder.Configuration["ALLOWED_ORIGINS"];
var allowedOrigins = string.IsNullOrWhiteSpace(allowedOriginsEnv)
    ? defaultAllowedOrigins
    : allowedOriginsEnv.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

builder.Services.AddCors(opt =>
{
    opt.AddDefaultPolicy(p =>
        p.WithOrigins(
                "http://localhost:4200",                  // lokális fejlesztés
                "https://idoskor-1-frontend.onrender.com",// Render frontend
                "https://idoskor.onrender.com"            // (opcionális) ha innen is lesz valaha UI
            )
         .AllowAnyHeader()
         .AllowAnyMethod()
    // .AllowCredentials()  // csak akkor kell, ha majd sütivel dolgozol
    );
});

// DB provider (Sqlite / SqlServer)
var dbProvider = (builder.Configuration["DB_PROVIDER"] ?? "Sqlite").Trim().ToLowerInvariant();

if (dbProvider == "sqlite")
{
    var dataRoot = builder.Configuration["Data:Root"]
                  ?? builder.Configuration["DATA_ROOT"]
                  ?? "/var/data";
    Directory.CreateDirectory(dataRoot);
    var dbPath = Path.Combine(dataRoot, "app.db");
    builder.Services.AddDbContext<AppDbContext>(opt => opt.UseSqlite($"Data Source={dbPath}"));
}
else
{
    var conn =
        builder.Configuration.GetConnectionString("Default")
        ?? builder.Configuration["SQLSERVER_CONNECTION_STRING"]
        ?? "Server=.;Database=Idoskor;Trusted_Connection=True;MultipleActiveResultSets=true;TrustServerCertificate=True";

    builder.Services.AddDbContext<AppDbContext>(opt => opt.UseSqlServer(conn));
}

// JWT auth
var jwtKey = builder.Configuration["Jwt:Key"] ?? "";
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "Idoskor";
var jwtAud = builder.Configuration["Jwt:Audience"] ?? "IdoskorAdmin";

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(opt =>
    {
        opt.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwtIssuer,
            ValidateAudience = true,
            ValidAudience = jwtAud,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = string.IsNullOrWhiteSpace(jwtKey)
                ? new SymmetricSecurityKey(Encoding.UTF8.GetBytes("fallback-key-change-me-very-long"))
                : new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromMinutes(2)
        };
    });

builder.Services.AddAuthorization();

var app = builder.Build();

// ---------- Middleware ----------
app.UseCors("AppCors");

app.UseSwagger();
app.UseSwaggerUI();

app.UseAuthentication();
app.UseAuthorization();

// /uploads statikus fájlok
{
    var dataRoot = builder.Configuration["Data:Root"]
                  ?? builder.Configuration["DATA_ROOT"]
                  ?? "/var/data";
    var uploadsPath = Path.Combine(dataRoot, "uploads");
    Directory.CreateDirectory(uploadsPath);

    app.UseStaticFiles(new StaticFileOptions
    {
        FileProvider = new PhysicalFileProvider(uploadsPath),
        RequestPath = "/uploads"
    });
}

// ---------- Controllers ----------
app.MapControllers();

// ---------- Minimal API diagnosztika + auth ----------

// Egyszerû ping
app.MapGet("/api/ping", () =>
    Results.Json(new { ok = true, src = "api", ts = DateTime.UtcNow }));

// Diagnosztika ENV-ekre
app.MapGet("/api/auth/diag", (IConfiguration cfg) =>
{
    var data = new
    {
        AspNetEnv = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT"),
        AdminUser_Username_Configured = !string.IsNullOrWhiteSpace(cfg["AdminUser:Username"]),
        AdminUser_Password_Configured = !string.IsNullOrWhiteSpace(cfg["AdminUser:Password"]),
        Jwt_Key_Length = (cfg["Jwt:Key"] ?? "").Length,
        Jwt_Issuer = cfg["Jwt:Issuer"] ?? "(null)",
        Jwt_Audience = cfg["Jwt:Audience"] ?? "(null)",
        Utc = DateTime.UtcNow
    };
    return Results.Json(data);
});

// Login – ENV alapú admin felhasználó
app.MapPost("/api/auth/login", (IConfiguration cfg, [FromBody] LoginRequest body) =>
{
    if (body is null)
        return Results.BadRequest(new { error = "Empty body." });

    var user = cfg["AdminUser:Username"];
    var pass = cfg["AdminUser:Password"];
    if (string.IsNullOrWhiteSpace(user) || string.IsNullOrWhiteSpace(pass))
        return Results.Problem("Admin credentials are not configured on the server.", statusCode: 500);

    if (!string.Equals(body.Username, user, StringComparison.Ordinal) ||
        !string.Equals(body.Password, pass, StringComparison.Ordinal))
    {
        // Itt nem hívunk Results.Unauthorized(body)-t, mert nincs ilyen overload,
        // hanem explicit 401-es JSON választ adunk:
        return Results.Json(
            new { error = "Invalid username or password." },
            statusCode: 401
        );
    }

    var key = cfg["Jwt:Key"];
    if (string.IsNullOrWhiteSpace(key))
        return Results.Problem("JWT:Key is not configured.", statusCode: 500);

    var issuer = cfg["Jwt:Issuer"] ?? "Idoskor";
    var audience = cfg["Jwt:Audience"] ?? "IdoskorAdmin";
    var expires = DateTime.UtcNow.AddHours(12);

    var claims = new[]
    {
        new Claim(JwtRegisteredClaimNames.Sub, user),
        new Claim(ClaimTypes.Name, user),
        new Claim(ClaimTypes.Role, "Admin"),
        new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
    };

    var creds = new SigningCredentials(
        new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)),
        SecurityAlgorithms.HmacSha256
    );

    var jwt = new JwtSecurityToken(
        issuer: issuer,
        audience: audience,
        claims: claims,
        notBefore: DateTime.UtcNow,
        expires: expires,
        signingCredentials: creds
    );

    var token = new JwtSecurityTokenHandler().WriteToken(jwt);
    return Results.Json(new { token, expiresAt = expires });
});

// ---------- Migráció + seed ----------
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    try
    {
        await db.Database.MigrateAsync();
        await DbSeeder.SeedAsync(db);
    }
    catch (Exception ex)
    {
        Console.WriteLine($"[Startup] Migration/Seed warning: {ex.Message}");
    }
}

app.Run();

// ---------- Types ----------
public record LoginRequest(string Username, string Password);
