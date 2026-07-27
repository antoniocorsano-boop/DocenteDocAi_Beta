// EXCLUDED FROM PRODUCTION — Storybook demo only.
// This file must not be included in production builds.
// Per MD3 governance, this file is not maintained for MD3 Gold compliance.

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { ThemeProvider } from '@mui/material/styles';
import Box        from '@mui/material/Box';
import Chip       from '@mui/material/Chip';
import Divider    from '@mui/material/Divider';
import List       from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText   from '@mui/material/ListItemText';
import Stack      from '@mui/material/Stack';
import Tooltip    from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

import muiTheme from '../../theme/muiTheme';
import JarvisIndicator from '../../components/ui/JarvisIndicator';
import type { CognitiveEntry } from '../../modules/cognitiveLayer/types';

// ─── Theme decorator (required — preview.ts has CSS only, no MUI ThemeProvider) ──

const withMuiTheme = (Story: React.ComponentType): React.JSX.Element => (
  <ThemeProvider theme={muiTheme}>
    <Story />
  </ThemeProvider>
);

// ─── Domain display helpers (mirrored from UserWorkspace) ────────────────────

const DOMAIN_CHIP_COLOR: Record<string, string> = {
  pedagogical:    'var(--md-sys-color-primary)',
  compliance:     'var(--md-sys-color-error)',
  administrative: 'var(--md-sys-color-secondary)',
  technical:      'var(--md-sys-color-tertiary)',
  commercial:     'var(--md-sys-color-tertiary)',
  operational:    'var(--md-sys-color-secondary)',
  unknown:        'var(--md-sys-color-outline)',
};

const DOMAIN_LABEL: Record<string, string> = {
  pedagogical:    'Pedagogico',
  compliance:     'Compliance',
  administrative: 'Amministrativo',
  technical:      'Tecnico',
  commercial:     'Commerciale',
  operational:    'Operativo',
  unknown:        'Altro',
};

function relativeTime(ts: number): string {
  const min = Math.floor((Date.now() - ts) / 60_000);
  if (min < 1)  return 'adesso';
  if (min < 60) return `${min}m fa`;
  const h = Math.floor(min / 60);
  if (h < 24)   return `${h}h fa`;
  return `${Math.floor(h / 24)}g fa`;
}

// ─── Proactive scoring (mirrored from UserWorkspace) ─────────────────────────

const DOMAIN_SCORE: Record<string, number> = {
  compliance: 40, pedagogical: 30, administrative: 20,
  technical: 10, operational: 5, commercial: 5, unknown: 0,
};
const CONF_SCORE: Record<string, number> = { high: 20, medium: 10, low: 0 };
const URGENT_TAGS = new Set([
  'gdpr', 'uda', 'urgente', 'scadenza', 'dpia', 'audit', 'violazione',
]);

function scoreEntry(e: CognitiveEntry): number {
  let s = (DOMAIN_SCORE[e.domain] ?? 0) + (CONF_SCORE[e.confidence] ?? 0);
  const ageMin = (Date.now() - e.enteredAt) / 60_000;
  if (ageMin < 10)  s += 15;
  else if (ageMin < 60) s += 5;
  if (e.tags.some(t => URGENT_TAGS.has(t.toLowerCase()))) s += 10;
  return s;
}

function getProactiveReason(e: CognitiveEntry): string {
  if (e.tags.some(t => URGENT_TAGS.has(t.toLowerCase()))) return 'Elemento critico rilevato';
  if (e.domain === 'compliance')                           return 'Richiede attenzione normativa';
  if (e.domain === 'pedagogical' && e.confidence === 'high') return 'Pronto per analisi';
  if ((Date.now() - e.enteredAt) / 60_000 < 5)            return 'Appena aggiunto';
  return 'Suggerito da Jarvis';
}

// ─── Mock entries ─────────────────────────────────────────────────────────────

const NOW = Date.now();

