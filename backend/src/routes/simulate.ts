import type { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getScenario } from '../scenarios';
import { analyzeProcess } from '../analyst';
import { upsertIncident } from '../store';
import { broadcast } from '../broadcaster';
import type { IncidentEvent } from '../types';

const ALLOWED_SCENARIOS = ['zero-day', 'benign', 'borderline-deploy', 'borderline-bash'];

export default function simulateRoute(req: Request, res: Response): void {
  const { scenario } = req.body ?? {};

  if (!scenario || !ALLOWED_SCENARIOS.includes(scenario)) {
    res.status(400).json({ ok: false, message: 'Unknown scenario' });
    return;
  }

  const incidentId = uuidv4();
  let processInfo;
  try {
    processInfo = getScenario(scenario);
  } catch {
    res.status(400).json({ ok: false, message: 'Unknown scenario' });
    return;
  }

  upsertIncident({
    incidentId,
    scenario,
    process: processInfo,
    posture: 'ANALYZING',
  });

  // Respond immediately with 202 Accepted
  res.status(202).json({
    ok: true,
    incidentId,
    message: 'Analysis started',
  });

  // Execute asynchronously
  (async () => {
    try {
      const { result, isFallback } = await analyzeProcess(processInfo);
      const posture = result.analysis.threatScore >= 40 ? 'BREACH' : 'CLEAR';
      const detectedAt = new Date().toISOString();

      upsertIncident({
        incidentId,
        scenario,
        process: processInfo,
        result,
        isFallback,
        posture,
        detectedAt,
      });

      const incidentEvent: IncidentEvent = {
        type: 'incident',
        incidentId,
        process: processInfo,
        result,
        isFallback,
        detectedAt,
      };

      broadcast(incidentEvent);
    } catch (err) {
      console.error('[simulate] Error during analysis:', err);
      broadcast({
        type: 'error',
        message: (err as Error).message || 'Analysis error',
      });
    }
  })();
}
