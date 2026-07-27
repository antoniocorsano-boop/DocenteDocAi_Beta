/**
 * simulation/hooks/useSimulation.ts — Avvia/ferma SimulationEngine da React.
 *
 * Uso:
 *   const engine = useMemo(() => new SimulationEngine(...), []);
 *   useSimulation(engine, running);
 *
 * Quando `enabled` diventa true chiama engine.run().
 * Al cleanup o quando `enabled` diventa false chiama engine.abort().
 */

import { useEffect } from 'react';
import type { SimulationEngine } from '../SimulationEngine';

export function useSimulation(engine: SimulationEngine, enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return;
    void engine.run();
    return () => { engine.abort(); };
  }, [engine, enabled]);
}
