/**
 * simulation/hooks/useProactiveTest.ts — Test proattivo automatizzato.
 *
 * Cicla gli eventi di DEFAULT_DAY a intervallo fisso senza interazione
 * utente. Utile per demo automatiche e smoke test del cognitive layer.
 *
 * Uso:
 *   useProactiveTest('tenant_demo', true, 8_000);
 */

import { useEffect, useRef } from 'react';
import { DEFAULT_DAY }       from '../DayPlanner';
import { JarvisSimulator }   from '../JarvisSimulator';

export function useProactiveTest(
  tenantId:    string,
  enabled:     boolean,
  intervalMs:  number = 15_000,
): void {
  const indexRef  = useRef(0);
  const jarvisRef = useRef<JarvisSimulator | null>(null);

  useEffect(() => {
    if (!enabled) return;

    if (!jarvisRef.current) {
      jarvisRef.current = new JarvisSimulator(tenantId);
    }
    const jarvis = jarvisRef.current;

    const id = setInterval(() => {
      const event = DEFAULT_DAY[indexRef.current % DEFAULT_DAY.length];
      indexRef.current++;
      void jarvis.processEvent(event, false).catch(() => {/* swallow in demo */});
    }, intervalMs);

    return () => clearInterval(id);
  }, [enabled, intervalMs, tenantId]);
}
