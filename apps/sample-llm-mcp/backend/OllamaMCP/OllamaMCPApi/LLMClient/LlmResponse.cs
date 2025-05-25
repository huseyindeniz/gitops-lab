using OllamaMCPApi.MCPClient;

namespace OllamaMCPApi.LLMClient
{
    public class LlmResponse
    {
        public string ResponseText { get; set; } = string.Empty;
        public List<ToolCall> ToolCalls { get; set; } = [];

    }
}
