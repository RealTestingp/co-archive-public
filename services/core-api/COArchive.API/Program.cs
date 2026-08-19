using Azure.Storage.Blobs;
using COArchive.API.Services;
using COArchive.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Identity.Web;

var builder = WebApplication.CreateBuilder(args);

// Add Entra ID authentication
//builder.Services.AddAuthentication()
//    .AddMicrosoftIdentityWebApi(builder.Configuration.GetSection("AzureAd"));

builder.Services.AddControllers().AddJsonOptions(o =>
       o.JsonSerializerOptions.Converters.Add(
           new System.Text.Json.Serialization.JsonStringEnumConverter()));
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// DbContext — pulled from COArchive project via project reference
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Blob Storage — for profile images and program PDFs
builder.Services.AddSingleton(x => new BlobServiceClient(
    builder.Configuration.GetConnectionString("BlobStorage")));
builder.Services.AddScoped<BlobStorageService>();

//ContentModeration using Profanity.Detector NuGet Package
builder.Services.AddSingleton<ContentModerationService>();

// CORS — allow React frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("ReactFrontend", policy =>
    {
        policy.WithOrigins(
                "http://localhost:3000",
                "http://localhost:5173"
            )
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("ReactFrontend");
//Entra ID is not ready - uncomment the below lines once authentication is configured
//app.UseAuthentication();
//app.UseAuthorization();
app.MapControllers();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider
        .GetRequiredService<ApplicationDbContext>();
    await DataSeeder.SeedAsync(db);
}

app.Run();