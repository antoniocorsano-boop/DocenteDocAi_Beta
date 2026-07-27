// MD3 GOLD COMPLIANT — Migrated to M3Dialog (marzo 2026)
import React, { useState, useMemo } from 'react';
import { Slot, Lezione, TimetableSettings, AiSettings, Uda, KnowledgeBaseEntry, PianoInclusione, Studente } from '../types';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import FormControl from '@mui/material/FormControl';
import InputAdornment from '@mui/material/InputAdornment';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import { SectionHeader, TextField, M3ConfirmDialog, M3Dialog } from './ui';
import { useUIStore } from '../stores/useUIStore';
interface EditSlotModalProps {
    slot: Slot;
    lesson?: Lezione;
    allLessons?: Record<string, Lezione>;
    allSlots?: Record<string, Slot>;
    udas?: Uda[];
    onClose: () => void;
    onSave?: (slotKey: string, slotData: Slot) => void;
    onDelete?: (slotKey: string) => void;
    onSaveLesson: (lesson: Lezione, slotKey: string) => void;
    onStartClassroom?: (classe: string, materia: string, slotKey: string, lesson: Lezione) => void;
    timetableSettings: TimetableSettings;
    userClasses: string[];
    aiSettings?: AiSettings;
    students?: Studente[];
    knowledgeBase?: KnowledgeBaseEntry[];
    pianiInclusione?: Record<string, PianoInclusione>;
}

type ActivityType = 'standard' | 'disposizione' | 'ricevimento';



