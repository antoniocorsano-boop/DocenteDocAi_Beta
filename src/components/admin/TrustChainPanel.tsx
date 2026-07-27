/**
 * TrustChainPanel.tsx
 *
 * Pannello admin per visualizzare e verificare la catena trust di un tenant.
 *
 * Features:
 *   - Lista record trust (eventType, timestamp, hash breve, attore)
 *   - Verifica integrità catena (pulsante "Verifica")
 *   - Badge stato verifica (valida / corrotta / non verificata)
 *   - Export TXT hash chain per audit esterno
 *
 * MD3 compliant.
 */

import React, { useCallback, useState } from 'react';
import {
  Box, Button, Chip, CircularProgress, Divider,
  Stack, Table, TableBody, TableCell, TableHead, TableRow,
  Alert, Typography,
} from '@mui/material';
import VerifiedUserOutlinedIcon  from '@mui/icons-material/VerifiedUserOutlined';
import LockOutlinedIcon          from '@mui/icons-material/LockOutlined';
import WarningAmberOutlinedIcon  from '@mui/icons-material/WarningAmberOutlined';
import DownloadOutlinedIcon      from '@mui/icons-material/DownloadOutlined';

import M3Surface from '../../components/ui/M3Surface';
// M3Typography variant names (titleLarge, bodySmall…) are theme-augmented in muiTheme.ts
const M3Typography = Typography;

import { useTrustStore }       from '../../modules/trustLayer/trustStore';
import { verifyChain }         from '../../modules/trustLayer/trustService';
import type { ChainVerificationResult } from '../../modules/trustLayer/types';

// ─── Props ────────────────────────────────────────────────────────────────────

interface TrustChainPanelProps {
  tenantId: string;
  isAdmin:  boolean;
}

// ─── Event type chip ──────────────────────────────────────────────────────────

function EventChip({ eventType }: { eventType: string }) {
  const color =
    eventType.includes('CREATED') || eventType.includes('GENERATED') ? 'success' :
    eventType.includes('DELETED') || eventType.includes('DELETION')  ? 'error'   :
    eventType.includes('SIGNED')  || eventType.includes('CONSENT')    ? 'primary' :
    eventType.includes('AI')                                           ? 'info'    :
    'default';
  return <Chip label={eventType.replace(/_/g, ' ')} color={color as never} size="small" />;
}

// ─── Main component ───────────────────────────────────────────────────────────

