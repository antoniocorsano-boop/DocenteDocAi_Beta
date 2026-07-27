/**
 * components/ui/JarvisNexus.tsx
 *
 * Pannello di comando cinematografico di Jarvis: "Mission Control" del docente.
 *
 * Consolida tre feature in un'unica superficie:
 *   1. Auto-Settings → proposta di delta configurazione adattiva
 *   2. Skill Discovery → card di nascita per skill emergenti in arrivo
 *   3. Skill Attive → lista persistita delle skill personalizzate
 *   4. Attività Recente → stream degli ultimi eventi cognitivi
 *
 * Trigger: Ctrl+Shift+J (shortcut) o tasto "hub" nell'header workspace.
 * Escape → chiude il pannello.
 *
 * MD3 Gold Compliant:
 *   – M3Surface per ogni container visivo
 *   – nessun <div> per shell/card/layout
 *   – token var(--md-sys-color-*) per tutti i colori
 *   – var(--md-sys-typescale-*) per tipografia
 *   – aria-label su tutti gli elementi interattivi
 */

import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import Box              from '@mui/material/Box';
import Button           from '@mui/material/Button';
import Chip             from '@mui/material/Chip';
import Collapse         from '@mui/material/Collapse';
import Fade             from '@mui/material/Fade';
import IconButton       from '@mui/material/IconButton';
import LinearProgress   from '@mui/material/LinearProgress';
import Portal           from '@mui/material/Portal';
import Stack            from '@mui/material/Stack';
import Tooltip          from '@mui/material/Tooltip';
import Typography       from '@mui/material/Typography';
import AutoAwesomeIcon  from '@mui/icons-material/AutoAwesome';
import CloseIcon        from '@mui/icons-material/Close';
import ExtensionIcon    from '@mui/icons-material/Extension';

import M3Surface          from './M3Surface';
import { useCognitiveStore }       from '../../modules/cognitiveLayer/cognitiveStore';
import { useEmergentSkillsStore }  from '../../stores/useEmergentSkillsStore';
import { useTrustStore, selectTrustHealth } from '../../stores/useTrustStore';
import { autoName }                from '../../hooks/useSkillSuggestion';
import type { AutoSettingsDelta }  from '../../modules/autoSettings/autoSettingsEngine';
import type { SkillDraft }         from '../../hooks/useSkillSuggestion';
import type { OrbitFlow }          from '../../modules/flows/orbitFlow';
import { getMacroState, resolvePresenceLevel } from '../../theme/orbitStates';
import type { JarvisPresenceLevel }            from '../../theme/orbitStates';
import { ORBIT_MOTION }                        from '../../theme/orbitTokens';

// ─── Nexus visual state ────────────────────────────────────────────────────────────────

/**
 * Stato visivo del pannello Jarvis: determina colori, animazioni e
 * comportamento del centro orbitale.
 */
export type NexusState =
  | 'idle'        // nessuna attività
  | 'suggestion'  // delta in attesa di conferma
  | 'processing'  // scan in corso
  | 'decision'    // azione automatica appena eseguita
  | 'learning';   // nuova skill rilevata

// ─── Types ────────────────────────────────────────────────────────────────────

export interface JarvisNexusProps {
  open:            boolean;
  onClose:         () => void;
  tenantId:        string;
  /** Stato visivo del Nexus (determina animazione orbitale). */
  nexusState?:     NexusState;
  /** Quante ottimizzazioni stealth ha applicato questa sessione. */
  stealthCount?:   number;
  /** Quante skill emergenti sono state auto-eseguite questa sessione (total). */
  autoFiredCount?: number;
  /** Quante auto-esecuzioni ambient (trust 0.75–0.89) questa sessione. */
  ambientFiredCount?: number;
  /** Flows Orbit attivi da mostrare nella sezione Flussi. */
  flows?: OrbitFlow[];
  /**
   * Override the Jarvis presence level.
   * When omitted, the level is derived from nexusState + ambientFiredCount + viewportWidth.
   */
  presenceLevel?: JarvisPresenceLevel;
  /** Callback: l'utente ha richiesto l'esecuzione di un flow. */
  onRunFlow?: (flowId: string) => void;
  /** Callback: l'utente ha rimosso / archiviato un flow. */
  onRemoveFlow?: (flowId: string) => void;
  // Feature 1 — Auto-settings
  pending:         AutoSettingsDelta[];
  appliedIds:      string[];
  onApplyDelta:    (id: string) => void;
  onDismissDelta:  (id: string) => void;
  // Feature 2 — Emergent skills
  skillDraft:      SkillDraft | null;
  onConfirmSkill:  () => void;
  onDismissSkill:  () => void;
  // P17 — Agent personality overrides
  /** Scales the centre-orb animation duration. < 1 = calmer, > 1 = faster. */
  agentMotionMultiplier?: number;
  /** Hex accent colour override for the centre orb (from dominant agent personality). */
  agentColorShift?: string;
  /**
   * P18 — Attention routing map produced by `resolveAttention`.
   * Keys are flow/agent ids; values are `AgentAttentionState`.
   * When provided, flow cards are visually differentiated by attention tier
   * (primary → full opacity, secondary → 70%, background → 35%).
   */
  attentionMap?: Record<string, 'primary' | 'secondary' | 'background' | 'suppressed'>;
  /**
   * P19 — Current coordination action label (Italian) for the narrative strip.
   * When set, a minimal status banner is shown below the orbital header.
   * Examples: "Analisi in corso…", "Esecuzione task…"
   */
  coordinationLabel?: string;
}

