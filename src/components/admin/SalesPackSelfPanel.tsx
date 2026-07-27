/**
 * SalesPackSelfPanel.tsx
 *
 * Pannello "Self" per il Sales Pack: mostra lo stato attuale del pack
 * più recente del tenant, suggerisce azioni contestuali e permette
 * upload di contenuti aggiuntivi (note, allegati testo).
 *
 * Props:
 *   tenantId   — ID del tenant corrente
 *   userId     — ID/email utente loggato
 *   isAdmin    — true se l'utente è admin
 *
 * MD3 compliant: M3Surface, M3Typography, MUI v7 only.
 */

import React, { useEffect, useMemo, useState, useRef } from 'react';
import {
  Box, Button, Chip, CircularProgress, Divider, Stack,
  TextField, Accordion, AccordionSummary, AccordionDetails,
  Alert, Typography,
} from '@mui/material';
import ExpandMoreIcon              from '@mui/icons-material/ExpandMore';
import LightbulbOutlinedIcon       from '@mui/icons-material/LightbulbOutlined';
import UploadFileOutlinedIcon      from '@mui/icons-material/UploadFileOutlined';
import VerifiedOutlinedIcon        from '@mui/icons-material/VerifiedOutlined';
import WarningAmberOutlinedIcon    from '@mui/icons-material/WarningAmberOutlined';
import CheckCircleOutlineIcon      from '@mui/icons-material/CheckCircleOutline';

import M3Surface from '../../components/ui/M3Surface';
// M3Typography variant names (titleLarge, bodySmall…) are theme-augmented in muiTheme.ts
const M3Typography = Typography;

import { useSalesPackStore }       from '../../modules/salesPack/salesPackStore';
import { getSuggestedActions }     from '../../modules/salesPack/salesPackActionEngine';
import { createSalesPack }         from '../../modules/salesPack/salesPackService';
import { exportFullPackPDF }       from '../../modules/salesPack/salesPackExporter';
import type { PackAction }         from '../../modules/salesPack/salesPackActionEngine';
import type { SalesPack }          from '../../modules/salesPack/types';

// ─── Props ────────────────────────────────────────────────────────────────────

interface SalesPackSelfPanelProps {
  tenantId: string;
  userId:   string;
  isAdmin:  boolean;
}

// ─── Priority chip ────────────────────────────────────────────────────────────

const PRIORITY_COLOR: Record<PackAction['priority'], 'error' | 'warning' | 'info' | 'default'> = {
  urgent: 'error',
  high:   'warning',
  medium: 'info',
  low:    'default',
};

const PRIORITY_LABEL: Record<PackAction['priority'], string> = {
  urgent: 'Urgente',
  high:   'Alta',
  medium: 'Media',
  low:    'Bassa',
};

// ─── Status chip ──────────────────────────────────────────────────────────────

function StatusChip({ status }: { status: SalesPack['complianceStatus'] }) {
  const map = {
    CONFORME:              { label: 'Conforme',       color: 'success' },
    PARZIALMENTE_CONFORME: { label: 'Parz. conforme', color: 'warning' },
    NON_CONFORME:          { label: 'Non conforme',   color: 'error'   },
  } as const;
  const { label, color } = map[status];
  return <Chip label={label} color={color} size="small" />;
}

// ─── Upload area ──────────────────────────────────────────────────────────────

function UploadTextArea({
  onUpload,
}: {
  onUpload: (content: string, label: string) => void;
}) {
  const [text,  setText]  = useState('');
  const [label, setLabel] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileRead = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      setText(ev.target?.result as string ?? '');
      setLabel(file.name);
    };
    reader.readAsText(file);
  };

  return (
    <Stack spacing={2}>
      <M3Typography variant="labelMedium" sx={{ color: 'text.secondary' }}>
        Carica contenuto aggiuntivo (testo o file .txt / .md)
      </M3Typography>
      <Stack direction="row" spacing={1} alignItems="center">
        <TextField
          label="Etichetta contenuto"
          value={label}
          onChange={e => setLabel(e.target.value)}
          size="small"
          sx={{ flex: 1 }}
          inputProps={{ 'aria-label': 'Etichetta contenuto aggiuntivo' }}
        />
        <Button
          component="label"
          variant="outlined"
          size="small"
          startIcon={<UploadFileOutlinedIcon />}
          aria-label="Carica file di testo"
        >
          File
          <input
            ref={fileRef}
            type="file"
            accept=".txt,.md,.csv"
            hidden
            onChange={handleFileRead}
          />
        </Button>
      </Stack>
      <TextField
        multiline
        minRows={3}
        maxRows={8}
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Incolla o scrivi contenuto da aggiungere al pack..."
        size="small"
        fullWidth
        inputProps={{ 'aria-label': 'Contenuto aggiuntivo da caricare' }}
      />
      <Button
        variant="contained"
        size="small"
        disabled={!text.trim() || !label.trim()}
        onClick={() => { onUpload(text, label); setText(''); setLabel(''); }}
        aria-label="Aggiungi contenuto al pack"
      >
        Aggiungi al pack
      </Button>
    </Stack>
  );
}

