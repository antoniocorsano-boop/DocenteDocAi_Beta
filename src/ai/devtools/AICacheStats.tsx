/**
 * AICacheStats.tsx — Cache statistics card for the AI DevTools module (Sprint 2)
 *
 * Displays hit-rate, miss-rate, and entry counts for both the legacy
 * analysis cache and the unified orchestrator cache.  Provides a
 * "Svuota tutto" button wired to `clearAllCaches()`.
 *
 * MD3 compliant — MUI v7 only, no custom components.
 */
import React, { memo } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';

import { getCacheStats, getUnifiedCacheSize, clearAllCaches, type CacheStats } from '../cache/aiCache';

// ── sub-component ─────────────────────────────────────────────────────────────

interface StatCellProps {
  label: string;
  value: string | number;
  highlight?: 'good' | 'warn' | 'neutral';
}

const StatCell: React.FC<StatCellProps> = memo(({ label, value, highlight = 'neutral' }) => {
  const bgMap = {
    good: 'var(--md-sys-color-secondary-container)',
    warn: 'var(--md-sys-color-error-container)',
    neutral: 'var(--md-sys-color-surface-container)',
  };
  const fgMap = {
    good: 'var(--md-sys-color-on-secondary-container)',
    warn: 'var(--md-sys-color-on-error-container)',
    neutral: 'var(--md-sys-color-on-surface)',
  };
  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 'var(--md-sys-shape-corner-medium)',
        bgcolor: bgMap[highlight],
        border: '1px solid var(--md-sys-color-outline-variant)',
        minWidth: 72,
        textAlign: 'center',
        flex: '1 1 80px',
      }}
    >
      <Typography
        variant="h6"
        sx={{ fontWeight: 'var(--md-sys-typescale-weight-bold)', color: fgMap[highlight], lineHeight: 1.1 }}
      >
        {value}
      </Typography>
      <Typography
        variant="caption"
        sx={{ color: 'var(--md-sys-color-on-surface-variant)', display: 'block', mt: '2px' }}
      >
        {label}
      </Typography>
    </Box>
  );
});
StatCell.displayName = 'StatCell';

// ── helper ────────────────────────────────────────────────────────────────────

function buildStats(): CacheStats & { unifiedSize: number } {
  return { ...getCacheStats(), unifiedSize: getUnifiedCacheSize() };
}

// ── props ─────────────────────────────────────────────────────────────────────

export interface AICacheStatsProps {
  /** Called after cache is cleared so parent can refresh its own state. */
  onClear?: () => void;
}

// ── main component ────────────────────────────────────────────────────────────

/**
 * AICacheStats — displays cache hit-rate, entry counts, and a clear button.
 *
 * Reads synchronously from the in-memory cache module — no async needed.
 */
const AICacheStats: React.FC<AICacheStatsProps> = memo(({ onClear }) => {
  const [stats, setStats] = React.useState(buildStats);

  const handleClear = React.useCallback(() => {
    clearAllCaches();
    const fresh = buildStats();
    setStats(fresh);
    onClear?.();
  }, [onClear]);

  const hitRatePct = stats.hitRate * 100;
  const totalRequests = stats.hits + stats.misses;
  const hitHighlight: StatCellProps['highlight'] =
    totalRequests === 0 ? 'neutral' : hitRatePct >= 50 ? 'good' : 'warn';

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography variant="titleSmall" sx={{ color: 'var(--md-sys-color-on-surface)' }}>
            Cache AI
          </Typography>
          {stats.unifiedSize > 0 && (
            <Chip
              size="small"
              label={`+${stats.unifiedSize} unified`}
              variant="outlined"
              aria-label={`${stats.unifiedSize} voci nella cache unificata`}
            />
          )}
        </Stack>
        <Button
          size="small"
          variant="text"
          onClick={handleClear}
          aria-label="Svuota entrambe le cache AI"
          startIcon={<DeleteSweepIcon fontSize="small" aria-hidden />}
          sx={{ color: 'var(--md-sys-color-error)' }}
        >
          Svuota tutto
        </Button>
      </Stack>

      <Stack direction="row" gap={1.5} flexWrap="wrap" sx={{ mb: 2 }}>
        <StatCell label="Voci (legacy)" value={stats.size} />
        <StatCell label="Hit" value={stats.hits} highlight={stats.hits > 0 ? 'good' : 'neutral'} />
        <StatCell label="Miss" value={stats.misses} />
        <StatCell
          label="Hit-rate"
          value={totalRequests > 0 ? `${hitRatePct.toFixed(1)}%` : '—'}
          highlight={hitHighlight}
        />
      </Stack>

      {totalRequests > 0 && (
        <Box>
          <LinearProgress
            variant="determinate"
            value={Math.min(100, hitRatePct)}
            aria-label={`Cache hit-rate: ${hitRatePct.toFixed(1)}%`}
            sx={{
              height: 6,
              borderRadius: 'var(--md-sys-shape-corner-full)',
              bgcolor: 'var(--md-sys-color-surface-container)',
              '& .MuiLinearProgress-bar': {
                bgcolor: hitRatePct >= 50
                  ? 'var(--md-sys-color-secondary)'
                  : 'var(--md-sys-color-error)',
                borderRadius: 'var(--md-sys-shape-corner-full)',
              },
            }}
          />
          <Typography variant="caption" sx={{ color: 'var(--md-sys-color-on-surface-variant)', mt: 0.5, display: 'block' }}>
            {totalRequests} richieste totali
          </Typography>
        </Box>
      )}
    </Box>
  );
});

AICacheStats.displayName = 'AICacheStats';
export default AICacheStats;
