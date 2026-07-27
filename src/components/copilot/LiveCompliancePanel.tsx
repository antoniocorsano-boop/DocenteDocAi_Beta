/**
 * LiveCompliancePanel.tsx
 * Compliance Brain Runtime — pannello live MD3 Gold Compliant.
 *
 * Mostra in tempo reale:
 *   1. Live score (0–100) con stato (compliant / non compliant)
 *   2. Framework scores: GDPR · AI Act · AgID
 *   3. Lista violazioni con severity, articolo, fix suggerito, remediation button
 */

import React, { useState } from 'react';
import Box            from '@mui/material/Box';
import Stack          from '@mui/material/Stack';
import Typography     from '@mui/material/Typography';
import Chip           from '@mui/material/Chip';
import LinearProgress from '@mui/material/LinearProgress';
import Button         from '@mui/material/Button';
import Divider        from '@mui/material/Divider';
import Collapse       from '@mui/material/Collapse';
import Tooltip        from '@mui/material/Tooltip';
import Tabs           from '@mui/material/Tabs';
import Tab            from '@mui/material/Tab';
import M3Surface       from '../ui/M3Surface';
import { useComplianceRuntime } from '../../hooks/useComplianceRuntime';
import AuditPAPanel    from './AuditPAPanel';
import GovernancePanel from './GovernancePanel';
import type { ComplianceViolation, FrameworkScore, RemediationAction } from '../../self-compliance/runtime/types';

// ── Helpers ───────────────────────────────────────────────────────────────────

function scoreColor(n: number, compliant: boolean): string {
  if (!compliant) return 'var(--md-sys-color-error)';
  if (n >= 80)    return 'var(--md-sys-color-primary)';
  if (n >= 60)    return 'var(--md-sys-color-tertiary)';
  return 'var(--md-sys-color-error)';
}

function severityColor(s: ComplianceViolation['severity']): string {
  switch (s) {
    case 'critical': return 'var(--md-sys-color-error)';
    case 'high':     return 'var(--md-sys-color-error)';
    case 'medium':   return 'var(--md-sys-color-tertiary)';
    case 'low':      return 'var(--md-sys-color-secondary)';
  }
}

function severityIcon(s: ComplianceViolation['severity']): string {
  switch (s) {
    case 'critical': return 'gpp_bad';
    case 'high':     return 'warning';
    case 'medium':   return 'info';
    case 'low':      return 'help';
  }
}

function remediationLabel(a: RemediationAction): string {
  switch (a) {
    case 'run_compliance_cycle':   return 'Esegui Audit';
    case 'enable_human_approval':  return 'Abilita Approvazione';
    case 'export_audit':           return 'Esporta Audit';
    case 'contact_dpo':            return 'Contatta DPO';
  }
}

function frameworkLabel(fw: string): string {
  switch (fw) {
    case 'GDPR':   return 'GDPR';
    case 'AI_ACT': return 'AI Act';
    case 'AGID':   return 'AgID';
    default:        return fw;
  }
}

// ── FrameworkBar ──────────────────────────────────────────────────────────────

const FrameworkBar: React.FC<{ fs: FrameworkScore }> = ({ fs }) => {
  const color = fs.score >= 80
    ? 'var(--md-sys-color-primary)'
    : fs.score >= 60
      ? 'var(--md-sys-color-tertiary)'
      : 'var(--md-sys-color-error)';

  return (
    <Stack gap="var(--md-sys-spacing-1)">
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Stack direction="row" alignItems="center" gap="var(--md-sys-spacing-1)">
          <Typography variant="labelSmall" sx={{ color: 'var(--md-sys-color-on-surface)', fontWeight: 'var(--md-sys-typescale-weight-bold)' }}>
            {frameworkLabel(fs.framework)}
          </Typography>
          <Typography variant="labelSmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
            {Math.round(fs.weight * 100)}%
          </Typography>
        </Stack>
        <Typography
          variant="labelSmall"
          sx={{ color, fontVariantNumeric: 'tabular-nums' }}
        >
          {fs.passed}/{fs.total} regole · {fs.score}/100
        </Typography>
      </Stack>
      <LinearProgress
        variant="determinate"
        value={fs.score}
        sx={{
          height: 5,
          borderRadius: 2,
          bgcolor: 'var(--md-sys-color-surface-variant)',
          '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 2 },
        }}
      />
    </Stack>
  );
};

