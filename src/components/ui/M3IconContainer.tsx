// MD3 Gold Compliant
// Icon-in-rounded-container pattern — MD3 semantic icon container.
// Replaces ~15 inline implementations across the codebase.
// Audit: febbraio 2026

import React from 'react';

export type IconContainerColor = 'primary' | 'secondary' | 'tertiary';
export type IconContainerSize = 'sm' | 'md' | 'lg';

const COLOR_BG: Record<IconContainerColor, string> = {
  primary: 'var(--md-sys-color-primary-container)',
  secondary: 'var(--md-sys-color-secondary-container)',
  tertiary: 'var(--md-sys-color-tertiary-container)',
};

const COLOR_FG: Record<IconContainerColor, string> = {
  primary: 'var(--md-sys-color-on-primary-container)',
  secondary: 'var(--md-sys-color-on-secondary-container)',
  tertiary: 'var(--md-sys-color-on-tertiary-container)',
};

const SIZE_PX: Record<IconContainerSize, string> = {
  sm: '32px',
  md: '40px',
  lg: '48px',
};

const ICON_SIZE_PX: Record<IconContainerSize, string> = {
  sm: '18px',
  md: '22px',
  lg: '26px',
};

export interface M3IconContainerProps {
  /** MD3 container color role */
  color?: IconContainerColor;
  /** Container size */
  size?: IconContainerSize;
  /** aria-label for the container (optional — use when icon is the sole content) */
  'aria-label'?: string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}

/**
 * MD3 Icon-in-container.
 *
 * Renders an icon inside a rounded tonal container following MD3 icon
 * container semantics. Use instead of inline icon-box patterns.
 *
 * @example
 * <M3IconContainer color="primary" size="md">
 *   <span className="material-symbols-outlined" aria-hidden>folder</span>
 * </M3IconContainer>
 */
const M3IconContainer: React.FC<M3IconContainerProps> = ({
  color = 'primary',
  size = 'md',
  children,
  style,
  className,
  'aria-label': ariaLabel,
}) => {
  const dim = SIZE_PX[size];
  const iconSize = ICON_SIZE_PX[size];

  return (
    <div
      aria-label={ariaLabel}
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: dim,
        height: dim,
        borderRadius: 'var(--md-sys-shape-corner-full)',
        backgroundColor: COLOR_BG[color],
        color: COLOR_FG[color],
        fontSize: iconSize,
        flexShrink: 0,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

M3IconContainer.displayName = 'M3IconContainer';

export default M3IconContainer;
