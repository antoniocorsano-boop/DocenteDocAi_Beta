/**
 * AuditTrailPanel.tsx — C15: Audit trail navigabile con filtri e cronologia.
 *
 * Legge i run salvati in auditTrailStore (persist key: docente-doc-audit-trail)
 * e li mostra in ordine cronologico inverso con:
 *   - filtro per complianceStatus (CONFORME / PARZIALMENTE_CONFORME / NON_CONFORME)
 *   - chip colorati score, status, certificationReadiness
 *   - count blocchi
 *   - pulsante "Cancella cronologia" (con confirm)
 */

import React, { useState } from 'react';
import Box          from '@mui/material/Box';
import Button       from '@mui/material/Button';
import Chip         from '@mui/material/Chip';
import Divider      from '@mui/material/Divider';
import MenuItem     from '@mui/material/MenuItem';
import Select       from '@mui/material/Select';
import Stack        from '@mui/material/Stack';
import Table        from '@mui/material/Table';
import TableBody    from '@mui/material/TableBody';
import TableCell    from '@mui/material/TableCell';
import TableHead    from '@mui/material/TableHead';
import TableRow     from '@mui/material/TableRow';
import Typography   from '@mui/material/Typography';
import M3Surface    from '../ui/M3Surface';
import { useAuditTrailStore } from '../../self-compliance/runtime/audit/auditTrailStore';
import type { AuditRun, ComplianceStatusPA, CertificationReadiness } from '../../self-compliance/runtime/audit/types';

// ─── helpers ──────────────────────────────────────────────────────────────────

function statusColor(s: ComplianceStatusPA): string {
  if (s === 'CONFORME')               return 'var(--md-sys-color-tertiary-container)';
  if (s === 'PARZIALMENTE_CONFORME')  return 'var(--md-sys-color-secondary-container)';
  return 'var(--md-sys-color-error-container)';
}

function statusTextColor(s: ComplianceStatusPA): string {
  if (s === 'CONFORME')               return 'var(--md-sys-color-on-tertiary-container)';
  if (s === 'PARZIALMENTE_CONFORME')  return 'var(--md-sys-color-on-secondary-container)';
  return 'var(--md-sys-color-on-error-container)';
}

function readinessColor(r: CertificationReadiness): string {
  if (r === 'PRONTO')       return 'var(--md-sys-color-tertiary-container)';
  if (r === 'CONDIZIONATO') return 'var(--md-sys-color-secondary-container)';
  return 'var(--md-sys-color-error-container)';
}

function readinessTextColor(r: CertificationReadiness): string {
  if (r === 'PRONTO')       return 'var(--md-sys-color-on-tertiary-container)';
  if (r === 'CONDIZIONATO') return 'var(--md-sys-color-on-secondary-container)';
  return 'var(--md-sys-color-on-error-container)';
}

