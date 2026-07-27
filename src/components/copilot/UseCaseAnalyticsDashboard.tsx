/**
 * UseCaseAnalyticsDashboard.tsx — UC Analytics & Adaptive Intelligence panel.
 *
 * Shows the full adaptive-intelligence status across all 13 operational Use Cases:
 *
 *   Block 1 — Summary strip: UCs monitorate, in scrutinio alto, delta cumulativo
 *   Block 2 — Compliance hotspots: top degrading UCs with autoRemediate badge
 *   Block 3 — UC heatmap: cards per tutti i 13 UC (scrutiny, boost, eventi, fallimenti)
 *   Block 4 — Top UC più usati: ranked by totalEvents
 *
 * MD3 Gold Compliant — no <div> for visual containers, all tokens MD3.
 */

import React, { useState } from 'react';
import Box             from '@mui/material/Box';
import Stack           from '@mui/material/Stack';
import Typography      from '@mui/material/Typography';
import Chip            from '@mui/material/Chip';
import LinearProgress  from '@mui/material/LinearProgress';
import Divider         from '@mui/material/Divider';
import Tooltip         from '@mui/material/Tooltip';
import Button          from '@mui/material/Button';
import M3Surface       from '../ui/M3Surface';
import { useAdaptiveDashboard } from '../../hooks/useAdaptiveDashboard';
import type { AdaptiveProfile } from '../../cognition/adaptiveAssistant';
import type { UseCaseSummary }  from '../../cognition/useCaseTelemetry';

// ── Helpers ────────────────────────────────────────────────────────────────────

function scrutinyColor(level: AdaptiveProfile['scrutinyLevel']): string {
  switch (level) {
    case 'high':    return 'var(--md-sys-color-error)';
    case 'normal':  return 'var(--md-sys-color-on-surface-variant)';
    case 'relaxed': return 'var(--md-sys-color-primary)';
  }
}

function scrutinyIcon(level: AdaptiveProfile['scrutinyLevel']): string {
  switch (level) {
    case 'high':    return 'gpp_bad';
    case 'normal':  return 'shield';
    case 'relaxed': return 'verified';
  }
}

function scrutinyLabel(level: AdaptiveProfile['scrutinyLevel']): string {
  switch (level) {
    case 'high':    return 'Scrutinio alto';
    case 'normal':  return 'Normale';
    case 'relaxed': return 'Rilassato';
  }
}

function deltaColor(delta: number): string {
  if (delta > 2)  return 'var(--md-sys-color-primary)';
  if (delta < -2) return 'var(--md-sys-color-error)';
  return 'var(--md-sys-color-on-surface-variant)';
}

function deltaIcon(delta: number): string {
  if (delta > 2)  return 'trending_up';
  if (delta < -2) return 'trending_down';
  return 'trending_flat';
}

function formatDelta(delta: number): string {
  if (delta === 0) return '±0';
  return delta > 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1);
}

// ── Sub-components ────────────────────────────────────────────────────────────

