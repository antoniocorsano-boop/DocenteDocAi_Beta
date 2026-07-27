# Contributing Guide - DocenteDoc AI

## Welcome! 👋

Grazie per voler contribuire a **DocenteDoc AI**. Questo documento spiega come contribuire in modo coerente con l'architettura del progetto.

---

## 1. UI Stack Policy

### 📌 Architectural Decision

DocenteDoc AI usa un design system consolidato per semplificare manutenzione e DX:

```
┌──────────────────────────────────────┐
│   Material Design 3 (PRIMARY)        │
│  - Custom component library          │
│  - CSS variables for tokens          │
│  - Tailwind for layout utilities     │
└──────────────────────────────────────┘
```

### ✅ ALLOWED - Usa questi

#### 1️⃣ **M3 Components** (`src/components/ui/M3*.tsx`)

Per TUTTI gli elementi UI semantici:

```tsx
// ✅ Button
<M3Button variant="filled" onClick={handler}>
  Salva
</M3Button>

// ✅ Card
<M3Card title="Lezione" description="Matematica">
  {content}
</M3Card>

// ✅ Dialog
<M3Dialog open={open} onClose={onClose}>
  <form>...</form>
</M3Dialog>

// ✅ Icon Button
<M3IconButton
  icon="edit"
  aria-label="Modifica"
  onClick={handler}
/>
```

**Tutti gli M3 componenti disponibili:**

- M3Button (filled, outlined, text, tonal, elevated)
- M3Card, M3ExpressiveCard
- M3Dialog, M3BottomAppBar
- M3Chip, M3ListItem
- M3IconButton, M3AnimatedIcon
- M3RatingBar, M3DatePicker
- M3TabGroup
- E altri... vedi `src/components/ui/index.ts`

#### 2️⃣ **Tailwind CSS** (layout, spacing, responsive)

Per struttura e layout:

```tsx
// ✅ Layout utilities
<div className="flex items-center gap-6 max-h-[400px] overflow-y-auto">
  {/* Flexbox: flex, items-center, gap-6 */}
  {/* Sizing: max-h-[400px] */}
  {/* Overflow: overflow-y-auto */}
</div>

// ✅ Responsive design
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  {/* Mobile: 1 column, Tablet: 2 cols, Desktop: 3 cols */}
</div>

// ✅ Spacing (uses M3 tokens)
<div className="p-6 m-4 gap-8 space-y-4">
  {/* All use M3 spacing scale */}
</div>

// ✅ M3 color aliases (mapped to MD3 tokens)
<span className="text-primary bg-surface-container p-4 rounded-lg">
  {/* text-primary = var(--md-sys-color-primary) */}
  {/* bg-surface-container = var(--md-sys-color-surface-container) */}
</span>
```

### ❌ FORBIDDEN - Non usare questi

```tsx
// ❌ MUI imports (blocco ESLint)
import { Button, Card, Dialog } from '@mui/material';
// → Use M3Button, M3Card, M3Dialog instead

// ❌ Emotion CSS-in-JS
import styled from '@emotion/styled';
const StyledDiv = styled.div`...`;
// → Use Tailwind classes or CSS modules

// ❌ Hardcoded colors
<div style={{ color: '#6750A4' }}>  // ❌ NON-SEMANTIC
<div className="text-blue-500">      // ❌ NOT IN M3 PALETTE

// ❌ Arbitrary Tailwind sizing
<div className="w-10 h-10">  // ❌ Non-standard 40px
<div className="p-5">         // ❌ Not in M3 scale (should be p-4 or p-6)

// ❌ Mixing M3 class styling with Tailwind overrides
<button className="m3-button-filled px-8">  // ❌ Conflicting systems

// ❌ Hardcoded pixel values
<div style={{ padding: '24px' }}>    // ❌ Non-semantic
```

---

## 1.1 Best Practices Material Design 3

### 🎨 Principi Fondamentali M3

**1. Usa sempre token semantici**

```tsx
// ✅ SEMANTIC: Token M3 per significato
<div className="bg-surface text-on-surface p-4 rounded-medium">
  {/* bg-surface = var(--sys-surface) */}
  {/* text-on-surface = var(--sys-on-surface) */}
  {/* p-4 = var(--md-sys-spacing-4) */}
  {/* rounded-medium = var(--md-sys-shape-corner-medium) */}
</div>

// ❌ ANTI-PATTERN: Valori hardcoded
<div style={{
  backgroundColor: '#FFFBFE',
  color: '#1C1B1F',
  padding: '16px',
  borderRadius: '12px'
}}>
```

**2. Componenti prima di stili custom**

