/**
 * AuditVerbalePanel.tsx — C11: Pannello generazione verbale audit PA.
 *
 * Permette di:
 *  - Selezionare uno scenario di audit (produzione live o simulazioni)
 *  - Eseguire la simulazione (runAuditSimulation)
 *  - Visualizzare un'anteprima del verbale in testo/HTML
 *  - Stampare via browser (window.print) o copiare il testo
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from '@mui/material';
import PrintIcon         from '@mui/icons-material/Print';
import ContentCopyIcon   from '@mui/icons-material/ContentCopy';
import PlayArrowIcon     from '@mui/icons-material/PlayArrow';
import CheckCircleIcon   from '@mui/icons-material/CheckCircle';
import WarningIcon       from '@mui/icons-material/Warning';
import ErrorIcon         from '@mui/icons-material/Error';

import { AUDIT_SCENARIOS, runAuditSimulation } from '../../self-compliance/runtime/audit/auditSimulator';
import { useComplianceStore }                   from '../../self-compliance/useComplianceStore';
import { generateVerbaleHTML, generateVerbaleTXT } from '../../services/auditVerbaleGenerator';
import type { PALiveAuditReport }               from '../../self-compliance/runtime/audit/types';
import { slog }                                 from '../../utils/structuredLogger';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusChip(report: PALiveAuditReport) {
  const props: { label: string; color: 'success' | 'warning' | 'error'; icon: React.ReactElement } =
    report.complianceStatus === 'CONFORME'
      ? { label: 'Conforme',              color: 'success', icon: <CheckCircleIcon fontSize="small" /> }
      : report.complianceStatus === 'PARZIALMENTE_CONFORME'
      ? { label: 'Parzialmente conforme', color: 'warning', icon: <WarningIcon     fontSize="small" /> }
      : { label: 'Non conforme',          color: 'error',   icon: <ErrorIcon        fontSize="small" /> };
  return <Chip icon={props.icon} label={props.label} color={props.color} size="small" />;
}

function readinessChip(report: PALiveAuditReport) {
  const map: Record<PALiveAuditReport['certificationReadiness'], 'success' | 'warning' | 'error'> = {
    PRONTO:       'success',
    CONDIZIONATO: 'warning',
    NON_PRONTO:   'error',
  };
  const labelMap = { PRONTO: 'Pronto', CONDIZIONATO: 'Condizionato', NON_PRONTO: 'Non pronto' };
  return (
    <Chip
      label={`PA: ${labelMap[report.certificationReadiness]}`}
      color={map[report.certificationReadiness]}
      size="small"
    />
  );
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function AuditVerbalePanel(): React.JSX.Element {
  const db                        = useComplianceStore.getState().db;
  const [scenarioId, setScenarioId] = useState<string>(AUDIT_SCENARIOS[0].id);
  const [report, setReport]       = useState<PALiveAuditReport | null>(null);
  const [running, setRunning]     = useState(false);
  const [copied, setCopied]       = useState(false);
  const [previewMode, setPreviewMode] = useState<'text' | 'html'>('text');
  const printRef                  = useRef<HTMLIFrameElement | null>(null);

  const selectedScenario = AUDIT_SCENARIOS.find(s => s.id === scenarioId)!;

  const runAudit = useCallback(() => {
    setRunning(true);
    setReport(null);
    try {
      const result = runAuditSimulation(db, scenarioId);
      setReport(result);
      slog.info('AUDIT', 'Verbale audit generato', {
        scenarioId,
        score: result.overallScore,
        status: result.complianceStatus,
      });
    } finally {
      setRunning(false);
    }
  }, [db, scenarioId]);

  const handlePrint = useCallback(() => {
    if (!report) return;
    const html = generateVerbaleHTML(report);
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.top      = '-9999px';
    iframe.style.left     = '-9999px';
    iframe.style.width    = '0';
    iframe.style.height   = '0';
    document.body.appendChild(iframe);
    iframe.contentDocument?.open();
    iframe.contentDocument?.write(html);
    iframe.contentDocument?.close();
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => document.body.removeChild(iframe), 5000);
    }, 500);
    slog.info('AUDIT', 'Stampa verbale avviata', { scenarioId });
  }, [report, scenarioId]);

  const handleCopy = useCallback(async () => {
    if (!report) return;
    const txt = generateVerbaleTXT(report);
    try {
      await navigator.clipboard.writeText(txt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      slog.info('AUDIT', 'Verbale copiato negli appunti', { scenarioId });
    } catch {
      slog.info('AUDIT', 'Copia verbale fallita (clipboard API non disponibile)', {});
    }
  }, [report, scenarioId]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

      {/* ─ Selezione scenario ─ */}
      <Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          Seleziona lo scenario e genera il verbale formale di audit PA.
          Il verbale include findings, raccomandazioni e sezione firme.
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 260 }}>
            <InputLabel id="scenario-label">Scenario audit</InputLabel>
            <Select
              labelId="scenario-label"
              value={scenarioId}
              label="Scenario audit"
              onChange={e => setScenarioId(e.target.value)}
            >
              {AUDIT_SCENARIOS.map(s => (
                <MenuItem key={s.id} value={s.id}>
                  {s.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="contained"
            startIcon={running ? <CircularProgress size={16} color="inherit" /> : <PlayArrowIcon />}
            onClick={runAudit}
            disabled={running}
            aria-label="Esegui audit e genera verbale"
          >
            {running ? 'Calcolo in corso…' : 'Genera verbale'}
          </Button>
        </Box>

        {/* descrizione scenario selezionato */}
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
          {selectedScenario.description ?? 'Scenario audit PA.'}
        </Typography>
      </Box>

      {/* ─ Risultato KPI ─ */}
      {report && (
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <Chip
            label={`Score: ${Math.round(report.overallScore)}%`}
            color={report.overallScore >= 80 ? 'success' : report.overallScore >= 60 ? 'warning' : 'error'}
            size="small"
            sx={{ fontWeight: 'var(--md-sys-typescale-weight-bold)', fontSize: 'var(--md-sys-typescale-body-small-font-size)' }}
          />
          {statusChip(report)}
          {readinessChip(report)}
          <Chip
            label={`${report.blockingCount} bloccanti`}
            color={report.blockingCount > 0 ? 'error' : 'success'}
            size="small"
          />
          <Chip
            label={`${report.improvingCount} migliorativi`}
            color={report.improvingCount > 0 ? 'warning' : 'success'}
            size="small"
          />
        </Box>
      )}

      {/* ─ Azioni stampa / copia ─ */}
      {report && (
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
          <Button
            variant="outlined"
            startIcon={<PrintIcon />}
            onClick={handlePrint}
            aria-label="Stampa verbale PDF"
            size="small"
          >
            Stampa / Salva PDF
          </Button>
          <Button
            variant="outlined"
            startIcon={<ContentCopyIcon />}
            onClick={handleCopy}
            aria-label={copied ? 'Testo copiato' : 'Copia testo verbale'}
            size="small"
            color={copied ? 'success' : 'primary'}
          >
            {copied ? 'Copiato!' : 'Copia testo'}
          </Button>
          <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
            <Button
              size="small"
              variant={previewMode === 'text' ? 'contained' : 'outlined'}
              onClick={() => setPreviewMode('text')}
              aria-label="Anteprima testo"
            >
              Testo
            </Button>
            <Button
              size="small"
              variant={previewMode === 'html' ? 'contained' : 'outlined'}
              onClick={() => setPreviewMode('html')}
              aria-label="Anteprima HTML"
            >
              Anteprima
            </Button>
          </Box>
        </Box>
      )}

      {/* ─ Anteprima verbale ─ */}
      {report && (
        <Box
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            overflow: 'hidden',
            bgcolor: 'background.paper',
          }}
        >
          {previewMode === 'text' ? (
            <Box
              component="pre"
              sx={{
                m: 0,
                p: 2,
                fontFamily: '"Roboto Mono", monospace',
                fontSize: 'var(--md-sys-typescale-label-small-font-size)',
                lineHeight: 1.6,
                overflowX: 'auto',
                maxHeight: 480,
                overflowY: 'auto',
                color: 'text.primary',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {generateVerbaleTXT(report)}
            </Box>
          ) : (
            <Box
              component="iframe"
              ref={printRef}
              title="Anteprima verbale audit PA"
              srcDoc={generateVerbaleHTML(report)}
              sx={{
                width: '100%',
                height: 520,
                border: 'none',
                display: 'block',
              }}
            />
          )}
        </Box>
      )}

      {/* ─ Stato vuoto ─ */}
      {!report && !running && (
        <Box
          sx={{
            border: '1px dashed',
            borderColor: 'divider',
            borderRadius: 1,
            p: 4,
            textAlign: 'center',
            color: 'text.disabled',
          }}
        >
          <Typography variant="body2">
            Seleziona uno scenario e avvia la generazione per visualizzare il verbale.
          </Typography>
        </Box>
      )}
    </Box>
  );
}
