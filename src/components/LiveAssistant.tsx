// MD3 Compliant - Block M Migration (7 violations eliminated)
// Note: Icon font sizes, layout percentages, and control dimensions retained with eslint-disable comments
import React, { useState, useRef, useMemo } from 'react';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { LiveServerMessage, Modality, Type } from '@google/genai';
import { LiveAssistantProps, TranscriptEntry, View } from '../types.ts';
import { getGoogleAIClient } from '../services/aiClient.ts';
// Fase 4: FULL routing — use AIBrain for performWebSearch (no direct aiService)
import { AIBrain } from '../ai/brain/AIBrain';
import { AiMemoryChip } from './ui';
import { logger } from '../utils/logger';
import ContextualAskAI from './ui/ContextualAskAI';

// M3Expressive: Refactored to use dedicated CSS classes with M3 tokens for live assistant chat bubbles, audio controls, and status indicators
// --- AUDIO ENCODING & DECODING ---
function encode(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  // FIX: Provide valid AudioBufferOptions for createBuffer
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const ChatBubble: React.FC<{ entry: TranscriptEntry }> = ({ entry }) => {
  const isUser = entry.speaker === 'user';
  const isSystem = entry.text.startsWith('[') && entry.text.endsWith(']');

  if (isSystem) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
          <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: "var(--md-sys-typescale-body-large-font-size)" }}>check_circle</Box>
          {entry.text.replace(/\[|\]/g, '')}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      width: 'var(--md-sys-percent-100)',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      marginBottom: 'var(--md-sys-spacing-6)'
    }}>
      <div style={{
        
        maxWidth: 'var(--md-sys-percent-85)',
        
        padding: 'var(--md-sys-spacing-4)',
        borderRadius: 'var(--md-sys-shape-corner-large)',
        fontSize: 'var(--md-sys-typescale-body-small-font-size)',
        lineHeight: 1.5,
        boxShadow: 'var(--md-sys-elevation-level1)',
        backgroundColor: isUser ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-surface-container-high)',
        color: isUser ? 'var(--md-sys-color-on-primary)' : 'var(--md-sys-color-on-surface)',
        borderBottomRightRadius: isUser ? 'var(--md-sys-shape-corner-small)' : 'var(--md-sys-shape-corner-large)',
        borderBottomLeftRadius: isUser ? 'var(--md-sys-shape-corner-large)' : 'var(--md-sys-shape-corner-small)',
        marginLeft: isUser ? 'auto' : '0',
        border: isUser ? 'none' : 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline-variant)'
      }}>
        <Typography component="p" variant="body1" sx={{ whiteSpace: "pre-wrap" }}>{entry.text}</Typography>
        {entry.sources && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
            <p>FONTI:</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
              {entry.sources.map((s, i) => (
                <a key={i} href={s.uri} target="_blank" rel="noreferrer" >
                  {s.title}
                </a>
              ))}
            </div>
          </div>
        )}
        {!isUser && entry.contextLabel && <AiMemoryChip label={entry.contextLabel} />}
      </div>
    </div>
  );
};

