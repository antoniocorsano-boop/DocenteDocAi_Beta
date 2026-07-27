/**
 * hooks/useJarvisSettings.ts — Hook proattivo per il Settings Menu.
 *
 * Analizza il comportamento recente del docente (cognitiveStore),
 * le skill registrate (skillRegistry) e il contesto temporale
 * per generare:
 *   - hints:             suggerimenti contestuali per categorie
 *   - badgeCounts:       badge per categoria nella sidebar
 *   - presets:           preset disponibili con suggestion contestuale
 *   - skillSettingsList: impostazioni dinamiche per skill registrate
 *   - applyPreset:       applica un preset alle store actions
 *   - dismissHint:       congeda un hint (persistito in localStorage)
 *
 * Zero side-effect: non modifica lo store — solo legge e calcola.
 * MD3 compliant: nessun rendering, solo logica.
 */

import { useState, useCallback, useMemo } from 'react';

import { useCognitiveStore }   from '../modules/cognitiveLayer/cognitiveStore';
import { skillRegistry }       from '../modules/orchestration/skillRegistry';
import { getAutomationLevel }  from '../modules/orchestration/orchestrationService';
import { useSettingsStore }    from '../stores/useSettingsStore';

import type { SettingsHint, SettingsPreset, SkillSettings } from '../types/settings.types';

// ─── Constants ────────────────────────────────────────────────────────────────

const DISMISSED_KEY = 'jarvis_settings_hints_dismissed_v1';

// ─── Preset definitions ───────────────────────────────────────────────────────

const PRESETS: SettingsPreset[] = [
  {
    id:          'focus-lezioni',
    label:       'Focus Lezioni',
    description: 'Notifiche minime, AI pedagogica, nessun audit in background.',
    icon:        'school',
    suggestedIn: ['morning', 'lesson'],
  },
  {
    id:          'admin-day',
    label:       'Admin Day',
    description: 'Tutte le skill di gestione attive, audit automatico, report completi.',
    icon:        'admin_panel_settings',
    suggestedIn: ['admin', 'compliance'],
  },
  {
    id:          'esame',
    label:       'Esame',
    description: 'Focus totale: UI semplificata, solo Registro e Valutazione.',
    icon:        'quiz',
    suggestedIn: ['exam'],
  },
  {
    id:          'compliance',
    label:       'Compliance',
    description: 'Audit attivi, DPIA on-demand, Trust record aggiornati.',
    icon:        'verified_user',
    suggestedIn: ['compliance'],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function loadDismissed(): Set<string> {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY);
    if (raw) return new Set(JSON.parse(raw) as string[]);
  } catch { /* noop */ }
  return new Set<string>();
}

function saveDismissed(dismissed: Set<string>): void {
  try {
    localStorage.setItem(DISMISSED_KEY, JSON.stringify([...dismissed]));
  } catch { /* noop */ }
}

