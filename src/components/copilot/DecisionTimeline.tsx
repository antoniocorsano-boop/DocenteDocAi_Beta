/**
 * DecisionTimeline.tsx — Sprint 12: Vertical decisional timeline.
 *
 * Reads live data from:
 *   - decisionMemory.getSignals()
 *   - enterpriseAuditLog.getLast(50)
 *
 * Features:
 *   - Category filter tabs: Tutto | Normativa | Studenti | Documenti | Sistema
 *   - Cluster mode: events within 5 min are grouped + collapsible
 *   - Anomaly detection: consecutive blocks + stale approvals flagged
 *   - Max 15 events, newest first, vertically scrollable
 *   - Real-time: subscribes to decisionMemory.onSignal() via useSyncExternalStore
 *
 * Architecture:
 *   - Pure presentational sections delegate to buildTimeline / filterTimeline /
 *     clusterTimeline / detectAnomalies from decisionTimeline.ts
 *   - No business logic here
 */

import React, { useMemo, useState, useSyncExternalStore, useCallback } from 'react';
import Box        from '@mui/material/Box';
import Stack      from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Divider    from '@mui/material/Divider';
import Chip       from '@mui/material/Chip';

import { decisionMemory }           from '../../cognition/decisionMemory';
import { enterpriseAuditLog }       from '../../services/enterprise/enterpriseAuditLog';
import {
  buildTimeline,
  filterTimeline,
  clusterTimeline,
  detectAnomalies,
}                                   from '../../cognition/decisionTimeline';
import type { TimelineFilter, DecisionEvent, ClusteredGroup }
  from '../../cognition/decisionTimeline';
import DecisionEventChip            from './DecisionEventChip';

// ─── useSyncExternalStore bridge ──────────────────────────────────────────────

function subscribe(cb: () => void): () => void {
  return decisionMemory.onSignal(cb);
}
function getSnapshot() {
  return decisionMemory.getState();
}

// ─── Filter tab config ────────────────────────────────────────────────────────

const FILTERS: { label: string; value: TimelineFilter }[] = [
  { label: 'Tutto',      value: 'all'       },
  { label: 'Normativa',  value: 'normative' },
  { label: 'Studenti',   value: 'studenti'  },
  { label: 'Documenti',  value: 'documenti' },
  { label: 'Sistema',    value: 'sistema'   },
];

// ─── Cluster group row ────────────────────────────────────────────────────────

interface GroupRowProps {
  group: ClusteredGroup;
}

const GroupRow: React.FC<GroupRowProps> = ({ group }) => {
  const [expanded, setExpanded] = useState(group.events.length === 1);

  const toggleLabel = expanded ? 'Comprimi' : `Espandi (${group.events.length})`;

  return (
    <Box>
      {/* Cluster header (multiple events only) */}
      {group.events.length > 1 && (
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: 'var(--md-sys-spacing-1)' }}
        >
          <Stack direction="row" alignItems="center" gap="var(--md-sys-spacing-1)">
            <Box
              component="span"
              className="material-symbols-outlined"
              aria-hidden="true"
              sx={{
                fontSize: 'var(--md-sys-icon-size-xs)',
                color:    'var(--md-sys-color-on-surface-variant)',
              }}
            >
              workspaces
            </Box>
            <Typography variant="labelSmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
              {group.summary}
            </Typography>
          </Stack>
          <Chip
            label={toggleLabel}
            size="small"
            variant="outlined"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            aria-label={`${toggleLabel} gruppo timeline`}
            sx={{
              borderColor: 'var(--md-sys-color-outline)',
              color:       'var(--md-sys-color-on-surface-variant)',
              height:      '20px',
              fontSize:    'var(--md-sys-typescale-label-small-size)',
              cursor:      'pointer',
            }}
          />
        </Stack>
      )}

      {/* Events */}
      {expanded && (
        <Stack gap="var(--md-sys-spacing-2)">
          {group.events.map((ev) => (
            <EventRow key={ev.id} event={ev} />
          ))}
        </Stack>
      )}
    </Box>
  );
};

// ─── Single event row ─────────────────────────────────────────────────────────

const CATEGORY_ICON: Record<string, string> = {
  normative: 'gavel',
  studenti:  'groups',
  documenti: 'description',
  sistema:   'settings_suggest',
};

interface EventRowProps {
  event: DecisionEvent;
}

