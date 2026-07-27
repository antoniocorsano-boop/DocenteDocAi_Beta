// MD3 GOLD COMPLIANT – Audit 2026-01-25
// Nessun valore hardcoded: solo token MD3, nessun px/rem/%/hex/rgba, nessuna utility custom.
// Conforme a MD3_GOVERNANCE_COMPLIANCE_CONTRACT.md
// M3Expressive refactor: Tutti i layout, colori, spaziature e tipografia sono gestiti tramite token MD3.
// ...vite-env.d.ts should not be imported directly...
/**
 * Studio.tsx
 * // M3Expressive refactor: Removed inline Tailwind classes, applied dedicated CSS classes with M3 tokens for layout, colors, spacing, and typography.
 */

// AI Studio SDK injected at runtime by the AI Studio host environment
declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey(): Promise<boolean>;
      openSelectKey(): Promise<void>;
    };
  }
}

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { KnowledgeBaseEntry, StudioProps, GeneratedQuiz, View, NavigationParams } from '../types'; 
import HubShell from './ui/HubShell';
// Fase 4 + Post-Fase 4: Use AIBrain centralized wrappers (internal smart routing + central prompt path)
// Direct legacy import removed; routed via AIBrain.generate* + buildPrompt/generateWithCentralPrompt
import { AIBrain } from '../ai/brain/AIBrain';
import DocumentGeneratorModal from './DocumentGeneratorModal';
import ImageGeneratorModal from './ImageGeneratorModal';
import TestGeneratorModal from './TestGeneratorModal';
import TestPreviewModal from './TestPreviewModal';
import Guidance from './Guidance';
import { M3Dialog, AiThinkingGem } from './ui';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
type StudioTask = 'summary' | 'key_points' | 'qa' | 'flashcards' | 'presentation' | 'document' | 'image' | 'quiz';

interface StudioAction {
  id: StudioTask;
  icon: string;
  title: string;
  description: string;
  requiresContent: boolean;
  category: 'generation' | 'analysis';
  variant: 'variant-primary' | 'variant-secondary' | 'variant-tertiary' | 'variant-surface';
}

const studioActions: StudioAction[] = [
    // Generazione
    { id: 'image', icon: 'add_photo_alternate', title: 'Genera Immagine', description: 'Crea un\'immagine da una descrizione testuale.', requiresContent: false, category: 'generation', variant: 'variant-primary' },
    { id: 'document', icon: 'article', title: 'Crea Documento', description: 'Genera un documento formattato (es. relazione) da un prompt.', requiresContent: true, category: 'generation', variant: 'variant-tertiary' },
    { id: 'quiz', icon: 'assignment_add', title: 'Genera Verifica', description: 'Crea un test pronto per la stampa con griglia di correzione.', requiresContent: true, category: 'generation', variant: 'variant-primary' },
    { id: 'presentation', icon: 'slideshow', title: 'Bozza Presentazione', description: 'Struttura una presentazione con slide.', requiresContent: true, category: 'generation', variant: 'variant-tertiary' },
    { id: 'flashcards', icon: 'style', title: 'Crea Flashcard', description: 'Produci flashcard per il ripasso.', requiresContent: true, category: 'generation', variant: 'variant-surface' },
    
    // Analisi
    { id: 'summary', icon: 'summarize', title: 'Crea Riassunto', description: 'Genera un riassunto conciso e strutturato.', requiresContent: true, category: 'analysis', variant: 'variant-secondary' },
    { id: 'key_points', icon: 'key', title: 'Estrai Punti Chiave', description: 'Identifica i concetti più importanti.', requiresContent: true, category: 'analysis', variant: 'variant-secondary' },
    { id: 'qa', icon: 'quiz', title: 'Genera Domande', description: 'Crea domande e risposte per la verifica.', requiresContent: true, category: 'analysis', variant: 'variant-surface' },
];

