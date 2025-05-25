using OllamaMCPApi.MCPClient;
using System.Text.Json;
using System.Text;

namespace OllamaMCPApi.LLMClient
{
    public class LlmService
    {
        private readonly HttpClient _client;
        private readonly JsonSerializerOptions _jsonOptions;
        private readonly ToolRouterService _toolRouter;

        public LlmService(IHttpClientFactory httpClientFactory, JsonSerializerOptions jsonOptions, ToolRouterService toolRouter)
        {
            _client = httpClientFactory.CreateClient();
            _jsonOptions = jsonOptions;
            _toolRouter = toolRouter;
        }

        public async Task<LlmResponse> SendPromptAsync(string prompt)
        {
            var payload = new
            {
                model = "mistral",
                messages = new[] { new { role = "user", content = prompt } },
                stream = false,
                tools = _toolRouter.GetAllToolDefinitions()
            };

            string jsonPayload = JsonSerializer.Serialize(payload, _jsonOptions);
            Console.WriteLine("=== Ollama payload ===");
            Console.WriteLine(jsonPayload);
            Console.WriteLine("======================");

            using var content = new StringContent(jsonPayload, Encoding.UTF8, "application/json");
            var outgoing = await content.ReadAsStringAsync();
            Console.WriteLine(">>> Outgoing body:");
            Console.WriteLine(outgoing);
            var response = await _client.PostAsync("http://localhost:11434/api/chat", content).ConfigureAwait(false);
            response.EnsureSuccessStatusCode();

            using var doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync().ConfigureAwait(false));
            var message = doc.RootElement.GetProperty("message");

            // Extract assistant content (often empty when tool_calls present)
            string responseText = message.GetProperty("content").GetString() ?? string.Empty;

            // Extract tool calls
            var calls = new List<ToolCall>();
            if (message.TryGetProperty("tool_calls", out var toolsProp))
            {
                foreach (var call in toolsProp.EnumerateArray())
                {
                    var id = "tool1"; // call.GetProperty("id").GetString();
                    var func = call.GetProperty("function");
                    calls.Add(new ToolCall
                    {
                        ToolName = func.GetProperty("name").GetString()!,
                        Arguments = func.GetProperty("arguments").ToString(),
                        ToolCallId = id
                    });
                }
            }
            // if calls not empty, run tools
            if (calls.Count != 0)
            {
                var toolCall = calls.First();
                var toolResult = await HandleToolCallAsync(toolCall);
                var userMessage = new { role = "user", content = prompt };
                var assistantMessage = new Dictionary<string, object>
                {
                    ["role"] = "assistant",
                    ["tool_calls"] = new[]
                        {
                            new Dictionary<string, object>
                            {
                                ["id"] = "tool1", // fake ID
                                ["function"] = new Dictionary<string, object>
                                {
                                    ["name"] = toolCall.ToolName,
                                    ["arguments"] = JsonSerializer.Deserialize<JsonElement>(toolCall.Arguments!, _jsonOptions)
                                }
                            }
                        }
                };
                var toolMessage = new
                {
                    role = "tool",
                    tool_call_id = toolCall.ToolCallId,
                    content = toolResult
                };
                var messages = new object[] { userMessage, assistantMessage, toolMessage };
                var payload2 = new
                {
                    model = "mistral",
                    messages,
                    stream = false,
                    tools = _toolRouter.GetAllToolDefinitions()
                };
                string jsonPayload2 = JsonSerializer.Serialize(payload2, _jsonOptions);
                using var content2 = new StringContent(jsonPayload2, Encoding.UTF8, "application/json");
                var outgoing2 = await content2.ReadAsStringAsync();
                Console.WriteLine(">>> Outgoing body 2:");
                Console.WriteLine(outgoing2);
                var response2 = await _client.PostAsync("http://localhost:11434/api/chat", content2).ConfigureAwait(false);
                response2.EnsureSuccessStatusCode();

                using var doc2 = JsonDocument.Parse(await response2.Content.ReadAsStringAsync().ConfigureAwait(false));
                var message2 = doc2.RootElement.GetProperty("message");
                responseText = message2.GetProperty("content").GetString() ?? string.Empty;
            }
            return new LlmResponse
            {
                ResponseText = responseText,
                ToolCalls = calls
            };

        }