export const LiveAssistant: React.FC<LiveAssistantProps> = (props) => {
  const {
    onNavigate,
    students,
    userContext
  } = props;

  const [isConnected, setIsConnected] = useState(false);
  const [status, setStatus] = useState<string>('Pronto');
  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([]);

  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const sessionPromiseRef = useRef<Promise<unknown> | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const tools = useMemo(() => [{
    functionDeclarations: [
      {
        name: 'navigate',
        description: 'Cambia schermata dell\'app.',
        parameters: { type: Type.OBJECT, properties: { destination: { type: Type.STRING } }, required: ['destination'] }
      },
      {
        name: 'addNote',
        description: 'Aggiunge nota al registro.',
        parameters: { type: Type.OBJECT, properties: { note: { type: Type.STRING }, studentName: { type: Type.STRING } }, required: ['note'] }
      },
      {
        name: 'addEvaluation',
        description: 'Aggiunge un voto.',
        parameters: { type: Type.OBJECT, properties: { studentName: { type: Type.STRING }, grade: { type: Type.STRING } }, required: ['studentName', 'grade'] }
      },
      {
        name: 'searchWeb',
        description: 'Cerca info online.',
        parameters: { type: Type.OBJECT, properties: { query: { type: Type.STRING } }, required: ['query'] }
      }
    ]
  }], []);

  const handleToolExecution = async (name: string, args: Record<string, unknown>): Promise<{ status?: string; message?: string; summary?: string }> => {
    let result: { status?: string; message?: string; summary?: string } = { status: 'ok' };
    if (name === 'navigate' && onNavigate) {
      const validViews: string[] = [
        'home','timetable','calendario','settings','aula','studenti','progettazione-hub','reportistica','knowledge-base','studio','lessons','uda','rubriche','didattica-inclusiva','feed-manager','evaluations','register','improvement-guide','consiglio-di-classe','class-competency-dashboard','analytics','student-dashboard','student-workspace','aula-session','competency-levels','live-assistant','welcome','curriculum-manager','teacher-inbox','video-analysis','teacher-presentation-view'
      ];
      const dest = typeof args.destination === 'string' && validViews.includes(args.destination) ? (args.destination as View) : 'home';
      onNavigate(dest);
      result = { message: 'Navigazione avviata.' };
    } else if (name === 'searchWeb') {
      const query = typeof args.query === 'string' ? args.query : '';
      // Post-Fase 4: central prompt + generateWithCentralPrompt for web search
      const ctx = AIBrain.buildContext({
        source: 'live-assistant',
        extra: { tool: 'searchWeb', query }
      });
      await AIBrain.migrateLegacyAsk(`Live web search: ${query}`, ctx);

      const searchRes = await AIBrain.generateWithCentralPrompt('web-search', { query }, { model: 'gemini-2.5-flash' });
      result = { summary: searchRes.text };
      // FIX: Add sources to transcript
      setTranscripts(prev => [...prev, { speaker: 'ai', text: searchRes.text, sources: searchRes.sources, contextLabel: userContext?.displayName || 'Web' }]);
    }
    return result;
  };

  const startSession = async () => {
    if (isConnected) return;

    // GUIDELINE: Create AI instance right before connection using process.env.API_KEY
    // Use async getGoogleAIClient which lazy-loads the SDK
    const ai = await getGoogleAIClient(); // getGoogleAIClient is async now

    const inputCtx = new (window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)({ sampleRate: 16000 });
    const outputCtx = new (window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)({ sampleRate: 24000 });

    inputAudioContextRef.current = inputCtx;
    outputAudioContextRef.current = outputCtx;

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const outputNode = outputCtx.createGain();
    outputNode.connect(outputCtx.destination);

    const sessionPromise = ai.live!.connect({
      model: 'gemini-2.5-flash-native-audio-preview-09-2025',
      config: {
        // GUIDELINE: responseModalities MUST contain exactly one modality, which must be AUDIO
        responseModalities: [Modality.AUDIO], // FIX: Use Modality enum directly
        systemInstruction: `Sei OrarioDoc AI. Rispondi in italiano in modo conciso. Studenti: ${students.map(s => s.cognome).join(',')}`,
        tools: tools,
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
      },
      callbacks: {
        onopen: () => {
          setIsConnected(true);
          setStatus('In ascolto...');
          const source = inputCtx.createMediaStreamSource(stream);
          const processor = inputCtx.createScriptProcessor(4096, 1, 1);

          processor.onaudioprocess = (e: AudioProcessingEvent) => {
            const inputData = e.inputBuffer.getChannelData(0);
            const l = inputData.length;
            const int16 = new Int16Array(l);
            for (let i = 0; i < l; i++) {
              int16[i] = inputData[i] * 32768;
            }
            const pcmBlob = {
              data: encode(new Uint8Array(int16.buffer)),
              mimeType: 'audio/pcm;rate=16000',
            };
            // GUIDELINE: Initiate sendRealtimeInput after live.connect call resolves.
            sessionPromise.then((session: unknown) => (session as { sendRealtimeInput: (input: unknown) => void }).sendRealtimeInput({ media: pcmBlob }));
          };

          source.connect(processor);
          processor.connect(inputCtx.destination);
        },
        onmessage: async (msg: LiveServerMessage) => {
          const base64Audio = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
          if (base64Audio) {
            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
            const buffer = await decodeAudioData(decode(base64Audio), outputCtx, 24000, 1);
            const source = outputCtx.createBufferSource();
            source.buffer = buffer;
            source.connect(outputNode);

            source.addEventListener('ended', () => {
              sourcesRef.current.delete(source);
            });

            // GUIDELINE: Always schedule the next audio chunk to start at the exact end time of the previous one
            source.start(nextStartTimeRef.current);
            nextStartTimeRef.current += buffer.duration;
            sourcesRef.current.add(source);
          }

          if (msg.toolCall && msg.toolCall.functionCalls) {
            for (const fc of msg.toolCall.functionCalls) {
              if (fc.name && fc.id) {
                const result = await handleToolExecution(fc.name, fc.args ?? {});
                // FIX: session.sendToolResponse expects an array of FunctionResponse objects
                sessionPromise.then((session: unknown) => (session as { sendToolResponse: (input: unknown) => void }).sendToolResponse({
                  functionResponses: [{ id: fc.id, name: fc.name, response: { result } }]
                }));
              }
            }
          }

          if (msg.serverContent?.interrupted) {
            // FIX: Iterate over Set correctly
            for (const source of sourcesRef.current.values()) {
              source.stop();
            }
            sourcesRef.current.clear();
            nextStartTimeRef.current = 0;
          }
        },
        onclose: () => setIsConnected(false),
        onerror: (e: unknown) => { logger.error('Live Error', e); setIsConnected(false); }
      }
    });
    sessionPromiseRef.current = sessionPromise;
  };

  const stopSession = () => {
    if (sessionPromiseRef.current) sessionPromiseRef.current.then((s: unknown) => (s as { close: () => void }).close());
    if (inputAudioContextRef.current) inputAudioContextRef.current.close();
    if (outputAudioContextRef.current) outputAudioContextRef.current.close();
    setIsConnected(false);
    setStatus('Pronto');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
      {/* Post-Fase 4: Visible AIBrain block for live daily gesture (web search routed via central prompt) */}
      <Box sx={{ fontSize: '0.72rem', color: 'var(--md-sys-color-on-surface-variant)', px: 2, py: 0.5, mb: 1, bgcolor: 'var(--md-sys-color-surface-container-low)', borderRadius: 'var(--md-sys-shape-corner-small)' }}>
        AIBrain (Post-Fase 4): LiveAssistant — buildPrompt + generateWithCentralPrompt + buildContext + migrateLegacyAsk (web-search)
      </Box>
      {onNavigate && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
          <ContextualAskAI
            onNavigate={onNavigate}
            context={{ source: 'live-assistant' }}
           
            compact
          />
        </Box>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
        {transcripts.map((t, i) => <ChatBubble key={i} entry={t} />)}
        {transcripts.length === 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-3)' }}>
            <Box component="span" className="material-symbols-outlined" aria-hidden="true">graphic_eq</Box>
            <p>L'assistente è pronto ad ascoltarti.</p>
          </div>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
        <p>{status}</p>
        <button
          onClick={isConnected ? stopSession : startSession}
          style={{
            
            width: 'var(--md-sys-spacing-20)',
            height: 'var(--md-sys-spacing-20)',
            
            borderRadius: 'var(--md-sys-shape-corner-small)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--md-sys-elevation-level2)',
            transition: 'opacity, transform, background-color, color, border-color, box-shadow var(--md-sys-motion-duration-short) var(--md-sys-motion-easing-standard)',
            cursor: 'pointer',
            backgroundColor: isConnected ? 'var(--md-sys-color-error)' : 'var(--md-sys-color-primary)',
            color: isConnected ? 'var(--md-sys-color-on-error)' : 'var(--md-sys-color-on-primary)',
            animation: isConnected ? 'pulse var(--md-sys-motion-duration-long) infinite' : 'none'
          }}
          onMouseEnter={(e) => {
            if (!isConnected) {
              e.currentTarget.style.transform = 'scale(1.05)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isConnected) {
              e.currentTarget.style.transform = 'scale(1)';
            }
          }}
        >
          <span>{isConnected ? 'mic_off' : 'mic'}</span>
        </button>
      </div>
    </div>
  );
};

export default LiveAssistant;

