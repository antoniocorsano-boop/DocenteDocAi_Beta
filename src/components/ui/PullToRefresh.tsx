// MD3 Gold Compliant
// Pull to refresh per liste mobile
// Audit: febbraio 2026

import React, { useState, useRef } from 'react';
import { logger } from '../../utils/logger';

interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  threshold?: number;
  disabled?: boolean;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  children,
  onRefresh,
  threshold = 80,
  disabled = false
}) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [status, setStatus] = useState<'idle' | 'pulling' | 'ready' | 'refreshing'>('idle');
  const startY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled || isRefreshing) return;
    
    const container = containerRef.current;
    if (container && container.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (disabled || isRefreshing) return;
    
    const container = containerRef.current;
    if (!container || container.scrollTop > 0) return;

    const currentY = e.touches[0].clientY;
    const distance = currentY - startY.current;

    if (distance > 0) {
      // Add resistance to pull
      const adjustedDistance = Math.min(distance * 0.5, threshold * 1.5);
      setPullDistance(adjustedDistance);

      if (adjustedDistance >= threshold) {
        setStatus('ready');
      } else {
        setStatus('pulling');
      }

      // Prevent default scroll only when pulling
      e.preventDefault();
    }
  };

  const handleTouchEnd = async () => {
    if (disabled || isRefreshing) return;

    if (status === 'ready') {
      setStatus('refreshing');
      setIsRefreshing(true);
      setPullDistance(threshold);

      try {
        await onRefresh();
      } catch (error) {
        logger.error('Refresh error:', error);
      } finally {
        setIsRefreshing(false);
        setStatus('idle');
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
      setStatus('idle');
    }
  };

  const rotation = Math.min((pullDistance / threshold) * 360, 360);
  const spinnerScale = Math.min(pullDistance / threshold, 1);

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        position: 'relative',
        height: 'var(--md-sys-percent-100)',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch'
      }}
    >
      {/* Pull indicator */}
      <div
        style={{
          position: 'absolute',
          top: 'var(--md-sys-spacing-0)',
          left: 'var(--md-sys-percent-50)',
          transform: `translateX(calc(var(--md-sys-percent-50) * -1)) translateY(${Math.min(pullDistance - 40, 20)}px)`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'var(--md-sys-spacing-2)',
          opacity: pullDistance > 0 ? 1 : 0,
          transition: isRefreshing 
            ? 'transform var(--md-sys-motion-duration-medium) var(--md-sys-motion-easing-standard), opacity var(--md-sys-motion-duration-short)' 
            : 'opacity var(--md-sys-motion-duration-short)',
          zIndex: 'var(--md-sys-z-raised)',
          pointerEvents: 'none'
        }}
      >
        {/* Spinner */}
        <div
          style={{
            width: 'var(--md-sys-spacing-8)',
            height: 'var(--md-sys-spacing-8)',
            border: 'var(--md-sys-border-width-medium) solid var(--md-sys-color-primary-container)',
            borderTopColor: 'var(--md-sys-color-primary)',
            borderRadius: 'var(--md-sys-shape-corner-full)',
            transform: `scale(${spinnerScale}) rotate(${isRefreshing ? '0deg' : `${rotation}deg`})`,
            transition: 'transform var(--md-sys-motion-duration-short)',
            animation: isRefreshing ? 'spin var(--md-sys-motion-duration-extra-long) linear infinite' : 'none'
          }}
        />

        {/* Status text */}
        <span
          style={{
            fontSize: 'var(--md-sys-typescale-label-small-font-size)',
            fontWeight: 'var(--md-sys-typescale-label-small-font-weight)',
            color: 'var(--md-sys-color-on-surface-variant)',
            opacity: spinnerScale
          }}
        >
          {status === 'refreshing' ? 'Aggiornamento...' : 
           status === 'ready' ? 'Rilascia per aggiornare' : 
           'Trascina per aggiornare'}
        </span>
      </div>

      {/* Content */}
      <div
        style={{
          transform: `translateY(${status === 'refreshing' ? threshold : 0}px)`,
          transition: status === 'refreshing' || status === 'idle' 
            ? 'transform var(--md-sys-motion-duration-medium) var(--md-sys-motion-easing-standard)' 
            : 'none'
        }}
      >
        {children}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: scale(${spinnerScale}) rotate(0deg); }
          to { transform: scale(${spinnerScale}) rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default PullToRefresh;
