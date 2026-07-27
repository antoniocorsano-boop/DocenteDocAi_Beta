/**
 * DPIAViewerPanel.tsx — C9: UI per la visualizzazione e l'export della DPIA.
 *
 * Usa il `generateDPIA()` già esistente in src/self-compliance/certification/
 * per produrre il draft DPIA (GDPR Art. 35) e lo presenta in forma navigabile:
 *   - Sintesi (necessità, proporzionalità, conclusione)
 *   - Categorie di dati trattati
 *   - Tabella rischi (likelihood / impact / residual / mitigation / status)
 *   - Export JSON
 *   - Action items per i rischi con status "planned"
 *
 * MD3 Gold Compliant: M3Surface, token MD3, aria-label completi.
 */

import React, { useMemo } from 'react';
import Box      from '@mui/material/Box';
import Button   from '@mui/material/Button';
import Chip     from '@mui/material/Chip';
import Divider  from '@mui/material/Divider';
import Stack    from '@mui/material/Stack';
import Table    from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow  from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import M3Surface  from '../ui/M3Surface';
import { generateDPIA } from '../../self-compliance/certification/dpiaGenerator';
import type { DPIARisk } from '../../self-compliance/certification/types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const LEVEL_COLOR: Record<'low' | 'medium' | 'high', string> = {
  low:    'var(--md-sys-color-primary)',
  medium: 'var(--md-sys-color-tertiary)',
  high:   'var(--md-sys-color-error)',
};

const STATUS_LABEL: Record<DPIARisk['status'], string> = {
  implemented: 'Implementato',
  planned:     'Pianificato',
  missing:     'Mancante',
};

const STATUS_COLOR: Record<DPIARisk['status'], string> = {
  implemented: 'var(--md-sys-color-primary-container)',
  planned:     'var(--md-sys-color-tertiary-container)',
  missing:     'var(--md-sys-color-error-container)',
};

