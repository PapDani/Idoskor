using Domain.Interfaces;
using Infrastructure;
using Infrastructure.Repositories;
using Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// 1. DbContext
builder.Services.AddDbContext<AppDbContext>(opt =>
    opt.UseSqlServer(builder.Configuration.GetConnectionString("Default")));

// 2. Repository �s Service (ha van Service layer)
builder.Services.AddScoped<ICardRepository, CardRepository>();
builder.Services.AddScoped<ICardService, CardService>();

// 3. Controller szolg�ltat�s
builder.Services.AddControllers();

// 4. Swagger / OpenAPI
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Id�skor API", Version = "v1" });
});

// 5. CORS
builder.Services.AddCors(opt => opt.AddDefaultPolicy(p =>
    p.WithOrigins("http://localhost:4200").AllowAnyHeader().AllowAnyMethod()));

// 6. Authentication / Authorization
builder.Services.AddAuthentication(/* JWT be�ll�t�sok */);
builder.Services.AddAuthorization();

var app = builder.Build();

// Middleware-ek
app.UseCors();
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Id�skor API v1");
    c.RoutePrefix = "";
});
app.UseAuthentication();
app.UseAuthorization();

// Controller routol�s
app.MapControllers();

app.Run();