/** Summary stat card */
const StatCard: React.FC<{
  icon: string;
  label: string;
  value: string;
  color?: string;
  tooltip?: string;
}> = ({ icon, label, value, color = 'var(--md-sys-color-on-surface)', tooltip }) => (
  <Tooltip title={tooltip ?? ''} placement="top">
    <M3Surface
      elevation={2}
      sx={{
        flex: 1,
        minWidth: 0,
        borderRadius: 'var(--md-sys-shape-corner-medium)',
        p: 'var(--md-sys-spacing-3)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--md-sys-spacing-1)',
        cursor: tooltip ? 'help' : 'default',
      }}
    >
      <Stack direction="row" alignItems="center" gap="var(--md-sys-spacing-1)">
        <Box
          component="span"
          className="material-symbols-outlined"
          aria-hidden="true"
          sx={{ fontSize: 'var(--md-sys-icon-size-sm)', color }}
        >
          {icon}
        </Box>
        <Typography variant="labelSmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
          {label}
        </Typography>
      </Stack>
      <Typography variant="titleLarge" sx={{ color, fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </Typography>
    </M3Surface>
  </Tooltip>
);

/** Degrading UC alert card */
const DegradingCard: React.FC<{ profile: AdaptiveProfile }> = ({ profile }) => (
  <M3Surface
    elevation={3}
    sx={{
      borderRadius: 'var(--md-sys-shape-corner-medium)',
      p: 'var(--md-sys-spacing-3)',
      borderLeft: '3px solid var(--md-sys-color-error)',
    }}
  >
    <Stack gap="var(--md-sys-spacing-2)">
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" gap="var(--md-sys-spacing-2)">
        <Stack direction="row" alignItems="center" gap="var(--md-sys-spacing-1)">
          <Box
            component="span"
            className="material-symbols-outlined"
            aria-hidden="true"
            sx={{ fontSize: 'var(--md-sys-icon-size-sm)', color: 'var(--md-sys-color-error)', flexShrink: 0 }}
          >
            warning
          </Box>
          <Stack>
            <Typography variant="labelMedium" sx={{ color: 'var(--md-sys-color-error)' }}>
              {profile.useCaseId}
            </Typography>
            <Typography variant="bodySmall" sx={{ color: 'var(--md-sys-color-on-surface)' }}>
              {profile.label}
            </Typography>
          </Stack>
        </Stack>
        <Stack direction="row" gap="var(--md-sys-spacing-1)" alignItems="center" sx={{ flexShrink: 0 }}>
          {profile.autoRemediate && (
            <Chip
              label="Auto-remediate"
              size="small"
              sx={{
                height: 20,
                fontSize: 'var(--md-sys-typescale-label-small-font-size)',
                bgcolor: 'var(--md-sys-color-error-container)',
                color:   'var(--md-sys-color-on-error-container)',
                '& .MuiChip-label': { px: 1 },
              }}
            />
          )}
          {profile.complianceBoost > 0 && (
            <Chip
              label={`+${profile.complianceBoost} boost`}
              size="small"
              sx={{
                height: 20,
                fontSize: 'var(--md-sys-typescale-label-small-font-size)',
                bgcolor: 'var(--md-sys-color-tertiary-container)',
                color:   'var(--md-sys-color-on-tertiary-container)',
                '& .MuiChip-label': { px: 1 },
              }}
            />
          )}
        </Stack>
      </Stack>
      <Typography
        variant="bodySmall"
        sx={{
          color: 'var(--md-sys-color-on-surface-variant)',
          fontStyle: 'italic',
          lineHeight: 1.4,
        }}
      >
        {profile.reason}
      </Typography>
    </Stack>
  </M3Surface>
);

/** UC heatmap card */
const UCCard: React.FC<{
  profile: AdaptiveProfile;
  summary: UseCaseSummary | undefined;
}> = ({ profile, summary }) => {
  const color     = scrutinyColor(profile.scrutinyLevel);
  const icon      = scrutinyIcon(profile.scrutinyLevel);
  const label     = scrutinyLabel(profile.scrutinyLevel);
  const hasEvents = (summary?.totalEvents ?? 0) > 0;

  const failRate = hasEvents && summary
    ? Math.round((summary.complianceFailures / summary.totalEvents) * 100)
    : 0;

  return (
    <M3Surface
      elevation={2}
      sx={{
        borderRadius: 'var(--md-sys-shape-corner-medium)',
        p: 'var(--md-sys-spacing-3)',
        borderTop: `2px solid ${color}`,
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--md-sys-spacing-2)',
      }}
    >
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap="var(--md-sys-spacing-1)">
        <Stack gap="2px">
          <Typography variant="labelMedium" sx={{ color, fontVariantNumeric: 'tabular-nums' }}>
            {profile.useCaseId}
          </Typography>
          <Typography
            variant="bodySmall"
            sx={{
              color: 'var(--md-sys-color-on-surface)',
              lineHeight: 1.3,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {profile.label}
          </Typography>
        </Stack>
        <Tooltip title={label} placement="top">
          <Box
            component="span"
            className="material-symbols-outlined"
            aria-hidden="true"
            sx={{ fontSize: 'var(--md-sys-icon-size-sm)', color, flexShrink: 0, mt: '2px' }}
          >
            {icon}
          </Box>
        </Tooltip>
      </Stack>

      {/* Boost badge */}
      {profile.complianceBoost > 0 && (
        <Chip
          label={`Scrutinio +${profile.complianceBoost}`}
          size="small"
          sx={{
            alignSelf: 'flex-start',
            height: 18,
            fontSize: 'var(--md-sys-typescale-label-small-font-size)',
            bgcolor: 'var(--md-sys-color-error-container)',
            color:   'var(--md-sys-color-on-error-container)',
            '& .MuiChip-label': { px: 1 },
          }}
        />
      )}

      {/* Stats */}
      {hasEvents && summary ? (
        <Stack gap="var(--md-sys-spacing-1)">
          <Stack direction="row" justifyContent="space-between">
            <Typography variant="labelSmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
              {summary.totalEvents} eventi · {summary.complianceFailures} fail
            </Typography>
            <Typography
              variant="labelSmall"
              sx={{ color: deltaColor(summary.avgComplianceDelta), fontVariantNumeric: 'tabular-nums' }}
            >
              {formatDelta(summary.avgComplianceDelta)}
            </Typography>
          </Stack>

          {/* Fail rate bar */}
          {failRate > 0 ? (
            <Tooltip title={`${failRate}% tasso di fallimento compliance`} placement="bottom">
              <Box>
                <LinearProgress
                  variant="determinate"
                  value={failRate}
                  sx={{
                    height: 3,
                    borderRadius: 2,
                    bgcolor: 'var(--md-sys-color-surface-container-highest)',
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 2,
                      bgcolor: failRate > 50
                        ? 'var(--md-sys-color-error)'
                        : failRate > 20
                          ? 'var(--md-sys-color-tertiary)'
                          : 'var(--md-sys-color-primary)',
                    },
                  }}
                />
              </Box>
            </Tooltip>
          ) : (
            <Box
              sx={{
                height: 3,
                borderRadius: 2,
                bgcolor: 'var(--md-sys-color-primary)',
                opacity: 0.3,
              }}
            />
          )}
        </Stack>
      ) : (
        <Typography variant="bodySmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)', fontStyle: 'italic' }}>
          Nessun evento
        </Typography>
      )}
    </M3Surface>
  );
};

/** Top-used UC row */
const TopUCRow: React.FC<{
  rank: number;
  summary: UseCaseSummary;
  maxEvents: number;
}> = ({ rank, summary, maxEvents }) => (
  <Stack gap="var(--md-sys-spacing-1)">
    <Stack direction="row" alignItems="center" justifyContent="space-between" gap="var(--md-sys-spacing-2)">
      <Stack direction="row" alignItems="center" gap="var(--md-sys-spacing-2)" sx={{ minWidth: 0 }}>
        <Typography
          variant="labelSmall"
          sx={{
            color: 'var(--md-sys-color-on-surface-variant)',
            fontVariantNumeric: 'tabular-nums',
            width: 16,
            textAlign: 'right',
            flexShrink: 0,
          }}
        >
          #{rank}
        </Typography>
        <Stack sx={{ minWidth: 0 }}>
          <Typography variant="labelMedium" sx={{ color: 'var(--md-sys-color-on-surface)', fontVariantNumeric: 'tabular-nums' }}>
            {summary.useCaseId}
          </Typography>
        </Stack>
      </Stack>
      <Stack direction="row" alignItems="center" gap="var(--md-sys-spacing-2)" sx={{ flexShrink: 0 }}>
        <Typography
          variant="bodySmall"
          sx={{ color: 'var(--md-sys-color-on-surface-variant)', fontVariantNumeric: 'tabular-nums' }}
        >
          {summary.totalEvents} evt
        </Typography>
        <Typography
          variant="labelSmall"
          sx={{
            color: deltaColor(summary.avgComplianceDelta),
            fontVariantNumeric: 'tabular-nums',
            minWidth: 36,
            textAlign: 'right',
          }}
        >
          {formatDelta(summary.avgComplianceDelta)}
        </Typography>
      </Stack>
    </Stack>
    <LinearProgress
      variant="determinate"
      value={maxEvents > 0 ? Math.round((summary.totalEvents / maxEvents) * 100) : 0}
      sx={{
        height: 3,
        borderRadius: 2,
        bgcolor: 'var(--md-sys-color-surface-container-highest)',
        '& .MuiLinearProgress-bar': {
          borderRadius: 2,
          bgcolor: 'var(--md-sys-color-primary)',
        },
      }}
    />
  </Stack>
);

// ── Main component ─────────────────────────────────────────────────────────────

const UseCaseAnalyticsDashboard: React.FC = () => {
  const {
    profiles,
    degrading,
    summaries,
    hotspots,
    topUsed,
    cumulativeDelta,
    totalEvents,
    totalFailures,
  } = useAdaptiveDashboard();

  const summaryMap = new Map(summaries.map((s) => [s.useCaseId, s]));
  const maxTopEvents = topUsed.length > 0 ? topUsed[0].totalEvents : 1;

  const [showAllUC, setShowAllUC] = useState(false);

  const visibleProfiles = showAllUC ? profiles : profiles.slice(0, 6);

  return (
    <Stack gap="var(--md-sys-spacing-4)" sx={{ py: 'var(--md-sys-spacing-2)' }}>

      {/* ── Header ── */}
      <Stack direction="row" alignItems="center" gap="var(--md-sys-spacing-2)">
        <Box
          component="span"
          className="material-symbols-outlined"
          aria-hidden="true"
          sx={{ fontSize: 'var(--md-sys-icon-size-md)', color: 'var(--md-sys-color-primary)' }}
        >
          analytics
        </Box>
        <Stack>
          <Typography variant="titleMedium" sx={{ color: 'var(--md-sys-color-on-surface)' }}>
            Analytics Use Case
          </Typography>
          <Typography variant="bodySmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
            Monitoraggio adattivo dei 13 flussi operativi · aggiornato in tempo reale
          </Typography>
        </Stack>
      </Stack>

      {/* ── Block 1: Summary strip ── */}
      <Stack direction="row" gap="var(--md-sys-spacing-2)" flexWrap="wrap">
        <StatCard
          icon="neurology"
          label="UC monitorati"
          value={`${profiles.length}`}
          color="var(--md-sys-color-primary)"
          tooltip="Flussi operativi tracciati dal sistema adattivo"
        />
        <StatCard
          icon="gpp_bad"
          label="Scrutinio alto"
          value={`${degrading.length}`}
          color={degrading.length > 0 ? 'var(--md-sys-color-error)' : 'var(--md-sys-color-on-surface-variant)'}
          tooltip="UC in drift negativo — compliance boost attivo"
        />
        <StatCard
          icon={deltaIcon(cumulativeDelta)}
          label="Delta cumulativo"
          value={formatDelta(cumulativeDelta)}
          color={deltaColor(cumulativeDelta)}
          tooltip="Somma netta di tutti i complianceDelta registrati"
        />
        <StatCard
          icon="event_list"
          label="Total eventi"
          value={totalEvents.toLocaleString('it-IT')}
          tooltip="Totale eventi telemetria registrati"
        />
        {totalFailures > 0 && (
          <StatCard
            icon="warning"
            label="Fail compliance"
            value={`${totalFailures}`}
            color="var(--md-sys-color-error)"
            tooltip="Totale eventi compliance_fail su tutti i flussi"
          />
        )}
      </Stack>

      {/* ── Block 2: Degrading / alert UCs ── */}
      {degrading.length > 0 && (
        <M3Surface
          elevation={1}
          sx={{ borderRadius: 'var(--md-sys-shape-corner-large)', p: 'var(--md-sys-spacing-4)' }}
        >
          <Stack gap="var(--md-sys-spacing-3)">
            <Stack direction="row" alignItems="center" gap="var(--md-sys-spacing-2)">
              <Box
                component="span"
                className="material-symbols-outlined"
                aria-hidden="true"
                sx={{ fontSize: 'var(--md-sys-icon-size-sm)', color: 'var(--md-sys-color-error)' }}
              >
                gpp_bad
              </Box>
              <Typography variant="titleSmall" sx={{ color: 'var(--md-sys-color-error)' }}>
                Flussi in scrutinio alto ({degrading.length})
              </Typography>
            </Stack>
            <Typography variant="bodySmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
              Questi Use Case mostrano un drift negativo della compliance. L&apos;assistente ha aumentato
              il peso delle azioni normative su questi flussi in modo automatico.
            </Typography>
            <Stack gap="var(--md-sys-spacing-2)">
              {degrading.map((p) => (
                <DegradingCard key={p.useCaseId} profile={p} />
              ))}
            </Stack>
          </Stack>
        </M3Surface>
      )}

      {/* ── Block 3: UC heatmap ── */}
      <M3Surface
        elevation={1}
        sx={{ borderRadius: 'var(--md-sys-shape-corner-large)', p: 'var(--md-sys-spacing-4)' }}
      >
        <Stack gap="var(--md-sys-spacing-3)">
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" alignItems="center" gap="var(--md-sys-spacing-2)">
              <Box
                component="span"
                className="material-symbols-outlined"
                aria-hidden="true"
                sx={{ fontSize: 'var(--md-sys-icon-size-sm)', color: 'var(--md-sys-color-on-surface-variant)' }}
              >
                grid_view
              </Box>
              <Typography variant="titleSmall" sx={{ color: 'var(--md-sys-color-on-surface)' }}>
                Heatmap flussi operativi
              </Typography>
            </Stack>
            {/* Legend */}
            <Stack direction="row" gap="var(--md-sys-spacing-2)" alignItems="center">
              {(['high', 'normal', 'relaxed'] as const).map((level) => (
                <Stack key={level} direction="row" alignItems="center" gap="4px">
                  <Box
                    component="span"
                    className="material-symbols-outlined"
                    aria-hidden="true"
                    sx={{ fontSize: 'var(--md-sys-icon-size-xs)', color: scrutinyColor(level) }}
                  >
                    {scrutinyIcon(level)}
                  </Box>
                  <Typography variant="labelSmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                    {scrutinyLabel(level)}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Stack>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)',
              },
              gap: 'var(--md-sys-spacing-2)',
            }}
          >
            {visibleProfiles.map((profile) => (
              <UCCard
                key={profile.useCaseId}
                profile={profile}
                summary={summaryMap.get(profile.useCaseId)}
              />
            ))}
          </Box>

          {profiles.length > 6 && (
            <Button
              variant="text"
              size="small"
              onClick={() => setShowAllUC((v) => !v)}
              aria-expanded={showAllUC}
              sx={{
                alignSelf: 'center',
                color: 'var(--md-sys-color-primary)',
                textTransform: 'none',
              }}
            >
              {showAllUC ? 'Mostra meno' : `Mostra tutti (${profiles.length - 6} UC nascosti)`}
            </Button>
          )}
        </Stack>
      </M3Surface>

      {/* ── Block 4: Compliance hotspots ── */}
      {hotspots.length > 0 && (
        <M3Surface
          elevation={1}
          sx={{ borderRadius: 'var(--md-sys-shape-corner-large)', p: 'var(--md-sys-spacing-4)' }}
        >
          <Stack gap="var(--md-sys-spacing-3)">
            <Stack direction="row" alignItems="center" gap="var(--md-sys-spacing-2)">
              <Box
                component="span"
                className="material-symbols-outlined"
                aria-hidden="true"
                sx={{ fontSize: 'var(--md-sys-icon-size-sm)', color: 'var(--md-sys-color-tertiary)' }}
              >
                local_fire_department
              </Box>
              <Typography variant="titleSmall" sx={{ color: 'var(--md-sys-color-on-surface)' }}>
                Hotspot compliance
              </Typography>
            </Stack>
            <Stack gap="var(--md-sys-spacing-2)">
              {hotspots.map((s, i) => (
                <Stack key={s.useCaseId}>
                  {i > 0 && <Divider sx={{ mb: 'var(--md-sys-spacing-2)' }} />}
                  <Stack direction="row" alignItems="center" justifyContent="space-between" gap="var(--md-sys-spacing-2)">
                    <Stack>
                      <Typography variant="labelMedium" sx={{ color: 'var(--md-sys-color-on-surface)' }}>
                        {s.useCaseId}
                      </Typography>
                      <Typography variant="bodySmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                        {s.complianceFailures} fallimenti su {s.totalEvents} eventi
                      </Typography>
                    </Stack>
                    <Stack alignItems="flex-end" gap="2px">
                      <Typography
                        variant="titleSmall"
                        sx={{ color: 'var(--md-sys-color-error)', fontVariantNumeric: 'tabular-nums' }}
                      >
                        {s.totalEvents > 0
                          ? `${Math.round((s.complianceFailures / s.totalEvents) * 100)}%`
                          : '—'}
                      </Typography>
                      <Typography variant="labelSmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                        fail rate
                      </Typography>
                    </Stack>
                  </Stack>
                </Stack>
              ))}
            </Stack>
          </Stack>
        </M3Surface>
      )}

      {/* ── Block 5: Top UC per utilizzo ── */}
      {topUsed.some((s) => s.totalEvents > 0) && (
        <M3Surface
          elevation={1}
          sx={{ borderRadius: 'var(--md-sys-shape-corner-large)', p: 'var(--md-sys-spacing-4)' }}
        >
          <Stack gap="var(--md-sys-spacing-3)">
            <Stack direction="row" alignItems="center" gap="var(--md-sys-spacing-2)">
              <Box
                component="span"
                className="material-symbols-outlined"
                aria-hidden="true"
                sx={{ fontSize: 'var(--md-sys-icon-size-sm)', color: 'var(--md-sys-color-primary)' }}
              >
                leaderboard
              </Box>
              <Typography variant="titleSmall" sx={{ color: 'var(--md-sys-color-on-surface)' }}>
                Top Use Case per utilizzo
              </Typography>
            </Stack>
            <Stack gap="var(--md-sys-spacing-3)">
              {topUsed
                .filter((s) => s.totalEvents > 0)
                .map((s, i) => (
                  <TopUCRow
                    key={s.useCaseId}
                    rank={i + 1}
                    summary={s}
                    maxEvents={maxTopEvents}
                  />
                ))}
            </Stack>
          </Stack>
        </M3Surface>
      )}

      {/* ── Empty state ── */}
      {totalEvents === 0 && (
        <M3Surface
          elevation={1}
          sx={{
            borderRadius: 'var(--md-sys-shape-corner-large)',
            p: 'var(--md-sys-spacing-6)',
            textAlign: 'center',
          }}
        >
          <Stack alignItems="center" gap="var(--md-sys-spacing-3)">
            <Box
              component="span"
              className="material-symbols-outlined"
              aria-hidden="true"
              sx={{ fontSize: 'var(--md-sys-icon-size-xl)', color: 'var(--md-sys-color-on-surface-variant)' }}
            >
              data_usage
            </Box>
            <Stack gap="var(--md-sys-spacing-1)">
              <Typography variant="titleSmall" sx={{ color: 'var(--md-sys-color-on-surface)' }}>
                Nessun dato telemetria ancora
              </Typography>
              <Typography variant="bodySmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                La dashboard si popola automaticamente mentre usi il sistema.
                Esegui azioni copilot, audit o valutazioni per vedere i dati.
              </Typography>
            </Stack>
          </Stack>
        </M3Surface>
      )}

    </Stack>
  );
};

export default UseCaseAnalyticsDashboard;
