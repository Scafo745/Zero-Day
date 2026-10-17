import type { Response } from 'express';
import type { ZeroTraceIncidentEvent } from './types';

const clients = new Set<Response>();
const keepAliveIntervals = new WeakMap<Response, NodeJS.Timeout>();

export function addClient(res: Response): void {
  clients.add(res);
  const interval = setInterval(() => {
    try {
      res.write(': ping\n\n');
    } catch {
      removeClient(res);
    }
  }, 15000);
  keepAliveIntervals.set(res, interval);
}

export function removeClient(res: Response): void {
  clients.delete(res);
  const interval = keepAliveIntervals.get(res);
  if (interval) {
    clearInterval(interval);
    keepAliveIntervals.delete(res);
  }
}

export function broadcast(event: ZeroTraceIncidentEvent): void {
  const data = `data: ${JSON.stringify(event)}\n\n`;
  for (const client of clients) {
    try {
      client.write(data);
      if (typeof (client as any).flush === 'function') {
        (client as any).flush();
      }
    } catch {
      removeClient(client);
    }
  }
}

export function clientCount(): number {
  return clients.size;
}
