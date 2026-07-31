using Microsoft.AspNetCore.RateLimiting;
using System.Threading.RateLimiting;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddOpenApi();

builder.Services.AddRateLimiter(options =>
{
    options.AddFixedWindowLimiter("chat", opt =>
    {
        opt.PermitLimit = 10;              // max 10 requests
        opt.Window = TimeSpan.FromMinutes(1); // per 1-minute window
        opt.QueueLimit = 0;                 // no queueing — over-limit requests are rejected immediately
    });

    options.OnRejected = async (context, token) =>
    {
        context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;
        await context.HttpContext.Response.WriteAsync("Too many requests. Please wait a moment before trying again.", token);
    };
});

// Only matters if someone tests chatbot-service directly from a browser, bypassing the gateway.
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
    app.MapOpenApi();
}

app.UseHttpsRedirection();
app.UseCors("ReactFrontend");
app.UseAuthorization();
app.MapControllers();
app.UseRateLimiter();

app.Run();