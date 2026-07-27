// ✅ MD3 Native Compliant - Migrated to direct MD3 tokens

import React, { useState, useEffect } from 'react';
// Load Google GenAI dynamically to avoid bundling it in the main chunk
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { M3Dialog } from './ui';
import { logger } from '../utils/logger';
import { useUIStore } from '../stores/useUIStore';
import ContextualAskAI from './ui/ContextualAskAI';
import { View, NavigationParams } from '../types';

interface VideoAnalysisModalProps {
    onClose: () => void;
    onNavigate?: (view: View, context?: NavigationParams) => void;
}

const loadingMessages = [
    "Inizializzazione del modello Veo...",
    "Analisi del prompt in corso...",
    "I fotogrammi stanno prendendo vita...",
    "Renderizzazione del video ad alta definizione...",
    "Quasi pronto, applicando gli ultimi ritocchi...",
];

const VideoAnalysisModal: React.FC<VideoAnalysisModalProps> = ({ onClose, onNavigate }) => {
  const { showToast } = useUIStore(state => ({ showToast: state.actions.showToast }));
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);
    const [prompt, setPrompt] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [loadingMessage, setLoadingMessage] = useState<string>(loadingMessages[0]);
    const [error, setError] = useState<string>('');
    const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);

    useEffect(() => {
        // Video generation (Veo) requires the AI Studio host environment.
        // VITE_GEMINI_API_KEY is intentionally NOT used here — the key must stay server-side.
        if (window.aistudio) {
            window.aistudio.hasSelectedApiKey().then(setHasApiKey);
        } else {
            setHasApiKey(false);
        }
    }, []);

    useEffect(() => {
        let interval: number;
        if (isLoading) {
            let i = 0;
            interval = window.setInterval(() => {
                i = (i + 1) % loadingMessages.length;
                setLoadingMessage(loadingMessages[i]);
            }, 5000);
        }
        return () => clearInterval(interval);
    }, [isLoading]);

    const handleSelectKey = async () => {
        if (window.aistudio?.openSelectKey) {
            await window.aistudio.openSelectKey();
            // GUIDELINE: MUST assume key selection was successful after triggering openSelectKey()
            setHasApiKey(true);
        } else {
            showToast("Per favore configura l'API Key nel tuo ambiente.", 'error');
        }
    };

    const handleSubmit = async () => {
        if (!prompt) {
            setError("Per favore, inserisci un prompt per generare il video.");
            return;
        }
        setError('');
        setIsLoading(true);
        setGeneratedVideoUrl(null);
        setLoadingMessage(loadingMessages[0]);

        try {
            // GUIDELINE: Create new GoogleGenAI instance right before call (lazy-loaded)
            const genaiModule = await import('@google/genai');
            const GoogleGenAI = genaiModule.GoogleGenAI;
            // In AI Studio the key is provided by the host environment; do NOT use VITE_GEMINI_API_KEY.
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const ai = new GoogleGenAI({ apiKey: '' } as any);

            // Veo model parameters
            let operation = await ai.models.generateVideos({
                model: 'veo-3.1-fast-generate-preview',
                prompt: prompt,
                config: {
                    numberOfVideos: 1,
                    resolution: '720p',
                    aspectRatio: '16:9'
                }
            });

            while (!operation.done) {
                await new Promise(resolve => setTimeout(resolve, 10000));
                operation = await ai.operations.getVideosOperation({ operation });
            }

            if (operation.error) {
                // GUIDELINE: Reset key if "Requested entity was not found" error occurs
                const errorMessage = typeof operation.error.message === 'string' ? operation.error.message : 'Errore durante la generazione del video.';
                if (errorMessage.includes("Requested entity was not found.")) {
                    setError("API Key non valida o permessi mancanti. Per favore, seleziona nuovamente la chiave.");
                    setHasApiKey(false);
                    return;
                }
                throw new Error(errorMessage);
            }

            const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;

            if (downloadLink) {
                // In AI Studio the video URI is a signed URL — no API key suffix needed.
                const response = await fetch(downloadLink);
                if (!response.ok) {
                    throw new Error(`Errore nel download del video: ${response.statusText}`);
                }
                const videoBlob = await response.blob();
                const videoUrl = URL.createObjectURL(videoBlob);
                setGeneratedVideoUrl(videoUrl);
            } else {
                throw new Error("Nessun link per il download del video trovato nella risposta.");
            }

        } catch (err: unknown) {
            logger.error("Error during video generation:", err);
            const errorMessage = err instanceof Error ? err.message : String(err);
            setError(`Errore durante la generazione: ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    };

    const renderContent = () => {
        if (hasApiKey === null) {
            return (
                <div style={{ padding: 'var(--md-sys-spacing-4)', display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 'var(--md-sys-spacing-6)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                        <div  style={{ width: 'var(--md-sys-spacing-8)', height: 'var(--md-sys-spacing-8)', borderRadius: 'var(--md-sys-spacing-4)' }}></div>
                        <div  style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{color: 'var(--md-sys-color-primary)'}}>movie</Box>
                        </div>
                    </div>
                    <Typography component="p" variant="body1" sx={{ fontWeight: "var(--md-sys-typescale-weight-black)", textTransform: "uppercase", opacity: "var(--md-sys-state-opacity-empty)" }}>Inizializzazione...</Typography>
                </div>
            );
        }

        if (!hasApiKey) {
            return (
                <div style={{ padding: 'var(--md-sys-spacing-4)', backgroundColor: 'var(--md-sys-color-surface-container-low)', borderRadius: 'var(--md-sys-shape-corner-large)', display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", border: "var(--md-sys-border-width-normal) solid var(--md-sys-color-outline)", marginLeft: 'var(--md-sys-margin-auto)', marginRight: 'var(--md-sys-margin-auto)' }}>
                    <div style={{ borderRadius: 'var(--md-sys-shape-corner-large)', color: 'var(--md-sys-color-on-primary)', width: 'var(--md-sys-spacing-8)', height: 'var(--md-sys-spacing-8)', backgroundColor: 'var(--md-sys-color-primary)', display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 'var(--md-sys-spacing-8)' }}>
                        <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ color: 'var(--md-sys-color-primary)' }}>vpn_key</Box>
                    </div>
                    <Typography component="h3" variant="h6" sx={{ color: 'var(--md-sys-color-on-surface)', fontWeight: "var(--md-sys-typescale-weight-black)", letterSpacing: "-0.005em", marginBottom: 'var(--md-sys-spacing-8)' }}>AI Studio Richiesto</Typography>
                    <Typography component="p" variant="body1" sx={{ color: 'var(--md-sys-color-on-surface-variant)', marginBottom: 'var(--md-sys-spacing-8)', lineHeight: "1.625" }}>
                        La generazione video (Veo) è disponibile solo nell&apos;ambiente AI Studio.
                        Apri l&apos;applicazione in AI Studio e seleziona una API Key abilitata.
                    </Typography>
                    {window.aistudio && (
                        <Button onClick={handleSelectKey} variant="contained">Seleziona API Key</Button>
                    )}
                </div>
            );
        }

        return (
            <div  style={{display: "grid", gridTemplateColumns: "var(--md-sys-grid-fr-1)", gap: 'var(--md-sys-spacing-8)', height: "var(--md-sys-percent-100)", padding: 'var(--md-sys-spacing-8)'}}>
                <div style={{display: "flex", flexDirection: "column", gap: 'var(--md-sys-spacing-6)'}}>
                    <div style={{ backgroundColor: 'var(--md-sys-color-surface-container-low)', borderRadius: 'var(--md-sys-shape-corner-large)', padding: 'var(--md-sys-spacing-6)', border: "var(--md-sys-border-width-normal) solid var(--md-sys-color-outline)", display: "flex", alignItems: "flex-start", gap: 'var(--md-sys-spacing-8)' }}>
                        <div style={{ borderRadius: 'var(--md-sys-shape-corner-large)', backgroundColor: 'var(--md-sys-color-primary)', width: 'var(--md-sys-spacing-16)', height: 'var(--md-sys-spacing-16)', color: "var(--md-sys-color-primary)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: "0" }}>
                            <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{}}>edit_note</Box>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                            <Typography component="h3" variant="h6" sx={{fontWeight: "var(--md-sys-typescale-weight-black)", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--md-sys-color-primary)", marginBottom: 'var(--md-sys-spacing-4)'}}>1. Prompt Descrittivo</Typography>
                            <Typography component="p" variant="body1" sx={{ color: 'var(--md-sys-color-on-surface-variant)', opacity: "var(--md-sys-state-opacity-supporting)" }}>Descrivi la scena che vuoi creare. Sii dettagliato per un risultato migliore.</Typography>
                        </div>
                    </div>
                    
                    <div style={{ flexGrow: "1", display: "flex", flexDirection: "column" }}>
                        <TextField multiline
                            id="prompt-textarea"
                            value={prompt}
                            onChange={(e) => {
                                setPrompt(e.target.value);
                                if (error) setError('');
                            }}
                            placeholder="Es. 'Un gatto astronauta fluttua nello spazio, inseguendo un gomitolo di lana cosmico'..."
                            // removed non-MD3 containerClassName
                             sx={{ height: "var(--md-sys-percent-100)" }}
                           
                        />
                    </div>

                    {error && (
                        <div style={{ backgroundColor: 'var(--md-sys-color-error-container)', color: 'var(--md-sys-color-on-error-container)', borderRadius: 'var(--md-sys-shape-corner-large)', display: "flex", alignItems: "center", gap: 'var(--md-sys-spacing-6)', padding: 'var(--md-sys-spacing-8)', fontSize: 'var(--md-sys-typescale-body-large-font-size)', fontWeight: "var(--md-sys-typescale-weight-bold)", border: "var(--md-sys-border-width-normal) solid var(--md-sys-color-outline)" }}>
                            <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 'var(--md-sys-spacing-5)' }}>error</Box>
                            {error}
                        </div>
                    )}
                </div>

                <div style={{display: "flex", flexDirection: "column", gap: 'var(--md-sys-spacing-6)'}}>
                    <div style={{ backgroundColor: 'var(--md-sys-color-surface-container-low)', borderRadius: 'var(--md-sys-shape-corner-large)', padding: 'var(--md-sys-spacing-6)', border: "var(--md-sys-border-width-normal) solid var(--md-sys-color-outline)", display: "flex", alignItems: "flex-start", gap: 'var(--md-sys-spacing-8)' }}>
                        <div style={{ borderRadius: 'var(--md-sys-shape-corner-large)', backgroundColor: 'var(--md-sys-color-secondary)', width: 'var(--md-sys-spacing-16)', height: 'var(--md-sys-spacing-16)', color: "var(--md-sys-color-secondary)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: "0" }}>
                            <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{}}>movie</Box>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                            <Typography component="h3" variant="h6" sx={{fontWeight: "var(--md-sys-typescale-weight-black)", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--md-sys-color-secondary)", marginBottom: 'var(--md-sys-spacing-4)'}}>2. Risultato</Typography>
                            <Typography component="p" variant="body1" sx={{ color: 'var(--md-sys-color-on-surface-variant)', opacity: "var(--md-sys-state-opacity-supporting)" }}>Il video generato apparirà qui sotto.</Typography>
                        </div>
                    </div>

                    <div style={{ borderRadius: 'var(--md-sys-shape-corner-large)', backgroundColor: 'var(--md-sys-color-surface-container-low)', flexGrow: "1", border: "var(--md-sys-border-width-normal) solid var(--md-sys-color-outline)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 'var(--md-sys-spacing-8)' }}>
                        {isLoading ? (
                            <div style={{ textAlign: "center" }}>
                                <div style={{ marginBottom: 'var(--md-sys-spacing-8)' }}>
                                    <div style={{ width: 'var(--md-sys-spacing-12)', height: 'var(--md-sys-spacing-12)', borderRadius: 'var(--md-sys-shape-corner-small)', marginLeft: 'var(--md-sys-margin-auto)', marginRight: 'var(--md-sys-margin-auto)' }}></div>
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                                        <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ color: 'var(--md-sys-color-primary)' }}>auto_videocam</Box>
                                    </div>
                                </div>
                                <Typography component="p" variant="body1" sx={{ fontWeight: "var(--md-sys-typescale-weight-black)", color: 'var(--md-sys-color-primary)', letterSpacing: "-0.005em" }}>{loadingMessage}</Typography>
                                <Typography component="p" variant="body1" sx={{ color: 'var(--md-sys-color-on-surface-variant)', marginTop: 'var(--md-sys-spacing-4)', fontWeight: "var(--md-sys-typescale-weight-bold)", textTransform: "uppercase", letterSpacing: "0.1em", opacity: "var(--md-sys-state-opacity-secondary)" }}>Questa operazione pu&#65533; richiedere alcuni minuti.</Typography>
                            </div>
                        ) : generatedVideoUrl ? (
                            <div  style={{ width: "var(--md-sys-percent-100)", height: "var(--md-sys-percent-100)", display: "flex", flexDirection: "column" }}>
                                <div style={{ borderRadius: 'var(--md-sys-shape-corner-large)', flexGrow: "1", backgroundColor: "black", border: "var(--md-sys-border-width-normal) solid var(--md-sys-color-outline)" }}>
                                    <video src={generatedVideoUrl} controls autoPlay loop  style={{ width: "var(--md-sys-percent-100)", height: "var(--md-sys-percent-100)" }}></video>
                                </div>
                                <div style={{marginTop: 'var(--md-sys-spacing-6)', display: "flex", justifyContent: "center"}}>
                                    <Button 
                                        onClick={() => {
                                            const a = document.createElement('a');
                                            a.href = generatedVideoUrl;
                                            a.download = 'generated-video.mp4';
                                            a.click();
                                        }}
                                        variant="contained"
                                        color="secondary"
                                    >
                                        Scarica Video
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div style={{ color: 'var(--md-sys-color-on-surface-variant)', textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", transition: "transform var(--md-sys-motion-duration-medium)" }}>
                                <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{marginBottom: 'var(--md-sys-spacing-8)', opacity: "var(--md-sys-state-opacity-tint-subtle)"}}>videocam_off</Box>
                                <Typography component="p" variant="body1" sx={{ fontWeight: "var(--md-sys-typescale-weight-black)", textTransform: "uppercase", opacity: "var(--md-sys-state-opacity-empty)" }}>In attesa di generazione</Typography>
                            </div>
                        )}

                        {/* Background effect */}
                        {!generatedVideoUrl && (
                            <div style={{ backgroundColor: 'var(--md-sys-color-gradient-to-br)', opacity: "var(--md-sys-state-opacity-placeholder)" }} />
                        )}
                    </div>
                </div>
            </div>
        )
    };

    return (
        <M3Dialog
            isOpen={true}
            onClose={onClose}
            title="Generazione Video con AI"
            headline="Crea brevi clip video partendo da una descrizione testuale"
            buttons={
                <div style={{display: "flex", gap: 'var(--md-sys-spacing-6)', alignItems: 'center'}}>
                    <Button onClick={onClose} variant="text" disabled={isLoading}>Chiudi</Button>
                    {hasApiKey && (
                        <Button 
                            onClick={handleSubmit} 
                            disabled={isLoading || !prompt} 
                            variant="contained"
                        >
                            {isLoading ? 'Generazione...' : 'Genera Video'}
                        </Button>
                    )}
                    {onNavigate && (
                        <ContextualAskAI
                            onNavigate={onNavigate}
                            context={{ source: 'video-analysis' }}
                           
                            compact
                        />
                    )}
                </div>
            }
            mode="fullscreen"
            hideBackdrop={true}
        >
            <div style={{ backgroundColor: 'var(--md-sys-color-surface-container-low)', height: "var(--md-sys-percent-100)" }}>
                {/* Aura Ornaments */}
                <div style={{ backgroundColor: 'var(--md-sys-color-primary)', borderRadius: 'var(--md-sys-shape-corner-small)' }} />
                <div style={{ backgroundColor: 'var(--md-sys-color-secondary-container)', borderRadius: 'var(--md-sys-shape-corner-small)', animationDelay: 'var(--md-sys-motion-duration-extra-long)' }} />
                
                <div  style={{ height: "var(--md-sys-percent-100)", overflowY: "auto" }}>
                    {renderContent()}
                </div>
            </div>
        </M3Dialog>
    );
};

export default VideoAnalysisModal;

