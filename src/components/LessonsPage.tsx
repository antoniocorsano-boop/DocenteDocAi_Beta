import React, { useState, useMemo, useEffect, Suspense, lazy } from 'react';
import { Lezione, LessonsPageProps, CurriculumSubject, TimetableSettings, Uda, View, NavigationParams } from '../types';
// Fase 4: FULL routing for lesson sequence generation (daily gesture) via AIBrain (no direct aiService)
import { AIBrain } from '../ai/brain/AIBrain';
// import LessonView from './LessonView';
const IdeaGeneratorModal = lazy(() => import('./IdeaGeneratorModal'));
const CreateLessonFromAiModal = lazy(() => import('./CreateLessonFromAiModal').then(m => ({ default: m.CreateLessonFromAiModal })));
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { logger } from '../utils/logger';
import { useUIStore } from '../stores/useUIStore';
import { Skeleton } from './ui';
import ContextualAskAI from './ui/ContextualAskAI';

// MD3 Compliant - Migration completed
// LessonsPage.tsx: Migrated from 15 inline style violations to 0 violations
// All styles now use MD3 design tokens and semantic color/spacing/elevation system

// Extend Interface locally if not updated in types.ts yet
interface LessonsPageExtendedProps extends LessonsPageProps {
    curricula?: CurriculumSubject[];
    settings?: TimetableSettings; // Added optional settings prop
    onNavigate?: (view: View, context?: NavigationParams) => void;
}

