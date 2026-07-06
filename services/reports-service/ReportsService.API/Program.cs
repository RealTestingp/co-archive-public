using ReportsService.Core.Exporters;
using ReportsService.Core.HttpClients;
using ReportsService.Core.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Register exporters
builder.Services.AddScoped<IReportExporter, ExcelExporter>();
builder.Services.AddScoped<IReportExporter, PdfExporter>();

// Register report generator
builder.Services.AddScoped<IReportGenerator, ReportGeneratorService>();

// Register typed HTTP client pointing at core-api
builder.Services.AddHttpClient<ICoreApiClient, CoreApiClient>(client =>
{
    client.BaseAddress = new Uri(
        builder.Configuration["CoreApi:BaseUrl"]
        ?? "http://localhost:5166");
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.MapControllers();

app.Run();