const EditSlotModal: React.FC<EditSlotModalProps> = ({
    slot,
    lesson,
    onClose,
    onDelete = () => {},
    onSaveLesson,
    timetableSettings,
    userClasses }) => {
    const { showToast } = useUIStore(state => ({ showToast: state.actions.showToast }));
    const slotKey = `${slot.giorno}-${slot.ora}`;

    const initialType = useMemo<ActivityType>(() => {
        if (lesson?.tipoLezione === 'Disposizione') return 'disposizione';
        if (lesson?.tipoLezione === 'Ricevimento') return 'ricevimento';
        return 'standard';
    }, [lesson]);

    const [activityType, setActivityType] = useState<ActivityType>(initialType);
    const [currentSlot, setCurrentSlot] = useState<Slot>(slot);
    const [currentLesson, setCurrentLesson] = useState<Partial<Lezione>>(lesson || { tipoLezione: 'Teoria' });
    const [confirmDialog, setConfirmDialog] = useState<{ message: string; onConfirm: () => void } | null>(null);

    const handleSave = () => {
        if (activityType === 'standard') {
            if (!currentSlot.classe || !currentSlot.materia) {
                showToast('Classe e Materia sono obbligatorie.', 'error');
                return;
            }
            const newLesson: Lezione = {
                id: lesson?.id || `les-${Date.now()}`,
                classe: currentSlot.classe,
                materia: currentSlot.materia,
                contenuto: currentLesson.contenuto || 'Lezione',
                svolta: false,
                tipoLezione: currentLesson.tipoLezione || 'Teoria',
                ...currentLesson };
            onSaveLesson(newLesson, slotKey);
        } else if (activityType === 'disposizione') {
            const newLesson: Lezione = {
                id: lesson?.id || `disp-${Date.now()}`,
                classe: 'N/A',
                materia: 'Disposizione',
                contenuto: 'Sostituzione / Disposizione',
                svolta: true,
                tipoLezione: 'Disposizione',
                  nota: currentLesson.nota || '' };
            onSaveLesson(newLesson, slotKey);
        } else {
            const newLesson: Lezione = {
                id: lesson?.id || `ricev-${Date.now()}`,
                classe: 'N/A',
                materia: 'Ricevimento',
                contenuto: 'Ricevimento Genitori',
                svolta: true,
                tipoLezione: 'Ricevimento',
                nota: currentLesson.nota || '' };
            onSaveLesson(newLesson, slotKey);
        }
        onClose();
    };

    const titleNode = (
        <Box>
            <Typography variant="h6" component="span">Pianificazione Slot</Typography>
            <Typography variant="caption" display="block" sx={{ color: 'var(--md-sys-color-primary)', fontWeight: 'var(--md-sys-typescale-weight-bold)' }}>
                {slot.giorno} • {slot.ora}
            </Typography>
        </Box>
    );

    return (
        <M3Dialog
            title={titleNode}
            onClose={onClose}
            maxWidth="md"
            buttons={
                <>
                    {lesson && (
                        <Button onClick={() => setConfirmDialog({ message: 'Eliminare?', onConfirm: () => { onDelete(slotKey); onClose(); } })} variant="text" color="error">
                            Rimuovi
                        </Button>
                    )}
                    <Box sx={{ flex: 1 }} />
                    <Button onClick={onClose} variant="text">Annulla</Button>
                    <Button onClick={handleSave} variant="contained">Conferma</Button>
                </>
            }
        >
                <Stack spacing="var(--md-sys-spacing-6)" sx={{ pt: 'var(--md-sys-spacing-2)' }}>
                    {/* Activity type selector */}
                    <Box component="section">
                        <SectionHeader title="Tipologia Attività" icon="category" />
                        <ToggleButtonGroup
                            value={activityType}
                            exclusive
                            onChange={(_, v: ActivityType | null) => { if (v !== null) setActivityType(v); }}
                            aria-label="Tipologia Attività"
                            sx={{ mt: 'var(--md-sys-spacing-4)', display: 'flex', gap: 'var(--md-sys-spacing-3)' }}
                        >
                            {([
                                { value: 'standard' as const, icon: 'school', label: 'Lezione' },
                                { value: 'disposizione' as const, icon: 'pending_actions', label: 'Disp.' },
                                { value: 'ricevimento' as const, icon: 'diversity_3', label: 'Ricev.' },
                            ]).map(({ value, icon, label }) => (
                                <ToggleButton
                                    key={value}
                                    value={value}
                                    aria-label={label}
                                    sx={{
                                        flex: '0 0 auto',
                                        flexDirection: 'column',
                                        gap: 'var(--md-sys-spacing-2)',
                                        p: 'var(--md-sys-spacing-4)',
                                        minWidth: 'var(--md-sys-spacing-16)',
                                        borderRadius: 'var(--md-sys-shape-corner-extra-large) !important',
                                        border: '1px solid var(--md-sys-color-outline-variant) !important',
                                        transition: `all var(--md-sys-motion-duration-short2) var(--md-sys-motion-easing-standard)`,
                                        '&.Mui-selected': {
                                            bgcolor: 'var(--md-sys-color-primary-container)',
                                            color: 'var(--md-sys-color-on-primary-container)',
                                            borderColor: 'var(--md-sys-color-primary) !important',
                                            transform: 'scale(1.05)',
                                        },
                                    }}
                                >
                                    <Box sx={{
                                        width: 'var(--md-sys-spacing-12)',
                                        height: 'var(--md-sys-spacing-12)',
                                        borderRadius: 'var(--md-sys-shape-corner-medium)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        bgcolor: activityType === value ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-surface)',
                                        color: activityType === value ? 'var(--md-sys-color-on-primary)' : 'var(--md-sys-color-primary)',
                                        transition: `all var(--md-sys-motion-duration-short2) var(--md-sys-motion-easing-standard)`,
                                    }}>
                                        <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 'var(--icon-size-medium)', userSelect: 'none' }}>{icon}</Box>
                                    </Box>
                                    <Typography variant="caption" sx={{ color: 'inherit', fontWeight: 'var(--md-sys-typescale-weight-medium)' }}>{label}</Typography>
                                </ToggleButton>
                            ))}
                        </ToggleButtonGroup>
                    </Box>

                    {/* Form fields */}
                    {activityType === 'standard' && (
                        <Stack spacing="var(--md-sys-spacing-6)">
                            <FormControl fullWidth>
                                <InputLabel id="slot-class-label" shrink>Classe</InputLabel>
                                <Select
                                    labelId="slot-class-label"
                                    id="slot-class-select"
                                    value={currentSlot.classe || ''}
                                    label="Classe"
                                    displayEmpty
                                    notched
                                    onChange={(e: SelectChangeEvent) => setCurrentSlot({ ...currentSlot, classe: e.target.value })}
                                    renderValue={(selected) => selected
                                        ? String(selected)
                                        : <Typography component="span" variant="body1" sx={{ color: 'var(--md-sys-color-on-surface-variant)', opacity: 0.6 }}>Seleziona...</Typography>
                                    }
                                >
                                    {userClasses.map(c => (
                                        <MenuItem key={c} value={c}>{c}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <FormControl fullWidth>
                                <InputLabel id="slot-materia-label" shrink>Materia</InputLabel>
                                <Select
                                    labelId="slot-materia-label"
                                    id="slot-materia-select"
                                    value={currentSlot.materia || ''}
                                    label="Materia"
                                    displayEmpty
                                    notched
                                    onChange={(e: SelectChangeEvent) => setCurrentSlot({ ...currentSlot, materia: e.target.value })}
                                    renderValue={(selected) => selected
                                        ? String(selected)
                                        : <Typography component="span" variant="body1" sx={{ color: 'var(--md-sys-color-on-surface-variant)', opacity: 0.6 }}>Seleziona...</Typography>
                                    }
                                >
                                    {timetableSettings.disciplines.map(d => (
                                        <MenuItem key={d} value={d}>{d}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <TextField
                                id="slot-argomento-input"
                                label="Argomento (Opzionale)"
                                value={currentLesson.contenuto || ''}
                                onChange={e => setCurrentLesson({ ...currentLesson, contenuto: e.target.value })}
                                placeholder="Cosa spiegherai?"
                            />

                            <TextField
                                id="slot-ai-link-input"
                                label="Link AI NotebookLM"
                                value={currentLesson.externalLink || ''}
                                onChange={e => setCurrentLesson({ ...currentLesson, externalLink: e.target.value })}
                                placeholder="Incolla URL deliverable..."
                                slotProps={{ input: { startAdornment: <InputAdornment position="start"><Box component="span" className="material-symbols-outlined" aria-hidden="true">auto_awesome</Box></InputAdornment> } }}
                            />
                        </Stack>
                    )}

                    {activityType === 'disposizione' && (
                        <Stack spacing="var(--md-sys-spacing-4)">
                            <Card variant="outlined">
                                <CardContent sx={{ display: 'flex', gap: 'var(--md-sys-spacing-4)', alignItems: 'flex-start' }}>
                                    <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ color: 'var(--md-sys-color-on-surface-variant)', fontSize: 'var(--icon-size-medium)', mt: 0.5, flexShrink: 0 }}>pending_actions</Box>
                                    <Box>
                                        <Typography variant="subtitle2">Ora di Disposizione</Typography>
                                        <Typography variant="body2" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Registra la tua presenza per sostituzioni o attività di plesso.</Typography>
                                    </Box>
                                </CardContent>
                            </Card>
                            <TextField
                                multiline
                                id="slot-disp-nota"
                                label="Note Disposizione"
                                value={currentLesson.nota || ''}
                                onChange={e => setCurrentLesson({ ...currentLesson, nota: e.target.value })}
                                placeholder="Es. Sostituzione in 2B"
                                rows={3}
                            />
                        </Stack>
                    )}

                    {activityType === 'ricevimento' && (
                        <Stack spacing="var(--md-sys-spacing-4)">
                            <Card variant="outlined">
                                <CardContent sx={{ display: 'flex', gap: 'var(--md-sys-spacing-4)', alignItems: 'flex-start' }}>
                                    <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ color: 'var(--md-sys-color-tertiary)', fontSize: 'var(--icon-size-medium)', mt: 0.5, flexShrink: 0 }}>diversity_3</Box>
                                    <Box>
                                        <Typography variant="subtitle2">Colloquio Genitori</Typography>
                                        <Typography variant="body2" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Spazio dedicato al ricevimento delle famiglie.</Typography>
                                    </Box>
                                </CardContent>
                            </Card>
                            <TextField
                                multiline
                                id="slot-ricev-nota"
                                label="Note / Orario"
                                value={currentLesson.nota || ''}
                                onChange={e => setCurrentLesson({ ...currentLesson, nota: e.target.value })}
                                placeholder="Es. Colloqui settimanali"
                                rows={3}
                            />
                        </Stack>
                    )}
                </Stack>

            {confirmDialog && (
                <M3ConfirmDialog
                    title="Conferma eliminazione"
                    message={confirmDialog.message}
                    onConfirm={() => { confirmDialog.onConfirm(); setConfirmDialog(null); }}
                    onCancel={() => setConfirmDialog(null)}
                    danger={true}
                />
            )}
        </M3Dialog>
    );
};

export default EditSlotModal;

