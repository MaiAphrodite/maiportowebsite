# AI Model Configuration

This project now supports a modular AI backend. You can easily switch between providers (Grok, OpenAI, DeepSeek, or Custom) using environment variables.

## Configuration (.env)

Add specific variables to your `.env` file to switch providers.

### 1. Default (Grok / xAI)
Uses your existing configuration.
```bash
GROK_API_KEY=xai-...
# Defaults to AI_PROVIDER=grok and AI_MODEL_NAME=grok-2-latest
```

### 2. OpenAI
```bash
AI_PROVIDER=openai
AI_MODEL_NAME=gpt-4o
OPENAI_API_KEY=sk-...
```

### 3. DeepSeek
```bash
AI_PROVIDER=deepseek
AI_MODEL_NAME=deepseek-chat
DEEPSEEK_API_KEY=sk-...
```

### 4. Custom (Any OpenAI-compatible API)
Useful for local LLMs (Ollama) or other providers.
```bash
AI_PROVIDER=custom
AI_MODEL_NAME=llama3
AI_BASE_URL=http://localhost:11434/v1
AI_API_KEY=ollama
```

## How it works
The logic is located in `src/lib/ai.ts` and `src/app/api/chat/route.ts`. The API route automatically uses the configured model without needing code changes.
