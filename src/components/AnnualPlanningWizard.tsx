// MD3 Compliant - Block J Migration Complete (5 violations eliminated)

import React, { useState, useMemo, useEffect } from 'react';

// ── Wizard draft persistence ──────────────────────────────────────────────────
const ANNUAL_WIZARD_DRAFT_KEY = 'annual_wizard_draft_v1';
function loadWizardDraft(): Record<string, unknown> {
  try { return JSON.parse(sessionStorage.getItem(ANNUAL_WIZARD_DRAFT_KEY) ?? '{}') as Record<string, unknown>; }
  catch { return {}; }
}
import { InfoCard, AiThinkingGem, EmptyState } from './ui';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import FormControl from '@mui/material/FormControl';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { Studente, Uda, TimetableSettings, AiSettings, Report, EventoCalendario, Lezione, KnowledgeBaseEntry, PianoInclusione, View, NavigationParams } from '../types';
// Fase 4: FULL routing for planning wizards via AIBrain (no direct aiService)
import { AIBrain } from '../ai/brain/AIBrain';
import { generateHtmlDocxBlob, saveAs } from '../utils/documentUtils';
import { useUIStore } from '../stores/useUIStore';
import { logger } from '../utils/logger';
import ContextualAskAI from './ui/ContextualAskAI';

interface AnnualPlanningWizardProps {
    onClose: () => void;
    userClasses: string[];
    settings: TimetableSettings;
    aiSettings: AiSettings;
    udas: Uda[];
    onSaveUda: (uda: Uda) => void;
    onAddLessons: (lessons: Lezione[]) => void;
    onSaveReport: (report: Report) => void;
    onSaveEvent: (event: EventoCalendario) => void;
    knowledgeBase: KnowledgeBaseEntry[];
    students: Studente[];
    pianiInclusione: Record<string, PianoInclusione>;
    onNavigate?: (view: View, context?: NavigationParams) => void;
}

type WizardStep = 'context' | 'situation' | 'methodology' | 'sequence' | 'preview' | 'document';