// ─── Domain colors ────────────────────────────────────────────────────────────

const DOMAIN_COLOR: Record<string, string> = {
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

// ─── Category icon map ────────────────────────────────────────────────────────
const CATEGORY_RING_COLOR: Record<string, string> = {
  theme:      'var(--md-sys-color-primary)',
  ai:         'var(--md-sys-color-tertiary)',
  automation: 'var(--md-sys-color-secondary)',
  general:    'var(--md-sys-color-outline)',
};

// ─── Orbital state config ─────────────────────────────────────────────────────

const ORB_CONFIGS: Record<NexusState, {
  fill:         string;
  glowColor:    string;
  animation:    string;
  label:        string;
}> = {
  idle: {
    fill:      'var(--md-sys-color-primary)',
    glowColor: 'transparent',
    animation: 'none',
    label:     'In ascolto',
  },
  suggestion: {
    fill:      'var(--md-sys-color-primary)',
    glowColor: 'var(--md-sys-color-primary)',
    animation: `nexusPulse ${ORBIT_MOTION.activePulseDuration} ease-in-out infinite`,
    label:     'Suggerimento',
  },
  processing: {
    fill:      'var(--md-sys-color-tertiary)',
    glowColor: 'transparent',
    animation: `nexusOrbit1 ${ORBIT_MOTION.processingSpinDuration} linear infinite`,
    label:     'Elaborazione',
  },
  decision: {
    fill:      'var(--md-sys-color-secondary)',
    glowColor: 'var(--md-sys-color-secondary)',
    animation: 'nexusFlash 0.6s ease-out 3',
    label:     'Decisione',
  },
  learning: {
    fill:      'var(--md-sys-color-tertiary)',
    glowColor: 'var(--md-sys-color-tertiary)',
    animation: `nexusBirth ${ORBIT_MOTION.idlePulseDuration} ease-in-out infinite`,
    label:     'Apprendimento',
  },
};

// ─── Orbital SVG Header ───────────────────────────────────────────────────────

/**
 * Scales the seconds-duration inside a CSS animation shorthand string.
 * Example: scaleCssAnim('nexusPulse 1.5s ease-in-out infinite', 1.2) → 'nexusPulse 1.25s ease-in-out infinite'
 * Higher multiplier = faster animation (shorter duration).
 * Returns the string unchanged when multiplier === 1 or animation === 'none'.
 */
function scaleCssAnim(cssAnim: string, multiplier: number): string {
  if (cssAnim === 'none' || multiplier === 1) return cssAnim;
  return cssAnim.replace(/(\.?\d+\.?\d*)s(?=\s|$)/, (_, d: string) => {
    const adjusted = parseFloat(d) / multiplier;
    return `${adjusted.toFixed(2)}s`;
  });
}

const OrbitalHeader = memo(function OrbitalHeader({
  onClose,
  nexusState = 'idle',
  agentMotionMultiplier = 1,
  agentColorShift,
}: {
  onClose:               () => void;
  nexusState?:           NexusState;
  agentMotionMultiplier?: number;
  agentColorShift?:      string;
}) {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  const orb = ORB_CONFIGS[nexusState];

  return (
    <Box
      sx={{
        position:   'relative',
        height:     96,
        bgcolor:    'var(--md-sys-color-surface-container-highest)',
        overflow:   'hidden',
        flexShrink: 0,
        display:    'flex',
        alignItems: 'center',
        px:         2,
        borderBottom: '1px solid var(--md-sys-color-outline-variant)',
      }}
    >
      {/* SVG orbital rings */}
      <Box
        component="svg"
        viewBox="0 0 96 96"
        aria-hidden="true"
        sx={{
          width:    96,
          height:   96,
          flexShrink: 0,
          overflow: 'visible',
        }}
      >
        {/* Outer ring — 20s */}
        <Box
          component="g"
          sx={{
            transformOrigin: '48px 48px',
            animation: 'nexusOrbit3 20s linear infinite',
            '@keyframes nexusOrbit3': {
              from: { transform: 'rotate(60deg)' },
              to:   { transform: 'rotate(420deg)' },
            },
          }}
        >
          <circle cx="48" cy="48" r="40" fill="none" stroke="var(--md-sys-color-secondary)" strokeWidth="0.75" strokeOpacity="0.35" />
          <circle cx="88" cy="48" r="3" fill="var(--md-sys-color-secondary)" opacity="0.6" />
        </Box>

        {/* Middle ring — 14s counter */}
        <Box
          component="g"
          sx={{
            transformOrigin: '48px 48px',
            animation: 'nexusOrbit2 14s linear infinite',
            '@keyframes nexusOrbit2': {
              from: { transform: 'rotate(30deg)' },
              to:   { transform: 'rotate(-330deg)' },
            },
          }}
        >
          <circle cx="48" cy="48" r="28" fill="none" stroke="var(--md-sys-color-tertiary)" strokeWidth="0.75" strokeOpacity="0.45" />
          <circle cx="48" cy="20" r="2.5" fill="var(--md-sys-color-tertiary)" opacity="0.7" />
          <circle cx="48" cy="76" r="2" fill="var(--md-sys-color-tertiary)" opacity="0.5" />
        </Box>

        {/* Inner ring — 8s */}
        <Box
          component="g"
          sx={{
            transformOrigin: '48px 48px',
            animation: 'nexusOrbit1 8s linear infinite',
            '@keyframes nexusOrbit1': {
              from: { transform: 'rotate(0deg)' },
              to:   { transform: 'rotate(360deg)' },
            },
          }}
        >
          <circle cx="48" cy="48" r="16" fill="none" stroke="var(--md-sys-color-primary)" strokeWidth="1" strokeOpacity="0.55" />
          <circle cx="64" cy="48" r="3.5" fill="var(--md-sys-color-primary)" opacity="0.8" />
        </Box>

        {/* Centre orb — reacts to nexusState + agent personality */}
        <Box
          component="g"
          aria-label={`Jarvis: ${orb.label}`}
          sx={{
            transformOrigin: '48px 48px',
            animation:       scaleCssAnim(orb.animation, agentMotionMultiplier),
            '@keyframes nexusPulse': {
              '0%, 100%': { transform: 'scale(1)',    opacity: 0.9 },
              '50%':      { transform: 'scale(1.35)', opacity: 1 },
            },
            '@keyframes nexusFlash': {
              '0%, 100%': { opacity: 0.5 },
              '50%':      { opacity: 1 },
            },
            '@keyframes nexusBirth': {
              '0%, 100%': { transform: 'scale(1) rotate(0deg)',    opacity: 0.8 },
              '50%':      { transform: 'scale(1.4) rotate(180deg)', opacity: 1 },
            },
          }}
        >
          <circle
            cx="48" cy="48" r="8"
            fill={orb.glowColor !== 'transparent' ? (agentColorShift ?? orb.glowColor) : 'var(--md-sys-color-primary-container)'}
            opacity="0.3"
          />
          <circle cx="48" cy="48" r="4.5" fill={agentColorShift ?? orb.fill} opacity="0.95" />
        </Box>
      </Box>

      {/* Title + subtitle */}
      <Box sx={{ ml: 1.5, flex: 1, minWidth: 0 }}>
        <Typography
          variant="titleSmall"
          component="h2"
          sx={{
            color:      'var(--md-sys-color-on-surface)',
            fontWeight: 'var(--md-sys-typescale-weight-semibold)',
          }}
        >
          Jarvis Nexus
        </Typography>
        <Typography
          variant="bodySmall"
          component="p"
          sx={{ color: 'var(--md-sys-color-on-surface-variant)', mt: 0.25 }}
        >
          {timeStr}
          {nexusState !== 'idle' && (
            <> · <Box component="span" sx={{ color: 'var(--md-sys-color-primary)' }}>{orb.label}</Box></>
          )}
        </Typography>
      </Box>

      {/* Close button */}
      <Tooltip title="Chiudi (Esc)">
        <IconButton
          size="small"
          onClick={onClose}
          aria-label="Chiudi Jarvis Nexus"
          sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}
        >
          <CloseIcon sx={{ fontSize: 'var(--md-sys-icon-size-md, 20px)' }} />
        </IconButton>
      </Tooltip>
    </Box>
  );
});

