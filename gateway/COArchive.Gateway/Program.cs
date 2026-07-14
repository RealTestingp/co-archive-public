var builder = WebApplication.CreateBuilder(args);

builder.Services.AddReverseProxy()
    .LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"));

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(
                "http://localhost:3000",
                "http://localhost:5173",
                "https://frontend.politeglacier-fb6c27b1.canadacentral.azurecontainerapps.io")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();

app.UseCors("AllowFrontend");

// TODO: app.UseAuthentication(); app.UseAuthorization();
// Wire these in once ASP.NET Core Identity or Azure AD is configured.

app.MapReverseProxy();

app.Run();