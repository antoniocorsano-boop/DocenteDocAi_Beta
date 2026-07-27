// MD3 Gold Compliant
// Input con validazione inline e feedback visivo
// Audit: febbraio 2026

import React, { useState } from 'react';
import Typography from '@mui/material/Typography';

interface ValidatedInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'email' | 'number' | 'password' | 'tel';
  required?: boolean;
  validation?: (value: string) => string | null; // Returns error message or null
  placeholder?: string;
  helperText?: string;
  maxLength?: number;
  showCharCount?: boolean;
  disabled?: boolean;
}

export const ValidatedInput: React.FC<ValidatedInputProps> = ({
  label,
  value,
  onChange,
  type = 'text',
  required = false,
  validation,
  placeholder,
  helperText,
  maxLength,
  showCharCount = false,
  disabled = false
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBlur = () => {
    setIsFocused(false);
    setTouched(true);
    
    if (validation && value) {
      const errorMsg = validation(value);
      setError(errorMsg);
    } else if (required && !value) {
      setError('Campo obbligatorio');
    } else {
      setError(null);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    
    // Respect maxLength
    if (maxLength && newValue.length > maxLength) {
      return;
    }
    
    onChange(newValue);
    
    // Clear error on typing if previously errored
    if (error && touched) {
      if (validation) {
        const errorMsg = validation(newValue);
        setError(errorMsg);
      } else if (required && newValue) {
        setError(null);
      }
    }
  };

  const hasError = touched && error !== null;
  const isSuccess = touched && !error && value.length > 0;

  return (
    <div style={{ marginBottom: 'var(--md-sys-spacing-4)' }}>
      {/* Label */}
      <label>
        <Typography
          variant="caption"
          sx={{
            color: hasError
              ? 'var(--md-sys-color-error)'
              : isFocused
                ? 'var(--md-sys-color-primary)'
                : 'var(--md-sys-color-on-surface-variant)',
            fontWeight: 'var(--md-sys-typescale-weight-semibold)',
            marginBottom: 'var(--md-sys-spacing-2)',
            display: 'block',
            transition: 'color var(--md-sys-motion-duration-short) var(--md-sys-motion-easing-standard)'
          }}
        >
          {label}
          {required && <span style={{ color: 'var(--md-sys-color-error)' }}> *</span>}
        </Typography>

        {/* Input container */}
        <div style={{ position: 'relative' }}>
          <input
            type={type}
            value={value}
            onChange={handleChange}
            onFocus={() => setIsFocused(true)}
            onBlur={handleBlur}
            placeholder={placeholder}
            disabled={disabled}
            style={{
              width: 'var(--md-sys-percent-100)',
              padding: 'var(--md-sys-spacing-3)',
              paddingRight: isSuccess || hasError ? 'var(--md-sys-spacing-9)' : 'var(--md-sys-spacing-3)',
              fontSize: 'var(--md-sys-typescale-body-large-font-size)',
              color: 'var(--md-sys-color-on-surface)',
              backgroundColor: disabled 
                ? 'var(--md-sys-color-surface-variant)' 
                : 'var(--md-sys-color-surface-container)',
              border: `var(--md-sys-border-width-medium) solid ${
                hasError 
                  ? 'var(--md-sys-color-error)' 
                  : isFocused 
                    ? 'var(--md-sys-color-primary)' 
                    : isSuccess
                      ? 'var(--md-sys-color-primary)'
                      : 'var(--md-sys-color-outline-variant)'
              }`,
              borderRadius: 'var(--md-sys-radius-2)',
              outline: 'none',
              transition: 'color var(--md-sys-motion-duration-short) var(--md-sys-motion-easing-standard), background-color var(--md-sys-motion-duration-short) var(--md-sys-motion-easing-standard), border-color var(--md-sys-motion-duration-short) var(--md-sys-motion-easing-standard)',
              cursor: disabled ? 'not-allowed' : 'text'
            }}
          />

          {/* Success/Error Icon */}
          {(isSuccess || hasError) && (
            <span
              className="material-symbols-outlined"
              style={{
                position: 'absolute',
                right: 'var(--md-sys-spacing-3)',
                top: 'var(--md-sys-percent-50)',
                transform: 'translateY(calc(var(--md-sys-percent-50) * -1))',
                fontSize: 'var(--md-sys-typescale-body-large-font-size)',
                color: hasError
                  ? 'var(--md-sys-color-error)'
                  : 'var(--md-sys-color-primary)',
                fontVariationSettings: '"FILL" 1, "wght" 600',
                pointerEvents: 'none'
              }}
            >
              {hasError ? 'error' : 'check_circle'}
            </span>
          )}
        </div>
      </label>

      {/* Helper text / Error message / Character count */}
      <div
        style={{
          marginTop: 'var(--md-sys-spacing-2)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <Typography
          variant="body2"
          sx={{
            color: hasError 
              ? 'var(--md-sys-color-error)' 
              : 'var(--md-sys-color-on-surface-variant)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--md-sys-spacing-1)'
          }}
        >
          {hasError && (
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: 'var(--md-sys-typescale-body-medium-font-size)',
                fontVariationSettings: '"FILL" 1, "wght" 600'
              }}
            >
              error
            </span>
          )}
          {hasError ? error : helperText}
        </Typography>

        {showCharCount && maxLength && (
          <Typography
            variant="body2"
            sx={{
              color: value.length >= maxLength 
                ? 'var(--md-sys-color-error)' 
                : 'var(--md-sys-color-on-surface-variant)',
              fontVariantNumeric: 'tabular-nums'
            }}
          >
            {value.length}/{maxLength}
          </Typography>
        )}
      </div>
    </div>
  );
};

export default ValidatedInput;
