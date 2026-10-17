export const config = {
  llmMode: process.env.LLM_MODE ?? 'auto', // 'demo' | 'ollama' | 'auto'
  ollamaHost: process.env.OLLAMA_HOST ?? 'http://localhost:11434',
  ollamaModel: process.env.OLLAMA_MODEL ?? 'zerotrace-analyst',
  ollamaTimeoutMs: Number(process.env.OLLAMA_TIMEOUT_MS ?? '120000'),
  ollamaKeepAlive: process.env.OLLAMA_KEEP_ALIVE ?? '10m',
  port: Number(process.env.PORT ?? '5001'),
  frontendOrigin: process.env.FRONTEND_ORIGIN ?? 'https://zero-day-olive.vercel.app',
} as const;
