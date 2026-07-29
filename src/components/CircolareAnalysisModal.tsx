/* eslint-disable react-hooks/exhaustive-deps -- handleAnalyze/handleImport are intentionally excluded from useMemo deps */
// MD3 Compliant

import React, { useState, useMemo } from 'react';
import { AiSettings, CircularAnalysisResult, EventoCalendario } from '../types';
// Fase 4: FULL routing for circular analysis (daily gesture) via AIBrain (no direct aiService)
import { AIBrain } from '../ai/brain/AIBrain';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import { M3Dialog } from './ui';
interface CircolareAnalysisModalProps {
    url: string; // URL is passed for reference (to open in new tab), not for fetching
    title: string;
    onClose: () => void;
    aiSettings: AiSettings;
    onImportEvents: (events: Partial<EventoCalendario>[]) => void;
    onSaveToKb: (note: { title: string, content: string }) => void;
}

const CircolareAnalysisModal: React.FC<CircolareAnalysisModalProps> = (props) => {
  const { url, onClose, aiSettings, onImportEvents, onSaveToKb } = props;

    const [manualText, setManualText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [result, setResult] = useState<CircularAnalysisResult | null>(null);

    const handleAnalyze = async () => {
        if (!manualText.trim()) {
            setError("Per favore, incolla il testo della circolare.");
            return;
        }

        setIsLoading(true);
        setError('');
        try {
            // POST-Fase 4: central prompt path
            const analysisResult = await AIBrain.generateWithCentralPrompt('circular-analysis', { fileContent: manualText }, aiSettings);
            setResult(analysisResult);
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Si è verificato un errore sconosciuto durante l\'analisi.';
            setError(errorMsg);
        } finally {
            setIsLoading(false);
        }
    };

    const handleImport = () => {
        if (!result) return;

        const allEvents: Partial<EventoCalendario>[] = result.events.map(e => ({
            ...e,
            tipo: 'impegno'
        }));

        result.deadlines.forEach(d => {
            allEvents.push({
                titolo: d.title,
                data: d.date,
                tipo: 'scadenza' });
        });

        if (allEvents.length > 0) {
            onImportEvents(allEvents);
        }
        if (result.notes && result.notes.title && result.notes.content) {
            onSaveToKb(result.notes);
        }

        onClose();
    };

    const dialogButtons = useMemo(() => {
        if (!result) {
            return (
                <>
                    <Button variant="text" onClick={onClose} disabled={isLoading}>Annulla</Button>
                    <Button variant="contained" onClick={handleAnalyze} disabled={isLoading || !manualText.trim()}>
                        {isLoading ? (
                            <>
                                <Typography component="span" className="material-symbols-outlined" sx={{ mr: 'var(--md-sys-spacing-2)' }}>progress_activity</Typography>
                                Analisi...
                            </>
                        ) : (
                            <>
                                <Typography component="span" className="material-symbols-outlined" sx={{ mr: 'var(--md-sys-spacing-2)' }}>auto_awesome</Typography>
                                Analizza Testo
                            </>
                        )}
                    </Button>
                </>
            );
        } else {
            return (
                <>
                    <Button variant="text" onClick={() => setResult(null)}>Indietro</Button>
                    <Button variant="contained" onClick={handleImport}>
                        <Typography component="span" className="material-symbols-outlined" sx={{ mr: 'var(--md-sys-spacing-2)' }}>save</Typography>
                        Salva Eventi e Note
                    </Button>
                </>
            );
        }
    }, [result, isLoading, manualText, onClose, handleAnalyze, handleImport]);

    return (
            <M3Dialog
            onClose={onClose}
            title="Analisi Circolare"
            hideBackdrop={true}
            buttons={dialogButtons}
        >
            {/* Post-Fase 4 visible block - daily circular analysis gesture routed via AIBrain central prompt path */}
            <Box sx={{ fontSize: '0.72rem', color: 'var(--md-sys-color-on-surface-variant)', mb: 1, px: 1 }}>
                AIBrain (Post-Fase 4): CircolareAnalysisModal — buildPrompt + generateWithCentralPrompt + buildContext + migrateLegacyAsk (circular-analysis)
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                    {!result ? (
                        /* INPUT STATE */
                        <>
                            <div style={{ backgroundColor: 'var(--md-sys-color-surface-container-high)', padding: 'var(--md-sys-spacing-4)', borderRadius: 'var(--md-sys-shape-corner-large)', border: "var(--md-sys-border-width-thin) solid var(--md-sys-color-outline)", display: "flex" }}>
                                <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{color: 'var(--md-sys-color-primary)'}}>info</Box>
                                <div style={{marginTop: 'var(--md-sys-spacing-4)'}}>
                                    <Typography component="h3" variant="subtitle1" sx={{ fontWeight: "var(--md-sys-typescale-weight-bold)" }}>Procedura Manuale (Privacy-Safe)</Typography>
                                    <Typography component="p" variant="body1" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>L'AI analizza solo il testo che incolli qui. Non accediamo direttamente ai link per privacy.</Typography>
                                    <ol style={{ color: 'var(--md-sys-color-on-surface-variant)', gap: 'var(--md-sys-spacing-2)' }}>
                                        <li>
                                            <a href={url} target="_blank" rel="noopener noreferrer"  style={{color: 'var(--md-sys-color-primary)', fontWeight: "var(--md-sys-typescale-weight-bold)", display: "inline-flex", alignItems: "center", gap: 'var(--md-sys-spacing-4)'}}>
                                                Apri la circolare originale <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ color: 'var(--md-sys-color-primary)' }}>open_in_new</Box>
                                            </a>
                                        </li>
                                        <li>Seleziona e copia il testo.</li>
                                        <li>Incolla il testo nel box qui sotto.</li>
                                    </ol>
                                </div>
                            </div>

                            <TextField multiline
                                label="Testo della Circolare"
                                id="circular-text"
                                value={manualText}
                                onChange={(e) => setManualText(e.target.value)}
                                rows={8}
                                placeholder="Incolla qui il testo..."
                                disabled={isLoading}
                                
                            />

                            {error && (
                                <div style={{ padding: 'var(--md-sys-spacing-4)', color: 'var(--md-sys-color-on-error-container)', borderRadius: 'var(--md-sys-shape-corner-large)', display: "flex", alignItems: "center", backgroundColor: 'var(--md-sys-color-error-container)', justifyContent: "center" }}>
                                    <Box component="span" className="material-symbols-outlined" aria-hidden="true">error</Box>
                                    {error}
                                </div>
                            )}
                        </>
                    ) : (
                        /* RESULT STATE */
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                            <div style={{ padding: 'var(--md-sys-spacing-4)', backgroundColor: 'var(--md-sys-color-secondary-container)', color: 'var(--md-sys-color-on-secondary-container)', borderRadius: 'var(--md-sys-shape-corner-large)', border: "var(--md-sys-border-width-thin) solid var(--md-sys-color-outline)" }}>
                                <Typography component="h3" variant="subtitle1" sx={{ fontWeight: "var(--md-sys-typescale-weight-bold)", display: "flex", alignItems: "center" }}>
                                    <Box component="span" className="material-symbols-outlined" aria-hidden="true">summarize</Box>
                                    Riepilogo AI
                                </Typography>
                                <Typography component="p" variant="body1" sx={{ color: 'var(--md-sys-color-on-secondary-container)', opacity: "var(--md-sys-state-opacity-hover-overlay)", lineHeight: "1.625" }}>{result.summary}</Typography>
                            </div>

                            {result.events.length > 0 || result.deadlines.length > 0 ? (
                                <div style={{ borderRadius: 'var(--md-sys-shape-corner-large)', border: "var(--md-sys-border-width-thin) solid var(--md-sys-color-outline)" }}>
                                    <div style={{ backgroundColor: 'var(--md-sys-color-surface-container-high)', paddingTop: 'var(--md-sys-spacing-4)', paddingBottom: 'var(--md-sys-spacing-4)', borderBottom: "var(--md-sys-border-width-thin) solid var(--md-sys-color-outline)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <Typography component="h4" variant="caption" sx={{ color: 'var(--md-sys-color-on-surface-variant)', fontWeight: "var(--md-sys-typescale-weight-black)", textTransform: "uppercase", letterSpacing: "var(--md-sys-typescale-label-large-tracking)" }}>Eventi Rilevati</Typography>
                                        <span style={{ backgroundColor: 'var(--md-sys-color-primary)', color: 'var(--md-sys-color-on-primary)', fontWeight: "var(--md-sys-typescale-weight-bold)", borderRadius: 'var(--md-sys-shape-corner-small)' }}>{result.events.length + result.deadlines.length}</span>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                                        {result.events.map((e, i) => (
                                            <div key={i} style={{ padding: 'var(--md-sys-spacing-4)', display: "flex", justifyContent: "space-between", alignItems: "center", transition: "color var(--md-sys-motion-duration-medium) var(--md-sys-motion-easing-standard)" }}>
                                                <div  style={{ display: "flex", alignItems: "center" }}>
                                                    <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ padding: 'var(--md-sys-spacing-2)', color: 'var(--md-sys-color-on-primary)', backgroundColor: 'var(--md-sys-color-primary)', borderRadius: 'var(--md-sys-shape-corner-small)' }}>event</Box>
                                                    <span  style={{ fontWeight: "var(--md-sys-typescale-weight-medium)" }}>{e.titolo}</span>
                                                </div>
                                                <span style={{ backgroundColor: 'var(--md-sys-color-surface-container-high)', borderRadius: 'var(--md-sys-shape-corner-small)', border: "var(--md-sys-border-width-thin) solid var(--md-sys-color-outline)" }}>{e.data}</span>
                                            </div>
                                        ))}
                                        {result.deadlines.map((d, i) => (
                                            <div key={`d-${i}`} style={{ padding: 'var(--md-sys-spacing-4)', backgroundColor: 'var(--md-sys-color-error-container)', display: "flex", justifyContent: "space-between", alignItems: "center", transition: "color var(--md-sys-motion-duration-medium) var(--md-sys-motion-easing-standard)" }}>
                                                <div  style={{ display: "flex", alignItems: "center" }}>
                                                    <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ padding: 'var(--md-sys-spacing-2)', color: 'var(--md-sys-color-on-error-container)', backgroundColor: 'var(--md-sys-color-error-container)', borderRadius: 'var(--md-sys-shape-corner-small)' }}>flag</Box>
                                                    <span style={{ color: 'var(--md-sys-color-on-error-container)', fontWeight: "var(--md-sys-typescale-weight-medium)" }}>{d.title}</span>
                                                </div>
                                                <span style={{ color: 'var(--md-sys-color-on-error-container)', backgroundColor: 'var(--md-sys-color-error-container)', borderRadius: 'var(--md-sys-shape-corner-small)' }}>{d.date}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div style={{ padding: 'var(--md-sys-spacing-4)', borderRadius: 'var(--md-sys-shape-corner-large)', textAlign: "center" }}>
                                    <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>event_busy</Box>
                                    <Typography component="p" variant="body1" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Nessun evento o scadenza rilevato nel testo.</Typography>
                                </div>
                            )}
                        </div>
                    )}
                </Box>
        </M3Dialog>
    );
};

export default CircolareAnalysisModal;