function scoreColor(score: number): string {
  if (score >= 80) return 'var(--md-sys-color-tertiary-container)';
  if (score >= 60) return 'var(--md-sys-color-secondary-container)';
  return 'var(--md-sys-color-error-container)';
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('it-IT', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

const STATUS_LABELS: Record<ComplianceStatusPA, string> = {
  CONFORME:               'Conforme',
  PARZIALMENTE_CONFORME:  'Parziale',
  NON_CONFORME:           'Non conforme',
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function AuditTrailPanel(): React.JSX.Element {
  const runs         = useAuditTrailStore(s => s.runs);
  const clearHistory = useAuditTrailStore(s => s.clearHistory);

  const [filterStatus, setFilterStatus] = useState<ComplianceStatusPA | 'ALL'>('ALL');
  const [confirmClear, setConfirmClear]  = useState(false);

  const displayed: AuditRun[] = filterStatus === 'ALL'
    ? runs
    : runs.filter((r) => r.complianceStatus === filterStatus);

  const handleClear = () => {
    if (confirmClear) {
      clearHistory();
      setConfirmClear(false);
    } else {
      setConfirmClear(true);
    }
  };

  return (
    <Stack gap="var(--md-sys-spacing-4)">
      {/* ── Header ── */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap="var(--md-sys-spacing-2)">
        <Stack gap="var(--md-sys-spacing-1)">
          <Typography variant="titleLarge">Audit Trail PA</Typography>
          <Typography variant="bodySmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
            {runs.length} run registrati — ultimi 50 conservati
          </Typography>
        </Stack>

        <Stack direction="row" gap="var(--md-sys-spacing-2)" alignItems="center">
          {/* Filtro status */}
          <Select
            size="small"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as ComplianceStatusPA | 'ALL')}
            aria-label="Filtra per stato compliance"
            sx={{ minWidth: 180, fontSize: 'var(--md-sys-typescale-body-medium-font-size)' }}
          >
            <MenuItem value="ALL">Tutti gli stati</MenuItem>
            <MenuItem value="CONFORME">Conforme</MenuItem>
            <MenuItem value="PARZIALMENTE_CONFORME">Parzialmente conforme</MenuItem>
            <MenuItem value="NON_CONFORME">Non conforme</MenuItem>
          </Select>

          {/* Cancella */}
          {runs.length > 0 && (
            <Button
              variant={confirmClear ? 'contained' : 'outlined'}
              size="small"
              color={confirmClear ? 'error' : 'inherit'}
              onClick={handleClear}
              aria-label="Cancella cronologia audit trail"
            >
              {confirmClear ? 'Conferma cancellazione' : 'Cancella cronologia'}
            </Button>
          )}
        </Stack>
      </Stack>

      {/* ── Empty state ── */}
      {runs.length === 0 && (
        <M3Surface
          elevation={0}
          sx={{
            borderRadius: 'var(--md-sys-shape-corner-medium)',
            p: 'var(--md-sys-spacing-6)',
            bgcolor: 'var(--md-sys-color-surface-variant)',
            textAlign: 'center',
          }}
        >
          <Typography variant="bodyMedium" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
            Nessun run registrato — esegui un audit dal pannello Governance per popolare il trail.
          </Typography>
        </M3Surface>
      )}

      {/* ── Filtered empty ── */}
      {runs.length > 0 && displayed.length === 0 && (
        <M3Surface
          elevation={0}
          sx={{
            borderRadius: 'var(--md-sys-shape-corner-medium)',
            p: 'var(--md-sys-spacing-4)',
            bgcolor: 'var(--md-sys-color-surface-variant)',
          }}
        >
          <Typography variant="bodyMedium" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
            Nessun run corrisponde al filtro selezionato.
          </Typography>
        </M3Surface>
      )}

      {/* ── Table ── */}
      {displayed.length > 0 && (
        <M3Surface
          elevation={0}
          sx={{
            borderRadius: 'var(--md-sys-shape-corner-medium)',
            overflow: 'hidden',
            border: '1px solid var(--md-sys-color-outline-variant)',
          }}
        >
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small" aria-label="Audit trail run">
              <TableHead>
                <TableRow sx={{ bgcolor: 'var(--md-sys-color-surface-variant)' }}>
                  <TableCell><Typography variant="labelSmall">Data / Ora</Typography></TableCell>
                  <TableCell><Typography variant="labelSmall">Scenario</Typography></TableCell>
                  <TableCell align="center"><Typography variant="labelSmall">Score</Typography></TableCell>
                  <TableCell align="center"><Typography variant="labelSmall">Stato</Typography></TableCell>
                  <TableCell align="center"><Typography variant="labelSmall">Readiness</Typography></TableCell>
                  <TableCell align="center"><Typography variant="labelSmall">Bloccanti</Typography></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {displayed.map((run) => (
                  <TableRow
                    key={run.id}
                    hover
                    sx={{
                      '&:last-child td': { borderBottom: 0 },
                      opacity: run.complianceStatus === 'NON_CONFORME' ? 0.92 : 1,
                    }}
                  >
                    <TableCell>
                      <Typography variant="bodySmall" sx={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                        {formatDate(run.runAt)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="bodySmall">{run.scenarioLabel}</Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={`${Math.round(run.score)}%`}
                        size="small"
                        sx={{
                          bgcolor: scoreColor(run.score),
                          color: 'var(--md-sys-color-on-surface)',
                          fontWeight: 'var(--md-sys-typescale-weight-semibold)',
                          minWidth: 52,
                        }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={STATUS_LABELS[run.complianceStatus]}
                        size="small"
                        sx={{
                          bgcolor: statusColor(run.complianceStatus),
                          color:   statusTextColor(run.complianceStatus),
                          fontWeight: 'var(--md-sys-typescale-weight-medium)',
                          whiteSpace: 'nowrap',
                        }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={run.certificationReadiness}
                        size="small"
                        sx={{
                          bgcolor: readinessColor(run.certificationReadiness),
                          color:   readinessTextColor(run.certificationReadiness),
                          fontSize: 'var(--md-sys-typescale-label-small-font-size)',
                          whiteSpace: 'nowrap',
                        }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      {run.blockingCount > 0 ? (
                        <Chip
                          label={run.blockingCount}
                          size="small"
                          sx={{
                            bgcolor: 'var(--md-sys-color-error-container)',
                            color:   'var(--md-sys-color-on-error-container)',
                            fontWeight: 'var(--md-sys-typescale-weight-bold)',
                            minWidth: 32,
                          }}
                        />
                      ) : (
                        <Typography variant="bodySmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>—</Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </M3Surface>
      )}

      <Divider />
      <Typography variant="bodySmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
        Gli ultimi 50 run sono conservati in localStorage (persist key: <code>docente-doc-audit-trail</code>).
        Obbligatorio per AI Act Art. 12 (registrazione delle decisioni automatizzate).
      </Typography>
    </Stack>
  );
}
