using System.Text.Json.Nodes;
using System.Text.Json;
using ModelContextProtocol.Client;
using Microsoft.Extensions.AI;

namespace OllamaMCPApi.MCPClient
{
    public class ToolRouterService
    {
        private readonly Dictionary<string, IMcpClient> _toolToClient = new();
        private readonly Dictionary<string, McpClientTool> _toolDefinitions = new();
        private readonly JsonSerializerOptions _serializerOptions;

        public ToolRouterService(IConfiguration config, JsonSerializerOptions serializerOptions)
        {
            _serializerOptions = serializerOptions;

            var cliConfigs = config.GetSection("McpServers")
                       .Get<List<McpServerConfig>>() ?? new();
            foreach (var s in cliConfigs)
            {
                var transport = new StdioClientTransport(new StdioClientTransportOptions
                {
                    Name = s.Name,
                    Command = s.Command,
                    Arguments = [.. s.Arguments],
                });
                var client = McpClientFactory.CreateAsync(transport).GetAwaiter().GetResult();
                RegisterAllTools(s.Name, client);
            }

            var sseConfigs = config.GetSection("McpSseServers")
                       .Get<List<SseServerConfig>>() ?? new();
            foreach (var s in sseConfigs)
            {
                var transport = new SseClientTransport(transportOptions: new SseClientTransportOptions
                {
                    Endpoint = new Uri(s.Url),
                    Name = s.Name
                });
                var client = McpClientFactory.CreateAsync(transport).GetAwaiter().GetResult();
                RegisterAllTools(s.Name, client);
            }

            var httpConfigs = config.GetSection("McpHttpServers")
                       .Get<List<HttpServerConfig>>() ?? new();
            foreach (var s in httpConfigs)
            {
                var transport = new SseClientTransport(transportOptions: new SseClientTransportOptions
                {
                    Endpoint = new Uri(s.Url),
                    Name = s.Name,
                    UseStreamableHttp = true,
                });
                var client = McpClientFactory.CreateAsync(transport).GetAwaiter().GetResult();
                RegisterAllTools(s.Name, client);
            }

        }

        public async Task<string> CallToolAsync(string toolName, Dictionary<string, object?> parameters)
        {
            if (!_toolToClient.TryGetValue(toolName, out var client))
                throw new KeyNotFoundException($"Tool '{toolName}' not found.");

            var tools = await client.ListToolsAsync(); // why here, we need tool list in its own method

            // Wrap parameters in AIFunctionArguments so MCP client serializes properly
            var args = new AIFunctionArguments(parameters);

            // Call the tool via MCP client
            var callResponse = await client.CallToolAsync(
                toolName,
                args,
                progress: null,
                _serializerOptions,
                cancellationToken: CancellationToken.None
            ).ConfigureAwait(false);


            // Extract the first text content from the response
            var textPart = callResponse.Content
                .FirstOrDefault(c => c.Type == "text");
            return textPart?.Text ?? string.Empty;
        }

        public object[] GetAllToolDefinitions()
        {
            return _toolDefinitions.Values
                .Select(tool => new
                {
                    type = "function",
                    function = new
                    {
                        name = tool.Name,
                        description = tool.Description ?? string.Empty,
                        parameters = TrimSchema(tool.JsonSchema)
                    }
                })
                .ToArray();
        }


        private void RegisterAllTools(string serverName, IMcpClient client)
        {
            foreach (var tool in client.ListToolsAsync().GetAwaiter().GetResult())
            {
                _toolToClient[tool.Name] = client;
                _toolDefinitions[tool.Name] = tool;
            }
        }


        private static JsonNode TrimSchema(JsonElement schema)
        {
            var node = JsonNode.Parse(schema.GetRawText()) as JsonObject
                      ?? throw new InvalidOperationException("Schema is not an object");
            node.Remove("title");
            node.Remove("description");
            return node;
        }

    }
}