```tsx
// ✅ COMPONENT-BASED: Estendi componenti esistenti
const CustomButton = ({ variant, ...props }) => (
  <M3Button variant={variant || "primary"} {...props} />
);

// ❌ STYLE-BASED: Duplica logica di styling
const customButtonStyles =
  "bg-primary text-on-primary px-6 py-3 rounded-medium";
```

**3. Accessibilità integrata**

```tsx
// ✅ ACCESSIBLE: ARIA labels e focus management
<M3Button
  aria-label="Elimina elemento"
  onClick={handleDelete}
>
  <DeleteIcon />
</M3Button>

// ❌ INACCESSIBLE: Icone senza contesto
<button onClick={handleDelete}>
  <DeleteIcon /> {/* Screen reader non sa cosa fa */}
</button>
```

### 🧪 Testing M3

**Test di regressione obbligatori:**

```bash
# Verifica token M3 applicati
npm test __tests__/m3-regression.test.ts

# Test accessibilità WCAG 2.1 AA
npm test __tests__/m3-accessibility.test.ts

# Snapshot test per componenti
npm run test:snapshots
```

**Pattern di test:**

```tsx
describe("M3ComponentName", () => {
  it("should use M3 tokens", () => {
    render(<M3Component />);
    // Verifica che usi var(--token-name)
  });

  it("should be accessible", () => {
    // Test axe-core o attributi ARIA
  });
});
```

### 📚 Documentazione

- Leggi `docs/M3_MIGRATION_GUIDE.md` per dettagli completi
- Usa Storybook per esempi di componenti M3
- Controlla `DESIGN_TOKEN_MAP_M3.md` per token disponibili

### 🚨 Errori Comuni da Evitare

1. **Non usare colori hardcoded** - Usa sempre alias M3
2. **Non mischiare sistemi** - Scegli M3 components o Tailwind, non entrambi
3. **Non saltare test** - Tutti i componenti devono passare test M3
4. **Non creare componenti duplicati** - Estendi quelli esistenti
5. **Non ignorare accessibilità** - Testa con screen reader

---

## 2. Component Decision Tree

### "Devo creare un componente, quale tool uso?"

```
START: What component do I need?
│
├─ Button / Card / Dialog / Chip / etc?
│  └─ → YES: Use M3Component (M3Button, M3Card, M3Dialog, M3Chip)
│
├─ Popover menu / Dropdown?
│  └─ → YES: Use M3Popover or M3Menu (coming soon)
│         → NO: Build custom with <div> + Tailwind positioning
│
├─ Form input (TextField, Select)?
│  └─ → YES: Use TextField or M3Select from src/components/ui/
│
├─ Layout (rows, columns, spacing)?
│  └─ → YES: Use Tailwind (flex, grid, gap, p, m, etc.)
│
├─ Responsive design (mobile, tablet, desktop)?
│  └─ → YES: Use Tailwind breakpoints (md:, lg:, xl:)
│
├─ Colors?
│  └─ → Use M3 semantic color aliases (text-primary, bg-surface, text-error)
│      → Mapped to var(--md-sys-color-*) CSS variables
│
└─ Advanced positioning or custom styling?
   └─ → If <2 uses: Use Tailwind classes
      → If ≥2 uses: Extract to new M3Component
```

---

## 3. Color Usage Guide

### ✅ CORRECT Ways

```tsx
// Way 1: Tailwind class (preferred for simplicity)
<div className="text-primary bg-surface p-6">
  {/* Primary text, surface background, spacing from M3 */}
</div>

// Way 2: CSS variable (when Tailwind not available)
<div style={{ color: 'var(--md-sys-color-primary)' }}>
  {/* Direct CSS variable, respects dark mode */}
</div>

// Way 3: Component prop (for M3 components)
<M3Button color="primary" variant="filled">
  Click
</M3Button>

// Way 4: M3 typography + color class
<h2 className="m3-headline-small text-on-surface">
  {/* M3 typography scale + semantic color */}
</h2>
```

### ❌ WRONG Ways

```tsx
// ❌ Hardcoded hex/RGB
<div style={{ color: '#6750A4' }}>     // Non-semantic, breaks dark mode
<div style={{ background: 'rgba(0,0,0,0.1)' }}>

// ❌ Tailwind default colors (not in M3)
<div className="text-blue-500">        // Wrong palette
<div className="bg-red-300">           // Not M3 compliant

// ❌ MUI semantic color (different token system)
<Button sx={{ color: 'primary' }} />   // MUI primary ≠ M3 primary

// ❌ Random hardcoded values
<div style={{ color: 'navy' }}>        // Not M3 token
```

