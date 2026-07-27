// MD3 Compliant - Block M Migration (6 violations eliminated)

import * as React from 'react';
import { useState } from 'react';
import { Studente, Valutazione } from '../types';
import { RATING_OPTIONS, EVALUATION_TYPES } from '../constants';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import ButtonBase from '@mui/material/ButtonBase';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import { M3Dialog, TextField } from './ui';
import { useUIStore } from '../stores/useUIStore';

// Fase 3 continuation: Route daily quick evaluation gestures through AIBrain
import { AIBrain } from '../ai/brain/AIBrain';
interface AddEvaluationModalProps {
    students: Studente[];
    discipline: string[];
    onClose: () => void;
    onSave: (evaluation: Omit<Valutazione, 'id'>) => void;
}

const getTestTypeIcon = (tipo: string) => {
  switch (tipo) {
        case 'Scritto': return 'edit_note';
        case 'Orale': return 'record_voice_over';
        case 'Pratico': return 'build';
        case 'Test': return 'quiz';
        case 'Verifica': return 'assignment_late';
        default: return 'assignment';
    }
};

const ChoiceCard: React.FC<{ icon: string; label: string; onClick: () => void; selected: boolean }> = ({ icon, label, onClick, selected }) => (
  <Paper
    elevation={selected ? 3 : 1}
    sx={{
      borderRadius: 'var(--md-sys-shape-corner-extra-large)',
      border: `2px solid ${selected ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-outline-variant)'}`,
      bgcolor: selected ? 'var(--md-sys-color-primary-container)' : 'var(--md-sys-color-surface-container)',
      color: selected ? 'var(--md-sys-color-on-primary-container)' : 'var(--md-sys-color-on-surface)',
      transition: 'all var(--md-sys-motion-duration-short) var(--md-sys-motion-easing-standard)',
      minWidth: 'var(--md-sys-spacing-16)',
      transform: selected ? 'scale(1.05)' : 'none',
    }}
  >
    <ButtonBase
      onClick={onClick}
      aria-pressed={selected}
      aria-label={label}
      sx={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 'var(--md-sys-spacing-2)', p: 'var(--md-sys-spacing-4)', width: '100%',
        borderRadius: 'var(--md-sys-shape-corner-extra-large)',
        '&:hover': {
          bgcolor: selected
            ? 'color-mix(in srgb, var(--md-sys-color-primary) 8%, var(--md-sys-color-primary-container))'
            : 'var(--md-sys-color-surface-container-high)',
        },
      }}
    >
      <Box sx={{ width: 'var(--md-sys-spacing-12)', height: 'var(--md-sys-spacing-12)', borderRadius: 'var(--md-sys-shape-corner-medium)', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: selected ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-surface)', color: selected ? 'var(--md-sys-color-on-primary)' : 'var(--md-sys-color-primary)', transition: 'all var(--md-sys-motion-duration-short) var(--md-sys-motion-easing-standard)' }}>
        <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 'var(--icon-size-medium)', userSelect: 'none' }}>{icon}</Box>
      </Box>
      <Box component="span" sx={{ fontSize: 'var(--md-sys-typescale-body-large-font-size)', fontFamily: 'var(--md-sys-typescale-body-small-font-family)' }}>{label}</Box>
    </ButtonBase>
  </Paper>
);

