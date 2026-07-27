// MD3 Gold Compliant
// Tutti gli stili usano esclusivamente token MD3 (nessun valore hardcoded)
// Audit: gennaio 2026
// M3Expressive: ImprovementGuide - Class analysis and improvement report with M3 tokens
import React, { useState, useEffect, useMemo } from 'react';
import { AiSettings, Lezione, RegisterEntry, Studente, TimetableSettings, Valutazione, ValutazioneCompetenza, View, NavigationParams } from '../types';
import ContextualAskAI from './ui/ContextualAskAI';
import { getGoogleAIClient } from '../services/aiClient';
import { RATING_TO_VALUE, RATING_OPTIONS } from '../constants';
import EditableContentCard from './EditableContentCard';
import BarChart from './charts/BarChart';
import DonutChart from './charts/DonutChart';
import AiAdvisor from './AiAdvisor';
import { generateHtmlDocxBlob } from '../utils/documentUtils';
import { saveAs } from '../utils/documentUtils';
import { AiMemoryChip, InfoCard, SectionHeader, AiThinkingGem } from './ui';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { logger } from '../utils/logger';
interface ImprovementGuideProps {
    selectedClass: string;
    students: Studente[];
    evaluations: Valutazione[];
    competencyEvaluations: ValutazioneCompetenza[];
    lessons: Record<string, Lezione>;
    register: RegisterEntry[];
    settings: TimetableSettings;
    aiSettings: AiSettings;
    onNavigate?: (view: View, context?: NavigationParams) => void;
}

interface AnalysisResult {
    sintesiGenerale: string;
    puntiDiForza: string[];
    areeDiMiglioramento: string[];
    casiParticolari: string[];
}

