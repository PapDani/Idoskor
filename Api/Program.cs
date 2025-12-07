using System.Text;
using Infrastructure;
using Infrastructure.Seed;
using Infrastructure.Services;
using Domain.Interfaces;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.StaticFiles;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Infrastructure.Repositories;

var builder = WebApplication.CreateBuilder(args);

// Helper függvény env / config olvasáshoz
string? GetEnv(string key) =>
    builder.Configuration[key] ?? Environment.GetEnvironmentVariable(key);

// -------------------- DB_PROVIDER + DATA_ROOT --------------------

// Alapértelmezett: sqlite (Render + lokálra is jó)
var dbProvider = GetEnv("DB_PROVIDER")?.ToLowerInvariant();
if (string.IsNullOrWhiteSpace(dbProvider))
{
    dbProvider = "sqlite";
}

// DATA_ROOT: Render Disk mount vagy lokál App_Data
var dataRoot = GetEnv("DATA_ROOT");
if (string.IsNullOrWhiteSpace(dataRoot))
{
    dataRoot = Path.Combine(builder.Environment.ContentRootPath, "App_Data");
}
Directory.CreateDirectory(dataRoot);

// -------------------- DbContext konfiguráció --------------------

builder.Services.AddDbContext<AppDbContext>(options =>
{
    if (dbProvider == "sqlserver")
    {
        var connStr =
            builder.Configuration.GetConnectionString("DefaultConnection") ??
            GetEnv("SQLSERVER_CONNECTION") ??
            throw new InvalidOperationException("No SQL Server connection string configured.");

        options.UseSqlServer(connStr);
    }
    else
    {
        // Sqlite (default)
        var dbPath = Path.Combine(dataRoot!, "idoskor.db");
        var connStr = $"Data Source={dbPath}";
        options.UseSqlite(connStr);
    }
});

builder.Services.AddScoped<ICardRepository, CardRepository>();
builder.Services.AddScoped<ICardService, CardService>();

builder.Services.AddScoped<IFileStorageService, FileStorageService>();

builder.Services.AddScoped<IPageRepository, PageRepository>();
builder.Services.AddScoped<IPageService, PageService>();

// -------------------- CORS --------------------

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontends", policy =>
    {
        policy
            .WithOrigins(
                "http://localhost:4200",                  // lokál Angular
                "https://idoskor-1-frontend.onrender.com" // Render frontend
            )
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

// -------------------- Controllers --------------------

builder.Services.AddControllers();

// -------------------- Swagger --------------------

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Idõskor API",
        Version = "v1"
    });

    // JWT auth a Swagger UI-hoz
    var jwtScheme = new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "JWT Authorization header using the Bearer scheme."
    };

    c.AddSecurityDefinition("Bearer", jwtScheme);
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        { jwtScheme, Array.Empty<string>() }
    });
});

// -------------------- JWT autentikáció --------------------

var jwtKey = GetEnv("JWT__KEY") ?? "ChangeMe_DevOnly_12345678901234567890";
var jwtIssuer = GetEnv("JWT__ISSUER") ?? "Idoskor";
var jwtAudience = GetEnv("JWT__AUDIENCE") ?? "IdoskorAdmin";

var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));

builder.Services
    .AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        options.RequireHttpsMetadata = false;
        options.SaveToken = true;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = signingKey,
            ValidateIssuer = true,
            ValidIssuer = jwtIssuer,
            ValidateAudience = !string.IsNullOrWhiteSpace(jwtAudience),
            ValidAudience = string.IsNullOrWhiteSpace(jwtAudience) ? null : jwtAudience,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromMinutes(2)
        };
    });

// -------------------- Saját szolgáltatások --------------------

// Itt csak olyat regisztrálunk, amirõl biztosan tudjuk, hogy létezik.
builder.Services.AddScoped<ICardService, CardService>();

// Ha van külön ImageVariantService és interface, azt késõbb visszatehetjük,
// de most direkt NEM hivatkozunk IImageVariantService-re, hogy leforduljon.

// -------------------- App build --------------------

var app = builder.Build();

// -------------------- Middleware pipeline --------------------

if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}

// Swagger – most mindig elérhetõ
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Idõskor API v1");
    c.RoutePrefix = "";
});

// CORS – fontos: MapControllers elõtt
app.UseCors("AllowFrontends");

// Auth
app.UseAuthentication();
app.UseAuthorization();

// -------------------- Adatbázis inicializálás --------------------

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

    if (db.Database.IsSqlite())
    {
        // Sqlite: séma létrehozása modell alapján
        db.Database.EnsureCreated();
    }
    else
    {
        db.Database.Migrate();
    }

    await DbSeeder.SeedAsync(db);
}

// -------------------- Feltöltött képek (uploads) kiszolgálása --------------------

var uploadsPhysical = Path.Combine(dataRoot!, "uploads");
Directory.CreateDirectory(uploadsPhysical);

// .webp MIME-type fix (kártyák képei miatt)
var provider = new FileExtensionContentTypeProvider();
provider.Mappings[".webp"] = "image/webp";

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(uploadsPhysical),
    RequestPath = "/uploads",
    ContentTypeProvider = provider,
    ServeUnknownFileTypes = true
});

// -------------------- Végpontok --------------------

app.MapControllers();

app.Run();
