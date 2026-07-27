import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';
import './src/theme.css';

// Override the render function globally
vi.mock('@testing-library/react', async () => {
  const actual = await vi.importActual('@testing-library/react');
  const { render: rtlRender } = actual as { render: (ui: React.ReactElement, options?: Record<string, unknown>) => unknown };
  const { M3ThemeProvider } = await import('./src/theme/theme');
  const React = await import('react');

  const renderWithTheme = (ui: React.ReactElement, options?: Record<string, unknown>) => {
    const Wrapper = ({ children }: { children: React.ReactNode }) => (
      React.createElement(M3ThemeProvider, null, children)
    );
    return rtlRender(ui, { wrapper: Wrapper, ...options });
  };

  return {
    ...actual,
    render: renderWithTheme,
  };
});

// Setup root div for jsdom (skipped in @vitest-environment node tests)
if (typeof document !== 'undefined') {
  document.body.innerHTML = '<div id="root"></div>';
}

// Mock localStorage for vitest
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = String(value);
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true,
  });
}

// Some DOM methods used by the app (like scrollTo) are not implemented
// in the jsdom environment used by the tests. Provide no-op implementations
// so components that call them do not crash the tests.
if (typeof window !== 'undefined') {
  // window.scrollTo
  if (typeof window.scrollTo !== 'function') window.scrollTo = () => {};
  // HTMLElement.prototype.scrollTo
  if (typeof (window.HTMLElement as unknown as { prototype: { scrollTo?: unknown } }).prototype.scrollTo !== 'function') {
    (window.HTMLElement as unknown as { prototype: Record<string, unknown> }).prototype.scrollTo = function () {};
  }
  // window.matchMedia (required by NavigationRail, AppLayout, AssistantFab)
  if (typeof window.matchMedia !== 'function') {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }),
    });
  }
}

// Mock Google APIs
const globalWithGoogle = global as unknown as { google?: unknown; gapi?: unknown; fetch?: unknown };
globalWithGoogle.google = {
  accounts: {
    oauth2: {
      initTokenClient: vi.fn(() => ({
        requestAccessToken: vi.fn(),
      })),
      revoke: vi.fn((token: unknown, cb: () => void) => cb()),
    },
  },
};

globalWithGoogle.gapi = {
  load: vi.fn((api: unknown, config: unknown) => {
    const cfg = config as unknown as { callback?: () => void };
    if (cfg && cfg.callback) cfg.callback();
  }),
  client: {
    init: vi.fn(() => Promise.resolve()),
    gmail: {
      users: {
        messages: {
          list: vi.fn(),
          get: vi.fn(),
          send: vi.fn(),
        },
      },
    },
  },
};

// Mock fetch
globalWithGoogle.fetch = vi.fn();
