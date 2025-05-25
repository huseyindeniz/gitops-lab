using OllamaMCPApi.LLMClient;
using OllamaMCPApi.MCPClient;
using System.Text.Json;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

builder.Services.AddHttpClient();

var jsonOptions = new JsonSerializerOptions(JsonSerializerDefaults.Web);
builder.Services.AddSingleton(jsonOptions);

builder.Services.AddSingleton<ToolRouterService>();
builder.Services.AddSingleton<LlmService>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy
            .AllowAnyOrigin()
            .AllowAnyMethod()
            .AllowAnyHeader();
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{

}

app.UseHttpsRedirection();

app.UseCors("AllowAll");

app.UseAuthorization();

app.MapControllers();

app.Run();
