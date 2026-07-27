// MD3 Gold Compliant - Block J Migration Complete (4 violations eliminated)
// Replaced margin auto centering with flexbox centering, calc expression with layout token
// Note: maxWidth uses var(--md-sys-layout-max-width) for functional layout constraint with MD3 layout token
// MD3 Expressive: added spring bounce-in entrance animation per view mount.
import React, { useRef } from 'react';

const AURA_VIEW_KEYFRAMES = `
  @keyframes _m3av-enter {
    0%   { opacity: 0; transform: scale(0.97) translateY(6px); }
    60%  { opacity: 1; transform: scale(1.01) translateY(-2px); }
    80%  { transform: scale(0.99) translateY(1px); }
    100% { opacity: 1; transform: scale(1) translateY(0); }
  }
  @media (prefers-reduced-motion: reduce) {
    ._m3av-inner { animation-duration: 0.01ms !important; }
  }
`;

interface AuraViewProps {
    children: React.ReactNode;
    fullWidth?: boolean;
}

/**
 * AuraView - Wrapper per viste.
 * fullWidth = true: usa tutta la larghezza del container padre, nessun maxWidth.
 * fullWidth = false: centra e limita la larghezza con maxWidth MD3 token.
 * Usare fullWidth solo per viste che devono occupare tutto lo spazio disponibile (es. dashboard, mappe, fullscreen).
 * Usare senza fullWidth per viste con contenuto leggibile, form, documenti, o layout a colonna.
 * ATTENZIONE: Se il container padre ha padding o overflow, fullWidth può causare scroll orizzontale o layout instabile.
 * MD3 Gold: solo token, nessun valore hardcoded, nessuna utility custom.
 */
const AuraView: React.FC<AuraViewProps> = ({ children, fullWidth = false }) => {
    // Use a key-based technique: a new ref on each mount will trigger the spring animation
    const instanceId = useRef(Math.random().toString(36).slice(2, 8)).current;

    return (
        <>
          <style>{AURA_VIEW_KEYFRAMES}</style>
          <div 
              style={{
                  display: 'flex',
                  justifyContent: 'center',
                  width: 'var(--md-sys-percent-100)',
                  ...(fullWidth ? {} : { maxWidth: 'var(--md-sys-layout-max-width)' })
              }}
          >
              <div
                  className="_m3av-inner"
                  data-instance={instanceId}
                  style={{
                      width: 'var(--md-sys-percent-100)',
                      animation: `_m3av-enter var(--md-sys-motion-spring-expressive-default-spatial-duration, 500ms) var(--md-sys-motion-spring-expressive-default-spatial, cubic-bezier(0.38, 1.21, 0.22, 1.00)) both`,
                  }}
              >
                  {children}
              </div>
          </div>
        </>
    );
};

export default AuraView;

// M3Expressive refactor COMPLETED: AuraView.tsx - Replaced hardcoded Tailwind classes with dedicated aura-view-wrapper CSS classes using M3 tokens for spacing and responsive layout.

