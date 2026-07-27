 
/**
 * LIGHTWEIGHT: Safe DOM and Performance polyfills
 * Only add missing APIs, don't override existing ones
 */

// Safe performance polyfill
if (typeof window !== 'undefined' && !window.performance) {
  window.performance = {
    now: () => Date.now(),
    mark: () => {},
    measure: () => {},
    getEntriesByType: () => [],
    getEntriesByName: () => [],
  } as unknown as Performance;
}

// Safe requestAnimationFrame polyfill
if (typeof window !== 'undefined' && !window.requestAnimationFrame) {
  window.requestAnimationFrame = (cb: FrameRequestCallback) => setTimeout(cb, 16);
  window.cancelAnimationFrame = (id: number) => clearTimeout(id);
}

// Safe console methods
if (typeof window !== 'undefined' && !window.console) {
  window.console = {
    log: () => {},
    warn: () => {},
    error: () => {},
    info: () => {},
    debug: () => {},
  } as unknown as Console;
}

// Safe localStorage/sessionStorage
if (typeof window !== 'undefined') {
  if (!window.localStorage) {
    window.localStorage = {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
      length: 0,
    } as unknown as Storage;
  }

  if (!window.sessionStorage) {
    window.sessionStorage = {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
      length: 0,
    } as unknown as Storage;
  }
}

// Only set now() if it doesn't exist
if (typeof globalThis !== 'undefined' && globalThis.performance && typeof globalThis.performance.now !== 'function') {
  (globalThis.performance as unknown as { now: () => number }).now = () => Date.now();
}

export {};

