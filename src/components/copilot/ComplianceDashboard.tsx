/**
 * ComplianceDashboard.tsx
 * Self-Compliance Engine — pannello di monitoraggio MD3 Gold Compliant.
 *
 * Sezioni:
 *   1. Status badge (compliant / warning / non_compliant)
 *   2. Metriche chiave (grid 3×2)
 *   3. Alert di rischio recenti
 *   4. Azioni: esegui ciclo · esporta audit · copia open data
 */

import React, { useState } from 'react';
import Box               from '@mui/material/Box';
import Stack             from '@mui/material/Stack';
import Typography        from '@mui/material/Typography';
import Chip              from '@mui/material/Chip';
import LinearProgress    from '@mui/material/LinearProgress';
import Button            from '@mui/material/Button';
import Divider           from '@mui/material/Divider';
import Tooltip           from '@mui/material/Tooltip';
import Collapse          from '@mui/material/Collapse';
import M3Surface         from '../ui/M3Surface';
import { useCompliance } from '../../hooks/useCompliance';
import type { RiskAlert, ComplianceStatus } from '../../self-compliance/types';

// ── Helpers ───────────────────────────────────────────────────────────────────

function statusColor(s: ComplianceStatus): string {
  switch (s) {
    case 'compliant':     return 'var(--md-sys-color-primary)';
    case 'warning':       return 'var(--md-sys-color-tertiary)';
    case 'non_compliant': return 'var(--md-sys-color-error)';
  }
}

function statusLabel(s: ComplianceStatus): string {
  switch (s) {
    case 'compliant':     return 'Conforme';
    case 'warning':       return 'Attenzione';
    case 'non_compliant': return 'Non Conforme';
  }
}

function statusIcon(s: ComplianceStatus): string {
  switch (s) {
    case 'compliant':     return 'verified';
    case 'warning':       return 'warning';
    case 'non_compliant': return 'gpp_bad';
  }
}

function severityColor(s: RiskAlert['severity']): string {
  switch (s) {
    case 'critical': return 'var(--md-sys-color-error)';
    case 'high':     return 'var(--md-sys-color-error)';
    case 'medium':   return 'var(--md-sys-color-tertiary)';
    case 'low':      return 'var(--md-sys-color-secondary)';
  }
}

function pct(n: number): string {
  return `${Math.round(n * 100)}%`;
}

// ── MetricTile ────────────────────────────────────────────────────────────────

interface MetricTileProps {
  label: string;
  value: string | number;
  icon:  string;
  color?: string;
}