/** Restituisce il contesto temporale corrente per i preset. */
function resolveTimeContext(): 'morning' | 'lesson' | 'admin' | 'exam' | 'compliance' {
  const h = new Date().getHours();
  if (h >= 8 && h < 13) return 'lesson';
  if (h >= 13 && h < 15) return 'admin';
  return 'morning';
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface UseJarvisSettingsReturn {
  hints:            SettingsHint[];
  badgeCounts:      Record<string, number>;
  presets:          SettingsPreset[];
  /** Preset contestualmente suggerito da Jarvis */
  suggestedPreset:  SettingsPreset | null;
  skillSettingsList: SkillSettings[];
  applyPreset:      (presetId: string) => void;
  dismissHint:      (hintId: string) => void;
}

export function useJarvisSettings(tenantId: string): UseJarvisSettingsReturn {
  const [dismissed, setDismissed] = useState<Set<string>>(loadDismissed);

  // ── Store reads ─────────────────────────────────────────────────────────────
  const listRecent  = useCognitiveStore(s => s.listRecent);
  const getByDomain = useCognitiveStore(s => s.getByDomain);
  const storeActions = useSettingsStore(s => s.actions);
  const currentTheme = useSettingsStore(s => s.themeState);
  const currentAi    = useSettingsStore(s => s.aiSettings);

  // ── Skill settings list (dynamic, from skillRegistry) ───────────────────────
  const skillSettingsList = useMemo<SkillSettings[]>(() => {
    return skillRegistry.list().map(skill => ({
      skillId:  skill.ctaType,
      ctaType:  skill.ctaType,
      label:    skill.label,
      domain:   skill.domain,
      enabled:  true,
      options:  [
        {
          id:           `${skill.ctaType}_auto`,
          label:        'Esecuzione automatica',
          description:  `Jarvis esegue "${skill.label}" senza conferma quando il livello di automazione è "auto"`,
          type:         'boolean' as const,
          value:        getAutomationLevel(skill.ctaType) === 'auto',
          recommended:  getAutomationLevel(skill.ctaType) === 'auto',
        },
      ],
    }));
  }, [/* skillRegistry is a singleton — stable */]);

  // ── Hint generation ─────────────────────────────────────────────────────────
  const hints = useMemo<SettingsHint[]>(() => {
    const recent   = listRecent(30, tenantId);
    const rawHints: SettingsHint[] = [];

    // 1. Molti eventi compliance → suggerisci preset Compliance
    const complianceEntries = getByDomain('compliance', tenantId);
    if (complianceEntries.length >= 3) {
      rawHints.push({
        id:         'hint_compliance_preset',
        categoryId: 'advanced',
        message:    `${complianceEntries.length} eventi compliance—attiva il preset "Compliance" per audit automatici.`,
        priority:   1,
        source:     'behavior',
      });
    }

    // 2. Molte azioni pedagogiche → suggerisci Focus Lezioni
    const pedEntries = getByDomain('pedagogical', tenantId);
    if (pedEntries.length >= 5) {
      rawHints.push({
        id:         'hint_focus_lezioni',
        categoryId: 'general',
        message:    'Utilizzi spesso skill pedagogiche — il preset "Focus Lezioni" ottimizza l\'esperienza.',
        priority:   2,
        source:     'behavior',
      });
    }

    // 3. AI model non configurato ottimalmente
    if (currentAi.model === 'gemini-3-flash-preview') {
      rawHints.push({
        id:         'hint_ai_model',
        categoryId: 'ai',
        message:    'Stai usando il modello flash. Prova gemini-pro per risposte più ricche.',
        priority:   2,
        source:     'skill',
      });
    }

    // 4. Skill rilevanti registrate ma livello automazione basso
    const skillsWithAuto = skillRegistry.list().filter(
      s => getAutomationLevel(s.ctaType) === 'auto',
    );
    if (skillsWithAuto.length === 0 && recent.length > 5) {
      rawHints.push({
        id:         'hint_automation_off',
        categoryId: 'skills',
        message:    'Nessuna skill in modalità auto — abilita l\'automazione per le azioni ripetitive.',
        priority:   2,
        source:     'behavior',
      });
    }

    // 5. Ora mattutina → suggerisci preset Focus Lezioni
    const ctx = resolveTimeContext();
    if (ctx === 'lesson' || ctx === 'morning') {
      rawHints.push({
        id:         'hint_morning_preset',
        categoryId: 'general',
        message:    'Buongiorno! Il preset "Focus Lezioni" è consigliato per questa fascia oraria.',
        priority:   3,
        source:     'time',
      });
    }

    // Filtra congedi e ordina per priorità
    return rawHints
      .filter(h => !dismissed.has(h.id))
      .sort((a, b) => a.priority - b.priority);
  }, [tenantId, listRecent, getByDomain, currentAi.model, dismissed]);

  // ── Badge counts per categoria ───────────────────────────────────────────────
  const badgeCounts = useMemo<Record<string, number>>(() => {
    const counts: Record<string, number> = {};
    hints.forEach(h => {
      counts[h.categoryId] = (counts[h.categoryId] ?? 0) + 1;
    });
    return counts;
  }, [hints]);

  // ── Suggested preset (contestuale) ──────────────────────────────────────────
  const suggestedPreset = useMemo<SettingsPreset | null>(() => {
    const ctx = resolveTimeContext();
    return PRESETS.find(p => p.suggestedIn.includes(ctx)) ?? null;
  }, []);

  // ── dismissHint ─────────────────────────────────────────────────────────────
  const dismissHint = useCallback((hintId: string): void => {
    setDismissed(prev => {
      const next = new Set(prev);
      next.add(hintId);
      saveDismissed(next);
      return next;
    });
  }, []);

  // ── applyPreset ─────────────────────────────────────────────────────────────
  const applyPreset = useCallback((presetId: string): void => {
    switch (presetId) {
      case 'focus-lezioni':
        storeActions.setAiSettings({ ...currentAi, model: 'gemini-3-flash-preview' });
        storeActions.setThemeState({ ...currentTheme, uiMode: 'flow' });
        break;

      case 'admin-day':
        storeActions.setAiSettings({ ...currentAi, model: 'gemini-3-flash-preview' });
        storeActions.setThemeState({ ...currentTheme, uiMode: 'classic' });
        break;

      case 'esame':
        storeActions.setThemeState({ ...currentTheme, uiMode: 'classic', visualStyle: 'minimal' });
        break;

      case 'compliance':
        storeActions.setThemeState({ ...currentTheme, uiMode: 'classic' });
        break;

      default:
        break;
    }
  }, [storeActions, currentAi, currentTheme]);

  return {
    hints,
    badgeCounts,
    presets:          PRESETS,
    suggestedPreset,
    skillSettingsList,
    applyPreset,
    dismissHint,
  };
}
