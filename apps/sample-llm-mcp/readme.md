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
  "prompt": "Hello! How are you?"
}'
```

```bash
curl http://ollama.staging.local
curl http://ollama.staging.local/api/tags

curl http://ollama.staging.local/api/generate -d '{
  "model": "mistral",
  "prompt": "How is weather in Ankara now?"
}'
```
