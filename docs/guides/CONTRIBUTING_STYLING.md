# DocenteDoc AI - Styling Methodology Guide

> **Context**: This document defines the canonical styling approach for DocenteDoc AI following the complete MUI→M3 migration (Phase 3, January 2026). It resolves the "styling methodology conflict" identified in the UI Uniformity Audit (P3 High Priority).

---

## 📋 Table of Contents
- [Overview](#overview)
- [Core Principles](#core-principles)
- [When to Use What](#when-to-use-what)
- [Design Token Reference](#design-token-reference)
- [Component Patterns](#component-patterns)
- [Migration Examples](#migration-examples)
- [Anti-Patterns](#anti-patterns)

---

## Overview

DocenteDoc AI uses a **dual-stack styling approach**:

1. **M3 Design System** → Visual design (color, elevation, interaction states, shape)
2. **Tailwind CSS** → Layout utilities (flex, grid, spacing)

This separation ensures:
- ✅ **Consistency**: All visual elements follow M3 Material Design 3 guidelines
- ✅ **Maintainability**: Design tokens provide single source of truth
- ✅ **Performance**: No runtime styling overhead (pure CSS)
- ✅ **Developer Experience**: Tailwind utilities for rapid layout prototyping

---

## Core Principles

### 1. M3 Components First
For interactive elements (buttons, inputs, cards, modals), always use M3 components from `src/design-system/`:
- `M3Button`
- `M3Card`
- `M3TextField`
- `M3Chip`
- `M3Modal`

**Why**: These components include accessibility features, interaction states, and design tokens out-of-the-box.

### 2. Tailwind for Layout Only
Use Tailwind classes exclusively for:
- Flexbox/Grid: `flex`, `grid`, `items-center`, `justify-between`
- Spacing: `gap-4`, `px-6`, `py-3` (maps to `--md-sys-spacing-*`)
- Responsive breakpoints: `md:flex-row`, `lg:grid-cols-3`

**Why**: Tailwind excels at layout but lacks M3's visual design language.

### 3. CSS Modules for Complex Styles
For component-specific styles not covered by M3/Tailwind:
```css
/* MyComponent.module.css */
.container {
  background: var(--md-sys-color-surface-container);
  border-radius: var(--md-sys-shape-corner-medium);
  transition: var(--md-sys-motion-duration-short2) var(--md-sys-motion-easing-standard);
}
```

**Why**: Scoped styles prevent global namespace pollution.

### 4. Design Tokens Always
Never hardcode values. Use tokens from `src/theme.css`:
```css
/* ❌ WRONG */
background: #f5f5f5;
padding: 16px;
border-radius: 8px;

/* ✅ CORRECT */
background: var(--md-sys-color-surface);
padding: var(--md-sys-spacing-4);
border-radius: var(--md-sys-shape-corner-medium);
```

**Why**: Tokens enable theming, accessibility (dark mode), and consistency.

---

## When to Use What

| Scenario | Solution | Example |
|----------|----------|---------|
| **Button** | `M3Button` | `<M3Button variant="filled">Submit</M3Button>` |
| **Card** | `M3Card` + Tailwind layout | `<M3Card className="flex gap-4">...</M3Card>` |
| **Modal** | `M3Modal` | `<M3Modal open={isOpen}>...</M3Modal>` |
| **Form Input** | `M3TextField` | `<M3TextField label="Name" />` |
| **Layout Container** | Tailwind utilities | `<div className="flex flex-col gap-6">` |
| **Custom Component** | CSS Module + Tokens | `import styles from './MyComponent.module.css'` |
| **Hover State** | `.m3-interactive-*` | `<button className="m3-interactive-button">` |
| **Spacing** | `--md-sys-spacing-*` | `padding: var(--md-sys-spacing-6)` |
| **Color** | `--md-sys-color-*` | `color: var(--md-sys-color-on-surface)` |

---

## Design Token Reference

### Spacing Scale
```css
--md-sys-spacing-0: 0px;       /* No spacing */
--md-sys-spacing-1: 4px;       /* Tiny gap (chip padding, icon offset) */
--md-sys-spacing-2: 8px;       /* Small gap (button padding-x, list items) */
--md-sys-spacing-3: 12px;      /* Medium gap (card padding, form fields) */
--md-sys-spacing-4: 16px;      /* Base gap (section spacing, modal padding) */
--md-sys-spacing-5: 20px;      /* Large gap (card groups, dashboard sections) */
--md-sys-spacing-6: 24px;      /* XL gap (page margins, hero sections) */
--md-sys-spacing-8: 32px;      /* 2XL gap (major sections) */
--md-sys-spacing-10: 40px;     /* 3XL gap (page headers) */
--md-sys-spacing-12: 48px;     /* 4XL gap (landing pages) */
--md-sys-spacing-16: 64px;     /* Maximum gap (full-page layouts) */
```

### Color Tokens (Dark Mode Compatible)
```css
/* Surface Colors */
--md-sys-color-surface: #fef7ff;
--md-sys-color-surface-container: #f3edf7;
--md-sys-color-surface-container-high: #ede7f1;

/* Primary Colors */
--md-sys-color-primary: #6750a4;
--md-sys-color-on-primary: #ffffff;

/* Error Colors */
--md-sys-color-error: #ba1a1a;
--md-sys-color-on-error: #ffffff;
```

### Shape Tokens
```css
--md-sys-shape-corner-none: 0px;
--md-sys-shape-corner-small: 8px;    /* Buttons, chips */
--md-sys-shape-corner-medium: 12px;  /* Cards, inputs */
--md-sys-shape-corner-large: 16px;   /* Modals, sheets */
--md-sys-shape-corner-full: 9999px;  /* Pills, FABs */
```

### Elevation
```css
--md-sys-elevation-0: 0 0 0 0 rgba(0,0,0,0);               /* Flat */
--md-sys-elevation-1: 0 1px 2px rgba(0,0,0,0.3);           /* Raised (cards) */
--md-sys-elevation-2: 0 1px 2px rgba(0,0,0,0.3), 
                       0 2px 6px rgba(0,0,0,0.15);         /* Floating (menus) */
--md-sys-elevation-3: 0 4px 8px rgba(0,0,0,0.3), 
                       0 6px 20px rgba(0,0,0,0.15);        /* Modals */
```

---

## Component Patterns

### Pattern 1: M3 Component + Tailwind Layout
**Best for**: Interactive elements in complex layouts

```tsx
// ✅ CORRECT: EventActionPopover.tsx
<M3Card className="flex flex-col gap-3 p-4">
  <div className="flex items-center justify-between">
    <h3 className="text-lg font-medium">Actions</h3>
    <M3IconButton 
      onClick={onClose}
      className="m3-interactive-close"
    >
      <Close />
    </M3IconButton>
  </div>
  
  <div className="flex flex-col gap-2">
    <M3Button 
      variant="filled" 
      className="m3-interactive-button"
      onClick={handleEdit}
    >
      Edit Event
    </M3Button>
    <M3Button 
      variant="outlined"
      className="m3-interactive-button"
      onClick={handleDelete}
    >
      Delete
    </M3Button>
  </div>
</M3Card>
```

**Key Points**:
- ✅ `M3Card` handles surface color, elevation, border-radius
- ✅ Tailwind classes (`flex`, `gap-3`) handle layout
- ✅ `.m3-interactive-*` classes handle hover/focus states
- ✅ No inline styles needed

---

### Pattern 2: CSS Module for Custom Styling
**Best for**: Domain-specific components with unique visual requirements

```tsx
// StudentCard.tsx
import styles from './StudentCard.module.css';

export function StudentCard({ student }: Props) {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <img src={student.avatar} alt="" className={styles.avatar} />
        <h4 className={styles.name}>{student.name}</h4>
      </div>
      
      <div className="flex flex-col gap-2">
        {/* Content using Tailwind for layout */}
      </div>
    </div>
  );
}
```

```css
/* StudentCard.module.css */
.card {
  background: var(--md-sys-color-surface-container);
  border-radius: var(--md-sys-shape-corner-medium);
  padding: var(--md-sys-spacing-4);
  box-shadow: var(--md-sys-elevation-1);
  transition: box-shadow var(--md-sys-motion-duration-short2) var(--md-sys-motion-easing-standard);
}

.card:hover {
  box-shadow: var(--md-sys-elevation-2);
}

.header {
  display: flex;
  align-items: center;
  gap: var(--md-sys-spacing-3);
  margin-bottom: var(--md-sys-spacing-4);
  padding-bottom: var(--md-sys-spacing-3);
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
}

.avatar {
  width: 48px;
  height: 48px;
  border-radius: var(--md-sys-shape-corner-full);
  object-fit: cover;
}

.name {
  font-size: var(--md-sys-typescale-title-medium-size);
  font-weight: var(--md-sys-typescale-title-medium-weight);
  color: var(--md-sys-color-on-surface);
}
```

**Key Points**:
- ✅ CSS Module for component-specific styles
- ✅ All values use design tokens
- ✅ Tailwind still used for simple layout (flex, gap)
- ✅ No runtime overhead

---

### Pattern 3: Interaction States with CSS Classes
**Best for**: Buttons, menu items, clickable cards

```tsx
// QuickNotePopover.tsx
<M3IconButton 
  onClick={onClose}
  className="m3-interactive-close"
  aria-label="Close"
>
  <Close />
</M3IconButton>

<M3Button 
  variant="filled"
  className="m3-interactive-button-primary"
  onClick={handleSave}
>
  Save Note
</M3Button>
```

**Available Classes** (from `src/design-system/m3-interactive.css`):
- `.m3-interactive-button` (default surface variant)
- `.m3-interactive-button-primary` (primary color)
- `.m3-interactive-button-error` (error color)
- `.m3-interactive-close` (small close buttons)
- `.m3-interactive-card` (clickable cards)
- `.m3-interactive-chip` (chips)
- `.m3-interactive-menu-item` (menu items)

**Why This Approach**:
- ✅ No manual `onMouseEnter`/`onMouseLeave` handlers
- ✅ Accessibility-friendly (keyboard focus, high-contrast mode)
- ✅ Touch-optimized (hover disabled on mobile)
- ✅ Consistent timing across all interactions

---

## Migration Examples

### Before: Manual Hover Handlers ❌
```tsx
const [hovered, setHovered] = useState(false);

<button
  onMouseEnter={() => setHovered(true)}
  onMouseLeave={() => setHovered(false)}
  style={{
    background: hovered ? '#e8def8' : 'transparent',
    borderRadius: '8px',
    padding: '8px 16px',
    transition: 'background 200ms',
  }}
>
  Click Me
</button>
```

**Issues**:
- 🚫 Manual state management
- 🚫 Hardcoded values (colors, spacing, timing)
- 🚫 No keyboard focus support
- 🚫 No reduced-motion support

---

### After: CSS Classes ✅
```tsx
<M3Button 
  variant="filled"
  className="m3-interactive-button"
>
  Click Me
</M3Button>
```

**Benefits**:
- ✅ Zero JavaScript overhead
- ✅ Design tokens for all values
- ✅ Full keyboard/screen reader support
- ✅ Respects `prefers-reduced-motion`

---

### Before: Inline Styles ❌
```tsx
<div
  style={{
    display: 'flex',
    gap: '16px',
    padding: '24px',
    background: '#f3edf7',
    borderRadius: '12px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
  }}
>
  {/* content */}
</div>
```

---

### After: Tailwind + Tokens ✅
```tsx
<M3Card className="flex gap-4 p-6">
  {/* content */}
</M3Card>
```

OR if `M3Card` doesn't fit:
```tsx
<div className="flex gap-4 p-6" style={{
  background: 'var(--md-sys-color-surface-container)',
  borderRadius: 'var(--md-sys-shape-corner-medium)',
  boxShadow: 'var(--md-sys-elevation-1)',
}}>
  {/* content */}
</div>
```

---

## Anti-Patterns

### 🚫 Don't: Hardcode Values
```tsx
// ❌ WRONG
style={{ padding: '16px', color: '#6750a4' }}

// ✅ CORRECT
style={{ 
  padding: 'var(--md-sys-spacing-4)', 
  color: 'var(--md-sys-color-primary)' 
}}
```

---

### 🚫 Don't: Use Tailwind for Colors/Shadows
```tsx
// ❌ WRONG
<div className="bg-purple-100 shadow-md">

// ✅ CORRECT
<M3Card>
  {/* M3Card provides surface color + elevation */}
</M3Card>
```

---

### 🚫 Don't: Mix Competing Systems
```tsx
// ❌ WRONG: M3 component + inline styles overriding M3 tokens
<M3Button style={{ background: '#6750a4', padding: '12px' }}>

// ✅ CORRECT: Use M3 variants
<M3Button variant="filled">
```

---

### 🚫 Don't: Manual Hover States for Standard Elements
```tsx
// ❌ WRONG
const [hovered, setHovered] = useState(false);
<button 
  onMouseEnter={() => setHovered(true)}
  style={{ background: hovered ? '#e8def8' : 'transparent' }}
>

// ✅ CORRECT
<M3Button className="m3-interactive-button">
```

---

## Checklist for Code Reviews

Before submitting a PR with UI changes, verify:

- [ ] **M3 Components Used**: All buttons/cards/inputs use `M3Button`, `M3Card`, `M3TextField`, etc.
- [ ] **No Hardcoded Values**: All spacing uses `--md-sys-spacing-*`, all colors use `--md-sys-color-*`
- [ ] **Tailwind Scope**: Only used for layout (`flex`, `grid`, `gap`, responsive classes)
- [ ] **Interaction States**: No manual hover handlers; `.m3-interactive-*` classes applied
- [ ] **Accessibility**: Focus states visible, ARIA labels present, keyboard navigation works
- [ ] **Dark Mode**: All colors use tokens (not hardcoded hex values)
- [ ] **No Legacy Tokens**: No `--spacing-*` (use `--md-sys-spacing-*` instead)

---

## Resources

- **Design Tokens**: [src/theme.css](./src/theme.css)
- **M3 Components**: [src/design-system/](./src/design-system/)
- **Interaction States**: [src/design-system/m3-interactive.css](./src/design-system/m3-interactive.css)
- **UI Uniformity Audit**: [UI_UNIFORMITY_AUDIT_POST_M3_MIGRATION.md](./UI_UNIFORMITY_AUDIT_POST_M3_MIGRATION.md)
- **Material Design 3**: https://m3.material.io/

---

## Questions?

If you're unsure which approach to use, ask yourself:

1. **Is this an interactive element?** → Use `M3Button`/`M3Card`/`M3Modal`
2. **Is this just layout?** → Use Tailwind (`flex`, `grid`, `gap`)
3. **Is this custom styling?** → Use CSS Module with tokens
4. **Do I need a hover effect?** → Use `.m3-interactive-*` classes

When in doubt, search the codebase for similar components and follow the established pattern.

---

**Last Updated**: January 6, 2026 (Post-Migration P3)  
**Maintained By**: DocenteDoc AI Core Team