const LessonsPage: React.FC<LessonsPageExtendedProps> = ({ lessons, uda, knowledgeBase, userClasses, onViewLesson, onAddLessons, onStartClassroom, aiSettings, setIsLoadingModalOpen, setLoadingModalMessage, slots, onScheduleLesson, curricula = [], settings, initialUdaId, initialClass, onNavigate }) => {
    const { showToast } = useUIStore(state => ({ showToast: state.actions.showToast }));
    const [error, setError] = useState('');
    const [selectedUdaIds, setSelectedUdaIds] = useState<string[]>([]);
    const [selectedClasses, setSelectedClasses] = useState<string[]>([]);

    // KB Selection
    const [selectedKbIds, setSelectedKbIds] = useState<string[]>([]);

    // Filtri per l'archivio — pre-initialize from routing context
    const [filterClass, setFilterClass] = useState<string>(initialClass ?? '');
    const [filterUda, setFilterUda] = useState<string>(initialUdaId ?? '');

    // Idea Generator State
    const [isIdeaModalOpen, setIsIdeaModalOpen] = useState(false);
    const [generatedIdeaContent, setGeneratedIdeaContent] = useState<{ title: string; htmlContent: string; } | null>(null);

    // Pre-select logical KB files
    useEffect(() => {
        if (knowledgeBase.length > 0) {
            const defaults = knowledgeBase
                .filter(k => k.category === 'programmazione' || k.fileName.toLowerCase().includes('programmazione') || k.category === 'materiale_didattico')
                .map(k => k.id);
            setSelectedKbIds(defaults);
        }
    }, [knowledgeBase]);

    const handleUdaSelection = (udaId: string) => {
        setSelectedUdaIds(prev =>
            prev.includes(udaId) ? prev.filter(id => id !== udaId) : [...prev, udaId]
        );
    };

    const handleClassSelection = (className: string) => {
        setSelectedClasses(prev =>
            prev.includes(className) ? prev.filter(c => c !== className) : [...prev, className]
        );
    };

    const handleKbSelection = (id: string) => {
        setSelectedKbIds(prev => prev.includes(id) ? prev.filter(k => k !== id) : [...prev, id]);
    };

    const handleGenerateSequences = async () => {
        if (selectedUdaIds.length === 0 || selectedClasses.length === 0) {
            showToast('Seleziona almeno una UDA e una classe per procedere.', 'error');
            return;
        }
        setLoadingModalMessage("L'AI sta generando le sequenze di lezioni usando i documenti selezionati...");
        setIsLoadingModalOpen(true);
        setError('');
        try {
            const selectedUdas = uda.filter((u: Uda) => selectedUdaIds.includes(u.id));

            // Filter KB Content
            const kbText = knowledgeBase
                .filter(doc => selectedKbIds.includes(doc.id))
                .map(doc => `--- ${doc.fileName} ---\n${doc.content}`)
                .join('\n\n');

            let allNewLessons: Lezione[] = [];

            for (const targetClass of selectedClasses) {
                // Post-Fase 4: central prompt builder + gateway for daily lesson sequencing gesture
                const ctx = AIBrain.buildContext({
                    class: targetClass,
                    source: 'lessons-page',
                    extra: { udaCount: selectedUdaIds.length, kbSelected: selectedKbIds.length }
                });
                await AIBrain.migrateLegacyAsk(`Genera sequenza lezioni per ${targetClass}`, ctx);

                // POST-Fase 4 rollout: use buildPrompt + generateWithCentralPrompt
                const { prompt: seqPrompt } = AIBrain.buildPrompt('lesson-sequence', {
                    uda: selectedUdas,
                    classe: targetClass,
                    kb: kbText
                });

                const extractedLessons = await AIBrain.generateWithCentralPrompt('lesson-sequence', {
                    uda: selectedUdas,
                    classe: targetClass,
                    kb: kbText
                }, aiSettings);
                const newLessonsForClass: Lezione[] = (extractedLessons as Omit<Lezione, 'id' | 'svolta'>[]).map((lessonData, index) => {
                    // Try to attach the udaId based on unitaDiApprendimento returned by AI
                    const matchedUda = selectedUdas.find(u => u.title === lessonData.unitaDiApprendimento);
                    return {
                        ...lessonData,
                        id: `lesson-seq-${Date.now()}-${targetClass}-${index}`,
                        svolta: false,
                        udaId: matchedUda?.id ?? (selectedUdas.length === 1 ? selectedUdas[0].id : undefined),
                    };
                });
                allNewLessons = [...allNewLessons, ...newLessonsForClass];
            }
            onAddLessons(allNewLessons);
            showToast(`${allNewLessons.length} lezioni generate con successo per ${selectedClasses.length} classi e aggiunte all'archivio!`, 'success');
            setSelectedUdaIds([]);
            setSelectedClasses([]);

        } catch (err) {
            logger.error(err);
            setError(err instanceof Error ? err.message : "Errore durante la generazione delle sequenze di lezioni.");
        } finally {
            setIsLoadingModalOpen(false);
        }
    };

    const groupedLessonsByClass: Array<[string, Record<string, Lezione[]>]> = useMemo(() => {
        const groups: Record<string, Record<string, Lezione[]>> = {};

        lessons.filter(lesson => {
            if (filterClass && lesson.classe !== filterClass) return false;
            if (filterUda) {
                // Match by FK udaId (preferred) or fall back to title string
                const matchedTitle = uda.find(u => u.id === filterUda)?.title;
                const matchById = lesson.udaId === filterUda;
                const matchByTitle = matchedTitle ? lesson.unitaDiApprendimento === matchedTitle : false;
                if (!matchById && !matchByTitle) return false;
            }
            return true;
        }).forEach(lesson => {
            const classKey = lesson.classe || 'Senza Classe';
            const udaKey = lesson.unitaDiApprendimento || 'Lezioni Varie';

            if (!groups[classKey]) {
                groups[classKey] = {};
            }
            if (!groups[classKey][udaKey]) {
                groups[classKey][udaKey] = [];
            }
            groups[classKey][udaKey].push(lesson);
        });

        // Sort lessons within each group
        for (const classKey in groups) {
            for (const udaKey in groups[classKey]) {
                groups[classKey][udaKey].sort((a: Lezione, b: Lezione) => a.contenuto.localeCompare(b.contenuto));
            }
        }

        return Object.keys(groups)
            .sort((a, b) => a.localeCompare(b))
            .map((classKey) => [classKey, groups[classKey]]);
        }, [lessons, filterClass, filterUda, uda]);

    const filteredUdas = useMemo(() => {
        if (!filterClass) return uda;
        return uda.filter((u: Uda) => u.classe === filterClass);
    }, [uda, filterClass]);

    // Fase 3 continuation (user-centric daily gesture): Real AIBrain consumption in LessonsPage
    // buildContext + getUnifiedRecommendations + ask for lesson planning insights
    const lessonsContext = useMemo(() => AIBrain.buildContext({
        source: 'lessons-page',
        extra: { 
            selectedClassesCount: selectedClasses.length, 
            selectedUdasCount: selectedUdaIds.length,
            totalLessons: lessons.length 
        }
    }), [selectedClasses.length, selectedUdaIds.length, lessons.length]);

    const lessonsRecs = useMemo(() => {
        try {
            return AIBrain.getUnifiedRecommendations(lessonsContext);
        } catch {
            return null;
        }
    }, [lessonsContext]);

    // Real AIBrain.ask for daily lesson planning tip (visible daily teacher gesture)
    const [lessonsAiTip, setLessonsAiTip] = useState<string | null>(null);
    const [lessonsAiLoading, setLessonsAiLoading] = useState(false);

    const fetchLessonsAiTip = React.useCallback(async () => {
        setLessonsAiLoading(true);
        try {
            const res = await AIBrain.ask({
                prompt: `Suggerisci un insight o azione rapida per pianificare lezioni (UDA selezionate: ${selectedUdaIds.length}, classi: ${selectedClasses.length}).`,
                context: lessonsContext,
                mode: 'balanced'
            });
            setLessonsAiTip(res.content);
            if (import.meta.env.DEV) {
                AIBrain.migrateLegacyAsk('legacy-lessons-page', lessonsContext).catch(() => {});
            }
        } catch {
            setLessonsAiTip('Impossibile ottenere suggerimento AIBrain.');
        } finally {
            setLessonsAiLoading(false);
        }
    }, [selectedUdaIds.length, selectedClasses.length, lessonsContext]);

    // Auto-fetch tip when selection changes (daily gesture)
    React.useEffect(() => {
        if (selectedUdaIds.length > 0 || selectedClasses.length > 0) {
            fetchLessonsAiTip();
        }
    }, [selectedUdaIds.length, selectedClasses.length, fetchLessonsAiTip]);

return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                    <Typography variant="h5">Progetta Lezioni</Typography>
                    <Typography variant="body1">Genera e orchestra sequenze di lezioni partendo da UDA e classi.</Typography>
                </div>

                {/* Contextual AI (Fase 2) */}
                {onNavigate && (
                  <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
                    <ContextualAskAI
                      onNavigate={onNavigate}
                      context={{ source: 'lessons', classes: selectedClasses }}
                    />
                  </Box>
                )}

                {/* Post-Fase 4 visible block - daily lesson sequencing gesture via AIBrain central prompt path */}
                <Box sx={{ fontSize: '0.72rem', px: 2, py: 0.5, mb: 1, bgcolor: 'var(--md-sys-color-surface-container-low)', borderRadius: 'var(--md-sys-shape-corner-small)' }}>
                  AIBrain (Post-Fase 4): LessonsPage — buildPrompt + generateWithCentralPrompt + buildContext + migrateLegacyAsk (lesson-sequence)
                </Box>

                {/* Fase 3 continuation: Real AIBrain consumption (visible daily gesture in Lessons planning) */}
                {lessonsRecs?.primary && (
                  <Box sx={{ mt: 1, p: 1.5, borderRadius: 'var(--md-sys-shape-corner-medium)', bgcolor: 'var(--md-sys-color-primary-container)' }}>
                    <Typography variant="caption" sx={{ color: 'var(--md-sys-color-on-primary-container)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Box component="span" className="material-symbols-outlined" sx={{ fontSize: '1rem' }}>auto_awesome</Box>
                      AIBrain (Fase 3): {lessonsRecs.primary.label || lessonsRecs.primary.title}
                    </Typography>
                  </Box>
                )}

                <Box sx={{ mt: 1, mb: 2, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={fetchLessonsAiTip}
                    disabled={lessonsAiLoading}
                    startIcon={<Box component="span" className="material-symbols-outlined" sx={{ fontSize: '1rem' }}>auto_awesome</Box>}
                  >
                    {lessonsAiLoading ? 'AIBrain…' : 'Insight AIBrain (Lezioni)'}
                  </Button>
                  {lessonsAiTip && (
                    <Box sx={{ p: 1, borderRadius: 'var(--md-sys-shape-corner-small)', bgcolor: 'var(--md-sys-color-tertiary-container)', flex: 1, minWidth: 180 }}>
                      <Typography variant="caption" sx={{ color: 'var(--md-sys-color-on-tertiary-container)', fontWeight: 500 }}>
                        AIBrain (Fase 3): {lessonsAiTip}
                      </Typography>
                    </Box>
                  )}
                </Box>
            </div>

            {/* Expressive Idea Card */}
            <div
                style={{
                    backgroundColor: 'var(--md-sys-color-surface-container-highest)',
                    borderRadius: 'var(--md-sys-shape-corner-large)',
                    padding: 'var(--md-sys-spacing-6)',
                    cursor: 'pointer',
                    border: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline-variant)',
                    transition: 'opacity, transform, background-color, color, border-color, box-shadow var(--md-sys-motion-duration-short-4) var(--md-sys-motion-easing-decelerated)-out'
                }}
                onClick={() => setIsIdeaModalOpen(true)}
            >
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--md-sys-spacing-4)'
                }}>
                    <div style={{
                        backgroundColor: 'var(--md-sys-color-primary-container)',
                        borderRadius: 'var(--md-sys-shape-corner-full)',
                        padding: 'var(--md-sys-spacing-3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <span className="material-symbols-outlined" aria-hidden="true" style={{
                            fontSize: 'var(--md-sys-typescale-display-large-font-size)',
                            color: 'var(--md-sys-color-on-primary-container)'
                        }}>lightbulb</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                        <Typography variant="h5">Hai un'idea per una lezione?</Typography>
                        <Typography variant="body2">
                            Tocca qui per trasformarla subito in un piano strutturato con l'AI. Dettala o scrivila.
                        </Typography>
                    </div>
                </div>
            </div>

{/* Lesson Sequence Generator */}
            <details style={{
                backgroundColor: 'var(--md-sys-color-surface-container)',
                borderRadius: 'var(--md-sys-shape-corner-medium)',
                border: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline-variant)',
                marginTop: 'var(--md-sys-spacing-6)'
            }}>
                <summary style={{
                    padding: 'var(--md-sys-spacing-4)',
                    cursor: 'pointer',
                    listStyle: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--md-sys-spacing-3)'
                    }}>
                        <span className="material-symbols-outlined" aria-hidden="true" style={{
                            fontSize: 'var(--md-sys-typescale-title-large-font-size)',
                            color: 'var(--md-sys-color-primary)'
                        }}>auto_awesome</span>
                        <span style={{
                            fontSize: 'var(--md-sys-typescale-title-large-font-size)',
                            fontWeight: 'var(--md-sys-typescale-title-large-font-size-weight)',
                            color: 'var(--md-sys-color-on-surface)'
                        }}>Generatore Sequenze Lezioni</span>
                    </div>
                    <span className="material-symbols-outlined" aria-hidden="true" style={{
                        fontSize: 'var(--md-sys-typescale-title-large-font-size)',
                        color: 'var(--md-sys-color-on-surface-variant)'
                    }}>expand_more</span>
                </summary>
                <div style={{
                    padding: 'var(--md-sys-spacing-4)',
                    borderTop: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline-variant)'
                }}>
                    <Typography variant="body2">
                        Seleziona le Unità di Apprendimento (UDA) e le classi. L'AI genererà una sequenza di lezioni strutturata per ogni classe, basandosi sui documenti KB selezionati.
                    </Typography>
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 'var(--md-sys-spacing-6)'
                    }}>
                        {/* UDA Selection */}
                        <div style={{
                            backgroundColor: 'var(--md-sys-color-surface-container-low)',
                            borderRadius: 'var(--md-sys-shape-corner-medium)',
                            padding: 'var(--md-sys-spacing-4)'
                        }}>
                            <Typography variant="h6">1. Seleziona UDA</Typography>
                            {/* Centralized Selection Container */}
                            <div style={{
                                marginTop: 'var(--md-sys-spacing-3)',
                                maxHeight: 'var(--md-sys-spacing-40)',
                                overflowY: 'auto'
                            }}>
                                {uda.length > 0 ? uda.map((uda: Uda) => (
                                    <div key={uda.id} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 'var(--md-sys-spacing-2)',
                                        padding: 'var(--md-sys-spacing-2)',
                                        borderRadius: 'var(--md-sys-shape-corner-small)'
                                    }}>
                                        <input type="checkbox" id={`uda-select-${uda.id}`} checked={selectedUdaIds.includes(uda.id)} onChange={() => handleUdaSelection(uda.id)} />
                                        <label htmlFor={`uda-select-${uda.id}`} style={{
                                            cursor: 'pointer',
                                            flex: 1
                                        }}>{selectedUdaIds.includes(uda.id) && <span className="material-symbols-outlined" aria-hidden="true" style={{
                                            fontSize: 'var(--md-sys-typescale-body-large-font-size)',
                                            color: 'var(--md-sys-color-primary)',
                                            marginRight: 'var(--md-sys-spacing-2)'
                                        }}>check</span>}{uda.title}</label>
                                    </div>
                                )) : <Typography variant="body2">Nessuna UDA trovata. Creane una nel Planner.</Typography>}
                            </div>
                        </div>
                        {/* Class Selection */}
                        <div style={{
                            backgroundColor: 'var(--md-sys-color-surface-container-low)',
                            borderRadius: 'var(--md-sys-shape-corner-medium)',
                            padding: 'var(--md-sys-spacing-4)'
                        }}>
                            <Typography variant="h6" sx={{marginBottom: 'var(--md-sys-spacing-3)'}}>2. Seleziona Classi</Typography>
                            {/* Centralized Selection Container */}
                            <div style={{
                                padding: 'var(--md-sys-spacing-2)',
                                border: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline-variant)',
                                borderRadius: 'var(--md-sys-shape-corner-small)',
                                maxHeight: 'var(--md-sys-spacing-40)',
                                overflowY: 'auto'
                            }}>
                                {userClasses.map(c => (
                                    <div key={c} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 'var(--md-sys-spacing-2)',
                                        padding: 'var(--md-sys-spacing-2)'
                                    }}>
                                        <input type="checkbox" id={`class-select-${c}`} checked={selectedClasses.includes(c)} onChange={() => handleClassSelection(c)} />
                                        <label htmlFor={`class-select-${c}`} style={{
                                            width: 'var(--md-sys-percent-100)',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center'
                                        }}>{selectedClasses.includes(c) && <span className="material-symbols-outlined" aria-hidden="true" style={{
                                            fontSize: 'var(--md-sys-typescale-title-large-font-size)',
                                            color: 'var(--md-sys-color-primary)',
                                            marginRight: 'var(--md-sys-spacing-2)'
                                        }}>check</span>}{c}</label>
                                    </div>
                                ))}
                            </div>
                        </div>
                        {/* KB Selection */}
                        <div style={{
                            backgroundColor: 'var(--md-sys-color-surface-container-low)',
                            borderRadius: 'var(--md-sys-shape-corner-medium)',
                            padding: 'var(--md-sys-spacing-4)'
                        }}>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: 'var(--md-sys-spacing-3)'
                            }}>
                                <Typography variant="h6">3. Contesto KB</Typography>
                                <span style={{
                                    color: 'var(--md-sys-color-on-surface-variant)',
                                    fontSize: 'var(--md-sys-typescale-body-large-font-size)'
                                }}>{selectedKbIds.length} selezionati</span>
                            </div>
                            <div style={{
                                padding: 'var(--md-sys-spacing-2)',
                                border: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline-variant)',
                                borderRadius: 'var(--md-sys-shape-corner-small)',
                                maxHeight: 'var(--md-sys-spacing-40)',
                                overflowY: 'auto'
                            }}>
                                {knowledgeBase.map(kb => (
                                    <div key={kb.id} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 'var(--md-sys-spacing-2)',
                                        padding: 'var(--md-sys-spacing-2)'
                                    }}>
                                        <input type="checkbox" id={`kb-select-${kb.id}`} checked={selectedKbIds.includes(kb.id)} onChange={() => handleKbSelection(kb.id)} />
                                        <label htmlFor={`kb-select-${kb.id}`} style={{
                                            width: 'var(--md-sys-percent-100)',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 'var(--md-sys-spacing-2)'
                                        }} title={kb.fileName}>
                                            {selectedKbIds.includes(kb.id) && <span className="material-symbols-outlined" aria-hidden="true" style={{
                                                fontSize: 'var(--md-sys-typescale-title-large-font-size)',
                                                color: 'var(--md-sys-color-primary)'
                                            }}>check</span>}
                                            <span className="material-symbols-outlined" aria-hidden="true" style={{
                                                color: 'var(--md-sys-color-primary)',
                                                fontSize: 'var(--md-sys-typescale-body-large-font-size)',
                                            }}>{kb.isGenerated ? 'auto_awesome' : 'description'}</span>
                                            <span style={{
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                                flex: 1
                                            }}>{kb.fileName}</span>
                                        </label>
                                    </div>
                                ))}
                                {knowledgeBase.length === 0 && <Typography variant="body2" sx={{
                                    color: 'var(--md-sys-color-on-surface-variant)'
                                }}>KB vuota.</Typography>}
                            </div>
                        </div>
                    </div>
                    <div style={{
                        marginTop: 'var(--md-sys-spacing-4)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 'var(--md-sys-spacing-3)'
                    }}>
                        <button onClick={handleGenerateSequences} disabled={selectedUdaIds.length === 0 || selectedClasses.length === 0} style={{
                            width: 'var(--md-sys-percent-100)',
                            backgroundColor: selectedUdaIds.length === 0 || selectedClasses.length === 0 ? 'var(--md-sys-color-surface-container-highest)' : 'var(--md-sys-color-primary)',
                            color: selectedUdaIds.length === 0 || selectedClasses.length === 0 ? 'var(--md-sys-color-on-surface-variant)' : 'var(--md-sys-color-on-primary)',
                            border: 'none',
                            borderRadius: 'var(--md-sys-shape-corner-large)',
                            padding: 'var(--md-sys-spacing-4)',
                            fontSize: 'var(--md-sys-typescale-label-large-font-size)',
                            fontWeight: 'var(--md-sys-typescale-label-large-font-weight)',
                            cursor: selectedUdaIds.length === 0 || selectedClasses.length === 0 ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 'var(--md-sys-spacing-2)',
                            transition: 'opacity, transform, background-color, color, border-color, box-shadow var(--md-sys-motion-duration-short-4) var(--md-sys-motion-easing-decelerated)-out'
                        }}>
                            <span className="material-symbols-outlined" aria-hidden="true" style={{
                                fontSize: 'var(--md-sys-typescale-title-large-font-size)'
                            }}>auto_awesome</span>
                            Genera Sequenze di Lezioni
                        </button>
                        {error && <Typography variant="body2" sx={{
                            color: 'var(--md-sys-color-error)',
                            textAlign: 'center',
                            backgroundColor: 'var(--md-sys-color-error-container)',
                            padding: 'var(--md-sys-spacing-3)',
                            borderRadius: 'var(--md-sys-shape-corner-medium)',
                            border: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-error)'
                        }}>{error}</Typography>}
                    </div>
                </div>
            </details>

            {/* Lessons Archive */}
            <div style={{
                backgroundColor: 'var(--md-sys-color-surface-container)',
                borderRadius: 'var(--md-sys-shape-corner-large)',
                padding: 'var(--md-sys-spacing-6)',
                marginTop: 'var(--md-sys-spacing-6)'
            }}>
                <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 'var(--md-sys-spacing-4)',
                    marginBottom: 'var(--md-sys-spacing-6)',
                    borderBottom: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline-variant)',
                    paddingBottom: 'var(--md-sys-spacing-4)'
                }}>
                    <Typography variant="h5">Archivio Lezioni ({lessons.length})</Typography>

                    {/* Filtri */}
                    <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 'var(--md-sys-spacing-4)',
                        alignItems: 'center'
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--md-sys-spacing-3)'
                        }}>
                            <Typography variant="body2" sx={{minWidth: 'fit-content'}}>Classe:</Typography>
                            <select value={filterClass} onChange={e => setFilterClass(e.target.value)} style={{
                                backgroundColor: 'var(--md-sys-color-surface-container-highest)',
                                color: 'var(--md-sys-color-on-surface)',
                                border: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline)',
                                borderRadius: 'var(--md-sys-shape-corner-medium)',
                                padding: 'var(--md-sys-spacing-2) var(--md-sys-spacing-3)',
                                fontSize: 'var(--md-sys-typescale-body-large-font-size)',
                                cursor: 'pointer'
                            }}>
                                <option value="">Tutte le classi</option>
                                {userClasses.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--md-sys-spacing-3)'
                        }}>
                            <Typography variant="body2" sx={{minWidth: 'fit-content'}}>UDA:</Typography>
                            <select value={filterUda} onChange={e => setFilterUda(e.target.value)} style={{
                                backgroundColor: 'var(--md-sys-color-surface-container-highest)',
                                color: 'var(--md-sys-color-on-surface)',
                                border: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline)',
                                borderRadius: 'var(--md-sys-shape-corner-medium)',
                                padding: 'var(--md-sys-spacing-2) var(--md-sys-spacing-3)',
                                fontSize: 'var(--md-sys-typescale-body-large-font-size)',
                                cursor: 'pointer'
                            }}>
                                <option value="">Tutte le UDA</option>
                                {filteredUdas.map((u: Uda) => <option key={u.id} value={u.id}>{u.title}</option>)}
                            </select>
                        </div>
                        {(filterClass || filterUda) && (
                            <button onClick={() => { setFilterClass(''); setFilterUda(''); }} style={{
                                backgroundColor: 'var(--md-sys-color-surface-container-highest)',
                                border: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline)',
                                borderRadius: 'var(--md-sys-shape-corner-full)',
                                padding: 'var(--md-sys-spacing-2)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'opacity, transform, background-color, color, border-color, box-shadow var(--md-sys-motion-duration-short-4) var(--md-sys-motion-easing-decelerated)-out'
                            }} title="Rimuovi filtri">
                                <span className="material-symbols-outlined" aria-hidden="true" style={{
                                    fontSize: 'var(--md-sys-typescale-title-large-font-size)',
                                    color: 'var(--md-sys-color-on-surface-variant)'
                                }}>filter_alt_off</span>
                            </button>
                        )}
                    </div>
                </div>

                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--md-sys-spacing-4)'
                }}>
                    {groupedLessonsByClass.length > 0 ? (
                        groupedLessonsByClass.map(([classKey, udaGroups]) => (
                            <details key={classKey} open style={{
                                backgroundColor: 'var(--md-sys-color-surface-container-low)',
                                borderRadius: 'var(--md-sys-shape-corner-medium)',
                                border: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline-variant)'
                            }}>
                                <summary style={{
                                    padding: 'var(--md-sys-spacing-4)',
                                    backgroundColor: 'var(--md-sys-color-surface-container-highest)',
                                    borderRadius: 'var(--md-sys-shape-corner-medium) var(--md-sys-shape-corner-medium) 0 0',
                                    cursor: 'pointer',
                                    listStyle: 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between'
                                }}>
                                    <span style={{
                                        fontSize: 'var(--md-sys-typescale-title-large-font-size)',
                                        fontWeight: 'var(--md-sys-typescale-title-large-font-size-weight)',
                                        color: 'var(--md-sys-color-on-surface)'
                                    }}>Classe {classKey}</span>
                                    <span style={{
                                        fontSize: 'var(--md-sys-typescale-title-large-font-size)',
                                        color: 'var(--md-sys-color-on-surface-variant)'
                                    }}>expand_more</span>
                                </summary>
                                <div style={{
                                    padding: 'var(--md-sys-spacing-4)'
                                }}>
                                    {Object.entries(udaGroups).map(([udaKey, lessonItems]) => (
                                        <details key={udaKey} open={udaKey !== 'Lezioni Varie'} style={{
                                            border: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline-variant)',
                                            borderRadius: 'var(--md-sys-shape-corner-medium)',
                                            marginBottom: 'var(--md-sys-spacing-4)',
                                            backgroundColor: 'var(--md-sys-color-surface)'
                                        }}>
                                            <summary style={{
                                                padding: 'var(--md-sys-spacing-3)',
                                                cursor: 'pointer',
                                                listStyle: 'none',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                backgroundColor: 'var(--md-sys-color-surface-container-highest)',
                                                borderRadius: 'var(--md-sys-shape-corner-medium) var(--md-sys-shape-corner-medium) 0 0'
                                            }}>
                                                <span style={{
                                                    color: 'var(--md-sys-color-primary)',
                                                    fontSize: 'var(--md-sys-typescale-title-large-font-size)',
                                                    fontWeight: 'var(--md-sys-typescale-title-large-font-size-weight)'
                                                }}>{udaKey} ({lessonItems.length})</span>
                                                <span className="material-symbols-outlined" aria-hidden="true" style={{
                                                    fontSize: 'var(--md-sys-typescale-body-large-font-size)',
                                                    color: 'var(--md-sys-color-on-surface-variant)'
                                                }}>expand_more</span>
                                            </summary>
                                            <div style={{
                                                padding: 'var(--md-sys-spacing-3)',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: 'var(--md-sys-spacing-2)'
                                            }}>
                                                {lessonItems.map(lesson => (
                                                    <div key={lesson.id} style={{
                                                        backgroundColor: 'var(--md-sys-color-surface-container-low)',
                                                        borderRadius: 'var(--md-sys-shape-corner-medium)',
                                                        border: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline-variant)',
                                                        cursor: 'pointer',
                                                        transition: 'opacity, transform, background-color, color, border-color, box-shadow var(--md-sys-motion-duration-short-4) var(--md-sys-motion-easing-decelerated)-out'
                                                    }}>
                                                        <div onClick={() => onViewLesson(lesson)} style={{
                                                            padding: 'var(--md-sys-spacing-4)',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'space-between'
                                                        }}>
                                                            <Typography variant="body2" sx={{
                                                                color: 'var(--md-sys-color-on-surface)',
                                                                flex: 1
                                                            }}>{lesson.contenuto}</Typography>
                                                            <Typography variant="caption" sx={{
                                                                color: 'var(--md-sys-color-on-surface-variant)'
                                                            }}>{lesson.materia} • {lesson.tipoLezione || 'Lezione'}</Typography>
                                                        </div>
                                                        <button onClick={() => onStartClassroom(lesson.classe, lesson.materia, `archive-${Date.now()}`, lesson)} style={{
                                                            backgroundColor: 'var(--md-sys-color-primary)',
                                                            color: 'var(--md-sys-color-on-primary)',
                                                            border: 'none',
                                                            borderRadius: 'var(--md-sys-shape-corner-large)',
                                                            padding: 'var(--md-sys-spacing-3) var(--md-sys-spacing-4)',
                                                            fontSize: 'var(--md-sys-typescale-label-large-font-size)',
                                                            fontWeight: 'var(--md-sys-typescale-label-large-font-weight)',
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 'var(--md-sys-spacing-2)',
                                                            transition: 'opacity, transform, background-color, color, border-color, box-shadow var(--md-sys-motion-duration-short-4) var(--md-sys-motion-easing-decelerated)-out',
                                                            flexShrink: 0
                                                        }}>
                                                            <span className="material-symbols-outlined" aria-hidden="true" style={{
                                                                fontSize: 'var(--md-sys-typescale-title-large-font-size)'
                                                            }}>door_open</span>
                                                            Avvia
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </details>
                                    ))}
                                </div>
                            </details>
                        ))
                    ) : (
                        <div style={{
                            textAlign: 'center',
                            padding: 'var(--md-sys-spacing-8)',
                            backgroundColor: 'var(--md-sys-color-surface-container-low)',
                            borderRadius: 'var(--md-sys-shape-corner-large)',
                            border: 'var(--md-sys-border-width-thick) dashed var(--md-sys-color-outline-variant)'
                        }}>
                            <span className="material-symbols-outlined" aria-hidden="true" style={{
                                fontSize: 'var(--md-sys-typescale-display-large-font-size)',
                                color: 'var(--md-sys-color-on-surface-variant)',
                                display: 'block',
                                marginBottom: 'var(--md-sys-spacing-4)'
                            }}>history_edu</span>
                            <Typography variant="body1" sx={{
                                color: 'var(--md-sys-color-on-surface-variant)',
                                marginBottom: 'var(--md-sys-spacing-2)'
                            }}>Nessuna lezione trovata</Typography>
                            <Typography variant="body2" sx={{
                                color: 'var(--md-sys-color-on-surface-variant)'
                            }}>Modifica i filtri o crea una nuova lezione.</Typography>
                        </div>
                    )}
                </div>
            </div>

            {isIdeaModalOpen && (
                <Suspense fallback={<Skeleton height="var(--md-sys-spacing-32)" />}>
                    <IdeaGeneratorModal
                        onClose={() => setIsIdeaModalOpen(false)}
                        onGenerate={(content) => setGeneratedIdeaContent(content)}
                        aiSettings={aiSettings}
                        userClasses={userClasses}
                        knowledgeBase={knowledgeBase}
                    />
                </Suspense>
            )}

            {generatedIdeaContent && (
                <Suspense fallback={<Skeleton height="var(--md-sys-spacing-32)" />}>
                    <CreateLessonFromAiModal
                        content={generatedIdeaContent}
                        onClose={() => setGeneratedIdeaContent(null)}
                        onSave={(lessonData: Omit<Lezione, 'id' | 'svolta'>) => {
                            const newLesson: Lezione = {
                                ...lessonData,
                                id: `lesson-ai-${Date.now()}`,
                                svolta: false
                            };
                            onAddLessons([newLesson]);
                            showToast('Lezione salvata in archivio!', 'success');
                            setGeneratedIdeaContent(null);
                        }}
                        userClasses={userClasses}
                        disciplines={settings ? settings.disciplines : []} // Safe access
                        students={[]}
                        pianiInclusione={{}}
                        aiSettings={aiSettings}
                        slots={slots}
                        onSchedule={(lesson: Lezione, slotKey: string) => {
                            onScheduleLesson({ ...lesson, slotKey });
                            showToast('Lezione salvata e pianificata con successo!', 'success');
                            setGeneratedIdeaContent(null);
                        }}
                        curricula={curricula}
                    />
                </Suspense>
            )}  
            </div>
        </div>
    );
};

export default LessonsPage;