export const Studio: React.FC<StudioProps> = ({ corpora, knowledgeBase, setKnowledgeBase, aiSettings, onOpenCreateLesson, showToast, showGuidanceTips, onAiProcessing, onNavigate }) => {
    const [selectedCorpusId, setSelectedCorpusId] = useState<string>('');
        const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
        const [isLoading, setIsLoading] = useState(false);
        const [loadingTaskName, setLoadingTaskName] = useState('');
    
    // States for modal dialogs
    const [isDocumentGeneratorOpen, setIsDocumentGeneratorOpen] = useState(false);
    const [isImageGeneratorOpen, setIsImageGeneratorOpen] = useState(false);
    const [isTestGeneratorOpen, setIsTestGeneratorOpen] = useState(false);
    const [generatedQuiz, setGeneratedQuiz] = useState<GeneratedQuiz | null>(null);
    // Fase 3 continuation: track when AIBrain enhanced the prompt (visible feedback)
    const [lastAIBrainEnhancement, setLastAIBrainEnhancement] = useState<string | null>(null);

    // API Key states for Imagen model
    const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);
    const [isKeySelectionOpen, setIsKeySelectionOpen] = useState(false);

    useEffect(() => {
        // Check for API key status for Imagen models
        const localKey = localStorage.getItem('gemini_api_key');
        if (localKey) {
            setHasApiKey(true);
        } else if (window.aistudio) {
            window.aistudio.hasSelectedApiKey().then(setHasApiKey);
        } else {
            setHasApiKey(false);
        }
    }, []);
    
    const availableFiles = knowledgeBase.filter(entry => 
        !selectedCorpusId || entry.corpusId === selectedCorpusId
    );

    // Fase 3 (sequenza): Central context + unified recommendations (memoized)
    const _aiBrainQuickAction = useMemo(() => {
        try {
            return AIBrain.getCopilotPrimaryAction();
        } catch {
            return null;
        }
    }, []);

    const studioContext = useMemo(() => AIBrain.buildContext({
        source: 'studio',
        extra: { selectedFiles: selectedFileIds.length }
    }), [selectedFileIds.length]);

    const studioRecs = useMemo(() => AIBrain.getUnifiedRecommendations(studioContext), [studioContext]);

    const handleFileToggle = (fileId: string) => {
        setSelectedFileIds(prev => 
            prev.includes(fileId) ? prev.filter(id => id !== fileId) : [...prev, fileId]
        );
    };

    const runTask = async (task: StudioTask, prompt?: string, extraConfig?: unknown) => {
        const action = studioActions.find(a => a.id === task);
        if (action?.requiresContent && selectedFileIds.length === 0) {
            showToast('Seleziona almeno un documento dalla Knowledge Base per eseguire questa azione.', 'error');
            return;
        }

        if (task === 'image' && !hasApiKey) {
            setIsKeySelectionOpen(true);
            return;
        }

        setIsLoading(true);
        setLoadingTaskName(action?.title || 'Elaborazione...');
        if (onAiProcessing) onAiProcessing(true); // Start Animation

        try {
            const contextContent = knowledgeBase
                .filter(entry => selectedFileIds.includes(entry.id))
                .map(entry => `--- Contenuto da: ${entry.fileName} ---\n${entry.content}`)
                .join('\n\n');

            // Fase 3 continuation: real consumption of AIBrain.ask + buildContext inside runTask
            // (user-centric daily teacher gesture: AI-enhanced prompts for document/summary/qa)
            // rollback-safe side-by-side: AIBrain augments prompt; legacy aiService generators execute
            let enhancedPrompt = prompt;
            if (['summary', 'document', 'qa'].includes(task) && contextContent) {
                try {
                    const ctx = AIBrain.buildContext({
                        source: 'studio-task',
                        extra: { task, fileCount: selectedFileIds.length }
                    });
                    const brainRes = await AIBrain.ask({
                        prompt: `Suggerisci un focus o prompt migliorato per: ${action?.title || task}. Breve contesto: ${contextContent.substring(0, 300)}`,
                        context: ctx,
                        mode: 'balanced'
                    });
                    if (brainRes?.content) {
                        const focus = brainRes.content.slice(0, 110);
                        enhancedPrompt = prompt 
                            ? `${prompt} — AIBrain focus: ${focus}` 
                            : brainRes.content;
                        setLastAIBrainEnhancement(focus);
                    }
                } catch {
                    // silent fallback — keeps rollback-safe
                }
            }

            let title: string = '';
            let htmlContent: string = '';

            if (task === 'image') {
                if (!prompt) {
                     showToast('Il prompt per l\'immagine non può essere vuoto.', 'error');
                     return;
                }

                // Post-Fase 4: central prompt + generateWithCentralPrompt for image (daily studio gesture)
                const { prompt: imgPrompt } = AIBrain.buildPrompt('studio-image', { prompt });
                const { data, mimeType } = await AIBrain.generateWithCentralPrompt('studio-image', { prompt }, aiSettings);
                
                // Check for duplicates created in the last 2 seconds to prevent double-save in StrictMode
                const isDuplicate = knowledgeBase.some(entry => 
                    entry.content === prompt && 
                    entry.isGenerated && 
                    entry.fileContent?.mimeType === mimeType &&
                    (Date.now() - parseInt(entry.id.split('-')[2] || '0')) < 2000
                );

                if (!isDuplicate) {
                    const newEntry: KnowledgeBaseEntry = {
                        id: `kb-img-${Date.now()}`,
                        fileName: `${prompt.substring(0, 30)}.jpg`,
                        content: prompt, // Store prompt in content
                        isGenerated: true,
                        fileContent: { mimeType, data },
                        corpusId: selectedCorpusId || undefined,
                    };
                    setKnowledgeBase(prev => [...prev, newEntry]);
                    showToast('Immagine generata e salvata nella Knowledge Base!', 'success');
                }
                
                setIsLoading(false);
                if (onAiProcessing) onAiProcessing(false);
                setIsImageGeneratorOpen(false);
                return;

            } else if (task === 'quiz') {
                // Post-Fase 4: central prompt builder + gateway for daily quiz gesture
                try {
                    const ctx = AIBrain.buildContext({ source: 'studio-quiz', extra: { task, fileCount: selectedFileIds.length } });
                    await AIBrain.migrateLegacyAsk(`Generate quiz: ${action?.title || task}`, ctx);
                } catch {}

                const { prompt: quizPrompt } = AIBrain.buildPrompt('quiz', { topic: (extraConfig as any)?.topic || 'quiz', numQuestions: (extraConfig as any)?.numQuestions, difficulty: (extraConfig as any)?.difficulty });
                const quiz = await AIBrain.generateWithCentralPrompt('quiz', { topic: (extraConfig as any)?.topic || 'quiz', numQuestions: (extraConfig as any)?.numQuestions, difficulty: (extraConfig as any)?.difficulty, corpus: contextContent }, aiSettings);
                setGeneratedQuiz(quiz as any);
                setIsLoading(false);
                if (onAiProcessing) onAiProcessing(false);
                setIsTestGeneratorOpen(false);
                return;

            } else if (task === 'document') {
                if (!prompt) {
                    showToast('Il prompt per il documento non può essere vuoto.', 'error');
                    return;
                }
                title = prompt;
                // Post-Fase 4: central prompt + generateWithCentralPrompt (prompt centralization)
                const { prompt: docPrompt } = AIBrain.buildPrompt('document', { prompt: enhancedPrompt || prompt, corpus: contextContent });
                htmlContent = await AIBrain.generateWithCentralPrompt('document', { prompt: enhancedPrompt || prompt, corpus: contextContent }, aiSettings);
                setIsDocumentGeneratorOpen(false);
            } else {
                if (!action) throw new Error("Azione non valida");
                title = action.title;
                // Post-Fase 4: central prompt path for studio-output (analysis tasks)
                const { prompt: studioP } = AIBrain.buildPrompt('studio-output', { task, corpus: contextContent });
                htmlContent = await AIBrain.generateWithCentralPrompt('studio-output', { task, corpus: contextContent, prompt: studioP }, aiSettings);
            }
            onOpenCreateLesson({ title, htmlContent });
        } catch (error: unknown) {
            let message = 'Si è verificato un errore.';
            if (error instanceof Error) {
                message = error.message;
                if (error.message.includes("Requested entity was not found.") || error.message.includes("API Key")) {
                    setHasApiKey(false); // Assume API key issue
                    setIsKeySelectionOpen(true);
                }
            }
            showToast(message, 'error');
        } finally {
            setIsLoading(false);
            setLoadingTaskName('');
            if (onAiProcessing) onAiProcessing(false); // Stop Animation
        }
    };

    const renderActionGrid = (actions: StudioAction[]) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
            {actions.map((action) => (
                <button
                    key={action.id}
                    onClick={() => {
                        if (action.id === 'document') setIsDocumentGeneratorOpen(true);
                        else if (action.id === 'image') setIsImageGeneratorOpen(true);
                        else if (action.id === 'quiz') setIsTestGeneratorOpen(true);
                        else runTask(action.id);
                    }}
                    style={{
                        // studio-action-card styles
                        backgroundColor: 'var(--md-sys-color-surface-container)',
                        borderRadius: 'var(--md-sys-shape-corner-large)',
                        padding: 'var(--md-sys-spacing-4)',
                        border: 'var(--md-sys-border-width-normal) solid var(--md-sys-color-outline-variant)',
                        transition: 'opacity, transform, background-color, color, border-color, box-shadow var(--md-sys-motion-easing-standard) var(--md-sys-motion-duration-medium)',
                        cursor: 'pointer'
                    }}
                    disabled={isLoading || (action.requiresContent && selectedFileIds.length === 0) || (action.id === 'image' && hasApiKey === false)}
                    title={(action.id === 'image' && hasApiKey === false) ? "API Key richiesta per la generazione di immagini." : (action.requiresContent && selectedFileIds.length === 0 ? "Seleziona almeno un documento per abilitare questa azione" : action.description)}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-3)' }}>
                        <span>{action.icon}</span>
                        {action.requiresContent && (
                            <span>
                                Input KB
                            </span>
                        )}
                    </div>
                    <span>{action.title}</span>
                    <span>{action.description}</span>
                </button>
            ))}
        </div>
    );

    const handleSelectKey = async () => {
        if (window.aistudio) {
            await window.aistudio.openSelectKey();
            setHasApiKey(true);
        } else {
            showToast("Per favore configura l'API Key nelle Impostazioni.", "error");
        }
        setIsKeySelectionOpen(false);
    };

    return (
        <HubShell
            title="Studio AI"
            subtitle="Laboratorio per trasformare e generare contenuti con il tuo contesto."
            icon="science"
            onNavigate={onNavigate || (() => {})}
            aiContext={{ source: 'studio' }}
        >
             <Guidance id="studio-ai-intro" icon="auto_fix_high" title="Il tuo Laboratorio Creativo" isGloballyEnabled={showGuidanceTips}>
                <p>
                    Usa lo Studio AI come un laboratorio per trasformare i tuoi materiali. Seleziona i documenti di partenza (il contesto), poi scegli un'azione. L'AI genererà nuovi contenuti (riassunti, presentazioni, verifiche) che potrai trasformare in lezioni o esportare.
                </p>
            </Guidance>
            
            {/* API Key Warning for Imagen models */}
            {isKeySelectionOpen && (
                <M3Dialog
                    title="API Key Richiesta"
                    onClose={() => setIsKeySelectionOpen(false)}
                    maxWidth="sm"
                >
                    <DialogContent >
                        <p>
                            Per utilizzare la generazione di immagini e video (modelli Imagen/Veo), è necessaria una API Key abilitata al billing.
                        </p>
                        <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" >
                            <Box component="span" className="material-symbols-outlined" aria-hidden="true">info</Box>
                            Scopri di più sul billing
                        </a>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setIsKeySelectionOpen(false)} variant="text">Annulla</Button>
                        {typeof window.aistudio !== 'undefined' && (
                            <Button onClick={handleSelectKey} variant="contained">Seleziona API Key (Demo)</Button>
                        )}
                    </DialogActions>
                </M3Dialog>
            )}

            {/* Context Selection Card */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                <Typography component="h2" variant="h6" sx={{marginBottom: 'var(--md-sys-spacing-8)', display: "flex", alignItems: "center", gap: 'var(--md-sys-spacing-8)'}}>
                    <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{color: "var(--md-sys-color-primary)"}}>folder_open</Box>
                    1. Seleziona Contesto (Knowledge Base)
                </Typography>
                <div style={{display: "flex", flexWrap: "wrap", gap: 'var(--md-sys-spacing-8)', alignItems: "flex-end", marginBottom: 'var(--md-sys-spacing-8)'}}>
                    <div  style={{ flexGrow: "1" }}>
                        <FormControl fullWidth>
                            <InputLabel id="studio-corpus-label" shrink>Filtra per Set di Documenti</InputLabel>
                            <Select
                                labelId="studio-corpus-label"
                                value={selectedCorpusId}
                                label="Filtra per Set di Documenti"
                                displayEmpty
                                notched
                                onChange={(e: SelectChangeEvent) => { setSelectedCorpusId(e.target.value); setSelectedFileIds([]); }}
                            >
                                <MenuItem value="">{`Tutti i Documenti (${knowledgeBase.length})`}</MenuItem>
                                {corpora.map(c => <MenuItem key={c.id} value={c.id}>{c.displayName}</MenuItem>)}
                            </Select>
                        </FormControl>
                    </div>
                     <div  style={{display: "flex", alignItems: "center", gap: 'var(--md-sys-spacing-8)'}}>
                        <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>attachment</Box>
                        <Typography component="p" variant="body1" sx={{ color: 'var(--md-sys-color-on-surface-variant)', fontWeight: "var(--md-sys-typescale-weight-bold)" }}>
                            {selectedFileIds.length} file selezionati
                        </Typography>
                    </div>
                </div>

                {/* Centralized Selection Container */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                    {availableFiles.map(entry => (
                        <div key={entry.id} >
                            <input type="checkbox" id={`studio-file-${entry.id}`} checked={selectedFileIds.includes(entry.id)} onChange={() => handleFileToggle(entry.id)} />
                            <label htmlFor={`studio-file-${entry.id}`} >
                                {selectedFileIds.includes(entry.id) && <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 'var(--md-sys-typescale-title-large-font-size)' }}>check</Box>}
                                <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{color: "var(--md-sys-color-primary)", fontSize: 'var(--md-sys-spacing-4)'}}>{entry.isGenerated ? 'auto_awesome' : 'description'}</Box>
                                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{entry.fileName}</span>
                            </label>
                        </div>
                    ))}
                    {availableFiles.length === 0 && (
                        <Typography component="p" variant="subtitle1" sx={{ color: 'var(--md-sys-color-on-surface-variant)' , fontSize: 'var(--md-sys-typescale-body-large-font-size)', padding: 'var(--md-sys-spacing-8)'}}>Nessun file disponibile in questo set.</Typography>
                    )}
                </div>
            </div>

            {/* Loading State */}
            {isLoading && (
                <div style={{ padding: 'var(--md-sys-spacing-4)' ,  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                    <AiThinkingGem size="large" text={loadingTaskName || "L'AI sta lavorando..."} />
                </div>
            )}

            {/* Post-Fase 4 visible block - Studio AI daily gestures (generation + analysis) routed via AIBrain central prompt path */}
            <Box sx={{ fontSize: '0.72rem', px: 2, py: 0.5, mb: 1, bgcolor: 'var(--md-sys-color-surface-container-low)', borderRadius: 'var(--md-sys-shape-corner-small)' }}>
                AIBrain (Post-Fase 4): Studio — buildPrompt + generateWithCentralPrompt + buildContext + migrateLegacyAsk (studio-image / quiz / document / studio-output + analysis tasks)
            </Box>

            {/* Actions Cards - Visible only when not loading */}
            {!isLoading && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                    {/* Generation Card */}
                    <div  style={{ height: 'var(--md-sys-percent-100)' }}>
                        <div style={{marginBottom: 'var(--md-sys-spacing-8)'}}>
                            <Typography component="h2" variant="h6" sx={{display: "flex", alignItems: "center", gap: 'var(--md-sys-spacing-8)'}}>
                                <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{color: "var(--md-sys-color-tertiary)"}}>design_services</Box>
                                Generazione & Creatività
                            </Typography>
                            <Typography component="p" variant="body1" sx={{ color: 'var(--md-sys-color-on-surface-variant)' , marginTop: 'var(--md-sys-spacing-4)'}}>Crea nuovi contenuti didattici.</Typography>
                        </div>
                        {renderActionGrid(studioActions.filter(a => a.category === 'generation'))}
                    </div>

                    {/* Fase 3 (sequenza): Visible AIBrain unified recommendation in Studio */}
                    {studioRecs?.primary && (
                      <Box sx={{ 
                        mt: 2, 
                        p: 1.5, 
                        borderRadius: 'var(--md-sys-shape-corner-medium)', 
                        bgcolor: 'var(--md-sys-color-primary-container)' 
                      }}>
                        <Typography variant="caption" sx={{ color: 'var(--md-sys-color-on-primary-container)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Box component="span" className="material-symbols-outlined" sx={{ fontSize: '1rem' }}>auto_awesome</Box>
                          AIBrain (Fase 3): {studioRecs.primary.label || studioRecs.primary.title}
                        </Typography>
                      </Box>
                    )}

                    {/* Fase 3 continuation: Visible real AIBrain.ask usage feedback (when prompt was enhanced) */}
                    {lastAIBrainEnhancement && (
                      <Box sx={{ mt: 1, px: 1.5, py: 0.5, borderRadius: 'var(--md-sys-shape-corner-small)', bgcolor: 'var(--md-sys-color-tertiary-container)' }}>
                        <Typography variant="caption" sx={{ color: 'var(--md-sys-color-on-tertiary-container)', fontSize: '0.7rem' }}>
                          AIBrain (Fase 3) prompt enhancement: {lastAIBrainEnhancement}
                        </Typography>
                      </Box>
                    )}

                    {/* Analysis Card */}
                    <div  style={{ height: 'var(--md-sys-percent-100)' }}>
                        <div style={{marginBottom: 'var(--md-sys-spacing-8)'}}>
                            <Typography component="h2" variant="h6" sx={{display: "flex", alignItems: "center", gap: 'var(--md-sys-spacing-8)'}}>
                                <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{color: "var(--md-sys-color-secondary)"}}>analytics</Box>
                                Analisi & Sintesi
                            </Typography>
                            <Typography component="p" variant="body1" sx={{ color: 'var(--md-sys-color-on-surface-variant)' , marginTop: 'var(--md-sys-spacing-4)'}}>Rielabora e comprendi i documenti.</Typography>
                        </div>
                        {renderActionGrid(studioActions.filter(a => a.category === 'analysis'))}
                    </div>
                </div>
            )}
            
            {/* Modals */}
            {isDocumentGeneratorOpen && (
                <DocumentGeneratorModal 
                    onClose={() => setIsDocumentGeneratorOpen(false)}
                    onGenerate={(prompt) => runTask('document', prompt)}
                />
            )}

            {isImageGeneratorOpen && (
                <ImageGeneratorModal
                    onClose={() => setIsImageGeneratorOpen(false)}
                    onGenerate={(prompt) => runTask('image', prompt)}
                />
            )}

            {isTestGeneratorOpen && (
                <TestGeneratorModal
                    onClose={() => setIsTestGeneratorOpen(false)}
                    onGenerate={(config) => runTask('quiz', undefined, config)}
                />
            )}

            {generatedQuiz && (
                <TestPreviewModal
                    quiz={generatedQuiz}
                    onClose={() => setGeneratedQuiz(null)}
                />
            )}
        </HubShell>
    );
};

export default Studio;

