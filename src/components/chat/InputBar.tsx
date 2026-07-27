/**
 * InputBar.tsx — P36.5
 *
 * Chat input area:
 *   - Multiline text field
 *   - Mode selector (fast / balanced / deep / manual)
 *   - PRO-gate: deep & manual are disabled for free users (tooltip explains why)
 *   - Send button
 *
 * Accessibility:
 *   - Every interactive element has aria-label
 *   - Mode buttons use role="radio" via ToggleButtonGroup
 *   - Keyboard: Enter sends (Shift+Enter for newline)
 */
import React, { useState, useCallback, useEffect, useRef, KeyboardEvent } from 'react';
import {
  Box,
  Button,
  Chip,
  IconButton,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import SendIcon        from '@mui/icons-material/Send';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import type { Mode }          from '@/modules/orchestration/ModeEngine';
import type { EmotionalState } from '@/modules/orchestration/EmotionalEngine';
import { useSuggestedMode }   from '@/hooks/useSuggestedMode';
import { useChatPrefsStore }  from '@/stores/useChatPrefsStore';

// ── Mode metadata (display only — canonical config lives in ModeEngine.ts) ────

interface ModeLabel {
  icon:    string;
  label:   string;
  tooltip: string;
  proOnly: boolean;
}

const MODE_LABELS: Record<Mode, ModeLabel> = {
  fast:     { icon: '⚡', label: 'Rapida',    tooltip: 'Risposta immediata — 1 step, senza memoria',        proOnly: false },
  balanced: { icon: '⚖️', label: 'Bilanciata', tooltip: 'Equilibrio qualità/velocità (consigliato)',         proOnly: false },
  deep:     { icon: '🧠', label: 'Profonda',   tooltip: 'Analisi approfondita (PRO) — fino a 6 step',        proOnly: true  },
  manual:   { icon: '🛠', label: 'Manuale',    tooltip: 'Controllo massimo (PRO) — tutti i passaggi visibili', proOnly: true  },
  creative: { icon: '✨', label: 'Creativa',   tooltip: 'Stile libero e narrativo',                          proOnly: false },
};

// ── P38.5: Emotional state placeholder map ─────────────────────────────────

const PLACEHOLDER_MAP: Record<EmotionalState, string> = {
  focused:       'Scrivi il tuo messaggio…',
  exploring:     "Cosa vorresti esplorare? Anche un'idea iniziale va bene…",
  overloaded:    'Inizia con una cosa sola — ti guido passo passo…',
  blocked:       'Dimmi dove sei bloccato — troviamo il punto di partenza insieme…',
  goal_oriented: 'Scrivi cosa ti serve — rispondo subito…',
};

// ── Props ──────────────────────────────────────────────────────────────

export interface InputBarProps {
  mode:           Mode;
  setMode:        (m: Mode) => void;
  onSend:         (text: string) => void;
  loading:        boolean;
  /** 'pro' unlocks deep/manual modes */
  userPlan?:      'free' | 'pro';
  /** Called when the user clicks the upgrade-to-PRO CTA */
  onUpgrade?:     () => void;
  onClear?:       () => void;
  /** P38.5: current cognitive-emotional state — drives placeholder text */
  emotionalState?: EmotionalState;
  /**
   * When true, the mode selector renders icon-only ToggleButtons to fit
   * in narrow containers (e.g. embedded Drawer panel).
   */
  compact?: boolean;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function InputBar({ mode, setMode, onSend, loading, userPlan = 'free', onUpgrade, onClear, emotionalState, compact = false }: InputBarProps): React.ReactElement {
  const [input, setInput] = useState('');

  const { suggested, reason, differs } = useSuggestedMode();

  // P38.5: learning layer
  const {
    autoApplySuggestions,
    recordSuggestionAccepted,
    recordSuggestionRejected,
  } = useChatPrefsStore();

  // Transient "✨ adattato" chip state
  const [showAdapted, setShowAdapted] = useState(false);
  const adaptedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-apply suggestion when learning system has enough evidence
  useEffect(() => {
    if (autoApplySuggestions && differs(mode)) {
      setMode(suggested);
      setShowAdapted(true);
      if (adaptedTimerRef.current) clearTimeout(adaptedTimerRef.current);
      adaptedTimerRef.current = setTimeout(() => setShowAdapted(false), 4000);
    }
    return () => {
      if (adaptedTimerRef.current) clearTimeout(adaptedTimerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoApplySuggestions, suggested]);

  const placeholder = emotionalState
    ? PLACEHOLDER_MAP[emotionalState]
    : 'Scrivi un messaggio… (Invio per inviare, Shift+Invio per a-capo)';

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;
    setInput('');
    onSend(trimmed);
  }, [input, loading, onSend]);

  const handleKey = useCallback((e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const handleModeChange = useCallback((_: unknown, next: Mode | null) => {
    if (!next) return;
    const label = MODE_LABELS[next];
    if (label.proOnly && userPlan !== 'pro') return;
    // P38.5: track rejection when user overrides an active suggestion
    if (differs(mode) && next !== suggested) {
      recordSuggestionRejected();
    }
    setMode(next);
  }, [setMode, userPlan, differs, mode, suggested, recordSuggestionRejected]);

  return (
    <Box
      component="footer"
      sx={{
        borderTop:   '1px solid',
        borderColor: 'divider',
        p:           2,
        display:     'flex',
        flexDirection: 'column',
        gap:         1.5,
        backgroundColor: 'background.paper',
      }}
    >
      {/* Mode selector row */}
      <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" useFlexGap>
        <Typography
          variant="caption"
          color="text.secondary"
          id="mode-selector-label"
        >
          Modalità:
        </Typography>
        <ToggleButtonGroup
          value={mode}
          exclusive
          onChange={handleModeChange}
          aria-labelledby="mode-selector-label"
          size="small"
        >
          {(Object.keys(MODE_LABELS) as Mode[]).map(m => {
            const meta    = MODE_LABELS[m];
            const blocked = meta.proOnly && userPlan !== 'pro';
            const tooltipText = blocked
              ? `${meta.tooltip} — Richiede piano PRO`
              : meta.tooltip;

            return (
              <Tooltip key={m} title={compact ? `${meta.label}${blocked ? ' (PRO)' : ''}` : tooltipText} placement="top">
                {/* span wrapper needed so Tooltip works on disabled buttons */}
                <span>
                  <ToggleButton
                    value={m}
                    disabled={blocked}
                    aria-label={`Modalità ${meta.label}${blocked ? ' (PRO)' : ''}`}
                    sx={{ gap: compact ? 0 : 0.5, px: compact ? 0.75 : 1.25, minWidth: compact ? 36 : 'auto' }}
                  >
                    <span aria-hidden="true">{meta.icon}</span>
                    {!compact && (
                      <Typography variant="caption">{meta.label}</Typography>
                    )}
                    {!compact && blocked && (
                      <Typography variant="caption" color="warning.main" aria-hidden="true">
                        PRO
                      </Typography>
                    )}
                  </ToggleButton>
                </span>
              </Tooltip>
            );
          })}
        </ToggleButtonGroup>

        {/* PRO upgrade CTA — shown only to free users so they know how to unlock deep/manual */}
        {userPlan !== 'pro' && (
          <Tooltip title="Passa a DocenteDoc PRO per sbloccare le modalità Approfondita e Manuale" placement="top">
            <Chip
              label="✨ PRO"
              size="small"
              variant="outlined"
              color="warning"
              onClick={onUpgrade}
              aria-label="Aggiorna a DocenteDoc PRO per sbloccare le modalità avanzate"
              clickable={!!onUpgrade}
              sx={{ fontSize: 'var(--md-sys-typescale-label-small-font-size)', cursor: onUpgrade ? 'pointer' : 'default' }}
            />
          </Tooltip>
        )}

        {/* Suggested mode hint — shown only when current mode differs from suggestion */}
        {differs(mode) && (
          <Tooltip title={reason} placement="top">
            <Chip
              label={`✨ ${MODE_LABELS[suggested]?.label ?? suggested}`}
              size="small"
              variant="outlined"
              color="primary"
              onClick={() => { setMode(suggested); recordSuggestionAccepted(); }}
              aria-label={`Applica modalità suggerita: ${MODE_LABELS[suggested]?.label}`}
              clickable
              sx={{ fontSize: 'var(--md-sys-typescale-label-small-font-size)' }}
            />
          </Tooltip>
        )}

        {/* Transient "adattato" chip — appears for 4 s after auto-apply */}
        {showAdapted && (
          <Chip
            label="✨ adattato"
            size="small"
            color="success"
            variant="outlined"
            aria-live="polite"
            sx={{ fontSize: 'var(--md-sys-typescale-label-small-font-size)' }}
          />
        )}
      </Stack>

      {/* P38.6: micro-guidance hint — shown below mode row when user is blocked */}
      {emotionalState === 'blocked' && (
        <Typography
          variant="caption"
          color="text.secondary"
          aria-live="polite"
          sx={{ opacity: 0.65, mt: -0.5 }}
        >
          Esempio: &ldquo;Spiegami la differenza tra obiettivo e traguardo per una seconda media&rdquo;
        </Typography>
      )}

      {/* Input row */}
      <Stack direction="row" spacing={1} alignItems="flex-end">
        <TextField
          fullWidth
          multiline
          maxRows={6}
          minRows={1}
          size="small"
          placeholder={placeholder}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          disabled={loading}
          aria-label="Campo di input messaggio"
          inputProps={{ 'aria-multiline': true }}
        />

        {onClear && (
          <Tooltip title="Svuota conversazione" placement="top">
            <span>
              <IconButton
                onClick={onClear}
                disabled={loading}
                aria-label="Svuota conversazione"
                size="small"
              >
                <DeleteSweepIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        )}

        <Button
          variant="contained"
          onClick={handleSend}
          disabled={loading || !input.trim()}
          aria-label="Invia messaggio"
          endIcon={<SendIcon />}
          sx={{ flexShrink: 0 }}
        >
          Invia
        </Button>
      </Stack>
    </Box>
  );
}
