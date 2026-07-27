# MD3 Component Templates & Best Practices

This directory contains templates and guidelines for creating Material Design 3 compliant components.

## 🚀 Quick Start

### Creating a New MD3 Component

1. **Copy the template:**
   ```bash
   cp templates/M3Component.tsx src/components/ui/YourComponent.tsx
   cp templates/M3Component.stories.tsx src/components/ui/YourComponent.stories.tsx
   ```

2. **Replace placeholders:**
   - `[ComponentName]` → Your actual component name
   - Update props interface
   - Customize styling and behavior

3. **Add to exports:**
   ```typescript
   // src/components/ui/index.ts
   export { default as YourComponent } from './YourComponent';
   ```

## 🎨 MD3 Design Principles

### 1. Design Tokens First
Always use MD3 design tokens instead of hardcoded values:

```typescript
// ✅ Good - Uses MD3 tokens
style={{
  backgroundColor: 'var(--md-sys-color-primary-container)',
  padding: 'var(--md-sys-spacing-4)',
  borderRadius: 'var(--md-sys-shape-corner-large)',
  boxShadow: 'var(--md-sys-elevation-level1)'
}}

// ❌ Bad - Hardcoded values
style={{
  backgroundColor: '#6750A4',
  padding: '16px',
  borderRadius: '16px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.12)'
}}
```

### 2. Typography with M3Typography
Use `M3Typography` component for all text content:

```typescript
// ✅ Good
<M3Typography variant="title-large" style={{ color: 'var(--md-sys-color-on-surface)' }}>
  Component Title
</M3Typography>

// ❌ Bad
<h2 style={{ color: '#1C1B1F', fontSize: '22px' }}>
  Component Title
</h2>
```

### 3. Variant-based Styling
Implement variants using MD3 color roles:

```typescript
const getVariantColors = () => {
  switch (variant) {
    case 'primary':
      return {
        background: 'var(--md-sys-color-primary-container)',
        onBackground: 'var(--md-sys-color-on-primary-container)'
      };
    // ... other variants
  }
};
```

### 4. Interactive States
Implement proper hover, focus, and active states:

```typescript
onMouseEnter={(e) => {
  e.currentTarget.style.boxShadow = 'var(--md-sys-elevation-level2)';
  e.currentTarget.style.transform = 'translateY(-2px)';
}}
onFocus={(e) => {
  e.currentTarget.style.outline = `2px solid var(--md-sys-color-primary)`;
}}
```

## 🔍 MD3 Compliance Audit

### Running Audits

```bash
# Full audit report
node md3-audit.js audit ./src/components

# CI/CD compliance check
node md3-audit.js check ./src/components 70
```

### Pre-commit Hooks
The pre-commit hook automatically checks MD3 compliance before commits.

### GitHub Actions
PRs automatically run MD3 audits and comment with results.

## 📋 Component Checklist

Before submitting a new component, ensure:

- [ ] Uses MD3 design tokens for all styling
- [ ] Implements proper variants (primary, secondary, surface)
- [ ] Uses M3Typography for text content
- [ ] Has proper interactive states (hover, focus, active)
- [ ] Includes accessibility features (ARIA labels, keyboard navigation)
- [ ] Has Storybook stories for all variants
- [ ] Passes MD3 compliance audit (70%+ score)
- [ ] Follows TypeScript best practices
- [ ] Includes JSDoc comments

## 🎯 MD3 Token Reference

### Colors
- `--md-sys-color-primary`
- `--md-sys-color-primary-container`
- `--md-sys-color-on-primary`
- `--md-sys-color-on-primary-container`
- `--md-sys-color-secondary`
- `--md-sys-color-secondary-container`
- `--md-sys-color-on-secondary`
- `--md-sys-color-on-secondary-container`
- `--md-sys-color-surface`
- `--md-sys-color-surface-container`
- `--md-sys-color-on-surface`
- `--md-sys-color-on-surface-variant`

### Spacing
- `--md-sys-spacing-1` through `--md-sys-spacing-12`

### Shapes
- `--md-sys-shape-corner-none`
- `--md-sys-shape-corner-extra-small`
- `--md-sys-shape-corner-small`
- `--md-sys-shape-corner-medium`
- `--md-sys-shape-corner-large`
- `--md-sys-shape-corner-extra-large`
- `--md-sys-shape-corner-full`

### Elevation
- `--md-sys-elevation-level0` through `--md-sys-elevation-level5`

### Typography
- `--md-sys-typescale-display-large-*`
- `--md-sys-typescale-headline-*`
- `--md-sys-typescale-title-*`
- `--md-sys-typescale-body-*`
- `--md-sys-typescale-label-*`

## 🛠️ Development Tools

### VS Code Extensions
- **MD3 Design Token Intellisense** - Autocomplete for MD3 tokens
- **Material Theme** - MD3 color scheme

### Browser DevTools
- Use CSS custom properties inspector
- Check contrast ratios with accessibility tools

### Storybook
- All components should have comprehensive stories
- Test all variants and interaction states

## 📚 Additional Resources

- [Material Design 3 Guidelines](https://m3.material.io)
- [MD3 Token Documentation](./design-system/)
- [Component Library](./src/components/ui/)
- [Audit Reports](./audit/)