import 'dotenv/config';
import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import { config } from './config';
import streamRoute from './routes/stream';
import simulateRoute from './routes/simulate';
import containRoute from './routes/contain';
import healthRoute from './routes/health';

const app = express();

// CORS configuration supporting production Vercel deployment, localhost, and cloud origins
const allowedOrigins = [
  'https://zero-day-olive.vercel.app',
  'http://localhost:3000',
  'http://localhost:5001',
  'http://127.0.0.1:3000',
  config.frontendOrigin,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or server-to-server)
      if (!origin) return callback(null, true);

      if (
        allowedOrigins.includes(origin) ||
        origin.endsWith('.vercel.app') ||
        config.frontendOrigin === '*'
      ) {
        return callback(null, true);
      }

      // Allow any incoming origin dynamically for seamless multi-environment hosting
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'X-Requested-With'],
  })
);
app.use(express.json());

// Routes
app.get('/api/stream', streamRoute);
app.post('/api/simulate-attack', simulateRoute);
app.post('/api/contain', containRoute);
app.get('/api/health', healthRoute);

// Global Express error handler
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  console.error('[server] Unhandled error:', err);
  if (err.message && err.message.includes('Ollama required')) {
    res.status(503).json({ ok: false, message: 'Ollama required but unavailable' });
    return;
  }
  res.status(500).json({ ok: false, message: 'Internal server error' });
});

// Start
if (process.env.NODE_ENV !== 'test') {
  app.listen(config.port, async () => {
    console.log(`[server] ZeroTrace backend listening on port ${config.port}`);

    // Warm-up: pre-load the model into Ollama memory
    if (config.llmMode !== 'demo') {
      try {
        console.log('[server] Sending Ollama warm-up request...');
        await fetch(`${config.ollamaHost}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: config.ollamaModel,
            messages: [{ role: 'user', content: 'ready' }],
            stream: false,
            keep_alive: config.ollamaKeepAlive,
            options: { temperature: 0.1, num_predict: 1 },
          }),
          signal: AbortSignal.timeout(180_000),
        });
        console.log('[server] Warm-up complete — model is resident in memory');
      } catch (err) {
        console.warn(
          '[server] Warm-up failed (Ollama not running?) — fallback mode will be used:',
          (err as Error).message
        );
      }
    }
  });
}

export default app;
