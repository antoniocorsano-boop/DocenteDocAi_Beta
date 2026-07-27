/**
 * OrbitLogo.tsx — Animated Orbit brand mark.
 *
 * Variants: 'mark' (icon only) | 'horizontal' (icon + wordmark) | 'stacked'
 * States:   'idle' | 'thinking' | 'active'
 *
 * Ring 1 ruota in senso orario; Ring 2 in senso antiorario.
 * I satelliti viaggiano con il loro ring (gruppo SVG).
 * Zero dipendenze esterne — keyframes iniettati via <style> una volta sola.
 */

import React, { useEffect, useRef } from 'react';

// ─── Keyframe injection ───────────────────────────────────────────────────────

let _injected = false;
function injectStyles(): void {
  if (_injected || typeof document === 'undefined') return;
  _injected = true;
  const s = document.createElement('style');
  s.textContent = `
    @keyframes orbit-ring-1 {
      from { transform: rotate(-18deg); }
      to   { transform: rotate(342deg); }
    }
    @keyframes orbit-ring-2 {
      from { transform: rotate(52deg); }
      to   { transform: rotate(-308deg); }
    }
    @keyframes orbit-breathe {
      0%,100% { opacity: 1;   transform: scale(1); }
      50%      { opacity: 0.85; transform: scale(1.06); }
    }
    @keyframes orbit-load-bar {
      from { width: 0%; }
      to   { width: 100%; }
    }
  `;
  document.head.appendChild(s);
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface OrbitLogoProps {
  /** Icon size in px (default 40) */
  size?:      number;
  variant?:   'mark' | 'horizontal' | 'stacked';
  state?:     'idle' | 'thinking' | 'active';
  className?: string;
  'aria-label'?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function OrbitLogo({
  size    = 40,
  variant = 'mark',
  state   = 'idle',
  className,
  'aria-label': ariaLabel,
}: OrbitLogoProps): React.JSX.Element {
  const mountRef = useRef(false);
  useEffect(() => {
    if (!mountRef.current) { injectStyles(); mountRef.current = true; }
  }, []);

  const speed       = state === 'thinking' ? 0.4 : state === 'active' ? 0.65 : 1;
  const ring1Dur    = `${20 * speed}s`;
  const ring2Dur    = `${15 * speed}s`;
  const breathDur   = `${4  * speed}s`;

  const cyanOpacity    = state === 'active' ? '1'    : '0.88';
  const violetOpacity  = state === 'active' ? '0.85' : '0.65';
  const ambientOpacity = state === 'thinking' ? '0.55' : '0.38';

  const cx = 256, cy = 256;

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
        <radialGradient id="ol-bg" cx="50%" cy="50%" r="70%">
          <stop offset="0%"   stopColor="#141C2E"/>
          <stop offset="100%" stopColor="#070B14"/>
        </radialGradient>
        <radialGradient id="ol-core" cx="38%" cy="32%" r="65%">
          <stop offset="0%"   stopColor="#FFDF80"/>
          <stop offset="32%"  stopColor="#FF9520"/>
          <stop offset="68%"  stopColor="#F03A10"/>
          <stop offset="100%" stopColor="#C01A08"/>
        </radialGradient>
        <radialGradient id="ol-ambient" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#FF8C00" stopOpacity={ambientOpacity}/>
          <stop offset="100%" stopColor="#FF8C00" stopOpacity="0"/>
        </radialGradient>
        <filter id="ol-glow">
          <feGaussianBlur stdDeviation="3.5" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="ol-core-glow">
          <feGaussianBlur stdDeviation="18" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      <rect width="512" height="512" rx="110" fill="url(#ol-bg)"/>
      <circle cx={cx} cy={cy} r="138" fill="url(#ol-ambient)"
        style={{
          animation: `orbit-breathe ${breathDur} ease-in-out infinite`,
          transformOrigin: `${cx}px ${cy}px`,
        }}/>

      {/* Ring 1 — clockwise with mint + cyan satellites */}
      <g style={{
        animation: `orbit-ring-1 ${ring1Dur} linear infinite`,
        transformOrigin: `${cx}px ${cy}px`,
      }}>
        <ellipse cx={cx} cy={cy} rx="172" ry="60"
          stroke="#00C8FF" strokeWidth="2.5" strokeOpacity={cyanOpacity}
          style={{ filter: 'drop-shadow(0 0 5px #00C8FF88)' }}/>
        <circle cx="405" cy="286" r="11" fill="#00FFB0"
          style={{ filter: 'drop-shadow(0 0 6px #00FFB0)' }}/>
        <circle cx="405" cy="286" r="20" fill="#00FFB0" fillOpacity="0.15"/>
        <circle cx="90"  cy="241" r="8"  fill="#00C8FF"
          style={{ filter: 'drop-shadow(0 0 5px #00C8FF)' }}/>
        <circle cx="90"  cy="241" r="15" fill="#00C8FF" fillOpacity="0.15"/>
      </g>

      {/* Ring 2 — counter-clockwise with violet satellite */}
      <g style={{
        animation: `orbit-ring-2 ${ring2Dur} linear infinite`,
        transformOrigin: `${cx}px ${cy}px`,
      }}>
        <ellipse cx={cx} cy={cy} rx="108" ry="36"
          stroke="#8B6FFF" strokeWidth="2" strokeOpacity={violetOpacity}
          style={{ filter: 'drop-shadow(0 0 4px #8B6FFF88)' }}/>
        <circle cx="293" cy="290" r="6"  fill="#B09FFF"
          style={{ filter: 'drop-shadow(0 0 5px #B09FFF)' }}/>
        <circle cx="293" cy="290" r="12" fill="#B09FFF" fillOpacity="0.18"/>
      </g>

      {/* Core orb — above rings */}
      <circle cx={cx} cy={cy} r="60" fill="url(#ol-core)" filter="url(#ol-core-glow)"
        style={{
          animation: `orbit-breathe ${breathDur} ease-in-out infinite`,
          transformOrigin: `${cx}px ${cy}px`,
        }}/>
      <ellipse cx="241" cy="237" rx="19" ry="12" fill="white" fillOpacity="0.20"
        transform="rotate(-20 241 237)"/>
      <circle cx="248" cy="243" r="4.5" fill="white" fillOpacity="0.32"/>
    </svg>
  );

  if (variant === 'mark') {
    return (
      <span className={className} style={{ display: 'inline-flex' }}>
        {icon}
      </span>
    );
  }

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: size * 0.3,
        fontFamily: "'Barlow Condensed', system-ui, sans-serif",
        userSelect: 'none',
      }}
    >
      {icon}
      {variant === 'horizontal' && (
        <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
          <span style={{
            fontSize: size * 0.55,
            fontWeight: 700,
            letterSpacing: '0.16em',
            color: '#E8F0FF',
            textTransform: 'uppercase',
          }}>
            ORBIT
          </span>
          <span style={{
            fontSize: size * 0.22,
            fontWeight: 400,
            letterSpacing: '0.08em',
            color: '#00C8FF',
            textTransform: 'uppercase',
          }}>
            by DocenteDoc AI
          </span>
        </span>
      )}
      {variant === 'stacked' && (
        <span style={{
          fontSize: size * 0.45,
          fontWeight: 700,
          letterSpacing: '0.18em',
          color: '#E8F0FF',
          textTransform: 'uppercase',
        }}>
          ORBIT
        </span>
      )}
    </span>
  );
}