const MOCK_ENTRIES: CognitiveEntry[] = [
  {
    id:         'mock-1',
    tenantId:   'demo-tenant',
    inputType:  'text',
    domain:     'compliance',
    confidence: 'high',
    content:    'Art. 32 GDPR — misure di sicurezza tecnico-organizzative. Necessario verificare pseudonimizzazione dati studenti.',
    label:      'GDPR Art. 32 — misure sicurezza',
    enteredAt:  NOW - 2 * 60_000,
    sourceId:   'user-demo',
    tags:       ['gdpr', 'dpia', 'sicurezza'],
    meta:       {},
  },
  {
    id:         'mock-2',
    tenantId:   'demo-tenant',
    inputType:  'text',
    domain:     'pedagogical',
    confidence: 'high',
    content:    'UDA Matematica Classe 3A — Trigonometria. Obiettivi: comprensione teorema di Pitagora applicato.',
    label:      'UDA Matematica 3A — Trigonometria',
    enteredAt:  NOW - 18 * 60_000,
    sourceId:   'user-demo',
    tags:       ['uda', 'matematica', 'pitagora'],
    meta:       {},
  },
  {
    id:         'mock-3',
    tenantId:   'demo-tenant',
    inputType:  'text',
    domain:     'administrative',
    confidence: 'medium',
    content:    'Circolare n. 42 — convocazione collegio docenti 28/03/2026 ore 15:00',
    label:      'Circolare 42 — Collegio docenti',
    enteredAt:  NOW - 45 * 60_000,
    sourceId:   'user-demo',
    tags:       ['circolare', 'collegio'],
    meta:       {},
  },
  {
    id:         'mock-4',
    tenantId:   'demo-tenant',
    inputType:  'text',
    domain:     'administrative',
    confidence: 'low',
    content:    'Registro presenze settimana 11 — 5 assenze non giustificate classe 2B',
    label:      'Presenze 2B — Settimana 11',
    enteredAt:  NOW - 2 * 60 * 60_000,
    sourceId:   'user-demo',
    tags:       ['presenze', 'registro'],
    meta:       {},
  },
  {
    id:         'mock-5',
    tenantId:   'demo-tenant',
    inputType:  'text',
    domain:     'technical',
    confidence: 'medium',
    content:    'Aggiornamento Registro Elettronico — nuove funzionalità modulo valutazione competenze',
    label:      'Registro Elettronico — Update v2.4',
    enteredAt:  NOW - 5 * 60 * 60_000,
    sourceId:   'user-demo',
    tags:       ['registro-elettronico', 'aggiornamento'],
    meta:       {},
  },
];

// ─── Keyframe injection for countdown bar ────────────────────────────────────

let _kfInjected = false;
function injectCountdownKeyframe(): void {
  if (_kfInjected || typeof document === 'undefined') return;
  _kfInjected = true;
  const style = document.createElement('style');
  style.textContent = `
    @keyframes countdownShrink {
      from { width: 100%; }
      to   { width: 0%; }
    }
  `;
  document.head.appendChild(style);
}

// ─── JarvisAutoPilotSimulation ────────────────────────────────────────────────

type SimState = 'idle' | 'suggestion' | 'active' | 'processing';

/**
 * Self-contained Jarvis semi-auto demo.
 *
 * State machine:
 *   suggestion  → (4 s idle)     → active
 *   active      → (2.5 s timer)  → processing (auto-action fires)
 *   processing  → (1.5 s delay)  → active (reset cycle)
 *   any interaction              → back to suggestion (timers cleared)
 */
