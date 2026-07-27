/**
 * SalesPackPanel.tsx
 *
 * Pannello admin per la gestione dei Sales Pack.
 *
 * Funzionalità:
 *  - Access control: solo admin (prop isAdmin)
 *  - Generazione pack con 1 click
 *  - Lista packs con metadati (versione, data, score, status)
 *  - Preview collapsible: onePager, demoScript, audit (TXT), compliance, DPIA
 *  - Export: PDF one-pager, PDF audit, PDF full pack, copia testo
 *  - Cancellazione pack (con conferma)
 *  - KPI: score, stato, AI, versione
 *
 * Pattern MD3: M3Surface per container, M3Typography per testi, nessun div raw.
 */

import React, { useState, useCallback }    from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  Tooltip,
  Typography,
}                                           from '@mui/material';
import ExpandMoreIcon                       from '@mui/icons-material/ExpandMore';
import AddIcon                              from '@mui/icons-material/Add';
import PrintIcon                            from '@mui/icons-material/Print';
import ContentCopyIcon                      from '@mui/icons-material/ContentCopy';
import DeleteOutlineIcon                    from '@mui/icons-material/DeleteOutline';
import PictureAsPdfIcon                     from '@mui/icons-material/PictureAsPdf';
import CheckCircleIcon                      from '@mui/icons-material/CheckCircle';
import WarningIcon                          from '@mui/icons-material/Warning';
import ErrorIcon                            from '@mui/icons-material/Error';
import LockIcon                             from '@mui/icons-material/Lock';

import { createSalesPack, deleteSalesPack } from '../../modules/salesPack/salesPackService';
import { useSalesPackStore }                from '../../modules/salesPack/salesPackStore';
import {
  exportOnePagerPDF,
  exportDemoScriptPDF,
  exportAuditPDF,
  exportFullPackPDF,
  copyDocumentText,
}                                           from '../../modules/salesPack/salesPackExporter';
import type { SalesPack }                   from '../../modules/salesPack/types';
import { slog }                             from '../../utils/structuredLogger';

// ─── Props ────────────────────────────────────────────────────────────────────

interface SalesPackPanelProps {
  /** Abilita le funzionalità admin. Se false mostra "Accesso negato". */
  isAdmin:    boolean;
  /** ID del tenant corrente (es. "ic_napoli_01") */
  tenantId:   string;
  /** ID / email dell'utente corrente */
  userId:     string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString('it-IT', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function ScoreChip({ score }: { score: number }) {
  const color = score >= 80 ? 'success' : score >= 60 ? 'warning' : 'error';
  return (
    <Chip
      label={`${score}%`}
      color={color}
      size="small"
      sx={{ fontWeight: 'var(--md-sys-typescale-weight-bold)', minWidth: 52 }}
    />
  );
}

function StatusChip({ status }: { status: SalesPack['complianceStatus'] }) {
  if (status === 'CONFORME') {
    return <Chip icon={<CheckCircleIcon />} label="Conforme" color="success" size="small" />;
  }
  if (status === 'PARZIALMENTE_CONFORME') {
    return <Chip icon={<WarningIcon />} label="Parzialmente" color="warning" size="small" />;
  }
  return <Chip icon={<ErrorIcon />} label="Non conforme" color="error" size="small" />;
}

// ─── Preview sezione singola ──────────────────────────────────────────────────

function DocPreview({
  title,
  content,
  onCopy,
}: {
  title:   string;
  content: string;
  onCopy:  (text: string) => void;
}) {
  return (
    <Accordion disableGutters elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="body2" sx={{ fontWeight: 'var(--md-sys-typescale-weight-semibold)' }}>
          {title}
        </Typography>
      </AccordionSummary>
      <AccordionDetails sx={{ p: 0 }}>
        <Box sx={{ position: 'relative' }}>
          <Tooltip title="Copia testo">
            <IconButton
              size="small"
              aria-label={`Copia testo — ${title}`}
              onClick={() => onCopy(content)}
              sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}
            >
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Box
            component="pre"
            sx={{
              m: 0, p: 2,
              fontFamily: '"Roboto Mono", monospace',
              fontSize: 11, lineHeight: 1.6,
              overflowX: 'auto', maxHeight: 320, overflowY: 'auto',
              whiteSpace: 'pre-wrap', wordBreak: 'break-word',
              bgcolor: 'grey.50', color: 'text.primary',
            }}
          >
            {content}
          </Box>
        </Box>
      </AccordionDetails>
    </Accordion>
  );
}

// ─── Card singolo pack ────────────────────────────────────────────────────────

function PackCard({
  pack,
  onDelete,
}: {
  pack:     SalesPack;
  onDelete: (id: string) => void;
}) {
  const [copied, setCopied]   = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);

