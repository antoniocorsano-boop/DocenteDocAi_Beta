// MD3 Compliant - CategoryCard component migrated to CSS variables
// @md3-compliant
// @ready-for-extension

/**
 * CategoryCard Component - MD3 Pure Migration
 *
 * Interactive category selection card with Material Design 3 token-based styling.
 * Supports selection states, hover effects, and accessibility features.
 *
 * @version 2.2.0 - CSS Variables Migration
 * @since 2026-01-22
 */

import React, { useState } from 'react';
import Typography from '@mui/material/Typography';

interface CategoryCardProps {
    id: string;
    label: string;
    icon: string;
    color: string;
    isSelected: boolean;
    onClick: () => void;
    description?: string;
}

const CategoryCard: React.FC<CategoryCardProps> = ({
    label,
    icon,
    color,
    isSelected,
    onClick,
    description
}) => {
    const [hovered, setHovered] = useState(false);
    const [focused, setFocused] = useState(false);

    return (
    <div
        onClick={onClick}
        onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
            }
        }}
        role="button"
        tabIndex={0}
        aria-pressed={isSelected}
        style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 'var(--md-sys-spacing-4)',
            padding: 'var(--md-sys-spacing-6)',
            borderRadius: 'var(--md-sys-shape-corner-large)',
            border: isSelected ? 'var(--md-sys-border-width-thick) solid var(--md-sys-color-primary)' : 'var(--md-sys-border-width-normal) solid var(--md-sys-color-outline-variant)',
            backgroundColor: isSelected
                ? 'var(--md-sys-color-primary-container)'
                : (hovered && !isSelected ? 'var(--md-sys-color-surface-container-high)' : 'var(--md-sys-color-surface-container)'),
            boxShadow: isSelected
                ? 'var(--md-sys-elevation-level3)'
                : 'var(--md-sys-elevation-level1)',
            cursor: 'pointer',
            transition: 'opacity, transform, background-color, color, border-color, box-shadow var(--md-sys-motion-duration-medium) var(--md-sys-motion-easing-standard)',
            transform: isSelected ? 'scale(1.02)' : (hovered && !isSelected ? 'scale(1.01)' : 'scale(1)'),
            outline: focused ? 'var(--md-sys-border-width-normal) solid var(--md-sys-color-primary)' : 'none',
            outlineOffset: focused ? 'var(--md-sys-spacing-2)' : undefined
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
    >
        <div
            style={{
                width: 'var(--md-sys-spacing-8)',
                height: 'var(--md-sys-spacing-8)',
                borderRadius: 'var(--md-sys-shape-corner-medium)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: isSelected
                    ? 'var(--md-sys-color-primary)'
                    : `${color}20`,
                color: isSelected
                    ? 'var(--md-sys-color-on-primary)'
                    : color,
                transition: 'opacity, transform, background-color, color, border-color, box-shadow var(--md-sys-motion-duration-medium) var(--md-sys-motion-easing-standard)',
                transform: hovered && !isSelected ? 'rotate(6deg) scale(1.1)' : 'rotate(0deg) scale(1)'
            }}
        >
            <span className="material-symbols-outlined" aria-hidden="true" style={{
                fontSize: 'var(--md-sys-typescale-title-large-font-size)'
            }}>{icon}</span>
        </div>
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 'var(--md-sys-spacing-4)'
        }}>
            <Typography
                variant="subtitle2"
                sx={{ textAlign: 'center', fontWeight: 'var(--md-sys-typescale-weight-black)', color: 'var(--md-sys-color-on-surface)', m: 0 }}
            >
                {label}
            </Typography>
            {description && (
                <Typography
                    variant="caption"
                    sx={{
                        textAlign: 'center',
                        color: 'var(--md-sys-color-on-surface-variant)',
                        lineHeight: 1.3,
                        px: 2,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        m: 0,
                    }}
                >
                    {description}
                </Typography>
            )}
        </div>
    </div>
    );
};

export default CategoryCard;

