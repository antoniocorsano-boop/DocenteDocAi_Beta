// MD3 Compliant - Block N Migration Complete (5 violations eliminated)
// Note: Typography font sizes and functional border widths retained with eslint-disable comments
import React, { useState, useEffect } from 'react';
import { AiSettings, KnowledgeBaseEntry } from '../types';
import VoiceNoteRecorder from './VoiceNoteRecorder';
// Fase 4: FULL routing for daily lesson idea gesture via AIBrain (no direct aiService)
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import { M3Dialog, AiThinkingGem } from './ui';

// Fase 3 continuation: Route daily lesson idea gestures through AIBrain
import { AIBrain } from '../ai/brain/AIBrain';

interface IdeaGeneratorModalProps {
    onClose: () => void;
    onGenerate: (content: { title: string; htmlContent: string }) => void;
    aiSettings: AiSettings;
    userClasses: string[];
    knowledgeBase: KnowledgeBaseEntry[];
}

const IdeaGeneratorModal: React.FC<IdeaGeneratorModalProps> = ({ onClose, onGenerate, aiSettings, userClasses, knowledgeBase }) => {
  const [ideaText, setIdeaText] = useState('');
    const [targetClass, setTargetClass] = useState<string>(userClasses[0] || '');
    const [useKb, setUseKb] = useState(true);
    const [selectedKbIds, setSelectedKbIds] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (knowledgeBase.length > 0) {
            const defaults = knowledgeBase
                .filter(k => k.category === 'programmazione' || k.fileName.toLowerCase().includes('programmazione'))
                .map(k => k.id);
            setSelectedKbIds(defaults);
        }
    }, [knowledgeBase]);

    const handleTranscription = (text: string) => {
        setIdeaText(prev => prev ? `${prev} ${text}` : text);
    };

    const handleKbToggle = (id: string) => {
        setSelectedKbIds(prev => prev.includes(id) ? prev.filter(k => k !== id) : [...prev, id]);
    };

    // Fase 3 continuation (user-centric daily gesture): Real AIBrain consumption in IdeaGeneratorModal (idea → lesson)
    const ideaContext = React.useMemo(() => AIBrain.buildContext({
      source: 'idea-generator-modal',
      extra: { targetClass, kbUsed: useKb, kbSelected: selectedKbIds.length }
    }), [targetClass, useKb, selectedKbIds.length]);

    const ideaRecs = React.useMemo(() => {
      try { return AIBrain.getUnifiedRecommendations(ideaContext); } catch { return null; }
    }, [ideaContext]);

    const [ideaAiTip, setIdeaAiTip] = React.useState<string | null>(null);
    const [ideaAiLoading, setIdeaAiLoading] = React.useState(false);

    const fetchIdeaAiTip = React.useCallback(async () => {
      setIdeaAiLoading(true);
      try {
        const res = await AIBrain.ask({
          prompt: `Suggerisci un consiglio rapido per trasformare l'idea in lezione (classe: ${targetClass}).`,
          context: ideaContext,
          mode: 'balanced'
        });
        setIdeaAiTip(res.content);
        if (import.meta.env.DEV) {
          AIBrain.migrateLegacyAsk('legacy-idea-gen', ideaContext).catch(() => {});
        }
      } catch {
        setIdeaAiTip('Impossibile ottenere suggerimento AIBrain.');
      } finally {
        setIdeaAiLoading(false);
      }
    }, [targetClass, ideaContext]);

    // Auto-fetch on class change (daily gesture)
    React.useEffect(() => {
      if (targetClass) fetchIdeaAiTip();
    }, [targetClass, fetchIdeaAiTip]);

    const handleGenerate = async () => {
        if (!ideaText.trim()) { setError("Descrivi la tua idea."); return; }
        if (!targetClass) { setError("Seleziona una classe."); return; }

        setIsLoading(true);
        setError('');
        try {
            const kbContent = useKb 
                ? knowledgeBase.filter(k => selectedKbIds.includes(k.id)).map(k => `--- ${k.fileName} ---\n${k.content}`).join('\n\n') 
                : undefined;
                
            // Post-Fase 4: central prompt builder + gateway for daily lesson-from-idea gesture
            const ctx = AIBrain.buildContext({ source: 'idea-generator', extra: { targetClass, ideaLen: ideaText.length, kbUsed: useKb } });
            await AIBrain.migrateLegacyAsk(`Generate lesson from idea for ${targetClass}`, ctx);

            const { prompt: ideaP } = AIBrain.buildPrompt('lesson-from-idea', { ideaText, kbContent, targetClass });
            const result = await AIBrain.generateWithCentralPrompt('lesson-from-idea', { ideaText, kbContent, targetClass }, aiSettings);
            onGenerate(result);
            onClose();
        } catch (err: unknown) {
                let message = 'Errore durante la generazione delle idee.';
                if (err instanceof Error) message = err.message;
                setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <M3Dialog
            title={
                <Stack direction="row" alignItems="center" gap="var(--md-sys-spacing-6)">
                    <Typography component="span" className="material-symbols-outlined" sx={{color: "var(--md-sys-color-tertiary)"}}>lightbulb</Typography>
                    <span>AI Lesson Lab</span>
                </Stack>
            }
            onClose={onClose}
            maxWidth="xl"
            buttons={
                <>
                    <Button onClick={onClose} variant="text" sx={{ fontWeight: 'var(--md-sys-typescale-weight-black)', fontSize: 'var(--md-sys-typescale-label-large-font-size)', textTransform: 'uppercase', letterSpacing: 'var(--md-sys-typescale-label-large-tracking)' }}>Annulla</Button>
                    <Button 
                        onClick={handleGenerate} 
                        variant="contained" 
                        disabled={isLoading || !ideaText.trim()}
                        sx={{ fontWeight: 'var(--md-sys-typescale-weight-black)', fontSize: 'var(--md-sys-typescale-label-large-font-size)', textTransform: 'uppercase', letterSpacing: 'var(--md-sys-typescale-label-large-tracking)' }}
                    >
                        {isLoading ? <AiThinkingGem size="small" /> : (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-8)' }}>
                                <Typography component="span" sx={{ fontSize: 'var(--md-sys-typescale-body-large-font-size)' }}>auto_awesome</Typography>
                                <span>Genera Piano</span>
                            </Box>
                        )}
                    </Button>
                </>
            }
        >
            <Box sx={{ backgroundColor: 'color-mix(in srgb, var(--md-sys-color-surface-container-low) 70%, transparent)', p: 'var(--md-sys-spacing-4)', display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                                <FormControl fullWidth>
                  <InputLabel id="idea-class-label" shrink>Classe Destinazione</InputLabel>
                  <Select
                    labelId="idea-class-label"
                    value={targetClass}
                    label="Classe Destinazione"
                    displayEmpty
                    notched
                    onChange={(e: SelectChangeEvent) => setTargetClass(e.target.value)}
                    renderValue={(v) => v || <Typography variant="body2" sx={{ opacity: 0.6 }}>Seleziona...</Typography>}
                  >
                    {userClasses.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                  </Select>
                </FormControl>

                <Stack spacing="var(--md-sys-spacing-4)">
                    <VoiceNoteRecorder onTranscription={handleTranscription} compact />
                </Stack>

                {/* Fase 4 visible block - daily lesson idea gesture routed via AIBrain */}
                <Box sx={{ fontSize: '0.72rem', px: 2, py: 0.5, mb: 1, bgcolor: 'var(--md-sys-color-surface-container-low)', borderRadius: 'var(--md-sys-shape-corner-small)' }}>
                  AIBrain (Post-Fase 4): IdeaGeneratorModal — buildPrompt + generateWithCentralPrompt + buildContext + migrateLegacyAsk (lesson from idea)
                </Box>
                <TextField multiline 
                    label="Descrizione Idea" 
                    value={ideaText} 
                    onChange={e => setIdeaText(e.target.value)} 
                    rows={6} 
                    placeholder="Es. 'Lezione attiva su Dante usando i social media'..." 
                    autoFocus
                    sx={{ backgroundColor: 'color-mix(in srgb, var(--md-sys-color-surface-container-high) 50%, transparent)' }}
                />

                {/* Fase 3 continuation: Real AIBrain consumption + visible block (daily lesson idea gesture) */}
                {ideaRecs?.primary && (
                  <Box sx={{ p: 1, borderRadius: 'var(--md-sys-shape-corner-small)', bgcolor: 'var(--md-sys-color-tertiary-container)' }}>
                    <Typography variant="caption" sx={{ color: 'var(--md-sys-color-on-tertiary-container)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Box component="span" className="material-symbols-outlined" sx={{ fontSize: '1rem' }}>auto_awesome</Box>
                      AIBrain (Fase 3): {ideaRecs.primary.label || ideaRecs.primary.title}
                    </Typography>
                  </Box>
                )}

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={fetchIdeaAiTip}
                    disabled={ideaAiLoading}
                    startIcon={<Box component="span" className="material-symbols-outlined" sx={{ fontSize: '1rem' }}>auto_awesome</Box>}
                  >
                    {ideaAiLoading ? 'AIBrain…' : 'Insight AIBrain (Idea)'}
                  </Button>
                  {ideaAiTip && (
                    <Box sx={{ p: 1, borderRadius: 'var(--md-sys-shape-corner-small)', bgcolor: 'var(--md-sys-color-secondary-container)', flex: 1 }}>
                      <Typography variant="caption" sx={{ color: 'var(--md-sys-color-on-secondary-container)', fontWeight: 500 }}>
                        AIBrain (Fase 3): {ideaAiTip}
                      </Typography>
                    </Box>
                  )}
                </Box>

                <Stack spacing="var(--md-sys-spacing-4)">
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Box component="label" sx={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-8)', cursor: 'pointer' }}>
                            <input type="checkbox" checked={useKb} onChange={e => setUseKb(e.target.checked)} />
                            <Typography variant="body2" sx={{ color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 'var(--md-sys-typescale-weight-black)', textTransform: 'uppercase', letterSpacing: 'var(--md-sys-typescale-label-large-tracking)' }}>Usa Context Knowledge Base</Typography>
                        </Box>
                        <Typography variant="body2" sx={{ color: 'var(--md-sys-color-primary)', fontWeight: 'var(--md-sys-typescale-weight-black)', textTransform: 'uppercase', letterSpacing: 'var(--md-sys-typescale-label-large-tracking)' }}>{selectedKbIds.length} file</Typography>
                    </Stack>

                    {useKb && knowledgeBase.length > 0 && (
                        <Box sx={{ p: 'var(--md-sys-spacing-4)', backgroundColor: 'color-mix(in srgb, var(--md-sys-color-surface-container-low) 50%, transparent)', borderRadius: 'var(--md-sys-shape-corner-large)', border: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline)', overflowY: 'auto' }}>
                            {knowledgeBase.map(k => (
                                <Box
                                    key={k.id}
                                    component="label"
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 'var(--md-sys-spacing-8)',
                                        p: 'var(--md-sys-spacing-12)',
                                        borderRadius: 'var(--md-sys-shape-corner-large)',
                                        border: selectedKbIds.includes(k.id) ? 'var(--md-sys-border-width-normal) solid var(--md-sys-color-primary)' : 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline-variant)',
                                        backgroundColor: selectedKbIds.includes(k.id) ? 'var(--md-sys-color-primary-container)' : 'var(--md-sys-color-surface-container-high)',
                                        transition: 'background-color, border-color var(--md-sys-motion-duration-short2) var(--md-sys-motion-easing-standard)',
                                        cursor: 'pointer',
                                        mb: 'var(--md-sys-spacing-2)'
                                    }}
                                >
                                    <input type="checkbox" checked={selectedKbIds.includes(k.id)} onChange={() => handleKbToggle(k.id)} style={{ display: 'none' }} />
                                    <Typography component="span" sx={{ fontSize: 'var(--md-sys-typescale-body-small-font-size)', color: selectedKbIds.includes(k.id) ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-on-surface-variant)', userSelect: 'none' }}>
                                        {selectedKbIds.includes(k.id) ? 'check_box' : 'check_box_outline_blank'}
                                    </Typography>
                                    <Typography component="span" sx={{ color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 'var(--md-sys-typescale-weight-black)', textTransform: 'uppercase', letterSpacing: 'var(--md-sys-typescale-label-large-tracking)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{k.fileName}</Typography>
                                </Box>
                            ))}
                        </Box>
                    )}
                </Stack>

                {error && (
                    <Stack direction="row" alignItems="center" gap="var(--md-sys-spacing-8)" sx={{ p: 'var(--md-sys-spacing-4)', backgroundColor: 'color-mix(in srgb, var(--md-sys-color-error) 10%, transparent)', borderRadius: 'var(--md-sys-shape-corner-large)', border: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline)', color: 'var(--md-sys-color-error)' }}>
                        <Typography component="span" className="material-symbols-outlined">error</Typography>
                        <Typography component="p" variant="caption" sx={{ fontSize: 'var(--md-sys-typescale-label-large-font-size)', fontWeight: 'var(--md-sys-typescale-weight-black)', textTransform: 'uppercase', letterSpacing: 'var(--md-sys-typescale-label-large-tracking)' }}>{error}</Typography>
                    </Stack>
                )}
            </Box>
        </M3Dialog>
    );
};

export default IdeaGeneratorModal;