        public async IAsyncEnumerable<LlmResponseChunk> SendPromptStreamWithToolSupportAsync(string prompt)
        {
            var systemMessage = new
            {
                role = "system",
                content = "You have access to tools via function calling. Only use them when you cannot answer the question yourself."
            };

            var userMessage = new { role = "user", content = prompt };

            var messages = new List<object> { userMessage };

            // İlk stream
            var firstPayload = new Dictionary<string, object>
            {
                ["model"] = "mistral",
                ["messages"] = messages.ToArray(),
                ["stream"] = true,
                ["tools"] = _toolRouter.GetAllToolDefinitions()
            };

            var toolCall = default(ToolCall);
            var hasYielded = false;

            await foreach (var chunk in StreamOllamaResponse(firstPayload))
            {
                if (chunk.ToolCalls is { Count: > 0 })
                {
                    toolCall = chunk.ToolCalls.First();

                    if (!hasYielded)
                    {
                        // client'a reset sinyali gönder
                        yield return new LlmResponseChunk
                        {
                            Event = "reset",
                            ToolCalls = chunk.ToolCalls
                        };
                    }

                    break; // tool call varsa ilk stream'i kes, tool'u çalıştır
                }

                if (chunk.IsFinalChunk)
                {
                    yield break;
                }

                if (!string.IsNullOrWhiteSpace(chunk.ResponseText))
                {
                    hasYielded = true;
                    yield return chunk;
                }
            }

            // Eğer tool call yoksa → zaten return edilmişti
            if (toolCall == null)
            {
                yield break;
            }

            // Tool'u çağır
            string toolResult = await HandleToolCallAsync(toolCall);

            // Yeni mesaj dizisi oluştur
            var assistantToolCallMessage = new Dictionary<string, object>
            {
                ["role"] = "assistant",
                ["tool_calls"] = new[]
                {
            new Dictionary<string, object>
            {
                ["id"] = toolCall.ToolCallId,
                ["function"] = new Dictionary<string, object>
                {
                    ["name"] = toolCall.ToolName,
                    ["arguments"] = JsonSerializer.Deserialize<JsonElement>(toolCall.Arguments!)
                }
            }
        }
            };

            var toolResultMessage = new
            {
                role = "tool",
                tool_call_id = toolCall.ToolCallId,
                content = toolResult
            };

            messages.Add(assistantToolCallMessage);
            messages.Add(toolResultMessage);

            var secondPayload = new Dictionary<string, object>
            {
                ["model"] = "mistral",
                ["messages"] = messages.ToArray(),
                ["stream"] = true,
            };

            // İkinci stream
            await foreach (var chunk in StreamOllamaResponse(secondPayload))
            {
                if (chunk.IsFinalChunk)
                {
                    yield break;
                }

                if (!string.IsNullOrWhiteSpace(chunk.ResponseText))
                {
                    yield return chunk;
                }
            }
        }


        private async IAsyncEnumerable<LlmResponseChunk> StreamOllamaResponse(object payload)
        {
            string jsonPayload = JsonSerializer.Serialize(payload, _jsonOptions);

            using var request = new HttpRequestMessage(HttpMethod.Post, "http://localhost:11434/api/chat")
            {
                Content = new StringContent(jsonPayload, Encoding.UTF8, "application/json")
            };

            using var response = await _client.SendAsync(
                request,
                HttpCompletionOption.ResponseHeadersRead,
                CancellationToken.None
            ).ConfigureAwait(false);

            response.EnsureSuccessStatusCode();

            using var stream = await response.Content.ReadAsStreamAsync().ConfigureAwait(false);
            using var reader = new StreamReader(stream);

            while (!reader.EndOfStream)
            {
                var line = await reader.ReadLineAsync().ConfigureAwait(false);
                if (string.IsNullOrWhiteSpace(line))
                {
                    continue;
                }

                var chunk = TryParseChunk(line);
                if (chunk != null)
                {
                    yield return chunk;
                }
            }
        }