export function TrustChainPanel({ tenantId, isAdmin }: TrustChainPanelProps): React.JSX.Element {
  const records       = useTrustStore(s =>
    [...s.records.filter(r => r.tenantId === tenantId)]
      .sort((a, b) => b.timestamp - a.timestamp),
  );

  const [verifyResult, setVerifyResult] = useState<ChainVerificationResult | null>(null);
  const [verifying,    setVerifying]    = useState(false);

  const handleVerify = useCallback(async () => {
    setVerifying(true);
    try {
      const result = await verifyChain(tenantId);
      setVerifyResult(result);
    } finally {
      setVerifying(false);
    }
  }, [tenantId]);

  const handleExport = useCallback(() => {
    const lines = [
      `Trust Chain Export — Tenant: ${tenantId}`,
      `Esportato: ${new Date().toISOString()}`,
      `Totale record: ${records.length}`,
      '───────────────────────────────────────────────────────────────',
      ...records.map(r => [
        `ID       : ${r.id}`,
        `Evento   : ${r.eventType}`,
        `Attore   : ${r.actorId}`,
        `Data     : ${new Date(r.timestamp).toLocaleString('it-IT')}`,
        `Hash     : ${r.hash}`,
        `PrevHash : ${r.prevHash || '(primo record)'}`,
        '─────────────────────────────────────────────────────',
      ].join('\n')),
    ].join('\n');

    const blob = new Blob([lines], { type: 'text/plain;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `trust-chain-${tenantId}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [records, tenantId]);

  if (!isAdmin) {
    return (
      <M3Surface elevation={0} sx={{ p: 3, borderRadius: 3 }} aria-label="Trust Chain Panel — accesso negato">
        <Stack direction="row" spacing={1} alignItems="center">
          <LockOutlinedIcon color="disabled" aria-hidden />
          <M3Typography variant="bodyMedium" sx={{ color: 'text.secondary' }}>
            Sezione riservata agli amministratori.
          </M3Typography>
        </Stack>
      </M3Surface>
    );
  }

  return (
    <M3Surface
      elevation={0}
      sx={{ p: 3, borderRadius: 3, bgcolor: 'background.paper' }}
      aria-label="Trust Chain Panel"
    >
      {/* ── Header ── */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            <VerifiedUserOutlinedIcon color="primary" aria-hidden />
            <M3Typography variant="titleLarge">Trust Chain</M3Typography>
          </Stack>
          <M3Typography variant="bodySmall" sx={{ color: 'text.secondary' }}>
            {records.length} record &nbsp;|&nbsp; Tenant: {tenantId}
          </M3Typography>
        </Stack>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<DownloadOutlinedIcon aria-hidden />}
            onClick={handleExport}
            disabled={records.length === 0}
            aria-label="Esporta catena trust come file TXT"
          >
            Esporta
          </Button>
          <Button
            variant="contained"
            size="small"
            startIcon={verifying ? <CircularProgress size={14} aria-hidden /> : <VerifiedUserOutlinedIcon aria-hidden />}
            onClick={() => void handleVerify()}
            disabled={verifying || records.length === 0}
            aria-label="Verifica integrità catena trust"
          >
            {verifying ? 'Verifica…' : 'Verifica catena'}
          </Button>
        </Stack>
      </Stack>

      {/* ── Risultato verifica ── */}
      {verifyResult && (
        <Alert
          severity={verifyResult.valid ? 'success' : 'error'}
          icon={verifyResult.valid
            ? <VerifiedUserOutlinedIcon aria-hidden />
            : <WarningAmberOutlinedIcon aria-hidden />}
          sx={{ mb: 2 }}
          aria-live="assertive"
        >
          {verifyResult.valid
            ? `Catena integra — ${verifyResult.totalRecords} record verificati.`
            : `Catena corrotta! Primo record anomalo: ${verifyResult.firstBroken}`}
        </Alert>
      )}

      <Divider sx={{ mb: 2 }} />

      {/* ── Tabella record ── */}
      {records.length === 0 ? (
        <Alert severity="info">Nessun record trust per questo tenant.</Alert>
      ) : (
        <Box sx={{ overflowX: 'auto' }}>
          <Table size="small" aria-label="Tabella record Trust Chain">
            <TableHead>
              <TableRow>
                <TableCell><M3Typography variant="labelSmall">Evento</M3Typography></TableCell>
                <TableCell><M3Typography variant="labelSmall">Data</M3Typography></TableCell>
                <TableCell><M3Typography variant="labelSmall">Attore</M3Typography></TableCell>
                <TableCell><M3Typography variant="labelSmall">Hash (breve)</M3Typography></TableCell>
                <TableCell><M3Typography variant="labelSmall">Prev-Hash</M3Typography></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {records.map(r => (
                <TableRow key={r.id} hover>
                  <TableCell>
                    <EventChip eventType={r.eventType} />
                  </TableCell>
                  <TableCell>
                    <M3Typography variant="bodySmall">
                      {new Date(r.timestamp).toLocaleString('it-IT')}
                    </M3Typography>
                  </TableCell>
                  <TableCell>
                    <M3Typography variant="bodySmall">{r.actorId}</M3Typography>
                  </TableCell>
                  <TableCell>
                    <M3Typography
                      variant="bodySmall"
                      sx={{ fontFamily: 'monospace', fontSize: 'var(--md-sys-typescale-body-small-font-size)' }}
                    >
                      {r.hash.slice(0, 20)}…
                    </M3Typography>
                  </TableCell>
                  <TableCell>
                    <M3Typography
                      variant="bodySmall"
                      sx={{ fontFamily: 'monospace', fontSize: 'var(--md-sys-typescale-body-small-font-size)', color: 'text.secondary' }}
                    >
                      {r.prevHash ? r.prevHash.slice(0, 16) + '…' : '(primo)'}
                    </M3Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      )}
    </M3Surface>
  );
}
