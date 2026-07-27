/**
 * CognitiveLayerPanel.tsx
 *
 * Pannello admin per il Cognitive Layer.
 * Mostra le ultime entry classificate, i suggerimenti, e permette l'ingestion
 * manuale di un testo per test/demo.
 *
 * Props:
 *   tenantId  — tenant dell'unità organizzativa
 *   isAdmin   — se true mostra i controlli di ingestion manuale
 */

import React, { useState } from 'react';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Stack,
  TextField,
  Typography,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Collapse,
} from '@mui/material';
import {
  Psychology as PsychologyIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Lightbulb as InsightIcon,
  Warning as WarningIcon,
  ArrowForward as NextStepIcon,
  Link as CrossDomainIcon,
} from '@mui/icons-material';
import M3Surface from '../../components/ui/M3Surface';

import { useCognitiveStore } from '../../modules/cognitiveLayer/cognitiveStore';
import { ingestInput } from '../../modules/cognitiveLayer/cognitiveService';
import type { CognitiveEntry, CognitiveSuggestion } from '../../modules/cognitiveLayer/types';

const M3Typography = Typography;

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  tenantId: string;
  isAdmin: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DOMAIN_COLORS: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
  compliance: 'error',
  commercial: 'success',
  pedagogical: 'primary',
  administrative: 'secondary',
  technical: 'info',
  operational: 'warning',
  unknown: 'default',
};

const CONFIDENCE_COLORS: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
  high: 'success',
  medium: 'warning',
  low: 'default',
};