// ─── Delta Card ───────────────────────────────────────────────────────────────

const DeltaCard = memo(function DeltaCard({
  delta,
  index,
  onApply,
  onDismiss,
}: {
  delta:     AutoSettingsDelta;
  index:     number;
  onApply:   (id: string) => void;
  onDismiss: (id: string) => void;
}) {
  const ringColor = CATEGORY_RING_COLOR[delta.category] ?? 'var(--md-sys-color-outline)';
  const confPct   = Math.round(delta.confidence * 100);

  return (
    <Fade in timeout={200 + index * 60}>
      <M3Surface
        elevation={1}
        aria-label={`Suggerimento configurazione: ${delta.label}`}
        sx={{
          p:            1.5,
          borderRadius: 2,
          borderLeft:   `3px solid ${ringColor}`,
          bgcolor:      'var(--md-sys-color-surface-container)',
        }}
      >
        <Stack direction="row" alignItems="flex-start" spacing={1.25}>
          {/* Icon */}
          <Box
            component="span"
            className="material-symbols-outlined"
            aria-hidden="true"
            sx={{
              fontSize:  'var(--md-sys-icon-size-md, 20px)',
              color:     ringColor,
              flexShrink: 0,
              mt:        0.125,
            }}
          >
            {delta.icon}
          </Box>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
              <Typography
                variant="labelMedium"
                component="p"
                sx={{ color: 'var(--md-sys-color-on-surface)', fontWeight: 'var(--md-sys-typescale-weight-semibold)' }}
              >
                {delta.label}
              </Typography>
              <Typography
                variant="labelSmall"
                component="span"
                sx={{ color: ringColor, flexShrink: 0 }}
              >
                {confPct}%
              </Typography>
            </Stack>

            {/* Confidence bar */}
            <LinearProgress
              variant="determinate"
              value={confPct}
              aria-label={`Confidenza: ${confPct}%`}
              sx={{
                mt:      0.5,
                height:  3,
                borderRadius: 2,
                bgcolor: 'var(--md-sys-color-surface-container-high)',
                '& .MuiLinearProgress-bar': { bgcolor: ringColor },
              }}
            />

            <Typography
              variant="bodySmall"
              component="p"
              sx={{ mt: 0.75, color: 'var(--md-sys-color-on-surface-variant)' }}
            >
              {delta.reason}
            </Typography>

            <Stack direction="row" spacing={0.75} mt={1}>
              <Button
                size="small"
                variant="contained"
                onClick={() => onApply(delta.id)}
                aria-label={`Applica: ${delta.label}`}
                sx={{ fontSize: 'var(--md-sys-typescale-label-small-font-size)', py: 0.25 }}
              >
                Applica
              </Button>
              <Button
                size="small"
                variant="text"
                onClick={() => onDismiss(delta.id)}
                aria-label={`Ignora suggerimento: ${delta.label}`}
                sx={{ fontSize: 'var(--md-sys-typescale-label-small-font-size)', py: 0.25, color: 'var(--md-sys-color-on-surface-variant)' }}
              >
                Ignora
              </Button>
            </Stack>
          </Box>
        </Stack>
      </M3Surface>
    </Fade>
  );
});