### Available M3 Colors (Tailwind aliases)

```tsx
// Semantic colors (mapped to var(--md-sys-color-*))
text - primary; // Primary brand color
text - secondary; // Secondary brand color
text - tertiary; // Tertiary brand color
text - error; // Error/danger color
text - on - surface; // Main text color
text - on - surface - variant; // Secondary text
text - outline; // Borders, dividers

bg - surface; // Main background
bg - surface - container; // Card/raised background
bg - surface - container - high;
bg - surface - container - highest;
bg - primary - container; // Lightweight primary
bg - error - container; // Lightweight error

// With opacity
className = "bg-primary/20"; // 20% opacity (light highlight)
className = "text-on-surface/60"; // 60% opacity (secondary text)
```

### MD3 Token Namespaces & Alias Bridge (2026-01-06)

**What changed:** `src/theme.css` now bridges legacy `--sys-*` tokens to MD3 `--md-sys-*` so both resolve to the same values while we migrate.

- **Use MD3 tokens in new code:** `--md-sys-color-*`, `--md-corner-*`, `--md-sys-elevation-*`, motion/spacing tokens.
- **Do not add new `--sys-*` references:** legacy names remain only for backward compatibility and will be removed once usage reaches zero.
- **Color-mix / dynamic states:** always reference MD3 tokens to stay consistent across light/dark/contrast modes.
- **Verification before merge:**
  - grep your diff for `--sys-`
  - toggle `data-visual-style`, dark mode, and contrast to confirm alias propagation
  - run unit tests + `npm run build` when touching theme-critical areas

See the alias map in [src/theme.css](src/theme.css) for the authoritative list.

---

## 4. Spacing Usage Guide

### ✅ CORRECT M3 Spacing Scale

```tsx
// M3 spacing tokens (mapped to 8dp grid)
p-3  = 12px (var(--md-sys-spacing-3))
p-4  = 16px (var(--md-sys-spacing-4))
p-5  = 20px (var(--md-sys-spacing-5))
p-6  = 24px (var(--md-sys-spacing-6))
p-7  = 32px (var(--md-sys-spacing-7))
p-8  = 40px (var(--md-sys-spacing-8))

// Examples
<div className="p-6 gap-4 mb-6">
  {/* 24px padding, 16px gap, 24px margin-bottom */}
</div>

<div className="space-y-6">
  {/* 24px vertical spacing between children */}
</div>
```

### ❌ WRONG Non-Standard Spacing

```tsx
<div className="p-1">      // ❌ 4px (not in M3)
<div className="p-2">      // ❌ 8px (not in M3)
<div className="p-5">      // ⚠️ 20px (use p-4 or p-6 instead)
<div style={{ padding: '18px' }}>  // ❌ Hardcoded, non-standard
```

---

## 5. When to Create New M3 Components

### Criteria: Create a new M3 component if:

✅ **Pattern appears 2+ times** in codebase  
✅ **Complex UI logic** (state management, interactions)  
✅ **Semantic meaning** (not just layout wrapper)  
✅ **Design system integration** (uses M3 tokens)

### Example: M3Popover (coming soon)

```tsx
// Currently: Using MUI Popover (not ideal)
// Future: Use M3Popover instead

// File structure:
src/components/ui/
├── M3Popover.tsx              // Component
├── M3Popover.stories.tsx      // Storybook story
└── ../__tests__/M3Popover.test.tsx  // Tests

// Usage:
<M3Popover
  open={open}
  anchorEl={buttonRef}
  onClose={handleClose}
  title="Opzioni"
>
  <div className="space-y-2">
    <M3Button variant="text" onClick={handleEdit}>
      Modifica
    </M3Button>
    <M3Button variant="text" onClick={handleDelete} color="error">
      Elimina
    </M3Button>
  </div>
</M3Popover>
```

### Steps to create:

1. Create `src/components/ui/M3YourComponent.tsx`
2. Create `src/components/ui/M3YourComponent.stories.tsx`
3. Add unit tests: `__tests__/M3YourComponent.test.tsx`
4. Export from `src/components/ui/index.ts`
5. Document in this guide

---

## 6. Testing Guidelines

### Mocking M3 Components

```tsx
// ✅ CORRECT: Mock only what's used
vi.mock("./ui", () => ({
  M3Button: ({ children, onClick }) => (
    <button onClick={onClick}>{children}</button>
  ),
  M3Card: ({ children }) => <div>{children}</div>,
  ActionTile: ({ label }) => <button>{label}</button>,
}));

// ❌ WRONG: Mocking unused MUI
vi.mock("@mui/material", () => ({
  Popover: () => <div />, // ← Why? We don't use MUI
  Box: ({ children }) => <div>{children}</div>,
}));
```

