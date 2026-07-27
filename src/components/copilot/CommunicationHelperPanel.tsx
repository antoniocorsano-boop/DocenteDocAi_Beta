/**
 * CommunicationHelperPanel — Sprint 3
 *
 * Generates pre-filled message templates for parents and students
 * based on AI risk/excellence analysis.
 *
 * Tabs: Genitori | Studenti
 * Per-message card: template label, student name, subject preview,
 * expandable body, copy-to-clipboard button.
 */
import React, { useMemo, useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import { InfoCard, SectionHeader, EmptyState } from '../ui';
import { FeatureHintChip } from '../journey';
import type { AISuggestion } from '../../ai/contextEngine/types';
import type { Studente, Valutazione } from '../../types';
import {
  generateCommunications,
  type GeneratedMessage,
} from '../../ai/copilot/communicationEngine';

// ── template meta ─────────────────────────────────────────────────────────────

const TEMPLATE_META: Record<
  GeneratedMessage['template'],
  { icon: string; bg: string; fg: string }
> = {
  recovery_parent: {
    icon: 'family_restroom',
    bg: 'var(--md-sys-color-error-container)',
    fg: 'var(--md-sys-color-on-error-container)',
  },
  recovery_student: {
    icon: 'healing',
    bg: 'var(--md-sys-color-error-container)',
    fg: 'var(--md-sys-color-on-error-container)',
  },
  excellence_parent: {
    icon: 'family_restroom',
    bg: 'var(--md-sys-color-tertiary-container)',
    fg: 'var(--md-sys-color-on-tertiary-container)',
  },
  excellence_student: {
    icon: 'star',
    bg: 'var(--md-sys-color-tertiary-container)',
    fg: 'var(--md-sys-color-on-tertiary-container)',
  },
  missing_assessment_parent: {
    icon: 'assignment_late',
    bg: 'var(--md-sys-color-secondary-container)',
    fg: 'var(--md-sys-color-on-secondary-container)',
  },
  general_feedback_student: {
    icon: 'chat',
    bg: 'var(--md-sys-color-surface-container-high)',
    fg: 'var(--md-sys-color-on-surface-variant)',
  },
};

// ── message card ──────────────────────────────────────────────────────────────

const MessageCard: React.FC<{
  msg: GeneratedMessage;
  onPreview: (msg: GeneratedMessage) => void;
}> = ({ msg, onPreview }) => {
  const meta = TEMPLATE_META[msg.template] ?? TEMPLATE_META.general_feedback_student;

  return (
    <Accordion
      disableGutters
      elevation={0}
      sx={{
        border: '1px solid var(--md-sys-color-outline-variant)',
        borderRadius: 'var(--md-sys-shape-corner-medium) !important',
        mb: 'var(--md-sys-spacing-2)',
        overflow: 'hidden',
        '&:before': { display: 'none' },
      }}
    >
      <AccordionSummary
        expandIcon={
          <Box
            component="span"
            className="material-symbols-outlined"
            aria-hidden="true"
            sx={{ color: meta.fg, fontSize: 20 }}
          >
            expand_more
          </Box>
        }
        aria-controls={`msg-${msg.id}-content`}
        id={`msg-${msg.id}-header`}
        sx={{
          backgroundColor: meta.bg,
          px: 'var(--md-sys-spacing-4)',
          py: 'var(--md-sys-spacing-2)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-3)', flex: 1, pr: 1, minWidth: 0 }}>
          {/* icon */}
          <Box
            component="span"
            className="material-symbols-outlined"
            aria-hidden="true"
            sx={{ color: meta.fg, fontSize: 22, flexShrink: 0 }}
          >
            {meta.icon}
          </Box>

          {/* text block */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-2)', flexWrap: 'wrap', mb: 0.25 }}>
              <Typography
                variant="titleSmall"
                sx={{ color: meta.fg, fontWeight: 'var(--md-sys-typescale-weight-medium)' }}
              >
                {msg.studentName}
              </Typography>
              <Chip
                label={msg.templateLabel}
                size="small"
                sx={{
                  backgroundColor: 'transparent',
                  color: meta.fg,
                  border: `1px solid ${meta.fg}`,
                  height: 18,
                  fontSize: 10,
                  fontWeight: 'var(--md-sys-typescale-weight-medium)',
                }}
              />
            </Box>
            <Typography
              variant="caption"
              sx={{
                color: meta.fg,
                opacity: 0.8,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                display: 'block',
              }}
            >
              {msg.subject}
            </Typography>
          </Box>
        </Box>
      </AccordionSummary>

      <AccordionDetails
        sx={{
          p: 'var(--md-sys-spacing-4)',
          backgroundColor: 'var(--md-sys-color-surface-container)',
        }}
      >
        {/* Body preview — first 3 lines */}
        <Typography
          variant="body2"
          component="pre"
          sx={{
            whiteSpace: 'pre-wrap',
            fontFamily: 'inherit',
            color: 'var(--md-sys-color-on-surface)',
            mb: 'var(--md-sys-spacing-3)',
            maxHeight: 96,
            overflow: 'hidden',
            position: 'relative',
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: 32,
              background:
                'linear-gradient(transparent, var(--md-sys-color-surface-container))',
            },
          }}
        >
          {msg.body}
        </Typography>

        {/* Actions */}
        <Box sx={{ display: 'flex', gap: 'var(--md-sys-spacing-2)', justifyContent: 'flex-end' }}>
          <Button
            size="small"
            variant="outlined"
            onClick={() => onPreview(msg)}
            aria-label={`Anteprima messaggio per ${msg.studentName}`}
            startIcon={
              <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: '18px !important' }}>
                open_in_full
              </Box>
            }
            sx={{
              borderColor: 'var(--md-sys-color-outline)',
              color: 'var(--md-sys-color-primary)',
            }}
          >
            Anteprima
          </Button>
        </Box>
      </AccordionDetails>
    </Accordion>
  );
};

