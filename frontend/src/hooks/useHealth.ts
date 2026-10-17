'use client';

import { useState, useEffect } from 'react';
import type { HealthResponse } from '../../../packages/shared/types';

export function useHealth() {
  const [health, setHealth] = useState<HealthResponse>({
    status: 'degraded',
    ollamaReachable: false,
    modelPulled: false,
    model: 'zerotrace-analyst',
    uptime: 0,
  });

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5001';

  useEffect(() => {
    let isMounted = true;

    const checkHealth = async () => {
      try {
        const res = await fetch(`${apiUrl}/api/health`, {
          signal: AbortSignal.timeout(4000),
        });
        if (res.ok) {
          const data: HealthResponse = await res.json();
          if (isMounted) setHealth(data);
        } else {
          if (isMounted) {
            setHealth((prev) => ({
              ...prev,
              status: 'degraded',
              ollamaReachable: false,
            }));
          }
        }
      } catch {
        if (isMounted) {
          setHealth((prev) => ({
            ...prev,
            status: 'degraded',
            ollamaReachable: false,
          }));
        }
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 10000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [apiUrl]);

  return health;
}
