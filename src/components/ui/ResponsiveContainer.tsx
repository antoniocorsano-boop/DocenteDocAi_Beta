// MD3 Gold Compliant
// Container responsive con breakpoints
// Audit: febbraio 2026

import React from 'react';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  padding?: boolean;
  centered?: boolean;
}

export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  maxWidth = 'lg',
  padding = true,
  centered = true
}) => {
  const maxWidthMap = {
    sm: 'var(--md-sys-breakpoint-sm)',       // 640px - Mobile landscape
    md: 'var(--md-sys-breakpoint-tablet)',    // 768px - Tablet portrait
    lg: 'var(--md-sys-breakpoint-desktop)',   // 1024px - Tablet landscape / Small desktop
    xl: 'var(--md-sys-breakpoint-xl)',        // 1280px - Desktop
    full: 'var(--md-sys-percent-100)'
  };

  return (
    <div
      style={{
        width: 'var(--md-sys-percent-100)',
        maxWidth: maxWidthMap[maxWidth],
        margin: centered ? '0 auto' : '0',
        padding: padding ? 'var(--md-sys-spacing-4)' : '0'
      }}
    >
      {children}
    </div>
  );
};

// Hook per responsive breakpoints
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const useBreakpoint = () => {
  const [breakpoint, setBreakpoint] = React.useState<'mobile' | 'tablet' | 'desktop'>('desktop');

  React.useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setBreakpoint('mobile');
      } else if (width < 1024) {
        setBreakpoint('tablet');
      } else {
        setBreakpoint('desktop');
      }
    };

    updateBreakpoint();
    window.addEventListener('resize', updateBreakpoint);
    return () => window.removeEventListener('resize', updateBreakpoint);
  }, []);

  return {
    breakpoint,
    isMobile: breakpoint === 'mobile',
    isTablet: breakpoint === 'tablet',
    isDesktop: breakpoint === 'desktop',
    isTouchDevice: breakpoint === 'mobile' || breakpoint === 'tablet'
  };
};

export default ResponsiveContainer;
