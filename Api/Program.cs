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
app.UseCors();
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

app.MapControllers();
app.Run();
