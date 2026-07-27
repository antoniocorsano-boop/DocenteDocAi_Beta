// MD3 Gold Compliant
/**
 * ActionTile Component - MD3 Gold Compliant
 *
 * Interactive tile component for action buttons with Material Design 3 styling.
 * Supports multiple variants (primary, secondary, tertiary, surface) with proper
 * accessibility, hover states, and responsive design.
 *
 * @version 2.0.0 - MD3 Migration
 * @since 2024-01-08
 */

import React, { useState } from 'react';
import Typography from '@mui/material/Typography';

interface ActionTileProps {
    title: string;
    subtitle?: string;
    icon: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'tertiary' | 'surface' | 'filled' | 'tonal' | 'elevated' | 'outlined' | 'contained';
    tooltip?: string;
    ariaLabel?: string;
    style?: React.CSSProperties;
    className?: string;
}

const ActionTile: React.FC<ActionTileProps> = ({
    title,
    subtitle,
    icon,
    onClick,
    variant = 'surface',
    tooltip,
    ariaLabel,
    style,
    className: _className
}) => {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
    // MD3 color mapping for variants
    const getVariantColors = () => {
        switch (variant) {
            case 'primary':
                return {
                    background: 'var(--md-sys-color-primary-container)',
                    iconColor: 'var(--md-sys-color-on-primary-container)',
                    iconBg: 'var(--md-sys-color-primary)'
                };
            case 'secondary':
                return {
                    background: 'var(--md-sys-color-secondary-container)',
                    iconColor: 'var(--md-sys-color-on-secondary-container)',
                    iconBg: 'var(--md-sys-color-secondary)'
                };
            case 'tertiary':
                return {
                    background: 'var(--md-sys-color-tertiary-container)',
                    iconColor: 'var(--md-sys-color-on-tertiary-container)',
                    iconBg: 'var(--md-sys-color-tertiary)'
                };
            case 'surface':
            default:
                return {
                    background: 'var(--md-sys-color-surface)',
                    iconColor: 'var(--md-sys-color-on-surface)',
                    iconBg: 'var(--md-sys-color-surface-variant)'
                };
        }
    };

    const variantColors = getVariantColors();

    return (
        <button
            onClick={onClick}
            title={tooltip}
            aria-label={ariaLabel || `${title}${subtitle ? ` - ${subtitle}` : ''}`}
            type="button"
            style={{
                backgroundColor: variantColors.background,
                borderRadius: 'var(--md-sys-shape-corner-large)',
                padding: 'var(--md-sys-spacing-4)',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 'var(--md-sys-spacing-4)',
                border: 'none',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
                textAlign: 'left',
                boxShadow: hovered ? 'var(--md-sys-elevation-level2)' : 'var(--md-sys-elevation-level1)',
                transform: hovered ? 'translateY(calc(-1 * var(--md-sys-spacing-0-5)))' : 'translateY(0)',
                minHeight: 'var(--md-sys-spacing-12)',
                width: 'var(--md-sys-percent-100)',
                outline: focused ? `var(--md-sys-border-width-thick) solid var(--md-sys-color-primary)` : 'none',
                outlineOffset: focused ? 'var(--md-sys-spacing-2)' : undefined,
                transition: `box-shadow var(--md-sys-motion-duration-short) var(--md-sys-motion-easing-standard), transform var(--md-sys-motion-duration-short) var(--md-sys-motion-easing-standard)`,
                ...style
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
        >
            {/* Icon Container */}
            <div
                style={{
                    width: 'var(--md-sys-spacing-8)',
                    height: 'var(--md-sys-spacing-8)',
                    borderRadius: 'var(--md-sys-shape-corner-large)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 'var(--icon-size-medium)',
                    backgroundColor: variantColors.iconBg,
                    color: variantColors.iconColor,
                    flexShrink: 0,
                    boxShadow: 'var(--md-sys-elevation-level1)',
                    border: `var(--md-sys-border-width-normal) solid var(--md-sys-color-outline-variant)`,
                    transition: `box-shadow var(--md-sys-motion-duration-short) var(--md-sys-motion-easing-standard)`
                }}
            >
                <span
                    className="material-symbols-outlined"
                    style={{
                        fontSize: 'var(--icon-size-medium)'
                    }}
                >
                    {icon}
                </span>
            </div>

            {/* Content */}
            <div style={{
                flexGrow: 1,
                minWidth: 0,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--md-sys-spacing-2)'
            }}>
                <Typography
                    variant="subtitle2"
                    sx={{
                        color: 'var(--md-sys-color-on-surface)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        margin: 0
                    }}
                >
                    {title}
                </Typography>
                {subtitle && (
                    <Typography
                        variant="caption"
                        sx={{
                            color: 'var(--md-sys-color-on-surface-variant)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            margin: 0,
                            textTransform: 'uppercase',
                            letterSpacing: 'var(--md-sys-typescale-label-large-tracking)'
                        }}
                    >
                        {subtitle}
                    </Typography>
                )}
            </div>

            {/* Chevron */}
            <div
                style={{
                    width: 'var(--md-sys-spacing-8)',
                    height: 'var(--md-sys-spacing-8)',
                    borderRadius: 'var(--md-sys-shape-corner-full)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'var(--md-sys-color-surface-variant)',
                    color: 'var(--md-sys-color-on-surface-variant)',
                    flexShrink: 0,
                    transition: `background-color var(--md-sys-motion-duration-short) var(--md-sys-motion-easing-standard)`
                }}
            >
                <span
                    className="material-symbols-outlined"
                    style={{
                        fontSize: 'var(--icon-size-medium)',
                        transition: `transform var(--md-sys-motion-duration-short) var(--md-sys-motion-easing-standard)`
                    }}
                >
                    chevron_right
                </span>
            </div>

            {/* Sweep effect */}
            <div
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: `var(--md-sys-motion-easing-standard)-gradient(90deg, transparent, var(--md-sys-color-surface-disabled), transparent)`,
                    transform: hovered ? 'translateX(100%)' : 'translateX(calc(100% * -1))',
                    pointerEvents: 'none',
                    transition: `transform var(--md-sys-motion-duration-extra-long) var(--md-sys-motion-easing-standard)`
                }}
            />
        </button>
    );
};

export default ActionTile;

