// MD3 Gold Compliant
// Skeleton loaders per feedback durante caricamento
// Audit: febbraio 2026

import React from 'react';

interface SkeletonProps {
  width?: string;
  height?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  animation?: 'pulse' | 'wave';
  style?: React.CSSProperties;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = 'var(--md-sys-percent-100)',
  height = 'var(--md-sys-spacing-4)',
  variant = 'rectangular',
  animation = 'pulse',
  style
}) => {
  const borderRadius = {
    text: 'var(--md-sys-spacing-1)',
    circular: 'var(--md-sys-percent-50)',
    rectangular: 'var(--md-sys-spacing-2)'
  }[variant];

  return (
    <>
      <div
        style={{
          width,
          height,
          borderRadius,
          background: 'var(--md-sys-color-surface-variant)',
          animation: animation === 'pulse' 
            ? 'skeleton-pulse 1.5s ease-in-out infinite' 
            : 'skeleton-wave 1.5s linear infinite',
          position: 'relative',
          overflow: 'hidden',
          ...style
        }}
        aria-hidden="true"
      >
        {animation === 'wave' && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(90deg, transparent, color-mix(in srgb, var(--md-sys-color-on-surface) 8%, transparent), transparent)',
              animation: 'skeleton-wave-move 1.5s linear infinite'
            }}
          />
        )}
      </div>
      
      <style>{`
        @keyframes skeleton-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 'var(--md-sys-state-opacity-placeholder)'; }
        }
        @keyframes skeleton-wave-move {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </>
  );
};

// Skeleton per lista di elementi
interface SkeletonListProps {
  count?: number;
  gap?: string;
}

export const SkeletonList: React.FC<SkeletonListProps> = ({ 
  count = 3,
  gap = 'var(--md-sys-spacing-3)'
}) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap }}>
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        style={{
          display: 'flex',
          gap: 'var(--md-sys-spacing-3)',
          padding: 'var(--md-sys-spacing-4)',
          borderRadius: 'var(--md-sys-spacing-2)',
          background: 'var(--md-sys-color-surface-container)'
        }}
      >
        <Skeleton 
          variant="circular" 
          width="var(--md-sys-spacing-6)" 
          height="var(--md-sys-spacing-6)" 
        />
        <div style={{ flex: 1 }}>
          <Skeleton 
            width="60%" 
            height="var(--md-sys-spacing-3)" 
            // eslint-disable-next-line no-restricted-syntax
            style={{ marginBottom: 'var(--md-sys-spacing-2)' }}
          />
          <Skeleton 
            width="40%" 
            height="var(--md-sys-spacing-2)" 
          />
        </div>
      </div>
    ))}
  </div>
);

export default Skeleton;