const MetricTile: React.FC<MetricTileProps> = ({ label, value, icon, color }) => (
  <M3Surface
    elevation={0}
    sx={{
      borderRadius: 'var(--md-sys-shape-corner-medium)',
      p: 'var(--md-sys-spacing-3)',
      flex: '1 1 140px',
      border: '1px solid var(--md-sys-color-outline-variant)',
      minWidth: 0,
    }}
  >
    <Stack direction="row" alignItems="center" gap="var(--md-sys-spacing-2)" mb="var(--md-sys-spacing-1)">
      <Box
        component="span"
        className="material-symbols-outlined"
        aria-hidden="true"
        sx={{
          fontSize: 'var(--md-sys-icon-size-sm)',
          color: color ?? 'var(--md-sys-color-secondary)',
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Typography
        variant="labelSmall"
        sx={{ color: 'var(--md-sys-color-on-surface-variant)', lineHeight: 1.3 }}
      >
        {label}
      </Typography>
    </Stack>
    <Typography
      variant="titleMedium"
      sx={{ color: color ?? 'var(--md-sys-color-on-surface)', fontVariantNumeric: 'tabular-nums' }}
    >
      {value}
    </Typography>
  </M3Surface>
);

// ── AlertRow ─────────────────────────────────────────────────────────────────

const AlertRow: React.FC<{ alert: RiskAlert }> = ({ alert }) => {
  const color = severityColor(alert.severity);
  return (
    <Stack direction="row" alignItems="flex-start" gap="var(--md-sys-spacing-2)" py="var(--md-sys-spacing-1)">
      <Box
        component="span"
        className="material-symbols-outlined"
        aria-hidden="true"
        sx={{ fontSize: 'var(--md-sys-icon-size-sm)', color, flexShrink: 0, mt: '2px' }}
      >
        {alert.severity === 'critical' || alert.severity === 'high' ? 'error' : 'info'}
      </Box>
      <Stack gap={0} minWidth={0}>
        <Typography
          variant="bodySmall"
          sx={{ color: 'var(--md-sys-color-on-surface)', lineHeight: 1.4 }}
        >
          {alert.message}
        </Typography>
        <Typography
          variant="labelSmall"
          sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}
        >
          {alert.type} · {new Date(alert.timestamp).toLocaleTimeString('it-IT')}
        </Typography>
      </Stack>
    </Stack>
  );
};

// ── ComplianceDashboard ───────────────────────────────────────────────────────

const ComplianceDashboard: React.FC = () => {
  const { status, metrics, recentAlerts, runCycle, exportAudit, getOpenData } = useCompliance();
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [copyLabel, setCopyLabel]   = useState('Copia Open Data');

  const today  = new Date().toISOString().slice(0, 10);
  const period = `daily_${today}`;

  function handleRunCycle(): void {
    runCycle(period);
  }

  function handleExportAudit(): void {
    const result = exportAudit();
    const blob   = new Blob([result.json], { type: 'application/json' });
    const url    = URL.createObjectURL(blob);
    const a      = document.createElement('a');
    a.href       = url;
    a.download   = `audit_${today}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleCopyOpenData(): void {
    const result = getOpenData(period);
    void navigator.clipboard.writeText(JSON.stringify(result, null, 2)).then(() => {
      setCopyLabel('Copiato!');
      setTimeout(() => setCopyLabel('Copia Open Data'), 2000);
    });
  }

  const currentStatus = status?.complianceStatus ?? 'compliant';
  const color         = statusColor(currentStatus);

  return (
    <M3Surface
      elevation={1}
      sx={{
        borderRadius: 'var(--md-sys-shape-corner-large)',
        p: 'var(--md-sys-spacing-5)',
      }}
    >
      <Stack gap="var(--md-sys-spacing-4)">

        {/* ── Header ── */}
        <Stack direction="row" alignItems="center" gap="var(--md-sys-spacing-3)">
          <Box
            component="span"
            className="material-symbols-outlined"
            aria-hidden="true"
            sx={{ fontSize: 'var(--md-sys-icon-size-lg)', color }}
          >
            {statusIcon(currentStatus)}
          </Box>
          <Stack gap={0} flexGrow={1}>
            <Typography variant="titleLarge" sx={{ color: 'var(--md-sys-color-on-surface)' }}>
              Self-Compliance Engine
            </Typography>
            <Typography variant="bodySmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
              Monitoraggio automatico · GDPR · AI Act · CAD
            </Typography>
          </Stack>
          <Chip
            label={statusLabel(currentStatus)}
            size="small"
            sx={{
              bgcolor: color,
              color: 'white',
              fontWeight: 'var(--md-sys-typescale-weight-bold)',
              borderRadius: 'var(--md-sys-shape-corner-full)',
            }}
          />
        </Stack>

        {/* ── Confidence bar ── */}
        {status && (
          <Stack gap="var(--md-sys-spacing-1)">
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="labelSmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                Confidence Score
              </Typography>
              <Typography variant="labelSmall" sx={{ color }}>
                {pct(status.confidenceScore)}
              </Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={status.confidenceScore * 100}
              sx={{
                height: 6,
                borderRadius: 3,
                bgcolor: 'var(--md-sys-color-surface-variant)',
                '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 3 },
              }}
            />
          </Stack>
        )}

        <Divider />

        {/* ── Metriche ── */}
        {metrics ? (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--md-sys-spacing-2)' }}>
            <MetricTile label="Azioni totali"        value={metrics.totalActions}          icon="data_table" />
            <MetricTile label="Autonome"             value={metrics.autonomousActions}      icon="smart_toy" />
            <MetricTile label="Approvate"            value={metrics.approvedActions}        icon="check_circle"
              color="var(--md-sys-color-primary)" />
            <MetricTile label="Bloccate"             value={metrics.blockedActions}         icon="block"
              color={metrics.blockedActions > 0 ? 'var(--md-sys-color-error)' : undefined} />
            <MetricTile label="Spiegabilità"         value={pct(metrics.explainabilityCoverage)} icon="psychology"
              color={metrics.explainabilityCoverage >= 0.7 ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-error)'} />
            <MetricTile label="Violazioni GDPR"      value={metrics.gdprViolations}         icon="gpp_bad"
              color={metrics.gdprViolations > 0 ? 'var(--md-sys-color-error)' : undefined} />
          </Box>
        ) : (
          <Typography variant="bodyMedium" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
            Nessun dato disponibile — esegui un ciclo di valutazione.
          </Typography>
        )}

        {/* ── Alerts ── */}
        {recentAlerts.length > 0 && (
          <>
            <Divider />
            <Button
              size="small"
              variant="text"
              onClick={() => setAlertsOpen(v => !v)}
              startIcon={
                <Box component="span" className="material-symbols-outlined" aria-hidden="true"
                  sx={{ fontSize: 'var(--md-sys-icon-size-sm) !important' }}>
                  {alertsOpen ? 'expand_less' : 'warning'}
                </Box>
              }
              sx={{ alignSelf: 'flex-start', color: 'var(--md-sys-color-on-surface-variant)' }}
              aria-expanded={alertsOpen}
              aria-label={alertsOpen ? 'Nascondi alert' : `Mostra ${recentAlerts.length} alert`}
            >
              {alertsOpen ? 'Nascondi alert' : `${recentAlerts.length} alert attivi`}
            </Button>
            <Collapse in={alertsOpen}>
              <Stack gap="var(--md-sys-spacing-1)" divider={<Divider />}>
                {recentAlerts.map(a => (
                  <AlertRow key={a.id} alert={a} />
                ))}
              </Stack>
            </Collapse>
          </>
        )}

        {/* ── Issues / Required actions ── */}
        {status && status.requiredActions.length > 0 && (
          <>
            <Divider />
            <Stack gap="var(--md-sys-spacing-2)">
              <Typography variant="labelMedium" sx={{ color: 'var(--md-sys-color-error)' }}>
                Azioni richieste
              </Typography>
              {status.requiredActions.map((action, i) => (
                <Stack key={i} direction="row" gap="var(--md-sys-spacing-2)" alignItems="flex-start">
                  <Box
                    component="span"
                    className="material-symbols-outlined"
                    aria-hidden="true"
                    sx={{ fontSize: 'var(--md-sys-icon-size-xs)', color: 'var(--md-sys-color-error)', mt: '3px', flexShrink: 0 }}
                  >
                    arrow_forward
                  </Box>
                  <Typography variant="bodySmall" sx={{ color: 'var(--md-sys-color-on-surface)' }}>
                    {action}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </>
        )}

        <Divider />

        {/* ── Actions ── */}
        <Stack direction="row" flexWrap="wrap" gap="var(--md-sys-spacing-2)">
          <Button
            variant="contained"
            size="small"
            onClick={handleRunCycle}
            aria-label="Esegui ciclo di valutazione compliance"
            startIcon={
              <Box component="span" className="material-symbols-outlined" aria-hidden="true"
                sx={{ fontSize: 'var(--md-sys-icon-size-sm) !important' }}>
                autorenew
              </Box>
            }
            sx={{ borderRadius: 'var(--md-sys-shape-corner-full)' }}
          >
            Valuta ora
          </Button>

          <Tooltip title="Scarica il pacchetto JSON auditabile">
            <Button
              variant="outlined"
              size="small"
              onClick={handleExportAudit}
              aria-label="Scarica pacchetto audit JSON"
              startIcon={
                <Box component="span" className="material-symbols-outlined" aria-hidden="true"
                  sx={{ fontSize: 'var(--md-sys-icon-size-sm) !important' }}>
                  download
                </Box>
              }
              sx={{ borderRadius: 'var(--md-sys-shape-corner-full)' }}
            >
              Esporta Audit
            </Button>
          </Tooltip>

          <Tooltip title="Copia JSON open data anonimizzato (GDPR-safe)">
            <Button
              variant="outlined"
              size="small"
              onClick={handleCopyOpenData}
              aria-label="Copia open data anonimizzato"
              startIcon={
                <Box component="span" className="material-symbols-outlined" aria-hidden="true"
                  sx={{ fontSize: 'var(--md-sys-icon-size-sm) !important' }}>
                  content_copy
                </Box>
              }
              sx={{ borderRadius: 'var(--md-sys-shape-corner-full)' }}
            >
              {copyLabel}
            </Button>
          </Tooltip>
        </Stack>

      </Stack>
    </M3Surface>
  );
};

export default ComplianceDashboard;
