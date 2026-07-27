/**
 * OrbitSplashScreen.tsx — PWA splash screen al caricamento di Orbit.
 *
 * Si mostra con posizione fixed su tutto lo schermo mentre l'app inizializza.
 * Svanisce automaticamente dopo `duration` ms (default 1800).
 */

import React, { useEffect, useState } from 'react';
import OrbitLogo from './OrbitLogo';

export interface OrbitSplashScreenProps {
  /** Ms prima che il fade inizi (default 1800) */
  duration?: number;
  /** Callback invocata quando l'animazione di uscita termina */
  onFinished?: () => void;
}

export default function OrbitSplashScreen({
  duration = 1800,
  onFinished,
}: OrbitSplashScreenProps): React.JSX.Element | null {
  const [phase, setPhase] = useState<'visible' | 'fading' | 'gone'>('visible');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('fading'), duration - 400);
    const t2 = setTimeout(() => {
      setPhase('gone');
      onFinished?.();
    }, duration + 200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [duration, onFinished]);

  if (phase === 'gone') return null;

  return (
    <div
      aria-label="Caricamento Orbit in corso"
      aria-live="polite"
      role="status"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 24,
        background: 'radial-gradient(ellipse at 50% 40%, #141C2E 0%, #070B14 100%)',
        transition: 'opacity 0.6s ease',
        opacity: phase === 'fading' ? 0 : 1,
        pointerEvents: phase === 'fading' ? 'none' : 'auto',
      }}
    >
      {/* Decorative bg rings */}
      <svg
        aria-hidden="true"
        viewBox="0 0 512 512"
        style={{
          position: 'absolute',
          width: '90vmin',
          height: '90vmin',
          opacity: 0.07,
          pointerEvents: 'none',
        }}
      >
        <ellipse cx="256" cy="256" rx="230" ry="230" stroke="#00C8FF" strokeWidth="1.5" fill="none"/>
        <ellipse cx="256" cy="256" rx="145" ry="145" stroke="#8B6FFF" strokeWidth="1" fill="none"/>
      </svg>

      {/* Logo mark */}
      <OrbitLogo size={96} variant="mark" state="active" aria-label="Orbit"/>

      {/* Wordmark */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
        <span
          style={{
            fontFamily: "'Barlow Condensed', system-ui, sans-serif",
            fontWeight: 700,
            fontSize: 32,
            letterSpacing: '0.22em',
            color: '#E8F0FF',
            textTransform: 'uppercase',
          }}
        >
          ORBIT
        </span>
        <span
          style={{
            fontFamily: "'Barlow', system-ui, sans-serif",
            fontWeight: 400,
            fontSize: 13,
            letterSpacing: '0.08em',
            color: '#8899BB',
          }}
        >
          by DocenteDoc AI
        </span>
      </div>

      {/* Load bar */}
      <div
        style={{
          width: 120,
          height: 3,
          background: '#141C2E',
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
            background: 'linear-gradient(90deg, #FF8C00, #00C8FF)',
            borderRadius: 9999,
            animation: `orbit-load-bar ${(duration - 400) / 1000}s ease-out forwards`,
          }}
        />
      </div>
    </div>
  );
}
