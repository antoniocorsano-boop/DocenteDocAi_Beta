# Theme Contract

## Allowed Behavior for theme.tsx

theme.tsx must:
- Import tokens from tokens.ts.
- Provide useTheme hook.
- Handle overrides via updateOverrides.
- Reset to base tokens.

## DO / DO NOT

| DO | DO NOT |
|----|--------|
| Merge overrides with base tokens | Modify tokens.ts directly |
| Expose spacing and other accessors | Include UI component logic |
| Support emotional preset overrides | Persist state externally |

## Rationale

theme.tsx manages state and overrides. Separation from tokens.ts ensures data purity and from components ensures reusability.