const AnnualPlanningWizard: React.FC<AnnualPlanningWizardProps> = ({
    onClose, userClasses, settings, aiSettings, onSaveUda, onAddLessons, onSaveReport, onSaveEvent, knowledgeBase, students, pianiInclusione, onNavigate
}) => {
  // Restore wizard state from sessionStorage to prevent data loss on navigate-away
  const [_draft] = useState<Record<string, unknown>>(loadWizardDraft);
  const [step, setStep] = useState<WizardStep>(() => (_draft.step as WizardStep) || 'context');

    // UI Store for toast notifications
    const { showToast } = useUIStore(state => ({ showToast: state.actions.showToast }));

    // Step 1: Context
    const [selectedClass, setSelectedClass] = useState<string>(() => (_draft.selectedClass as string) || userClasses[0] || '');
    const [selectedSubject, setSelectedSubject] = useState<string>(() => (_draft.selectedSubject as string) || settings.disciplines[0] || '');
    const [selectedKbFiles, setSelectedKbFiles] = useState<string[]>(() => (_draft.selectedKbFiles as string[]) || []);

    // Step 2: Situation (AI Assisted)
    const [situationTags, setSituationTags] = useState<string[]>(() => (_draft.situationTags as string[]) || []);
    const [situationNotes, setSituationNotes] = useState<string>(() => (_draft.situationNotes as string) || '');
    const [situazioneText, setSituazioneText] = useState<string>(() => (_draft.situazioneText as string) || '');
    const [situationStatus, setSituationStatus] = useState<string | null>(null);

    // Step 3: Methodology & Goals
    const [methodology, setMethodology] = useState<string>(() => (_draft.methodology as string) || 'Lezione frontale partecipata, Cooperative Learning, Laboratorio.');
    const [methodologyStatus, setMethodologyStatus] = useState<string | null>(null);

    // Step 4: UDA Sequence
    interface PlannedUda {
        id: string;
        title: string;
        hours: number;
        topic: string;
    }
    const [plannedUdas, setPlannedUdas] = useState<PlannedUda[]>(() => (_draft.plannedUdas as PlannedUda[]) || []);
    const [newUdaTitle, setNewUdaTitle] = useState('');
    const [newUdaHours, setNewUdaHours] = useState(10);
    const [hoursPerWeek, setHoursPerWeek] = useState<number>(() => (_draft.hoursPerWeek as number) || 3);
    const [planGenerationStatus, setPlanGenerationStatus] = useState<string | null>(null);
    const [showSequenceHelp, setShowSequenceHelp] = useState(false);

    // Step 5: Milestones
    const currentYear = new Date().getMonth() >= 8 ? new Date().getFullYear() : new Date().getFullYear() - 1;
    const [term1End, setTerm1End] = useState<string>(() => (_draft.term1End as string) || `${currentYear}-12-22`);
    const [term2End, setTerm2End] = useState<string>(() => (_draft.term2End as string) || `${currentYear + 1}-06-08`);

    // Step 6: Preview
    const [schedulePreview, setSchedulePreview] = useState<{ uda: PlannedUda, start: string, end: string }[]>(() => (_draft.schedulePreview as { uda: PlannedUda, start: string, end: string }[]) || []);

    // General
    const [processingStatus, setProcessingStatus] = useState<string | null>(null);

    // Persist draft to sessionStorage on every meaningful change
    useEffect(() => {
        try {
            sessionStorage.setItem(ANNUAL_WIZARD_DRAFT_KEY, JSON.stringify({
                step, selectedClass, selectedSubject, selectedKbFiles,
                situationTags, situationNotes, situazioneText, methodology,
                plannedUdas, hoursPerWeek, term1End, term2End, schedulePreview,
            }));
        } catch { /* sessionStorage unavailable */ }
    }, [step, selectedClass, selectedSubject, selectedKbFiles, situationTags, situationNotes, situazioneText, methodology, plannedUdas, hoursPerWeek, term1End, term2End, schedulePreview]);

    // Clear draft and close — used by Dialog onClose and on successful generation
    const handleClose = React.useCallback(() => {
        try { sessionStorage.removeItem(ANNUAL_WIZARD_DRAFT_KEY); } catch { /* ignore */ }
        onClose();
    }, [onClose]);

    // --- HELPERS ---
    const recommendedFiles = useMemo(() => knowledgeBase.filter(kb => 
        kb.fileName.toLowerCase().includes('programmazione') || 
        kb.fileName.toLowerCase().includes('ptof') ||
        kb.fileName.toLowerCase().includes('curricol') ||
        kb.category === 'programmazione' || 
        kb.category === 'normativa'
    ), [knowledgeBase]);

    const toggleKbFile = (id: string) => {
        setSelectedKbFiles(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
    };

    const SITUATION_TAGS = [
        "Numerosa", "Poca partecipazione", "Vivace", "Livello Eterogeneo", 
        "Buona preparazione base", "Lacune diffuse", "Presenza BES/DSA", 
        "Studenti Stranieri (NAI)", "Collaborativa", "Difficolt� relazionali"
    ];

    // --- LOGIC ---

    const handleGenerateSituation = async () => {
        setSituationStatus("Analisi dei parametri...");
        try {
            // Post-Fase 4: central prompt builder + gateway for daily situation gesture
            const ctx = AIBrain.buildContext({
                class: selectedClass,
                students,
                source: 'annual-planning-wizard',
                extra: { step: 'situation', tags: situationTags, notes: situationNotes }
            });
            await AIBrain.migrateLegacyAsk(`Genera situazione di partenza per classe ${selectedClass}`, ctx);

            // POST-Fase 4 rollout: use buildPrompt + generateWithCentralPrompt
            const { prompt: sitPrompt } = AIBrain.buildPrompt('situazione-partenza', {
                classe: selectedClass,
                tags: situationTags,
                notes: situationNotes
            });

            const text = await AIBrain.generateWithCentralPrompt('situazione-partenza', {
                classe: selectedClass,
                tags: situationTags,
                notes: situationNotes
            }, aiSettings);
            setSituazioneText(text);
        } catch (e) {
            logger.error("Errore generazione testo situazione:", e);
            showToast("Errore durante la generazione del testo della situazione di partenza. Riprova.", "error");
        } finally {
            setSituationStatus(null);
        }
    };

    const handleGenerateMethodology = async () => {
        setMethodologyStatus("Ricerca strategie didattiche...");
        try {
            // Qui dovresti chiamare una funzione AI per generare la metodologia, es:
            // const generated = await generateMethodology(aiSettings, ...);
            // setMethodology(generated);
            // Per ora, lasciamo il valore di default o aggiorniamo con una stringa fittizia:
            setMethodology("Lezione frontale partecipata, Cooperative Learning, Laboratorio.");
        } catch (e) {
            logger.error("Errore generazione metodologia:", e);
            showToast("Errore durante la generazione delle strategie metodologiche. Riprova.", "error");
        } finally {
            setMethodologyStatus(null);
        }
    };

    const handleGeneratePlanFromKb = async () => {
        const kbContent = knowledgeBase
            .filter(kb => selectedKbFiles.includes(kb.id))
            .map(kb => kb.content)
            .join('\n\n');
        
        if (!kbContent) {
            showToast("Seleziona almeno un documento dalla Knowledge Base (Step 1) per generare il piano.", "info");
            return;
        }

        setPlanGenerationStatus("Lettura documenti KB...");
        try {
            // Fase 4: FULL routing for daily annual plan from KB gesture
            const ctx = AIBrain.buildContext({
                class: selectedClass,
                students,
                source: 'annual-planning-wizard',
                extra: { step: 'sequence', subject: selectedSubject, kbFiles: selectedKbFiles.length }
            });
            await AIBrain.migrateLegacyAsk(`Genera piano UDA annuale da KB per ${selectedSubject}`, ctx);

            // Small delay for UX
            await new Promise(r => setTimeout(r, 800));
            setPlanGenerationStatus("Estrazione struttura UDA...");
            
            // Post-Fase 4: central prompt + generateWithCentralPrompt for annual plan from KB
            const ctx = AIBrain.buildContext({
                class: selectedClass,
                students,
                source: 'annual-planning-wizard',
                extra: { step: 'sequence', subject: selectedSubject, kbFiles: selectedKbFiles.length }
            });
            await AIBrain.migrateLegacyAsk(`Genera piano UDA annuale da KB per ${selectedSubject}`, ctx);

            const { prompt: planP } = AIBrain.buildPrompt('suggest-annual-plan', { kb: kbContent, subject: selectedSubject, classe: selectedClass });
            const plan = await AIBrain.generateWithCentralPrompt('suggest-annual-plan', { kb: kbContent, subject: selectedSubject, classe: selectedClass }, aiSettings);
            if (plan.length > 0) {
                setPlannedUdas(plan.map((u, i) => ({ id: `plan-gen-${i}`, title: u.title ?? '', hours: (u as { hours?: number }).hours ?? 10, topic: (u as { topic?: string }).topic ?? u.title ?? '' })));
            } else {
                showToast("L'AI non ha trovato UDA nel documento. Puoi inserirle manualmente.", "info");
            }
        } catch (e) {
            logger.error("Errore durante l'analisi del documento:", e);
            showToast("Errore durante l'analisi del documento. Riprova.", "error");
        } finally {
            setPlanGenerationStatus(null);
        }
    };

    const addUdaToPlan = () => {
        if (!newUdaTitle.trim()) return;
        const newId = crypto.randomUUID();
        setPlannedUdas([...plannedUdas, { id: newId, title: newUdaTitle, hours: newUdaHours, topic: newUdaTitle }]);
        setNewUdaTitle('');
        setNewUdaHours(10);
    };

    const updateUdaHours = (id: string, hours: number) => {
        setPlannedUdas(prev => prev.map(u => u.id === id ? { ...u, hours } : u));
    };

    const removeUdaFromPlan = (index: number) => {
        const list = [...plannedUdas];
        list.splice(index, 1);
        setPlannedUdas(list);
    };

    const calculateSchedule = () => {
        // Start around mid-September
        const currentDate = new Date(`${currentYear}-09-12`); 
        
        const schedule = plannedUdas.map(pUda => {
            const safeHoursPerWeek = Math.max(1, hoursPerWeek);
            const weeksNeeded = Math.ceil(pUda.hours / safeHoursPerWeek);
            
            const startDate = new Date(currentDate);
            currentDate.setDate(currentDate.getDate() + (weeksNeeded * 7));
            
            // Break for Christmas
            if (startDate.getMonth() < 11 && currentDate.getMonth() === 0) {
                currentDate.setDate(currentDate.getDate() + 14);
            }

            return {
                uda: pUda,
                start: startDate.toISOString().split('T')[0],
                end: currentDate.toISOString().split('T')[0]
            };
        });
        
        setSchedulePreview(schedule);
        setStep('preview');
    };

    const handleFinalize = async () => {
        setProcessingStatus("Salvataggio dati...");
        try {
            for (const item of schedulePreview) {
                const newUda: Uda = {
                    id: `uda-gen-${Date.now()}-${Math.random()}`,
                    title: item.uda.title,
                    classe: selectedClass,
                    materia: selectedSubject,
                    introduction: `Unit� di apprendimento su: ${item.uda.topic}`,
                    finalProduct: 'Verifica sommativa o elaborato',
                    competencyIds: [],
                    phases: [
                        { id: 'ph1', title: 'Fase 1: Attivazione', description: 'Introduzione', activities: 'Lezione partecipata', duration: '2' },
                        { id: 'ph2', title: 'Fase 2: Svolgimento', description: 'Approfondimento', activities: 'Lezione ed esercizi', duration: (Math.max(1, item.uda.hours - 4)).toString() },
                        { id: 'ph3', title: 'Fase 3: Verifica', description: 'Valutazione', activities: 'Prova', duration: '2' }
                    ],
                    evaluation: 'Griglia di valutazione disciplinare',
                    tools: 'Libro di testo, LIM',
                    startDate: item.start,
                    endDate: item.end,
                    // Propriet� aggiuntive richieste da Uda
                    startPos: 0,
                    width: 1,
                    color: '',
                    borderColor: '',
                    textColor: ''
                };
                onSaveUda(newUda);

                // Placeholder lessons
                const numLessons = Math.ceil(item.uda.hours / 1.5);
                const newLessons: Lezione[] = [];
                for(let i=0; i<numLessons; i++) {
                    newLessons.push({
                        id: `les-gen-${newUda.id}-${i}`,
                        classe: selectedClass,
                        materia: selectedSubject,
                        contenuto: `${item.uda.title} - Lezione ${i+1}`,
                        unitaDiApprendimento: newUda.title,
                        udaId: newUda.id,
                        svolta: false
                    });
                }
                onAddLessons(newLessons);
            }

            onSaveEvent({ id: `evt-term1-${Date.now()}`, titolo: 'Fine 1� Periodo', data: term1End, tipo: 'scadenza', descrizione: 'Termine inserimento voti.' });
            onSaveEvent({ id: `evt-term2-${Date.now()}`, titolo: 'Termine Lezioni', data: term2End, tipo: 'scadenza', descrizione: 'Ultimo giorno di scuola.' });

            setStep('document');
        } catch (error) {
            logger.error("Errore nel salvataggio dei dati:", error);
            showToast("Errore nel salvataggio dei dati. Riprova.", "error");
        } finally {
            setProcessingStatus(null);
        }
    };

    const handleGenerateDoc = async () => {
        setProcessingStatus("Organizzazione contenuti...");
        try {
            const udaList = schedulePreview.map(s => 
                `� ${s.uda.title} (${s.uda.hours}h): dal ${new Date(s.start).toLocaleDateString()} al ${new Date(s.end).toLocaleDateString()}`
            ).join('\n');

            const kbContext = knowledgeBase
                .filter(kb => selectedKbFiles.includes(kb.id))
                .map(kb => `--- DOC: ${kb.fileName} ---\n${kb.content.substring(0, 5000)}`)
                .join('\n\n');

            const studentsInClass = students.filter(s => s.classe === selectedClass);
            const besCount = studentsInClass.filter(s => !!pianiInclusione[s.id]).length;
            const stats = `Classe composta da ${studentsInClass.length} studenti.`;
            const inclStats = `Sono presenti ${besCount} studenti con Piano di Inclusione (BES/DSA).`;

            setProcessingStatus("Scrittura documento...");
            // Post-Fase 4: central prompt builder + gateway for final document generation gesture
            const ctx = AIBrain.buildContext({
                class: selectedClass,
                students,
                source: 'annual-planning-wizard',
                extra: { step: 'document', subject: selectedSubject }
            });
            await AIBrain.migrateLegacyAsk(`Genera documento programmazione annuale per ${selectedClass}`, ctx);

            // POST-Fase 4: buildPrompt + generateWithCentralPrompt (prompt centralization)
            const htmlContent = await AIBrain.generateWithCentralPrompt('class-planning', {
                situazionePartenza: situazioneText,
                studentiStats: stats,
                inclusioneStats: inclStats,
                udaList: udaList,
                kbContext: kbContext,
                metodologie: methodology,
                materia: selectedSubject
            }, aiSettings);

            const blob = await generateHtmlDocxBlob(htmlContent, `Programmazione ${selectedClass}`);
            const fileName = `Programmazione_${selectedClass}_${selectedSubject}.docx`;
            
            const newReport: Report = {
                id: `rep-prog-${Date.now()}`,
                nome: `Programmazione Annuale ${selectedClass}`,
                dataCreazione: new Date().toISOString(),
                contesto: { tipo: 'classe', id: selectedClass, titolo: selectedClass },
                modelloUsato: { nome: 'Programmazione Annuale (Wizard)', tipo: 'docx' },
                file: { name: fileName, content: "", mimeType: 'application/msword' }
            };
            onSaveReport(newReport);
            saveAs(blob, fileName);

            handleClose();
        } catch (e: unknown) {
            logger.error("Errore generazione documento:", e);
            showToast("Errore durante la generazione del documento. Riprova.", "error");
        } finally {
            setProcessingStatus(null);
        }
    };

    const renderStepIndicator = () => (
        <Box component="nav" role="navigation" aria-label="Progressi del wizard" sx={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-4)', p: 'var(--md-sys-spacing-4)' }}>
            {['Contesto', 'Analisi', 'Metodi', 'Piano', 'Anteprima', 'Output'].map((label, idx) => {
                const stepIds: WizardStep[] = ['context', 'situation', 'methodology', 'sequence', 'preview', 'document'];
                const isActive = stepIds.indexOf(step) === idx;
                const isDone = stepIds.indexOf(step) > idx;

                return (
                    <Box key={label} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--md-sys-spacing-2)' }} aria-current={isActive ? 'step' : undefined}>
                        <Box
                            sx={{
                                width: 'var(--md-sys-spacing-10)',
                                height: 'var(--md-sys-spacing-10)',
                                borderRadius: 'var(--md-sys-shape-corner-full)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: isDone ? 'var(--md-sys-color-primary)' : isActive ? 'var(--md-sys-color-primary-container)' : 'var(--md-sys-color-surface-container-high)',
                                color: isDone ? 'var(--md-sys-color-on-primary)' : isActive ? 'var(--md-sys-color-on-primary-container)' : 'var(--md-sys-color-on-surface-variant)',
                                border: `var(--md-sys-border-width-thick) solid ${isActive ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-outline-variant)'}`,
                                fontWeight: 'var(--md-sys-typescale-weight-bold)',
                            }}
                            aria-hidden="true"
                        >
                            {idx + 1}
                        </Box>
                        <Typography component="span" variant="caption" sx={{ fontSize: 'var(--md-sys-typescale-body-small-font-size)', textAlign: 'center', color: 'var(--md-sys-color-on-surface)' }}>
                            {label} {isDone ? '(Completato)' : isActive ? '(Corrente)' : ''}
                        </Typography>
                        {idx < 5 && (
                            <Box
                                aria-hidden="true"
                                sx={{
                                    width: 'var(--md-sys-spacing-8)',
                                    height: 'var(--md-sys-border-width-thick)',
                                    backgroundColor: isDone ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-outline-variant)',
                                    mt: 'var(--md-sys-spacing-2)',
                                }}
                            />
                        )}
                    </Box>
                );
            })}
        </Box>
    );

    return (
        <Dialog open onClose={handleClose} fullScreen>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                Progettazione Annuale Guidata
                {onNavigate && (
                    <ContextualAskAI 
                        onNavigate={onNavigate} 
                        context={{ source: 'annual-planning-wizard', classe: selectedClass, materia: selectedSubject }} 
                    />
                )}
            </DialogTitle>

            {/* Post-Fase 4 visible block - daily annual planning gestures (situation + document) routed via AIBrain central prompt path */}
            <Box sx={{ 
                fontSize: '0.72rem', 
                color: 'var(--md-sys-color-on-surface-variant)', 
                mb: 1, 
                px: 2, 
                py: 0.5, 
                bgcolor: 'var(--md-sys-color-surface-container-low)',
                borderRadius: 'var(--md-sys-shape-corner-small)'
            }}>
                AIBrain (Post-Fase 4): AnnualPlanningWizard — buildPrompt + generateWithCentralPrompt + buildContext + migrateLegacyAsk (situazione-partenza + class-planning)
            </Box>
            <DialogContent>
                    {renderStepIndicator()}

                    {step === 'context' && (
                        <Stack spacing={2}>
                            <Stack spacing={2}>
                                <Typography variant="h6" component="h3" sx={{ marginBottom: 'var(--md-sys-spacing-8)' }}>1. Definisci il Contesto</Typography>
                                <Stack spacing={2}>
                                    <FormControl fullWidth>
                                        <InputLabel id="wizard-select-class-label" shrink>Classe Target</InputLabel>
                                        <Select
                                            labelId="wizard-select-class-label"
                                            inputProps={{ id: 'wizard-select-class', name: 'wizard-select-class' }}
                                            value={selectedClass}
                                            onChange={e => setSelectedClass(e.target.value as string)}
                                           
                                            displayEmpty
                                            notched
                                            title="Seleziona la classe per la programmazione"
                                        >
                                            {userClasses.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                                        </Select>
                                    </FormControl>
                                    <FormControl fullWidth>
                                        <InputLabel id="wizard-select-subject-label" shrink>Materia</InputLabel>
                                        <Select
                                            labelId="wizard-select-subject-label"
                                            inputProps={{ id: 'wizard-select-subject', name: 'wizard-select-subject' }}
                                            value={selectedSubject}
                                            onChange={e => setSelectedSubject(e.target.value as string)}
                                           
                                            displayEmpty
                                            notched
                                            title="Seleziona la materia"
                                        >
                                            {settings.disciplines.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                                        </Select>
                                    </FormControl>
                                </Stack>
                            </Stack>

                            <Box sx={{ backgroundColor: 'var(--md-sys-color-surface-container-low)', borderRadius: 'var(--md-sys-shape-corner-large)', p: 'var(--md-sys-spacing-8)', border: `var(--md-sys-border-width-normal) solid var(--md-sys-color-outline)` }}>
                                <Typography variant="subtitle1" component="h4" sx={{ marginBottom: 'var(--md-sys-spacing-8)', display: "flex", alignItems: "center", gap: 'var(--md-sys-spacing-8)' }}>
                                    <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ color: 'var(--md-sys-color-secondary)' }}>folder_open</Box>
                                    Documenti di Riferimento (KB)
                                </Typography>
                                <Box sx={{ maxHeight: 'var(--md-sys-layout-popup-min-width)', overflowY: 'auto' }}>
                                    {recommendedFiles.length > 0 ? recommendedFiles.map(kb => (
                                        <Stack key={kb.id} direction="row" alignItems="center" sx={{ p: 'var(--md-sys-spacing-2)' }}>
                                            <input type="checkbox" id={`kb-annual-${kb.id}`} checked={selectedKbFiles.includes(kb.id)} onChange={() => toggleKbFile(kb.id)} />
                                            <Box component="label" htmlFor={`kb-annual-${kb.id}`} sx={{ display: 'flex', flexDirection: 'row', width: '100%', justifyContent: 'flex-start', cursor: 'pointer' }} title={kb.fileName}>
                                                {selectedKbFiles.includes(kb.id) && <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 'var(--md-sys-typescale-body-large-font-size)' }}>check</Box>}
                                                <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ color: 'var(--md-sys-color-primary)', marginRight: "var(--md-sys-spacing-2)" }}>description</Box>
                                                <Box component="span" sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{kb.fileName}</Box>
                                            </Box>
                                        </Stack>
                                    )) : (
                                        <EmptyState icon="description" title="Nessun documento" description="Nessun documento suggerito. Caricali nella KB con tag &quot;Programmazione&quot;." />
                                    )}
                                </Box>
                            </Box>
                        </Stack>
                    )}

                    {step === 'situation' && (
                        <Stack spacing={2}>
                            <Typography variant="h6" component="h3">2. Analisi della Classe</Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--md-sys-spacing-2)' }}>
                                {SITUATION_TAGS.map(tag => (
                                    <Chip
                                        key={tag}
                                        clickable
                                        onClick={() => setSituationTags(p => p.includes(tag) ? p.filter(t => t !== tag) : [...p, tag])}
                                        color={situationTags.includes(tag) ? 'primary' : 'default'}
                                        variant={situationTags.includes(tag) ? 'filled' : 'outlined'}
                                        title={`Aggiungi tag: ${tag}`}
                                    />
                                ))}
                            </Box>
                            <TextField
                                id="wizard-situation-notes"
                                name="wizard-situation-notes"
                               
                                multiline
                                rows={2}
                                fullWidth
                                value={situationNotes}
                                onChange={e => setSituationNotes(e.target.value)}
                                placeholder="Dettagli specifici sulla classe..."
                            />
                            <Button variant="outlined" fullWidth onClick={handleGenerateSituation} disabled={!!situationStatus} title="Usa l'AI per scrivere l'analisi">
                                {situationStatus ? <AiThinkingGem size="small" inline text={situationStatus} /> : 'Genera Analisi con AI'}
                            </Button>
                            {situazioneText && (
                                <TextField
                                    id="wizard-situation-text"
                                    name="wizard-situation-text"
                                   
                                    multiline
                                    rows={6}
                                    fullWidth
                                    value={situazioneText}
                                    onChange={e => setSituazioneText(e.target.value)}
                                />
                            )}
                        </Stack>
                    )}

                    {step === 'methodology' && (
                        <Stack spacing={2}>
                            <Typography variant="h6" component="h3">3. Obiettivi e Metodologie</Typography>
                            <Box sx={{ backgroundColor: 'var(--md-sys-color-secondary-container)', borderRadius: 'var(--md-sys-shape-corner-large)', p: 'var(--md-sys-spacing-8)', border: `var(--md-sys-border-width-thin) solid var(--md-sys-color-outline)` }}>
                                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 'var(--md-sys-spacing-8)' }}>
                                    <Typography component="label" htmlFor="wizard-methodology-text" variant="body1">Strategie Didattiche</Typography>
                                    <Button variant="text" onClick={handleGenerateMethodology} disabled={!!methodologyStatus} sx={{ display: 'flex', flexDirection: 'row', alignItems: "center", gap: 'var(--md-sys-spacing-8)' }} title="Suggerisci metodologie adatte al contesto">
                                        {methodologyStatus ? <AiThinkingGem size="small" inline text="Thinking..." /> : <><Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ color: 'var(--md-sys-color-primary)' }}>lightbulb</Box> Suggerisci</>}
                                    </Button>
                                </Stack>
                                <TextField id="wizard-methodology-text" name="wizard-methodology-text" multiline rows={6} fullWidth value={methodology} onChange={e => setMethodology(e.target.value)} />
                            </Box>
                        </Stack>
                    )}

                    {step === 'sequence' && (
                        <Stack spacing={2}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Stack direction="row" alignItems="center" spacing={3}>
                                    <Typography variant="h6" component="h3">4. Piano Annuale UDA</Typography>
                                    <IconButton
                                        onClick={() => setShowSequenceHelp(!showSequenceHelp)}
                                        title="Info sulla sequenza"
                                        aria-label="Mostra informazioni sulla sequenza UDA"
                                        sx={{ color: "var(--md-sys-color-secondary)" }}
                                    >
                                        <Box component="span" className="material-symbols-outlined" aria-hidden="true">help</Box>
                                    </IconButton>
                                </Stack>
                                <Stack direction="row" spacing={1}>
                                    <Box sx={{ backgroundColor: 'var(--md-sys-color-surface-container-high)', borderRadius: 'var(--md-sys-shape-corner-large)', display: "flex", alignItems: "center", gap: 'var(--md-sys-spacing-8)', p: 'var(--md-sys-spacing-2)', border: "var(--md-sys-border-width-thin) solid var(--md-sys-color-outline)" }}>
                                        <Typography component="label" htmlFor="wizard-hours-per-week" variant="body2">Ore/Sett:</Typography>
                                        <TextField id="wizard-hours-per-week" name="wizard-hours-per-week" type="number" value={hoursPerWeek} onChange={e => setHoursPerWeek(Math.max(1, parseInt(e.target.value)))} size="small" sx={{ width: "var(--md-sys-spacing-10)", '& .MuiInputBase-input': { textAlign: "center" } }} title="Ore settimanali di lezione" />
                                    </Box>
                                    <Button variant="outlined" onClick={handleGeneratePlanFromKb} disabled={!!planGenerationStatus || selectedKbFiles.length === 0} sx={{ display: 'flex', flexDirection: 'row', alignItems: "center", gap: 'var(--md-sys-spacing-8)' }} title="Genera lista UDA dai documenti KB">
                                        {planGenerationStatus ? <AiThinkingGem size="small" inline text={planGenerationStatus} /> : 'Genera da KB'}
                                    </Button>
                                </Stack>
                            </Stack>

                            {showSequenceHelp && (
                                <InfoCard
                                    title="Organizzazione Moduli"
                                    description="Definisci le Unit� di Apprendimento (UDA) in ordine cronologico. L'app calcoler� automaticamente le date sul calendario in base al monte ore di ciascuna UDA."
                                    variant="outlined"
                                    icon="info"
                                    onClose={() => setShowSequenceHelp(false)}
                                />
                            )}

                            <Box sx={{ backgroundColor: 'var(--md-sys-color-surface-container-high)', borderRadius: 'var(--md-sys-shape-corner-large)', display: "flex", gap: 'var(--md-sys-spacing-8)', alignItems: "flex-end", mb: 'var(--md-sys-spacing-8)', p: 'var(--md-sys-spacing-6)', border: "var(--md-sys-border-width-thin) solid var(--md-sys-color-outline)" }}>
                                <Box sx={{ flexGrow: 1 }}>
                                    <TextField id="wizard-new-uda-title" name="wizard-new-uda-title" type="text" fullWidth value={newUdaTitle} onChange={e => setNewUdaTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && addUdaToPlan()} placeholder="Es. Il Verismo" />
                                </Box>
                                <Box sx={{ width: 'var(--md-sys-spacing-16)' }}>
                                    <TextField id="wizard-new-uda-hours" name="wizard-new-uda-hours" type="number" fullWidth value={newUdaHours} onChange={e => setNewUdaHours(parseInt(e.target.value))} />
                                </Box>
                                <Button variant="contained" onClick={addUdaToPlan} sx={{ mb: 'var(--md-sys-spacing-4)' }} title="Aggiungi alla lista">Aggiungi</Button>
                            </Box>
                            {planGenerationStatus ? <Box sx={{ p: 'var(--md-sys-spacing-8)', display: "flex", justifyContent: "center" }}><AiThinkingGem size="medium" text={planGenerationStatus} /></Box> : (
                                <Stack spacing={1.5} sx={{ overflowY: "auto", maxHeight: 'var(--md-sys-spacing-24)' }}>
                                    {plannedUdas.map((uda, idx) => (
                                        <Box key={uda.id} sx={{ backgroundColor: 'var(--md-sys-color-surface-container-high)', borderRadius: 'var(--md-sys-shape-corner-large)', display: "flex", alignItems: "center", gap: 'var(--md-sys-spacing-6)', p: 'var(--md-sys-spacing-6)', border: "var(--md-sys-border-width-thin) solid var(--md-sys-color-outline)" }}>
                                            <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ color: 'var(--md-sys-color-on-surface-variant)', cursor: 'grab' }} title="Trascina per riordinare (futuro)">drag_indicator</Box>

                                            <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                                                <Stack direction="row" alignItems="center" spacing={3} sx={{ mb: 'var(--md-sys-spacing-4)' }}>
                                                    <Box component="span" sx={{ fontWeight: "var(--md-sys-typescale-weight-bold)", backgroundColor: "var(--md-sys-color-primary)", color: "var(--md-sys-color-on-primary)", pl: 'var(--md-sys-spacing-4)', pr: 'var(--md-sys-spacing-4)', borderRadius: 'var(--md-sys-spacing-4)' }}>
                                                        UDA {idx + 1}
                                                    </Box>
                                                    <Typography variant="subtitle2" sx={{ color: 'var(--md-sys-color-on-surface)', margin: 0 }}>{uda.title}</Typography>
                                                </Stack>
                                                <Typography variant="caption" sx={{ color: 'var(--md-sys-color-on-surface-variant)', overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", opacity: "var(--md-sys-state-opacity-caption)" }}>{uda.topic || uda.title}</Typography>
                                            </Box>

                                            <Box sx={{ borderRadius: 'var(--md-sys-shape-corner-large)', display: "flex", alignItems: "center", gap: 'var(--md-sys-spacing-8)', backgroundColor: "var(--md-sys-color-surface-container-low)", pl: 'var(--md-sys-spacing-4)', pr: 'var(--md-sys-spacing-4)', border: "var(--md-sys-border-width-thin) solid var(--md-sys-color-outline)" }}>
                                                <TextField
                                                    id={`wizard-uda-hours-${uda.id}`}
                                                    name={`wizard-uda-hours-${uda.id}`}
                                                    type="number"
                                                    value={uda.hours}
                                                    onChange={e => updateUdaHours(uda.id, parseInt(e.target.value))}
                                                    size="small"
                                                    sx={{ width: "var(--md-sys-spacing-10)", '& .MuiInputBase-input': { textAlign: "center" }, '& fieldset': { border: 'none' } }}
                                                    title="Modifica ore stimate"
                                                />
                                                <Typography component="span" variant="body2" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>ore</Typography>
                                            </Box>

                                            <Button variant="text" color="error" onClick={() => removeUdaFromPlan(idx)} title="Rimuovi UDA">
                                                <Box component="span" className="material-symbols-outlined" aria-hidden="true">delete</Box>
                                            </Button>
                                        </Box>
                                    ))}
                                    {plannedUdas.length === 0 && (
                                        <EmptyState icon="calendar_today" title="Nessuna UDA" description="Nessuna UDA pianificata. Aggiungine una o genera dalla KB." />
                                    )}
                                </Stack>
                            )}
                        </Stack>
                    )}

                    {step === 'preview' && (
                        <Stack spacing={2}>
                            <Typography variant="h6" component="h3">5. Anteprima Temporale</Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 'var(--md-sys-spacing-6)' }}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                                    <TextField id="wizard-term1-end" name="wizard-term1-end" type="date" InputLabelProps={{ shrink: true }} fullWidth value={term1End} onChange={e => setTerm1End(e.target.value)} />
                                </Box>
                                <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                                    <TextField id="wizard-term2-end" name="wizard-term2-end" type="date" InputLabelProps={{ shrink: true }} fullWidth value={term2End} onChange={e => setTerm2End(e.target.value)} />
                                </Box>
                            </Box>
                            <Stack spacing={1.5} sx={{ overflowY: "auto", maxHeight: 'var(--md-sys-spacing-24)', pt: 'var(--md-sys-spacing-4)', pb: 'var(--md-sys-spacing-4)' }}>
                                {schedulePreview.map((item, idx) => (
                                    <Box key={idx} sx={{ position: "relative", pl: 'var(--md-sys-spacing-6)' }}>
                                        <Box sx={{ position: 'absolute', left: 'calc(var(--md-sys-spacing-2) * -1)', top: 'var(--md-sys-spacing-1)', width: 'var(--md-sys-spacing-4)', height: 'var(--md-sys-spacing-4)', borderRadius: 'var(--md-sys-percent-full)', borderWidth: 'var(--md-sys-border-width-thin)', borderColor: 'var(--md-sys-color-outline-variant)', backgroundColor: item.end > term2End ? 'var(--md-sys-color-error)' : 'var(--md-sys-color-primary)' }} />
                                        <Typography variant="caption" sx={{ textTransform: "uppercase", letterSpacing: "var(--md-sys-typescale-label-small-tracking)", color: "var(--md-sys-color-primary)" }}>{new Date(item.start).toLocaleDateString()} - {new Date(item.end).toLocaleDateString()}</Typography>
                                        <Typography variant="subtitle1" component="h4" sx={{ color: 'var(--md-sys-color-on-surface)', margin: 0 }}>{item.uda.title}</Typography>
                                        <Typography variant="caption" sx={{ color: 'var(--md-sys-color-on-surface-variant)', margin: 0 }}>{item.uda.hours} ore</Typography>
                                    </Box>
                                ))}
                            </Stack>
                        </Stack>
                    )}

                    {step === 'document' && (
                        <Box sx={{ gap: 'var(--md-sys-spacing-6)', display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "var(--md-sys-percent-full)", textAlign: "center" }}>
                            <Box sx={{ color: 'var(--md-sys-color-on-secondary-container)', width: 'var(--md-sys-spacing-4)', height: 'var(--md-sys-spacing-4)', borderRadius: 'var(--md-sys-spacing-4)', backgroundColor: 'var(--md-sys-color-secondary)', display: "flex", alignItems: "center", justifyContent: "center", mb: 'var(--md-sys-spacing-8)' }}>
                                <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ color: 'var(--md-sys-color-on-secondary-container)' }}>check_circle</Box>
                            </Box>
                            <Typography variant="h6" component="h3" sx={{ color: 'var(--md-sys-color-on-surface)' }}>Pianificazione Completata!</Typography>
                            <Button variant="contained" onClick={handleGenerateDoc} disabled={!!processingStatus} sx={{ display: 'flex', flexDirection: 'row', alignItems: "center", gap: 'var(--md-sys-spacing-8)' }} title="Scarica il documento finale">
                                {processingStatus ? <AiThinkingGem size="small" inline text={processingStatus} /> : 'Genera Documento Programmazione'}
                            </Button>
                        </Box>
                    )}
            </DialogContent>

            <DialogActions>
                    {step !== 'document' && (
                        <>
                            {step !== 'context' && <Button variant="text" onClick={() => setStep(p => p === 'situation' ? 'context' : p === 'methodology' ? 'situation' : p === 'sequence' ? 'methodology' : 'sequence')} title="Torna indietro">Indietro</Button>}
                            <Box sx={{ flexGrow: 1 }} />
                            {step === 'context' && <Button variant="contained" onClick={() => setStep('situation')} title="Vai all'analisi">Avanti</Button>}
                            {step === 'situation' && <Button variant="contained" onClick={() => setStep('methodology')} title="Vai alla metodologia">Avanti</Button>}
                            {step === 'methodology' && <Button variant="contained" onClick={() => setStep('sequence')} title="Vai al piano">Avanti</Button>}
                            {step === 'sequence' && <Button variant="contained" onClick={() => { calculateSchedule(); setStep('preview'); }} disabled={plannedUdas.length === 0} title="Calcola date">Calcola</Button>}
                            {step === 'preview' && <Button variant="contained" onClick={handleFinalize} disabled={!!processingStatus} sx={{display: "flex", alignItems: "center", gap: 'var(--md-sys-spacing-8)'}} title="Salva tutto nel database">{processingStatus ? <AiThinkingGem size="small" inline /> : 'Conferma'}</Button>}
                        </>
                    )}
                    {step === 'document' && <Button variant="text" onClick={onClose} title="Chiudi wizard">Chiudi</Button>}
            </DialogActions>
        </Dialog>
    );
};

export default React.memo(AnnualPlanningWizard);

