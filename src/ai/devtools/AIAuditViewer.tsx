/**
 * AIAuditViewer.tsx — Audit trail table with IDB + in-memory sources (Sprint 2)
 *
 * Merges in-memory records from `getAuditHistory()` with persisted IDB
 * records from `getAllPersistedAudits()`.  Deduplicates by audit `id`.
 *
 * Columns: runId (truncated), timestamp, duration, steps, cacheHit
 * Expandable row: per-step breakdown table.
 * Export button: triggers JSON Blob download via `exportAuditJSON()`.
 * Clear button: wipes IDB store + in-memory buffer.
 *
 * MD3 compliant — MUI v7 only.
 */
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';

import { getAuditHistory, clearAuditHistory } from '../audit/auditTrail';
import { getAllPersistedAudits, clearPersistedAudits, exportAuditJSON } from '../audit/auditDb';
import type { AIAuditTrail, AuditStep } from '../audit/auditTypes';

// ── constants ─────────────────────────────────────────────────────────────────

const MAX_ROWS = 50;

// ── helpers ───────────────────────────────────────────────────────────────────

function mergeAndDedupe(
  memory: readonly AIAuditTrail[],
  persisted: AIAuditTrail[],
): AIAuditTrail[] {
  const map = new Map<string, AIAuditTrail>();
  for (const t of [...memory, ...persisted]) map.set(t.id, t);
  return [...map.values()]
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
    .slice(0, MAX_ROWS);
}