const EventRow: React.FC<EventRowProps> = ({ event }) => {
  const time = new Date(event.timestamp).toLocaleTimeString('it-IT', {
    hour: '2-digit', minute: '2-digit',
  });
  const date = new Date(event.timestamp).toLocaleDateString('it-IT', {
    day: '2-digit', month: '2-digit',
  });

  return (
    <Box
      sx={{
        display:         'grid',
        gridTemplateColumns: '36px 1fr',
        gap:             'var(--md-sys-spacing-2)',
        alignItems:      'flex-start',
      }}
    >
      {/* Timeline dot + line */}
      <Stack alignItems="center" sx={{ pt: '2px' }}>
        <Box
          aria-hidden="true"
          sx={{
            width:           8,
            height:          8,
            borderRadius:    '50%',
            backgroundColor: event.isAnomaly
              ? 'var(--md-sys-color-error)'
              : event.result === 'executed'
                ? 'var(--md-sys-color-primary)'
                : event.result === 'blocked'
                  ? 'var(--md-sys-color-error)'
                  : 'var(--md-sys-color-tertiary)',
            flexShrink: 0,
            mt: '4px',
          }}
        />
      </Stack>

      {/* Content */}
      <Stack gap="var(--md-sys-spacing-1)">
        {/* Timestamp + category icon */}
        <Stack direction="row" alignItems="center" gap="var(--md-sys-spacing-1)">
          <Box
            component="span"
            className="material-symbols-outlined"
            aria-hidden="true"
            sx={{
              fontSize: 'var(--md-sys-icon-size-xs)',
              color:    'var(--md-sys-color-on-surface-variant)',
            }}
          >
            {CATEGORY_ICON[event.category] || 'radio_button_checked'}
          </Box>
          <Typography variant="labelSmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
            {date} {time}
          </Typography>
          {event.isAnomaly && (
            <Box
              component="span"
              className="material-symbols-outlined"
              aria-label="Anomalia rilevata"
              sx={{
                fontSize: 'var(--md-sys-icon-size-xs)',
                color:    'var(--md-sys-color-error)',
              }}
            >
              warning
            </Box>
          )}
        </Stack>

        {/* Action title */}
        <Typography
          variant="bodySmall"
          sx={{
            color:      'var(--md-sys-color-on-surface)',
            fontWeight: event.isAnomaly
              ? 'var(--md-sys-typescale-weight-semibold)'
              : 'var(--md-sys-typescale-weight-regular)',
          }}
        >
          {event.action}
        </Typography>

        {/* Chips */}
        <DecisionEventChip
          result={event.result}
          source={event.source}
          complianceImpact={event.complianceImpact}
          isAnomaly={event.isAnomaly}
        />
      </Stack>
    </Box>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

const DecisionTimeline: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<TimelineFilter>('all');
  const dmState = useSyncExternalStore(subscribe, getSnapshot);

  const timeline = useMemo(() => {
    const auditEntries = enterpriseAuditLog.getLast(50);
    const raw          = buildTimeline(dmState.signals, auditEntries);
    const filtered     = filterTimeline(raw, activeFilter);
    const withAnomalies = detectAnomalies(filtered);
    return clusterTimeline(withAnomalies);
  }, [dmState, activeFilter]);

  const handleFilter = useCallback((f: TimelineFilter) => setActiveFilter(f), []);

  const isEmpty = timeline.length === 0;

  return (
    <Stack gap="var(--md-sys-spacing-4)">

      {/* ── Header ── */}
      <Stack direction="row" alignItems="center" gap="var(--md-sys-spacing-2)">
        <Box
          component="span"
          className="material-symbols-outlined"
          aria-hidden="true"
          sx={{ fontSize: 'var(--md-sys-icon-size-md)', color: 'var(--md-sys-color-primary)' }}
        >
          timeline
        </Box>
        <Stack>
          <Typography variant="titleMedium" sx={{ color: 'var(--md-sys-color-on-surface)' }}>
            Timeline Decisionale
          </Typography>
          <Typography variant="bodySmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
            Storico azioni, eventi normativi e anomalie
          </Typography>
        </Stack>
      </Stack>

      {/* ── Filter chips ── */}
      <Stack
        direction="row"
        gap="var(--md-sys-spacing-2)"
        sx={{ flexWrap: 'wrap' }}
      >
        {FILTERS.map(({ label, value }) => (
          <Chip
            key={value}
            label={label}
            variant={activeFilter === value ? 'filled' : 'outlined'}
            size="small"
            onClick={() => handleFilter(value)}
            aria-pressed={activeFilter === value}
            aria-label={`Filtra timeline: ${label}`}
            sx={{
              backgroundColor: activeFilter === value
                ? 'var(--md-sys-color-primary)'
                : 'transparent',
              color: activeFilter === value
                ? 'var(--md-sys-color-on-primary)'
                : 'var(--md-sys-color-on-surface-variant)',
              borderColor: 'var(--md-sys-color-outline)',
              cursor: 'pointer',
              '&:hover': {
                backgroundColor: activeFilter === value
                  ? 'var(--md-sys-color-primary)'
                  : 'var(--md-sys-color-surface-container-high)',
              },
            }}
          />
        ))}
      </Stack>

      <Divider sx={{ borderColor: 'var(--md-sys-color-outline-variant)' }} />

      {/* ── Timeline content ── */}
      {isEmpty ? (
        <Stack alignItems="center" sx={{ py: 'var(--md-sys-spacing-6)' }} gap="var(--md-sys-spacing-2)">
          <Box
            component="span"
            className="material-symbols-outlined"
            aria-hidden="true"
            sx={{ fontSize: 'var(--md-sys-icon-size-xl)', color: 'var(--md-sys-color-on-surface-variant)', opacity: 0.4 }}
          >
            timeline
          </Box>
          <Typography variant="bodySmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
            Nessun evento registrato{activeFilter !== 'all' ? ` per "${FILTERS.find(f => f.value === activeFilter)?.label}"` : ''}.
          </Typography>
        </Stack>
      ) : (
        <Box
          sx={{
            maxHeight: '480px',
            overflowY: 'auto',
            overflowX: 'hidden',
            pr: 'var(--md-sys-spacing-1)',
            '&::-webkit-scrollbar': { width: 4 },
            '&::-webkit-scrollbar-track': { background: 'transparent' },
            '&::-webkit-scrollbar-thumb': {
              background:   'var(--md-sys-color-outline-variant)',
              borderRadius: '2px',
            },
          }}
        >
          <Stack
            gap="var(--md-sys-spacing-3)"
            sx={{ position: 'relative' }}
          >
            {/* Vertical line behind dots */}
            <Box
              aria-hidden="true"
              sx={{
                position:    'absolute',
                left:        '17px',
                top:         0,
                bottom:      0,
                width:       '1px',
                background:  'var(--md-sys-color-outline-variant)',
                pointerEvents: 'none',
              }}
            />

            {timeline.map((group, i) => (
              <GroupRow key={group.windowStart + i} group={group} />
            ))}
          </Stack>
        </Box>
      )}
    </Stack>
  );
};

export default DecisionTimeline;
