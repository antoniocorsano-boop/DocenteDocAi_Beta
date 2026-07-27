import React, { useState, useCallback } from 'react';
import { useFileDrop } from '../hooks/useFileDrop';
import { extractTextFromFile, generateHtmlDocxBlob } from '../utils/documentUtils';
// Fase 4: FULL routing for smart import/refactor (daily teacher document gesture) via AIBrain (no direct aiService)
import { AIBrain } from '../ai/brain/AIBrain';
import { AiSettings } from '../types';
import { saveAs } from '../utils/documentUtils';
import { sanitizeHTML } from '../utils/securityUtils';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { M3Dialog } from './ui';
import { logger } from '../utils/logger';
import { useUIStore } from '../stores/useUIStore';

interface SmartImportModalProps {
    onClose: () => void;
    aiSettings: AiSettings;
}

const SmartImportModal: React.FC<SmartImportModalProps> = ({ onClose, aiSettings }) => {
    const { showToast } = useUIStore(state => ({ showToast: state.actions.showToast }));
    const [step, setStep] = useState<'upload' | 'processing' | 'result'>('upload');
    const [originalFile, setOriginalFile] = useState<File | null>(null);
    const [originalText, setOriginalText] = useState('');
    const [refactoredHtml, setRefactoredHtml] = useState('');
    const [processingStatus, setProcessingStatus] = useState('');

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        if (acceptedFiles.length === 0) return;
        const file = acceptedFiles[0];
        setOriginalFile(file);
        setStep('processing');
        setProcessingStatus('Lettura file originale...');

        try {
            const text = await extractTextFromFile(file);
            setOriginalText(text);

            setProcessingStatus('Analisi e Ristrutturazione con AI...');

            // Post-Fase 4: central prompt builder + generateWithCentralPrompt for refactor
            const ctx = AIBrain.buildContext({
                source: 'smart-import-modal',
                extra: { fileName: file.name, textLength: text.length }
            });
            await AIBrain.migrateLegacyAsk(`Refactor programmazione for ${file.name}`, ctx);

            const { prompt: refP } = AIBrain.buildPrompt('refactor-programmazione', { text });
            const html = await AIBrain.generateWithCentralPrompt('refactor-programmazione', { text }, aiSettings);

            // Sanitize output before storing/rendering
            setRefactoredHtml(sanitizeHTML(html));

            setStep('result');
        } catch (error: unknown) {
            logger.error(error);
            let message = 'Errore durante l\'elaborazione.';
            if (error instanceof Error) {
                message = "Errore durante l'elaborazione: " + error.message;
            }
            showToast(message, 'error');
            setStep('upload');
        }
    }, [aiSettings, showToast]);

    const { getRootProps, getInputProps, isDragActive } = useFileDrop({
        onDrop,
        accept: 'application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain',
        multiple: false
    });

    const handleDownloadDocx = async () => {
        const blob = await generateHtmlDocxBlob(refactoredHtml, `Refactor - ${originalFile?.name}`);
        saveAs(blob, `Refactored_${originalFile?.name?.split('.')[0]}.docx`);
    };

    return (
        <M3Dialog
            onClose={onClose}
            title="Smart Import & Refactor"
            headline="Trasforma vecchi documenti in file standardizzati"
            mode="fullscreen"
            buttons={
                step === 'result' ? (
                    <>
                        <Button variant="text" onClick={() => setStep('upload')}>Ricomincia</Button>
                        <Button variant="contained" onClick={handleDownloadDocx}>
                            <Box component="span" className="material-symbols-outlined" sx={{ mr: 'var(--md-sys-spacing-2)' }}>download</Box>
                            Scarica DOCX
                        </Button>
                    </>
                ) : (
                    <Button variant="text" onClick={onClose}>Annulla</Button>
                )
            }
        >
            <Box sx={{ height: 'var(--md-sys-percent-100)', display: 'flex', flexDirection: 'column', p: 'var(--md-sys-spacing-8)' }}>
                {/* Fase 4 visible block - daily document import/refactor routed via AIBrain */}
                <Box sx={{ fontSize: '0.72rem', px: 2, py: 0.5, mb: 1, bgcolor: 'var(--md-sys-color-surface-container-low)', borderRadius: 'var(--md-sys-shape-corner-small)' }}>
                    AIBrain (Post-Fase 4): SmartImportModal — buildPrompt + generateWithCentralPrompt + buildContext + migrateLegacyAsk (refactor-programmazione)
                </Box>
                {step === 'upload' && (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 'var(--md-sys-percent-100)' }}>
                        <div
                            {...getRootProps()}
                            style={{
                                width: 'var(--md-sys-percent-100)',
                                maxWidth: 'calc(var(--md-sys-spacing-20) * 7.2)',
                                height: 'calc(var(--md-sys-spacing-20) * 4)',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: `var(--md-sys-border-width-thick) dashed ${isDragActive ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-outline-variant)'}`,
                                borderRadius: 'var(--md-sys-shape-corner-extra-large)',
                                backgroundColor: isDragActive ? 'var(--md-sys-color-primary-container)' : 'var(--md-sys-color-surface-container-low)',
                                transition: 'opacity, transform, background-color, color, border-color, box-shadow var(--md-sys-motion-duration-short) var(--md-sys-motion-easing-standard)',
                                cursor: 'pointer',
                                transform: isDragActive ? 'scale(1.05)' : 'none'
                            }}
                            data-active={isDragActive}
                        >
                            <input {...getInputProps()} />
                            <div style={{
                                width: 'var(--md-sys-spacing-20)',
                                height: 'var(--md-sys-spacing-20)',
                                borderRadius: 'var(--md-sys-shape-corner-full)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: 'var(--md-sys-spacing-6)',
                                boxShadow: 'var(--md-sys-elevation-level1)',
                                backgroundColor: isDragActive ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-surface-container-high)',
                                color: isDragActive ? 'var(--md-sys-color-on-primary)' : 'var(--md-sys-color-primary)'
                            }}>
                                <Box component="span" className="material-symbols-outlined" aria-hidden="true">transform</Box>
                            </div>
                            <Typography variant="h5" sx={{ textAlign: 'center' }}>Carica la vecchia Programmazione</Typography>
                            <div style={{marginTop: 'var(--md-sys-spacing-4)', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 'var(--md-sys-spacing-8)'}}>
                                <span style={{
                                    backgroundColor: 'var(--md-sys-color-surface-container-highest)',
                                    color: 'var(--md-sys-color-on-surface-variant)',
                                    borderRadius: 'var(--md-sys-spacing-4)',
                                    fontSize: 'var(--md-sys-spacing-3)',
                                    border: 'var(--md-sys-border-width-normal) solid var(--md-sys-color-outline)',
                                    padding: 'var(--md-sys-spacing-1) var(--md-sys-spacing-2)'
                                }}>.PDF</span>
                                <span style={{
                                    backgroundColor: 'var(--md-sys-color-surface-container-highest)',
                                    color: 'var(--md-sys-color-on-surface-variant)',
                                    borderRadius: 'var(--md-sys-spacing-4)',
                                    fontSize: 'var(--md-sys-spacing-3)',
                                    border: 'var(--md-sys-border-width-normal) solid var(--md-sys-color-outline)',
                                    padding: 'var(--md-sys-spacing-1) var(--md-sys-spacing-2)'
                                }}>.DOCX</span>
                                <span style={{
                                    backgroundColor: 'var(--md-sys-color-surface-container-highest)',
                                    color: 'var(--md-sys-color-on-surface-variant)',
                                    borderRadius: 'var(--md-sys-spacing-4)',
                                    fontSize: 'var(--md-sys-spacing-3)',
                                    border: 'var(--md-sys-border-width-normal) solid var(--md-sys-color-outline)',
                                    padding: 'var(--md-sys-spacing-1) var(--md-sys-spacing-2)'
                                }}>.TXT</span>
                            </div>
                            <Typography variant="body2" sx={{
                                mt: 'var(--md-sys-spacing-6)',
                                textAlign: 'center',
                                opacity: 'var(--md-sys-state-opacity-caption)',
                                color: 'var(--md-sys-color-on-surface-variant)'
                            }}>
                                Trascina qui il file o clicca per selezionare.
                            </Typography>
                        </div>
                    </div>
                )}

                {step === 'processing' && (
                    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 'var(--md-sys-percent-100)', gap: 'var(--md-sys-spacing-8)'}}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                            <div  style={{borderRadius: 'var(--md-sys-spacing-4)', height: 'var(--md-sys-spacing-4)', width: 'var(--md-sys-spacing-4)', borderBottom: 'var(--md-sys-spacing-1) solid var(--md-sys-color-outline)', borderColor: 'var(--md-sys-color-primary)'}}></div>
                            <div  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{color: 'var(--md-sys-color-primary)'}}>auto_awesome</Box>
                            </div>
                        </div>
                        <div style={{textAlign: 'center', gap: 'var(--md-sys-spacing-2)'}}>
                        <Typography variant="body1" sx={{ color: 'var(--md-sys-color-primary)' }}>{processingStatus}</Typography>
                            <Typography variant="body2" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>L'Intelligenza Artificiale sta riorganizzando il contenuto...</Typography>
                        </div>
                    </div>
                )}

                {step === 'result' && (
                    <div  style={{display: 'grid', gridTemplateColumns: 'var(--md-sys-grid-fr-1)', gap: 'var(--md-sys-spacing-6)', height: 'var(--md-sys-percent-100)', minHeight: '0'}}>
                        <div style={{
                            backgroundColor: 'var(--md-sys-color-surface-container-low)',
                            borderRadius: 'var(--md-sys-shape-corner-large)',
                            display: 'flex',
                            flexDirection: 'column',
                            height: 'var(--md-sys-percent-100)',
                            minHeight: '0',
                            border: 'var(--md-sys-border-width-normal) solid var(--md-sys-color-outline)'
                        }}>
                            <div style={{
                                backgroundColor: 'var(--md-sys-color-surface-container-low)',
                                padding: 'var(--md-sys-spacing-8)',
                                borderBottom: 'var(--md-sys-border-width-normal) solid var(--md-sys-color-outline)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--md-sys-spacing-8)'
                            }}>
                                <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>description</Box>
                                <Typography variant="h6" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Testo Originale (Estratto)</Typography>
                            </div>
                            <div style={{
                                color: 'var(--md-sys-color-on-surface-variant)',
                                flexGrow: '1',
                                padding: 'var(--md-sys-spacing-6)',
                                overflowY: 'auto',
                                fontSize: 'var(--md-sys-spacing-3)',
                                whiteSpace: 'pre-wrap',
                                lineHeight: '1.625'
                            }}>
                                {originalText}
                            </div>
                        </div>
                        <div style={{
                            borderRadius: 'var(--md-sys-shape-corner-large)',
                            display: 'flex',
                            flexDirection: 'column',
                            height: 'var(--md-sys-percent-100)',
                            minHeight: '0',
                            backgroundColor: 'var(--md-sys-color-surface)'
                        }}>
                            {/* Paper texture overlay */}
                            <div  style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' viewBox=\'0 0 100 100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-var(--md-sys-motion-duration-long)-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-var(--md-sys-motion-duration-long)-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-var(--md-sys-motion-duration-long)-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-var(--md-sys-motion-duration-long)-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-var(--md-sys-motion-duration-long)-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-var(--md-sys-motion-duration-long)-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-var(--md-sys-motion-duration-long)-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-var(--md-sys-motion-duration-long)-.895-2-2-2-2 .895-2 2 .895 2 2 2z\' fill=\'%23000000\' fill-opacity=\'1\' fill-rule=\'evenodd\'/%3E%3C/svg%3E")' }}></div>

                            <div style={{
                                backgroundColor: 'var(--md-sys-color-surface)',
                                padding: 'var(--md-sys-spacing-8)',
                                borderBottom: 'var(--md-sys-border-width-normal) solid var(--md-sys-color-outline)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--md-sys-spacing-8)',
                                color: 'var(--md-sys-color-primary)'
                            }}>
                                <span style={{
}}>auto_awesome</span>
                                <Typography variant="h6" sx={{ fontWeight: 'var(--md-sys-typescale-weight-black)' }}>Risultato Ristrutturato</Typography>
                            </div>
                            <div  style={{flexGrow: "1", padding: 'var(--md-sys-spacing-8)', overflowY: "auto"}}>
                                <div dangerouslySetInnerHTML={{ __html: refactoredHtml }} />
                            </div>
                        </div>
                    </div>
                )}
            </Box>
        </M3Dialog>
    );
};

export default SmartImportModal;

