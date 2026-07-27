# Theme Manager Contract

## Responsibilities

The theme manager must:
- Provide base MD3 tokens.
- Handle layered overrides for emotional presets.
- Support runtime theme switching.
- Expose useTheme hook for component access.
- Maintain token validation.

## Interface

```typescript
interface ThemeManager {
  updateOverrides(overrides: ThemeOverrides): void;
  resetOverrides(): void;
  spacing: Record<string, string>;
  // Additional token accessors
}
```

## DO / DO NOT

| DO | DO NOT |
|----|--------|
| Apply overrides atomically | Persist overrides across sessions |
| Reset to base on preset change | Expose internal token logic |
| Validate override structure | Allow arbitrary CSS injection |

## Rationale

The contract ensures predictable behavior and prevents theme corruption. Overrides must be reversible and validated.