// MD3 Gold Compliant
// Tooltip accessibile con aria-describedby
// Audit: febbraio 2026

import React, { useState, useRef, useId } from 'react';

interface TooltipProps {
  content: string;
  children: React.ReactElement;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
  delay = 500
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const tooltipId = useId();

  const showTooltip = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  const positionStyles = {
    top: {
      bottom: 'var(--md-sys-percent-100)',
      left: 'var(--md-sys-percent-50)',
      transform: 'translateX(-50%) translateY(calc(-1 * var(--md-sys-spacing-2)))',
      marginBottom: 'var(--md-sys-spacing-2)'
    },
    bottom: {
      top: 'var(--md-sys-percent-100)',
      left: 'var(--md-sys-percent-50)',
      transform: 'translateX(-50%) translateY(var(--md-sys-spacing-2))',
      marginTop: 'var(--md-sys-spacing-2)'
    },
    left: {
      right: 'var(--md-sys-percent-100)',
      top: 'var(--md-sys-percent-50)',
      transform: 'translateY(-50%) translateX(calc(-1 * var(--md-sys-spacing-2)))',
      marginRight: 'var(--md-sys-spacing-2)'
    },
    right: {
      left: 'var(--md-sys-percent-100)',
      top: 'var(--md-sys-percent-50)',
      transform: 'translateY(-50%) translateX(var(--md-sys-spacing-2))',
      marginLeft: 'var(--md-sys-spacing-2)'
    }
  };

  // Clone children e aggiungi props per accessibilità
  const childrenWithProps = React.cloneElement(children, {
    onMouseEnter: (e: React.MouseEvent) => {
      showTooltip();
      children.props.onMouseEnter?.(e);
    },
    onMouseLeave: (e: React.MouseEvent) => {
      hideTooltip();
      children.props.onMouseLeave?.(e);
    },
    onFocus: (e: React.FocusEvent) => {
      setIsFocused(true);
      showTooltip();
      children.props.onFocus?.(e);
    },
    onBlur: (e: React.FocusEvent) => {
      setIsFocused(false);
      hideTooltip();
      children.props.onBlur?.(e);
    },
    'aria-describedby': isVisible || isFocused ? tooltipId : undefined
  });

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      {childrenWithProps}
      
      {(isVisible || isFocused) && (
        <div
          id={tooltipId}
          role="tooltip"
          style={{
            position: 'absolute',
            zIndex: 'var(--md-sys-z-tooltip)',
            padding: 'var(--md-sys-spacing-2) var(--md-sys-spacing-3)',
            background: 'var(--md-sys-color-inverse-surface)',
            color: 'var(--md-sys-color-inverse-on-surface)',
            borderRadius: 'var(--md-sys-spacing-1)',
            boxShadow: 'var(--md-sys-elevation-level2)',
            maxWidth: 'var(--md-sys-spacing-16)',
            whiteSpace: 'normal',
            fontSize: 'var(--md-sys-typescale-body-small-font-size)',
            fontWeight: 'var(--md-sys-typescale-weight-medium)',
            lineHeight: '1.4',
            pointerEvents: 'none',
            animation: 'tooltip-fade-in var(--md-sys-motion-duration-short4) var(--md-sys-motion-easing-decelerate)',
            ...positionStyles[position]
          }}
        >
          {content}
          
          {/* Arrow */}
          <div
            style={{
              position: 'absolute',
              width: 0,
              height: 0,
              borderStyle: 'solid',
              ...(position === 'top' && {
                bottom: 'calc(-1 * var(--md-sys-tooltip-arrow-size))',
                left: 'var(--md-sys-percent-50)',
                transform: 'translateX(-50%)',
                borderWidth: 'var(--md-sys-tooltip-arrow-size) var(--md-sys-tooltip-arrow-size) 0 var(--md-sys-tooltip-arrow-size)',
                borderColor: 'var(--md-sys-color-inverse-surface) transparent transparent transparent'
              }),
              ...(position === 'bottom' && {
                top: 'calc(-1 * var(--md-sys-tooltip-arrow-size))',
                left: 'var(--md-sys-percent-50)',
                transform: 'translateX(-50%)',
                borderWidth: '0 var(--md-sys-tooltip-arrow-size) var(--md-sys-tooltip-arrow-size) var(--md-sys-tooltip-arrow-size)',
                borderColor: 'transparent transparent var(--md-sys-color-inverse-surface) transparent'
              }),
              ...(position === 'left' && {
                right: 'calc(-1 * var(--md-sys-tooltip-arrow-size))',
                top: 'var(--md-sys-percent-50)',
                transform: 'translateY(-50%)',
                borderWidth: 'var(--md-sys-tooltip-arrow-size) 0 var(--md-sys-tooltip-arrow-size) var(--md-sys-tooltip-arrow-size)',
                borderColor: 'transparent transparent transparent var(--md-sys-color-inverse-surface)'
              }),
              ...(position === 'right' && {
                left: 'calc(-1 * var(--md-sys-tooltip-arrow-size))',
                top: 'var(--md-sys-percent-50)',
                transform: 'translateY(-50%)',
                borderWidth: 'var(--md-sys-tooltip-arrow-size) var(--md-sys-tooltip-arrow-size) var(--md-sys-tooltip-arrow-size) 0',
                borderColor: 'transparent var(--md-sys-color-inverse-surface) transparent transparent'
              })
            }}
          />
        </div>
      )}
      
      <style>{`
        @keyframes tooltip-fade-in {
          from {
            opacity: 0;
            transform: ${position === 'top' ? 'translateX(-50%) translateY(calc(-1 * var(--md-sys-spacing-1)))' :
                         position === 'bottom' ? 'translateX(-50%) translateY(var(--md-sys-spacing-1))' :
                         position === 'left' ? 'translateY(-50%) translateX(calc(-1 * var(--md-sys-spacing-1)))' :
                         'translateY(-50%) translateX(var(--md-sys-spacing-1))'};
          }
          to {
            opacity: 1;
            transform: ${position === 'top' ? 'translateX(-50%) translateY(calc(-1 * var(--md-sys-spacing-2)))' :
                         position === 'bottom' ? 'translateX(-50%) translateY(var(--md-sys-spacing-2))' :
                         position === 'left' ? 'translateY(-50%) translateX(calc(-1 * var(--md-sys-spacing-2)))' :
                         'translateY(-50%) translateX(var(--md-sys-spacing-2))'};
          }
        }
      `}</style>
    </div>
  );
};

export default Tooltip;