function SuggestionIcon({ type }: { type: string }) {
  if (type === 'WARNING') return <WarningIcon fontSize="small" color="warning" />;
  if (type === 'INSIGHT') return <InsightIcon fontSize="small" color="info" />;
  if (type === 'CROSS_DOMAIN') return <CrossDomainIcon fontSize="small" color="secondary" />;
  return <NextStepIcon fontSize="small" color="action" />;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CognitiveLayerPanel({ tenantId, isAdmin }: Props): React.JSX.Element {
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSuggestions, setLastSuggestions] = useState<CognitiveSuggestion[] | null>(null);
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);

  const entries = useCognitiveStore(s => s.getByTenant(tenantId));
  const recent = [...entries].sort((a, b) => b.enteredAt - a.enteredAt).slice(0, 20);

  async function handleIngest() {
    const trimmed = inputText.trim();
    if (!trimmed) return;
    setLoading(true);
    setError(null);
    setLastSuggestions(null);
    try {
      const { suggestions } = await ingestInput({
        tenantId,
        sourceId: `admin_manual_${Date.now()}`,
        inputType: 'text',
        content: trimmed,
        label: 'Ingestion manuale',
      });
      setLastSuggestions(suggestions);
      setInputText('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore durante l\'ingestion');
    } finally {
      setLoading(false);
    }
  }

  function toggleExpand(id: string) {
    setExpandedEntry(prev => (prev === id ? null : id));
  }

  function formatDate(ts: number): string {
    return new Date(ts).toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' });
  }

  return (
    <Stack spacing={3}>
      {/* Header */}
      <M3Surface elevation={0} sx={{ p: 3, borderRadius: 3 }} aria-label="Cognitive Layer header">
        <Stack direction="row" spacing={2} alignItems="center">
          <PsychologyIcon color="primary" fontSize="large" aria-hidden />
          <Box>
            <M3Typography variant="titleLarge">Cognitive Layer</M3Typography>
            <M3Typography variant="bodySmall" color="text.secondary">
              Classificazione intelligente degli input — {entries.length} entry registrate
            </M3Typography>
          </Box>
        </Stack>
      </M3Surface>

      {/* Manual ingest (admin only) */}
      {isAdmin && (
        <M3Surface elevation={0} sx={{ p: 3, borderRadius: 3 }} aria-label="Ingestion manuale testo">
          <M3Typography variant="titleMedium" gutterBottom>
            Ingestion manuale
          </M3Typography>
          <M3Typography variant="bodySmall" color="text.secondary" sx={{ mb: 2 }}>
            Inserisci un testo da classificare e analizzare. Il sistema determinerà dominio,
            confidenza e suggerimenti automatici.
          </M3Typography>
          <Stack spacing={2}>
            <TextField
              multiline
              rows={4}
              fullWidth
              label="Testo da analizzare"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              disabled={loading}
              placeholder="Es: Questa UDA include una valutazione per competenze e rubrica..."
              inputProps={{ 'aria-label': 'Testo da classificare' }}
            />
            <Box>
              <Button
                variant="contained"
                onClick={handleIngest}
                disabled={loading || !inputText.trim()}
                startIcon={loading ? <CircularProgress size={16} aria-hidden /> : <PsychologyIcon aria-hidden />}
                aria-label="Avvia classificazione cognitiva"
              >
                {loading ? 'Analisi in corso…' : 'Analizza'}
              </Button>
            </Box>

            {error && (
              <Alert severity="error" role="alert">{error}</Alert>
            )}

            {lastSuggestions !== null && (
              <Box>
                {lastSuggestions.length === 0 ? (
                  <Alert severity="info">
                    Nessun suggerimento generato per questo contenuto.
                  </Alert>
                ) : (
                  <Stack spacing={1}>
                    <M3Typography variant="labelLarge">
                      {lastSuggestions.length} suggeriment{lastSuggestions.length === 1 ? 'o' : 'i'} generati:
                    </M3Typography>
                    {lastSuggestions.map(s => (
                      <Alert
                        key={s.id}
                        severity={s.type === 'WARNING' ? 'warning' : s.type === 'INSIGHT' ? 'info' : 'success'}
                        icon={<SuggestionIcon type={s.type} />}
                      >
                        <strong>{s.title}</strong> — {s.description}
                        {s.cta && (
                          <Box component="span" sx={{ ml: 1 }}>
                            <Chip label={s.cta} size="small" />
                          </Box>
                        )}
                      </Alert>
                    ))}
                  </Stack>
                )}
              </Box>
            )}
          </Stack>
        </M3Surface>
      )}

      {/* Recent entries */}
      <M3Surface elevation={0} sx={{ p: 3, borderRadius: 3 }} aria-label="Entry cognitive recenti">
        <M3Typography variant="titleMedium" gutterBottom>
          Ultime entry — {tenantId}
        </M3Typography>
        <Divider sx={{ mb: 2 }} />

        {recent.length === 0 ? (
          <M3Typography variant="bodySmall" color="text.secondary">
            Nessuna entry registrata per questo tenant.
          </M3Typography>
        ) : (
          <List dense aria-label="Lista entry cognitive">
            {recent.map((entry: CognitiveEntry) => (
              <Box key={entry.id}>
                <ListItem
                  component="li"
                  sx={{ cursor: 'pointer', borderRadius: 1, '&:hover': { bgcolor: 'action.hover' } }}
                  onClick={() => toggleExpand(entry.id)}
                  aria-expanded={expandedEntry === entry.id}
                  aria-label={`Entry ${entry.label}`}
                >
                  <ListItemText
                    primary={
                      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                        <Chip
                          label={entry.domain}
                          size="small"
                          color={DOMAIN_COLORS[entry.domain] ?? 'default'}
                          aria-label={`Dominio: ${entry.domain}`}
                        />
                        <Chip
                          label={entry.confidence}
                          size="small"
                          variant="outlined"
                          color={CONFIDENCE_COLORS[entry.confidence] ?? 'default'}
                          aria-label={`Confidenza: ${entry.confidence}`}
                        />
                        <M3Typography variant="bodySmall">{entry.label}</M3Typography>
                      </Stack>
                    }
                    secondary={formatDate(entry.enteredAt)}
                  />
                  <ListItemSecondaryAction>
                    {expandedEntry === entry.id
                      ? <ExpandLessIcon fontSize="small" aria-hidden />
                      : <ExpandMoreIcon fontSize="small" aria-hidden />}
                  </ListItemSecondaryAction>
                </ListItem>

                <Collapse in={expandedEntry === entry.id} timeout="auto" unmountOnExit>
                  <Box sx={{ pl: 2, pr: 2, pb: 1 }}>
                    <M3Typography variant="bodySmall" color="text.secondary" sx={{ mb: 1 }}>
                      {entry.content.slice(0, 300)}{entry.content.length > 300 ? '…' : ''}
                    </M3Typography>
                    {entry.tags.length > 0 && (
                      <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ mt: 0.5 }}>
                        {entry.tags.map(tag => (
                          <Chip key={tag} label={tag} size="small" variant="outlined" aria-label={`Tag: ${tag}`} />
                        ))}
                      </Stack>
                    )}
                  </Box>
                </Collapse>
                <Divider />
              </Box>
            ))}
          </List>
        )}
      </M3Surface>
    </Stack>
  );
}
