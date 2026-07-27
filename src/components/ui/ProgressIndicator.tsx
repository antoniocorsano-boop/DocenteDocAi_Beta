// MD3 Gold Compliant
// Progress indicator lineare globale
// Audit: febbraio 2026

import React from 'react';

interface ProgressIndicatorProps {
  isLoading: boolean;
  color?: 'primary' | 'secondary' | 'tertiary';
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  isLoading,
  color = 'primary'
}) => {
  if (!isLoading) return null;

  const colorMap = {
    primary: 'var(--md-sys-color-primary)',
    secondary: 'var(--md-sys-color-secondary)',
    tertiary: 'var(--md-sys-color-tertiary)'
  };

  return (
    <>
      <div
        role="progressbar"
        aria-label="Caricamento in corso"
        aria-valuemin={0}
        aria-valuemax={100}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: 'var(--md-sys-spacing-0_5)',
          backgroundColor: 'var(--md-sys-color-surface-variant)',
          zIndex: 'var(--md-sys-z-snackbar)',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            height: 'var(--md-sys-percent-100)',
            width: 'var(--md-sys-percent-30)',
            backgroundColor: colorMap[color],
            animation: 'progress-indeterminate 2s var(--md-sys-motion-easing-standard) infinite',
            transformOrigin: 'left center'
          }}
        />
      </div>

      <style>{`
        @keyframes progress-indeterminate {
          0% {
            transform: translateX(-100%) scaleX(1);
          }
          50% {
            transform: translateX(0%) scaleX(1);
          }
          75% {
            transform: translateX(100%) scaleX(2);
          }
          100% {
            transform: translateX(300%) scaleX(1);
          }
        }
      `}</style>
    </>
  );
};

export default ProgressIndicator;
