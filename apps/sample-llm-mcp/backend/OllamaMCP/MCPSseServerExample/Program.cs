// Program.cs
using Microsoft.Extensions.DependencyInjection;
using ModelContextProtocolServer.Sse;

await SseServer.RunAsync(services =>
{
    services.AddCors(options =>
    {
        options.AddPolicy("AllowAll", policy =>
        {
            policy
                .AllowAnyOrigin()
                .AllowAnyMethod()
                .AllowAnyHeader();
        });
    });
},
args);