function JarvisAutoPilotSimulation(): React.JSX.Element {
  useEffect(() => { injectCountdownKeyframe(); }, []);

  const entries = MOCK_ENTRIES;

  const suggestedEntry = useMemo(
    () => entries.reduce((best, e) => scoreEntry(e) > scoreEntry(best) ? e : best),
    [entries],
  );

  const [simState,        setSimState]        = useState<SimState>('suggestion');
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [showActions,     setShowActions]      = useState(false);
  const [bannerText,      setBannerText]       = useState<string | null>(null);
  const [cycleCount,      setCycleCount]       = useState(0);

  const idleTimerRef      = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resetTimerRef     = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear all pending timers
  const clearAll = useCallback(() => {
    if (idleTimerRef.current)      clearTimeout(idleTimerRef.current);
    if (countdownTimerRef.current) clearTimeout(countdownTimerRef.current);
    if (resetTimerRef.current)     clearTimeout(resetTimerRef.current);
    idleTimerRef.current      = null;
    countdownTimerRef.current = null;
    resetTimerRef.current     = null;
  }, []);

  // Auto-action: fires after 2.5 s in 'active' state
  const handleAutoAction = useCallback(() => {
    setSimState('processing');
    setSelectedEntryId(suggestedEntry.id);
    setShowActions(true);
    setBannerText(`Jarvis ha aperto le azioni per: ${suggestedEntry.label}`);
    // After 1.5 s, return to active and clear banner
    resetTimerRef.current = setTimeout(() => {
      setSimState('active');
      setBannerText(null);
      setCycleCount(c => c + 1);
    }, 1_500);
  }, [suggestedEntry]);

  // State machine: manage timers when simState changes
  useEffect(() => {
    if (simState === 'suggestion') {
      // After 4 s of no interaction → go active
      idleTimerRef.current = setTimeout(() => {
        setSimState('active');
      }, 4_000);
    } else if (simState === 'active') {
      // After 2.5 s → fire auto-action
      countdownTimerRef.current = setTimeout(() => {
        handleAutoAction();
      }, 2_500);
    }
    return () => {
      if (idleTimerRef.current)      clearTimeout(idleTimerRef.current);
      if (countdownTimerRef.current) clearTimeout(countdownTimerRef.current);
    };
  }, [simState, handleAutoAction, cycleCount]);

  // Any user interaction resets to 'suggestion'
  const handleInteraction = useCallback(() => {
    clearAll();
    setSimState('suggestion');
    setShowActions(false);
    setSelectedEntryId(null);
    setBannerText(null);
  }, [clearAll]);

  useEffect(() => {
    const events = ['mousemove', 'click', 'keydown', 'touchstart'] as const;
    // Only register when simulation is running (suggestion or active)
    if (simState === 'suggestion' || simState === 'active') {
      events.forEach(ev => document.addEventListener(ev, handleInteraction, { passive: true, once: true }));
    }
    return () => {
      events.forEach(ev => document.removeEventListener(ev, handleInteraction));
    };
  }, [simState, handleInteraction]);

  return (
    <Box
      sx={{
        minHeight:       '100%',
        display:         'flex',
        flexDirection:   'column',
        gap:             1.5,
        p:               { xs: 1.5, sm: 2 },
        backgroundColor: 'var(--md-sys-color-surface)',
        position:        'relative',
        overflow:        'hidden',
      }}
    >
      {/* ── Countdown progress bar (visible only when active) ─────────────── */}
      {simState === 'active' && (
        <Box
          key={`countdown-${cycleCount}`}  // re-mount = restart animation
          sx={{
            position:        'absolute',
            top:             0,
            left:            0,
            height:          '3px',
            backgroundColor: 'var(--md-sys-color-primary)',
            animation:       'countdownShrink 2.5s linear forwards',
          }}
          role="progressbar"
          aria-label="Jarvis eseguirà l'azione suggerita tra 2.5 secondi"
        />
      )}

      {/* ── Sim state badge ────────────────────────────────────────────────── */}
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Stack spacing={0.25}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Typography
              variant="labelSmall"
              sx={{ color: 'var(--md-sys-color-on-surface-variant)', display: 'flex', alignItems: 'center', gap: 0.5 }}
            >
              <Box component="span" sx={{ color: 'var(--md-sys-color-tertiary)', lineHeight: 1 }} aria-hidden>●</Box>
              Sistema attivo
            </Typography>
            <Typography
              variant="labelSmall"
              sx={{ color: 'var(--md-sys-color-on-surface-variant)', display: 'flex', alignItems: 'center', gap: 0.5 }}
            >
              <Box
                component="span"
                sx={{ color: 'var(--md-sys-color-error)', lineHeight: 1 }}
                aria-hidden
              >●</Box>
              {entries.length} attività tracciate
            </Typography>
          </Stack>
          <Typography
            variant="titleSmall"
            component="h1"
            sx={{
              color:      'var(--md-sys-color-on-surface)',
              fontWeight: 'var(--md-sys-typescale-weight-semibold)',
            }}
          >
            Revisione compliance
          </Typography>
        </Stack>

        {/* Sim state indicator badge */}
        <Chip
          label={simState}
          size="small"
          sx={{
            fontSize:   'var(--md-sys-typescale-label-small-font-size)',
            height:     20,
            bgcolor:    simState === 'active' ? 'var(--md-sys-color-primary-container)'
              : simState === 'processing'     ? 'var(--md-sys-color-tertiary-container)'
              : simState === 'suggestion'     ? 'var(--md-sys-color-secondary-container)'
              : 'var(--md-sys-color-surface-container)',
            color:      simState === 'active' ? 'var(--md-sys-color-on-primary-container)'
              : simState === 'processing'     ? 'var(--md-sys-color-on-tertiary-container)'
              : simState === 'suggestion'     ? 'var(--md-sys-color-on-secondary-container)'
              : 'var(--md-sys-color-on-surface-variant)',
          }}
        />
      </Stack>

      {/* ── Suggestion block ───────────────────────────────────────────────── */}
      <Box
        sx={{
          px:         0.5,
          transition: 'opacity 400ms ease',
          opacity:    simState === 'active' || simState === 'processing' ? 1 : 0.65,
        }}
      >
        <Typography
          variant="labelSmall"
          sx={{
            color:         simState === 'active' || simState === 'processing'
              ? 'var(--md-sys-color-primary)'
              : 'var(--md-sys-color-on-surface-variant)',
            letterSpacing: '0.06em',
            transition:    'color 300ms',
          }}
        >
          {simState === 'active' || simState === 'processing'
            ? 'Jarvis suggerisce'
            : 'Suggerito'}
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}
          noWrap
        >
          {getProactiveReason(suggestedEntry)}: {suggestedEntry.label}
        </Typography>
      </Box>

      {/* ── Content list ───────────────────────────────────────────────────── */}
      <Box
        sx={{
          borderRadius:    2,
          overflow:        'hidden',
          flexGrow:        1,
          backgroundColor: 'var(--md-sys-color-surface-container-low)',
        }}
        aria-label="Lista documenti simulati"
      >
        <List disablePadding aria-label="Documenti recenti">
          {entries.map((entry, idx) => {
            const isSuggested  = entry.id === suggestedEntry.id;
            const isHighlighted = isSuggested &&
              (simState === 'active' || simState === 'processing');
            const isSelected    = entry.id === selectedEntryId;

            return (
              <React.Fragment key={entry.id}>
                {idx > 0 && <Divider component="li" />}
                <ListItemButton
                  aria-label={[
                    entry.label,
                    DOMAIN_LABEL[entry.domain] ?? entry.domain,
                    relativeTime(entry.enteredAt),
                  ].join(' — ')}
                  sx={{
                    px:         2,
                    py:         0.875,
                    borderLeft: isHighlighted
                      ? `3px solid ${DOMAIN_CHIP_COLOR[entry.domain] ?? 'var(--md-sys-color-primary)'}`
                      : '3px solid transparent',
                    transition: 'border-left-color 300ms ease',
                    bgcolor:    isSelected && showActions
                      ? 'var(--md-sys-color-surface-container)'
                      : undefined,
                    '&:hover': {
                      backgroundColor: 'var(--md-sys-color-surface-container)',
                    },
                  }}
                >
                  <ListItemText
                    primary={
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Tooltip title={DOMAIN_LABEL[entry.domain] ?? entry.domain}>
                          <Box
                            sx={{
                              width:        6,
                              height:       6,
                              borderRadius: '50%',
                              flexShrink:   0,
                              cursor:       'help',
                              bgcolor:      DOMAIN_CHIP_COLOR[entry.domain] ?? 'var(--md-sys-color-outline)',
                            }}
                            role="img"
                            aria-label={DOMAIN_LABEL[entry.domain] ?? entry.domain}
                          />
                        </Tooltip>
                        <Typography
                          variant="body2"
                          component="span"
                          sx={{ color: 'var(--md-sys-color-on-surface)', flexGrow: 1 }}
                          noWrap
                        >
                          {entry.label}
                        </Typography>
                        <Typography
                          variant="caption"
                          component="span"
                          sx={{ color: 'var(--md-sys-color-on-surface-variant)', flexShrink: 0 }}
                        >
                          {relativeTime(entry.enteredAt)}
                        </Typography>
                        <AutoAwesomeIcon
                          sx={{
                            fontSize:   'var(--md-sys-icon-size-xs, 14px)',
                            color:      'var(--md-sys-color-on-surface-variant)',
                            opacity:    isHighlighted ? 0.9 : 0.25,
                            flexShrink: 0,
                            transition: 'opacity 300ms',
                          }}
                          aria-hidden
                        />
                      </Stack>
                    }
                  />
                </ListItemButton>
              </React.Fragment>
            );
          })}
        </List>
      </Box>

      {/* ── Mock action sheet (appears after auto-action fires) ────────────── */}
      {showActions && (
        <Box
          sx={{
            borderRadius:    2,
            p:               1.5,
            backgroundColor: 'var(--md-sys-color-surface-container)',
            border:          '1px solid var(--md-sys-color-outline-variant)',
          }}
          aria-live="polite"
          aria-label="Azioni suggerite da Jarvis"
        >
          <Stack direction="row" alignItems="center" spacing={1} mb={1}>
            <CheckCircleOutlineIcon
              sx={{ fontSize: 'var(--md-sys-icon-size-sm, 18px)', color: 'var(--md-sys-color-primary)' }}
              aria-hidden
            />
            <Typography
              variant="labelSmall"
              sx={{
                color:      'var(--md-sys-color-primary)',
                fontWeight: 'var(--md-sys-typescale-weight-semibold)',
              }}
            >
              Azioni disponibili
            </Typography>
          </Stack>
          <Stack direction="row" flexWrap="wrap" gap={1}>
            {['Analisi GDPR', 'Esporta PDF', 'Traccia scadenza', 'Genera report'].map(action => (
              <Chip
                key={action}
                label={action}
                size="small"
                variant="outlined"
                onClick={() => { /* demo only */ }}
                aria-label={`Azione: ${action}`}
                sx={{
                  borderColor: 'var(--md-sys-color-primary)',
                  color:       'var(--md-sys-color-primary)',
                  cursor:      'pointer',
                }}
              />
            ))}
          </Stack>
        </Box>
      )}

      {/* ── Banner toast ───────────────────────────────────────────────────── */}
      {bannerText && (
        <Box
          sx={{
            borderRadius:    2,
            p:               1,
            backgroundColor: 'var(--md-sys-color-primary-container)',
            borderLeft:      '4px solid var(--md-sys-color-primary)',
          }}
          role="status"
          aria-live="polite"
        >
          <Typography
            variant="labelSmall"
            sx={{ color: 'var(--md-sys-color-on-primary-container)' }}
          >
            {bannerText}
          </Typography>
        </Box>
      )}

      {/* ── Hint text ──────────────────────────────────────────────────────── */}
      <Typography
        variant="caption"
        sx={{
          color:     'var(--md-sys-color-on-surface-variant)',
          textAlign: 'center',
          opacity:   0.6,
        }}
      >
        Muovi il mouse o premi un tasto per resettare il ciclo
      </Typography>

      {/* ── JarvisIndicator ────────────────────────────────────────────────── */}
      <JarvisIndicator
        count={entries.length}
        latestEntryId={suggestedEntry.id}
        hidden={false}
        state={simState}
        onActivate={(_entryId, _anchor) => { handleInteraction(); }}
      />
    </Box>
  );
}

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta = {
  title:      'Workspace/FullWorkspace',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
**FullWorkspace** — Storybook demo dello spazio di lavoro Orbit Jarvis.

- **AutoPilot**: Simulazione semi-automatica. Jarvis analizza le entry, seleziona quella con score più alto e,
  dopo 4 secondi di inattività, avvia un countdown (barra arancione in cima). Alla scadenza dei 2.5 s,
  apre automaticamente il pannello azioni. Interagire con la pagina (mouse/tasto) resetta il ciclo.

> File escluso dalla build di produzione.
        `.trim(),
      },
    },
  },
  decorators: [withMuiTheme],
};

export default meta;

// ─── Stories ─────────────────────────────────────────────────────────────────

/** Semi-auto simulation: Jarvis scores entries, glows, fires auto-action after countdown. */
export const AutoPilot: StoryObj = {
  name:   'AutoPilot — Jarvis semi-automatico',
  render: () => <JarvisAutoPilotSimulation />,
};
