using OllamaMCPApi.MCPClient;

namespace OllamaMCPApi.LLMClient
{
    public class LlmResponseChunk
    {
        public string? ResponseText { get; set; }
        public List<ToolCall>? ToolCalls { get; set; }
        public string? Event { get; set; } // örn: "reset"
        public bool IsFinalChunk { get; set; }
    }


}