const AddEvaluationModal: React.FC<AddEvaluationModalProps> = ({
    students,
    discipline,
    onClose,
    onSave
}: AddEvaluationModalProps) => {
    const { showToast } = useUIStore(state => ({ showToast: state.actions.showToast }));
    const [selectedStudentId, setSelectedStudentId] = useState<string>('');
    const [selectedMateria, setSelectedMateria] = useState<string>(discipline[0] || '');
    const [tipo, setTipo] = useState<Valutazione['tipo']>('Orale');
    const [voto, setVoto] = useState<string>('');
    const [argomento, setArgomento] = useState<string>('');
    const [note, setNote] = useState<string>('');

    // Fase 3 continuation (user-centric daily gesture): Real AIBrain consumption in AddEvaluationModal (quick grading)
    const evalModalContext = React.useMemo(() => AIBrain.buildContext({
      source: 'add-evaluation-modal',
      extra: { 
        studentsCount: students.length, 
        disciplinesCount: discipline.length,
        selectedTipo: tipo 
      }
    }), [students.length, discipline.length, tipo]);

    const evalModalRecs = React.useMemo(() => {
      try { return AIBrain.getUnifiedRecommendations(evalModalContext); } catch { return null; }
    }, [evalModalContext]);

    const [evalModalTip, setEvalModalTip] = React.useState<string | null>(null);
    const [evalModalLoading, setEvalModalLoading] = React.useState(false);

    const fetchEvalModalTip = React.useCallback(async () => {
      setEvalModalLoading(true);
      try {
        const res = await AIBrain.ask({
          prompt: `Suggerisci un consiglio rapido per la valutazione (materia: ${selectedMateria || 'generica'}, tipo: ${tipo}).`,
          context: evalModalContext,
          mode: 'balanced'
        });
        setEvalModalTip(res.content);
        if (import.meta.env.DEV) {
          AIBrain.migrateLegacyAsk('legacy-add-eval', evalModalContext).catch(() => {});
        }
      } catch {
        setEvalModalTip('Impossibile ottenere suggerimento AIBrain.');
      } finally {
        setEvalModalLoading(false);
      }
    }, [selectedMateria, tipo, evalModalContext]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedStudentId || !selectedMateria || !voto) {
            showToast('Compila tutti i campi obbligatori (Studente, Materia, Voto).', 'error');
            return;
        }
        onSave({
            studenteId: selectedStudentId,
            materia: selectedMateria,
            data: new Date().toISOString(),
            tipo,
            voto,
            argomento,
            note });
        onClose();
    };

    return (
        <M3Dialog
            title="Aggiungi Valutazione"
            onClose={onClose}
            maxWidth="sm"
            buttons={<>
                <Button variant="text" onClick={onClose} type="button">Annulla</Button>
                <Button variant="contained" form="add-evaluation-form" type="submit">Salva Valutazione</Button>
            </>}
        >
            <Box
                component="form"
                id="add-evaluation-form"
                onSubmit={handleSubmit}
                sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-6)', overflowY: 'auto', maxHeight: 'var(--md-sys-viewport-60)' }}
            >
                <FormControl fullWidth>
                  <InputLabel id="eval-student-label" shrink>Studente</InputLabel>
                  <Select
                    labelId="eval-student-label"
                    id="eval-student-select"
                    value={selectedStudentId}
                    label="Studente"
                    displayEmpty
                    notched
                    required
                    onChange={(e: SelectChangeEvent) => setSelectedStudentId(e.target.value)}
                    renderValue={(v) => v
                      ? (students.find(s => s.id === v) ? `${students.find(s => s.id === v)!.cognome} ${students.find(s => s.id === v)!.nome}` : v)
                      : <Typography component="span" variant="body1" sx={{ color: 'var(--md-sys-color-on-surface-variant)', opacity: 0.6 }}>Seleziona studente...</Typography>
                    }
                  >
                    {students.map((s: Studente) => (
                      <MenuItem key={s.id} value={s.id}>{s.cognome} {s.nome}</MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Box sx={{ display: 'grid', gridTemplateColumns: 'var(--md-sys-grid-fr-1) var(--md-sys-grid-fr-1)', gap: 'var(--md-sys-spacing-8)' }}>
                  <FormControl fullWidth>
                    <InputLabel id="eval-materia-label" shrink>Materia</InputLabel>
                    <Select
                      labelId="eval-materia-label"
                      id="eval-materia-select"
                      value={selectedMateria}
                      label="Materia"
                      displayEmpty
                      notched
                      required
                      onChange={(e: SelectChangeEvent) => setSelectedMateria(e.target.value)}
                      renderValue={(v) => v || <Typography component="span" variant="body1" sx={{ color: 'var(--md-sys-color-on-surface-variant)', opacity: 0.6 }}>Seleziona...</Typography>}
                    >
                      {discipline.map((d: string) => (
                        <MenuItem key={d} value={d}>{d}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl fullWidth>
                    <InputLabel id="eval-voto-label" shrink>Voto / Giudizio</InputLabel>
                    <Select
                      labelId="eval-voto-label"
                      id="eval-voto-select"
                      value={voto}
                      label="Voto / Giudizio"
                      displayEmpty
                      notched
                      required
                      onChange={(e: SelectChangeEvent) => setVoto(e.target.value)}
                      renderValue={(v) => v || <Typography component="span" variant="body1" sx={{ color: 'var(--md-sys-color-on-surface-variant)', opacity: 0.6 }}>Seleziona...</Typography>}
                    >
                      {RATING_OPTIONS.map((o: string) => (
                        <MenuItem key={o} value={o}>{o}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                    <Typography
                        variant="caption"
                        component="span"
                        sx={{
                            color: 'var(--md-sys-color-primary)',
                            fontWeight: 'var(--md-sys-typescale-weight-black)',
                            textTransform: 'uppercase',
                            letterSpacing: 'var(--md-sys-typescale-label-large-tracking)',
                            px: 'var(--md-sys-spacing-4)',
                            mb: 'var(--md-sys-spacing-6)',
                            display: 'block' }}
                    >
                        Tipo Prova
                    </Typography>
                    <Box
                        sx={{
                            display: 'flex',
                            gap: 'var(--md-sys-spacing-8)',
                            overflowX: 'auto',
                            pb: 'var(--md-sys-spacing-2)',
                            scrollbarWidth: 'none',
                            msOverflowStyle: 'none' }}
                    >
                        {EVALUATION_TYPES.map(t => (
                            <ChoiceCard
                                key={t}
                                icon={getTestTypeIcon(t)}
                                label={t}
                                onClick={() => setTipo(t)}
                                selected={tipo === t}
                            />
                        ))}
                    </Box>
                </Box>

                <TextField
                    id="eval-argomento-input"
                    label="Argomento"
                    value={argomento}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setArgomento(e.target.value)}
                    placeholder="Es. 'Il Barocco in Italia'"
                />

                <TextField multiline
                    id="eval-note-textarea"
                    label="Note Aggiuntive"
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    rows={2}
                />

                {/* Fase 3 continuation: Real AIBrain (visible daily gesture inside evaluation creation) */}
                {evalModalRecs?.primary && (
                  <Box sx={{ p: 1, borderRadius: 'var(--md-sys-shape-corner-small)', bgcolor: 'var(--md-sys-color-tertiary-container)' }}>
                    <Typography variant="caption" sx={{ color: 'var(--md-sys-color-on-tertiary-container)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Box component="span" className="material-symbols-outlined" sx={{ fontSize: '1rem' }}>auto_awesome</Box>
                      AIBrain (Fase 3): {evalModalRecs.primary.label || evalModalRecs.primary.title}
                    </Typography>
                  </Box>
                )}

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={fetchEvalModalTip}
                    disabled={evalModalLoading}
                    startIcon={<Box component="span" className="material-symbols-outlined" sx={{ fontSize: '1rem' }}>auto_awesome</Box>}
                  >
                    {evalModalLoading ? 'AIBrain…' : 'Insight AIBrain (Valutazione)'}
                  </Button>
                  {evalModalTip && (
                    <Box sx={{ p: 1, borderRadius: 'var(--md-sys-shape-corner-small)', bgcolor: 'var(--md-sys-color-secondary-container)', flex: 1 }}>
                      <Typography variant="caption" sx={{ color: 'var(--md-sys-color-on-secondary-container)', fontWeight: 500 }}>
                        AIBrain (Fase 3): {evalModalTip}
                      </Typography>
                    </Box>
                  )}
                </Box>
            </Box>
        </M3Dialog>
    );
};

export default AddEvaluationModal;

