import { logger } from '../utils/logger';
// Sound design for NKA: play M3-compliant sound cues for nodes/actions
export const playNkaSound = (type: 'node' | 'action' | 'badge'): void => {
  try {
    if (typeof window === 'undefined' || !window.AudioContext) return;
    const audioContextCtor = (window as typeof window & { webkitAudioContext?: typeof AudioContext }).AudioContext
      || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!audioContextCtor) return;
    const ctx = new audioContextCtor();
    if (!ctx) return;
    
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    
    switch (type) {
      case 'node':
        o.frequency.value = 440;
        break;
      case 'action':
        o.frequency.value = 660;
        break;
      case 'badge':
        o.frequency.value = 880;
        break;
    }
    
    g.gain.value = 0.08;
    o.connect(g);
    g.connect(ctx.destination);
    o.start(ctx.currentTime);
    o.stop(ctx.currentTime + 0.18);
    
    // Clean up on end
    setTimeout(() => {
      try {
        ctx.close();
      } catch (err) {
        logger.warn('[NKA] Audio context close error:', err);
      }
    }, 200);
  } catch (err) {
    logger.warn('[NKA] Sound initialization error:', err);
  }
};

