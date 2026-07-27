/**
 * stores/useEmergentSkillsStore.ts
 *
 * Zustand persisted store per le skill emergenti confermate dall'utente.
 *
 * Wrappa emergentSkillStore (singleton in-memory) con persistenza localStorage.
 * In questo modo le skill sopravvivono al reload della pagina.
 *
 * KEY: 'jarvis_emergent_skills_v1'
 *
 * Bootstrap (module-level, esegue una sola volta al caricamento):
 *   Ricarica le skill persistite nel singleton in-memory così che
 *   buildContext() e orchestrationService le vedano immediatamente.
 */

import { create }                  from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { emergentSkillStore }      from '../modules/orchestration/emergentSkillStore';
import type { DynamicSkill }       from '../modules/orchestration/emergentSkillStore';

// ─── Store shape ──────────────────────────────────────────────────────────────

interface EmergentSkillsActions {
  /**
   * Aggiunge una skill confermata dallo store Zustand E al singleton in-memory.
   * Da chiamare dopo confirmSkill() di useSkillSuggestion.
   */
  confirmSkill:     (skill: DynamicSkill) => void;
  /**
   * Rimuove una skill dalla lista persistita.
   * Nota: il singleton in-memory non ha una API delete → la skill rimane
   * attiva per la sessione corrente, ma non riapparirà al prossimo reload.
   */
  removeSkill:      (id: string) => void;
  /**
   * Incrementa l'usageCount nello store persistito E nel singleton.
   */
  incrementUsage:   (id: string) => void;
  /**
   * Sincronizza lo stato Zustand con il singleton in-memory.
   * Utile da chiamare dopo confirmSkill() di useSkillSuggestion (che già
   * registra nel singleton via emergentSkillStore.register).
   */
  syncFromSingleton: () => void;
}

interface EmergentSkillsStore {
  skills:   DynamicSkill[];
  actions:  EmergentSkillsActions;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useEmergentSkillsStore = create<EmergentSkillsStore>()(
  persist(
    (set, get) => ({
      skills: [],

      actions: {
        confirmSkill(skill: DynamicSkill): void {
          emergentSkillStore.register(skill);
          set(state => ({
            skills: [...state.skills.filter(s => s.id !== skill.id), skill],
          }));
        },

        removeSkill(id: string): void {
          set(state => ({
            skills: state.skills.filter(s => s.id !== id),
          }));
        },

        incrementUsage(id: string): void {
          emergentSkillStore.incrementUsage(id);
          set(state => ({
            skills: state.skills.map(s =>
              s.id === id
                ? { ...s, usageCount: s.usageCount + 1, confidence: Math.min(1, s.confidence + 0.10), lastUsedAt: Date.now() }
                : s,
            ),
          }));
        },

        syncFromSingleton(): void {
          const current = get().skills;
          const fromSingleton = emergentSkillStore.list();

          // Merge: take all from singleton + keep persisted skills not in singleton
          const singletonIds = new Set(fromSingleton.map(s => s.id));
          const onlyPersisted = current.filter(s => !singletonIds.has(s.id));

          set({ skills: [...onlyPersisted, ...fromSingleton] });
        },
      },
    }),
    {
      name:    'jarvis_emergent_skills_v1',
      storage: createJSONStorage(() => localStorage),
      // Only persist the skills list — actions are recreated on load
      partialize: (state) => ({ skills: state.skills }),
    },
  ),
);

// ─── Bootstrap ────────────────────────────────────────────────────────────────
// Re-hydra il singleton in-memory con le skill persistite al caricamento del
// modulo. Questo garantisce che buildContext() e orchestrationService vedano
// le skill personalizzate dell'utente fin dal primo render.

(function bootstrapEmergentSkills() {
  const persisted = useEmergentSkillsStore.getState().skills;
  for (const skill of persisted) {
    emergentSkillStore.register(skill);
  }
})();
