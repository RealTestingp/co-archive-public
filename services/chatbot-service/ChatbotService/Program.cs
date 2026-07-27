var builder = WebApplication.CreateBuilder(args);

// Add controllers
builder.Services.AddControllers();
builder.Services.AddOpenApi();

// CORS: allows requests from these origins to call this service directly.

// In practice, this almost never applies in production. The browser
// only ever talks to the gateway, and the gateway forwards requests to
// this service server-to-server, which isn't subject to CORS at all

// This policy really only matters if someone tests
// chatbot-service directly from a browser at localhost, bypassing the
// gateway entirely.
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

app.Run();