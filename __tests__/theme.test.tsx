import { renderHook } from '@testing-library/react';
import { test, expect } from 'vitest';
import { useM3Theme } from '../src/theme/theme';
import { M3ThemeProvider } from '../src/theme/theme';
import { buildMuiTheme } from '../src/theme/muiTheme';

// Test per verificare che useM3Theme() restituisca la struttura completa MD3
test('useM3Theme fornisce layers.sys e layers.ref', () => {
  // Wrapper obbligatorio per componenti che usano useM3Theme()
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <M3ThemeProvider>{children}</M3ThemeProvider>
  );

  const { result } = renderHook(() => useM3Theme(), { wrapper });

  // Verifica struttura obbligatoria MD3
  expect(result.current).toBeDefined();
  expect(result.current.layers).toBeDefined();
  expect(result.current.layers.sys).toBeDefined();
  expect(result.current.layers.sys.colors).toBeDefined(); // Es. primary, surface
  expect(result.current.layers.ref.typography).toBeDefined(); // Es. body-large
  expect(result.current.layers.ref).toBeDefined();
  expect(result.current.layers.ref.spacing).toBeDefined(); // Es. 4, 8
});

// Test aggiuntivo per token specifici (se necessario)
test('token MD3 sono accessibili', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <M3ThemeProvider>{children}</M3ThemeProvider>
  );

  const { result } = renderHook(() => useM3Theme(), { wrapper });

  // Esempio: verifica token critici
  const primaryColor = result.current.layers.sys.colors.primary;
  const spacing4 = result.current.layers.ref.spacing[4]; // Assumi array o oggetto

  // Accetta sia hex che token CSS custom property
  expect(
    /^#[0-9a-f]{6}$/.test(primaryColor) || primaryColor.startsWith('var(--md-sys-color-primary)')
  ).toBe(true);
  // spacing[4] è un token CSS var (es. 'var(--md-sys-spacing-4)') — verifica che sia definito e sia un token MD3
  expect(spacing4).toBeDefined();
  expect(String(spacing4)).toMatch(/^var\(--md-sys-spacing-/);
});

// ─── Phase 5: MD3 Guard — typography values must be parseable numbers, not CSS vars ───
test('muiTheme typography.body1.fontSize è un valore rem numerico valido (non CSS var)', () => {
  const theme = buildMuiTheme('light');
  const fontSize = theme.typography.body1.fontSize;

  // Must be defined as string or number (not undefined / CSS var)
  expect(fontSize).toBeDefined();
  expect(String(fontSize)).not.toMatch(/^var\(/);

  // Must parse to a positive number
  const parsed = parseFloat(String(fontSize));
  expect(parsed).toBeGreaterThan(0);
});

test('muiTheme typography.body2.fontSize è un valore rem numerico valido (non CSS var)', () => {
  const theme = buildMuiTheme('light');
  const fontSize = theme.typography.body2.fontSize;

  expect(fontSize).toBeDefined();
  expect(String(fontSize)).not.toMatch(/^var\(/);
  const parsed = parseFloat(String(fontSize));
  expect(parsed).toBeGreaterThan(0);
});

test('muiTheme nessun valore typography contiene var(--', () => {
  const theme = buildMuiTheme('light');
  const variants = ['h1','h2','h3','h4','h5','h6','subtitle1','subtitle2','body1','body2','caption','button','overline'] as const;
  for (const variant of variants) {
    const v = theme.typography[variant];
    if (v && typeof v === 'object') {
      if ('fontSize' in v) {
        expect(String(v.fontSize), `${variant}.fontSize contains CSS var`).not.toMatch(/^var\(/);
      }
      if ('fontWeight' in v) {
        expect(typeof v.fontWeight, `${variant}.fontWeight should be number`).toBe('number');
      }
    }
  }
});