// ── ViolationCard ─────────────────────────────────────────────────────────────

interface ViolationCardProps {
  violation: ComplianceViolation;
  onRemediate: (action: RemediationAction) => void;
}

const ViolationCard: React.FC<ViolationCardProps> = ({ violation, onRemediate }) => {
  const [fixOpen, setFixOpen] = useState(false);
  const color = severityColor(violation.severity);

  return (
    <M3Surface
      elevation={0}
      sx={{
        borderRadius: 'var(--md-sys-shape-corner-medium)',
        p: 'var(--md-sys-spacing-3)',
        border: `1px solid ${color}`,
        borderLeftWidth: 3,
      }}
    >
      <Stack gap="var(--md-sys-spacing-2)">
        {/* Header */}
        <Stack direction="row" alignItems="flex-start" gap="var(--md-sys-spacing-2)">
          <Box
            component="span"
            className="material-symbols-outlined"
            aria-hidden="true"
            sx={{ fontSize: 'var(--md-sys-icon-size-sm)', color, flexShrink: 0, mt: '2px' }}
          >
            {severityIcon(violation.severity)}
          </Box>
          <Stack gap={0} flexGrow={1} minWidth={0}>
            <Stack direction="row" alignItems="center" gap="var(--md-sys-spacing-2)" flexWrap="wrap">
              <Chip
                label={violation.severity.toUpperCase()}
                size="small"
                sx={{
                  bgcolor: color,
                  color: 'white',
                  fontWeight: 'var(--md-sys-typescale-weight-bold)',
                  borderRadius: 'var(--md-sys-shape-corner-full)',
                  height: 18,
                  fontSize: 'var(--md-sys-typescale-label-small-font-size)',
                }}
              />
              <Chip
                label={frameworkLabel(violation.framework)}
                size="small"
                sx={{
                  bgcolor: 'var(--md-sys-color-surface-variant)',
                  color: 'var(--md-sys-color-on-surface-variant)',
                  borderRadius: 'var(--md-sys-shape-corner-full)',
                  height: 18,
                  fontSize: 'var(--md-sys-typescale-label-small-font-size)',
                }}
              />
              <Typography variant="labelSmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                {violation.article}
              </Typography>
            </Stack>
            <Typography
              variant="bodySmall"
              sx={{ color: 'var(--md-sys-color-on-surface)', mt: 'var(--md-sys-spacing-1)', lineHeight: 1.4 }}
            >
              {violation.message}
            </Typography>
          </Stack>
        </Stack>

        {/* Fix + remediation */}
        <Stack direction="row" gap="var(--md-sys-spacing-2)" alignItems="center" flexWrap="wrap">
          <Button
            size="small"
            variant="text"
            onClick={() => setFixOpen(v => !v)}
            endIcon={
              <Box
                component="span"
                className="material-symbols-outlined"
                aria-hidden="true"
                sx={{ fontSize: 'var(--md-sys-icon-size-xs)' }}
              >
                {fixOpen ? 'expand_less' : 'expand_more'}
              </Box>
            }
            sx={{ textTransform: 'none', color: 'var(--md-sys-color-primary)', p: 0, minWidth: 0 }}
            aria-expanded={fixOpen}
            aria-label={`Mostra suggerimento fix per ${violation.ruleId}`}
          >
            Come risolvere
          </Button>

          {violation.remediationAction && (
            <Tooltip title="Azione automatica disponibile">
              <Button
                size="small"
                variant="outlined"
                onClick={() => onRemediate(violation.remediationAction!)}
                startIcon={
                  <Box
                    component="span"
                    className="material-symbols-outlined"
                    aria-hidden="true"
                    sx={{ fontSize: 'var(--md-sys-icon-size-xs)' }}
                  >
                    auto_fix_high
                  </Box>
                }
                sx={{
                  textTransform: 'none',
                  borderColor: color,
                  color,
                  '&:hover': { borderColor: color, bgcolor: 'transparent' },
                  fontSize: 'var(--md-sys-typescale-label-small-font-size)',
                  height: 26,
                }}
                aria-label={`Esegui remediation: ${remediationLabel(violation.remediationAction)}`}
              >
                {remediationLabel(violation.remediationAction)}
              </Button>
            </Tooltip>
          )}
        </Stack>

        <Collapse in={fixOpen}>
          <M3Surface
            elevation={0}
            sx={{
              borderRadius: 'var(--md-sys-shape-corner-small)',
              p: 'var(--md-sys-spacing-2)',
              bgcolor: 'var(--md-sys-color-surface-variant)',
            }}
          >
            <Typography
              variant="bodySmall"
              sx={{ color: 'var(--md-sys-color-on-surface-variant)', lineHeight: 1.5 }}
            >
              {violation.suggestedFix}
            </Typography>
          </M3Surface>
        </Collapse>
      </Stack>
    </M3Surface>
  );
};

