/**
 * stores/useChatPrefsStore.ts — P38 Chat Preferences Store
 *
 * Persists user-level chat preferences across sessions.
 *
 * Responsibilities:
 *   - User profile type (teacher / coordinator / principal / student / parent)
 *   - Default mode per device class (mobile vs desktop)
 *   - Auto-upgrade threshold: if a prompt exceeds N words, bump mode up
 *   - Auto-sandbox toggle (mirrors ChatSettingsPanel state persistently)
 *   - Landing page preference (show SmartLanding vs open chat directly)
 *
 * These preferences are the authoritative source; ChatSettingsPanel and
 * SmartChat read / write them via this store.
 */
import { create }                    from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Mode }                  from '@/modules/orchestration/ModeEngine';
import {
  createEmotionalProfile,
  type EmotionalProfile,
} from '@/modules/orchestration/EmotionalEngine';
import {
  createCognitiveStyle,
  createCognitiveStyleSignals,
  type CognitiveStyle,
  type CognitiveStyleSignals,
} from '@/modules/orchestration/CognitiveStyleEngine';

// ── Types ─────────────────────────────────────────────────────────────────────

/**
 * Role of the logged-in user. Drives default mode and landing context.
 *
 *   teacher     — Default: balanced. Landing shows UDA / class / register actions.
 *   coordinator — Default: deep. Landing shows class summary + team actions.
 *   principal   — Default: fast. Landing shows school KPIs.
 *   student     — Default: fast. Landing shows assignments / feedback.
 *   parent      — Default: fast. Landing shows child progress.
 */
export type UserRole = 'teacher' | 'coordinator' | 'principal' | 'student' | 'parent';

export interface ChatPrefsState {
  /** Current role — drives default mode and landing card set */
  role: UserRole;

  /** Default mode on mobile (touch / thumb use) */
  mobileDefaultMode: Mode;

  /** Default mode on desktop */
  desktopDefaultMode: Mode;

  /**
   * Word-count threshold above which the mode is silently bumped up one step.
   * 0 = disabled.
   * Example: 40 words → if user types > 40 words in fast mode, bumps to balanced.
   */
  autoUpgradeThreshold: number;

  /** If true: auto-append sandbox block when AI outputs HTML / code */
  autoSandbox: boolean;

  /** If true: show SmartLandingView on first open; if false: open chat directly */
  showLanding: boolean;

  // ── P38.5: Learning layer ────────────────────────────────────────────────────

  /** Number of times the user accepted a mode suggestion chip */
  acceptedSuggestions:  number;
  /** Number of times the user ignored a suggestion and changed mode manually */
  rejectedSuggestions:  number;
  /** True once accepted >= 3 AND accepted > rejected * 2 */
  autoApplySuggestions: boolean;
  /** Manual mode upgrades in the current session */
  sessionUpgradeCount:  number;
  /** ms timestamp of last session reset (resets after 4 h) */
  lastSessionReset:     number;

  // ── P38.6: Cross-session emotional baseline ──────────────────────────────────

  emotionalProfile: EmotionalProfile;

  // ── P39: Cognitive Relationship Layer ───────────────────────────────────────

  cognitiveStyle:        CognitiveStyle;
  cognitiveStyleSignals: CognitiveStyleSignals;
  /** Cumulative reveal-button clicks (shortcut for useSmartChat) */
  revealClickCount:      number;
  /**
   * P40.2: cumulative number of times the user opened an explain block.
   * Used by ExplainEngine for one-shot learning: suppress explain for non-critical
   * states when this count is low (user is not engaging with explanations).
   */
  explainOpenedCount:    number;

  // ── Actions ─────────────────────────────────────────────────────────────────

  setRole(role: UserRole): void;
  setMobileDefaultMode(mode: Mode): void;
  setDesktopDefaultMode(mode: Mode): void;
  setAutoUpgradeThreshold(n: number): void;
  setAutoSandbox(v: boolean): void;
  setShowLanding(v: boolean): void;
  /** P38.5: user accepted a suggestion chip */
  recordSuggestionAccepted(): void;
  /** P38.5: user ignored suggestion and changed mode manually */
  recordSuggestionRejected(): void;
  /** P38.5: user manually upgraded mode */
  recordManualUpgrade(): void;
  /** P38.5: auto-tune autoUpgradeThreshold based on session evidence */
  tuneThreshold(): void;
  resetSession(): void;
  /** P38.6: persist evolved emotional profile */
  updateEmotionalProfile(profile: EmotionalProfile): void;
  /** P39: persist evolved cognitive style (automated) */
  updateCognitiveStyle(style: CognitiveStyle): void;
  /** Fase 3: manual user override — also resets revealClickCount */
  overrideCognitiveStyle(style: CognitiveStyle): void;
  /** Fase 3: factory reset (style + signals + revealClickCount) */
  resetCognitiveStyle(): void;
  /** P39: persist updated raw signals */
  updateCognitiveStyleSignals(signals: CognitiveStyleSignals): void;
  /** P39: increment reveal-click counter */
  recordRevealClick(): void;
  /** P40.2: increment explain-opened counter (one-shot learning signal) */
  recordExplainOpened(): void;
  reset(): void;
}