        private static LlmResponseChunk? TryParseChunk(string line)
        {
            try
            {
                using var doc = JsonDocument.Parse(line);
                var root = doc.RootElement;

                bool isFinal = root.TryGetProperty("done", out var doneProp) && doneProp.GetBoolean();

                if (!root.TryGetProperty("message", out var message))
                {
                    return new LlmResponseChunk { IsFinalChunk = isFinal };
                }

                string? content = message.TryGetProperty("content", out var cProp) ? cProp.GetString() : null;

                List<ToolCall>? toolCalls = null;
                if (message.TryGetProperty("tool_calls", out var toolsProp))
                {
                    toolCalls = toolsProp.EnumerateArray().Select(call =>
                    {
                        var func = call.GetProperty("function");
                        return new ToolCall
                        {
                            ToolName = func.GetProperty("name").GetString()!,
                            Arguments = func.GetProperty("arguments").ToString(),
                            ToolCallId = call.TryGetProperty("id", out var idProp) ? idProp.GetString() ?? "tool1" : "tool1"
                        };
                    }).ToList();
                }

                return new LlmResponseChunk
                {
                    ResponseText = content,
                    ToolCalls = toolCalls,
                    IsFinalChunk = isFinal
                };
            }
            catch
            {
                return null;
            }
        }

        public async IAsyncEnumerable<string> SendPromptStreamSimpleAsync(string prompt)
        {
            var payload = new
            {
                model = "mistral",
                messages = new[] { new { role = "user", content = prompt } },
                stream = true
            };

            var jsonOptions = new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            };

            string jsonPayload = JsonSerializer.Serialize(payload, jsonOptions);

            using var request = new HttpRequestMessage(HttpMethod.Post, "http://localhost:11434/api/chat")
            {
                Content = new StringContent(jsonPayload, Encoding.UTF8, "application/json")
            };

            using var response = await _client.SendAsync(
                request,
                HttpCompletionOption.ResponseHeadersRead,
                CancellationToken.None
            ).ConfigureAwait(false);

            response.EnsureSuccessStatusCode();

            using var stream = await response.Content.ReadAsStreamAsync().ConfigureAwait(false);
            using var reader = new StreamReader(stream);

