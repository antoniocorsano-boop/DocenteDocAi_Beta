// MD3 Compliant - Migration completed

import React from 'react';
import { Slot, Lezione } from '../types';
import { LESSON_TYPE_ICONS } from '../constants';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import ButtonBase from '@mui/material/ButtonBase';
import { M3Dialog } from './ui';
interface SlotActionModalProps {
  slot: Slot;
  lesson: Lezione;
  isDraftExisting: boolean;
  onClose: () => void;
  onEdit: () => void;
  onStart: () => void;
  onView: () => void;
}

const SlotActionModal: React.FC<SlotActionModalProps> = ({ slot, lesson, isDraftExisting, onClose, onEdit, onStart, onView }) => {
  const typeIcon = lesson.tipoLezione ? LESSON_TYPE_ICONS[lesson.tipoLezione] : 'school';
  const attachmentCount = lesson.materialiDidattici?.length || 0;

  return (
    <M3Dialog
      title={
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <Typography variant="subtitle2" component="span">Lezione Programmata</Typography>
          <Typography variant="body2" component="span" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>{slot.giorno}, {slot.ora}</Typography>
        </Box>
      }
      onClose={onClose}
      maxWidth="sm"
      buttons={<Button onClick={onClose} variant="text">Chiudi</Button>}
    >
            {/* Interactive Hero Card */}
            <ButtonBase
                component="div"
                sx={{
                  borderRadius: 'var(--md-sys-shape-corner-large)',
                  backgroundColor: 'var(--md-sys-color-primary-container)',
                  cursor: 'pointer',
                  p: 2,
                  width: '100%',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1,
                  position: 'relative',
                  overflow: 'hidden',
                  '&:hover::after': { content: '""', position: 'absolute', inset: 0, borderRadius: 'inherit', backgroundColor: 'var(--md-sys-color-on-surface)', opacity: 0.08, pointerEvents: 'none' },
                }}
                onClick={onView}
                aria-label="Vedi dettagli lezione"
            >
                {/* Metadata Row */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                        <Typography variant="button" component="span" sx={{ fontWeight: 'var(--md-sys-typescale-weight-bold)', color: 'var(--md-sys-color-on-primary-container)' }}>
                            {slot.classe}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 14, color: 'var(--md-sys-color-on-primary-container)' }}>{typeIcon}</Box>
                            <Typography variant="caption" component="span" sx={{ fontWeight: 'var(--md-sys-typescale-weight-medium)', color: 'var(--md-sys-color-on-primary-container)' }}>
                                {lesson.tipoLezione || 'Lezione'}
                            </Typography>
                        </Box>
                        {attachmentCount > 0 && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }} title={`${attachmentCount} allegati`}>
                                <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 14, color: 'var(--md-sys-color-on-primary-container)' }}>attachment</Box>
                                <Typography variant="overline" component="span" sx={{ color: 'var(--md-sys-color-on-primary-container)' }}>{attachmentCount}</Typography>
                            </Box>
                        )}
                    </Box>
                    <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 18, color: 'var(--md-sys-color-on-primary-container)' }}>chevron_right</Box>
                </Box>

                {/* Main Content */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, width: '100%' }}>
                    {slot.materia && (
                        <Typography variant="overline" component="p" sx={{ textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--md-sys-color-on-primary-container)', opacity: 0.7 }}>
                            {slot.materia}
                        </Typography>
                    )}
                    <Typography variant="subtitle2" component="h3" sx={{ fontWeight: 'var(--md-sys-typescale-weight-bold)', lineHeight: 1.3, color: 'var(--md-sys-color-on-primary-container)' }}>
                        {lesson.contenuto}
                    </Typography>
                    {lesson.nota && (
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5, mt: 0.5, opacity: 0.75 }}>
                            <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 14, color: 'var(--md-sys-color-on-primary-container)', flexShrink: 0, marginTop: 2 }}>sticky_note_2</Box>
                            <Typography variant="caption" component="p" sx={{ color: 'var(--md-sys-color-on-primary-container)' }}>
                                {lesson.nota}
                            </Typography>
                        </Box>
                    )}
                </Box>
            </ButtonBase>

            {/* Action List */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
                <ButtonBase
                    component="button"
                    onClick={onStart}
                    sx={{
                      borderRadius: 'var(--md-sys-shape-corner-large)',
                      display: 'flex', alignItems: 'center', gap: 1.5,
                      p: 1.5,
                      bgcolor: 'var(--md-sys-color-primary)',
                      color: 'var(--md-sys-color-on-primary)',
                      textAlign: 'left', width: '100%',
                      position: 'relative',
                      overflow: 'hidden',
                      '&:hover::after': { content: '""', position: 'absolute', inset: 0, borderRadius: 'inherit', backgroundColor: 'var(--md-sys-color-on-primary)', opacity: 0.08, pointerEvents: 'none' },
                    }}
                >
                    <Box sx={{
                      borderRadius: 'var(--md-sys-shape-corner-medium)',
                      bgcolor: 'color-mix(in srgb, var(--md-sys-color-on-primary) 15%, transparent)',
                      width: 40, height: 40, flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 20 }}>door_open</Box>
                    </Box>
                    <Box sx={{ minWidth: 0 }}>
                        <Typography variant="button" component="p" sx={{ fontWeight: 'var(--md-sys-typescale-weight-bold)', color: 'inherit' }}>{isDraftExisting ? 'Torna in Aula' : 'Avvia Aula'}</Typography>
                        <Typography variant="caption" component="p" sx={{ color: 'inherit', opacity: 0.8 }}>Apri il registro e inizia la lezione.</Typography>
                    </Box>
                </ButtonBase>

                <ButtonBase
                    component="button"
                    onClick={onEdit}
                    sx={{
                      borderRadius: 'var(--md-sys-shape-corner-large)',
                      display: 'flex', alignItems: 'center', gap: 1.5,
                      p: 1.5,
                      bgcolor: 'var(--md-sys-color-secondary-container)',
                      color: 'var(--md-sys-color-on-secondary-container)',
                      textAlign: 'left', width: '100%',
                      position: 'relative',
                      overflow: 'hidden',
                      '&:hover::after': { content: '""', position: 'absolute', inset: 0, borderRadius: 'inherit', backgroundColor: 'var(--md-sys-color-on-secondary-container)', opacity: 0.08, pointerEvents: 'none' },
                    }}
                >
                    <Box sx={{
                      borderRadius: 'var(--md-sys-shape-corner-medium)',
                      bgcolor: 'color-mix(in srgb, var(--md-sys-color-on-secondary-container) 12%, transparent)',
                      width: 40, height: 40, flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 20 }}>edit</Box>
                    </Box>
                    <Box sx={{ minWidth: 0 }}>
                        <Typography variant="button" component="p" sx={{ fontWeight: 'var(--md-sys-typescale-weight-bold)', color: 'inherit' }}>Modifica</Typography>
                        <Typography variant="caption" component="p" sx={{ color: 'inherit', opacity: 0.8 }}>Cambia contenuto o sposta.</Typography>
                    </Box>
                </ButtonBase>
            </Box>
    </M3Dialog>
  );
};

export default SlotActionModal;

