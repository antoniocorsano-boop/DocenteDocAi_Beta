/**
 * simulation/JarvisSimulator.ts — Simula il runtime di Jarvis.
 *
 * Per ogni LessonEvent:
 *   1. Genera il payload tramite EventGenerator
 *   2. Determina il tipo di landing da mostrare
 *   3. Inietta l'evento nel Cognitive Layer via ingestInput
 *   4. Registra le metriche in MetricsCollector + simulationStore
 *
 * Non chiama skill.handler() direttamente: si appoggia al Cognitive Layer
 * per generare suggerimenti in modo autonomo — esattamente come farebbe
 * Jarvis in produzione.
 */

import type { LessonEvent, SimulationMetrics, LandingType } from './types';
import type { ScheduleContext } from '../modules/orchestration/types';
import { ingestInput }    from '../modules/cognitiveLayer';
import { skillRegistry }  from '../modules/orchestration/skillRegistry';
import { EventGenerator } from './EventGenerator';
import { MetricsCollector } from './MetricsCollector';
import { useSimulationStore } from './simulationStore';

// ─── Skill → Landing mapping ──────────────────────────────────────────────────

const SKILL_TO_LANDING: Record<string, LandingType> = {
  OPEN_SCHEDULE:       'schedule',
  OPEN_CLASS_CONTEXT:  'class',
  START_LESSON:        'lesson',
  MARK_ATTENDANCE:     'lesson',
  LOAD_LESSON_MATERIAL: 'lesson',
  MANAGE_LESSON:       'lesson',
  LOAD_DELIVERABLE:    'lesson',
};

// ─── JarvisSimulator ─────────────────────────────────────────────────────────

export class JarvisSimulator {
  private _collector = new MetricsCollector();

  constructor(private readonly tenantId: string) {}

  /**
   * Processa un evento:
   *   - Aggiorna simulationStore con landing attiva
   *   - Inietta contenuto nel Cognitive Layer
   *   - Registra metrica
   */
  async processEvent(event: LessonEvent, autoAction = false): Promise<void> {
    const start   = Date.now();
    const params  = EventGenerator.generateInput(event);
    const skill   = skillRegistry.resolve(event.skillHint);
    const landing = SKILL_TO_LANDING[event.skillHint] ?? null;

    // Contesto orario sintetico per la landing
    const schedCtx: ScheduleContext = {
      activeClassId: event.classeId !== 'all' ? event.classeId : undefined,
      lessonType:    undefined,
      minsToLesson:  0,
    };

    // Attiva landing nel store
    useSimulationStore.getState()._actions.setActiveLanding(landing, schedCtx);

    // Inietta nel Cognitive Layer
    try {
      await ingestInput({
        tenantId:  this.tenantId,
        sourceId:  `sim_${event.time}_${event.classeId}`,
        inputType: params.inputType,
        content:   params.content,
        label:     params.label,
        meta:      params.meta,
      });
    } catch {
      // La simulazione continua anche se l'ingest fallisce
    }

    const metric: SimulationMetrics = {
      timestamp:      start,
      eventId:        `${event.time}_${event.classeId}`,
      skillTriggered: skill?.ctaType ?? event.skillHint,
      autoAction,
      landingShown:   landing !== null,
      responseTimeMs: Date.now() - start,
      contentDensity: Math.min(10, Math.max(1, Math.ceil(params.content.length / 80))),
    };

    this._collector.log(metric);
    useSimulationStore.getState()._actions.logMetric(metric);
  }

  getCollector(): MetricsCollector {
    return this._collector;
  }

  getMetrics(): SimulationMetrics[] {
    return this._collector.getAll();
  }
}
