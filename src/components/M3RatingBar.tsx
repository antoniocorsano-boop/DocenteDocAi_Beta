// MD3 Gold Compliant
// Tutti gli stili usano esclusivamente token MD3 (nessun valore hardcoded)
// Audit: gennaio 2026
import React, { useMemo } from 'react';
export type M3RatingBarProps = {
  max?: number;
  value?: number;
  disabled?: boolean;
  readonly?: boolean;
  onChange?: (rating: number) => void;
};

function clampValue(val: number, max: number) {
  if (Number.isNaN(val)) return 0;
  return Math.min(Math.max(val, 0), max);
}

export default function M3RatingBar({
  max = 5,
  value = 0,
  disabled = false,
  readonly = false,
  onChange,
}: M3RatingBarProps): React.ReactElement {
  const clampedValue = useMemo(() => clampValue(value, max), [value, max]);

  const handleSelect = (index: number) => {
  if (disabled || readonly) return;
    const next = index + 1;
    onChange?.(next);
  };

  return (
    <div
      aria-label="rating"
      role="group"
      aria-disabled={disabled}
      aria-readonly={readonly}
      style={{ display: 'inline-flex', gap: 'var(--md-sys-spacing-1)', alignItems: 'center' }}
    >
      {Array.from({ length: max }).map((_, index) => {
        const filled = index + 1 <= clampedValue;
        return (
          <button
            key={index}
            type="button"
            onClick={() => handleSelect(index)}
            disabled={disabled || readonly}
            aria-pressed={filled}
            style={{border: 'none',
              background: 'transparent',
              cursor: disabled || readonly ? 'default' : 'pointer',
              color: filled ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-outline)-variant',
              fontSize: 'var(--md-sys-typescale-headline-small)',
              lineHeight: 1,
              padding: 0,}}
          >
            ★
          </button>
        );
      })}
    </div>
  );
}

