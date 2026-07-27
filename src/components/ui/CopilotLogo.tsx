/**
 * CopilotLogo.tsx — CopilotDoc brand mark animato.
 *
 * Variants: 'mark' | 'horizontal' | 'badge'
 * States:   'idle' | 'thinking' | 'active' | 'alert'
 * Themes:   'light' | 'dark' | 'cobalt'
 *
 * La scintilla gold pulsa in idle; accelera in thinking; splende in active.
 * In 'alert' state: pulsazione rossa (violazione PA rilevata).
 * Zero dipendenze esterne — keyframes iniettati via <style> una volta sola.
 */

import React, { useEffect, useRef } from 'react';

// ─── Keyframe injection ───────────────────────────────────────────────────────

let _injectedCopilot = false;
function injectCopilotStyles(): void {
  if (_injectedCopilot || typeof document === 'undefined') return;
  _injectedCopilot = true;
  const s = document.createElement('style');
  s.textContent = `
    @keyframes copilot-spark-idle {
      0%,100% { opacity: 0.85; transform: scale(1)   rotate(0deg); }
      50%      { opacity: 1;    transform: scale(1.1) rotate(10deg); }
    }
    @keyframes copilot-spark-thinking {
      0%   { opacity: 0.7; transform: scale(0.95) rotate(0deg); }
      25%  { opacity: 1;   transform: scale(1.15) rotate(90deg); }
      50%  { opacity: 0.7; transform: scale(0.95) rotate(180deg); }
      75%  { opacity: 1;   transform: scale(1.15) rotate(270deg); }
      100% { opacity: 0.7; transform: scale(0.95) rotate(360deg); }
    }
    @keyframes copilot-spark-active {
      0%,100% { opacity: 1;   transform: scale(1); }
      50%      { opacity: 0.9; transform: scale(1.08); }
    }
    @keyframes copilot-spark-alert {
      0%,100% { opacity: 1;    transform: scale(1); }
      50%      { opacity: 0.75; transform: scale(1.04); }
    }
    @keyframes copilot-arc-pulse {
      0%,100% { stroke-opacity: 0.95; }
      50%      { stroke-opacity: 0.55; }
    }
    @keyframes copilot-dots {
      0%   { opacity: 0.2; transform: scale(0.8); }
      33%  { opacity: 1;   transform: scale(1.1); }
      66%  { opacity: 0.5; transform: scale(0.9); }
      100% { opacity: 0.2; transform: scale(0.8); }
    }
  `;
  document.head.appendChild(s);
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface CopilotLogoProps {
  /** Icon size in px (default 40) */
  size?:      number;
  variant?:   'mark' | 'horizontal' | 'badge';
  state?:     'idle' | 'thinking' | 'active' | 'alert';
  theme?:     'light' | 'dark' | 'cobalt';
  className?: string;
  'aria-label'?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CopilotLogo({
  size    = 40,
  variant = 'mark',
  state   = 'idle',
  theme   = 'cobalt',
  className,
  'aria-label': ariaLabel,
}: CopilotLogoProps): React.JSX.Element {
  const mountRef = useRef(false);
  useEffect(() => {
    if (!mountRef.current) { injectCopilotStyles(); mountRef.current = true; }
  }, []);

  const bgFill    = theme === 'dark'   ? '#0A1832'
                  : theme === 'cobalt' ? 'url(#cpbg-c)'
                  : 'white';
  const arcStroke = theme === 'light' ? '#1B3A8C' : 'white';
  const sparkBg   = state === 'alert' ? '#C7311A' : '#E8A900';

  const sparkAnim = state === 'thinking' ? `copilot-spark-thinking 1.4s linear infinite`
                  : state === 'active'   ? `copilot-spark-active 2s ease-in-out infinite`
                  : state === 'alert'    ? `copilot-spark-alert 1s ease-in-out infinite`
                  : `copilot-spark-idle 3.5s ease-in-out infinite`;

  const arcAnim = state === 'thinking'
    ? `copilot-arc-pulse 1.4s ease-in-out infinite`
    : 'none';

  const icon = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      width={size}
      height={size}
      fill="none"
      aria-hidden={ariaLabel ? undefined : true}
      aria-label={ariaLabel}
      role={ariaLabel ? 'img' : undefined}
    >
      <defs>
        <linearGradient id="cpbg-c" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#1E4299"/>
          <stop offset="100%" stopColor="#0E2560"/>
        </linearGradient>
        <radialGradient id="cpgold-c" cx="50%" cy="35%" r="60%">
          <stop offset="0%"   stopColor={state === 'alert' ? '#FF6B6B' : '#FFE066'}/>
          <stop offset="55%"  stopColor={state === 'alert' ? '#C7311A' : '#E8A900'}/>
          <stop offset="100%" stopColor={state === 'alert' ? '#8C1A0A' : '#B07800'}/>
        </radialGradient>
        <filter id="cp-glow-c">
          <feGaussianBlur stdDeviation="12" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      <rect width="512" height="512" rx="108" fill={bgFill}
        stroke={theme === 'light' ? '#E2E8F0' : 'none'} strokeWidth="2"/>

      {/* Document texture lines */}
      {[186, 210, 234, 302, 326].map((y, i) => (
        <line key={y} x1="128" y1={y} x2="384" y2={y}
          stroke="white" strokeOpacity={i < 3 ? 0.07 : 0.04} strokeWidth="1.5"/>
      ))}

      {/* Arc C */}
      <path d="M 358 140 A 138 138 0 1 0 358 372"
        stroke={arcStroke} strokeWidth="28" strokeLinecap="round" fill="none"
        strokeOpacity={0.95}
        style={{ animation: arcAnim }}/>
      <path d="M 340 168 A 104 104 0 1 0 340 344"
        stroke={arcStroke} strokeWidth="4" strokeLinecap="round" fill="none"
        strokeOpacity={0.2}/>

      {/* Gold terminals */}
      <line x1="358" y1="140" x2="392" y2="140"
        stroke={sparkBg} strokeWidth="9" strokeLinecap="round"/>
      <line x1="358" y1="372" x2="392" y2="372"
        stroke={sparkBg} strokeWidth="9" strokeLinecap="round"/>

      {/* AI spark */}
      <g filter="url(#cp-glow-c)" transform="translate(256,256)"
        style={{ animation: sparkAnim, transformOrigin: '0 0' }}>
        <circle r="38" fill={sparkBg} fillOpacity="0.18"/>
        <circle r="24" fill={sparkBg} fillOpacity="0.28"/>
        <circle r="14" fill="url(#cpgold-c)"/>
        <path d="M0,-40 L5,-16 L0,-8 L-5,-16 Z"  fill="#FFE066" fillOpacity="0.9"/>
        <path d="M0,40  L5,16  L0,8  L-5,16  Z"   fill="#FFE066" fillOpacity="0.9"/>
        <path d="M-40,0 L-16,5 L-8,0 L-16,-5 Z"  fill="#FFE066" fillOpacity="0.9"/>
        <path d="M40,0  L16,5  L8,0  L16,-5  Z"   fill="#FFE066" fillOpacity="0.9"/>
        <circle r="5" fill="white" fillOpacity="0.9"/>
      </g>

      {/* Thinking dots */}
      {state === 'thinking' && [0, 1, 2].map(i => (
        <circle key={i} cx={230 + i * 26} cy={430} r="8"
          fill={sparkBg}
          style={{
            animation: `copilot-dots 1.4s ease-in-out ${i * 0.25}s infinite`,
            transformOrigin: `${230 + i * 26}px 430px`,
          }}/>
      ))}
    </svg>
  );

  const labelColor  = theme === 'light' ? '#1B3A8C' : '#E8F0FF';
  const subColor    = theme === 'light' ? '#4B5675' : '#8899BB';
  const accentColor = state === 'alert' ? '#C7311A' : '#E8A900';
  // subColor is used in badge variant only
  void subColor;

  if (variant === 'mark') {
    return (
      <span className={className} style={{ display: 'inline-flex' }}>
        {icon}
      </span>
    );
  }

  if (variant === 'badge') {
    return (
      <span className={className} style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: size * 0.2,
        background: theme === 'light' ? '#EEF2FF' : '#0E2560',
        borderRadius: size * 0.3,
        padding: `${size * 0.12}px ${size * 0.25}px ${size * 0.12}px ${size * 0.12}px`,
        border: `1px solid ${theme === 'light' ? '#CBD5E1' : '#1B3A8C'}`,
      }}>
        {icon}
        <span style={{
          fontFamily: "'DM Sans', system-ui, sans-serif",
          fontWeight: 600,
          fontSize: size * 0.35,
          color: labelColor,
          letterSpacing: '0.03em',
        }}>
          CopilotDoc
        </span>
      </span>
    );
  }

  // variant === 'horizontal'
  return (
    <span className={className} style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: size * 0.3,
      userSelect: 'none',
    }}>
      {icon}
      <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
        <span style={{
          fontFamily: "'Lora', Georgia, serif",
          fontWeight: 700,
          fontSize: size * 0.48,
          color: labelColor,
          letterSpacing: '0.02em',
        }}>
          CopilotDoc
        </span>
        <span style={{
          fontFamily: "'DM Sans', system-ui, sans-serif",
          fontWeight: 500,
          fontSize: size * 0.22,
          color: accentColor,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
        }}>
          {state === 'alert' ? '⚠ Allerta PA' : 'Assistente AI · PA'}
        </span>
      </span>
    </span>
  );
}