// ─── Skill Birth Card ─────────────────────────────────────────────────────────

const SkillBirthCard = memo(function SkillBirthCard({
  skillDraft,
  onConfirm,
  onDismiss,
}: {
  skillDraft: SkillDraft;
  onConfirm:  () => void;
  onDismiss:  () => void;
}) {
  const actionName = autoName(skillDraft.ctaType);

  return (
    <M3Surface
      elevation={2}
      aria-live="polite"
      aria-label="Nuova skill Jarvis rilevata"
      sx={{
        p:          1.5,
        borderRadius: 2,
        background: `linear-gradient(135deg, var(--md-sys-color-tertiary-container) 0%, var(--md-sys-color-primary-container) 100%)`,
        animation:  'nexusSkillBirth 400ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        '@keyframes nexusSkillBirth': {
          from: { opacity: 0, transform: 'scale(0.85)' },
          to:   { opacity: 1, transform: 'scale(1)' },
        },
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.25}>
        <Box
          sx={{
            animation:  'nexusSkillPulse 1.8s ease-in-out infinite',
            '@keyframes nexusSkillPulse': {
              '0%, 100%': { transform: 'scale(1)' },
              '50%':      { transform: 'scale(1.2)' },
            },
            flexShrink: 0,
          }}
        >
          <ExtensionIcon
            aria-hidden="true"
            sx={{
              fontSize: 'var(--md-sys-icon-size-lg, 24px)',
              color:    'var(--md-sys-color-on-tertiary-container)',
            }}
          />
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="labelMedium"
            component="p"
            sx={{
              color:      'var(--md-sys-color-on-tertiary-container)',
              fontWeight: 'var(--md-sys-typescale-weight-semibold)',
            }}
          >
            ⚡ Nuova Skill Rilevata
          </Typography>
          <Typography
            variant="bodySmall"
            component="p"
            sx={{ mt: 0.25, color: 'var(--md-sys-color-on-primary-container)' }}
          >
            Hai eseguito «{actionName}» {skillDraft.count}× — vuoi creare una skill?
          </Typography>
          <Stack direction="row" spacing={0.75} mt={1}>
            <Button
              size="small"
              variant="contained"
              onClick={onConfirm}
              aria-label={`Crea skill personalizzata per ${actionName}`}
              sx={{ fontSize: 'var(--md-sys-typescale-label-small-font-size)', py: 0.25 }}
            >
              Crea Skill
            </Button>
            <Button
              size="small"
              variant="text"
              onClick={onDismiss}
              aria-label="Ignora suggerimento skill"
              sx={{ fontSize: 'var(--md-sys-typescale-label-small-font-size)', py: 0.25, color: 'var(--md-sys-color-on-surface-variant)' }}
            >
              Ignora
            </Button>
          </Stack>
        </Box>
      </Stack>
    </M3Surface>
  );
});

// ─── Main Component ───────────────────────────────────────────────────────────

