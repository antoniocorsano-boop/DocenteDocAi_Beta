// MD3 Compliant - Block M Migration (2 violations eliminated)

// M3Expressive: QuickEvaluationModal - Quick student evaluation modal with M3 tokens
import React, { useState } from 'react';
import { Studente, Lezione, TimetableSettings, Valutazione, ValutazioneCompetenza } from '../types';
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
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Badge from '@mui/material/Badge';
import { M3Dialog, TextField } from './ui';
import { useUIStore } from '../stores/useUIStore';

// Fase 3 continuation: Route daily quick evaluation gestures through AIBrain
import { AIBrain } from '../ai/brain/AIBrain';

interface QuickEvaluationModalProps {
    student: Studente;
    lesson: Lezione;
    settings: TimetableSettings;
    onClose: () => void;
    onSaveEvaluation: (evaluation: Omit<Valutazione, 'id'>) => void;
    onSaveCompetencyEvaluation: (evaluation: Omit<ValutazioneCompetenza, 'id'>) => void;
}

const getTestTypeIcon = (tipo: string) => {
    switch(tipo) {
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
    elevation={0}
    sx={{
      borderRadius: 'var(--md-sys-shape-corner-extra-large)',
      border: `2px solid ${selected ? 'var(--md-sys-color-primary)' : 'color-mix(in srgb, var(--md-sys-color-outline-variant) 19%, transparent)'}`,
      bgcolor: selected ? 'var(--md-sys-color-primary-container)' : 'color-mix(in srgb, var(--md-sys-color-surface-container) 50%, transparent)',
      transform: selected ? 'scale(1.05)' : 'scale(1)',
      transition: 'all var(--md-sys-motion-duration-short) var(--md-sys-motion-easing-standard)',
      overflow: 'hidden',
      '&:hover': { border: `2px solid var(--md-sys-color-outline)`, bgcolor: selected ? 'var(--md-sys-color-primary-container)' : 'var(--md-sys-color-surface-container-high)' },
    }}
  >
    <ButtonBase
      onClick={onClick}
      aria-pressed={selected}
      aria-label={label}
      sx={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        p: 4, gap: 2, minWidth: 'var(--md-sys-spacing-16)', width: '100%',
        color: selected ? 'var(--md-sys-color-on-primary-container)' : 'var(--md-sys-color-on-surface)',
      }}
    >
      <Box sx={{ width: 'var(--md-sys-spacing-12)', height: 'var(--md-sys-spacing-12)', borderRadius: 'var(--md-sys-shape-corner-medium)', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: selected ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-surface)', color: selected ? 'var(--md-sys-color-on-primary)' : 'var(--md-sys-color-primary)', boxShadow: selected ? 'var(--md-sys-elevation-level2)' : 'none', transition: 'all var(--md-sys-motion-duration-short) var(--md-sys-motion-easing-standard)' }}>
        <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 'var(--icon-size-medium)', userSelect: 'none', fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>{icon}</Box>
      </Box>
      <Box component="span" sx={{ fontSize: 'var(--md-sys-typescale-body-large-font-size)', fontFamily: 'var(--md-sys-typescale-body-small-font-family)' }}>{label}</Box>
    </ButtonBase>
  </Paper>
);

const QuickEvaluationModal: React.FC<QuickEvaluationModalProps> = ({ student, lesson, settings, onClose, onSaveEvaluation, onSaveCompetencyEvaluation }) => {
    const { showToast } = useUIStore(state => ({ showToast: state.actions.showToast }));
    const [activeTab, setActiveTab] = useState<'voto' | 'competenza'>('voto');

    // State for 'voto' tab
    const [tipo, setTipo] = useState<Valutazione['tipo']>('Orale');
    const [voto, setVoto] = useState<string>('');
    const [argomento, setArgomento] = useState<string>(lesson.contenuto);
    const [noteVoto, setNoteVoto] = useState<string>('');

    // State for 'competenza' tab
    const [selectedCompetenzaId, setSelectedCompetenzaId] = useState<string>(settings.competenze[0]?.id || '');
    const [selectedLevelId, setSelectedLevelId] = useState<string>('');
    const [noteCompetenza, setNoteCompetenza] = useState<string>('');

    // Fase 3 continuation (user-centric daily gesture): Real AIBrain consumption in QuickEvaluationModal
    const quickEvalContext = React.useMemo(() => AIBrain.buildContext({
      source: 'quick-evaluation-modal',
      extra: { 
        studentId: student.id,
        lessonMateria: lesson.materia,
        tipo 
      }
    }), [student.id, lesson.materia, tipo]);

    const quickEvalRecs = React.useMemo(() => {
      try { return AIBrain.getUnifiedRecommendations(quickEvalContext); } catch { return null; }
    }, [quickEvalContext]);

    const [quickEvalTip, setQuickEvalTip] = React.useState<string | null>(null);
    const [quickEvalLoading, setQuickEvalLoading] = React.useState(false);

    const fetchQuickEvalTip = React.useCallback(async () => {
      setQuickEvalLoading(true);
      try {
        const res = await AIBrain.ask({
          prompt: `Suggerisci un insight rapido per la valutazione rapida dello studente (materia: ${lesson.materia}).`,
          context: quickEvalContext,
          mode: 'balanced'
        });
        setQuickEvalTip(res.content);
        if (import.meta.env.DEV) {
          AIBrain.migrateLegacyAsk('legacy-quick-eval', quickEvalContext).catch(() => {});
        }
      } catch {
        setQuickEvalTip('Impossibile ottenere suggerimento AIBrain.');
      } finally {
        setQuickEvalLoading(false);
      }
    }, [lesson.materia, quickEvalContext]);

    const handleSaveVoto = () => {
        if (!voto) {
            showToast('Per favore, inserisci un voto.', 'error');
            return;
        }
        onSaveEvaluation({
            studenteId: student.id,
            materia: lesson.materia,
            data: new Date().toISOString(),
            tipo,
            voto,
            argomento,
            note: noteVoto,
            lezioneId: lesson.id
        });
        onClose();
    };

    const handleSaveCompetenza = () => {
        if (!selectedLevelId) {
            showToast('Per favore, seleziona un livello di competenza.', 'error');
            return;
        }
        onSaveCompetencyEvaluation({
            studenteId: student.id,
            competenzaId: selectedCompetenzaId,
            livelloId: selectedLevelId,
            materia: lesson.materia,
            data: new Date().toISOString(),
            nota: noteCompetenza,
            lezioneId: lesson.id
        });
        onClose();
    };

    const selectedCompetenza = settings.competenze.find(c => c.id === selectedCompetenzaId);

    const renderVotoTab = () => (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                <Typography variant="caption" component="span">Tipo Prova</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
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
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                                <FormControl fullWidth>
                  <InputLabel id="quick-voto-label" shrink>Voto / Giudizio</InputLabel>
                  <Select
                    labelId="quick-voto-label"
                    value={voto}
                    label="Voto / Giudizio"
                    displayEmpty
                    notched
                    onChange={(e: SelectChangeEvent) => setVoto(e.target.value)}
                    required
                  >
                    <MenuItem value="">Seleziona...</MenuItem>
                    {RATING_OPTIONS.map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
                  </Select>
                </FormControl>

                <TextField
                    id="argomento"
                    label="Argomento"
                    value={argomento}
                    onChange={e => setArgomento(e.target.value)}
                />

                <TextField multiline
                    id="note-voto"
                    label="Note"
                    value={noteVoto}
                    onChange={e => setNoteVoto(e.target.value)}
                    rows={2}
                />
            </Box>
        </Box>
    );
    
    const renderCompetenzaTab = () => (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                        <FormControl fullWidth>
              <InputLabel id="quick-competenza-label" shrink>Competenza</InputLabel>
              <Select
                labelId="quick-competenza-label"
                value={selectedCompetenzaId}
                label="Competenza"
                displayEmpty
                notched
                onChange={(e: SelectChangeEvent) => { setSelectedCompetenzaId(e.target.value); setSelectedLevelId(''); }}
              >
                {settings.competenze.map(c => <MenuItem key={c.id} value={c.id}>{c.nome}</MenuItem>)}
              </Select>
            </FormControl>

            {selectedCompetenza && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                    <Typography variant="caption" component="span">Livello Raggiunto</Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                        {selectedCompetenza.livelli.map(level => (
                            <Box
                                key={level.id}
                                component="label"
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: 'var(--md-sys-spacing-6)',
                                    borderRadius: 'var(--md-sys-shape-corner-medium)',
                                    transition: 'background-color var(--md-sys-motion-duration-medium) var(--md-sys-motion-easing-standard)',
                                    cursor: 'pointer',
                                    border: 'var(--md-sys-border-width-thin) solid transparent',
                                    backgroundColor: selectedLevelId === level.id ? 'var(--md-sys-color-primary-container)' : 'transparent',
                                    borderColor: selectedLevelId === level.id ? 'var(--md-sys-color-primary)' : 'transparent',
                                    '&:hover': {
                                        backgroundColor: selectedLevelId === level.id
                                            ? 'var(--md-sys-color-primary-container)'
                                            : 'var(--md-sys-color-surface-container-high)' } }}
                            >
                                <input type="radio" name="level" value={level.id} checked={selectedLevelId === level.id} onChange={e => setSelectedLevelId(e.target.value)} required />
                                <Typography
                                    component="span"
                                    sx={{
                                        fontSize: 'var(--md-sys-typescale-body-medium-font-size)',
                                        color: selectedLevelId === level.id ? 'var(--md-sys-color-on-primary-container)' : 'var(--md-sys-color-on-surface)',
                                        fontWeight: selectedLevelId === level.id ? 'var(--md-sys-typescale-weight-bold)' : 'var(--md-sys-typescale-weight-regular)' }}
                                >{level.descrizione}</Typography>
                            </Box>
                        ))}
                    </Box>
                </Box>
            )}

            <TextField multiline
                id="note-competenza"
                label="Note"
                value={noteCompetenza}
                onChange={e => setNoteCompetenza(e.target.value)}
                rows={2}
            />
        </Box>
    );

    return (
        <M3Dialog
            title="Valutazione Rapida"
            onClose={onClose}
            maxWidth="md"
            buttons={<>
                <Button onClick={onClose} variant="text">Annulla</Button>
                <Button
                    onClick={activeTab === 'voto' ? handleSaveVoto : handleSaveCompetenza}
                    variant="contained"
                >
                    Registra {activeTab === 'voto' ? 'Voto' : 'Competenza'}
                </Button>
            </>}
        >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                <Typography variant="h6">{student.cognome} {student.nome}</Typography>
                <Typography variant="body2">{lesson.materia} - {new Date().toLocaleDateString('it-IT')}</Typography>
            </Box>

            {/* Fase 3 continuation: Real AIBrain consumption + visible block (daily quick grading gesture) */}
            {quickEvalRecs?.primary && (
              <Box sx={{ p: 1, borderRadius: 'var(--md-sys-shape-corner-small)', bgcolor: 'var(--md-sys-color-tertiary-container)' }}>
                <Typography variant="caption" sx={{ color: 'var(--md-sys-color-on-tertiary-container)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Box component="span" className="material-symbols-outlined" sx={{ fontSize: '1rem' }}>auto_awesome</Box>
                  AIBrain (Fase 3): {quickEvalRecs.primary.label || quickEvalRecs.primary.title}
                </Typography>
              </Box>
            )}

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Button
                size="small"
                variant="outlined"
                onClick={fetchQuickEvalTip}
                disabled={quickEvalLoading}
                startIcon={<Box component="span" className="material-symbols-outlined" sx={{ fontSize: '1rem' }}>auto_awesome</Box>}
              >
                {quickEvalLoading ? 'AIBrain…' : 'Insight AIBrain (Valut. Rapida)'}
              </Button>
              {quickEvalTip && (
                <Box sx={{ p: 1, borderRadius: 'var(--md-sys-shape-corner-small)', bgcolor: 'var(--md-sys-color-secondary-container)', flex: 1 }}>
                  <Typography variant="caption" sx={{ color: 'var(--md-sys-color-on-secondary-container)', fontWeight: 500 }}>
                    AIBrain (Fase 3): {quickEvalTip}
                  </Typography>
                </Box>
              )}
            </Box>

                        <Tabs
              value={activeTab}
              onChange={(_, v: string) => ((id) => setActiveTab(id as 'voto' | 'competenza'))(v)}
              indicatorColor="primary"
              textColor="primary"
              aria-label="Sezioni di navigazione"
              sx={{
                bgcolor: 'var(--md-sys-color-surface-container-low)',
                borderRadius: 'var(--md-sys-shape-corner-full)',
                border: '1px solid var(--md-sys-color-outline-variant)',
                minHeight: 'auto',
                p: 0.5,
              }}
            >
              {([
                    { id: 'voto', label: 'Voto Disciplinare' },
                    { id: 'competenza', label: 'Competenza' }
                ]).map((tab: { id: string; label: string; icon?: string; badge?: number | string }) => (
                <Tab
                  key={tab.id}
                  value={tab.id}
                  id={`tab-${tab.id}`}
                  aria-controls={`panel-${tab.id}`}
                  data-testid={`tab-${tab.id}`}
                  label={(
                    <Badge badgeContent={tab.badge} color="error">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {tab.icon && <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 'var(--md-sys-typescale-label-large-font-size)' }}>{tab.icon}</Box>}
                        {tab.label}
                      </Box>
                    </Badge>
                  )}
                  sx={{
                    borderRadius: 'var(--md-sys-shape-corner-full)',
                    minHeight: 'auto',
                    py: 1,
                    px: 2,
                    textTransform: 'uppercase',
                    fontSize: 'var(--md-sys-typescale-label-small-font-size)',
                  }}
                />
              ))}
            </Tabs>

            {activeTab === 'voto' ? renderVotoTab() : renderCompetenzaTab()}
        </M3Dialog>
    );
};

export default QuickEvaluationModal;

