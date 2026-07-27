// Settings - SettingsGroup component
import React, { useState } from 'react';
import Typography from '@mui/material/Typography';
import { storage } from '../../utils/storage';

interface SettingsGroupProps {
    id: string;
    title: string;
    subtitle?: string;
    icon: string;
    variant: 'primary' | 'secondary' | 'tertiary' | 'surface' | 'filled' | 'tonal' | 'elevated' | 'outlined' | 'contained';
    defaultOpen: boolean;
    children: React.ReactNode;
}

export const SettingsGroup: React.FC<SettingsGroupProps> = ({
    id,
    title,
    subtitle,
    icon,
    variant,
    defaultOpen,
    children
}) => {
    const [isOpen, setIsOpen] = useState(() => {
        return storage.getBoolean(`settings_group_${id}`, defaultOpen);
    });

    const handleToggle = (e: React.MouseEvent) => {
        e.preventDefault();
        const newState = !isOpen;
        setIsOpen(newState);
        storage.setBoolean(`settings_group_${id}`, newState);
    };

    const variantStyles = {
        primary: {
            bg: 'var(--md-sys-color-primary-container)',
            color: 'var(--md-sys-color-on-primary-container)'
        },
        secondary: {
            bg: 'var(--md-sys-color-secondary-container)',
            color: 'var(--md-sys-color-on-secondary-container)'
        },
        tertiary: {
            bg: 'var(--md-sys-color-tertiary-container)',
            color: 'var(--md-sys-color-on-tertiary-container)'
        },
        surface: {
            bg: 'var(--md-sys-color-surface-container-high)',
            color: 'var(--md-sys-color-on-surface)'
        },
        filled: {
            bg: 'var(--md-sys-color-primary-container)',
            color: 'var(--md-sys-color-on-primary-container)'
        },
        tonal: {
            bg: 'var(--md-sys-color-secondary-container)',
            color: 'var(--md-sys-color-on-secondary-container)'
        },
        elevated: {
            bg: 'var(--md-sys-color-surface-container-low)',
            color: 'var(--md-sys-color-on-surface)'
        },
        outlined: {
            bg: 'var(--md-sys-color-surface-container)',
            color: 'var(--md-sys-color-on-surface)'
        },
        contained: {
            bg: 'var(--md-sys-color-primary-container)',
            color: 'var(--md-sys-color-on-primary-container)'
        }
    };

    const style = variantStyles[variant];

    return (
        <details
            style={{
                backgroundColor: 'var(--md-sys-color-surface-container-low)',
                backdropFilter: 'blur(var(--md-sys-elevation-backdrop-blur))',
                border: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline-variant)',
                borderRadius: 'var(--md-sys-shape-corner-extra-large)',
                overflow: 'hidden',
                transition: `all var(--md-sys-motion-duration-medium1) var(--md-sys-motion-easing-standard)`,
                boxShadow: isOpen ? 'var(--md-sys-elevation-level2)' : 'var(--md-sys-elevation-level1)'
            }}
            open={isOpen}
            role="region"
            aria-label={subtitle ? `${title}: ${subtitle}` : title}
        >
            <summary
                onClick={handleToggle}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 'var(--md-sys-spacing-5)',
                    cursor: 'pointer',
                    listStyle: 'none',
                    backgroundColor: 'var(--md-sys-color-surface-container-high)',
                    borderBottom: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline-variant)',
                    transition: `background-color var(--md-sys-motion-duration-short1) var(--md-sys-motion-easing-standard)`
                }}
            >
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--md-sys-spacing-4)',
                    minWidth: 0,
                    flex: 1
                }}>
                    <div style={{
                        width: 'var(--md-sys-spacing-8)',
                        height: 'var(--md-sys-spacing-8)',
                        borderRadius: 'var(--md-sys-shape-corner-large)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: style.bg,
                        color: style.color,
                        flexShrink: 0
                    }}>
                        <span
                            className="material-symbols-outlined"
                            style={{
                                fontSize: 'var(--md-sys-typescale-body-large-font-size)',
                                fontVariationSettings: '"FILL" 1, "wght" 600'
                            }}
                        >
                            {icon}
                        </span>
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                        <Typography
                            variant="subtitle1"
                            sx={{
                                color: 'var(--md-sys-color-on-surface)',
                                fontWeight: 'var(--md-sys-typescale-weight-semibold)'
                            }}
                        >
                            {title}
                        </Typography>
                        {subtitle && (
                            <Typography
                                variant="caption"
                                sx={{
                                    color: 'var(--md-sys-color-on-surface-variant)',
                                    marginTop: 'var(--md-sys-spacing-1)'
                                }}
                            >
                                {subtitle}
                            </Typography>
                        )}
                    </div>
                </div>
                <span
                    className="material-symbols-outlined"
                    style={{
                        color: 'var(--md-sys-color-on-surface-variant)',
                        transition: `transform var(--md-sys-motion-duration-short2) var(--md-sys-motion-easing-standard)`,
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)'
                    }}
                >
                    expand_more
                </span>
            </summary>
            <div style={{ padding: 'var(--md-sys-spacing-4)' }}>
                {children}
            </div>
        </details>
    );
};

export default SettingsGroup;
