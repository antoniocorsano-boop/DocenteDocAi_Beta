/**
 * GlobalProgressBar.tsx — Progress bar globale pesata per Maturità AI
 *
 * Mostra il punteggio globale ponderato (0–100) con:
 * - LinearProgress MD3 colorata in base al range
 * - Typography con score e label testuale
 * - Tooltip con dettaglio del computo
 *
 * MD3 Gold Compliant — solo token MD3 in sx.
 */
import React from 'react';
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

// ── helpers ───────────────────────────────────────────────────────────────────

function tok(name: string) {
  return `var(--md-sys-color-${name})`;
}

function getBarColor(score: number): string {
  if (score >= 70) return tok('tertiary');
  if (score >= 40) return tok('secondary');
  return tok('error');
}

function getLabel(score: number): string {
  if (score >= 70) return 'Maturità Avanzata';
  if (score >= 55) return 'Maturità Intermedia';
  if (score >= 40) return 'Maturità Base';
  return 'Pre-Maturità';
}

// ── Component ─────────────────────────────────────────────────────────────────

export interface GlobalProgressBarProps {
  /** Punteggio globale pesato 0-100 */
  score: number;
  /** Numero totale di sezioni */
  sectionCount?: number;
  /** Numero di sezioni con punteggio ≥ 70 */
  okCount?: number;
}

const GlobalProgressBar: React.FC<GlobalProgressBarProps> = ({
  score,
  sectionCount,
  okCount,
}) => {
  const barColor = getBarColor(score);
  const label = getLabel(score);

  const tooltipText =
    sectionCount != null && okCount != null
      ? `Punteggio globale pesato: ${score}/100. ${okCount} sezioni su ${sectionCount} hanno raggiunto il livello "Avanzato" (≥70%).`
      : `Punteggio globale pesato: ${score}/100`;

  return (
    <Tooltip title={tooltipText} arrow placement="bottom">
      <Box
        aria-label={`Maturità AI globale: ${score}% — ${label}`}
        role="group"
      >
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="baseline"
          sx={{ mb: 'var(--md-sys-spacing-1)' }}
        >
          <Typography
            variant="titleSmall"
            sx={{ color: tok('on-surface'), fontWeight: 'var(--md-sys-typescale-weight-semibold)' }}
          >
            Maturità AI Globale
          </Typography>
          <Stack direction="row" spacing={1} alignItems="baseline">
            <Typography
              component="span"
              sx={{
                fontSize: 'var(--md-sys-typescale-headline-small-font-size)',
                fontWeight: 'var(--md-sys-typescale-weight-bold)',
                color: barColor,
                lineHeight: 1,
              }}
            >
              {score}
            </Typography>
            <Typography
              component="span"
              variant="labelMedium"
              sx={{ color: tok('on-surface-variant') }}
            >
              / 100 — {label}
            </Typography>
          </Stack>
        </Stack>

        <LinearProgress
          variant="determinate"
          value={score}
          aria-label={`Maturità AI: ${score}%`}
          sx={{
            height: 10,
            borderRadius: 'var(--md-sys-shape-corner-full)',
            backgroundColor: tok('surface-container-high'),
            '& .MuiLinearProgress-bar': {
              backgroundColor: barColor,
              borderRadius: 'var(--md-sys-shape-corner-full)',
              transition: 'transform 0.6s ease',
            },
          }}
        />
      </Box>
    </Tooltip>
  );
};

export default GlobalProgressBar;
