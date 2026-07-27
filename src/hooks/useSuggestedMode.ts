/**
 * hooks/useSuggestedMode.ts — P38 Contextual Mode Suggestion
 *
 * Returns the most fitting chat mode given:
 *   1. Time of day  (morning rush / work hours / evening)
 *   2. Device class (mobile = thumb → fast; desktop = seated → balanced+)
 *   3. User role    (from useChatPrefsStore)
 *   4. Last used mode (continuity: if user was in deep, keep deep)
 *
 * Never forces a mode — returns { suggested, reason } for the UI to show
 * as a non-intrusive hint ("✨ Suggerito: Veloce · mattina + mobile").
 *
 * Also exports applyAutoUpgrade(text, currentMode) which bumps mode up
 * by one step when the prompt exceeds the autoUpgradeThreshold word count.
 */

import { useMemo }            from 'react';
import { useMediaQuery }      from '@mui/material';
import { useTheme }           from '@mui/material/styles';
import type { Mode }          from '@/modules/orchestration/ModeEngine';
import { useChatPrefsStore }  from '@/stores/useChatPrefsStore';
import { analyzeComplexity }  from '@/utils/complexityAnalyzer';

// ── Time-of-day buckets ────────────────────────────────────────────────────────

type TimeBucket = 'morning' | 'work' | 'afternoon' | 'evening' | 'night';

function getTimeBucket(hour: number): TimeBucket {
  if (hour >= 6  && hour < 9 ) return 'morning';
  if (hour >= 9  && hour < 13) return 'work';
  if (hour >= 13 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 22) return 'evening';
  return 'night';
}

// Mode suggested by time bucket (device-agnostic baseline)
const TIME_MODE: Record<TimeBucket, Mode> = {
  morning:   'fast',      // corsia — risposta rapida
  work:      'balanced',  // aula / scrivania — qualità media
  afternoon: 'deep',      // pianificazione pomeridiana
  evening:   'creative',  // testi, comunicazioni, creazione
  night:     'fast',      // veloce — raramente si usano
};

// ── Mode ordering (upgrade path) ──────────────────────────────────────────────

const MODE_RANK: Record<Mode, number> = {
  fast:     0,
  balanced: 1,
  creative: 2,
  deep:     3,
  manual:   4,
};

const MODE_SEQUENCE: Mode[] = ['fast', 'balanced', 'creative', 'deep', 'manual'];

function upgradeModeBy(mode: Mode, steps: number): Mode {
  const current = MODE_RANK[mode];
  const next    = Math.min(current + steps, MODE_SEQUENCE.length - 1);
  return MODE_SEQUENCE[next];
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export interface SuggestedModeResult {
  /** The suggested mode */
  suggested: Mode;
  /** Short human-readable explanation for the badge */
  reason: string;
  /** Whether the suggestion differs from the user's current active mode */
  differs: (currentMode: Mode) => boolean;
}

/**
 * Returns the contextually appropriate mode without forcing it.
 * Memoised — recomputes only when isMobile or preferences change.
 */
export function useSuggestedMode(): SuggestedModeResult {
  const theme    = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const {
    role,
    mobileDefaultMode,
    desktopDefaultMode,
  } = useChatPrefsStore();

  return useMemo<SuggestedModeResult>(() => {
    const hour       = new Date().getHours();
    const bucket     = getTimeBucket(hour);
    const deviceBase = isMobile ? mobileDefaultMode : desktopDefaultMode;
    const timeBase   = TIME_MODE[bucket];

    // Take the higher-ranked suggestion between device preference and time context
    const suggested = MODE_RANK[deviceBase] >= MODE_RANK[timeBase]
      ? deviceBase
      : timeBase;

    // Build reason label
    const deviceLabel  = isMobile ? 'mobile' : 'desktop';
    const bucketLabels: Record<TimeBucket, string> = {
      morning:   'mattina',
      work:      'ore di lavoro',
      afternoon: 'pomeriggio',
      evening:   'sera',
      night:     'notte',
    };
    const roleLabel: Record<typeof role, string> = {
      teacher:     'docente',
      coordinator: 'coordinatore',
      principal:   'dirigente',
      student:     'studente',
      parent:      'genitore',
    };

    const reason = `${bucketLabels[bucket]} · ${deviceLabel} · ${roleLabel[role]}`;

    return {
      suggested,
      reason,
      differs: (currentMode: Mode) => currentMode !== suggested,
    };
  }, [isMobile, mobileDefaultMode, desktopDefaultMode, role]);
}

// ── Auto-upgrade helper ───────────────────────────────────────────────────────

/**
 * P38.5: Uses complexity analysis as primary signal and word count as fallback.
 * Takes the higher-ranked result of the two and never downgrades.
 *
 * Used by useSmartChat before sending a message.
 */
export function applyAutoUpgrade(
  text: string,
  currentMode: Mode,
  threshold: number,
): Mode {
  if (threshold === 0) return currentMode;

  const words    = text.trim().split(/\s+/).filter(Boolean);
  const wordMode = words.length > threshold ? upgradeModeBy(currentMode, 1) : currentMode;

  const { suggestedMode: complexityMode } = analyzeComplexity(text);
  const targetMode = MODE_RANK[complexityMode] >= MODE_RANK[wordMode] ? complexityMode : wordMode;

  // Never downgrade
  return MODE_RANK[targetMode] > MODE_RANK[currentMode] ? targetMode : currentMode;
}