// ── Default values per role ───────────────────────────────────────────────────

const ROLE_DEFAULTS: Record<UserRole, { mobile: Mode; desktop: Mode }> = {
  teacher:     { mobile: 'fast',     desktop: 'balanced' },
  coordinator: { mobile: 'balanced', desktop: 'deep'     },
  principal:   { mobile: 'fast',     desktop: 'fast'     },
  student:     { mobile: 'fast',     desktop: 'balanced' },
  parent:      { mobile: 'fast',     desktop: 'fast'     },
};

// ── Store ─────────────────────────────────────────────────────────────────────

export const useChatPrefsStore = create<ChatPrefsState>()(
  persist(
    (set) => ({
      role:                 'teacher',
      mobileDefaultMode:    'fast',
      desktopDefaultMode:   'balanced',
      autoUpgradeThreshold: 40,
      autoSandbox:          true,
      showLanding:          true,
      acceptedSuggestions:  0,
      rejectedSuggestions:  0,
      autoApplySuggestions: false,
      sessionUpgradeCount:  0,
      lastSessionReset:     Date.now(),
      emotionalProfile:     createEmotionalProfile(),

      // ── P39 initial values ──────────────────────────────────────────────────
      cognitiveStyle:        createCognitiveStyle(),
      cognitiveStyleSignals: createCognitiveStyleSignals(),
      revealClickCount:      0,
      explainOpenedCount:    0,

      setRole(role) {
        const defaults = ROLE_DEFAULTS[role];
        set({
          role,
          mobileDefaultMode:  defaults.mobile,
          desktopDefaultMode: defaults.desktop,
        });
      },

      setMobileDefaultMode(mode)    { set({ mobileDefaultMode: mode });    },
      setDesktopDefaultMode(mode)   { set({ desktopDefaultMode: mode });   },
      setAutoUpgradeThreshold(n)    { set({ autoUpgradeThreshold: n });    },
      setAutoSandbox(v)             { set({ autoSandbox: v });             },
      setShowLanding(v)             { set({ showLanding: v });             },

      recordSuggestionAccepted() {
        set(s => {
          const accepted = s.acceptedSuggestions + 1;
          return {
            acceptedSuggestions:  accepted,
            autoApplySuggestions: accepted >= 3 && accepted > s.rejectedSuggestions * 2,
          };
        });
      },

      recordSuggestionRejected() {
        set(s => ({
          rejectedSuggestions:  s.rejectedSuggestions + 1,
          autoApplySuggestions: false,
        }));
      },

      recordManualUpgrade() {
        set(s => ({ sessionUpgradeCount: s.sessionUpgradeCount + 1 }));
      },

      tuneThreshold() {
        set(s => {
          const stale = Date.now() - s.lastSessionReset > 4 * 60 * 60 * 1000;
          if (stale) return { sessionUpgradeCount: 0, lastSessionReset: Date.now() };
          if (s.sessionUpgradeCount >= 2)
            return { autoUpgradeThreshold: Math.max(10, s.autoUpgradeThreshold - 10) };
          if (s.sessionUpgradeCount === 0 && s.acceptedSuggestions > 5)
            return { autoUpgradeThreshold: s.autoUpgradeThreshold + 5 };
          return {};
        });
      },

      resetSession() {
        set({ sessionUpgradeCount: 0, lastSessionReset: Date.now() });
      },

      updateEmotionalProfile(profile) {
        set({ emotionalProfile: profile });
      },

      updateCognitiveStyle(style) {
        set({ cognitiveStyle: style });
      },

      overrideCognitiveStyle(style) {
        set({ cognitiveStyle: style, revealClickCount: 0 });
      },

      resetCognitiveStyle() {
        set({
          cognitiveStyle:        createCognitiveStyle(),
          cognitiveStyleSignals: createCognitiveStyleSignals(),
          revealClickCount:      0,
        });
      },

      updateCognitiveStyleSignals(signals) {
        set({ cognitiveStyleSignals: signals });
      },

      recordRevealClick() {
        set(s => ({ revealClickCount: s.revealClickCount + 1 }));
      },

      recordExplainOpened() {
        set(s => ({ explainOpenedCount: s.explainOpenedCount + 1 }));
      },

      reset() {
        set({
          role:                 'teacher',
          mobileDefaultMode:    'fast',
          desktopDefaultMode:   'balanced',
          autoUpgradeThreshold: 40,
          autoSandbox:          true,
          showLanding:          true,
          acceptedSuggestions:  0,
          rejectedSuggestions:  0,
          autoApplySuggestions: false,
          sessionUpgradeCount:  0,
          lastSessionReset:     Date.now(),
          emotionalProfile:     createEmotionalProfile(),
          cognitiveStyle:        createCognitiveStyle(),
          cognitiveStyleSignals: createCognitiveStyleSignals(),
          revealClickCount:      0,
          explainOpenedCount:    0,
        });
      },
    }),
    {
      name:    'chat-prefs-v3',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

// ── Helper exported for useSuggestedMode ─────────────────────────────────────

export { ROLE_DEFAULTS };