function LevelChip({ level }: { level: 'low' | 'medium' | 'high' }) {
  const labels = { low: 'Basso', medium: 'Medio', high: 'Alto' };
  return (
    <Chip
      label={labels[level]}
      size="small"
      sx={{
        bgcolor: 'transparent',
        border:  `1px solid ${LEVEL_COLOR[level]}`,
        color:   LEVEL_COLOR[level],
        fontSize: 'var(--md-sys-typescale-label-small-font-size)',
      }}
    />
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

const DPIAViewerPanel: React.FC = () => {
  const dpia = useMemo(() => generateDPIA(), []);

  const openRisks        = dpia.risks.filter((r) => r.status !== 'implemented');
  const isApproved       = dpia.approvalStatus === 'approved';

  const handleExport = () => {
    const json = JSON.stringify(dpia, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `dpia-docentedoc-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Stack gap="var(--md-sys-spacing-4)">

      {/* ── Header ── */}
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap="var(--md-sys-spacing-2)">
        <Stack gap="var(--md-sys-spacing-1)">
          <Stack direction="row" alignItems="center" gap="var(--md-sys-spacing-2)">
            <Chip
              label={isApproved ? 'Approvata' : dpia.approvalStatus === 'draft' ? 'Draft' : 'In attesa approvazione'}
              size="small"
              sx={{
                bgcolor: isApproved
                  ? 'var(--md-sys-color-primary-container)'
                  : 'var(--md-sys-color-tertiary-container)',
                color: isApproved
                  ? 'var(--md-sys-color-on-primary-container)'
                  : 'var(--md-sys-color-on-tertiary-container)',
              }}
            />
            <Chip
              label={`${openRisks.length} rischi aperti`}
              size="small"
              sx={{
                bgcolor: openRisks.length === 0
                  ? 'var(--md-sys-color-primary-container)'
                  : 'var(--md-sys-color-error-container)',
                color: openRisks.length === 0
                  ? 'var(--md-sys-color-on-primary-container)'
                  : 'var(--md-sys-color-on-error-container)',
              }}
            />
          </Stack>
          <Typography variant="bodySmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
            GDPR Art. 35 · {dpia.dataCategories.length} categorie di dati · {dpia.risks.length} rischi identificati
          </Typography>
        </Stack>
        <Button
          variant="outlined"
          size="small"
          onClick={handleExport}
          aria-label="Esporta DPIA come file JSON"
          sx={{ textTransform: 'none', borderRadius: 'var(--md-sys-shape-corner-full)' }}
          startIcon={
            <Box component="span" className="material-symbols-outlined" aria-hidden="true"
              sx={{ fontSize: 'var(--md-sys-icon-size-xs)' }}>download</Box>
          }
        >
          Esporta DPIA
        </Button>
      </Stack>

      {/* ── Test di necessità e proporzionalità ── */}
      <M3Surface
        elevation={0}
        sx={{
          borderRadius: 'var(--md-sys-shape-corner-medium)',
          p: 'var(--md-sys-spacing-3)',
          bgcolor: 'var(--md-sys-color-surface-variant)',
        }}
      >
        <Stack gap="var(--md-sys-spacing-2)">
          <Typography variant="labelMedium">Valutazione necessità e proporzionalità</Typography>
          <Stack gap="var(--md-sys-spacing-1)">
            <Typography variant="labelSmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
              Necessità
            </Typography>
            <Typography variant="bodySmall">{dpia.necessityTest}</Typography>
          </Stack>
          <Stack gap="var(--md-sys-spacing-1)">
            <Typography variant="labelSmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
              Proporzionalità
            </Typography>
            <Typography variant="bodySmall">{dpia.proportionalityTest}</Typography>
          </Stack>
          <Stack direction="row" gap="var(--md-sys-spacing-1)" alignItems="center">
            <Typography variant="labelSmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
              Conclusione:
            </Typography>
            <Chip
              label={dpia.conclusion === 'required' ? 'DPIA obbligatoria' : 'DPIA non obbligatoria'}
              size="small"
              sx={{ bgcolor: 'var(--md-sys-color-primary-container)', color: 'var(--md-sys-color-on-primary-container)' }}
            />
          </Stack>
        </Stack>
      </M3Surface>

      {/* ── Categorie di dati ── */}
      <M3Surface
        elevation={0}
        sx={{
          borderRadius: 'var(--md-sys-shape-corner-medium)',
          p: 'var(--md-sys-spacing-3)',
          bgcolor: 'var(--md-sys-color-surface-variant)',
        }}
      >
        <Stack gap="var(--md-sys-spacing-2)">
          <Typography variant="labelMedium">
            Categorie di dati trattati ({dpia.dataCategories.length})
          </Typography>
          {dpia.dataCategories.map((cat) => (
            <Stack key={cat.name} direction="row" gap="var(--md-sys-spacing-2)" alignItems="flex-start" flexWrap="wrap">
              <Box sx={{ flexGrow: 1, minWidth: 120 }}>
                <Typography variant="bodySmall">{cat.name}</Typography>
                <Typography variant="bodySmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                  Soggetti: {cat.subjects.join(', ')} · Conservazione: {cat.retentionDays}gg
                </Typography>
              </Box>
              <Typography
                variant="bodySmall"
                sx={{ color: 'var(--md-sys-color-on-surface-variant)', maxWidth: 320 }}
              >
                {cat.legalBasis}
              </Typography>
            </Stack>
          ))}
        </Stack>
      </M3Surface>

      <Divider />

      {/* ── Tabella rischi ── */}
      <Stack gap="var(--md-sys-spacing-2)">
        <Typography variant="labelMedium">Analisi dei rischi</Typography>
        <Box sx={{ overflowX: 'auto' }}>
          <Table size="small" aria-label="Tabella rischi DPIA">
            <TableHead>
              <TableRow>
                <TableCell><Typography variant="labelSmall">Minaccia</Typography></TableCell>
                <TableCell><Typography variant="labelSmall">Probabilità</Typography></TableCell>
                <TableCell><Typography variant="labelSmall">Impatto</Typography></TableCell>
                <TableCell><Typography variant="labelSmall">Rischio residuo</Typography></TableCell>
                <TableCell><Typography variant="labelSmall">Stato</Typography></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {dpia.risks.map((risk) => (
                <TableRow key={risk.id}>
                  <TableCell>
                    <Typography variant="bodySmall">{risk.threat}</Typography>
                    <Typography variant="bodySmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)', mt: '2px' }}>
                      {risk.mitigation}
                    </Typography>
                  </TableCell>
                  <TableCell><LevelChip level={risk.likelihood} /></TableCell>
                  <TableCell><LevelChip level={risk.impact} /></TableCell>
                  <TableCell><LevelChip level={risk.residualRisk} /></TableCell>
                  <TableCell>
                    <Chip
                      label={STATUS_LABEL[risk.status]}
                      size="small"
                      sx={{
                        bgcolor: STATUS_COLOR[risk.status],
                        fontSize: 'var(--md-sys-typescale-label-small-font-size)',
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      </Stack>

      {/* ── Action items rischi aperti ── */}
      {openRisks.length > 0 && (
        <M3Surface
          elevation={0}
          sx={{
            borderRadius: 'var(--md-sys-shape-corner-medium)',
            p: 'var(--md-sys-spacing-3)',
            bgcolor: 'var(--md-sys-color-error-container)',
          }}
        >
          <Stack gap="var(--md-sys-spacing-2)">
            <Typography variant="labelMedium" sx={{ color: 'var(--md-sys-color-on-error-container)' }}>
              Action items ({openRisks.length} rischi non ancora implementati)
            </Typography>
            {openRisks.map((r) => (
              <Stack key={r.id} direction="row" gap="var(--md-sys-spacing-2)" alignItems="flex-start">
                <Chip
                  label={STATUS_LABEL[r.status]}
                  size="small"
                  sx={{ bgcolor: STATUS_COLOR[r.status], flexShrink: 0 }}
                />
                <Typography variant="bodySmall" sx={{ color: 'var(--md-sys-color-on-error-container)' }}>
                  {r.threat} — {r.mitigation}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </M3Surface>
      )}

    </Stack>
  );
};

export default DPIAViewerPanel;