### Testing Accessibility

```tsx
// ✅ Verify aria-labels on interactive elements
expect(screen.getByRole("button", { name: /modifica/i })).toBeInTheDocument();

// ✅ Verify semantic HTML
expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();

// ✅ Verify M3 tokens in styles
expect(element).toHaveStyle({ color: "var(--md-sys-color-primary)" });
```

---

## 7. ESLint Rules (Auto-Enforcement)

ESLint automatically enforces these rules. You'll see errors like:

```
✖ Restricted import path: "@mui/material"
  Use M3 components instead. See docs/COMPONENT_MAPPING.md

✖ Hardcoded color detected: "#6750A4"
  Use M3 semantic color tokens instead (e.g., text-primary)
```

### To fix violations:

```bash
# Run linter
npm run lint

# Auto-fix what can be fixed
npm run lint:fix

# Detailed report
npm run lint -- --format=json > lint-report.json
```

---

## 8. Code Review Checklist

When reviewing PRs, verify:

- [ ] No MUI imports (`@mui/material`, `@emotion/*`)
- [ ] All colors use M3 tokens (no `#RRGGBB` or hardcoded `rgba`)
- [ ] Spacing uses M3 scale (p-3, p-4, p-5, p-6, not p-1, p-2, p-7)
- [ ] Layout uses Tailwind (flex, grid, gap, etc.)
- [ ] Interactive elements have aria-labels
- [ ] M3 components used for UI (not plain `<button>`)
- [ ] Responsive design uses Tailwind breakpoints (md:, lg:)
- [ ] No CSS files added without reason
- [ ] Tests mock only components used

---

## 9. Common Patterns

### Form with Validation

```tsx
import { TextField, M3Button } from "./ui";

export const MyForm = () => {
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      setError("Nome richiesto");
      return;
    }
    // Handle submission
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* M3 TextField (not MUI) */}
      <TextField
        label="Nome"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={!!error}
        errorMessage={error}
        fullWidth
      />

      {/* M3 Button (not MUI) */}
      <M3Button variant="filled" type="submit" fullWidth>
        Salva
      </M3Button>
    </form>
  );
};
```

### Responsive Grid Layout

```tsx
export const CardGrid = ({ items }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Mobile: 1 col, Tablet: 2 cols, Desktop: 3 cols */}
      {/* Gap: 24px (M3 token p-6) */}
      {items.map((item) => (
        <M3Card key={item.id} title={item.title}>
          {item.content}
        </M3Card>
      ))}
    </div>
  );
};
```

### Modal/Dialog

```tsx
export const ConfirmDialog = ({ open, onClose, onConfirm, title, message }) => {
  return (
    <M3Dialog open={open} onClose={onClose}>
      <div className="space-y-6">
        <h2 className="m3-headline-small text-on-surface">{title}</h2>
        <p className="m3-body-medium text-on-surface-variant">{message}</p>

        <div className="flex gap-4 justify-end">
          <M3Button variant="text" onClick={onClose}>
            Annulla
          </M3Button>
          <M3Button variant="filled" onClick={onConfirm} color="error">
            Conferma
          </M3Button>
        </div>
      </div>
    </M3Dialog>
  );
};
```

---

## 10. Getting Help

### Documentation

- **Component Map:** See `docs/COMPONENT_MAPPING.md` for which tool to use
- **Design Tokens:** See `docs/DESIGN_TOKENS_M3.md` for available tokens
- **M3 System:** See `docs/DESIGN_SYSTEM_DOCUMENTATION_INDEX.md`

### Questions?

- Check existing components in `src/components/ui/` for patterns
- Review Storybook: `npm run storybook`
- Ask in code review or team discussion

---

## 11. Before You Submit a PR

Run this checklist:

```bash
# 1. Lint check (will fail if MUI/hardcoded colors found)
npm run lint

# 2. Auto-fix what can be fixed
npm run lint:fix

# 3. Run tests
npm test

# 4. Check bundle size
npm run build

# 5. Verify no console errors
npm run dev  # Test in browser

# 6. Self-review
# - No @mui/ or @emotion/ imports?
# - All colors M3 tokens?
# - All spacing M3 scale?
# - Tests passing?
```

Then submit PR with description of changes. Team will review design system compliance.

---

## 7. Aggiornamenti M3 2026 - Nuovi Token e Pattern

### 🆕 Token di Elevazione MD3

**Sostituiscono shadow-sm, shadow-md, etc. con valori semantici:**

