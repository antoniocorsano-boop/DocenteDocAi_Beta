/**
 * simulation/SimulationEngine.ts — Orchestratore principale.
 *
 * Esegue la sequenza di eventi del DayPlanner processandoli tramite
 * JarvisSimulator. Supporta pause/resume/abort.
 *
 * Non interagisce mai direttamente con React — comunica solo tramite
 * useSimulationStore che i componenti React osservano.
 *
 * Uso:
 *   const engine = new SimulationEngine(dayPlanner, jarvis, { device: 'desktop', speedMultiplier: 60 });
 *   await engine.run();
 *   engine.pause();
 *   engine.resume();
 *   engine.abort();
 */

import type { SimulationOptions } from './types';
import { DayPlanner } from './DayPlanner';
import { JarvisSimulator } from './JarvisSimulator';
import { MetricsCollector } from './MetricsCollector';
import { useSimulationStore } from './simulationStore';
import { setSimulationMode } from '../modules/system/SimulationGuard';

// ─── SimulationEngine ─────────────────────────────────────────────────────────

export class SimulationEngine {
  private _aborted = false;
  private _paused  = false;

  constructor(
    private readonly dayPlanner: DayPlanner,
    private readonly jarvis:     JarvisSimulator,
    private readonly options:    SimulationOptions,
  ) {}

  async run(): Promise<void> {
    const events  = this.dayPlanner.getAllEvents();
    const store   = useSimulationStore.getState();
    const speed   = this.options.speedMultiplier ?? 1;

    this._aborted = false;
    this._paused  = false;

    setSimulationMode(true); // P22: prevent trust records + heavy processing during simulation
    store._actions.setStatus('running');
    store._actions.setProgress(0, events.length);

    for (let i = 0; i < events.length; i++) {
      // Abort check
      if (this._aborted) break;

      // Pause loop — check every 200 ms
      while (this._paused) {
        if (this._aborted) break;
        await pause(200);
      }
      if (this._aborted) break;

      const event = events[i];
      store._actions.setCurrentEvent(event);
      store._actions.setProgress(i, events.length);

      await this.jarvis.processEvent(event, true);

      // Hold landing visible for scaled duration (minimum 600ms for readability)
      const holdMs = Math.max(600, ((event.duration ?? 5) * 60_000) / speed);
      await pause(holdMs);

      // Clear landing before next event
      store._actions.setActiveLanding(null);
      await pause(300);
    }

    if (!this._aborted) {
      store._actions.setProgress(events.length, events.length);
      store._actions.setCurrentEvent(null);
      store._actions.setActiveLanding(null);
      store._actions.setStatus('done');
    }
    setSimulationMode(false); // P22: restore normal processing mode
  }

  pause(): void {
    this._paused = true;
    useSimulationStore.getState()._actions.setStatus('paused');
  }

  resume(): void {
    this._paused = false;
    useSimulationStore.getState()._actions.setStatus('running');
  }

  abort(): void {
    this._aborted = true;
    setSimulationMode(false); // P22: restore on abort
    useSimulationStore.getState()._actions.reset();
  }

  getCollector(): MetricsCollector {
    return this.jarvis.getCollector();
  }
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function pause(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