// ── preview modal ─────────────────────────────────────────────────────────────

const PreviewModal: React.FC<{
  msg: GeneratedMessage | null;
  onClose: () => void;
  onCopy: (text: string) => void;
}> = ({ msg, onClose, onCopy }) => {
  if (!msg) return null;
  const meta = TEMPLATE_META[msg.template] ?? TEMPLATE_META.general_feedback_student;
  const fullText = `Oggetto: ${msg.subject}\n\n${msg.body}`;

  return (
    <Dialog
      open={!!msg}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      aria-labelledby="comm-preview-title"
      PaperProps={{
        sx: {
          borderRadius: 'var(--md-sys-shape-corner-extra-large)',
          backgroundColor: 'var(--md-sys-color-surface)',
        },
      }}
    >
      <DialogTitle
        id="comm-preview-title"
        sx={{
          backgroundColor: meta.bg,
          color: meta.fg,
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--md-sys-spacing-2)',
          pb: 'var(--md-sys-spacing-3)',
        }}
      >
        <Box
          component="span"
          className="material-symbols-outlined"
          aria-hidden="true"
          sx={{ fontSize: 22 }}
        >
          {meta.icon}
        </Box>
        <Box>
          <Typography variant="titleMedium" sx={{ color: meta.fg }}>
            {msg.studentName} — {msg.templateLabel}
          </Typography>
          <Typography variant="caption" sx={{ color: meta.fg, opacity: 0.8 }}>
            {msg.target === 'parent' ? 'Destinatario: genitore' : 'Destinatario: studente'}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 'var(--md-sys-spacing-4) !important' }}>
        {/* Subject */}
        <Box
          sx={{
            p: 'var(--md-sys-spacing-3)',
            borderRadius: 'var(--md-sys-shape-corner-small)',
            backgroundColor: 'var(--md-sys-color-surface-container-high)',
            mb: 'var(--md-sys-spacing-3)',
          }}
        >
          <Typography variant="labelSmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)', mb: 0.5, textTransform: 'uppercase' }}>
            Oggetto
          </Typography>
          <Typography variant="body2" sx={{ color: 'var(--md-sys-color-on-surface)', fontWeight: 'var(--md-sys-typescale-weight-medium)' }}>
            {msg.subject}
          </Typography>
        </Box>

        {/* Body */}
        <Typography
          variant="body2"
          component="pre"
          sx={{
            whiteSpace: 'pre-wrap',
            fontFamily: 'inherit',
            color: 'var(--md-sys-color-on-surface)',
            lineHeight: 1.7,
          }}
        >
          {msg.body}
        </Typography>
      </DialogContent>

      <DialogActions sx={{ px: 'var(--md-sys-spacing-4)', pb: 'var(--md-sys-spacing-4)', gap: 'var(--md-sys-spacing-2)' }}>
        <Button
          onClick={onClose}
          variant="text"
          sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}
        >
          Chiudi
        </Button>
        <Button
          onClick={() => { onCopy(fullText); onClose(); }}
          variant="contained"
          startIcon={
            <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: '18px !important' }}>
              content_copy
            </Box>
          }
          aria-label="Copia testo messaggio"
          sx={{
            backgroundColor: 'var(--md-sys-color-primary)',
            color: 'var(--md-sys-color-on-primary)',
            '&:hover': { opacity: 0.9 },
          }}
        >
          Copia testo
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ── main component ────────────────────────────────────────────────────────────

