/**
 * modules/orbit/worldRegistry.ts — Orbit World Registry (Fase 6 — Mondi Orbitanti)
 *
 * Singleton registry of all known Orbit worlds.
 * Mirrors the SkillRegistry pattern (src/modules/orchestration/skillRegistry.ts):
 *   - Module-level singleton (not a Zustand store — no persistence)
 *   - Pure sync — zero side effects
 *   - Worlds registered at startup; resolved at runtime
 *
 * Default worlds are registered at module load time:
 *   - "didattica" — the core DocenteDocAI pedagogical context
 *
 * Adding a new world:
 *   import { worldRegistry } from '@/modules/orbit/worldRegistry';
 *   worldRegistry.register({ id: 'cultura', label: 'Cultura', … });
 */

import type { WorldConfig } from './worldTypes';

// ── Registry ──────────────────────────────────────────────────────────────────

class WorldRegistryImpl {
  private _worlds = new Map<string, WorldConfig>();

  /**
   * Register a world. Silently overwrites if the id already exists.
   */
  register(world: WorldConfig): void {
    this._worlds.set(world.id, world);
  }

  /**
   * Resolve a world by id. Returns undefined if not registered.
   */
  resolve(id: string): WorldConfig | undefined {
    return this._worlds.get(id);
  }

  /**
   * All registered worlds (defensive copy).
   */
  list(): WorldConfig[] {
    return [...this._worlds.values()];
  }

  /**
   * All worlds except the given id (used for cross-world suggestions).
   */
  listExcept(activeId: string): WorldConfig[] {
    return [...this._worlds.values()].filter(w => w.id !== activeId);
  }

  /**
   * Check whether a world id is registered.
   */
  has(id: string): boolean {
    return this._worlds.has(id);
  }
}

export const worldRegistry = new WorldRegistryImpl();

// ── Default worlds ────────────────────────────────────────────────────────────

/**
 * Mondo Didattica — nucleo storico di DocenteDocAI.
 * Copre tutti i flussi pedagogici: UDA, lezioni, verifiche, registro.
 */
worldRegistry.register({
  id:          'didattica',
  label:       'Didattica',
  description: 'Pianificazione lezioni, UDA, verifiche e materiali scolastici',
  icon:        'school',
  domain:      'lesson_planning',
  keywords:    [
    'lezione', 'uda', 'verifica', 'classe', 'alunni', 'materia',
    'programmazione', 'registro', 'valutazione', 'obiettivi', 'didattica',
  ],
  colorToken:  '--orbit-world-didattica',
});

/**
 * Mondo Cultura — approfondimento culturale e interdisciplinare.
 * Stub — pronto per essere esteso in fasi future.
 */
worldRegistry.register({
  id:          'cultura',
  label:       'Cultura',
  description: 'Documenti, articoli, letture e approfondimenti culturali',
  icon:        'menu_book',
  domain:      'document_analysis',
  keywords:    [
    'cultura', 'articolo', 'lettura', 'testo', 'libro', 'storia',
    'letteratura', 'arte', 'musica', 'approfondimento',
  ],
  colorToken:  '--orbit-world-cultura',
});

/**
 * Mondo Benessere — orientamento professionale e cura del docente.
 * Stub — pronto per essere esteso in fasi future.
 */
worldRegistry.register({
  id:          'benessere',
  label:       'Benessere',
  description: 'Riflessioni professionali, welfare docente e auto-aggiornamento',
  icon:        'self_improvement',
  domain:      'content_generation',
  keywords:    [
    'benessere', 'carico', 'stress', 'aggiornamento', 'formazione',
    'riflessione', 'welfare', 'burnout', 'equilibrio',
  ],
  colorToken:  '--orbit-world-benessere',
});
