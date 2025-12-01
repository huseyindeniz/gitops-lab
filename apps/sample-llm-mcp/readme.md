## Ollama

### Models

| Feature               | Qwen3:8b                   | Qwen2.5:7b             | Llama3.2:3b            |
| --------------------- | -------------------------- | ---------------------- | ---------------------- |
| VRAM Usage            | ~5GB                       | ~4.5GB                 | ~2GB                   |
| Model Size            | 4.9GB                      | 4.4GB                  | 2.0GB                  |
| Tool Calling F1       | 0.933                      | ~0.85                  | ~0.80                  |
| MCP Support           | Native                     | Native                 | Basic                  |
| Context Window        | 32K (131K YaRN)            | 32K (128K)             | 128K                   |
| Inference Speed       | Medium                     | Fast                   | Very Fast              |
| Agentic Tasks         | Excellent                  | Very Good              | Simple tasks only      |
| Instruction Following | Excellent                  | Very Good              | Good                   |
| Ollama Downloads      | 7.2M                       | 17.1M                  | 48M                    |
| Maturity              | New (2025)                 | Stable (2024)          | Stable (2024)          |
| Recommended Use       | Complex agents, multi-tool | General purpose agents | Lightweight prototypes |

**Summary:** Best performance: `qwen3:8b` / Most balanced: `qwen2.5:7b` / Most lightweight: `llama3.2:3b`

### Install model

in the pod

`ollama pull model_name`

or remote

`curl http://ollama.staging.local/api/pull -d '{"name": "qwen3:8b"}'`
`curl http://ollama.staging.local/api/pull -d '{"name": "qwen2.5:7b"}'`
`curl http://ollama.staging.local/api/pull -d '{"name": "llama3.2:3b"}'`

models supporting MCP

- mistral
-

### Quick testing

```bash
curl http://localhost:11434
curl http://localhost:11434/api/tags

curl http://localhost:11434/api/generate -d '{
  "model": "mistral",
  "prompt": "Hello! How are you?",
}'
```

```bash
curl http://ollama.staging.local
curl http://ollama.staging.local/api/tags

curl http://ollama.staging.local/api/generate -d '{
  "model": "mistral",
  "prompt": "How is the current weather in Ankara?"
}'

curl -N http://localhost:11434/api/generate -H "Content-Type: text/plain" -d '{
  "model": "mistral",
  "prompt": "How is the current weather in Ankara?",
  "stream": false
}'
```

with mcp support

```bash
curl -N http://localhost:5215/chat -H "Content-Type: text/plain" --data "How is the current weather in Ankara?"
```

compare it with: https://api.open-meteo.com/v1/forecast?latitude=39.9042&longitude=32.8357&current_weather=true

stream

```bash
curl -N http://localhost:5215/chat/stream -H "Content-Type: text/plain" --data "How is the current weather in Ankara?"
```
