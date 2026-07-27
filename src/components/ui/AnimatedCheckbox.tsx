// MD3 Gold Compliant
// Checkbox con animazione check
// Audit: febbraio 2026

import React, { useState } from 'react';
import Typography from '@mui/material/Typography';

interface AnimatedCheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  helperText?: string;
}

export const AnimatedCheckbox: React.FC<AnimatedCheckboxProps> = ({
  label,
  checked,
  onChange,
  disabled = false,
  helperText
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 'var(--md-sys-spacing-3)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        padding: 'var(--md-sys-spacing-2)',
        borderRadius: 'var(--md-sys-spacing-2)',
        transition: 'background-color var(--md-sys-motion-duration-short4)',
        ...(isFocused && !disabled && {
          backgroundColor: 'var(--md-sys-color-surface-container)'
        })
      }}
    >
      {/* Custom Checkbox */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => !disabled && onChange(e.target.checked)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          disabled={disabled}
          style={{
            position: 'absolute',
            opacity: 0,
            width: 0,
            height: 0
          }}
        />
        
        <div
          style={{
            width: 'var(--md-sys-spacing-5)',
            height: 'var(--md-sys-spacing-5)',
            borderRadius: 'var(--md-sys-spacing-1)',
            border: `var(--md-sys-border-width-medium) solid ${
              checked 
                ? 'var(--md-sys-color-primary)' 
                : 'var(--md-sys-color-outline)'
            }`,
            backgroundColor: checked 
              ? 'var(--md-sys-color-primary)' 
              : 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all var(--md-sys-motion-duration-short4) var(--md-sys-motion-easing-standard)',
            ...(isFocused && {
              outline: 'var(--md-sys-border-width-normal) solid var(--md-sys-color-primary)',
              outlineOffset: 'var(--md-sys-spacing-0-5)'
            })
          }}
        >
          {checked && (
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              style={{
                animation: 'check-in var(--md-sys-motion-duration-short4) var(--md-sys-motion-easing-standard)'
              }}
            >
              <path
                d="M13 4L6 11L3 8"
                stroke="var(--md-sys-color-on-primary)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  strokeDasharray: 20,
                  strokeDashoffset: checked ? 0 : 20,
                  transition: 'stroke-dashoffset var(--md-sys-motion-duration-short4) var(--md-sys-motion-easing-standard) var(--md-sys-motion-duration-micro)'
                }}
              />
            </svg>
          )}
        </div>
      </div>

      {/* Label & Helper */}
      <div style={{ flex: 1 }}>
        <Typography
          variant="body2"
          sx={{
            color: 'var(--md-sys-color-on-surface)',
            fontWeight: 'var(--md-sys-typescale-weight-medium)',
            marginBottom: helperText ? 'var(--md-sys-spacing-1)' : 0
          }}
        >
          {label}
        </Typography>
        
        {helperText && (
          <Typography
            variant="body2"
            sx={{
              color: 'var(--md-sys-color-on-surface-variant)'
            }}
          >
            {helperText}
          </Typography>
        )}
      </div>

      <style>{`
        @keyframes check-in {
          from {
            transform: scale(0.8);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </label>
  );
};

export default AnimatedCheckbox;
