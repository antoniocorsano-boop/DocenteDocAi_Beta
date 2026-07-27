/**
 * AuditPAPanel.tsx
 * Simulatore Audit PA Live — pannello MD3 Gold Compliant.
 *
 * Mostra il report di audit di un revisore PA esterno con:
 *   1. Scenario selector (5 preset: produzione live + 4 simulazioni)
 *   2. Score globale + stato conformità PA + readiness certificazione
 *   3. Framework scores (GDPR · AI Act · AgID)
 *   4. Findings PA ordinati: bloccanti prima, poi migliorativi
 *      — ogni finding ha: Nota Revisore PA collassabile + suggerimento fix + remediation button
 *   5. Raccomandazioni contestuali
 *   6. Export JSON
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
import CircularProgress from '@mui/material/CircularProgress';
import M3Surface      from '../ui/M3Surface';
import { useAuditSimulator }          from '../../hooks/useAuditSimulator';
import { useComplianceRuntime }       from '../../hooks/useComplianceRuntime';
import { useAuditHistory }            from '../../hooks/useAuditHistory';
import { useGovernanceStore }         from '../../self-compliance/governance';
import { generateAuditVerbalePDF }    from '../../utils/generateAuditVerbalePDF';
import type { AuditFinding, PALiveAuditReport } from '../../self-compliance/runtime/audit';
import type { RemediationAction } from '../../self-compliance/runtime/types';

// ── Helpers ───────────────────────────────────────────────────────────────────
function driftColorHelper(status: 'improving' | 'stable' | 'degrading'): string {
  switch (status) {
    case 'improving': return 'var(--md-sys-color-primary)';
    case 'stable':    return 'var(--md-sys-color-on-surface-variant)';
    case 'degrading': return 'var(--md-sys-color-error)';
  }
}

function driftIconHelper(status: 'improving' | 'stable' | 'degrading'): string {
  switch (status) {
    case 'improving': return 'trending_up';
    case 'stable':    return 'trending_flat';
    case 'degrading': return 'trending_down';
  }
}
function paSeverityColor(severity: AuditFinding['severity']): string {
  switch (severity) {
    case 'Critical': return 'var(--md-sys-color-error)';
    case 'High':     return 'var(--md-sys-color-error)';
    case 'Medium':   return 'var(--md-sys-color-tertiary)';
    case 'Low':      return 'var(--md-sys-color-secondary)';
  }
}

function paSeverityIcon(severity: AuditFinding['severity']): string {
  switch (severity) {
    case 'Critical': return 'gpp_bad';
    case 'High':     return 'warning';
    case 'Medium':   return 'info';
    case 'Low':      return 'help';
  }
}

function statusColor(status: PALiveAuditReport['complianceStatus']): string {
  switch (status) {
    case 'CONFORME':              return 'var(--md-sys-color-primary)';
    case 'PARZIALMENTE_CONFORME': return 'var(--md-sys-color-tertiary)';
    case 'NON_CONFORME':          return 'var(--md-sys-color-error)';
  }
}

function statusLabel(status: PALiveAuditReport['complianceStatus']): string {
  switch (status) {
    case 'CONFORME':              return 'Conforme';
    case 'PARZIALMENTE_CONFORME': return 'Parz. Conforme';
    case 'NON_CONFORME':          return 'Non Conforme';
  }
}

function readinessColor(r: PALiveAuditReport['certificationReadiness']): string {
  switch (r) {
    case 'PRONTO':       return 'var(--md-sys-color-primary)';
    case 'CONDIZIONATO': return 'var(--md-sys-color-tertiary)';
    case 'NON_PRONTO':   return 'var(--md-sys-color-error)';
  }
}

function readinessIcon(r: PALiveAuditReport['certificationReadiness']): string {
  switch (r) {
    case 'PRONTO':       return 'verified_user';
    case 'CONDIZIONATO': return 'pending_actions';
    case 'NON_PRONTO':   return 'cancel';
  }
}

function frameworkLabel(fw: string): string {
  switch (fw) {
    case 'GDPR':   return 'GDPR';
    case 'AI_ACT': return 'AI Act';
    case 'AGID':   return 'AgID';
    default:       return fw;
  }
}

function remediationLabel(a: RemediationAction): string {
  switch (a) {
    case 'run_compliance_cycle':  return 'Esegui Audit';
    case 'enable_human_approval': return 'Abilita Approvazione';
    case 'export_audit':          return 'Esporta Audit';
    case 'contact_dpo':           return 'Contatta DPO';
  }
}

// ── FindingCard ───────────────────────────────────────────────────────────────

interface FindingCardProps {
  finding:     AuditFinding;
  onRemediate: (action: RemediationAction) => void;
}

const FindingCard: React.FC<FindingCardProps> = ({ finding, onRemediate }) => {
  const [noteOpen,     setNoteOpen]     = useState(false);
  const [fixOpen,      setFixOpen]      = useState(false);
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const color = paSeverityColor(finding.severity);

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

        {/* ── Header ── */}
        <Stack direction="row" alignItems="flex-start" gap="var(--md-sys-spacing-2)">
          <Box
            component="span"
            className="material-symbols-outlined"
            aria-hidden="true"
            sx={{ fontSize: 'var(--md-sys-icon-size-sm)', color, flexShrink: 0, mt: '2px' }}
          >
            {paSeverityIcon(finding.severity)}
          </Box>

          <Stack gap={0} flexGrow={1} minWidth={0}>
            <Stack direction="row" alignItems="center" gap="var(--md-sys-spacing-1)" flexWrap="wrap">
              <Chip
                label={finding.severity.toUpperCase()}
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
              {finding.blocking && (
                <Chip
                  label="BLOCCANTE"
                  size="small"
                  sx={{
                    bgcolor: 'var(--md-sys-color-error-container)',
                    color: 'var(--md-sys-color-on-error-container)',
                    fontWeight: 'var(--md-sys-typescale-weight-bold)',
                    borderRadius: 'var(--md-sys-shape-corner-full)',
                    height: 18,
                    fontSize: 'var(--md-sys-typescale-label-small-font-size)',
                  }}
                />
              )}
              <Chip
                label={frameworkLabel(finding.framework)}
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
                {finding.article}
              </Typography>
            </Stack>

            <Typography
              variant="bodySmall"
              sx={{ color: 'var(--md-sys-color-on-surface)', mt: 'var(--md-sys-spacing-1)', lineHeight: 1.4 }}
            >
              {finding.description}
            </Typography>
          </Stack>
        </Stack>

        {/* ── Azioni ── */}
        <Stack direction="row" gap="var(--md-sys-spacing-2)" alignItems="center" flexWrap="wrap">

          {/* Nota Revisore PA */}
          <Button
            size="small"
            variant="text"
            onClick={() => setNoteOpen(v => !v)}
            startIcon={
              <Box component="span" className="material-symbols-outlined" aria-hidden="true"
                sx={{ fontSize: 'var(--md-sys-icon-size-xs)' }}>
                gavel
              </Box>
            }
            endIcon={
              <Box component="span" className="material-symbols-outlined" aria-hidden="true"
                sx={{ fontSize: 'var(--md-sys-icon-size-xs)' }}>
                {noteOpen ? 'expand_less' : 'expand_more'}
              </Box>
            }
            sx={{ textTransform: 'none', color: 'var(--md-sys-color-error)', p: 0, minWidth: 0 }}
            aria-expanded={noteOpen}
            aria-label={`Mostra nota revisore PA per ${finding.ruleId}`}
          >
            Nota Revisore
          </Button>

          {/* Evidenze tecniche */}
          {finding.evidence.length > 0 && (
            <Button
              size="small"
              variant="text"
              onClick={() => setEvidenceOpen(v => !v)}
              startIcon={
                <Box component="span" className="material-symbols-outlined" aria-hidden="true"
                  sx={{ fontSize: 'var(--md-sys-icon-size-xs)' }}>
                  fact_check
                </Box>
              }
              endIcon={
                <Box component="span" className="material-symbols-outlined" aria-hidden="true"
                  sx={{ fontSize: 'var(--md-sys-icon-size-xs)' }}>
                  {evidenceOpen ? 'expand_less' : 'expand_more'}
                </Box>
              }
              sx={{ textTransform: 'none', color: 'var(--md-sys-color-secondary)', p: 0, minWidth: 0 }}
              aria-expanded={evidenceOpen}
              aria-label={`Mostra evidenze per ${finding.ruleId}`}
            >
              Evidenze ({finding.evidence.length})
            </Button>
          )}

          {/* Come risolvere */}
          <Button
            size="small"
            variant="text"
            onClick={() => setFixOpen(v => !v)}
            endIcon={
              <Box component="span" className="material-symbols-outlined" aria-hidden="true"
                sx={{ fontSize: 'var(--md-sys-icon-size-xs)' }}>
                {fixOpen ? 'expand_less' : 'expand_more'}
              </Box>
            }
            sx={{ textTransform: 'none', color: 'var(--md-sys-color-primary)', p: 0, minWidth: 0 }}
            aria-expanded={fixOpen}
            aria-label={`Mostra suggerimento tecnico per ${finding.ruleId}`}
          >
            Come risolvere
          </Button>

          {/* Remediation automatica */}
          {finding.remediationAction && (
            <Tooltip title="Azione automatica disponibile">
              <Button
                size="small"
                variant="outlined"
                onClick={() => onRemediate(finding.remediationAction!)}
                startIcon={
                  <Box component="span" className="material-symbols-outlined" aria-hidden="true"
                    sx={{ fontSize: 'var(--md-sys-icon-size-xs)' }}>
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
                aria-label={`Esegui remediation: ${remediationLabel(finding.remediationAction)}`}
              >
                {remediationLabel(finding.remediationAction)}
              </Button>
            </Tooltip>
          )}
        </Stack>

        {/* ── Nota Revisore PA ── */}
        <Collapse in={noteOpen}>
          <M3Surface
            elevation={0}
            sx={{
              borderRadius: 'var(--md-sys-shape-corner-small)',
              p: 'var(--md-sys-spacing-2)',
              bgcolor: 'var(--md-sys-color-error-container)',
            }}
          >
            <Stack direction="row" gap="var(--md-sys-spacing-2)" alignItems="flex-start">
              <Box component="span" className="material-symbols-outlined" aria-hidden="true"
                sx={{
                  fontSize: 'var(--md-sys-icon-size-xs)',
                  color: 'var(--md-sys-color-on-error-container)',
                  flexShrink: 0,
                  mt: '2px',
                }}>
                gavel
              </Box>
              <Typography
                variant="bodySmall"
                sx={{ color: 'var(--md-sys-color-on-error-container)', lineHeight: 1.5 }}
              >
                {finding.paNote}
              </Typography>
            </Stack>
          </M3Surface>
        </Collapse>

        {/* ── Evidenze tecniche verificabili ── */}
        <Collapse in={evidenceOpen}>
          <M3Surface
            elevation={0}
            sx={{
              borderRadius: 'var(--md-sys-shape-corner-small)',
              p: 'var(--md-sys-spacing-2)',
              bgcolor: 'var(--md-sys-color-surface-variant)',
            }}
          >
            <Stack gap="var(--md-sys-spacing-1)">
              <Typography variant="labelSmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)', mb: 'var(--md-sys-spacing-1)' }}>
                Evidenze tecniche verificabili:
              </Typography>
              <Stack direction="row" gap="var(--md-sys-spacing-1)" flexWrap="wrap">
                {finding.evidence.map((ev, i) => (
                  <Chip
                    key={i}
                    label={ev}
                    size="small"
                    sx={{
                      fontFamily: 'monospace',
                      bgcolor: 'transparent',
                      border: '1px solid var(--md-sys-color-outline-variant)',
                      color: 'var(--md-sys-color-on-surface)',
                      borderRadius: 'var(--md-sys-shape-corner-extra-small)',
                      fontSize: 'var(--md-sys-typescale-label-small-font-size)',
                      height: 'auto',
                      '& .MuiChip-label': { whiteSpace: 'normal', py: '2px' },
                    }}
                  />
                ))}
              </Stack>
            </Stack>
          </M3Surface>
        </Collapse>

        {/* ── Suggerimento tecnico ── */}
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
              {finding.suggestedFix}
            </Typography>
          </M3Surface>
        </Collapse>

      </Stack>
    </M3Surface>
  );
};

