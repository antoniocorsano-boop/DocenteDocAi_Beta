// MD3 GOLD COMPLIANT — DailyBriefingModal: briefing di giornata del docente

import React, { useMemo } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import { M3Surface } from './ui';
import { View, NavigationParams } from '../types';
import { useAcademicStore } from '../stores/useAcademicStore';

// ── Scadenzario normativo (mirrored from Home.tsx) ─────────────────────────
function getDeadlineAlerts(now: Date): { icon: string; text: string; urgency: 'error' | 'warning' | 'info' }[] {
  const m = now.getMonth() + 1;
  const result: { icon: string; text: string; urgency: 'error' | 'warning' | 'info' }[] = [];
  if (m === 1)  result.push({ icon: 'assignment_late',   text: 'Scrutinio 1° quadrimestre in vista',            urgency: 'error' });
  if (m === 2)  result.push({ icon: 'description',       text: 'Aggiorna i PDP/PEI per il 2° periodo',          urgency: 'warning' });
  if (m === 3)  result.push({ icon: 'fact_check',        text: 'UDA 2° bimestre: verifica avanzamento',         urgency: 'warning' });
  if (m === 5)  result.push({ icon: 'workspace_premium', text: 'Certificazioni competenze: avvia compilazione', urgency: 'error' });
  if (m === 6)  result.push({ icon: 'summarize',         text: 'Relazioni finali di classe da produrre',        urgency: 'error' });
  if (m === 9)  result.push({ icon: 'event_note',        text: 'Setup classi e programmazione annuale',         urgency: 'warning' });
  if (m === 10) result.push({ icon: 'article',           text: 'PTOF: contributo disciplinare da consegnare',   urgency: 'info' });
  return result;
}

const URGENCY_COLOR: Record<string, string> = {
  error:   'var(--md-sys-color-error)',
  warning: 'var(--md-sys-color-secondary)',
  info:    'var(--md-sys-color-tertiary)',
};

interface DailyBriefingModalProps {
  onClose: () => void;
  onNavigate: (view: View, params?: NavigationParams) => void;
}