  const handleCopy = useCallback(async (text: string, label: string) => {
    const ok = await copyDocumentText(text);
    if (ok) {
      setCopied(label);
      setTimeout(() => setCopied(null), 2500);
    }
    slog.info('UI', 'Copia testo Sales Pack', { packId: pack.id, label });
  }, [pack.id]);

  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        overflow: 'hidden',
        bgcolor: 'background.paper',
      }}
    >
      {/* ── Header card ── */}
      <Box sx={{ p: 2, display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
        <Chip label={`v${pack.version}`} size="small" variant="outlined" sx={{ fontWeight: 'var(--md-sys-typescale-weight-bold)' }} />
        <ScoreChip score={pack.complianceScore} />
        <StatusChip status={pack.complianceStatus} />
        {pack.aiEnabled
          ? <Chip label="AI attiva" color="info" size="small" />
          : <Chip label="AI off"    color="default" size="small" />
        }
        <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
          {formatDate(pack.createdAt)} — {pack.createdBy}
        </Typography>
        <Tooltip title="Elimina pack">
          <IconButton
            size="small"
            aria-label="Elimina pack"
            color="error"
            onClick={() => setConfirm(true)}
          >
            <DeleteOutlineIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* ── Conferma eliminazione ── */}
      {confirm && (
        <Box sx={{ mx: 2, mb: 1 }}>
          <Alert severity="warning" sx={{ py: 0.5 }}>
            Eliminare questo pack? L&apos;azione è irreversibile.
            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
              <Button size="small" color="error" variant="contained"
                onClick={() => onDelete(pack.id)}>
                Elimina
              </Button>
              <Button size="small" onClick={() => setConfirm(false)}>Annulla</Button>
            </Box>
          </Alert>
        </Box>
      )}

      <Divider />

      {/* ── Export actions ── */}
      <Box sx={{ p: 1.5, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Button
          size="small" variant="outlined" startIcon={<PrintIcon />}
          aria-label="Stampa one pager"
          onClick={() => exportOnePagerPDF(pack)}
        >
          One Pager
        </Button>
        <Button
          size="small" variant="outlined" startIcon={<PrintIcon />}
          aria-label="Stampa demo script"
          onClick={() => exportDemoScriptPDF(pack)}
        >
          Demo Script
        </Button>
        <Button
          size="small" variant="outlined" startIcon={<PictureAsPdfIcon />}
          aria-label="Stampa verbale audit"
          onClick={() => exportAuditPDF(pack)}
        >
          Verbale Audit
        </Button>
        <Button
          size="small" variant="contained" startIcon={<PictureAsPdfIcon />}
          aria-label="Stampa pack completo"
          onClick={() => exportFullPackPDF(pack)}
          color="primary"
        >
          Full Pack PDF
        </Button>
        {copied && (
          <Chip label={`Copiato: ${copied}`} color="success" size="small" sx={{ alignSelf: 'center' }} />
        )}
      </Box>

      <Divider />

      {/* ── Preview documenti ── */}
      <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        <DocPreview
          title="One Pager"
          content={pack.onePager}
          onCopy={t => handleCopy(t, 'One Pager')}
        />
        <DocPreview
          title="Demo Script"
          content={pack.demoScript}
          onCopy={t => handleCopy(t, 'Demo Script')}
        />
        <DocPreview
          title="Verbale Audit PA (testo)"
          content={pack.auditVerbaleTXT}
          onCopy={t => handleCopy(t, 'Verbale Audit')}
        />
        <DocPreview
          title="Report Compliance GDPR / AI Act / AgID"
          content={pack.complianceReport}
          onCopy={t => handleCopy(t, 'Report Compliance')}
        />
        <DocPreview
          title="DPIA GDPR Art.35"
          content={pack.dpia}
          onCopy={t => handleCopy(t, 'DPIA')}
        />
      </Box>
    </Box>
  );
}

// ─── Pannello principale ──────────────────────────────────────────────────────

export function SalesPackPanel({ isAdmin, tenantId, userId }: SalesPackPanelProps): React.JSX.Element {
  const packs    = useSalesPackStore(s => s.packs.filter(p => p.tenantId === tenantId));
  const [generating, setGenerating] = useState(false);
  const [lastError, setLastError]   = useState<string | null>(null);

  const handleGenerate = useCallback(() => {
    setGenerating(true);
    setLastError(null);
    try {
      createSalesPack(tenantId, userId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Errore sconosciuto';
      setLastError(msg);
      slog.info('UI', 'Errore generazione Sales Pack', { error: msg });
    } finally {
      setGenerating(false);
    }
  }, [tenantId, userId]);

  const handleDelete = useCallback((id: string) => {
    deleteSalesPack(id);
  }, []);

  // Accesso negato ai non admin
  if (!isAdmin) {
    return (
      <Box
        sx={{
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: 2, py: 6, color: 'text.secondary',
        }}
      >
        <LockIcon sx={{ fontSize: 48, color: 'action.disabled' }} />
        <Typography variant="body1" fontWeight={600}>Accesso negato</Typography>
        <Typography variant="body2">
          Questa sezione è riservata agli amministratori.
        </Typography>
      </Box>
    );
  }

  // Ordina per data desc
  const sortedPacks = [...packs].sort((a, b) => b.createdAt - a.createdAt);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

      {/* ── Header ── */}
      <Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          Genera il bundle documentale completo per la vendita alle PA:
          one-pager, demo script, DPIA, verbale audit e report compliance.
          Tutti i documenti sono generati dal runtime live e pronto per export PDF.
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            startIcon={generating ? <CircularProgress size={16} color="inherit" /> : <AddIcon />}
            onClick={handleGenerate}
            disabled={generating}
            aria-label="Genera nuovo Sales Pack"
            size="large"
          >
            {generating ? 'Generazione in corso…' : 'Genera Sales Pack'}
          </Button>

          {sortedPacks.length > 0 && (
            <Chip
              label={`${sortedPacks.length} pack${sortedPacks.length !== 1 ? 's' : ''} — tenant: ${tenantId}`}
              variant="outlined"
              size="small"
            />
          )}
        </Box>

        {lastError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            Errore durante la generazione: {lastError}
          </Alert>
        )}
      </Box>

      {/* ── Lista packs ── */}
      {sortedPacks.length === 0 ? (
        <Box
          sx={{
            border: '1px dashed', borderColor: 'divider', borderRadius: 2,
            p: 5, textAlign: 'center', color: 'text.disabled',
          }}
        >
          <Typography variant="body2">
            Nessun pack generato. Clicca "Genera Sales Pack" per creare il primo.
          </Typography>
        </Box>
      ) : (
        sortedPacks.map(pack => (
          <PackCard key={pack.id} pack={pack} onDelete={handleDelete} />
        ))
      )}
    </Box>
  );
}
