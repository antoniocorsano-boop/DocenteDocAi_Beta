// MD3 Gold Compliant
// Note: Scrollable areas use viewport height tokens for functional UX

// Web Speech API — not yet in TypeScript's lib.dom.d.ts as stable
interface SpeechRecognitionResultEntry {
  readonly transcript: string;
}
interface SpeechRecognitionResult {
  readonly length: number;
  [index: number]: SpeechRecognitionResultEntry;
}
interface SpeechRecognitionResultList {
  readonly length: number;
  [index: number]: SpeechRecognitionResult;
}
interface SpeechRecognitionEvent extends Event {
  readonly results: SpeechRecognitionResultList;
}
interface SpeechRecognitionErrorEvent extends Event {
  readonly error: 'not-allowed' | 'no-speech' | 'audio-capture' | string;
}
interface SpeechRecognitionInstance {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  start(): void;
  stop(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionInstance;
type SpeechRecognitionWindow = Window & {
  SpeechRecognition?: SpeechRecognitionCtor;
  webkitSpeechRecognition?: SpeechRecognitionCtor;
};

import React, { useState, useRef, useEffect } from 'react';
import { fetchNotebookFiles, uploadNotebookFile, deleteNotebookFile, NotebookLMFile } from '../services/notebooklmService';
// Migration A: Route through the single AIBrain
import { AIBrain } from '../ai/brain/AIBrain';
import Button from '@mui/material/Button';
import ButtonBase from '@mui/material/ButtonBase';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { M3Dialog, TextField } from './ui';
import { AiSettings, ChatMessage } from '../types';

interface AssistantModalProps {
  open: boolean;
  onClose: () => void;
  mode?: 'chat' | 'docs' | 'tools' | 'backup';
  aiSettings: AiSettings;
  context?: unknown;
  onOpenImageAnalysis?: () => void;
  onOpenVideoAnalysis?: () => void;
  onOpenCircularAnalysis?: () => void;
}

const SUGGESTED_PROMPTS = [
  'Come posso usare questa funzione?',
  'Genera una traccia per una lezione',
  'Suggerisci una valutazione',
  'Spiegami questa schermata',
];

const TABS: { key: 'chat' | 'docs' | 'tools'; label: string; icon: string }[] = [
  { key: 'chat', label: 'Chat', icon: 'chat' },
  { key: 'docs', label: 'Documenti', icon: 'import_contacts' },
  { key: 'tools', label: 'Strumenti AI', icon: 'auto_awesome' },
];

const AssistantModal: React.FC<AssistantModalProps> = ({
  open,
  onClose,
  mode = 'chat',
  aiSettings: _aiSettings,
  context,
  onOpenImageAnalysis,
  onOpenVideoAnalysis,
  onOpenCircularAnalysis }) => {
  const [activeMode, setActiveMode] = React.useState<'chat' | 'docs' | 'tools'>(mode === 'backup' ? 'chat' : (mode as 'chat' | 'docs' | 'tools'));

  // Sync activeMode when mode prop changes (e.g. FAB action selection)
  useEffect(() => {
    if (mode !== 'backup') setActiveMode(mode as 'chat' | 'docs' | 'tools');
  }, [mode]);
  const [input, setInput] = useState('');
  // NotebookLM state
  const [nbFiles, setNbFiles] = useState<NotebookLMFile[]>([]);
  const [nbLoading, setNbLoading] = useState(false);
  const [nbError, setNbError] = useState<string | null>(null);
  const nbFileInput = useRef<HTMLInputElement>(null);
  
  // Carica elenco file NotebookLM all'apertura modale docs
  useEffect(() => {
    if (activeMode === 'docs' && open) {
      setNbLoading(true);
      fetchNotebookFiles().then(setNbFiles).catch(() => setNbError('Errore caricamento files')).finally(() => setNbLoading(false));
    }
  }, [activeMode, open]);

  const handleNbUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setNbLoading(true);
    setNbError(null);
    try {
      const file = e.target.files[0];
      const uploaded = await uploadNotebookFile(file);
      setNbFiles(files => [uploaded, ...files]);
    } catch {
      setNbError('Errore upload file');
    } finally {
      setNbLoading(false);
      if (nbFileInput.current) nbFileInput.current.value = '';
    }
  };

  const handleNbDelete = async (id: string) => {
    setNbLoading(true);
    setNbError(null);
    try {
      await deleteNotebookFile(id);
      setNbFiles(files => files.filter(f => f.id !== id));
    } catch {
      setNbError('Errore eliminazione file');
    } finally {
      setNbLoading(false);
    }
  };

  const handleNbSync = async () => {
    setNbLoading(true);
    setNbError(null);
    try {
      const files = await fetchNotebookFiles();
      setNbFiles(files);
    } catch {
      setNbError('Errore sincronizzazione');
    } finally {
      setNbLoading(false);
    }
  };
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // --- Voice Recognition Logic ---
  const startVoiceInput = () => {
    setVoiceError(null);
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      setVoiceError('Il riconoscimento vocale non è supportato su questo browser.');
      return;
    }
    const SpeechRecognition = (window as SpeechRecognitionWindow).SpeechRecognition || (window as SpeechRecognitionWindow).webkitSpeechRecognition;
    const recognition = new SpeechRecognition!();
    recognition.lang = 'it-IT';
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;
    recognitionRef.current = recognition;
    setTranscript('');
    setIsRecording(true);
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let final = '';
      for (let i = 0; i < event.results.length; ++i) {
          final += event.results[i][0].transcript;
      }
      setTranscript(final);
    };
    recognition.onend = () => {
      setIsRecording(false);
      if (transcript.trim()) {
        setInput(transcript.trim());
        setTranscript('');
        setTimeout(() => handleSend(), 100); // invia subito
      }
    };
    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      setIsRecording(false);
      setTranscript('');
      let msg = 'Errore durante la dettatura.';
      if (event.error === 'not-allowed') msg = 'Permesso microfono negato.';
      if (event.error === 'no-speech') msg = 'Nessun audio rilevato.';
      if (event.error === 'audio-capture') msg = 'Microfono non trovato.';
      setVoiceError(msg);
    };
    recognition.start();
  };

  const stopVoiceInput = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  // Focus input when opened and restore focus on close; handle Escape to close
  const lastActiveRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (open) {
      lastActiveRef.current = document.activeElement as HTMLElement | null;
      if (inputRef.current) inputRef.current.focus();
    } else {
      if (lastActiveRef.current) {
        lastActiveRef.current.focus();
      }
    }
  }, [open]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) {
      window.addEventListener('keydown', handleKey);
      return () => window.removeEventListener('keydown', handleKey);
    }
    return;
  }, [open, onClose]);

  const handleSend = async () => {
    const text = (isRecording ? transcript : input).trim();
    if (!text) return;
    
    const userMsg: ChatMessage = { role: 'user', text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setLoading(true);
    setInput('');
    setTranscript('');
    
    try {
      // Fase 3 continuation: Real consumption of AIBrain.ask + buildContext (user-centric daily assistant gesture)
      const ctx = AIBrain.buildContext({
        source: 'assistant-modal',
        extra: { mode: activeMode, hasContext: !!context }
      });
      const brainResult = await AIBrain.ask({ 
        prompt: text, 
        context: ctx 
      });
      
      const aiResponse: ChatMessage = { 
        role: 'model', 
        text: brainResult.content 
      };
      setMessages((msgs) => [...msgs, aiResponse]);

      // Fase 3 continuation: visible source indicator (AIBrain)
      if (brainResult.source) {
        console.log(`[AIBrain Fase 3] Response source: ${brainResult.source}`);
      }
    } catch {
      setMessages((msgs) => [...msgs, { role: 'model', text: 'Si è verificato un errore nella generazione della risposta.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handlePrompt = (prompt: string) => {
    setInput(prompt);
    if (inputRef.current) inputRef.current.focus();
  };

  if (!open) return null;

  const tabRow = (
    <Box
      role="tablist"
      aria-label="Modalità assistente"
      sx={{
        display: 'flex',
        flexDirection: 'row',
        gap: 'var(--md-sys-spacing-2)',
        padding: 'var(--md-sys-spacing-2) var(--md-sys-spacing-4)',
        backgroundColor: 'var(--md-sys-color-surface-container-low)',
        borderBottom: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline-variant)' }}
    >
      {TABS.map(tab => (
        <ButtonBase
          key={tab.key}
          role="tab"
          aria-selected={activeMode === tab.key}
          focusRipple
          onClick={() => setActiveMode(tab.key)}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--md-sys-spacing-2)',
            padding: 'var(--md-sys-spacing-2) var(--md-sys-spacing-6)',
            borderRadius: 'var(--md-sys-shape-corner-full)',
            fontFamily: 'var(--md-sys-typescale-label-large-font, inherit)',
            fontSize: 'var(--md-sys-typescale-label-large-size)',
            fontWeight: activeMode === tab.key ? 'var(--md-sys-typescale-weight-bold)' : 'var(--md-sys-typescale-weight-medium)',
            backgroundColor: activeMode === tab.key ? 'var(--md-sys-color-secondary-container)' : 'transparent',
            color: activeMode === tab.key ? 'var(--md-sys-color-on-secondary-container)' : 'var(--md-sys-color-on-surface-variant)',
            transition: 'background-color var(--md-sys-motion-duration-short) var(--md-sys-motion-easing-standard)' }}
        >
          <Box component="span" className="material-symbols-outlined" sx={{ fontSize: 'var(--md-sys-typescale-label-large-size)' }}>{tab.icon}</Box>
          {tab.label}
        </ButtonBase>
      ))}
    </Box>
  );

  const headerContent = (
    <Box sx={{
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 'var(--md-sys-spacing-4)',
      backgroundColor: 'var(--md-sys-color-surface)',
      borderBottom: `var(--md-sys-border-width-normal) solid var(--md-sys-color-outline)`
    }}>
      <Box sx={{
        flexGrow: 1,
        minWidth: 0
      }}>
      <Typography variant="h6" component="h2">
          Assistente DocenteDoc AI
        </Typography>
      </Box>
      <ButtonBase
        onClick={onClose}
        focusRipple
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 'var(--md-sys-shape-corner-medium)',
          width: 'var(--md-sys-spacing-10)',
          height: 'var(--md-sys-spacing-10)',
          transition: 'color var(--md-sys-motion-duration-medium) var(--md-sys-motion-easing-standard)',
        }}
        data-focus-priority="-1"
        aria-label="Chiudi assistente"
      >
        <Box component="span" className="material-symbols-outlined">close</Box>
      </ButtonBase>
    </Box>
  );

  return (
    <M3Dialog
      title="Assistente DocenteDoc AI"
      onClose={onClose}
      maxWidth="md"
      hideBackdrop={false}
      headerContent={<>{headerContent}{tabRow}</>}
      wrapperTestId="assistant-modal-overlay"
    >
        {activeMode === 'chat' && (
          <>
            <Box sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--md-sys-spacing-4)',
              overflowY: 'auto',
              
              maxHeight: 'var(--md-sys-viewport-height-50)'
              
            }}>
              {messages.length === 0 && (
                <Box sx={{
                  textAlign: 'center',
                  color: 'var(--md-sys-color-primary)'
                }}>
                  Come posso aiutarti?
                </Box>
              )}
              {messages.map((msg, i) => (
                <Box
                  key={i}
                  sx={{
                    padding: 'var(--md-sys-spacing-4)',
                    borderRadius: 'var(--md-sys-shape-corner-medium)',
                    backgroundColor: msg.role === 'user' ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-surface-container-high)',
                    color: msg.role === 'user' ? 'var(--md-sys-color-on-primary)' : 'var(--md-sys-color-on-surface)',
                    marginLeft: msg.role === 'user' ? 'var(--md-sys-spacing-12)' : '0',
                    marginRight: msg.role === 'user' ? '0' : 'var(--md-sys-spacing-12)'
                  }}
                >
                  {msg.text}
                </Box>
              ))}
              {loading && <div role="status" aria-live="polite" aria-atomic="true" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Sto pensando…</div>}
            </Box>
            <Box sx={{
              display: 'flex',
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: 'var(--md-sys-spacing-2)'
            }}>
              {SUGGESTED_PROMPTS.map((p) => (
                <Button
                  key={p}
                  variant="outlined"
                  onClick={() => handlePrompt(p)}
                  sx={{
                    marginRight: 'var(--md-sys-spacing-2)',
                    marginBottom: 'var(--md-sys-spacing-2)'
                  }}
                >
                  {p}
                </Button>
              ))}
            </Box>
          </>
        )}

        {activeMode === 'tools' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-6)', padding: 'var(--md-sys-spacing-4)' }}>
            <Typography variant="body2" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
              Lancia uno strumento AI direttamente dalla chat.
            </Typography>
            {[
              {
                key: 'image',
                icon: 'image_search',
                label: 'Analisi Immagine',
                description: 'Carica e analizza immagini con AI',
                onAction: onOpenImageAnalysis,
                },
                {
                  key: 'video',
                  icon: 'video_search',
                  label: 'Analisi Video',
                  description: 'Analizza contenuti video con AI',
                  onAction: onOpenVideoAnalysis,
                },
                {
                  key: 'circular',
                  icon: 'description',
                  label: 'Analisi Circolare',
                  description: 'Estrai dati da circolari scolastiche',
                  onAction: onOpenCircularAnalysis,
                },
            ].map(tool => (
              <ButtonBase
                key={tool.key}
                onClick={() => { tool.onAction?.(); onClose(); }}
                disabled={!tool.onAction}
                focusRipple
                sx={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 'var(--md-sys-spacing-6)',
                  padding: 'var(--md-sys-spacing-5)',
                  borderRadius: 'var(--md-sys-shape-corner-large)',
                  border: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline-variant)',
                  backgroundColor: tool.onAction ? 'var(--md-sys-color-surface-container)' : 'var(--md-sys-color-surface-container-low)',
                  opacity: tool.onAction ? undefined : 'var(--md-sys-state-opacity-placeholder)',
                  textAlign: 'left',
                  width: 'var(--md-sys-percent-full)',
                  transition: 'background-color var(--md-sys-motion-duration-short) var(--md-sys-motion-easing-standard)' }}
              >
                <Box component="span" className="material-symbols-outlined" sx={{ fontSize: 'var(--md-sys-spacing-10)', color: 'var(--md-sys-color-primary)' }}>{tool.icon}</Box>
                <Box>
                  <Typography variant="body1" sx={{ color: 'var(--md-sys-color-on-surface)' }}>{tool.label}</Typography>
                  <Typography variant="caption" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>{tool.description}</Typography>
                </Box>
                <Box component="span" className="material-symbols-outlined" sx={{ marginLeft: 'var(--md-sys-margin-auto)', color: 'var(--md-sys-color-on-surface-variant)' }}>chevron_right</Box>
              </ButtonBase>
            ))}
          </Box>
        )}

        {activeMode === 'docs' && (
          <Box sx={{ marginTop: 'var(--md-sys-spacing-4)' }}>
            <Box sx={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <Box sx={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 'var(--md-sys-spacing-2)'
              }}>
                <Box component="span" className="material-symbols-outlined" sx={{ color: 'var(--md-sys-color-secondary)' }}>import_contacts</Box>
                <Typography variant="h6" component="h3">NotebookLM</Typography>
              </Box>
              <Box sx={{
                display: 'flex',
                flexDirection: 'row',
                gap: 'var(--md-sys-spacing-2)'
              }}>
                <Button
                  variant="text"
                  onClick={handleNbSync}
                  disabled={nbLoading}
                >
                  <Box component="span" className="material-symbols-outlined">sync</Box>
                </Button>
                <input
                  type="file"
                  ref={nbFileInput}
                  style={{ display: "none" }}
                  onChange={handleNbUpload}
                  accept=".txt,.md,.pdf,.docx"
                  aria-label="Carica file per knowledge base"
                />
                <Button
                  variant="text"
                  onClick={() => nbFileInput.current?.click()}
                  disabled={nbLoading}
                >
                  <Box component="span" className="material-symbols-outlined">upload</Box>
                </Button>
              </Box>
            </Box>
            {nbError && <Box sx={{
              padding: 'var(--md-sys-spacing-4)',
              borderRadius: 'var(--md-sys-shape-corner-medium)',
              color: 'var(--md-sys-color-error)',
              backgroundColor: 'var(--md-sys-color-error-container)'
            }}>{nbError}</Box>}
            {nbLoading && <div style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Caricamento…</div>}
            <Box sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--md-sys-spacing-4)',
              overflowY: 'auto',
              
              maxHeight: 'var(--md-sys-viewport-height-40)'
              
            }}>
              {nbFiles.map(file => (
                <Box key={file.id} sx={{
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 'var(--md-sys-spacing-4)',
                  borderRadius: 'var(--md-sys-shape-corner-medium)',
                  backgroundColor: 'var(--md-sys-color-surface-container-high)',
                  border: `var(--md-sys-border-width-thin) solid var(--md-sys-color-outline)`
                }}>
                  <Box sx={{
                    flexGrow: 1,
                    minWidth: 0
                  }}>
                    <Typography variant="body2" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</Typography>
                    <Typography variant="caption" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>{new Date(file.lastModified).toLocaleDateString()}</Typography>
                  </Box>
                  <Button
                    variant="text"
                    color="error"
                    onClick={() => handleNbDelete(file.id)}
                  >
                    <Box component="span" className="material-symbols-outlined">delete</Box>
                  </Button>
                </Box>
              ))}
            </Box>
          </Box>
        )}

      {/* Input Footer */}
        <Box sx={{
          display: 'flex',
          flexDirection: 'row',
          gap: 'var(--md-sys-spacing-6)',
          alignItems: 'flex-end',
          width: 'var(--md-sys-percent-full)',
          p: 'var(--md-sys-spacing-4)',
          backgroundColor: 'var(--md-sys-color-surface-container-low)',
          borderTop: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline)'
        }}>
        <Box sx={{ flexGrow: 1 }}>
          <TextField
            label={isRecording ? "In ascolto..." : "Scrivi una domanda…"}
            placeholder={isRecording ? "In ascolto..." : "Scrivi una domanda…"}
            value={isRecording ? transcript : input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={loading}
            sx={isRecording ? { outline: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-error)' } : {}}
          />
        </Box>
        <Button
          variant="text"
          sx={{
            color: isRecording ? 'var(--md-sys-color-error)' : 'var(--md-sys-color-secondary)',
            padding: 'var(--md-sys-spacing-4)',
            minWidth: '0'
          }}
          onClick={isRecording ? stopVoiceInput : startVoiceInput}
          title={isRecording ? 'Stop' : 'Voice input'}
        >
          <Box component="span" className="material-symbols-outlined">
            {isRecording ? 'mic' : 'mic_none'}
          </Box>
        </Button>
        <Button
          variant="contained"
          onClick={handleSend}
          disabled={loading || !input.trim()}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--md-sys-spacing-4)'
          }}
        >
          <Box component="span" className="material-symbols-outlined">send</Box>
        </Button>
        {voiceError && <Typography variant="caption" sx={{
          color: 'var(--md-sys-color-error)',
          width: 'var(--md-sys-percent-full)',
          textAlign: 'center'
        }}>{voiceError}</Typography>}
      </Box>
    </M3Dialog>
  );
}

export default AssistantModal;
