# UI Components Contract

## MUST and MUST NOT for Components

Components MUST:
- Use M3Typography for text.
- Apply styles via inline style with tokens.
- Include ARIA labels.
- Use M3Button, M3Card, etc.

Components MUST NOT:
- Use className.
- Hardcode styles.
- Bypass theme system.
- Include theme logic.

## DO / DO NOT

| DO | DO NOT |
|----|--------|
| Import from theme for spacing | Define local styles |
| Wrap with M3ThemeProvider in tests | Use non-M3 components |
| Maintain focus indicators | Hardcode colors or spacing |

## Rationale

Components are consumers of the theme system. Embedding theme logic breaks encapsulation and MD3 principles.