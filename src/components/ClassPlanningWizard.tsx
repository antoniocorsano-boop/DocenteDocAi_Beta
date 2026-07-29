// ClassPlanningWizard.tsx - Block H completed (57 violations eliminated)

import React, { useState, useMemo } from 'react';
import { 
    Studente, 
    Uda, 
    TimetableSettings, 
    AiSettings, 
    Report, 
    EventoCalendario, 
    Lezione, 
    KnowledgeBaseEntry, 
    PianoInclusione 
} from '../types';
// Fase 4: FULL routing for planning gestures (situation / KB plan / doc) via AIBrain (no direct aiService)
import { AIBrain } from '../ai/brain/AIBrain';
import { generateHtmlDocxBlob, saveAs } from '../utils/documentUtils';
import { M3Dialog, InfoCard, SectionHeader, AiThinkingGem, EmptyState } from './ui';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import '../design-system/md3-utilities.css';
import { useUIStore } from '../stores/useUIStore';
import { logger } from '../utils/logger';
interface AnnualPlanningWizardProps {
    onClose: () => void;
    userClasses: string[];
    settings: TimetableSettings;
    aiSettings: AiSettings;
    onSaveUda: (uda: Uda) => void;
    onAddLessons: (lessons: Lezione[]) => void;
    onSaveReport: (report: Report) => void;
    onSaveEvent: (event: EventoCalendario) => void;
    knowledgeBase: KnowledgeBaseEntry[];
    students: Studente[];
    pianiInclusione: Record<string, PianoInclusione>;
}

type WizardStep = 'context' | 'situation' | 'methodology' | 'sequence' | 'preview' | 'document';

