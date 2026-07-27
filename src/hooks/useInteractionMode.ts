/**
 * useInteractionMode.ts — Rileva desktop vs mobile in modo reattivo.
 *
 * desktop → ≥ 1024px
 * mobile  → < 1024px
 *
 * Aggiorna al resize tramite ResizeObserver su documentElement.
 * Non usa matchMedia per evitare inconsistenze tra SSR e client.
 */

import { useEffect, useState } from 'react';

export type InteractionMode = 'mobile' | 'desktop';

const DESKTOP_BREAKPOINT = 1024;

function getCurrentMode(): InteractionMode {
  if (typeof window === 'undefined') return 'mobile';
  return window.innerWidth >= DESKTOP_BREAKPOINT ? 'desktop' : 'mobile';
}

export function useInteractionMode(): InteractionMode {
  const [mode, setMode] = useState<InteractionMode>(getCurrentMode);

  useEffect(() => {
    const handler = () => setMode(getCurrentMode());
    window.addEventListener('resize', handler, { passive: true });
    return () => window.removeEventListener('resize', handler);
  }, []);

  return mode;
}