const DailyBriefingModal: React.FC<DailyBriefingModalProps> = ({ onClose, onNavigate }) => {
  const slots   = useAcademicStore(s => s.slots);
  const lessons = useAcademicStore(s => s.lessons);
  const udas    = useAcademicStore(s => s.uda);

  const now       = useMemo(() => new Date(), []);
  const todayName = now.toLocaleDateString('it-IT', { weekday: 'long' }); // "lunedì" ecc.
  const dateLabel = now.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });

  const deadlines = useMemo(() => getDeadlineAlerts(now), [now]);

  // Slot odierni ordinati per ora
  const todaySlots = useMemo(() => {
    return Object.values(slots)
      .filter(s => s.giorno?.toLowerCase() === todayName.toLowerCase())
      .sort((a, b) => (a.ora ?? '').localeCompare(b.ora ?? ''));
  }, [slots, todayName]);

  // Classi uniche in programma oggi
  const todayClasses = useMemo(() => {
    const seen = new Set<string>();
    todaySlots.forEach(s => { if (s.classe) seen.add(s.classe); });
    return Array.from(seen);
  }, [todaySlots]);

  // UDA attive per le classi di oggi (endDate assente o >= oggi)
  const activeUdas = useMemo(() => {
    const todayStr = now.toISOString().slice(0, 10);
    return udas.filter(u =>
      todayClasses.includes(u.classe) &&
      (!u.endDate || u.endDate >= todayStr)
    );
  }, [udas, todayClasses, now]);

  const hasContent = todaySlots.length > 0 || activeUdas.length > 0 || deadlines.length > 0;

  return (
    <Dialog
      open
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby="daily-briefing-title"
      PaperProps={{
        sx: {
          borderRadius: 'var(--md-sys-shape-corner-extra-large)',
          bgcolor: 'var(--md-sys-color-surface)',
        },
      }}
    >
      {/* ── Intestazione ──────────────────────────────────────── */}
      <DialogTitle
        id="daily-briefing-title"
        sx={{
          bgcolor: 'var(--md-sys-color-surface-container)',
          borderRadius: 'var(--md-sys-shape-corner-extra-large) var(--md-sys-shape-corner-extra-large) 0 0',
          pb: 'var(--md-sys-spacing-3)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-2)' }}>
          <Box
            component="span"
            className="material-symbols-outlined"
            aria-hidden="true"
            sx={{ fontSize: 24, color: 'var(--md-sys-color-primary)' }}
          >
            playlist_add_check
          </Box>
          <Box>
            <Typography
              id="daily-briefing-title"
              variant="titleLarge"
              sx={{ color: 'var(--md-sys-color-on-surface)', textTransform: 'capitalize' }}
            >
              {dateLabel}
            </Typography>
            {!hasContent && (
              <Typography variant="bodySmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                Nessuna attività trovata per oggi
              </Typography>
            )}
          </Box>
        </Box>
      </DialogTitle>

      {/* ── Contenuto ─────────────────────────────────────────── */}
      <DialogContent sx={{ p: 0 }}>

        {/* Orario del giorno */}
        {todaySlots.length > 0 && (
          <Box sx={{ px: 'var(--md-sys-spacing-4)', pt: 'var(--md-sys-spacing-4)' }}>
            <Typography
              variant="labelLarge"
              sx={{ color: 'var(--md-sys-color-primary)', mb: 'var(--md-sys-spacing-2)', display: 'block' }}
            >
              Orario di oggi
            </Typography>
            <M3Surface
              elevation={0}
              sx={{
                bgcolor: 'var(--md-sys-color-surface-container-low)',
                borderRadius: 'var(--md-sys-shape-corner-medium)',
                overflow: 'hidden',
              }}
            >
              <List disablePadding>
                {todaySlots.map((slot, i) => {
                  const lezione = slot.lezioneId ? lessons[slot.lezioneId] : undefined;
                  return (
                    <React.Fragment key={`${slot.giorno}-${slot.ora}-${i}`}>
                      {i > 0 && <Divider />}
                      <ListItem
                        sx={{
                          px: 'var(--md-sys-spacing-4)',
                          py: 'var(--md-sys-spacing-2)',
                          gap: 'var(--md-sys-spacing-3)',
                          alignItems: 'flex-start',
                        }}
                      >
                        <Typography
                          variant="labelMedium"
                          sx={{ color: 'var(--md-sys-color-primary)', minWidth: '52px', pt: '2px' }}
                        >
                          {slot.ora}
                        </Typography>
                        <Box sx={{ flex: 1 }}>
                          <Typography
                            variant="bodyMedium"
                            sx={{
                              color: 'var(--md-sys-color-on-surface)',
                              fontWeight: 'var(--md-sys-typescale-weight-medium)',
                            }}
                          >
                            {[slot.classe, slot.materia].filter(Boolean).join(' — ')}
                          </Typography>
                          {lezione?.contenuto && (
                            <Typography
                              variant="bodySmall"
                              sx={{ color: 'var(--md-sys-color-on-surface-variant)', mt: '2px' }}
                            >
                              {lezione.contenuto}
                            </Typography>
                          )}
                          {lezione?.obiettivi && (
                            <Typography
                              variant="bodySmall"
                              sx={{ color: 'var(--md-sys-color-on-surface-variant)', fontStyle: 'italic', mt: '2px' }}
                            >
                              Obiettivo: {lezione.obiettivi}
                            </Typography>
                          )}
                        </Box>
                        {lezione?.tipoLezione && (
                          <Chip
                            label={lezione.tipoLezione}
                            size="small"
                            sx={{
                              bgcolor: 'var(--md-sys-color-secondary-container)',
                              color: 'var(--md-sys-color-on-secondary-container)',
                              height: '22px',
                              fontSize: 11,
                            }}
                          />
                        )}
                      </ListItem>
                    </React.Fragment>
                  );
                })}
              </List>
            </M3Surface>
          </Box>
        )}

        {/* UDA in corso */}
        {activeUdas.length > 0 && (
          <Box sx={{ px: 'var(--md-sys-spacing-4)', pt: 'var(--md-sys-spacing-4)' }}>
            <Typography
              variant="labelLarge"
              sx={{ color: 'var(--md-sys-color-primary)', mb: 'var(--md-sys-spacing-2)', display: 'block' }}
            >
              UDA in corso
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-2)' }}>
              {activeUdas.map(uda => (
                <M3Surface
                  key={uda.id}
                  elevation={0}
                  role="button"
                  tabIndex={0}
                  aria-label={`Apri UDA ${uda.title}`}
                  onClick={() => { onClose(); onNavigate('uda' as View); }}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') { onClose(); onNavigate('uda' as View); }
                  }}
                  sx={{
                    bgcolor: 'var(--md-sys-color-tertiary-container)',
                    borderRadius: 'var(--md-sys-shape-corner-medium)',
                    p: 'var(--md-sys-spacing-3)',
                    cursor: 'pointer',
                    outline: 'none',
                    '&:hover': { filter: 'brightness(0.97)' },
                    '&:focus-visible': { outline: '2px solid var(--md-sys-color-primary)', outlineOffset: '2px' },
                  }}
                >
                  <Typography variant="labelLarge" sx={{ color: 'var(--md-sys-color-on-tertiary-container)' }}>
                    {uda.classe}
                  </Typography>
                  <Typography
                    variant="bodyMedium"
                    sx={{ color: 'var(--md-sys-color-on-tertiary-container)', opacity: 0.87 }}
                  >
                    {uda.title}
                  </Typography>
                  {uda.introduction && (
                    <Typography
                      variant="bodySmall"
                      sx={{
                        color: 'var(--md-sys-color-on-tertiary-container)',
                        opacity: 0.7,
                        mt: '2px',
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {uda.introduction}
                    </Typography>
                  )}
                </M3Surface>
              ))}
            </Box>
          </Box>
        )}

        {/* Scadenze */}
        {deadlines.length > 0 && (
          <Box sx={{ px: 'var(--md-sys-spacing-4)', pt: 'var(--md-sys-spacing-4)' }}>
            <Typography
              variant="labelLarge"
              sx={{ color: 'var(--md-sys-color-primary)', mb: 'var(--md-sys-spacing-2)', display: 'block' }}
            >
              Scadenze
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-2)' }}>
              {deadlines.map((d, i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-2)' }}>
                  <Box
                    component="span"
                    className="material-symbols-outlined"
                    aria-hidden="true"
                    sx={{ fontSize: 18, color: URGENCY_COLOR[d.urgency] }}
                  >
                    {d.icon}
                  </Box>
                  <Typography variant="bodyMedium" sx={{ color: 'var(--md-sys-color-on-surface)' }}>
                    {d.text}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        )}

        <Box sx={{ height: 'var(--md-sys-spacing-4)' }} />
      </DialogContent>

      {/* ── Azioni ─────────────────────────────────────────────── */}
      <DialogActions
        sx={{
          px: 'var(--md-sys-spacing-4)',
          pb: 'var(--md-sys-spacing-4)',
          gap: 'var(--md-sys-spacing-2)',
        }}
      >
        <Button
          variant="outlined"
          onClick={onClose}
          sx={{
            borderColor: 'var(--md-sys-color-outline)',
            color: 'var(--md-sys-color-primary)',
            borderRadius: 'var(--md-sys-shape-corner-full)',
            textTransform: 'none',
          }}
        >
          Chiudi
        </Button>
        <Button
          variant="contained"
          onClick={() => { onClose(); onNavigate('register' as View); }}
          sx={{
            bgcolor: 'var(--md-sys-color-primary)',
            color: 'var(--md-sys-color-on-primary)',
            borderRadius: 'var(--md-sys-shape-corner-full)',
            textTransform: 'none',
          }}
        >
          Vai al Registro
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DailyBriefingModal;