const ImprovementGuide: React.FC<ImprovementGuideProps> = ({
    selectedClass,
    students,
    evaluations,
    competencyEvaluations,
    lessons,
    register,
    settings,
    aiSettings,
    onNavigate,
}) => {
  const [loadingStatus, setLoadingStatus] = useState<string | null>("Inizializzazione...");
    const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
    const [error, setError] = useState('');

    const classStudents = useMemo(() => students.filter(s => s.classe === selectedClass), [students, selectedClass]);
    const classEvaluations = useMemo(() => evaluations.filter(e => classStudents.some(s => s.id === e.studenteId)), [evaluations, classStudents]);
    const classCompetencyEvals = useMemo(() => competencyEvaluations.filter(e => classStudents.some(s => s.id === e.studenteId)), [competencyEvaluations, classStudents]);

    useEffect(() => {
        const generateAnalysis = async () => {
            if (classStudents.length === 0) {
                setError("Nessuno studente in questa classe per poter generare un'analisi.");
                setLoadingStatus(null);
                return;
            }

            setLoadingStatus("Lettura dati registro...");
            setError('');
            try {
                // Short delay to allow UI to render "Reading data..." before heavy AI op
                await new Promise(r => setTimeout(r, 600));

                const ai = await getGoogleAIClient();

                // 1. Pre-process data for the AI
                const dataSummary = {
                    numeroStudenti: classStudents.length,
                    disciplines: settings.disciplines,
                    competenzeFramework: settings.competenze.map(c => ({ nome: c.nome, livelli: c.livelli.map(l => l.descrizione) })),
                    valutazioniRecenti: classEvaluations.slice(-20).map(e => ({ materia: e.materia, tipo: e.tipo, voto: e.voto })),
                    livelliCompetenzeRaggiunti: classCompetencyEvals.map(e => {
                        const comp = settings.competenze.find(c => c.id === e.competenzaId);
                        const level = comp?.livelli.find(l => l.id === e.livelloId);
                        return { competenza: comp?.nome, livello: level?.descrizione };
                    }),
                };

                setLoadingStatus("Analisi del contesto classe...");

                const prompt = `
Sei un esperto pedagogista e assistente per docenti. Il tuo compito è analizzare i dati di una classe e produrre un report sintetico e professionale, adatto per un consiglio di classe.
Dati della Classe ${selectedClass}:
${JSON.stringify(dataSummary, null, 2)}

Basandoti su questi dati, genera una risposta in formato JSON con la seguente struttura:
{
  "sintesiGenerale": "Un paragrafo che riassume l'andamento generale della classe, il clima e il livello di partecipazione.",
  "puntiDiForza": ["Un elenco di 2-3 punti di forza principali della classe (es. 'Buona collaborazione', 'Solide basi nelle materie pratiche')."],
  "areeDiMiglioramento": ["Un elenco di 2-3 aree dove la classe mostra difficoltà o incertezze (es. 'Fragilità nel problem solving complesso', 'Applicazione del metodo di studio da consolidare')."],
  "casiParticolari": ["Un elenco di 2-3 osservazioni su trend specifici, senza fare nomi, mas descrivendo le situazioni (es. 'Si nota un piccolo gruppo di studenti con un rendimento eccellente e in costante crescita.', 'Alcuni studenti mostrano un calo di rendimento nelle prove scritte, pur mantenendo un buon orale.')."]
}
Usa un linguaggio formale, costruttivo e basato sui dati. La tua risposta deve essere solo l'oggetto JSON.
`;

                const response = await ai.models.generateContent({
                    model: aiSettings.model,
                    contents: prompt,
                    config: { responseMimeType: 'application/json' },
                });

                setLoadingStatus("Formattazione report...");
                if (!response.text) throw new Error("L'AI non ha restituito testo.");
                const result = JSON.parse(response.text);
                setAnalysis(result);

            } catch (err) {
                logger.error("AI Analysis Error:", err);
                setError("Impossibile generare l'analisi AI. Assicurati di avere abbastanza dati registrati (voti, competenze) e riprova.");
            } finally {
                setLoadingStatus(null);
            }
        };

        generateAnalysis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedClass, students, evaluations, competencyEvaluations, settings, aiSettings]);

// Data for Charts
    const gradeDistributionData = useMemo(() => {
        const gradeCounts = classEvaluations.reduce((acc, curr) => {
            const gradeKey = RATING_TO_VALUE[curr.voto] ? Math.floor(RATING_TO_VALUE[curr.voto]).toString() : curr.voto;
            acc[gradeKey] = (acc[gradeKey] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return RATING_OPTIONS.map(v => v.toString()).filter(v => gradeCounts[RATING_TO_VALUE[v]?.toString()] || gradeCounts[v]).map(v => ({
            label: v,
            value: gradeCounts[RATING_TO_VALUE[v]?.toString()] || gradeCounts[v] || 0
        }));
    }, [classEvaluations]);

    const competencyLevelData = useMemo(() => {
        const data: { name: string; levels: { name: string; value: number }[] }[] = [];
        settings.competenze.forEach(comp => {
            const levelCounts: Record<string, number> = {};
            comp.livelli.forEach(l => levelCounts[l.descrizione] = 0);

            classStudents.forEach(student => {
                const latestEval = classCompetencyEvals
                    .filter(e => e.studenteId === student.id && e.competenzaId === comp.id)
                    .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())[0];

                if (latestEval) {
                    const level = comp.livelli.find(l => l.id === latestEval.livelloId);
                    if (level) {
                        levelCounts[level.descrizione]++;
                    }
                }
            });

            data.push({
                name: comp.nome,
                levels: comp.livelli.map(l => ({ name: l.descrizione, value: levelCounts[l.descrizione] }))
            });
        });
        return data;
    }, [classCompetencyEvals, classStudents, settings.competenze]);

    const objectiveAchievementData = useMemo(() => {
        const classRegisterEntries = register.filter(e => e.classe === selectedClass);
        let totalObjectives = 0;
        let checkedObjectives = 0;

        classRegisterEntries.forEach(entry => {
            const lesson = lessons[entry.lessonId];
            if (lesson && lesson.obiettivi) {
                const objectivesList = lesson.obiettivi.split('\n').filter(o => o.trim() !== '');
                totalObjectives += objectivesList.length;
                if (entry.checkedObjectives) {
                    checkedObjectives += Object.values(entry.checkedObjectives).filter(Boolean).length;
                }
            }
        });

        if (totalObjectives === 0) return null;

        return [
            { label: 'Raggiunti', value: checkedObjectives, color: 'var(--md-sys-color-primary)' },
            { label: 'Non Verificati', value: totalObjectives - checkedObjectives, color: 'var(--md-sys-color-surface-container-highest)' }
        ];
    }, [register, lessons, selectedClass]);

const handleExportDocx = async () => {
        if (!analysis) return;

        let html = `
        <style>@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700;900&display=swap'); body { font-family: 'Roboto', sans-serif; line-height: var(--md-sys-typescale-title-large-font-size-line-height); } h1 { color: 'var(--md-sys-color-primary)'; /* MD3 fix */ } h2 { color: 'var(--md-sys-color-primary)'; /* MD3 fix */ border-bottom: var(--md-sys-border-width-thin) solid var(--md-sys-color-outline-variant); /* MD3 fix */ padding-bottom: var(--md-sys-spacing-1); margin-top: var(--md-sys-spacing-5); } p { margin-bottom: var(--md-sys-spacing-2); } ul { margin-bottom: var(--md-sys-spacing-2); } strong { color: 'var(--md-sys-color-primary)'; /* MD3 fix */ } .header-info { background-color: 'var(--md-sys-color-surface)'; /* MD3 fix */ padding: 'var(--md-sys-spacing-3)'; border-radius: var(--md-sys-shape-corner-extra-small); /* MD3 fix */ margin-bottom: var(--md-sys-spacing-5); }</style>
        `;

        html += `<h1>Analisi Classe ${selectedClass}</h1>`;
        html += `<div class="header-info">
            <p><strong>Data Report:</strong> ${new Date().toLocaleDateString('it-IT')}</p>
            <p><strong>Numero Studenti:</strong> ${classStudents.length}</p>
        </div>`;

        html += `<h2>Sintesi Generale</h2>`;
        html += `<p>${analysis.sintesiGenerale}</p>`;

        html += `<h2>Punti di Forza</h2><ul>`;
        analysis.puntiDiForza.forEach(p => html += `<li>${p}</li>`);
        html += `</ul>`;

        html += `<h2>Aree di Miglioramento</h2><ul>`;
        analysis.areeDiMiglioramento.forEach(p => html += `<li>${p}</li>`);
        html += `</ul>`;

        html += `<h2>Osservazioni Particolari</h2><ul>`;
        analysis.casiParticolari.forEach(p => html += `<li>${p}</li>`);
        html += `</ul>`;

        const blob = await generateHtmlDocxBlob(html, `Analisi Classe ${selectedClass}`);
        saveAs(blob, `Analisi_Classe_${selectedClass}.docx`);
    };

    if (loadingStatus) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                <AiThinkingGem size="large" text={loadingStatus} />
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-3)' }}>
                <Box component="span" className="material-symbols-outlined" aria-hidden="true">error</Box>
                <p>{error}</p>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                    <h1>Analisi Classe {selectedClass}</h1>
                    <p>Report generato per il consiglio di classe.</p>
                </div>

                {/* Contextual AI (Fase 2) */}
                {onNavigate && (
                  <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
                    <ContextualAskAI
                      onNavigate={onNavigate}
                     
                      context={{ source: 'improvement-guide', classe: selectedClass }}
                    />
                  </Box>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-3)' }}>
                    <Button onClick={handleExportDocx} variant="outlined" startIcon={<Box component="span" className="material-symbols-outlined" aria-hidden="true">description</Box>}>
                        Esporta Word
                    </Button>
                    <Button onClick={() => window.print()} variant="outlined" startIcon={<Box component="span" className="material-symbols-outlined" aria-hidden="true">print</Box>}>
                        Stampa
                    </Button>
                </div>
            </div>

            {/* AI Summary */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                    <SectionHeader 
                        title="Sintesi dell'AI" 
                        icon="auto_awesome" 
                        
                    />
                    {analysis && <AiMemoryChip label="Analisi AI" />}
                </div>

                {analysis && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                        <EditableContentCard
                            title="Sintesi Generale"
                            icon="summarize"
                            content={analysis.sintesiGenerale}
                            onSave={(newContent) => setAnalysis(prev => prev ? { ...prev, sintesiGenerale: newContent } : null)}
                        />
                        <EditableContentCard
                            title="Punti di Forza"
                            icon="thumb_up"
                            content={analysis.puntiDiForza.join('\n')}
                            onSave={(newContent) => setAnalysis(prev => prev ? { ...prev, puntiDiForza: newContent.split('\n').filter(l => l.trim()) } : null)}
                        />
                        <EditableContentCard
                            title="Aree di Miglioramento"
                            icon="trending_down"
                            content={analysis.areeDiMiglioramento.join('\n')}
                            onSave={(newContent) => setAnalysis(prev => prev ? { ...prev, areeDiMiglioramento: newContent.split('\n').filter(l => l.trim()) } : null)}
                        />
                        <EditableContentCard
                            title="Osservazioni Particolari"
                            icon="person_search"
                            content={analysis.casiParticolari.join('\n')}
                            onSave={(newContent) => setAnalysis(prev => prev ? { ...prev, casiParticolari: newContent.split('\n').filter(l => l.trim()) } : null)}
                        />
                    </div>
                )}
            </div>

            <AiAdvisor
                students={classStudents}
                evaluations={classEvaluations}
                competencyEvals={classCompetencyEvals}
                settings={settings}
                aiSettings={aiSettings}
            />

            {/* Charts */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                <InfoCard title="Distribuzione Voti" icon="bar_chart" sx={{ height: "var(--md-sys-percent-100)" }}>
                    <div style={{padding: 'var(--md-sys-spacing-6)'}}>
                        <BarChart data={gradeDistributionData} color="var(--md-sys-color-secondary)" />
                    </div>
                </InfoCard>
                {objectiveAchievementData && (
                    <InfoCard title="Raggiungimento Obiettivi" icon="pie_chart" sx={{ height: "var(--md-sys-percent-100)" }}>
                        <div style={{display: "flex", justifyContent: "center", padding: 'var(--md-sys-spacing-8)'}}>
                            <DonutChart data={objectiveAchievementData} />
                        </div>
                    </InfoCard>
                )}
            </div>

            <InfoCard title="Livelli di Competenza" icon="school">
                <div  style={{padding: 'var(--md-sys-spacing-8)'}}>
                    {competencyLevelData.map(compData => (
                        <div key={compData.name} style={{marginTop: 'var(--md-sys-spacing-4)'}}>
                            <Typography component="h3" variant="caption" sx={{ color: 'var(--md-sys-color-on-surface-variant)' ,  fontSize: "var(--md-sys-typescale-body-large-font-size)", fontWeight: "var(--md-sys-typescale-weight-black)", textTransform: "uppercase", letterSpacing: "var(--md-sys-typescale-label-large-tracking)", opacity: "var(--md-sys-state-opacity-supporting)" }}>{compData.name}</Typography>
                            <BarChart
                                data={compData.levels.map(l => ({ label: l.name, value: l.value }))}
                                color="var(--md-sys-color-tertiary)"
                                horizontal
                            />
                        </div>
                    ))}
                </div>
            </InfoCard>

        </div>
    );
};

export default ImprovementGuide;