export default memo(function JarvisNexus({
  open,
  onClose,
  tenantId,
  nexusState = 'idle',
  stealthCount = 0,
  autoFiredCount = 0,
  ambientFiredCount = 0,
  flows = [],
  onRunFlow,
  onRemoveFlow,
  presenceLevel: presenceLevelProp,
  pending,
  appliedIds,
  onApplyDelta,
  onDismissDelta,
  skillDraft,
  onConfirmSkill,
  onDismissSkill,
  agentMotionMultiplier = 1,
  agentColorShift,
  attentionMap = {},
  coordinationLabel,
}: JarvisNexusProps): React.JSX.Element {

  // ── Presence + macro state ────────────────────────────────────────────────
  const currentViewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1280;
  const presenceLevel = presenceLevelProp ??
    resolvePresenceLevel(nexusState, ambientFiredCount, currentViewportWidth);
  const macroState    = getMacroState(nexusState, ambientFiredCount);
  const isCinematic   = presenceLevel === 'cinematic';
  const isAmbient     = presenceLevel === 'ambient';

  // ── Keyboard: Escape → close ───────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener('keydown', onKey, { capture: true });
    return () => document.removeEventListener('keydown', onKey, { capture: true });
  }, [open, onClose]);

  // ── Persisted skills ───────────────────────────────────────────────────────
  const skills        = useEmergentSkillsStore(s => s.skills);
  const skillActions  = useEmergentSkillsStore(s => s.actions);
  // ── Trust health ────────────────────────────────────────────────────────────────
  const trustHealth   = useTrustStore(selectTrustHealth);

  // ── Activity stream expanded state (collapsed by default) ────────────────────
  const [streamExpanded, setStreamExpanded] = useState(false);
  // ── Recent cognitive entries ───────────────────────────────────────────────
  // Snapshot computed only when tenantId changes (not reactive-subscribed here
  // to avoid extra complexity; the main workspace already handles that).
  const recentEntries = useMemo(
    () => useCognitiveStore.getState().listRecent(5, tenantId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tenantId, open], // refresh on open
  );

  // ── Focus trap: focus the panel when opened ────────────────────────────────
  const panelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => panelRef.current?.focus());
    }
  }, [open]);

  const hasContent =
    pending.length > 0 || skillDraft != null || skills.length > 0 || recentEntries.length > 0 || flows.length > 0;

  return (
    <Portal>
      <Box
        sx={{
          position:       'fixed',
          inset:          0,
          zIndex:         1700,
          pointerEvents:  open ? 'auto' : 'none',
        }}
      >
        {/* Backdrop */}
        <Box
          role="presentation"
          onClick={onClose}
          aria-hidden="true"
          sx={{
            position:       'fixed',
            inset:          0,
            bgcolor:        'rgba(0,0,0,0.24)',
            backdropFilter: 'blur(2px)',
            opacity:        open ? 1 : 0,
            transition:     'opacity 280ms',
            pointerEvents:  open ? 'auto' : 'none',
          }}
        />

        {/* Panel */}
        <M3Surface
          ref={panelRef}
          elevation={isCinematic ? 5 : 4}
          role="dialog"
          aria-modal="true"
          aria-label={`Jarvis Nexus — ${macroState.statusLabel}`}
          tabIndex={-1}
          sx={{
            position:       'fixed',
            top:            0,
            right:          0,
            bottom:         0,
            width:          isCinematic ? 420 : isAmbient ? 320 : 360,
            display:        'flex',
            flexDirection:  'column',
            overflow:       'hidden',
            bgcolor:        isCinematic
              ? 'var(--md-sys-color-surface-container-highest)'
              : 'var(--md-sys-color-surface-container-high)',
            borderLeft:     isCinematic
              ? `2px solid ${macroState.orbColor}`
              : '1px solid var(--md-sys-color-outline-variant)',
            transform:      open ? 'translateX(0)' : 'translateX(100%)',
            transition:     `transform ${ORBIT_MOTION.panelTransitionDuration} ${ORBIT_MOTION.transitionEasing}`,
            zIndex:         1701,
            outline:        'none',
          }}
        >
          {/* ── Orbital header ──────────────────────────────────────────── */}
          <OrbitalHeader
            onClose={onClose}
            nexusState={nexusState}
            agentMotionMultiplier={agentMotionMultiplier}
            agentColorShift={agentColorShift}
          />

          {/* ── P20/P21 Narrative strip — execution status ────────────── */}
          {coordinationLabel && (
            <Box
              aria-live="polite"
              aria-atomic="true"
              sx={{
                display:      'flex',
                alignItems:   'center',
                gap:          0.75,
                px:           1.5,
                py:           0.75,
                bgcolor:      'var(--md-sys-color-surface-container)',
                borderBottom: '1px solid var(--md-sys-color-outline-variant)',
              }}
            >
              {/* Active pulse dot */}
              <Box
                aria-hidden="true"
                sx={{
                  width:        6,
                  height:       6,
                  borderRadius: '50%',
                  flexShrink:   0,
                  bgcolor:      'var(--md-sys-color-primary)',
                  animation:    'orbit-pulse 1.8s ease-in-out infinite',
                  '@keyframes orbit-pulse': {
                    '0%, 100%': { opacity: 1, transform: 'scale(1)' },
                    '50%':      { opacity: 0.4, transform: 'scale(0.6)' },
                  },
                }}
              />
              <Typography
                variant="labelSmall"
                sx={{
                  color:      'var(--md-sys-color-on-surface-variant)',
                  fontStyle:  'italic',
                  lineHeight: 1.4,
                }}
              >
                {coordinationLabel}
              </Typography>
            </Box>
          )}

          {/* ── Scroll content ──────────────────────────────────────────── */}
          <Box
            sx={{
              flex:       1,
              overflowY:  'auto',
              p:          1.5,
              display:    'flex',
              flexDirection: 'column',
              gap:        2,
            }}
          >

            {/* ── Auto-Settings section ──────────────────────────────────── */}
            {pending.length > 0 && (
              <Box
                aria-live="polite"
                aria-label="Configurazione adattiva Jarvis"
              >
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  mb={1}
                >
                  <Typography
                    variant="labelSmall"
                    component="h3"
                    sx={{
                      color:       'var(--md-sys-color-on-surface-variant)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                    }}
                  >
                    Configurazione Adattiva
                  </Typography>
                  <Chip
                    label={pending.length}
                    size="small"
                    aria-label={`${pending.length} suggerimenti in attesa`}
                    sx={{
                      height:  18,
                      fontSize: 'var(--md-sys-typescale-label-small-font-size)',
                      bgcolor: 'var(--md-sys-color-primary-container)',
                      color:   'var(--md-sys-color-on-primary-container)',
                    }}
                  />
                </Stack>

                <Stack spacing={1}>
                  {pending.map((delta, i) => (
                    <DeltaCard
                      key={delta.id}
                      delta={delta}
                      index={i}
                      onApply={onApplyDelta}
                      onDismiss={onDismissDelta}
                    />
                  ))}
                </Stack>
              </Box>
            )}

            {/* ── Skill Discovery card ───────────────────────────────────── */}
            {skillDraft && (
              <Box>
                <Typography
                  variant="labelSmall"
                  component="h3"
                  mb={1}
                  sx={{
                    color:         'var(--md-sys-color-on-surface-variant)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}
                >
                  Skill in Arrivo
                </Typography>
                <SkillBirthCard
                  skillDraft={skillDraft}
                  onConfirm={onConfirmSkill}
                  onDismiss={onDismissSkill}
                />
              </Box>
            )}

            {/* ── Active Skills list ─────────────────────────────────────── */}
            <Box>
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                mb={1}
              >
                <Typography
                  variant="labelSmall"
                  component="h3"
                  sx={{
                    color:         'var(--md-sys-color-on-surface-variant)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}
                >
                  Skill Attive
                </Typography>
                {skills.length > 0 && (
                  <Chip
                    label={skills.length}
                    size="small"
                    aria-label={`${skills.length} skill personalizzate attive`}
                    sx={{
                      height:  18,
                      fontSize: 'var(--md-sys-typescale-label-small-font-size)',
                      bgcolor: 'var(--md-sys-color-secondary-container)',
                      color:   'var(--md-sys-color-on-secondary-container)',
                    }}
                  />
                )}
              </Stack>

              {skills.length === 0 ? (
                <Typography
                  variant="bodySmall"
                  component="p"
                  sx={{ color: 'var(--md-sys-color-on-surface-variant)', fontStyle: 'italic' }}
                >
                  Nessuna skill personalizzata ancora. Jarvis impara osservando le tue azioni.
                </Typography>
              ) : (
                <Stack spacing={0.75}>
                  {skills.slice(0, 5).map(skill => (
                    <M3Surface
                      key={skill.id}
                      elevation={0}
                      sx={{
                        p:          1,
                        borderRadius: 2,
                        bgcolor:    'var(--md-sys-color-surface-container)',
                        display:    'flex',
                        alignItems: 'center',
                        gap:        1,
                      }}
                    >
                      <ExtensionIcon
                        aria-hidden="true"
                        sx={{
                          fontSize:   'var(--md-sys-icon-size-sm, 18px)',
                          color:      'var(--md-sys-color-tertiary)',
                          flexShrink: 0,
                        }}
                      />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          variant="labelSmall"
                          component="p"
                          sx={{
                            color:     'var(--md-sys-color-on-surface)',
                            overflow:  'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {skill.name}
                        </Typography>
                        <Typography
                          variant="bodySmall"
                          component="span"
                          sx={{ color: 'var(--md-sys-color-on-surface-variant)', fontSize: 'var(--md-sys-typescale-label-small-font-size)' }}
                        >
                          {skill.usageCount} utilizzi
                          {skill.trigger.domain && (
                            <> · {DOMAIN_LABEL[skill.trigger.domain] ?? skill.trigger.domain}</>
                          )}
                        </Typography>
                      </Box>
                      <Tooltip title={`Rimuovi skill: ${skill.name}`}>
                        <IconButton
                          size="small"
                          onClick={() => skillActions.removeSkill(skill.id)}
                          aria-label={`Rimuovi skill ${skill.name}`}
                          sx={{ color: 'var(--md-sys-color-on-surface-variant)', p: 0.5 }}
                        >
                          <CloseIcon sx={{ fontSize: 'var(--md-sys-icon-size-xs, 16px)' }} />
                        </IconButton>
                      </Tooltip>
                    </M3Surface>
                  ))}
                  {skills.length > 5 && (
                    <Typography
                      variant="labelSmall"
                      component="p"
                      sx={{ color: 'var(--md-sys-color-primary)', cursor: 'default', textAlign: 'center', mt: 0.5 }}
                    >
                      +{skills.length - 5} altre skill attive
                    </Typography>
                  )}
                </Stack>
              )}
            </Box>

            {/* ── Orbit Flows section ────────────────────────────────────── */}
            {flows.length > 0 && (
              <Box aria-label="Flussi Orbit attivi">
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  mb={1}
                >
                  <Typography
                    variant="labelSmall"
                    component="h3"
                    sx={{
                      color:         'var(--md-sys-color-on-surface-variant)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                    }}
                  >
                    Flussi Orbit
                  </Typography>
                  <Chip
                    label={flows.length}
                    size="small"
                    aria-label={`${flows.length} flussi attivi`}
                    sx={{
                      height:  18,
                      fontSize: 'var(--md-sys-typescale-label-small-font-size)',
                      bgcolor: 'var(--md-sys-color-tertiary-container)',
                      color:   'var(--md-sys-color-on-tertiary-container)',
                    }}
                  />
                </Stack>

                <Stack spacing={0.75}>
                  {flows.map(flow => {
                    const attention = attentionMap[flow.id];
                    // Visual tier: primary = full, secondary = slightly muted,
                    // background = dim, suppressed = hidden, undefined = full
                    const opacity =
                      attention === 'suppressed' ? 0 :
                      attention === 'background' ? 0.35 :
                      attention === 'secondary'  ? 0.7 :
                      1;
                    const scale =
                      attention === 'background' || attention === 'suppressed' ? 0.93 :
                      attention === 'secondary'  ? 0.97 :
                      1;
                    return (
                    <M3Surface
                      key={flow.id}
                      elevation={0}
                      sx={{
                        p:            1,
                        borderRadius: 2,
                        bgcolor:      'var(--md-sys-color-surface-container)',
                        display:      attention === 'suppressed' ? 'none' : 'flex',
                        flexDirection: 'column',
                        gap:          0.5,
                        opacity,
                        transform:    `scale(${scale})`,
                        transformOrigin: 'center top',
                        transition:   'opacity 0.3s ease, transform 0.3s ease',
                      }}
                    >
                      <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Typography
                          variant="labelSmall"
                          component="p"
                          sx={{
                            color:         'var(--md-sys-color-on-surface)',
                            overflow:      'hidden',
                            textOverflow:  'ellipsis',
                            whiteSpace:    'nowrap',
                            flex:          1,
                            mr:            1,
                          }}
                        >
                          {flow.name}
                        </Typography>
                        <Stack direction="row" spacing={0.5} flexShrink={0}>
                          {onRunFlow && (
                            <Tooltip title={`Esegui flusso: ${flow.name}`}>
                              <IconButton
                                size="small"
                                onClick={() => onRunFlow(flow.id)}
                                aria-label={`Esegui flusso ${flow.name}`}
                                sx={{ color: 'var(--md-sys-color-tertiary)', p: 0.5 }}
                              >
                                <AutoAwesomeIcon sx={{ fontSize: 'var(--md-sys-icon-size-xs, 16px)' }} />
                              </IconButton>
                            </Tooltip>
                          )}
                          {onRemoveFlow && (
                            <Tooltip title={`Rimuovi flusso: ${flow.name}`}>
                              <IconButton
                                size="small"
                                onClick={() => onRemoveFlow(flow.id)}
                                aria-label={`Rimuovi flusso ${flow.name}`}
                                sx={{ color: 'var(--md-sys-color-on-surface-variant)', p: 0.5 }}
                              >
                                <CloseIcon sx={{ fontSize: 'var(--md-sys-icon-size-xs, 16px)' }} />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Stack>
                      </Stack>
                      <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                        {flow.steps.map(step => (
                          <Chip
                            key={step.stepId}
                            label={step.label}
                            size="small"
                            aria-label={`Step: ${step.label}`}
                            sx={{
                              height:   16,
                              fontSize: 'var(--md-sys-typescale-label-small-font-size)',
                              bgcolor:  'var(--md-sys-color-surface-container-high)',
                              color:    'var(--md-sys-color-on-surface-variant)',
                            }}
                          />
                        ))}
                      </Stack>
                      <Typography
                        variant="bodySmall"
                        component="span"
                        sx={{ color: 'var(--md-sys-color-on-surface-variant)', fontSize: 'var(--md-sys-typescale-label-small-font-size)' }}
                      >
                        {flow.executionCount} esecuzioni
                        {flow.lastRunAt > 0 && (
                          <> · ultima {relativeTime(flow.lastRunAt)}</>
                        )}
                      </Typography>
                    </M3Surface>
                  );
                  })}
                </Stack>
              </Box>
            )}

            {/* ── Recent Activity stream (collapsed by default) ─────────── */}
            {recentEntries.length > 0 && (
              <Box>
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  mb={streamExpanded ? 1 : 0}
                >
                  <Typography
                    variant="labelSmall"
                    component="h3"
                    sx={{
                      color:         'var(--md-sys-color-on-surface-variant)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                    }}
                  >
                    Attività Recente
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => setStreamExpanded(v => !v)}
                    aria-label={streamExpanded ? 'Comprimi attività recente' : 'Espandi attività recente'}
                    sx={{ p: 0.25, color: 'var(--md-sys-color-on-surface-variant)' }}
                  >
                    <Box
                      component="span"
                      className="material-symbols-outlined"
                      aria-hidden="true"
                      sx={{
                        fontSize:   'var(--md-sys-icon-size-sm, 18px)',
                        transition: 'transform 200ms',
                        transform:  streamExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                      }}
                    >
                      expand_more
                    </Box>
                  </IconButton>
                </Stack>

                <Collapse in={streamExpanded} unmountOnExit>
                  <Stack spacing={0.5}>
                    {recentEntries.map(entry => (
                    <Stack
                      key={entry.id}
                      direction="row"
                      alignItems="center"
                      spacing={1}
                      sx={{ py: 0.25 }}
                    >
                      {/* Domain dot */}
                      <Box
                        aria-hidden="true"
                        sx={{
                          width:    8,
                          height:   8,
                          borderRadius: '50%',
                          bgcolor:  DOMAIN_COLOR[entry.domain] ?? 'var(--md-sys-color-outline)',
                          flexShrink: 0,
                        }}
                      />
                      <Typography
                        variant="bodySmall"
                        component="p"
                        sx={{
                          flex:         1,
                          minWidth:     0,
                          color:        'var(--md-sys-color-on-surface)',
                          overflow:     'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace:   'nowrap',
                        }}
                      >
                        {entry.label}
                        </Typography>
                        <Typography
                          variant="bodySmall"
                          component="span"
                          sx={{
                            color:     'var(--md-sys-color-on-surface-variant)',
                            fontSize:  'var(--md-sys-typescale-label-small-font-size)',
                            flexShrink: 0,
                          }}
                        >
                          {relativeTime(entry.enteredAt)}
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>
                </Collapse>
              </Box>
            )}

            {/* ── Empty state ────────────────────────────────────────────── */}
            {!hasContent && (
              <Stack alignItems="center" spacing={1.5} py={4}>
                <AutoAwesomeIcon
                  aria-hidden="true"
                  sx={{
                    fontSize: 'var(--md-sys-icon-size-2xl, 40px)',
                    color:    'var(--md-sys-color-outlineVariant)',
                    animation: 'jarvisGlow 2s ease-in-out infinite',
                  }}
                />
                <Typography
                  variant="bodyMedium"
                  component="p"
                  sx={{ color: 'var(--md-sys-color-on-surface-variant)', textAlign: 'center' }}
                >
                  Jarvis sta osservando… Il Nexus si popola man mano che lavori.
                </Typography>
              </Stack>
            )}
          </Box>

          {/* ── Footer ────────────────────────────────────────────────────── */}
          {(appliedIds.length > 0 || stealthCount > 0 || autoFiredCount > 0) && (
            <Box
              sx={{
                px:         1.5,
                py:         1,
                borderTop:  '1px solid var(--md-sys-color-outline-variant)',
                bgcolor:    'var(--md-sys-color-surface-container-highest)',
                flexShrink: 0,
                display:    'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap:        1,
              }}
            >
              <Typography
                variant="bodySmall"
                component="p"
                sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}
              >
                ✓ {appliedIds.length + stealthCount} aggiustament{(appliedIds.length + stealthCount) === 1 ? 'o' : 'i'}
                {stealthCount > 0 && (
                  <Box component="span" sx={{ color: 'var(--md-sys-color-outline)', ml: 0.5 }}>
                    ({stealthCount} silenziosi)
                  </Box>
                )}
                {autoFiredCount > 0 && (
                  <Box component="span" sx={{
                    color: ambientFiredCount > 0
                      ? 'var(--md-sys-color-tertiary)'
                      : 'var(--md-sys-color-outline)',
                    ml: 0.5,
                  }}>
                    · {autoFiredCount === 1 ? 'Sta lavorando per te' : `Automazioni attive (${autoFiredCount})`}
                  </Box>
                )}
              </Typography>
              <Chip
                label={`Fiducia ${trustHealth}%`}
                size="small"
                aria-label={`Indice di fiducia Jarvis: ${trustHealth}%`}
                sx={{
                  height:   16,
                  fontSize: 'var(--md-sys-typescale-label-small-font-size)',
                  bgcolor:  trustHealth >= 70
                    ? 'var(--md-sys-color-secondary-container)'
                    : 'var(--md-sys-color-error-container)',
                  color:    trustHealth >= 70
                    ? 'var(--md-sys-color-on-secondary-container)'
                    : 'var(--md-sys-color-on-error-container)',
                }}
              />
            </Box>
          )}
        </M3Surface>
      </Box>
    </Portal>
  );
});
