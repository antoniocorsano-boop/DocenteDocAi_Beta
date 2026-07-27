/**
 * CopilotSplashScreen.tsx — Schermata di caricamento per CopilotDocentePanel.
 *
 * Da posizionare con position:absolute all'interno del pannello Copilot,
 * non come overlay globale (a differenza di OrbitSplashScreen).
 * Svanisce dopo `duration` ms (default 1600).
 */

import React, { useEffect, useState } from 'react';
import CopilotLogo from './CopilotLogo';

export interface CopilotSplashScreenProps {
  /** Ms prima che il fade inizi (default 1600) */
  duration?: number;
  /** Messaggio da mostrare sotto il logo (opzionale) */
  message?: string;
  /** Callback al termine dell'animazione di uscita */
  onFinished?: () => void;
}

const CHIPS = ['GDPR', 'AI Act', 'AgID'] as const;

export default function CopilotSplashScreen({
  duration = 1600,
  message  = 'Preparazione assistente docente…',
  onFinished,
}: CopilotSplashScreenProps): React.JSX.Element | null {
  const [phase, setPhase] = useState<'visible' | 'fading' | 'gone'>('visible');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('fading'), duration - 350);
    const t2 = setTimeout(() => {
      setPhase('gone');
      onFinished?.();
    }, duration + 200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [duration, onFinished]);

  if (phase === 'gone') return null;

  return (
    <div
      aria-label="Caricamento CopilotDoc in corso"
      aria-live="polite"
      role="status"
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 200,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
        background: 'linear-gradient(160deg, #F0F4FF 0%, #EEF2FF 55%, #E8EDFF 100%)',
        transition: 'opacity 0.55s ease',
        opacity: phase === 'fading' ? 0 : 1,
        pointerEvents: phase === 'fading' ? 'none' : 'auto',
        overflow: 'hidden',
      }}
    >
      {/* Dot grid background */}
      <svg
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          opacity: 0.04,
          pointerEvents: 'none',
        }}
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <pattern id="cpdots" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
            <circle cx="4" cy="4" r="2" fill="#1B3A8C"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#cpdots)"/>
      </svg>

      {/* Decorative C arc — right side */}
      <svg
        aria-hidden="true"
        viewBox="0 0 400 400"
        style={{
          position: 'absolute',
          right: '-60px',
          bottom: '-40px',
          width: 280,
          height: 280,
          opacity: 0.06,
          pointerEvents: 'none',
        }}
      >
        <path d="M 280 60 A 150 150 0 1 0 280 340"
          stroke="#1B3A8C" strokeWidth="36" strokeLinecap="round" fill="none"/>
      </svg>

      {/* Logo */}
      <CopilotLogo size={80} variant="mark" state="thinking" theme="cobalt"/>

      {/* Wordmark + sub-label */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        <span
          style={{
            fontFamily: "'Lora', Georgia, serif",
            fontWeight: 700,
            fontSize: 26,
            color: '#1B3A8C',
            letterSpacing: '0.02em',
          }}
        >
          CopilotDoc
        </span>
        <span
          style={{
            fontFamily: "'DM Sans', system-ui, sans-serif",
            fontWeight: 500,
            fontSize: 12,
            color: '#E8A900',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          Assistente AI · Pubblica Amministrazione
        </span>
      </div>

      {/* Message */}
      <span
        style={{
          fontFamily: "'DM Sans', system-ui, sans-serif",
          fontWeight: 400,
          fontSize: 13,
          color: '#4B5675',
          maxWidth: 260,
          textAlign: 'center',
        }}
      >
        {message}
      </span>

      {/* Load bar */}
      <div
        style={{
          width: 160,
          height: 3,
          background: '#DDE4F5',
          borderRadius: 9999,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            height: '100%',
            background: 'linear-gradient(90deg, #1B3A8C, #3558C4, #E8A900)',
            borderRadius: 9999,
            animation: `cp-load-bar ${(duration - 350) / 1000}s ease-out forwards`,
          }}
        />
      </div>

      {/* Framework chips */}
      <div style={{ display: 'flex', gap: 6 }}>
        {CHIPS.map(chip => (
          <span
            key={chip}
            style={{
              fontFamily: "'DM Mono', 'Courier New', monospace",
              fontWeight: 500,
              fontSize: 10,
              color: '#1B3A8C',
              background: '#EEF2FF',
              border: '1px solid #C7D2FE',
              borderRadius: 4,
              padding: '2px 7px',
              letterSpacing: '0.04em',
            }}
          >
            {chip}
          </span>
        ))}
      </div>
    </div>
  );
}