// ─── Action card ──────────────────────────────────────────────────────────────

function ActionCard({
  action,
  onCta,
}: {
  action:  PackAction;
  onCta:   (action: PackAction) => void;
}) {
  return (
    <Box
      sx={{
        p: 2, border: 1,
        borderColor: action.priority === 'urgent' ? 'error.main'
          : action.priority === 'high' ? 'warning.main'
          : 'divider',
        borderRadius: 2,
        bgcolor: action.priority === 'urgent' ? 'error.50'
          : action.priority === 'high' ? 'warning.50'
          : 'background.paper',
      }}
    >
      <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ mb: 1 }}>
        {action.priority === 'urgent' ? (
          <WarningAmberOutlinedIcon color="error" sx={{ fontSize: 20, mt: 0.5 }} aria-hidden />
        ) : action.priority === 'high' ? (
          <WarningAmberOutlinedIcon color="warning" sx={{ fontSize: 20, mt: 0.5 }} aria-hidden />
        ) : (
          <LightbulbOutlinedIcon color="action" sx={{ fontSize: 20, mt: 0.5 }} aria-hidden />
        )}
        <Box sx={{ flex: 1 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
            <M3Typography variant="labelLarge">{action.label}</M3Typography>
            <Chip
              label={PRIORITY_LABEL[action.priority]}
              color={PRIORITY_COLOR[action.priority]}
              size="small"
            />
            {action.adminOnly && (
              <Chip label="Admin" variant="outlined" size="small" />
            )}
          </Stack>
          <M3Typography variant="bodySmall" sx={{ color: 'text.secondary', mb: 1 }}>
            {action.description}
          </M3Typography>
          <Button
            variant="outlined"
            size="small"
            onClick={() => onCta(action)}
            aria-label={action.cta}
          >
            {action.cta}
          </Button>
        </Box>
      </Stack>
    </Box>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function SalesPackSelfPanel({ tenantId, userId, isAdmin }: SalesPackSelfPanelProps): React.JSX.Element {
  const packs        = useSalesPackStore(s => s.packs.filter(p => p.tenantId === tenantId));
  const latestPack   = useMemo(() => [...packs].sort((a, b) => b.createdAt - a.createdAt)[0], [packs]);

  const [actions,    setActions]    = useState<PackAction[]>([]);
  const [loadingAct, setLoadingAct] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [uploads,    setUploads]    = useState<{ label: string; content: string }[]>([]);
  const [ctaFeedback, setCtaFeedback] = useState<string | null>(null);

  // Carica suggerimenti ogni volta che il pack cambia
  useEffect(() => {
    if (!latestPack) {
      setActions([]);
      return;
    }
    setLoadingAct(true);
    getSuggestedActions(latestPack, isAdmin)
      .then(setActions)
      .finally(() => setLoadingAct(false));
  }, [latestPack, isAdmin]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      createSalesPack(tenantId, userId);
    } finally {
      setGenerating(false);
    }
  };

  const handleUpload = (content: string, label: string) => {
    setUploads(prev => [...prev, { label, content }]);
    setCtaFeedback(`"${label}" aggiunto al pack.`);
    setTimeout(() => setCtaFeedback(null), 4000);
  };

  const handleCta = (action: PackAction) => {
    if (action.type === 'EXPORT_PDF' && latestPack) {
      exportFullPackPDF(latestPack);
    } else if (action.type === 'REGENERATE_PACK') {
      void handleGenerate();
    }
    setCtaFeedback(`Azione avviata: ${action.label}`);
    setTimeout(() => setCtaFeedback(null), 4000);
  };

  // ── render aria label per screen reader ──────────────────────────────────
  return (
    <M3Surface
      elevation={0}
      sx={{ p: 3, borderRadius: 3, bgcolor: 'background.paper' }}
      aria-label="Sales Pack Self Panel"
    >
      {/* ── Header ── */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Stack>
          <M3Typography variant="titleLarge">Sales Pack</M3Typography>
          <M3Typography variant="bodySmall" sx={{ color: 'text.secondary' }}>
            {packs.length > 0
              ? `${packs.length} pack generati per questo tenant`
              : 'Nessun pack generato ancora'}
          </M3Typography>
        </Stack>
        {isAdmin && (
          <Button
            variant="contained"
            onClick={() => void handleGenerate()}
            disabled={generating}
            startIcon={generating ? <CircularProgress size={16} aria-hidden /> : undefined}
            aria-label={generating ? 'Generazione in corso' : 'Genera nuovo Sales Pack'}
          >
            {generating ? 'Generando…' : 'Genera pack'}
          </Button>
        )}
      </Stack>

      {ctaFeedback && (
        <Alert
          severity="success"
          icon={<CheckCircleOutlineIcon fontSize="small" aria-hidden />}
          sx={{ mb: 2 }}
          aria-live="polite"
        >
          {ctaFeedback}
        </Alert>
      )}

      {/* ── Pack corrente ── */}
      {latestPack ? (
        <Box sx={{ mb: 3 }}>
          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" sx={{ mb: 1 }}>
            <VerifiedOutlinedIcon color="primary" aria-hidden />
            <M3Typography variant="titleMedium">
              Pack v{latestPack.version}
            </M3Typography>
            <Chip label={`${latestPack.complianceScore}%`} size="small" color="primary" />
            <StatusChip status={latestPack.complianceStatus} />
            <M3Typography variant="bodySmall" sx={{ color: 'text.secondary' }}>
              {new Date(latestPack.createdAt).toLocaleDateString('it-IT')}
            </M3Typography>
          </Stack>
          <M3Typography variant="bodySmall" sx={{ color: 'text.secondary' }}>
            Autore: {latestPack.createdBy} &nbsp;|&nbsp; Tenant: {latestPack.tenantId}
          </M3Typography>
        </Box>
      ) : (
        <Alert severity="info" sx={{ mb: 3 }} aria-live="polite">
          Nessun pack disponibile. {isAdmin ? 'Clicca "Genera pack" per crearne uno.' : 'Contatta un amministratore.'}
        </Alert>
      )}

      <Divider sx={{ mb: 3 }} />

      {/* ── Azioni suggerite ── */}
      <M3Typography variant="titleSmall" sx={{ mb: 2 }}>
        Azioni suggerite
      </M3Typography>

      {loadingAct ? (
        <Stack alignItems="center" sx={{ py: 2 }}>
          <CircularProgress size={24} aria-label="Caricamento suggerimenti" />
        </Stack>
      ) : actions.length === 0 ? (
        <Alert severity="success" icon={<CheckCircleOutlineIcon aria-hidden />}>
          {latestPack
            ? 'Nessuna azione richiesta — tutto in ordine.'
            : 'Genera il primo pack per ricevere suggerimenti.'}
        </Alert>
      ) : (
        <Stack spacing={1.5}>
          {actions.map(action => (
            <ActionCard key={action.id} action={action} onCta={handleCta} />
          ))}
        </Stack>
      )}

      <Divider sx={{ my: 3 }} />

      {/* ── Upload contenuti ── */}
      <Accordion disableGutters elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2 }}>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon aria-hidden />}
          aria-controls="upload-panel-content"
          id="upload-panel-header"
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <UploadFileOutlinedIcon fontSize="small" aria-hidden />
            <M3Typography variant="labelLarge">
              Contenuti aggiuntivi ({uploads.length})
            </M3Typography>
          </Stack>
        </AccordionSummary>
        <AccordionDetails id="upload-panel-content">
          <UploadTextArea onUpload={handleUpload} />
          {uploads.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <M3Typography variant="labelSmall" sx={{ color: 'text.secondary', mb: 1 }}>
                Contenuti caricati:
              </M3Typography>
              <Stack spacing={0.5}>
                {uploads.map((u, i) => (
                  <Chip
                    key={i}
                    label={u.label}
                    variant="outlined"
                    size="small"
                    onDelete={() => setUploads(prev => prev.filter((_, j) => j !== i))}
                  />
                ))}
              </Stack>
            </Box>
          )}
        </AccordionDetails>
      </Accordion>
    </M3Surface>
  );
}
