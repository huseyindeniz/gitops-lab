using Microsoft.AspNetCore.Mvc;
using OllamaMCPApi.LLMClient;
using System.Text;
using System.Text.Json;

namespace OllamaMCPApi.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class ChatController : ControllerBase
    {

        private readonly ILogger<ChatController> _logger;
        private readonly LlmService _llmService;

        public ChatController(LlmService llmService, ILogger<ChatController> logger)
        {
            _logger = logger;
            _llmService = llmService;
        }

        [HttpPost]
        public async Task Chat()
        {
            Response.ContentType = "text/event-stream";

            using var reader = new StreamReader(Request.Body);
            var prompt = await reader.ReadToEndAsync();

            var llmResponse = await _llmService.SendPromptAsync(prompt);
            var message = llmResponse.ResponseText ?? string.Empty;
            await WriteStreamAsync(message);
        }

        [HttpPost("stream")]
        public async Task StreamToolAwareChat()
        {
            Response.ContentType = "text/event-stream";
            HttpContext.Response.Headers.Add("Cache-Control", "no-cache");
            HttpContext.Response.Headers.Add("X-Accel-Buffering", "no");

            var bufferingFeature = HttpContext.Features.Get<Microsoft.AspNetCore.Http.Features.IHttpResponseBodyFeature>();
            bufferingFeature?.DisableBuffering();

            using var reader = new StreamReader(Request.Body);
            var prompt = await reader.ReadToEndAsync();

            await foreach (var chunk in _llmService.SendPromptStreamWithToolSupportAsync(prompt))
            {
                if (chunk.Event == "reset")
                {
                    // Client’a tüm eski tokenları silmesini söyle
                    await WriteEventAsync("reset");
                }

                if (!string.IsNullOrEmpty(chunk.ResponseText))
                {
                    await WriteStreamAsync(chunk.ResponseText);
                }
            }
        }


        [HttpPost("stream-simple")]
        public async Task StreamSimpleChat()
        {
            Response.ContentType = "text/event-stream";
            HttpContext.Response.Headers.Add("Cache-Control", "no-cache");
            HttpContext.Response.Headers.Add("X-Accel-Buffering", "no");
            var bufferingFeature = HttpContext.Features.Get<Microsoft.AspNetCore.Http.Features.IHttpResponseBodyFeature>();
            bufferingFeature?.DisableBuffering();

            using var reader = new StreamReader(Request.Body);
            var prompt = await reader.ReadToEndAsync();

            await foreach (var chunk in _llmService.SendPromptStreamSimpleAsync(prompt))
            {
                await WriteStreamAsync(chunk);
            }
        }

        [HttpPost("stream-copilot")]
        public async Task StreamChatCopilot()
        {
            Response.ContentType = "text/event-stream";
            HttpContext.Response.Headers.Add("Cache-Control", "no-cache");
            HttpContext.Response.Headers.Add("X-Accel-Buffering", "no");
            var bufferingFeature = HttpContext.Features.Get<Microsoft.AspNetCore.Http.Features.IHttpResponseBodyFeature>();
            bufferingFeature?.DisableBuffering();

            using var reader = new StreamReader(Request.Body);
            var prompt = await reader.ReadToEndAsync();

            await foreach (var chunk in _llmService.StreamPromptAsyncCopilotWrong(prompt))
            {
                await WriteStreamAsync(chunk);
            }
        }

        [HttpGet("test-stream")]
        public async Task TestStream()
        {
            Response.ContentType = "text/event-stream";
            HttpContext.Response.Headers.Add("Cache-Control", "no-cache");
            HttpContext.Response.Headers.Add("X-Accel-Buffering", "no");
            var bufferingFeature = HttpContext.Features.Get<Microsoft.AspNetCore.Http.Features.IHttpResponseBodyFeature>();
            bufferingFeature?.DisableBuffering();

            for (int i = 0; i < 5; i++)
            {
                await WriteStreamAsync($"chunk {i}");
                await Task.Delay(1000);
            }
        }

        private async Task WriteStreamAsync(string content)
        {
            var data = $"data: {content.Replace("\n", "\\n")}\n\n";
            var bytes = Encoding.UTF8.GetBytes(data);
            await Response.Body.WriteAsync(bytes, 0, bytes.Length);
            await Response.Body.FlushAsync();
        }

        private async Task WriteEventAsync(string eventName)
        {
            var data = $"event: {eventName}\ndata: \n\n";
            var bytes = Encoding.UTF8.GetBytes(data);
            await Response.Body.WriteAsync(bytes, 0, bytes.Length);
            await Response.Body.FlushAsync();
        }


    }
}
