/**
 * modules/system/SimulationGuard.ts  —  P22 Stabilization Layer / P27 Monitoring
 *
 * Prevents real AI API calls during demo / simulation mode.
 * SimulationEngine must call setSimulationMode(true) before starting a
 * simulation run, and setSimulationMode(false) when it completes.
 *
 * Usage:
 *   // In SimulationEngine:
 *   setSimulationMode(true);
 *   try { await runSimulation(); }
 *   finally { setSimulationMode(false); }
 *
 *   // In ingestInput / any API-calling code:
 *   if (isSimulation()) return localFallback(input);
 */

import { observe } from '@/utils/observability';

// ─── State ────────────────────────────────────────────────────────────────────

let _simulationMode = false;

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Activates or deactivates simulation mode.
 * When active, all AI API calls should be bypassed with a local fallback.
 */
export function setSimulationMode(active: boolean): void {
  _simulationMode = active;
  observe(
    active ? 'simulation.started' : 'simulation.stopped',
    {},
    active ? 'info' : 'debug',
  );
}

/**
 * Returns true while a simulation is running.
 */
export function isSimulation(): boolean {
  return _simulationMode;
}

/**
 * Produces a lightweight synthetic result that can substitute a real AI response
 * during simulation runs, avoiding actual API costs.
 */
export function localFallback(input: string): { type: 'local'; message: string; input: string } {
  return {
    type:    'local',
    message: 'Elaborazione locale completata',
    input:   input.slice(0, 100),
  };
}
