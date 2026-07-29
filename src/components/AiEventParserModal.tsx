// MD3 Compliant - Block I Migration (8 violations eliminated)

import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { M3Dialog } from './ui';
import React, { useState, useCallback } from 'react';
import { AiSettings, EventoCalendario } from '../types';
// Fase 4: FULL routing for event parser (daily gesture) via AIBrain (no direct aiService)
// Post-Fase 4: central prompt builder + generateWithCentralPrompt
import { AIBrain } from '../ai/brain/AIBrain';
interface AiEventParserModalProps {
    onClose: () => void;
    onEventParsed: (eventData: Partial<EventoCalendario>) => void;
    aiSettings: AiSettings;
}

const AiEventParserModal: React.FC<AiEventParserModalProps> = ({ onClose, onEventParsed, aiSettings }) => {
  const [text, setText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleParse = useCallback(async () => {
        if (!text.trim()) {
            setError('Per favore, incolla il testo della comunicazione.');
            return;
        }
        setIsLoading(true);
        setError('');
        try {
            // POST-Fase 4: central prompt path for event extraction (daily teacher gesture)
            const parsedData = await AIBrain.generateWithCentralPrompt('event-extraction', { text }, aiSettings);
            onEventParsed(parsedData);
        } catch (e) {
            const errorMsg = e instanceof Error ? e.message : "Si è verificato un errore durante l'analisi.";
            setError(errorMsg);
        } finally {
            setIsLoading(false);
        }
    }, [text, aiSettings, onEventParsed]);

    return (
        <M3Dialog
            title="Crea Evento da Testo con AI"
            onClose={onClose}
            maxWidth="lg"
            buttons={
                <>
                    <Button variant="text" onClick={onClose} type="button" disabled={isLoading}>Annulla</Button>
                    <Button variant="contained" onClick={handleParse} type="button" disabled={isLoading || !text.trim()}>
                        {isLoading ? (
                            <>
                                <Box sx={{ borderRadius: 'var(--md-sys-spacing-4)', height: 'var(--md-sys-layout-avatar-size)', width: 'var(--md-sys-layout-avatar-size)', mr: 'var(--md-sys-spacing-2)' }} />
                                Analisi in corso...
                            </>
                        ) : (
                            <>
                                <Typography component="span" className="material-symbols-outlined" sx={{ mr: 'var(--md-sys-spacing-2)' }}>auto_awesome</Typography>
                                Analizza Testo
                            </>
                        )}
                    </Button>
                </>
            }
        >
            <Box sx={{ gap: 'var(--md-sys-spacing-8)', display: 'flex', flexDirection: 'column' }}>
                {/* AIBrain (Post-Fase 4): AiEventParserModal — buildPrompt('event-extraction') + generateWithCentralPrompt + buildContext + migrateLegacyAsk (daily teacher event parse gesture) */}
                <Typography component="p" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                    Copia il testo di una circolare o di una email e incollalo qui sotto. L'AI estrarr� automaticamente date, orari e dettagli per creare l'evento nel calendario.
                </Typography>

                <Box sx={{ mt: 'var(--md-sys-spacing-4)' }}>
                    <label htmlFor="event-text" >Testo della comunicazione</label>
                    <textarea
                        id="event-text"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        style={{ width: 'var(--md-sys-percent-100)' }}
                        rows={10}
                        placeholder="Es. 'Si comunica che il consiglio della classe 3A � convocato per il giorno 15/10/2024 alle ore 15:30...'"
                        disabled={isLoading}
                        autoFocus
                    />
                </Box>
                {error && <Typography component="p" sx={{ color: 'var(--md-sys-color-error)', textAlign: 'center', mt: 'var(--md-sys-spacing-4)' }}>{error}</Typography>}
            </Box>
        </M3Dialog>
    );
};

export default AiEventParserModal;

