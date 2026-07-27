// MD3 Gold Compliant
// Tutti gli stili usano esclusivamente token MD3 (nessun valore hardcoded)
// Audit: gennaio 2026

/* M3Expressive - FeedManager Component */

import React, { useState } from 'react';
import { FeedSource, View, NavigationParams } from '../types';
// Fase 4: FULL routing for feed discovery (daily external source gesture) via AIBrain (no direct aiService)
import { AIBrain } from '../ai/brain/AIBrain';
import { InfoCard, SectionHeader, TextField, M3ConfirmDialog } from './ui';
import Button from '@mui/material/Button';
import InputAdornment from '@mui/material/InputAdornment';
import Box from '@mui/material/Box';
import { logger } from '../utils/logger';
import ContextualAskAI from './ui/ContextualAskAI';

interface FeedManagerProps {
    sources: FeedSource[];
    setSources: React.Dispatch<React.SetStateAction<FeedSource[]>>;
    showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
    onOpenCircularAnalysis: (url: string, title: string) => void;
    onNavigate?: (view: View, context?: NavigationParams) => void;
}

const FeedManager: React.FC<FeedManagerProps> = ({ sources, setSources, showToast, onNavigate }) => {
    const [pageUrl, setPageUrl] = useState('');
    const [confirmDialog, setConfirmDialog] = useState<{ message: string; onConfirm: () => void } | null>(null);
    
    const handleAddSource = async () => {
        if (!pageUrl.trim()) return;

        let correctedUrl = pageUrl.trim();
        if (!/^https?:\/\//i.test(correctedUrl)) {
            correctedUrl = 'https://' + correctedUrl;
        }

        try {
            new URL(correctedUrl);
        } catch {
            showToast("L'URL inserito non è valido.", "error");
            return;
        }

        try {
            // Fase 4: AIBrain central gateway for feed discovery (daily gesture)
            const ctx = AIBrain.buildContext({
                source: 'feed-manager',
                extra: { url: correctedUrl }
            });
            await AIBrain.migrateLegacyAsk(`Scopri feed RSS per ${correctedUrl}`, ctx);

            const { feedUrl, title } = await AIBrain.discoverAndCreateFeed(correctedUrl);
            const newSource: FeedSource = {
                id: `feed-${Date.now()}`,
                pageUrl: correctedUrl,
                feedUrl,
                title: title || 'Fonte Sconosciuta',
            };
            setSources(prev => [...prev.filter(s => s.pageUrl !== correctedUrl), newSource]);
            setPageUrl('');
            showToast(`Fonte "${title}" aggiunta con successo!`, 'success');
        } catch (error: unknown) {
            logger.error("Error adding feed source:", error);
            let message = "Si è verificato un errore sconosciuto.";
            if (error instanceof Error) message = error.message;
            showToast(message, "error");
        }
    };

    const handleDeleteSource = (sourceId: string) => {
        setConfirmDialog({
            message: 'Sei sicuro di voler smettere di monitorare questa fonte?',
            onConfirm: () => {
                setSources(prev => prev.filter(s => s.id !== sourceId));
            }
        });
    };

    const handleCheckForUpdates = async (source: FeedSource) => {
        try {
            await AIBrain.fetchAndParseRssFeed(source.feedUrl);
        } catch (error: unknown) {
            let message = 'Errore sconosciuto.';
            if (error instanceof Error) message = error.message;
            showToast(`Errore: ${message}`, 'error');
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
            <SectionHeader 
                title="Fonti Esterne & Feed" 
                subtitle="Gestione delle fonti RSS e sincronizzazione delle circolari."
                icon="rss_feed"
            />

            {/* Contextual AI (Fase 3) */}
            {onNavigate && (
                <Box sx={{ mb: 'var(--md-sys-spacing-4)' }}>
                    <ContextualAskAI
                        onNavigate={onNavigate}
                        context={{ source: 'feed-manager' }}
                    />
                </Box>
            )}

            <InfoCard
                title="Funzionalità Feed Disabilitata"
                description="Per garantire la tua privacy e la sicurezza dei dati, la sincronizzazione automatica con fonti RSS esterne è stata disabilitata. L'app non può accedere a contenuti esterni senza un server proxy, che potrebbe compromettere i tuoi dati."
                icon="security"
                variant="error"
                
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                <h2>Aggiungi una Nuova Fonte</h2>
                <p>
                    Puoi incollare l'URL della pagina delle circolari del tuo istituto. L'app *tenterebbe* di cercare un feed RSS.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                    <TextField
                        type="url"
                        value={pageUrl}
                        onChange={e => setPageUrl(e.target.value)}
                        placeholder="www.nomescuola.edu.it/circolari"
                        disabled={true}
                        title="Funzionalità disabilitata"
                        slotProps={{ htmlInput: { startAdornment: <InputAdornment position="start"><Box component="span" className="material-symbols-outlined" aria-hidden="true">link</Box></InputAdornment> } }}
                    />
                    <Button 
                        onClick={handleAddSource} 
                        variant="contained" 
                        disabled={true} 
                        startIcon={<Box component="span" className="material-symbols-outlined" aria-hidden="true">add_link</Box>}
                    >
                        Aggiungi
                    </Button>
                </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                <h2>Fonti Monitorate</h2>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                    {sources.length > 0 ? sources.map(source => (
                        <div key={source.id} >
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-3)' }}>
                                        <Box component="span" className="material-symbols-outlined" aria-hidden="true">rss_feed</Box>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                                        <p>{source.title}</p>
                                        <a href={source.pageUrl} target="_blank" rel="noopener noreferrer" >{source.pageUrl}</a>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-3)' }}>
                                    <Button 
                                        onClick={() => handleDeleteSource(source.id)} 
                                        variant="text" 
                                        
                                    >
                                        <Box component="span" className="material-symbols-outlined" aria-hidden="true">delete</Box>
                                    </Button>
                                    <Button 
                                        onClick={() => handleCheckForUpdates(source)} 
                                        disabled={true} 
                                        variant="outlined"
                                        
                                    >
                                        Aggiorna
                                    </Button>
                                </div>
                            </div>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                                <p>
                                    La funzionalità di aggiornamento feed è disabilitata per motivi di privacy. Analizza manualmente incollando il testo.
                                </p>
                            </div>
                        </div>
                    )) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-3)' }}>
                            <Box component="span" className="material-symbols-outlined" aria-hidden="true">rss_feed</Box>
                            <p>Nessuna fonte monitorata</p>
                            <p>Aggiungi il sito della tua scuola per ricevere notifiche sulle circolari.</p>
                        </div>
                    )}
                </div>
            </div>
            {confirmDialog && (
                <M3ConfirmDialog
                    title="Conferma"
                    message={confirmDialog.message}
                    onConfirm={() => { confirmDialog.onConfirm(); setConfirmDialog(null); }}
                    onCancel={() => setConfirmDialog(null)}
                    danger={true}
                />
            )}
        </div>
    );
};

export default FeedManager;

