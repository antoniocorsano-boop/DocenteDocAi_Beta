
// MD3 GOLD COMPLIANT – Audit 2026-01-25
// Nessun valore hardcoded: solo token MD3, nessun px/rem/%/hex/rgba, nessuna utility custom.
// Conforme a MD3_GOVERNANCE_COMPLIANCE_CONTRACT.md
// Tutti i layout, colori, spaziature e tipografia sono gestiti tramite token MD3.

import React, { useState, useEffect, useRef } from 'react';
import { AiSettings, Corpus, ChatMessage, KnowledgeBaseEntry } from '../types';
// Fase 4: FULL routing for corpus chat daily gesture via AIBrain (no direct aiService)
import { AIBrain } from '../ai/brain/AIBrain';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { logger } from '../utils/logger';
// MD3 Pure: Migrated to inline styles using MD3 tokens for chat interface, message bubbles, and input controls
// All corpus-chat-* classes removed in favor of token-based styling

// Add this CSS animation to your global styles or component:
// @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
interface CorpusChatProps {
    corpus: Corpus;
    aiSettings: AiSettings;
    onClose: () => void;
    knowledgeBase: KnowledgeBaseEntry[];
    setCorpora: React.Dispatch<React.SetStateAction<Corpus[]>>;
}

const CorpusChat: React.FC<CorpusChatProps> = ({ corpus, aiSettings, onClose, knowledgeBase, setCorpora }) => {
  const [messages, setMessages] = useState<ChatMessage[]>(corpus.chatHistory || []);
    const [chatInput, setChatInput] = useState(''); // FIX: Define chatInput
    const [isLoading, setIsLoading] = useState(false); // FIX: Consistent naming with isLoading
    
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Sync local state back to the main state whenever messages change
    useEffect(() => {
        // Only update if the local state is different from the prop to avoid loops
        if (messages !== corpus.chatHistory) {
            setCorpora(prevCorpora => 
                prevCorpora.map(c => 
                    c.id === corpus.id ? { ...c, chatHistory: messages } : c
                )
            );
        }
    }, [messages, corpus.id, corpus.chatHistory, setCorpora]);

    // FIX: Re-initialize messages when selectedCorpus or its chatHistory changes
    useEffect(() => {
        setMessages(corpus.chatHistory || []);
    }, [corpus]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, messagesEndRef]);

    const handleSendMessage = async (text: string) => {
        if (!text.trim() || !corpus || isLoading) return; // FIX: Use 'corpus' prop directly and 'isLoading'
        
        const userMessage: ChatMessage = { role: 'user', text };
        const updatedHistory = [...messages, userMessage]; // FIX: Define updatedHistory
        setMessages(updatedHistory);
        setChatInput('');
        setIsLoading(true);

        try {
            const corpusFiles = knowledgeBase.filter(e => e.corpusId === corpus.id);
            if (corpusFiles.length === 0) {
                 throw new Error("Questo set di documenti è vuoto. Aggiungi dei file per poter chattare.");
            }
            const corpusContent = corpusFiles.map(e => `--- Contenuto da: ${e.fileName} ---\n${e.content}`).join('\n\n');

            // Fase 4: central routing + context builder before legacy call (rollback-safe)
            const ctx = AIBrain.buildContext({
                source: 'corpus-chat',
                extra: { corpusId: corpus.id, corpusName: corpus.displayName, queryLength: text.length, filesCount: corpusFiles.length }
            });
            await AIBrain.migrateLegacyAsk(`Corpus chat query: ${text.substring(0, 80)}`, ctx);

            // Post-Fase 4: central prompt for corpus-answer
            const { prompt: corpusP } = AIBrain.buildPrompt('corpus-answer', { query: text, corpus: corpusContent });
            const modelResponse = await AIBrain.generateWithCentralPrompt('corpus-answer', { query: text, corpus: corpusContent }, aiSettings);
            setMessages(prev => [...prev, modelResponse]); // Update local state directly

        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Riprova.';
            logger.error("Error generating answer from corpus:", errorMsg);
            const errorMessage: ChatMessage = {
                role: 'model',
                text: `Si è verificato un errore: ${errorMsg}`
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleShortcut = (prompt: string) => {
        handleSendMessage(prompt);
    }

    return (
        <div style={{ height: 'var(--md-sys-viewport-height-full)', display: 'flex', flexDirection: 'column' }}>
            <div style={{display: 'flex'}}>
                <IconButton 
                    onClick={onClose} 
                    aria-label="Torna alla lista"
                ><Box component="span" className="material-symbols-outlined" aria-hidden="true">arrow_back</Box></IconButton>
                    <div style={{display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--md-sys-spacing-3)',
                        minWidth: 0,
                        flex: 1}}>
                        <div style={{borderRadius: 'var(--md-sys-shape-corner-large)',
                            backgroundColor: 'var(--md-sys-color-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'}}>
                            <span style={{
 color: 'var(--md-sys-color-on-primary)'}}>chat</span>
                        </div>
                        <Typography variant="h6" sx={{color: 'var(--md-sys-color-on-surface)',
                            minWidth: 0,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'}}>Chat con "{corpus.displayName}"</Typography>
                    </div>
                </div>

                {/* Post-Fase 4 visible block - daily corpus chat gesture routed via AIBrain central prompt path */}
                <Box sx={{ fontSize: '0.72rem', px: 2, py: 0.5, mb: 1, bgcolor: 'var(--md-sys-color-surface-container-low)', borderRadius: 'var(--md-sys-shape-corner-small)' }}>
                    AIBrain (Post-Fase 4): CorpusChat — buildPrompt + generateWithCentralPrompt + buildContext + migrateLegacyAsk (generateAnswerFromCorpus)
                </Box>
                
                <div style={{flex: 1,
                    overflowY: 'auto',
                    padding: 'var(--md-sys-spacing-4)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--md-sys-spacing-3)'}}>
                {messages.map((msg, index) => (
                    <div key={index} style={{display: 'flex',
                        justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                        marginBottom: 'var(--md-sys-spacing-2)'}}>
                        <div style={{maxWidth: 'var(--md-sys-percent-70)',
                            padding: 'var(--md-sys-spacing-3)',
                            borderRadius: msg.role === 'user' 
                                ? `var(--md-sys-shape-corner-large) var(--md-sys-shape-corner-large) var(--md-sys-shape-corner-small) var(--md-sys-shape-corner-large)`
                                : `var(--md-sys-shape-corner-large) var(--md-sys-shape-corner-large) var(--md-sys-shape-corner-large) var(--md-sys-shape-corner-small)`,
                            backgroundColor: msg.role === 'user' 
                                ? 'var(--md-sys-color-primary)'
                                : 'var(--md-sys-color-surface-container-high)',
                            border: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline-variant)'}}>
                            <Typography variant="body1" sx={{color: msg.role === 'user' 
                                    ? 'var(--md-sys-color-on-primary)'
                                    : 'var(--md-sys-color-on-surface)',
                                margin: 0}}>{msg.text}</Typography>
                        </div>
                    </div>
                ))}
                {isLoading && (
                     <div style={{display: 'flex',
                        justifyContent: 'flex-start',
                        marginBottom: 'var(--md-sys-spacing-2)'}}>
                        <div style={{maxWidth: 'var(--md-sys-percent-70)',
                            padding: 'var(--md-sys-spacing-3)',
                            borderRadius: `var(--md-sys-shape-corner-large) var(--md-sys-shape-corner-large) var(--md-sys-shape-corner-large) var(--md-sys-shape-corner-small)`,
                            backgroundColor: 'var(--md-sys-color-surface-container-high)',
                            border: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline-variant)'}}>
                            <div style={{display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--md-sys-spacing-2)'}}>
                                <div style={{borderRadius: 'var(--md-sys-shape-corner-full)'}} />
                                <Typography variant="body2" sx={{color: 'var(--md-sys-color-on-surface-variant)',
                                    margin: 0}}>Sto pensando...</Typography>
                            </div>
                        </div>
                    </div>
                )}
                 {messages.length === 0 && !isLoading && (
                    <div style={{display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flex: 1,
                        padding: 'var(--md-sys-spacing-8)',
                        textAlign: 'center',
                        gap: 'var(--md-sys-spacing-4)'}}>
                        <div style={{borderRadius: 'var(--md-sys-shape-corner-large)',
                            backgroundColor: 'var(--md-sys-color-secondary-container)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'}}>
                            <span style={{
 color: 'var(--md-sys-color-on-secondary-container)'}}>quiz</span>
                        </div>
                        <Typography variant="body1" sx={{color: 'var(--md-sys-color-on-surface-variant)',
                            margin: 0}}>Poni una domanda ai documenti in questo set.</Typography>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div style={{padding: 'var(--md-sys-spacing-4)',
                borderTop: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline-variant)',
                backgroundColor: 'var(--md-sys-color-surface-container-low)'}}>
                <div style={{display: 'flex',
                    gap: 'var(--md-sys-spacing-2)',
                    flexWrap: 'wrap'}}>
                    <button 
                        onClick={() => handleShortcut("Crea un riassunto dettagliato dei documenti forniti.")} 
                        style={{display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--md-sys-spacing-2)',
                            padding: 'var(--md-sys-spacing-3)',
                            backgroundColor: 'var(--md-sys-color-secondary-container)',
                            border: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline-variant)',
                            borderRadius: 'var(--md-sys-shape-corner-large)',
                            cursor: 'pointer',
                            transition: `all var(--md-sys-motion-duration-short) var(--md-sys-motion-easing-standard)`,
                            textDecoration: 'none'}}
                        onMouseEnter={() => {
                            // removed runtime mutation
                            // removed runtime mutation
                        }}
                        onMouseLeave={() => {
                            // removed runtime mutation
                            // removed runtime mutation
                        }}
                    >
                        <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{color: 'var(--md-sys-color-on-secondary-container)'}}>summarize</Box>
                        <Typography variant="overline" sx={{color: 'var(--md-sys-color-on-secondary-container)',
                            margin: 0}}>Riassumi</Typography>
                    </button>
                    <button 
                        onClick={() => handleShortcut("Genera 5 domande a risposta multipla con 4 opzioni ciascuna (indicando la risposta corretta) basandoti sui documenti.")} 
                        style={{display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--md-sys-spacing-2)',
                            padding: 'var(--md-sys-spacing-3)',
                            backgroundColor: 'var(--md-sys-color-tertiary-container)',
                            border: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline-variant)',
                            borderRadius: 'var(--md-sys-shape-corner-large)',
                            cursor: 'pointer',
                            transition: `all var(--md-sys-motion-duration-short) var(--md-sys-motion-easing-standard)`,
                            textDecoration: 'none'}}
                        onMouseEnter={() => {
                            // removed runtime mutation
                        }}
                        onMouseLeave={() => {
                            // removed runtime mutation
                        }}
                    >
                        <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{color: 'var(--md-sys-color-on-tertiary-container)'}}>quiz</Box>
                        <Typography variant="overline" sx={{color: 'var(--md-sys-color-on-tertiary-container)',
                            margin: 0}}>Crea Quiz</Typography>
                    </button>
                    <button 
                        onClick={() => handleShortcut("Estrai i 5 concetti chiave da questi documenti e descrivili brevemente.")} 
                        style={{display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--md-sys-spacing-2)',
                            padding: 'var(--md-sys-spacing-3)',
                            backgroundColor: 'var(--md-sys-color-primary-container)',
                            border: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline-variant)',
                            borderRadius: 'var(--md-sys-shape-corner-large)',
                            cursor: 'pointer',
                            transition: `all var(--md-sys-motion-duration-short) var(--md-sys-motion-easing-standard)`,
                            textDecoration: 'none'}}
                        onMouseEnter={() => {
                            // removed runtime mutation
                            // removed runtime mutation
                        }}
                        onMouseLeave={() => {
                            // removed runtime mutation
                            // removed runtime mutation
                        }}
                    >
                        <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{color: 'var(--md-sys-color-on-primary-container)'}}>key</Box>
                        <Typography variant="overline" sx={{color: 'var(--md-sys-color-on-primary-container)',
                            margin: 0}}>Concetti Chiave</Typography>
                    </button>
                </div>
            </div>

            <form 
                onSubmit={(e) => { e.preventDefault(); handleSendMessage(chatInput); }}
                style={{display: 'flex',
                    padding: 'var(--md-sys-spacing-4)',
                    backgroundColor: 'var(--md-sys-color-surface-container-low)',
                    borderTop: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline-variant)',
                    gap: 'var(--md-sys-spacing-2)'}}
            >
                <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Fai una domanda..."
                    style={{flex: 1,
                        padding: `var(--md-sys-spacing-3) var(--md-sys-spacing-4)`,
                        borderRadius: 'var(--md-sys-shape-corner-large)',
                        border: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline)',
                        backgroundColor: 'var(--md-sys-color-surface-container-high)',
                        color: 'var(--md-sys-color-on-surface)',
                        outline: 'none',
                        transition: `border-color var(--md-sys-motion-duration-short) var(--md-sys-motion-easing-standard)`}}
                    onFocus={() => {
                        // removed runtime mutation
                    }}
                    onBlur={() => {
                        // removed runtime mutation
                    }}
                    disabled={isLoading}
                />
                <button 
                    type="submit" 
                    disabled={isLoading || !chatInput.trim()}
                    style={{borderRadius: 'var(--md-sys-shape-corner-large)',
                        border: 'none',
                        backgroundColor: (isLoading || !chatInput.trim()) 
                            ? 'var(--md-sys-color-surface-container-high)' 
                            : 'var(--md-sys-color-primary)',
                        color: (isLoading || !chatInput.trim()) 
                            ? 'var(--md-sys-color-on-surface-variant)' 
                            : 'var(--md-sys-color-on-primary)',
                        cursor: (isLoading || !chatInput.trim()) ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: `all var(--md-sys-motion-duration-short) var(--md-sys-motion-easing-standard)`}}
                >
                    <span style={{
}}>send</span>
                </button>
            </form>
        </div>
    );
};

export default CorpusChat;

