using System.Text.Json;

namespace OllamaMCPApi.MCPClient
{
    public class ToolDefinition
    {
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public JsonElement Parameters { get; set; }

    }
}
