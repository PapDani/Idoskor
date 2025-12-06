using Api.Filters;
using Api.Services;
using Domain.Interfaces;
using Infrastructure;
using Infrastructure.Repositories;
using Infrastructure.Seed;
using Infrastructure.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.StaticFiles;
using Microsoft.Extensions.FileProviders;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Cors.Infrastructure;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;

var allowedOrigins = new[]
{
    "https://idoskor-1-frontend.onrender.com",
    "https://idoskor.onrender.com",
    "https://www.aktividoskor.hu"
};

var builder = WebApplication.CreateBuilder(args);

// -------------------------------------------------
// 1) Adatgyökér (Renderen: /var/data) + Db provider
// -------------------------------------------------
var dataRoot = Environment.GetEnvironmentVariable("DATA_ROOT")
              ?? Path.Combine(builder.Environment.ContentRootPath, "App_Data");
Directory.CreateDirectory(dataRoot);

var dbPath = Path.Combine(dataRoot, "idoskor.db");
var dbProvider = Environment.GetEnvironmentVariable("DB_PROVIDER") ?? "SqlServer";

// DbContext regisztráció – SQLite ágban PendingModelChangesWarning némítva
builder.Services.AddDbContext<AppDbContext>(opt =>
{
    if (string.Equals(dbProvider, "Sqlite", StringComparison.OrdinalIgnoreCase))
    {
        opt.UseSqlite($"Data Source={dbPath}");
        opt.ConfigureWarnings(w => w.Ignore(RelationalEventId.PendingModelChangesWarning));
    }
    else
    {
        opt.UseSqlServer(builder.Configuration.GetConnectionString("Default"));
    }
});

//CORS
builder.Services.AddCors(o =>
{
    o.AddPolicy("AppCors", p =>
        p.WithOrigins(allowedOrigins)
         .AllowAnyHeader()
         .AllowAnyMethod());
});

// -------------------------------------------------
// 2) Repositoryk, szolgáltatások
// -------------------------------------------------
builder.Services.AddScoped<ICardRepository, CardRepository>();
builder.Services.AddScoped<ICardService, CardService>();
builder.Services.AddScoped<IFileStorageService, FileStorageService>();
builder.Services.AddScoped<IPageRepository, PageRepository>();
builder.Services.AddScoped<IPageService, PageService>();
builder.Services.AddSingleton<ImageVariantService>();

builder.Services.AddControllers();

// -------------------------------------------------
// 3) Swagger
// -------------------------------------------------
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Idõskor API", Version = "v1" });
    c.OperationFilter<SwaggerMultipartFormDataFilter>();
});

// -------------------------------------------------
// 4) CORS (fejlesztéshez a 4200-as Angular miatt)
// -------------------------------------------------
builder.Services.AddCors(opt => opt.AddDefaultPolicy(p =>
    p.WithOrigins("http://localhost:4200").AllowAnyHeader().AllowAnyMethod()));

// -------------------------------------------------
// 5) MIME kiterjesztések (webp)
// -------------------------------------------------
var contentTypeProvider = new FileExtensionContentTypeProvider();
contentTypeProvider.Mappings[".webp"] = "image/webp";

// -------------------------------------------------
// 6) JWT auth
// -------------------------------------------------
var jwtSection = builder.Configuration.GetSection("Jwt");
var key = Encoding.UTF8.GetBytes(jwtSection["Key"] ?? "");

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwtSection["Issuer"],
            ValidateAudience = true,
            ValidAudience = jwtSection["Audience"],
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(key),
            ValidateLifetime = true
        };
    });

builder.Services.AddAuthorization();

var keysPath = Path.Combine(dataRoot, "keys");
Directory.CreateDirectory(keysPath);

builder.Services.AddDataProtection()
    .PersistKeysToFileSystem(new DirectoryInfo(keysPath))
    .SetApplicationName("Idoskor");

var app = builder.Build();

// -------------------------------------------------
// Middleware-ek
// -------------------------------------------------
app.UseCors("AppCors");
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Idõskor API v1");
    c.RoutePrefix = "";
});

app.UseAuthentication();
app.UseAuthorization();

// wwwroot statikus (képek, css, stb.) + webp támogatás
app.UseStaticFiles(new StaticFileOptions { ContentTypeProvider = contentTypeProvider });

// /uploads -> tartós lemez (Render Disk vagy helyben App_Data/uploads)
var uploadsPhysical = Path.Combine(dataRoot, "uploads");
Directory.CreateDirectory(uploadsPhysical);
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(uploadsPhysical),
    RequestPath = "/uploads",
    ServeUnknownFileTypes = true,
    ContentTypeProvider = contentTypeProvider
});

// -------------------------------------------------
// Adatbázis inicializálás
// -------------------------------------------------
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

    if (string.Equals(dbProvider, "Sqlite", StringComparison.OrdinalIgnoreCase))
        db.Database.EnsureCreated();   // csak létrehoz, nem migrál
    else
        db.Database.Migrate();         // MSSQL: migráció fut

    await DbSeeder.SeedAsync(db);      // itt már ne legyen Migrate()
}

// (opcionális) egészségügyi endpoint
app.MapGet("/healthz", () => Results.Ok("ok"));

//Login teszteléshez
app.MapGet("/api/ping", () => Results.Json(new { ok = true, src = "api", ts = DateTime.UtcNow }));

app.MapGet("/api/auth/diag2", (IConfiguration cfg) =>
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

app.MapPost("/api/auth/login", (IConfiguration cfg, [FromBody] LoginRequest body) =>
{
    if (body is null) return Results.BadRequest(new { error = "Empty body." });

    var user = cfg["AdminUser:Username"];
    var pass = cfg["AdminUser:Password"];
    if (string.IsNullOrWhiteSpace(user) || string.IsNullOrWhiteSpace(pass))
        return Results.Problem("Admin credentials are not configured on the server.", statusCode: 500);

    if (!string.Equals(body.Username, user, StringComparison.Ordinal) ||
        !string.Equals(body.Password, pass, StringComparison.Ordinal))
        return Results.Unauthorized();

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

public record LoginRequest(string Username, string Password);

app.MapControllers();
app.Run();
