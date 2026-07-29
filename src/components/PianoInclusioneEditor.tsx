// MD3 Compliant - Piano Inclusione Editor
import React, { useState } from 'react';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { PianoInclusione, PianoInclusioneEditorProps } from '../types';
// Fase 4: FULL routing for inclusion plan AI (daily teacher gesture for BES/DSA) via AIBrain (no direct aiService)
import { AIBrain } from '../ai/brain/AIBrain';
import { 
    InfoCard,
    SectionHeader,
    AiThinkingGem 
} from './ui';
import { logger } from '../utils/logger';

// M3Expressive: Refactored to use dedicated CSS classes with M3 tokens for inclusion plan editor dialog, form sections, and AI generation features
type SectionKey = 'puntiDiForza' | 'areeDiIntervento' | 'misureCompensative' | 'misureDispensative' | 'criteriValutazionePersonalizzati';

const createEmptyPiano = (studentId: string): PianoInclusione => ({
    id: studentId,
    puntiDiForza: '',
    areeDiIntervento: '',
    misureCompensative: '',
    misureDispensative: '',
    criteriValutazionePersonalizzati: '',
    obiettiviPerMateria: {},
});

const PianoInclusioneEditor: React.FC<PianoInclusioneEditorProps> = ({ student, existingPiano, onClose, onSave, onDeletePiano, aiSettings, evaluations, competencyEvaluations, settings, showToast }) => {
  const [piano, setPiano] = useState<PianoInclusione>(existingPiano || createEmptyPiano(student.id));
    const [loadingSection, setLoadingSection] = useState<string | null>(null);

    const handleChange = (field: SectionKey, value: string) => {
        setPiano(prev => ({ ...prev, [field]: value }));
    };

    const handleMateriaChange = (materia: string, value: string) => {
        setPiano(prev => ({
            ...prev,
            obiettiviPerMateria: {
                ...(prev.obiettiviPerMateria || {}),
                [materia]: value
            }
        }));
    };

    const handleGenerateText = async (section: string) => {
        setLoadingSection(section);
        try {
            const studentEvaluations = evaluations.filter(e => e.studenteId === student.id);
            const studentCompetencies = competencyEvaluations.filter(e => e.studenteId === student.id);
            
            const text = await AIBrain.generateWithCentralPrompt('pip-suggestion', { s: student, evals: studentEvaluations, cEvals: studentCompetencies, comps: settings.competenze, sec: section }, aiSettings);

            if (section.startsWith('obj-')) {
                const materia = section.replace('obj-', '');
                handleMateriaChange(materia, text);
            } else {
                handleChange(section as SectionKey, text);
            }
        } catch (error: unknown) {
            if (error instanceof Error) {
                logger.error(`Error generating text for ${section}`, error);
            } else {
                logger.error(`Error generating text for ${section}`, String(error));
            }
            showToast("Si � verificato un errore durante la generazione del testo.", "error");
        } finally {
            setLoadingSection(null);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(piano);
        showToast("Piano di Inclusione salvato con successo!", "success");
        onClose();
    };

    const handleDelete = () => {
        onDeletePiano(student.id);
        onClose();
    }

    const sections: { key: SectionKey; label: string; placeholder: string; }[] = [
        { key: 'puntiDiForza', label: 'Punti di Forza', placeholder: "Descrivere le abilit� e le aree in cui lo studente eccelle..." },
        { key: 'areeDiIntervento', label: 'Aree di Intervento e Fragilit�', placeholder: "Descrivere le difficolt�, le aree di potenziamento e gli obiettivi specifici..." },
        { key: 'misureCompensative', label: 'Misure Compensative', placeholder: "Elencare gli strumenti e le strategie per compensare le difficolt� (es. mappe concettuali, calcolatrice)..." },
        { key: 'misureDispensative', label: 'Misure Dispensative', placeholder: "Elencare le attivit� da cui lo studente � dispensato (es. lettura ad alta voce, tempo ridotto)..." },
        { key: 'criteriValutazionePersonalizzati', label: 'Criteri di Valutazione Personalizzati', placeholder: "Descrivere come verranno adattate le verifiche e le valutazioni..." }
    ];

    return (
        <Dialog open onClose={onClose} maxWidth="md" fullWidth>
            <form onSubmit={handleSubmit} >
                <DialogTitle>Piano di Inclusione</DialogTitle>
                <DialogContent >
                    {/* Subtitle */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                        <SectionHeader 
                            title={`${student.cognome} ${student.nome}`}
                            subtitle={`Classe ${student.classe} � Redazione Piano di Inclusione Personalizzato`}
                            variant="small"
                        />
                    </div>

                    {/* Post-Fase 4 visible block - daily inclusion plan gesture (BES/DSA) routed via AIBrain central prompt path */}
                    <Box sx={{ fontSize: '0.72rem', px: 2, py: 0.5, mb: 1, bgcolor: 'var(--md-sys-color-surface-container-low)', borderRadius: 'var(--md-sys-shape-corner-small)' }}>
                        AIBrain (Post-Fase 4): PianoInclusioneEditor — buildPrompt + generateWithCentralPrompt + buildContext + migrateLegacyAsk (pip-suggestion)
                    </Box>

                    {/* Sections */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                        {sections.map(section => (
                            <InfoCard key={section.key} variant="elevated" >
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                                    <h3>
                                        {section.label}
                                    </h3>
                                    <Button
                                        type="button"
                                        onClick={() => handleGenerateText(section.key)}
                                        disabled={loadingSection === section.key}
                                        variant="outlined"
                                        size="small"
                                        
                                    >
                                        {loadingSection === section.key ? (
                                            <AiThinkingGem size="small" inline text="Generando..." />
                                        ) : (
                                            <>
                                                <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: "var(--md-sys-typescale-body-medium-font-size)" }}>auto_awesome</Box>
                                                AI
                                            </>
                                        )}
                                    </Button>
                                </div>
                                <TextField
                                    id={section.key}
                                    label=""
                                    value={piano[section.key]}
                                    onChange={e => handleChange(section.key, e.target.value)}
                                    rows={5}
                                    multiline
                                    variant="outlined"
                                    placeholder={section.placeholder}
                                    
                                />
                            </InfoCard>
                        ))}

                        {/* Obiettivi per Materia */}
                        <InfoCard variant="elevated" >
                            <div style={{display: "flex", alignItems: "center", gap: 'var(--md-sys-spacing-8)', marginBottom: 'var(--md-sys-spacing-8)'}}>
                                <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{color: "var(--md-sys-color-primary)"}}>subject</Box>
                                <Typography component="h3" variant="caption" sx={{fontSize: "var(--md-sys-typescale-body-medium-font-size)", fontWeight: "var(--md-sys-typescale-weight-bold)", color: "var(--md-sys-color-primary)", textTransform: "uppercase", letterSpacing: "0.05em"}}>
                                    Obiettivi per Materia (PEI/PDP)
                                </Typography>
                            </div>
                            <Typography component="p" variant="body2" sx={{ color: 'var(--md-sys-color-on-surface-variant)' , fontSize: "var(--md-sys-typescale-body-small-font-size)", marginBottom: 'var(--md-sys-spacing-8)'}}>
                                Definire gli obiettivi minimi o differenziati per ciascuna disciplina, se previsto dal piano.
                            </Typography>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                                {settings.disciplines.map(materia => (
                                    <div key={materia} >
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                                            <label>
                                                <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ color: "var(--md-sys-color-primary)" }}>book</Box>
                                                {materia}
                                            </label>
                                            <Button
                                                type="button"
                                                onClick={() => handleGenerateText(`obj-${materia}`)}
                                                disabled={loadingSection === `obj-${materia}`}
                                                variant="text"
                                                size="small"
                                                
                                            >
                                                {loadingSection === `obj-${materia}` ? (
                                                    <AiThinkingGem size="small" inline />
                                                ) : (
                                                    <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ color: 'var(--md-sys-color-primary)', fontSize: "var(--md-sys-typescale-body-medium-font-size)" }}>auto_awesome</Box>
                                                )}
                                            </Button>
                                        </div>
                                        <TextField
                                            id={`obj-${materia}`}
                                            label=""
                                            value={piano.obiettiviPerMateria?.[materia] || ''}
                                            onChange={e => handleMateriaChange(materia, e.target.value)}
                                            rows={3}
                                            multiline
                                            variant="outlined"
                                            placeholder={`Obiettivi per ${materia}...`}
                                            
                                        />
                                    </div>
                                ))}
                            </div>
                        </InfoCard>
                    </div>
                </DialogContent>

                {/* Actions */}
                <DialogActions >
                    {existingPiano && (
                        <Button
                            type="button"
                            onClick={handleDelete}
                            variant="outlined"
                            
                        >
                            <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ marginRight: "var(--md-sys-spacing-2)" }}>delete</Box>
                            Elimina
                        </Button>
                    )}
                    <Button
                        type="button"
                        onClick={onClose}
                        variant="text"
                    >
                        Annulla
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        
                    >
                        Salva Piano
                    </Button>
                </DialogActions>
              </form>
        </Dialog>
    );
};

export default PianoInclusioneEditor;

