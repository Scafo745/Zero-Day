import type { Request, Response } from 'express';
import { getIncident, upsertIncident } from '../store';
import { broadcast } from '../broadcaster';
import type { ContainmentEvent, ContainResponse } from '../../../packages/shared/types';

export default function containRoute(req: Request, res: Response): void {
  const { incidentId } = req.body ?? {};

  if (!incidentId || typeof incidentId !== 'string') {
    res.status(400).json({ ok: false, message: 'incidentId is required' });
    return;
  }

  const incident = getIncident(incidentId);
  if (!incident) {
    res.status(404).json({ ok: false, message: 'Incident not found' });
    return;
  }

  if (incident.posture === 'CONTAINED') {
    res.status(409).json({ ok: false, message: 'Already contained' });
    return;
  }

  if (incident.posture !== 'BREACH') {
    res.status(409).json({ ok: false, message: 'Incident is not in BREACH state' });
    return;
  }

  const containedAt = new Date().toISOString();
  upsertIncident({
    ...incident,
    posture: 'CONTAINED',
    containedAt,
  });

  const killedPid = incident.process.pid;
  const blockedIp = incident.result?.analysis?.blockIp ?? '';

  const containmentEvent: ContainmentEvent = {
    type: 'containment',
    incidentId,
    newPosture: 'CONTAINED',
    containedAt,
    killedPid,
    blockedIp,
  };

  broadcast(containmentEvent);

  const responseBody: ContainResponse = {
    ok: true,
    incidentId,
    killedPid,
    blockedIp,
    newPosture: 'CONTAINED',
  };

  res.status(200).json(responseBody);
}
