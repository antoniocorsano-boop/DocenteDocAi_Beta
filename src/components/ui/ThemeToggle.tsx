// MD3 Gold Compliant
// Theme toggle button con icon animation
// Audit: febbraio 2026

import React, { useState } from 'react';
import { useSettingsStore } from '../../stores/useSettingsStore';
import type { AppThemeState } from '../../types';
import { Tooltip } from './index';

interface ThemeToggleProps {
  variant?: 'icon' | 'button' | 'menu';
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  variant = 'icon',
  showLabel = false
}) => {
  const themeMode = useSettingsStore(s => s.themeState.mode);
  const setThemeState = useSettingsStore(s => s.actions.setThemeState);
  const [isAnimating, setIsAnimating] = useState(false);

  // Normalise: Zustand uses 'system', ThemeContext used 'auto' — map internally
  const mode = themeMode === 'system' ? 'auto' : themeMode;
  const setMode = (m: 'auto' | 'light' | 'dark') =>
    setThemeState((prev: AppThemeState) => ({ ...prev, mode: m === 'auto' ? 'system' : m }));

  const systemDark = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-color-scheme: dark)').matches
    : false;
  const effectiveTheme: 'light' | 'dark' = mode === 'auto' ? (systemDark ? 'dark' : 'light') : mode;
  const isSystemTheme = mode === 'auto';

  const handleToggle = () => {
    setIsAnimating(true);
    
    // Cycle through: auto → light → dark → auto
    if (mode === 'auto') {
      setMode('light');
    } else if (mode === 'light') {
      setMode('dark');
    } else {
      setMode('auto');
    }

    setTimeout(() => setIsAnimating(false), 400);
  };

  // Icon based on current effective theme
  const icon = effectiveTheme === 'dark' ? 'dark_mode' : 'light_mode';
  
  // Label based on mode
  const label = mode === 'auto' 
    ? 'Tema automatico' 
    : mode === 'light' 
      ? 'Tema chiaro' 
      : 'Tema scuro';

  // Tooltip text
  const tooltipText = mode === 'auto'
    ? `Tema automatico (${effectiveTheme === 'dark' ? 'Scuro' : 'Chiaro'})`
    : mode === 'light'
      ? 'Passa a tema scuro'
      : 'Passa a tema automatico';

  if (variant === 'icon') {
    return (
      <Tooltip content={tooltipText}>
        <button
          onClick={handleToggle}
          aria-label={label}
          style={{
            position: 'relative',
            width: 'var(--md-sys-spacing-10)',
            height: 'var(--md-sys-spacing-10)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
            borderRadius: 'var(--md-sys-shape-corner-full)',
            backgroundColor: 'transparent',
            color: 'var(--md-sys-color-on-surface)',
            cursor: 'pointer',
            transition: 'background-color var(--md-sys-motion-duration-short4)',
            overflow: 'hidden'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--md-sys-color-surface-variant)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          {/* Icon with rotation animation */}
          <span
            className="material-symbols-outlined"
            style={{
              fontSize: 'var(--md-sys-typescale-headline-small-font-size)',
              fontVariationSettings: isSystemTheme 
                ? '"FILL" 0, "wght" 400' 
                : '"FILL" 1, "wght" 600',
              transform: isAnimating ? 'rotate(360deg)' : 'rotate(0deg)',
              transition: 'transform var(--md-sys-motion-duration-long) var(--md-sys-motion-easing-standard)'
            }}
          >
            {icon}
          </span>

          {/* System indicator dot */}
          {isSystemTheme && (
            <div
              style={{
                position: 'absolute',
                bottom: 'var(--md-sys-spacing-1)',
                right: 'var(--md-sys-spacing-1)',
                width: 'var(--md-sys-spacing-1)',
                height: 'var(--md-sys-spacing-1)',
                borderRadius: 'var(--md-sys-shape-corner-full)',
                backgroundColor: 'var(--md-sys-color-primary)',
                boxShadow: '0 0 var(--md-sys-spacing-1) var(--md-sys-color-primary)'
              }}
            />
          )}
        </button>
      </Tooltip>
    );
  }

  if (variant === 'button') {
    return (
      <button
        onClick={handleToggle}
        aria-label={label}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--md-sys-spacing-2)',
          padding: 'var(--md-sys-spacing-2) var(--md-sys-spacing-4)',
          border: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline)',
          borderRadius: 'var(--md-sys-spacing-5)',
          backgroundColor: 'var(--md-sys-color-surface-container)',
          color: 'var(--md-sys-color-on-surface)',
          fontSize: 'var(--md-sys-typescale-label-medium-font-size)',
          fontWeight: 'var(--md-sys-typescale-weight-medium)',
          cursor: 'pointer',
          transition: 'all var(--md-sys-motion-duration-short4)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--md-sys-color-surface-container-high)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--md-sys-color-surface-container)';
        }}
      >
        <span
          className="material-symbols-outlined"
          style={{
            fontSize: 'var(--md-sys-typescale-title-small-font-size)',
            fontVariationSettings: isSystemTheme 
              ? '"FILL" 0, "wght" 400' 
              : '"FILL" 1, "wght" 600',
            transform: isAnimating ? 'rotate(360deg)' : 'rotate(0deg)',
            transition: 'transform var(--md-sys-motion-duration-long) var(--md-sys-motion-easing-standard)'
          }}
        >
          {icon}
        </span>
        {showLabel && <span>{label}</span>}
      </button>
    );
  }

  // variant === 'menu'
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--md-sys-spacing-1)'
      }}
    >
      {/* Menu items for each theme option */}
      {(['auto', 'light', 'dark'] as const).map((themeMode) => (
        <button
          key={themeMode}
          onClick={() => setMode(themeMode)}
          aria-pressed={mode === themeMode}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--md-sys-spacing-3)',
            padding: 'var(--md-sys-spacing-3) var(--md-sys-spacing-4)',
            border: 'none',
            borderRadius: 'var(--md-sys-spacing-2)',
            backgroundColor: mode === themeMode 
              ? 'var(--md-sys-color-primary-container)' 
              : 'transparent',
            color: mode === themeMode
              ? 'var(--md-sys-color-on-primary-container)'
              : 'var(--md-sys-color-on-surface)',
            fontSize: 'var(--md-sys-typescale-label-medium-font-size)',
            fontWeight: mode === themeMode ? 'var(--md-sys-typescale-weight-semibold)' : 'var(--md-sys-typescale-weight-regular)',
            cursor: 'pointer',
            textAlign: 'left',
            width: 'var(--md-sys-percent-100)',
            transition: 'all var(--md-sys-motion-duration-short4)'
          }}
          onMouseEnter={(e) => {
            if (mode !== themeMode) {
              e.currentTarget.style.backgroundColor = 'var(--md-sys-color-surface-variant)';
            }
          }}
          onMouseLeave={(e) => {
            if (mode !== themeMode) {
              e.currentTarget.style.backgroundColor = 'transparent';
            }
          }}
        >
          {/* Icon */}
          <span
            className="material-symbols-outlined"
            style={{
              fontSize: 'var(--md-sys-typescale-title-small-font-size)',
              fontVariationSettings: mode === themeMode 
                ? '"FILL" 1, "wght" 600' 
                : '"FILL" 0, "wght" 400'
            }}
          >
            {themeMode === 'auto' ? 'brightness_auto' : themeMode === 'light' ? 'light_mode' : 'dark_mode'}
          </span>

          {/* Label */}
          <span style={{ flex: 1 }}>
            {themeMode === 'auto' ? 'Automatico' : themeMode === 'light' ? 'Chiaro' : 'Scuro'}
          </span>

          {/* Checkmark */}
          {mode === themeMode && (
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: 'var(--md-sys-typescale-body-large-font-size)',
                fontVariationSettings: '"FILL" 1, "wght" 600'
              }}
            >
              check
            </span>
          )}
        </button>
      ))}
    </div>
  );
};

export default ThemeToggle;