// ── LiveCompliancePanel ────────────────────────────────────────────────────────

const LiveCompliancePanel: React.FC = () => {
  const { result, violations, liveScore, remediate } = useComplianceRuntime();
  const [violationsOpen, setViolationsOpen] = useState(true);
  const [tab, setTab] = useState<0 | 1 | 2>(0);

  const color          = scoreColor(liveScore, result.compliant);
  const statusLabel    = result.compliant ? 'Conforme' : violations.some(v => v.severity === 'critical') ? 'Critico' : 'Attenzione';
  const statusIcon     = result.compliant ? 'verified' : violations.some(v => v.severity === 'critical') ? 'gpp_bad' : 'warning';
  const evaluatedTime  = new Date(result.evaluatedAt).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <M3Surface
      elevation={1}
      sx={{
        borderRadius: 'var(--md-sys-shape-corner-large)',
        p: 'var(--md-sys-spacing-5)',
        border: result.compliant
          ? '1px solid var(--md-sys-color-outline-variant)'
          : `1px solid ${color}`,
      }}
    >
      <Stack gap="var(--md-sys-spacing-4)">

        {/* ── Tab header ── */}
        <Tabs
          value={tab}
          onChange={(_, v: 0 | 1 | 2) => setTab(v)}
          sx={{
            minHeight: 36,
            borderBottom: '1px solid var(--md-sys-color-outline-variant)',
            '& .MuiTab-root': {
              minHeight: 36,
              textTransform: 'none',
              fontSize: 'var(--md-sys-typescale-label-large-font-size)',
              color: 'var(--md-sys-color-on-surface-variant)',
            },
            '& .Mui-selected': { color: 'var(--md-sys-color-primary)' },
            '& .MuiTabs-indicator': { bgcolor: 'var(--md-sys-color-primary)' },
          }}
          aria-label="Modalità pannello compliance"
        >
          <Tab label="Live Runtime" id="compliance-tab-0" aria-controls="compliance-tabpanel-0" />
          <Tab label="Audit PA"     id="compliance-tab-1" aria-controls="compliance-tabpanel-1" />
          <Tab label="Governance"   id="compliance-tab-2" aria-controls="compliance-tabpanel-2" />
        </Tabs>

        {/* ── Tab 0: Live Runtime ── */}
        {tab === 0 && (
        <Stack gap="var(--md-sys-spacing-4)" role="tabpanel" id="compliance-tabpanel-0" aria-labelledby="compliance-tab-0">

        {/* ── Header con live score ── */}
        <Stack direction="row" alignItems="center" gap="var(--md-sys-spacing-3)">
          <Box
            component="span"
            className="material-symbols-outlined"
            aria-hidden="true"
            sx={{ fontSize: 'var(--md-sys-icon-size-lg)', color }}
          >
            {statusIcon}
          </Box>
          <Stack gap={0} flexGrow={1}>
            <Stack direction="row" alignItems="center" gap="var(--md-sys-spacing-2)">
              <Typography variant="titleMedium" sx={{ color: 'var(--md-sys-color-on-surface)' }}>
                Live Compliance
              </Typography>
              <Chip
                label={statusLabel}
                size="small"
                sx={{
                  bgcolor: color,
                  color: 'white',
                  fontWeight: 'var(--md-sys-typescale-weight-bold)',
                  borderRadius: 'var(--md-sys-shape-corner-full)',
                }}
              />
            </Stack>
            <Typography variant="bodySmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
              {result.passedRules}/{result.totalRules} regole · valuato {evaluatedTime}
            </Typography>
          </Stack>
          {/* Big score */}
          <Stack alignItems="center" gap={0}>
            <Typography
              variant="displaySmall"
              sx={{
                color,
                fontVariantNumeric: 'tabular-nums',
                lineHeight: 1,
              }}
            >
              {liveScore}
            </Typography>
            <Typography variant="labelSmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
              /100
            </Typography>
          </Stack>
        </Stack>

        {/* ── Framework scores ── */}
        <Stack gap="var(--md-sys-spacing-2)">
          {(Object.values(result.frameworkScores) as FrameworkScore[]).map(fs => (
            <FrameworkBar key={fs.framework} fs={fs} />
          ))}
        </Stack>

        {/* ── Violations ── */}
        {violations.length > 0 && (
          <>
            <Divider />
            <Button
              variant="text"
              size="small"
              onClick={() => setViolationsOpen(v => !v)}
              endIcon={
                <Box
                  component="span"
                  className="material-symbols-outlined"
                  aria-hidden="true"
                  sx={{ fontSize: 'var(--md-sys-icon-size-sm)' }}
                >
                  {violationsOpen ? 'expand_less' : 'expand_more'}
                </Box>
              }
              sx={{ alignSelf: 'flex-start', textTransform: 'none', color: 'var(--md-sys-color-error)' }}
              aria-expanded={violationsOpen}
              aria-label="Mostra/nascondi violazioni"
            >
              {violations.length} Violazione{violations.length > 1 ? 'i' : ''} Rilevata{violations.length > 1 ? 'e' : ''}
            </Button>

            <Collapse in={violationsOpen}>
              <Stack gap="var(--md-sys-spacing-2)">
                {violations.map(v => (
                  <ViolationCard
                    key={v.ruleId}
                    violation={v}
                    onRemediate={remediate}
                  />
                ))}
              </Stack>
            </Collapse>
          </>
        )}

        {violations.length === 0 && (
          <Stack direction="row" alignItems="center" gap="var(--md-sys-spacing-2)">
            <Box
              component="span"
              className="material-symbols-outlined"
              aria-hidden="true"
              sx={{ fontSize: 'var(--md-sys-icon-size-sm)', color: 'var(--md-sys-color-primary)' }}
            >
              check_circle
            </Box>
            <Typography variant="bodySmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
              Nessuna violazione rilevata — tutte le regole soddisfatte.
            </Typography>
          </Stack>
        )}

        </Stack>
        )} {/* fine tab 0: Live Runtime */}

        {/* ── Tab 1: Audit PA ── */}
        {tab === 1 && (
          <Box role="tabpanel" id="compliance-tabpanel-1" aria-labelledby="compliance-tab-1">
            <AuditPAPanel />
          </Box>
        )}

        {/* ── Tab 2: Governance ── */}
        {tab === 2 && (
          <Box role="tabpanel" id="compliance-tabpanel-2" aria-labelledby="compliance-tab-2">
            <GovernancePanel />
          </Box>
        )}

      </Stack>
    </M3Surface>
  );
};

export default LiveCompliancePanel;