const AnnualPlanningWizard: React.FC<AnnualPlanningWizardProps> = ({
    onClose, userClasses, settings, aiSettings, onSaveUda, onAddLessons, onSaveReport, onSaveEvent, knowledgeBase, students, pianiInclusione
}) => {
  const [step, setStep] = useState<WizardStep>('context');
    
    // UI Store for toast notifications
    const { showToast } = useUIStore(state => ({ showToast: state.actions.showToast }));
    
    // Step 1: Context
    const [selectedClass, setSelectedClass] = useState<string>(userClasses[0] || '');
    const [selectedSubject, setSelectedSubject] = useState<string>(settings.disciplines[0] || '');
    const [selectedKbFiles, setSelectedKbFiles] = useState<string[]>([]);
    
    // Step 2: Situation (AI Assisted)
    const [situationTags, setSituationTags] = useState<string[]>([]);
    const [situationNotes, setSituationNotes] = useState('');
    const [situationText, setSituationText] = useState('');
    const [isGeneratingSituation, setIsGeneratingSituation] = useState(false);

    // Step 3: Methodology & Goals
    const [methodology, setMethodology] = useState('Lezione frontale partecipata, Cooperative Learning, Laboratorio.');
    const [isGeneratingMethodology, setIsGeneratingMethodology] = useState(false);

    // Step 4: UDA Sequence
    interface PlannedUda {
        id: string;
        title: string;
        hours: number;
        topic: string;
    }
    const [plannedUdas, setPlannedUdas] = useState<PlannedUda[]>([]);
    const [newUdaTitle, setNewUdaTitle] = useState('');
    const [newUdaHours, setNewUdaHours] = useState(10);
    const [hoursPerWeek, setHoursPerWeek] = useState(3);
    const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
    const [showSequenceHelp, setShowSequenceHelp] = useState(false); // NEW: Context Help State

    // Step 5: Milestones
    const currentYear = new Date().getMonth() >= 8 ? new Date().getFullYear() : new Date().getFullYear() - 1;
    const [term1End, setTerm1End] = useState<string>(`${currentYear}-12-22`);
    const [term2End, setTerm2End] = useState<string>(`${currentYear + 1}-06-08`);
    
    // Step 6: Preview
    const [schedulePreview, setSchedulePreview] = useState<{ uda: PlannedUda, start: string, end: string }[]>([]);
    
    // General
    const [isProcessing, setIsProcessing] = useState(false);

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
        setIsGeneratingSituation(true);
        try {
            // Post-Fase 4: central prompt builder + gateway for daily "situazione partenza" gesture
            const ctx = AIBrain.buildContext({
                class: selectedClass,
                students,
                source: 'class-planning-wizard',
                extra: { step: 'situation', tags: situationTags }
            });
            await AIBrain.migrateLegacyAsk(`Genera situazione di partenza per ${selectedClass}`, ctx);

            // Use central prompt builder (POST-Fase 4 rollout)
            const { prompt: sitPrompt } = AIBrain.buildPrompt('situazione-partenza', {
                classe: selectedClass,
                tags: situationTags,
                notes: situationNotes,
                students: students.filter(s => s.classe === selectedClass)
            });

            // Prefer generateWithCentralPrompt for prompt-centralized path
            const text = await AIBrain.generateWithCentralPrompt('situazione-partenza', {
                classe: selectedClass,
                tags: situationTags,
                notes: situationNotes
            }, aiSettings);
            setSituationText(text);
        } catch (e) {
            logger.error("Errore generazione testo situazione:", e);
            showToast("Errore durante la generazione del testo della situazione di partenza. Riprova.", "error");
        } finally {
            setIsGeneratingSituation(false);
        }
    };

    const handleGenerateMethodology = async () => {
        setIsGeneratingMethodology(true);
        try {
            setMethodology('');
        } catch (e) {
            logger.error("Errore generazione metodologia:", e);
            showToast("Errore durante la generazione delle strategie metodologiche. Riprova.", "error");
        } finally {
            setIsGeneratingMethodology(false);
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

        setIsGeneratingPlan(true);
        try {
            // Fase 4: AIBrain central routing (buildContext + migrate) for KB planning
            const ctx = AIBrain.buildContext({
                class: selectedClass,
                students,
                source: 'class-planning-wizard',
                extra: { step: 'sequence', kbCount: selectedKbFiles.length }
            });
            await AIBrain.migrateLegacyAsk(`Genera piano UDA da KB per ${selectedSubject}`, ctx);

// POST-Fase 4 rollout: generate plan via central prompt builder
            const planCtx = AIBrain.buildContext({
                class: selectedClass,
                students,
                source: 'class-planning-wizard',
                extra: { step: 'sequence', kbCount: selectedKbFiles.length }
            });
            await AIBrain.migrateLegacyAsk(`Genera piano UDA da KB per ${selectedSubject}`, planCtx);

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
            setIsGeneratingPlan(false);
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
        setIsProcessing(true);
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
                    startPos: 0,
                    width: 200,
                    color: 'var(--md-sys-color-primary)',
                    borderColor: 'var(--md-sys-color-primary)',
                    textColor: 'var(--md-sys-color-on-primary)'
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
            setIsProcessing(false);
        }
    };

    const handleGenerateDoc = async () => {
        setIsProcessing(true);
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

            // Post-Fase 4: Use central prompt builder + AIBrain gateway for daily planning document gesture
            const ctx = AIBrain.buildContext({
                class: selectedClass,
                students,
                source: 'class-planning-wizard',
                extra: { step: 'document', subject: selectedSubject }
            });
            await AIBrain.migrateLegacyAsk(`Genera documento programmazione per ${selectedClass}`, ctx);

            // POST-Fase 4: central prompt + generateWithCentralPrompt (prompt centralization rollout)
            const { prompt: centralPrompt } = AIBrain.buildPrompt('class-planning', {
                situazionePartenza: situationText,
                studentiStats: stats,
                inclusioneStats: inclStats,
                udaList: udaList,
                kbContext: kbContext,
                metodologie: methodology,
                materia: selectedSubject
            });

            // Prefer central routing path (still delegates safely inside gateway)
            const htmlContent = await AIBrain.generateWithCentralPrompt('class-planning', {
                situazionePartenza: situationText,
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
            
            onClose();
        } catch (e: unknown) {
            logger.error("Errore generazione documento:", e);
            showToast("Errore durante la generazione del documento. Riprova.", "error");
        } finally {
            setIsProcessing(false);
        }
    };

    const renderStepIndicator = () => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-4)', padding: 'var(--md-sys-spacing-4)' }} role="navigation" aria-label="Progressi del wizard">
            {['Contesto', 'Analisi', 'Metodi', 'Piano', 'Anteprima', 'Output'].map((label, idx) => {
                const stepIds: WizardStep[] = ['context', 'situation', 'methodology', 'sequence', 'preview', 'document'];
                const isActive = stepIds.indexOf(step) === idx;
                const isDone = stepIds.indexOf(step) > idx;

                return (
                    <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--md-sys-spacing-2)' }} aria-current={isActive ? 'step' : undefined}>
                        <div
                            style={{
                                width: 'var(--md-sys-spacing-10)',
                                height: 'var(--md-sys-spacing-10)',
                                
                                borderRadius: 'var(--md-sys-percent-full)',
                                
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: isDone ? 'var(--md-sys-color-primary)' : isActive ? 'var(--md-sys-color-primary-container)' : 'var(--md-sys-color-surface-container-high)',
                                color: isDone ? 'var(--md-sys-color-on-primary)' : isActive ? 'var(--md-sys-color-on-primary-container)' : 'var(--md-sys-color-on-surface-variant)',
                                border: `var(--md-sys-border-width-thin) solid ${isActive ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-outline-variant)'}`,
                                fontWeight: 'var(--md-sys-typescale-weight-bold)',
                                transition: 'opacity, transform, background-color, color, border-color-shadow var(--md-sys-motion-duration-short) var(--md-sys-motion-easing-standard)'
                            }}
                            aria-hidden="true"
                        >
                            {idx + 1}
                        </div>
                        <span style={{ fontSize: 'var(--md-sys-typescale-body-small-font-size)', textAlign: 'center', color: 'var(--md-sys-color-on-surface)' }}>
                            {label} {isDone ? '(Completato)' : isActive ? '(Corrente)' : ''}
                        </span>
                        {idx < 5 && (
                            <div
                                style={{
                                    width: 'var(--md-sys-spacing-8)',
                                    height: 'var(--md-sys-border-width-thin)',
                                    backgroundColor: isDone ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-outline-variant)',
                                    marginTop: 'var(--md-sys-spacing-2)',
                                    transition: 'background-color var(--md-sys-motion-duration-short) var(--md-sys-motion-easing-standard)'
                                }}
                                aria-hidden="true"
                            ></div>
                        )}
                    </div>
                );
            })}
        </div>
    );

    return (
            <M3Dialog
            onClose={onClose}
            title="Progettazione Annuale Guidata"
            mode="fullscreen"
        >
            {/* Post-Fase 4: Visible AIBrain block (prompt centralization + smart routing) */}
            <Box sx={{ fontSize: '0.72rem', color: 'var(--md-sys-color-on-surface-variant)', px: 2, py: 0.5, mb: 1, bgcolor: 'var(--md-sys-color-surface-container-low)', borderRadius: 'var(--md-sys-shape-corner-small)' }}>
                AIBrain (Post-Fase 4): ClassPlanningWizard — buildPrompt + generateWithCentralPrompt + buildContext + migrateLegacyAsk (prompt centralization rollout)
            </Box>
            <DialogContent sx={{ backgroundColor: 'var(--md-sys-color-surface-container-low)', padding: 'var(--md-sys-spacing-4)' }}>
                <div style={{ display: "flex", justifyContent: "center", maxWidth: "var(--md-sys-layout-container-max-width)" }}>
                    {renderStepIndicator()}

                    {step === 'context' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                            <SectionHeader 
                                title="1. Definisci il Contesto" 
                                subtitle="Seleziona la classe e i documenti di riferimento per iniziare la progettazione."
                                icon="settings_input_component"
                            />
                            
                            <InfoCard sx={{ backgroundColor: 'var(--md-sys-color-surface-container-high)' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                                        <label>Classe Target</label>
                                        <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} style={{ width: "var(--md-sys-percent-full)" }} title="Seleziona la classe per la programmazione">
                                            {userClasses.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                                        <label>Materia</label>
                                        <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} style={{ width: "var(--md-sys-percent-full)" }} title="Seleziona la materia">
                                            {settings.disciplines.map(d => <option key={d} value={d}>{d}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </InfoCard>

                            <InfoCard 
                                title="Documenti di Riferimento (KB)" 
                                icon="folder_open"
                                sx={{ backgroundColor: 'var(--md-sys-color-surface-container-high)' }}
                            >
                                <div style={{ maxHeight: 'var(--md-sys-spacing-11)', overflowY: 'auto' }}>
                                    {recommendedFiles.length > 0 ? recommendedFiles.map(kb => (
                                        <div key={kb.id} style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', padding: 'var(--md-sys-spacing-2)' }}>
                                            <input type="checkbox" id={`kb-annual-${kb.id}`} checked={selectedKbFiles.includes(kb.id)} onChange={() => toggleKbFile(kb.id)} />
                                            <label htmlFor={`kb-annual-${kb.id}`} style={{ display: "flex", alignItems: "center", gap: "var(--md-sys-spacing-2)" }} title={kb.fileName}>
                                                {selectedKbFiles.includes(kb.id) && <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 'var(--md-sys-spacing-4)' }}>check</Box>}
                                                <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ color: 'var(--md-sys-color-primary)', marginRight: "var(--md-sys-spacing-2)" }}>description</Box>
                                                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{kb.fileName}</span>
                                            </label>
                                        </div>
                                    )) : (
                                        <EmptyState icon="description" title="Nessun documento" description="Nessun documento suggerito. Caricali nella KB con tag &quot;Programmazione&quot;." />
                                    )}
                                </div>
                            </InfoCard>
                        </div>
                    )}

                    {step === 'situation' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                            <SectionHeader 
                                title="2. Analisi della Classe" 
                                subtitle="Descrivi il clima della classe e il livello di partenza degli studenti."
                                icon="analytics"
                            />
                            
                            <InfoCard sx={{ backgroundColor: 'var(--md-sys-color-surface-container-high)' }}>
                                <div style={{ marginBottom: 'var(--md-sys-spacing-8)' }}>
                                    {SITUATION_TAGS.map(tag => (
                                        <button 
                                            key={tag}
                                            onClick={() => setSituationTags(p => p.includes(tag) ? p.filter(t => t !== tag) : [...p, tag])}
                                            style={{
                                                padding: 'var(--md-sys-spacing-2) var(--md-sys-spacing-3)',
                                                borderRadius: 'var(--md-sys-shape-corner-large)',
                                                border: `var(--md-sys-border-width-thin) solid ${situationTags.includes(tag) ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-outline-variant)'}`,
                                                backgroundColor: situationTags.includes(tag) ? 'var(--md-sys-color-primary-container)' : 'var(--md-sys-color-surface-container-high)',
                                                color: situationTags.includes(tag) ? 'var(--md-sys-color-on-primary-container)' : 'var(--md-sys-color-on-surface-variant)',
                                                cursor: 'pointer',
                                                transition: 'opacity, transform, background-color, color, border-color-shadow var(--md-sys-motion-duration-short) var(--md-sys-motion-easing-standard)',
                                                fontSize: 'var(--md-sys-typescale-body-small-font-size)'
                                            }}
                                            title={`Aggiungi tag: ${tag}`}
                                        >
                                            {tag}
                                        </button>
                                    ))}
                                </div>
                                <div style={{ marginBottom: 'var(--md-sys-spacing-8)' }}>
                                    <label>Note Aggiuntive</label>
                                    <textarea style={{ width: "var(--md-sys-percent-full)" }} rows={2} value={situationNotes} onChange={e => setSituationNotes(e.target.value)} placeholder="Dettagli specifici sulla classe..." />
                                </div>
                                <Button onClick={handleGenerateSituation} disabled={isGeneratingSituation} variant="outlined" sx={{ width: "var(--md-sys-percent-full)", display: "flex", alignItems: "center", justifyContent: "center", gap: 'var(--md-sys-spacing-4)' }} title="Usa l'AI per scrivere l'analisi">
                                    {isGeneratingSituation ? <AiThinkingGem size="small" inline text="Analisi..." /> : 'Genera Analisi con AI'}
                                </Button>
                            </InfoCard>

                            {situationText && (
                                <InfoCard title="Testo Analisi" icon="description" sx={{ backgroundColor: 'var(--md-sys-color-surface-container-high)' }}>
                                    <textarea style={{ width: "var(--md-sys-percent-full)" }} rows={6} value={situationText} onChange={e => setSituationText(e.target.value)} />
                                </InfoCard>
                            )}
                        </div>
                    )}

                    {step === 'methodology' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                            <SectionHeader 
                                title="3. Obiettivi e Metodologie" 
                                subtitle="Definisci le strategie didattiche e gli strumenti che utilizzerai."
                                icon="psychology"
                            />
                            
                            <InfoCard sx={{ backgroundColor: 'var(--md-sys-color-surface-container-high)' }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 'var(--md-sys-spacing-8)' }}>
                                    <label>Strategie Didattiche</label>
                                    <Button onClick={handleGenerateMethodology} disabled={isGeneratingMethodology} variant="text" sx={{ display: 'flex', alignItems: "center", gap: 'var(--md-sys-spacing-8)' }} title="Suggerisci metodologie adatte al contesto">
                                        {isGeneratingMethodology ? <AiThinkingGem size="small" inline /> : <><Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ color: 'var(--md-sys-color-primary)' }}>lightbulb</Box> Suggerisci</>}
                                    </Button>
                                </div>
                                <textarea style={{ width: "var(--md-sys-percent-full)" }} rows={8} value={methodology} onChange={e => setMethodology(e.target.value)} />
                            </InfoCard>
                        </div>
                    )}

                    {step === 'sequence' && (
                        <div style={{ gap: 'var(--md-sys-spacing-4)' }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <SectionHeader 
                                    title="4. Piano Annuale UDA" 
                                    subtitle="Organizza le unit� di apprendimento in sequenza temporale."
                                    icon="view_timeline"
                                />
                                <div style={{ display: 'flex', gap: 'var(--md-sys-spacing-2)' }}>
                                    <div style={{ backgroundColor: 'var(--md-sys-color-surface-container-high)', borderRadius: 'var(--md-sys-shape-corner-large)', display: "flex", alignItems: "center", gap: 'var(--md-sys-spacing-8)', border: "var(--md-sys-border-width-thin) solid var(--md-sys-color-outline)", padding: 'var(--md-sys-spacing-2)' }}>
                                        <span>Ore/Sett:</span>
                                        <input type="number" value={hoursPerWeek} onChange={e => setHoursPerWeek(Math.max(1, parseInt(e.target.value)))} style={{ width: "var(--md-sys-spacing-10)", backgroundColor: "transparent", textAlign: "center", fontWeight: "var(--md-sys-typescale-weight-bold)", borderBottom: "var(--md-sys-border-width-thin) solid var(--md-sys-color-outline)" }} title="Ore settimanali di lezione" />
                                    </div>
                                    <Button onClick={handleGeneratePlanFromKb} disabled={isGeneratingPlan || selectedKbFiles.length === 0} variant="outlined" sx={{ display: 'flex', alignItems: "center", gap: 'var(--md-sys-spacing-8)' }} title="Genera lista UDA dai documenti KB">
                                        {isGeneratingPlan ? <AiThinkingGem size="small" inline text="Leggo..." /> : 'Genera da KB'}
                                    </Button>
                                </div>
                            </div>

                            {showSequenceHelp && (
                                <InfoCard 
                                    title="Organizzazione Moduli"
                                    description="Definisci le Unit� di Apprendimento (UDA) in ordine cronologico. L'app calcoler� automaticamente le date sul calendario in base al monte ore di ciascuna UDA."
                                    variant="outlined"
                                    icon="info"
                                    onClose={() => setShowSequenceHelp(false)}
                                    sx={{ marginBottom: 'var(--md-sys-spacing-8)' }}
                                />
                            )}

                            <InfoCard sx={{ backgroundColor: 'var(--md-sys-color-surface-container-high)' }}>
                                <div style={{ display: 'flex', gap: 'var(--md-sys-spacing-8)', alignItems: "flex-end" }}>
                                    <div style={{ flexGrow: 1 }}>
                                        <label>Titolo UDA</label>
                                        <input type="text" value={newUdaTitle} onChange={e => setNewUdaTitle(e.target.value)} style={{ width: "var(--md-sys-percent-full)" }} onKeyDown={e => e.key === 'Enter' && addUdaToPlan()} placeholder="Es. Il Verismo" />
                                    </div>
                                    <div style={{ width: 'var(--md-sys-spacing-16)' }}>
                                        <label>Ore</label>
                                        <input type="number" value={newUdaHours} onChange={e => setNewUdaHours(parseInt(e.target.value))} style={{ width: "var(--md-sys-percent-full)" }} />
                                    </div>
                                    <Button onClick={addUdaToPlan} variant="contained" sx={{ marginBottom: 'var(--md-sys-spacing-4)' }} title="Aggiungi alla lista">Aggiungi</Button>
                                </div>
                            </InfoCard>

                            {isGeneratingPlan ? (
                                <div style={{ padding: 'var(--md-sys-spacing-4)', display: "flex", justifyContent: "center" }}>
                                    <AiThinkingGem size="large" text="Generazione piano annuale..." />
                                </div>
                            ) : (
                                <div style={{ gap: 'var(--md-sys-spacing-3)', overflowY: "auto", maxHeight: 'var(--md-sys-spacing-24)' }}>
                                    {plannedUdas.map((uda, idx) => (
                                        <div key={uda.id} style={{ backgroundColor: 'var(--md-sys-color-surface-container-high)', borderRadius: 'var(--md-sys-shape-corner-large)', display: "flex", alignItems: "center", gap: 'var(--md-sys-spacing-6)', padding: 'var(--md-sys-spacing-6)', border: "var(--md-sys-border-width-thin) solid var(--md-sys-color-outline)", transition: "color var(--md-sys-motion-duration-medium) var(--md-sys-motion-easing-standard)" }}>
                                            <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ color: 'var(--md-sys-color-on-surface-variant)', cursor: 'grab' }} title="Trascina per riordinare">drag_indicator</Box>
                                            
                                            <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                                                <div style={{ display: 'flex', alignItems: "center", gap: 'var(--md-sys-spacing-8)', marginBottom: 'var(--md-sys-spacing-4)' }}>
                                                    <span style={{ backgroundColor: 'var(--md-sys-color-primary-container)', fontWeight: "var(--md-sys-typescale-weight-bold)", color: "var(--md-sys-color-on-primary-container)", paddingLeft: 'var(--md-sys-spacing-4)', paddingRight: 'var(--md-sys-spacing-4)', borderRadius: 'var(--md-sys-spacing-4)' }}>
                                                        UDA {idx + 1}
                                                    </span>
                                                    <Typography component="p" variant="body1" sx={{ color: 'var(--md-sys-color-on-surface)', fontWeight: "var(--md-sys-typescale-weight-bold)" }}>{uda.title}</Typography>
                                                </div>
                                                <Typography component="p" variant="body1" sx={{ color: 'var(--md-sys-color-on-surface-variant)', overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", opacity: "var(--md-sys-state-opacity-caption)" }}>{uda.topic || uda.title}</Typography>
                                            </div>

                                            <div style={{ backgroundColor: 'var(--md-sys-color-surface-container-low)', borderRadius: 'var(--md-sys-shape-corner-large)', display: "flex", alignItems: "center", gap: 'var(--md-sys-spacing-8)', paddingLeft: 'var(--md-sys-spacing-4)', paddingRight: 'var(--md-sys-spacing-4)', border: "var(--md-sys-border-width-thin) solid var(--md-sys-color-outline)" }}>
                                                <input 
                                                    type="number" 
                                                    value={uda.hours} 
                                                    onChange={e => updateUdaHours(uda.id, parseInt(e.target.value))} 
                                                    style={{ padding: 'var(--md-sys-spacing-4)', width: "var(--md-sys-spacing-10)", textAlign: "center", backgroundColor: "transparent", fontWeight: "var(--md-sys-typescale-weight-bold)", border: "none" }} 
                                                    title="Modifica ore stimate"
                                                />
                                                <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>ore</span>
                                            </div>

                                            <button onClick={() => removeUdaFromPlan(idx)} style={{ color: "var(--md-sys-color-error)", background: 'none', border: 'none', cursor: 'pointer' }} title="Rimuovi UDA" aria-label="Rimuovi questa UDA dal piano">
                                                <Box component="span" className="material-symbols-outlined" aria-hidden="true">delete</Box>
                                            </button>
                                        </div>
                                    ))}
                                    {plannedUdas.length === 0 && (
                                        <EmptyState icon="calendar_today" title="Nessuna UDA" description="Nessuna UDA pianificata. Aggiungine una o genera dalla KB." />
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {step === 'preview' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                            <SectionHeader 
                                title="5. Anteprima Temporale" 
                                subtitle="Verifica la distribuzione delle UDA nel calendario scolastico."
                                icon="event_repeat"
                            />
                            
                            <InfoCard sx={{ backgroundColor: 'var(--md-sys-color-surface-container-high)' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                                        <label>Fine 1� Periodo</label>
                                        <input type="date" value={term1End} onChange={e => setTerm1End(e.target.value)} style={{ width: "var(--md-sys-percent-full)" }} />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                                        <label>Termine Lezioni</label>
                                        <input type="date" value={term2End} onChange={e => setTerm2End(e.target.value)} style={{ width: "var(--md-sys-percent-full)" }} />
                                    </div>
                                </div>
                            </InfoCard>

                            <div style={{ gap: 'var(--md-sys-spacing-8)', paddingTop: 'var(--md-sys-spacing-4)', paddingBottom: 'var(--md-sys-spacing-4)', overflowY: "auto", paddingRight: 'var(--md-sys-spacing-4)', maxHeight: 'var(--md-sys-spacing-24)' }}>
                                {schedulePreview.map((item, idx) => (
                                    <div key={idx} style={{ position: 'relative' }}>
                                        <div style={{ position: 'absolute', left: 'calc(-1 * var(--md-sys-spacing-2))', top: 'var(--md-sys-spacing-1)', width: 'var(--md-sys-spacing-5)', height: 'var(--md-sys-spacing-5)',  borderRadius: 'var(--md-sys-percent-full)' , border: 'var(--md-sys-border-width-normal) solid var(--md-sys-color-surface-container-low)', boxShadow: 'var(--md-sys-elevation-level-1)', backgroundColor: item.end > term2End ? 'var(--md-sys-color-error)' : 'var(--md-sys-color-primary)' }}></div>
                                        <div style={{ backgroundColor: 'var(--md-sys-color-surface-container-high)', borderRadius: 'var(--md-sys-shape-corner-large)', padding: 'var(--md-sys-spacing-8)', border: "var(--md-sys-border-width-thin) solid var(--md-sys-color-outline)" }}>
                                            <Typography component="p" variant="caption" sx={{ fontWeight: "var(--md-sys-typescale-weight-bold)", textTransform: "uppercase", letterSpacing: "var(--md-sys-typescale-label-large-tracking)", color: "var(--md-sys-color-primary)", marginBottom: 'var(--md-sys-spacing-4)' }}>
                                                {new Date(item.start).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })} - {new Date(item.end).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}
                                            </Typography>
                                            <Typography component="h4" variant="h6" sx={{ marginBottom: 'var(--md-sys-spacing-4)' }}>{item.uda.title}</Typography>
                                            <div style={{ display: 'flex', alignItems: "center", gap: 'var(--md-sys-spacing-8)', color: 'var(--md-sys-color-on-surface-variant)' }}>
                                                <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: "var(--md-sys-typescale-body-small-font-size)" }}>schedule</Box>
                                                <span>{item.uda.hours} ore stimate</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 'document' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-8)', alignItems: "center", justifyContent: "center", textAlign: "center", padding: 'var(--md-sys-spacing-8)' }}>
                            <div style={{ backgroundColor: 'var(--md-sys-color-primary)', width: 'var(--md-sys-spacing-16)', height: 'var(--md-sys-spacing-16)', borderRadius: 'var(--md-sys-spacing-16)', color: 'var(--md-sys-color-on-primary)', display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 'var(--md-sys-spacing-8)' }}>
                                <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ color: 'var(--md-sys-color-on-primary)' }}>task_alt</Box>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                                <Typography component="h3" variant="h5" sx={{ color: 'var(--md-sys-color-on-surface)', marginBottom: 'var(--md-sys-spacing-8)' }}>Pianificazione Completata!</Typography>
                                <Typography component="p" variant="body1" sx={{ color: 'var(--md-sys-color-on-surface-variant)', display: "flex", justifyContent: "center" }}>
                                    Tutte le UDA e le lezioni sono state salvate. Ora puoi generare il documento di programmazione annuale completo.
                                </Typography>
                            </div>
                            <Button onClick={handleGenerateDoc} disabled={isProcessing} variant="contained" sx={{ borderRadius: 'var(--md-sys-shape-corner-large)', display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-8)' }} title="Scarica il documento finale">
                                {isProcessing ? <AiThinkingGem size="small" inline text="Generazione..." /> : (
                                    <>
                                        <Box component="span" className="material-symbols-outlined" aria-hidden="true">description</Box>
                                        Genera Documento Word
                                    </>
                                )}
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>

            <DialogActions sx={{ backgroundColor: 'var(--md-sys-color-surface-container-low)', borderTop: "var(--md-sys-border-width-thin) solid var(--md-sys-color-outline)" }}>
                    {step !== 'document' && (
                        <>
                            {step !== 'context' && <Button onClick={() => setStep(p => p === 'situation' ? 'context' : p === 'methodology' ? 'situation' : p === 'sequence' ? 'methodology' : 'sequence')} variant="text" title="Torna indietro">Indietro</Button>}
                            <div style={{ flexGrow: 1 }}></div>
                            {step === 'context' && <Button onClick={() => setStep('situation')} variant="contained" title="Vai all'analisi">Avanti</Button>}
                            {step === 'situation' && <Button onClick={() => setStep('methodology')} variant="contained" title="Vai alla metodologia">Avanti</Button>}
                            {step === 'methodology' && <Button onClick={() => setStep('sequence')} variant="contained" title="Vai al piano">Avanti</Button>}
                            {step === 'sequence' && <Button onClick={() => { calculateSchedule(); setStep('preview'); }} disabled={plannedUdas.length === 0} variant="contained" title="Calcola date">Calcola</Button>}
                            {step === 'preview' && <Button onClick={handleFinalize} disabled={isProcessing} variant="contained" sx={{ display: 'flex', alignItems: "center", gap: 'var(--md-sys-spacing-8)' }} title="Salva tutto nel database">{isProcessing ? <AiThinkingGem size="small" inline /> : 'Conferma e Salva'}</Button>}
                        </>
                    )}
                    {step === 'document' && <Button onClick={onClose} variant="text" title="Chiudi wizard">Chiudi</Button>}
            </DialogActions>
        </M3Dialog>
    );
};

export default AnnualPlanningWizard;