            while (!reader.EndOfStream)
            {
                var line = await reader.ReadLineAsync().ConfigureAwait(false);
                if (string.IsNullOrWhiteSpace(line))
                    continue;

                var parsed = TryParseContent(line);
                if (parsed != null)
                    yield return parsed;
            }
        }

        private static string? TryParseContent(string line)
        {
            try
            {
                using var doc = JsonDocument.Parse(line);
                if (doc.RootElement.TryGetProperty("message", out var msg) &&
                    msg.TryGetProperty("content", out var contentProp))
                {
                    return contentProp.GetString();
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Parse error] {ex.Message}");
            }

            return null;
        }

        public async IAsyncEnumerable<string> StreamPromptAsyncCopilotWrong(string prompt)
        {
            var payload = new
            {
                model = "mistral",
                messages = new[] { new { role = "user", content = prompt } },
                stream = true,
                tools = _toolRouter.GetAllToolDefinitions()
            };

            var jsonPayload = JsonSerializer.Serialize(payload, _jsonOptions);
            using var content = new StringContent(jsonPayload, Encoding.UTF8, "application/json");
            using var request = new HttpRequestMessage(HttpMethod.Post, "http://localhost:11434/api/chat")
            {
                Content = content
            };

            using var response = await _client.SendAsync(request, HttpCompletionOption.ResponseHeadersRead).ConfigureAwait(false);
            response.EnsureSuccessStatusCode();

            using var stream = await response.Content.ReadAsStreamAsync();
            using var reader = new StreamReader(stream);

            while (!reader.EndOfStream)
            {
                var line = await reader.ReadLineAsync();
                if (string.IsNullOrWhiteSpace(line))
                {
                    continue;
                }
                if (line.StartsWith("data: "))
                {
                    line = line[6..];
                }
                if (line == "[DONE]")
                {
                    yield break;
                }

                string? token = null;
                bool isToolCall = false;

                try
                {
                    using var doc = JsonDocument.Parse(line);
                    var root = doc.RootElement;
                    if (root.TryGetProperty("message", out var msg))
                    {
                        if (msg.TryGetProperty("tool_calls", out var toolCalls) && toolCalls.ValueKind == JsonValueKind.Array && toolCalls.GetArrayLength() > 0)
                        {
                            isToolCall = true;
                        }
                        if (msg.TryGetProperty("content", out var contentProp))
                        {
                            token = contentProp.GetString();
                        }
                    }
                }
                catch
                {
                    // Hataları yut
                }

                if (!string.IsNullOrEmpty(token))
                {
                    yield return token;
                }

                if (isToolCall)
                {
                    yield break;
                }
            }
        }

        public async IAsyncEnumerable<string> StreamPromptAsyncOrig(string prompt)
        {
            var userMessage = new { role = "user", content = prompt };

            var payload = new
            {
                model = "mistral",
                messages = new object[] { userMessage },
                stream = true,
                tools = _toolRouter.GetAllToolDefinitions()
            };

            var request = new HttpRequestMessage(HttpMethod.Post, "http://localhost:11434/api/chat")
            {
                Content = new StringContent(JsonSerializer.Serialize(payload, _jsonOptions), Encoding.UTF8, "application/json")
            };

            using var response = await _client.SendAsync(request, HttpCompletionOption.ResponseHeadersRead).ConfigureAwait(false);
            response.EnsureSuccessStatusCode();

            using var stream = await response.Content.ReadAsStreamAsync();
            using var reader = new StreamReader(stream);

            var responseText = new StringBuilder();
            var toolCalls = new List<ToolCall>();

            while (!reader.EndOfStream)
            {
                var line = await reader.ReadLineAsync();
                if (string.IsNullOrWhiteSpace(line)) continue;

                if (line.StartsWith("data: "))
                    line = line.Substring(6);

                if (line == "[DONE]") yield break;

                using var doc = JsonDocument.Parse(line);
                var message = doc.RootElement.GetProperty("message");

                // Check for tool call
                if (message.TryGetProperty("tool_calls", out var toolsProp))
                {
                    foreach (var call in toolsProp.EnumerateArray())
                    {
                        var id = "tool1"; // call.GetProperty("id").GetString();
                        var func = call.GetProperty("function");
                        toolCalls.Add(new ToolCall
                        {
                            ToolName = func.GetProperty("name").GetString()!,
                            Arguments = func.GetProperty("arguments").ToString(),
                            ToolCallId = id
                        });
                    }
                    break;
                }

                var content = message.GetProperty("content").GetString();
                if (!string.IsNullOrEmpty(content))
                {
                    responseText.Append(content);
                    yield return content;
                }
            }

            if (toolCalls.Count > 0)
            {
                var toolCall = toolCalls.First();
                var toolResult = await HandleToolCallAsync(toolCall);

                var assistantMessage = new Dictionary<string, object>
                {
                    ["role"] = "assistant",
                    ["tool_calls"] = new[]
                    {
                new Dictionary<string, object>
                {
                    ["id"] = "tool1",
                    ["function"] = new Dictionary<string, object>
                    {
                        ["name"] = toolCall.ToolName,
                        ["arguments"] = JsonSerializer.Deserialize<JsonElement>(toolCall.Arguments!, _jsonOptions)
                    }
                }
            }
                };

                var toolMessage = new
                {
                    role = "tool",
                    tool_call_id = toolCall.ToolCallId,
                    content = toolResult
                };

                var messages = new object[] { userMessage, assistantMessage, toolMessage };
                var payload2 = new
                {
                    model = "mistral",
                    messages,
                    stream = true,
                    tools = _toolRouter.GetAllToolDefinitions()
                };

                var request2 = new HttpRequestMessage(HttpMethod.Post, "http://localhost:11434/api/chat")
                {
                    Content = new StringContent(JsonSerializer.Serialize(payload2, _jsonOptions), Encoding.UTF8, "application/json")
                };

                using var response2 = await _client.SendAsync(request2, HttpCompletionOption.ResponseHeadersRead).ConfigureAwait(false);
                response2.EnsureSuccessStatusCode();

                using var stream2 = await response2.Content.ReadAsStreamAsync();
                using var reader2 = new StreamReader(stream2);

                while (!reader2.EndOfStream)
                {
                    var line = await reader2.ReadLineAsync();
                    if (string.IsNullOrWhiteSpace(line)) continue;

                    if (line.StartsWith("data: "))
                        line = line.Substring(6);

                    if (line == "[DONE]") yield break;

                    using var doc2 = JsonDocument.Parse(line);
                    var content2 = doc2.RootElement.GetProperty("message").GetProperty("content").GetString();
                    if (!string.IsNullOrEmpty(content2)) yield return content2;
                }
            }
        }

        public async IAsyncEnumerable<string> StreamPromptAsyncOld(string prompt)
        {
            var userMessage = new { role = "user", content = prompt };

            var payload = new
            {
                model = "mistral",
                messages = new object[] { userMessage },
                stream = true,
                tools = _toolRouter.GetAllToolDefinitions()
            };

            var request = new HttpRequestMessage(HttpMethod.Post, "http://localhost:11434/api/chat")
            {
                Content = new StringContent(JsonSerializer.Serialize(payload, _jsonOptions), Encoding.UTF8, "application/json")
            };

            using var response = await _client.SendAsync(request, HttpCompletionOption.ResponseHeadersRead).ConfigureAwait(false);
            response.EnsureSuccessStatusCode();

            using var stream = await response.Content.ReadAsStreamAsync();
            using var reader = new StreamReader(stream);

            ToolCall? toolCall = null;

            while (!reader.EndOfStream)
            {
                var line = await reader.ReadLineAsync();
                if (string.IsNullOrWhiteSpace(line)) continue;
                if (line.StartsWith("data: ")) line = line[6..];
                if (line == "[DONE]") yield break;

                string? token = null;
                bool isToolCall = false;

                try
                {
                    using var doc = JsonDocument.Parse(line);
                    var root = doc.RootElement;
                    if (root.TryGetProperty("message", out var msg))
                    {
                        if (msg.TryGetProperty("tool_calls", out var toolCalls))
                        {
                            var func = toolCalls[0].GetProperty("function");
                            toolCall = new ToolCall
                            {
                                ToolName = func.GetProperty("name").GetString()!,
                                Arguments = func.GetProperty("arguments").ToString(),
                                ToolCallId = toolCalls[0].GetProperty("id").GetString() ?? "tool1"
                            };
                            isToolCall = true;
                        }

                        if (msg.TryGetProperty("content", out var contentProp))
                        {
                            token = contentProp.GetString();
                        }
                    }
                }
                catch { }

                if (!string.IsNullOrEmpty(token))
                {
                    yield return token;
                }

                if (isToolCall)
                {
                    break;
                }
            }

            if (toolCall is not null)
            {
                var toolResult = await HandleToolCallAsync(toolCall);

                var assistantMessage = new Dictionary<string, object>
                {
                    ["role"] = "assistant",
                    ["tool_calls"] = new[]
                    {
                new Dictionary<string, object>
                {
                    ["id"] = toolCall.ToolCallId,
                    ["function"] = new Dictionary<string, object>
                    {
                        ["name"] = toolCall.ToolName,
                        ["arguments"] = JsonSerializer.Deserialize<JsonElement>(toolCall.Arguments!, _jsonOptions)
                    }
                }
            }
                };

                var toolMessage = new
                {
                    role = "tool",
                    tool_call_id = toolCall.ToolCallId,
                    content = JsonSerializer.Deserialize<JsonElement>(toolResult, _jsonOptions)
                };

                var secondPayload = new
                {
                    model = "mistral",
                    messages = new object[] { userMessage, assistantMessage, toolMessage },
                    stream = true,
                    tools = _toolRouter.GetAllToolDefinitions()
                };

                var request2 = new HttpRequestMessage(HttpMethod.Post, "http://localhost:11434/api/chat")
                {
                    Content = new StringContent(JsonSerializer.Serialize(secondPayload, _jsonOptions), Encoding.UTF8, "application/json")
                };

                using var response2 = await _client.SendAsync(request2, HttpCompletionOption.ResponseHeadersRead).ConfigureAwait(false);
                response2.EnsureSuccessStatusCode();

                using var stream2 = await response2.Content.ReadAsStreamAsync();
                using var reader2 = new StreamReader(stream2);

                while (!reader2.EndOfStream)
                {
                    var line = await reader2.ReadLineAsync();
                    if (string.IsNullOrWhiteSpace(line)) continue;
                    if (line.StartsWith("data: ")) line = line[6..];
                    if (line == "[DONE]") yield break;

                    string? token = null;

                    try
                    {
                        using var doc = JsonDocument.Parse(line);
                        var root = doc.RootElement;
                        if (root.TryGetProperty("message", out var msg) && msg.TryGetProperty("content", out var contentProp))
                        {
                            token = contentProp.GetString();
                        }
                    }
                    catch { }

                    if (!string.IsNullOrEmpty(token))
                    {
                        yield return token;
                    }
                }
            }
        }

        public async Task<string> HandleToolCallAsync(ToolCall toolCall)
        {
            var parameters = JsonSerializer.Deserialize<Dictionary<string, object?>>(toolCall.Arguments)
                             ?? [];
            return await _toolRouter.CallToolAsync(toolCall.ToolName, parameters);
        }



    }
}
