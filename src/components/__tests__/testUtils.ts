import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { vi } from 'vitest';

/**
 * Mock store creator for testing
 * Simplifies setting up store mocks with default values
 */
export function createMockStores(overrides: Record<string, any> = {}) {
  return {
    settingsStore: {
      settings: {
        nomeInsegnante: 'Mario',
        cognomeInsegnante: 'Rossi',
        ...overrides['settingsStore']?.settings,
      },
      ...overrides['settingsStore'],
    },
    systemStore: {
      activeSuggestion: null,
      dismissedSuggestions: new Set(),
      suggestions: [],
      ...overrides['systemStore'],
    },
    academicStore: {
      lessons: {
        lesson1: {
          id: 'lesson1',
          classe: '3A',
          materia: 'Matematica',
          tipoLezione: 'Lezione in classe',
          obiettivi: 'Imparare le derivate',
          contenuto: 'Calcolo differenziale',
        },
      },
      ...overrides['academicStore'],
    },
    studentStore: {
      students: [
        { id: '1', nome: 'Luca', cognome: 'Bianchi', classe: '3A' },
        { id: '2', nome: 'Anna', cognome: 'Verdi', classe: '3A' },
      ],
      ...overrides['studentStore'],
    },
  };
}

/**
 * Custom render function with mock stores pre-configured
 */
export function renderWithStores(
  ui: ReactElement,
  {
    stores = {} as Record<string, any>,
    ...renderOptions
  }: RenderOptions & { stores?: Record<string, any> } = {}
) {
  const mockStores = createMockStores(stores);

  // Import and mock stores would be done here in actual implementation
  // This is a template for how to use it

  return render(ui, renderOptions);
}

/**
 * Creates mock navigation functions for testing
 */
export function createMockNavigationFunctions() {
  return {
    mockNavigate: vi.fn(),
    mockDismissSuggestion: vi.fn(),
    mockOnOpenRegisterImport: vi.fn(),
  };
}

/**
 * Test data factory for creating suggestions
 */
export function createMockSuggestion(overrides: Record<string, any> = {}) {
  return {
    id: 'suggestion-1',
    message: 'Test suggestion',
    targetView: 'home',
    actionLabel: 'Action',
    action: { type: 'navigate', payload: 'home' },
    ...overrides,
  };
}

/**
 * Test data factory for creating lessons
 */
export function createMockLesson(overrides: Record<string, any> = {}) {
  return {
    id: 'lesson-1',
    classe: '3A',
    materia: 'Matematica',
    tipoLezione: 'Lezione in classe',
    obiettivi: 'Test objectives',
    contenuto: 'Test content',
    ...overrides,
  };
}

/**
 * Test data factory for creating students
 */
export function createMockStudent(overrides: Record<string, any> = {}) {
  return {
    id: 'student-1',
    nome: 'Test',
    cognome: 'Student',
    classe: '3A',
    ...overrides,
  };
}

/**
 * Helper to wait for async operations in tests
 */
export async function waitForAsync() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * Helper to get computed style from element
 */
export function getComputedTokens(element: HTMLElement) {
  const style = window.getComputedStyle(element);
  return {
    spacing: style.gap || style.padding || style.margin,
    color: style.color || style.backgroundColor,
    borderRadius: style.borderRadius,
  };
}

/**
 * Verify MD3 token usage in elements
 */
export function verifyMD3Tokens(container: HTMLElement) {
  const spacingTokens = container.querySelectorAll('[style*="var(--md-sys-spacing"]');
  const colorTokens = container.querySelectorAll('[style*="var(--md-sys-color"]');
  const cornerTokens = container.querySelectorAll('[style*="var(--md-corner"]');

  return {
    spacingTokens: spacingTokens.length,
    colorTokens: colorTokens.length,
    cornerTokens: cornerTokens.length,
    total: spacingTokens.length + colorTokens.length + cornerTokens.length,
  };
}

/**
 * Create test snapshot with MD3 compliance info
 */
export function createMD3ComplianceSnapshot(container: HTMLElement) {
  const tokens = verifyMD3Tokens(container);
  const m3Elements = container.querySelectorAll('[class*="m3-"]');

  return {
    md3Tokens: tokens,
    m3Elements: m3Elements.length,
    compliant: tokens.total > 0 && m3Elements.length > 0,
  };
}