interface CommunicationHelperPanelProps {
  suggestions: AISuggestion[];
  students: Studente[];
  evaluations: Valutazione[];
  className: string;
  studentId: string;
}

const CommunicationHelperPanel: React.FC<CommunicationHelperPanelProps> = ({
  suggestions,
  students,
  evaluations,
  className,
  studentId,
}) => {
  const [innerTab, setInnerTab] = useState(0);
  const [previewMsg, setPreviewMsg] = useState<GeneratedMessage | null>(null);
  const [snackOpen, setSnackOpen] = useState(false);

  // Filter to current selection
  const targetStudents = useMemo(
    () => (studentId === 'all' ? students : students.filter((s) => s.id === studentId)),
    [students, studentId],
  );
  const ids = useMemo(() => new Set(targetStudents.map((s) => s.id)), [targetStudents]);
  const targetSuggestions = useMemo(
    () => suggestions.filter((s) => s.studentId && ids.has(s.studentId)),
    [suggestions, ids],
  );

  const messages = useMemo(
    () => generateCommunications(targetSuggestions, targetStudents, evaluations),
    [targetSuggestions, targetStudents, evaluations],
  );

  const parentMessages = messages.filter((m) => m.target === 'parent');
  const studentMessages = messages.filter((m) => m.target === 'student');

  const handleCopy = useCallback((text: string) => {
    navigator.clipboard.writeText(text).catch(() => undefined);
    setSnackOpen(true);
  }, []);

  const handleCopyAll = useCallback(
    (target: 'parent' | 'student') => {
      const list = target === 'parent' ? parentMessages : studentMessages;
      const text = list
        .map((m) => `--- ${m.templateLabel}: ${m.studentName} ---\nOggetto: ${m.subject}\n\n${m.body}`)
        .join('\n\n' + '='.repeat(60) + '\n\n');
      navigator.clipboard.writeText(text).catch(() => undefined);
      setSnackOpen(true);
    },
    [parentMessages, studentMessages],
  );

  return (
    <InfoCard variant="outlined">
      <SectionHeader
        title="Communication Helper"
        subtitle={`Messaggi precompilati — classe ${className}`}
      />
      <FeatureHintChip hintId="comm-helper" requiredLevel="praticante" message="Funzionalità avanzate comunicazione disponibili per i Praticanti." />

      {/* inner tabs */}
      <Tabs
        value={innerTab}
        onChange={(_, v: number) => setInnerTab(v)}
        aria-label="Communication Helper tabs"
        sx={{ mb: 'var(--md-sys-spacing-3)', borderBottom: '1px solid var(--md-sys-color-outline-variant)' }}
        variant="scrollable"
        scrollButtons="auto"
      >
        <Tab
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-1)' }}>
              <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 16 }}>
                family_restroom
              </Box>
              Genitori{parentMessages.length > 0 && ` (${parentMessages.length})`}
            </Box>
          }
          id="comm-tab-0"
          aria-controls="comm-panel-0"
        />
        <Tab
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-1)' }}>
              <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 16 }}>
                school
              </Box>
              Studenti{studentMessages.length > 0 && ` (${studentMessages.length})`}
            </Box>
          }
          id="comm-tab-1"
          aria-controls="comm-panel-1"
        />
      </Tabs>

      <Box
        role="tabpanel"
        id={`comm-panel-${innerTab}`}
        aria-labelledby={`comm-tab-${innerTab}`}
      >
        {innerTab === 0 && (
          parentMessages.length > 0 ? (
            <>
              {/* Copia tutto row */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 'var(--md-sys-spacing-2)' }}>
                <Tooltip title="Copia tutti i messaggi per i genitori">
                  <IconButton
                    size="small"
                    onClick={() => handleCopyAll('parent')}
                    aria-label="Copia tutti i messaggi per genitori"
                    sx={{ color: 'var(--md-sys-color-primary)' }}
                  >
                    <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 20 }}>
                      copy_all
                    </Box>
                  </IconButton>
                </Tooltip>
                <Typography variant="caption" sx={{ color: 'var(--md-sys-color-on-surface-variant)', alignSelf: 'center', ml: 0.5 }}>
                  Copia tutto
                </Typography>
              </Box>
              {parentMessages.map((msg) => (
                <MessageCard key={msg.id} msg={msg} onPreview={setPreviewMsg} />
              ))}
            </>
          ) : (
            <EmptyState
              title="Nessun messaggio per i genitori"
              description="Non ci sono studenti a rischio, eccellenza o con valutazioni mancanti nella selezione corrente."
              icon="mark_email_read"
            />
          )
        )}

        {innerTab === 1 && (
          studentMessages.length > 0 ? (
            <>
              {/* Copia tutto row */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 'var(--md-sys-spacing-2)' }}>
                <Tooltip title="Copia tutti i messaggi per gli studenti">
                  <IconButton
                    size="small"
                    onClick={() => handleCopyAll('student')}
                    aria-label="Copia tutti i messaggi per studenti"
                    sx={{ color: 'var(--md-sys-color-primary)' }}
                  >
                    <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 20 }}>
                      copy_all
                    </Box>
                  </IconButton>
                </Tooltip>
                <Typography variant="caption" sx={{ color: 'var(--md-sys-color-on-surface-variant)', alignSelf: 'center', ml: 0.5 }}>
                  Copia tutto
                </Typography>
              </Box>
              {studentMessages.map((msg) => (
                <MessageCard key={msg.id} msg={msg} onPreview={setPreviewMsg} />
              ))}
            </>
          ) : (
            <EmptyState
              title="Nessun messaggio per gli studenti"
              description="Non ci sono studenti a rischio o eccellenza nella selezione corrente."
              icon="mark_chat_read"
            />
          )
        )}
      </Box>

      {/* Preview Modal */}
      <PreviewModal
        msg={previewMsg}
        onClose={() => setPreviewMsg(null)}
        onCopy={handleCopy}
      />

      {/* Copy feedback */}
      <Snackbar
        open={snackOpen}
        autoHideDuration={2500}
        onClose={() => setSnackOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity="success"
          onClose={() => setSnackOpen(false)}
          sx={{ borderRadius: 'var(--md-sys-shape-corner-medium)' }}
        >
          Testo copiato negli appunti
        </Alert>
      </Snackbar>
    </InfoCard>
  );
};

export default CommunicationHelperPanel;