function shortId(id: string): string {
  return id.length > 12 ? `${id.slice(0, 8)}…` : id;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('it-IT', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

// ── step detail table ─────────────────────────────────────────────────────────

interface StepTableProps {
  steps: AuditStep[];
}

const StepTable: React.FC<StepTableProps> = memo(({ steps }) => (
  <Box sx={{ py: 1, px: 2, bgcolor: 'var(--md-sys-color-surface-container-lowest)' }}>
    <Table size="small" aria-label="Step dettaglio">
      <TableHead>
        <TableRow>
          {['Modulo', 'Durata', 'Input', 'Output'].map((h) => (
            <TableCell key={h} sx={{ py: 0.5, color: 'var(--md-sys-color-on-surface-variant)', fontSize: 11 }}>
              {h}
            </TableCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {steps.map((s, i) => (
          <TableRow key={i} sx={{ '&:last-child td': { borderBottom: 0 } }}>
            <TableCell sx={{ py: 0.5, fontSize: 12 }}>{s.name}</TableCell>
            <TableCell sx={{ py: 0.5, fontSize: 12, fontVariantNumeric: 'tabular-nums' }}>
              {s.durationMs} ms
            </TableCell>
            <TableCell sx={{ py: 0.5, fontSize: 12, color: 'var(--md-sys-color-on-surface-variant)', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {s.inputSummary ?? '—'}
            </TableCell>
            <TableCell sx={{ py: 0.5, fontSize: 12, color: 'var(--md-sys-color-on-surface-variant)', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {s.outputSummary ?? '—'}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </Box>
));
StepTable.displayName = 'StepTable';

// ── expandable row ────────────────────────────────────────────────────────────

interface AuditRowProps {
  trail: AIAuditTrail;
}

const AuditRow: React.FC<AuditRowProps> = memo(({ trail }) => {
  const [open, setOpen] = useState(false);
  const hasSteps = trail.steps.length > 0;

  return (
    <>
      <TableRow sx={{ '& > *': { borderBottom: open ? 0 : undefined } }}>
        {/* Expand toggle */}
        <TableCell sx={{ py: 0.5, width: 36 }}>
          {hasSteps ? (
            <IconButton
              size="small"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? `Chiudi dettagli run ${trail.id}` : `Apri dettagli run ${trail.id}`}
              aria-expanded={open}
            >
              {open ? (
                <KeyboardArrowUpIcon fontSize="small" />
              ) : (
                <KeyboardArrowDownIcon fontSize="small" />
              )}
            </IconButton>
          ) : null}
        </TableCell>
        {/* Run ID */}
        <TableCell sx={{ py: 0.5, fontSize: 12, fontVariantNumeric: 'tabular-nums' }}>
          <code title={trail.id}>{shortId(trail.id)}</code>
        </TableCell>
        {/* Timestamp */}
        <TableCell sx={{ py: 0.5, fontSize: 12, whiteSpace: 'nowrap' }}>
          {formatTime(trail.startedAt)}
        </TableCell>
        {/* Duration */}
        <TableCell sx={{ py: 0.5, fontSize: 12, fontVariantNumeric: 'tabular-nums' }}>
          {trail.totalMs} ms
        </TableCell>
        {/* Steps */}
        <TableCell sx={{ py: 0.5, fontSize: 12 }}>
          {trail.cacheHit ? (
            <Chip size="small" label="cache" color="default" aria-label="Servito da cache" />
          ) : (
            trail.steps.length
          )}
        </TableCell>
        {/* Error indicator */}
        <TableCell sx={{ py: 0.5, width: 20 }}>
          {trail.totalMs > 500 && (
            <Chip size="small" label="lento" color="warning" aria-label="Run lento (>500ms)" />
          )}
        </TableCell>
      </TableRow>

      {/* Expandable detail */}
      {hasSteps && (
        <TableRow>
          <TableCell colSpan={6} sx={{ py: 0, px: 0, border: open ? undefined : 0 }}>
            <Collapse in={open} timeout="auto" unmountOnExit>
              <StepTable steps={trail.steps} />
            </Collapse>
          </TableCell>
        </TableRow>
      )}
    </>
  );
});
AuditRow.displayName = 'AuditRow';

// ── main component ────────────────────────────────────────────────────────────

/**
 * AIAuditViewer — shows latest 50 AI runs merged from memory + IndexedDB.
 *
 * Fetches IDB data once on mount; refresh button re-fetches.
 */
const AIAuditViewer: React.FC = memo(() => {
  const [loading, setLoading] = useState(true);
  const [persisted, setPersisted] = useState<AIAuditTrail[]>([]);
  const [memorySnapshot, setMemorySnapshot] = useState<readonly AIAuditTrail[]>(() =>
    getAuditHistory(),
  );

  const fetchPersisted = useCallback(async () => {
    setLoading(true);
    const records = await getAllPersistedAudits(MAX_ROWS);
    setPersisted(records);
    setMemorySnapshot(getAuditHistory());
    setLoading(false);
  }, []);

  useEffect(() => {
    void fetchPersisted();
  }, [fetchPersisted]);

  const rows = useMemo(
    () => mergeAndDedupe(memorySnapshot, persisted),
    [memorySnapshot, persisted],
  );

  const handleExport = useCallback(async () => {
    const blob = await exportAuditJSON();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-audit-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const handleClear = useCallback(async () => {
    clearAuditHistory();
    await clearPersistedAudits();
    setPersisted([]);
    setMemorySnapshot([]);
  }, []);

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }} flexWrap="wrap" gap={1}>
        <Typography variant="titleSmall" sx={{ color: 'var(--md-sys-color-on-surface)' }}>
          Audit Trail ({rows.length})
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button
            size="small"
            variant="text"
            onClick={() => void fetchPersisted()}
            aria-label="Aggiorna audit trail"
            sx={{ color: 'var(--md-sys-color-primary)' }}
          >
            Aggiorna
          </Button>
          <Button
            size="small"
            variant="text"
            onClick={() => void handleExport()}
            startIcon={<DownloadIcon fontSize="small" aria-hidden />}
            aria-label="Esporta audit trail in JSON"
            sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}
          >
            Esporta
          </Button>
          <Button
            size="small"
            variant="text"
            onClick={() => void handleClear()}
            startIcon={<DeleteSweepIcon fontSize="small" aria-hidden />}
            aria-label="Cancella tutto l'audit trail"
            sx={{ color: 'var(--md-sys-color-error)' }}
          >
            Cancella
          </Button>
        </Stack>
      </Stack>

      {loading && (
        <Stack alignItems="center" py={3}>
          <CircularProgress size={28} aria-label="Caricamento audit trail" />
        </Stack>
      )}

      {!loading && rows.length === 0 && (
        <Alert severity="info">
          Nessun run registrato ancora — esegui un'analisi AI per popolare il log.
        </Alert>
      )}

      {!loading && rows.length > 0 && (
        <Box sx={{ overflowX: 'auto' }}>
          <Table size="small" aria-label="Audit trail AI">
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 36, py: 0.5 }} />
                {['Run ID', 'Orario', 'Durata', 'Step', ''].map((h) => (
                  <TableCell
                    key={h}
                    sx={{ py: 0.5, color: 'var(--md-sys-color-on-surface-variant)', fontSize: 11 }}
                  >
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((trail) => (
                <AuditRow key={trail.id} trail={trail} />
              ))}
            </TableBody>
          </Table>
        </Box>
      )}
    </Box>
  );
});

AIAuditViewer.displayName = 'AIAuditViewer';
export default AIAuditViewer;
