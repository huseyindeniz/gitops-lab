namespace OllamaMCPApi.MCPClient
{
    public class McpServerConfig
    {
        public string Name { get; set; } = string.Empty;
        public string Command { get; set; } = string.Empty;
        public List<string> Arguments { get; set; } = new();
    }
}
