import type { Request, Response } from 'express';
import { addClient, removeClient } from '../broadcaster';
import type { ConnectedEvent } from '../types';

export default function streamRoute(req: Request, res: Response): void {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  req.socket?.setNoDelay(true);
  req.socket?.setKeepAlive(true, 1000);

  if (typeof res.flushHeaders === 'function') {
    res.flushHeaders();
  }

  addClient(res);

  const connectedEvent: ConnectedEvent = {
    type: 'connected',
    serverTime: new Date().toISOString(),
  };

  res.write(`data: ${JSON.stringify(connectedEvent)}\n\n`);

  req.on('close', () => {
    removeClient(res);
  });
}
