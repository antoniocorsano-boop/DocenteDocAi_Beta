/**
 * SectionBadge.tsx — Badge dinamico per sezione Maturità AI
 *
 * Visualizza un Chip colorato con tooltip che mostra:
 * - Punteggio della sezione
 * - Numero di blockers attivi
 * - Colore adattivo: score ≥ 70 → tertiary ✅ / ≥ 40 → warning ⚠️ / < 40 → error 🔴
 *
 * MD3 Gold Compliant — nessun valore hardcoded, solo token MD3.
 */
import React from 'react';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import type { MaturitaSection } from '../../../types/aiMaturita.types';

// ── helpers ───────────────────────────────────────────────────────────────────

function tok(name: string) {
  return `var(--md-sys-color-${name})`;
}

type BadgeLevel = 'ok' | 'warn' | 'error';

function getLevel(score: number): BadgeLevel {
  if (score >= 70) return 'ok';
  if (score >= 40) return 'warn';
  return 'error';
}

const LEVEL_STYLES: Record<BadgeLevel, { color: string; bg: string }> = {
  ok: {
    color: tok('on-tertiary-container'),
    bg: tok('tertiary-container'),
  },
  warn: {
    color: tok('on-secondary-container'),
    bg: tok('secondary-container'),
  },
  error: {
    color: tok('on-error-container'),
    bg: tok('error-container'),
  },
};

const LEVEL_ICON: Record<BadgeLevel, React.ReactElement> = {
  ok: <CheckCircleOutlineIcon fontSize="small" aria-hidden />,
  warn: <WarningAmberOutlinedIcon fontSize="small" aria-hidden />,
  error: <ErrorOutlineIcon fontSize="small" aria-hidden />,
};

const LEVEL_LABEL: Record<BadgeLevel, string> = {
  ok: 'Ottimo',
  warn: 'Attenzione',
  error: 'Critico',
};

// ── Component ─────────────────────────────────────────────────────────────────

export interface SectionBadgeProps {
  /** La sezione corrente da valutare */
  section: MaturitaSection;
  /** Mostra anche il punteggio numerico nel chip */
  showScore?: boolean;
}

const SectionBadge: React.FC<SectionBadgeProps> = ({ section, showScore = true }) => {
  const level = getLevel(section.score);
  const styles = LEVEL_STYLES[level];
  const criticalCount = section.blockers.filter((b) => b.severita === 'critica').length;
  const totalBlockers = section.blockers.length;

  const tooltipTitle = totalBlockers === 0
    ? `${section.label}: ${section.score}/100 — nessun blocker attivo`
    : `${section.label}: ${section.score}/100 — ${totalBlockers} blocker${totalBlockers > 1 ? 's' : ''}${criticalCount > 0 ? ` (${criticalCount} critico${criticalCount > 1 ? 'i' : ''})` : ''}`;

  return (
    <Tooltip title={tooltipTitle} arrow placement="top">
      <Chip
        icon={LEVEL_ICON[level]}
        label={showScore ? `${section.score}% — ${LEVEL_LABEL[level]}` : LEVEL_LABEL[level]}
        size="small"
        aria-label={tooltipTitle}
        sx={{
          backgroundColor: styles.bg,
          color: styles.color,
          fontSize: 'var(--md-sys-typescale-label-small-font-size)',
          fontWeight: 'var(--md-sys-typescale-weight-semibold)',
          '& .MuiChip-icon': { color: styles.color },
        }}
      />
    </Tooltip>
  );
};

export default SectionBadge;
