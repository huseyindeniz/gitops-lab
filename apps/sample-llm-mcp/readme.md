## Ollama

### Install model

`ollama pull model_name`

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
