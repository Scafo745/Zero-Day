import type { Request, Response } from 'express';
import { config } from '../config';
import type { HealthResponse } from '../types';

export default async function healthRoute(req: Request, res: Response): Promise<void> {
  let ollamaReachable = false;
  let modelPulled = false;

  try {
    const response = await fetch(`${config.ollamaHost}/api/tags`, {
      signal: AbortSignal.timeout(3000),
    });

    if (response.ok) {
      ollamaReachable = true;
      const data = (await response.json()) as { models?: Array<{ name?: string }> };
      if (Array.isArray(data.models)) {
        modelPulled = data.models.some((m) =>
          typeof m.name === 'string' && m.name.startsWith(config.ollamaModel)
        );
      }
    }
  } catch {
    ollamaReachable = false;
    modelPulled = false;
  }

  const healthData: HealthResponse = {
    status: ollamaReachable && modelPulled ? 'ok' : 'degraded',
    ollamaReachable,
    modelPulled,
    model: config.ollamaModel,
    uptime: Math.floor(process.uptime()),
  };

  res.status(200).json(healthData);
}