```tsx
// ✅ MD3 Elevation tokens (raccomandati)
shadow-[var(--md-sys-elevation-level1)]    // 1dp - Cards, buttons
shadow-[var(--md-sys-elevation-level2)]    // 3dp - App bars, menus
shadow-[var(--md-sys-elevation-level3)]    // 6dp - Dialogs, bottom sheets
shadow-[var(--md-sys-elevation-level4)]    // 8dp - Nav drawers, modals
shadow-[var(--md-sys-elevation-level5)]    // 12dp - High emphasis

// ❌ Legacy Tailwind shadows (da evitare)
shadow-sm    // → usa shadow-[var(--md-sys-elevation-level1)]
shadow-md    // → usa shadow-[var(--md-sys-elevation-level2)]
shadow-lg    // → usa shadow-[var(--md-sys-elevation-level3)]
```

### 🆕 Token di Forma MD3

**Border radius semantici per componenti:**

```tsx
// ✅ MD3 Shape tokens
rounded-[var(--md-sys-shape-corner-extra-small)]    // 4px - Chips, small elements
rounded-[var(--md-sys-shape-corner-small)]          // 8px - Buttons, cards
rounded-[var(--md-sys-shape-corner-medium)]         // 12px - Dialogs, larger cards
rounded-[var(--md-sys-shape-corner-large)]          // 16px - Bottom sheets, surfaces
rounded-[var(--md-sys-shape-corner-extra-large)]    // 28px - FABs, special elements

// ❌ Hardcoded border-radius
rounded-sm    // → usa rounded-[var(--md-sys-shape-corner-extra-small)]
rounded      // → usa rounded-[var(--md-sys-shape-corner-small)]
rounded-lg   // → usa rounded-[var(--md-sys-shape-corner-large)]
```

### 🆕 Pattern di Stato Interattivi

**Hover e focus states semantici:**

```tsx
// ✅ Interactive state pattern
<button className="
  bg-surface text-on-surface p-4 rounded-large
  hover:bg-surface-container-highest
  focus-visible:ring-2 focus-visible:ring-primary/50
  active:scale-[0.98] transition-all
">
  Interactive Element
</button>

// ✅ Glass effect components
<div className="
  bg-surface/80 backdrop-blur-xl border border-white/10
  shadow-[var(--md-sys-elevation-level2)]
">
  Glass morphism effect
</div>
```

### 🆕 Token di Movimento MD3

**Animazioni e transizioni semantiche:**

```tsx
// ✅ MD3 Motion tokens
transition-all duration-[var(--md-sys-motion-duration-short1)]    // 50ms - Quick interactions
transition-all duration-[var(--md-sys-motion-duration-short2)]    // 100ms - Button presses
transition-all duration-[var(--md-sys-motion-duration-short3)]    // 150ms - Card reveals
transition-all duration-[var(--md-sys-motion-duration-short4)]    // 200ms - Page transitions

// ✅ Easing functions
transition-all ease-[var(--md-sys-motion-easing-standard)]       // Standard easing
transition-all ease-[var(--md-sys-motion-easing-emphasized)]     // Emphasized easing
```

### 🔄 Pattern di Migrazione Legacy

**Come aggiornare componenti esistenti:**

```tsx
// BEFORE (legacy)
<div className="bg-gray-100 border border-gray-200 shadow-sm rounded-lg p-4">
  Legacy component
</div>

// AFTER (MD3)
<div className="
  bg-[var(--md-sys-color-surface-container-high)]
  border border-[var(--md-sys-color-outline-variant)]
  shadow-[var(--md-sys-elevation-level1)]
  rounded-[var(--md-sys-shape-corner-large)]
  p-4
">
  MD3 component
</div>
```

### 📋 Checklist Migrazione Componenti

Prima di fare commit, verifica:

- [ ] **Colori:** Usa solo `var(--md-sys-color-*)` tokens
- [ ] **Elevazione:** Usa `shadow-[var(--md-sys-elevation-level*)]`
- [ ] **Forma:** Usa `rounded-[var(--md-sys-shape-corner-*)]`
- [ ] **Spaziatura:** Usa solo valori M3 scale (p-4, p-6, gap-4, etc.)
- [ ] **Test:** Componente ha test M3 e Storybook story
- [ ] **Accessibilità:** ARIA labels e focus management corretti

### 🛠️ Strumenti di Migrazione

```bash
# Verifica token M3 applicati
npm run validate:m3

# Audit componenti legacy
npm run md3:audit

# Genera report migrazione
npm run md3:check
```

---

**Last updated:** January 8, 2026  
**Status:** ACTIVE POLICY  
**Questions?** Ask in PR review or team discussion.