// ── AuditPAPanel ──────────────────────────────────────────────────────────────

const AuditPAPanel: React.FC = () => {
  const { report, activeScenarioId, scenarios, setScenario, downloadJSON, runAudit } = useAuditSimulator();
  const { remediate } = useComplianceRuntime();
  const { drift, runs: historyRuns } = useAuditHistory();
  const { config: governanceConfig } = useGovernanceStore();
  const [findingsOpen, setFindingsOpen] = useState(true);
  const [recsOpen,     setRecsOpen]     = useState(true);
  const [pdfLoading,   setPdfLoading]   = useState(false);

  const handleExportPDF = async () => {
    setPdfLoading(true);
    try {
      await generateAuditVerbalePDF(report, governanceConfig);
    } finally {
      setPdfLoading(false);
    }
  };

  const sColor    = statusColor(report.complianceStatus);
  const rColor    = readinessColor(report.certificationReadiness);
  const auditTime = new Date(report.auditDate).toLocaleString('it-IT', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  return (
    <Stack gap="var(--md-sys-spacing-4)">

      {/* ── Selettore scenario ── */}
      <Stack gap="var(--md-sys-spacing-2)">
        <Typography variant="labelSmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
          Simula scenario
        </Typography>
        <Stack direction="row" gap="var(--md-sys-spacing-1)" flexWrap="wrap">
          {scenarios.map(s => (
            <Chip
              key={s.id}
              label={s.label}
              size="small"
              onClick={() => setScenario(s.id)}
              variant={activeScenarioId === s.id ? 'filled' : 'outlined'}
              sx={{
                cursor: 'pointer',
                bgcolor: activeScenarioId === s.id
                  ? 'var(--md-sys-color-primary-container)'
                  : 'transparent',
                color: activeScenarioId === s.id
                  ? 'var(--md-sys-color-on-primary-container)'
                  : 'var(--md-sys-color-on-surface-variant)',
                borderColor: activeScenarioId === s.id
                  ? 'var(--md-sys-color-primary)'
                  : 'var(--md-sys-color-outline)',
              }}
              aria-pressed={activeScenarioId === s.id}
              aria-label={`Seleziona scenario: ${s.label}`}
            />
          ))}
        </Stack>
        {/* Descrizione scenario attivo */}
        {scenarios.find(s => s.id === activeScenarioId) && (
          <Typography variant="bodySmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
            {scenarios.find(s => s.id === activeScenarioId)!.description}
          </Typography>
        )}
      </Stack>

      {/* ── Compliance Drift Indicator ── */}
      {historyRuns.length > 0 && (
        <M3Surface
          elevation={0}
          sx={{
            borderRadius: 'var(--md-sys-shape-corner-medium)',
            p: 'var(--md-sys-spacing-2)',
            bgcolor: 'var(--md-sys-color-surface-variant)',
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap="var(--md-sys-spacing-2)">
            <Stack direction="row" alignItems="center" gap="var(--md-sys-spacing-1)">
              <Box
                component="span"
                className="material-symbols-outlined"
                aria-hidden="true"
                sx={{ fontSize: 'var(--md-sys-icon-size-sm)', color: driftColorHelper(drift.status) }}
              >
                {driftIconHelper(drift.status)}
              </Box>
              <Typography variant="bodySmall" sx={{ color: driftColorHelper(drift.status) }}>
                {drift.message}
              </Typography>
            </Stack>
            <Typography variant="labelSmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
              {historyRuns.length} audit registrat{historyRuns.length === 1 ? 'o' : 'i'}
            </Typography>
          </Stack>
        </M3Surface>
      )}

      <Divider />

      {/* ── Header report PA ── */}
      <Stack direction="row" alignItems="center" gap="var(--md-sys-spacing-3)">

        {/* Score globale */}
        <Stack alignItems="center" gap={0} flexShrink={0}>
          <Typography
            variant="displaySmall"
            sx={{ color: sColor, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}
          >
            {report.overallScore}
          </Typography>
          <Typography variant="labelSmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
            /100
          </Typography>
        </Stack>

        {/* Status + readiness */}
        <Stack gap="var(--md-sys-spacing-1)" flexGrow={1}>
          <Stack direction="row" alignItems="center" gap="var(--md-sys-spacing-1)" flexWrap="wrap">
            <Chip
              label={statusLabel(report.complianceStatus)}
              size="small"
              sx={{
                bgcolor: sColor,
                color: 'white',
                fontWeight: 'var(--md-sys-typescale-weight-bold)',
                borderRadius: 'var(--md-sys-shape-corner-full)',
              }}
            />
            <Chip
              key={report.certificationReadiness}
              icon={
                <Box
                  component="span"
                  className="material-symbols-outlined"
                  aria-hidden="true"
                  sx={{ fontSize: 'var(--md-sys-icon-size-xs) !important', color: `${rColor} !important` }}
                >
                  {readinessIcon(report.certificationReadiness)}
                </Box>
              }
              label={`Cert: ${report.certificationReadiness}`}
              size="small"
              sx={{
                bgcolor: 'transparent',
                color: rColor,
                border: `1px solid ${rColor}`,
                borderRadius: 'var(--md-sys-shape-corner-full)',
              }}
            />
          </Stack>
          <Typography variant="bodySmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
            {report.passedRules}/{report.totalRules} regole · {report.auditType} · {auditTime}
          </Typography>
        </Stack>
      </Stack>

      {/* ── Pillole riassuntive findings ── */}
      <Stack direction="row" gap="var(--md-sys-spacing-2)" flexWrap="wrap">
        <M3Surface
          elevation={0}
          sx={{
            borderRadius: 'var(--md-sys-shape-corner-full)',
            px: 'var(--md-sys-spacing-3)',
            py: 'var(--md-sys-spacing-1)',
            bgcolor: report.blockingCount > 0
              ? 'var(--md-sys-color-error-container)'
              : 'var(--md-sys-color-surface-variant)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--md-sys-spacing-1)',
          }}
        >
          <Box
            component="span"
            className="material-symbols-outlined"
            aria-hidden="true"
            sx={{
              fontSize: 'var(--md-sys-icon-size-xs)',
              color: report.blockingCount > 0
                ? 'var(--md-sys-color-on-error-container)'
                : 'var(--md-sys-color-on-surface-variant)',
            }}
          >
            block
          </Box>
          <Typography
            variant="labelSmall"
            sx={{
              color: report.blockingCount > 0
                ? 'var(--md-sys-color-on-error-container)'
                : 'var(--md-sys-color-on-surface-variant)',
            }}
          >
            {report.blockingCount} Bloccant{report.blockingCount === 1 ? 'e' : 'i'}
          </Typography>
        </M3Surface>

        <M3Surface
          elevation={0}
          sx={{
            borderRadius: 'var(--md-sys-shape-corner-full)',
            px: 'var(--md-sys-spacing-3)',
            py: 'var(--md-sys-spacing-1)',
            bgcolor: 'var(--md-sys-color-surface-variant)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--md-sys-spacing-1)',
          }}
        >
          <Box
            component="span"
            className="material-symbols-outlined"
            aria-hidden="true"
            sx={{ fontSize: 'var(--md-sys-icon-size-xs)', color: 'var(--md-sys-color-tertiary)' }}
          >
            trending_up
          </Box>
          <Typography variant="labelSmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
            {report.improvingCount} Migliorativ{report.improvingCount === 1 ? 'a' : 'e'}
          </Typography>
        </M3Surface>
      </Stack>

      {/* ── Framework scores ── */}
      <Stack gap="var(--md-sys-spacing-2)">
        {(Object.entries(report.frameworkScores) as [string, number][]).map(([fw, score]) => {
          const barColor = score >= 80
            ? 'var(--md-sys-color-primary)'
            : score >= 60
              ? 'var(--md-sys-color-tertiary)'
              : 'var(--md-sys-color-error)';
          return (
            <Stack key={fw} gap="var(--md-sys-spacing-1)">
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="labelSmall" sx={{ color: 'var(--md-sys-color-on-surface)', fontWeight: 'var(--md-sys-typescale-weight-bold)' }}>
                  {frameworkLabel(fw)}
                </Typography>
                <Typography variant="labelSmall" sx={{ color: barColor, fontVariantNumeric: 'tabular-nums' }}>
                  {score}/100
                </Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={score}
                sx={{
                  height: 5,
                  borderRadius: 2,
                  bgcolor: 'var(--md-sys-color-surface-variant)',
                  '& .MuiLinearProgress-bar': { bgcolor: barColor, borderRadius: 2 },
                }}
              />
            </Stack>
          );
        })}
      </Stack>

      {/* ── Findings PA ── */}
      {report.findings.length > 0 && (
        <>
          <Divider />
          <Button
            variant="text"
            size="small"
            onClick={() => setFindingsOpen(v => !v)}
            endIcon={
              <Box component="span" className="material-symbols-outlined" aria-hidden="true"
                sx={{ fontSize: 'var(--md-sys-icon-size-sm)' }}>
                {findingsOpen ? 'expand_less' : 'expand_more'}
              </Box>
            }
            sx={{ alignSelf: 'flex-start', textTransform: 'none', color: 'var(--md-sys-color-error)' }}
            aria-expanded={findingsOpen}
            aria-label="Mostra/nascondi criticità audit PA"
          >
            {report.findings.length} Criticità PA
          </Button>
          <Collapse in={findingsOpen}>
            <Stack gap="var(--md-sys-spacing-2)">
              {report.findings.map(f => (
                <FindingCard key={f.ruleId} finding={f} onRemediate={remediate} />
              ))}
            </Stack>
          </Collapse>
        </>
      )}

      {report.findings.length === 0 && (
        <Stack direction="row" alignItems="center" gap="var(--md-sys-spacing-2)">
          <Box component="span" className="material-symbols-outlined" aria-hidden="true"
            sx={{ fontSize: 'var(--md-sys-icon-size-sm)', color: 'var(--md-sys-color-primary)' }}>
            verified_user
          </Box>
          <Typography variant="bodySmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
            Nessuna criticità PA rilevata — sistema certificabile.
          </Typography>
        </Stack>
      )}

      {/* ── Raccomandazioni ── */}
      {report.recommendations.length > 0 && (
        <>
          <Divider />
          <Button
            variant="text"
            size="small"
            onClick={() => setRecsOpen(v => !v)}
            endIcon={
              <Box component="span" className="material-symbols-outlined" aria-hidden="true"
                sx={{ fontSize: 'var(--md-sys-icon-size-sm)' }}>
                {recsOpen ? 'expand_less' : 'expand_more'}
              </Box>
            }
            sx={{ alignSelf: 'flex-start', textTransform: 'none', color: 'var(--md-sys-color-on-surface)' }}
            aria-expanded={recsOpen}
            aria-label="Mostra/nascondi raccomandazioni PA"
          >
            {report.recommendations.length} Raccomandazioni
          </Button>
          <Collapse in={recsOpen}>
            <Stack gap="var(--md-sys-spacing-2)">
              {report.recommendations.map((rec, i) => (
                <Stack
                  key={i}
                  direction="row"
                  gap="var(--md-sys-spacing-2)"
                  alignItems="flex-start"
                >
                  <Box component="span" className="material-symbols-outlined" aria-hidden="true"
                    sx={{
                      fontSize: 'var(--md-sys-icon-size-xs)',
                      color: 'var(--md-sys-color-tertiary)',
                      flexShrink: 0,
                      mt: '2px',
                    }}>
                    arrow_right_alt
                  </Box>
                  <Typography
                    variant="bodySmall"
                    sx={{ color: 'var(--md-sys-color-on-surface-variant)', lineHeight: 1.5 }}
                  >
                    {rec}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Collapse>
        </>
      )}

      {/* ── Export ── */}
      <Divider />
      <Stack direction="row" gap="var(--md-sys-spacing-2)" justifyContent="flex-end" flexWrap="wrap">
        <Tooltip title="Registra questo audit nel registro storico per il tracciamento del drift nel tempo">
          <Button
            variant="outlined"
            size="small"
            onClick={runAudit}
            startIcon={
              <Box component="span" className="material-symbols-outlined" aria-hidden="true"
                sx={{ fontSize: 'var(--md-sys-icon-size-sm)' }}>
                add_task
              </Box>
            }
            sx={
              {
                textTransform: 'none',
                borderColor: 'var(--md-sys-color-tertiary)',
                color: 'var(--md-sys-color-tertiary)',
                '&:hover': { borderColor: 'var(--md-sys-color-tertiary)', bgcolor: 'transparent' },
              }
            }
            aria-label="Registra questo audit nella storia"
          >
            Registra Audit
          </Button>
        </Tooltip>
        <Tooltip title="Scarica il verbale in formato JSON per documentazione ufficiale PA">
          <Button
            variant="outlined"
            size="small"
            onClick={downloadJSON}
            startIcon={
              <Box component="span" className="material-symbols-outlined" aria-hidden="true"
                sx={{ fontSize: 'var(--md-sys-icon-size-sm)' }}>
                download
              </Box>
            }
            sx={{ textTransform: 'none' }}
            aria-label="Esporta verbale audit PA in JSON"
          >
            Esporta Verbale JSON
          </Button>
        </Tooltip>
        <Tooltip title="Genera verbale PA in PDF — include governance, findings, evidenze e blocco firme">
          <Box component="span">
            <Button
              variant="contained"
              size="small"
              onClick={handleExportPDF}
              disabled={pdfLoading}
              startIcon={
                pdfLoading
                  ? <CircularProgress size={14} sx={{ color: 'white' }} aria-label="Generazione PDF in corso" />
                  : <Box component="span" className="material-symbols-outlined" aria-hidden="true"
                      sx={{ fontSize: 'var(--md-sys-icon-size-sm)' }}>
                      picture_as_pdf
                    </Box>
              }
              sx={
                {
                  textTransform: 'none',
                  bgcolor: 'var(--md-sys-color-primary)',
                  color: 'white',
                  '&:hover': { bgcolor: 'var(--md-sys-color-primary)' },
                  '&.Mui-disabled': { bgcolor: 'var(--md-sys-color-surface-variant)', color: 'var(--md-sys-color-on-surface-variant)' },
                }
              }
              aria-label="Genera e scarica verbale PA in formato PDF"
            >
              {pdfLoading ? 'Generazione…' : 'Esporta PDF'}
            </Button>
          </Box>
        </Tooltip>
      </Stack>

    </Stack>
  );
};

export default AuditPAPanel;
