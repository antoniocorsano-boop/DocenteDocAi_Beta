# Tokens Contract

## Allowed Structure for tokens.ts

tokens.ts must export:
- System tokens as CSS custom properties.
- Hierarchical object structure.
- No hardcoded values.

Example:
```typescript
export const tokens = {
  colors: {
    primary: 'var(--md-sys-color-primary)',
    // ...
  },
  spacing: {
    '4': 'var(--md-sys-spacing-4)',
    // ...
  },
  // Motion, shape, elevation
};
```

## DO / DO NOT

| DO | DO NOT |
|----|--------|
| Export token objects only | Include component logic |
| Use CSS custom properties | Hardcode measurements |
| Validate token completeness | Mix with theme logic |

## Rationale

tokens.ts is a pure data export. Mixing logic violates separation of concerns and complicates testing.