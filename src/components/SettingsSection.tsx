// MD3 Compliant SettingsSection Component
// Fully compliant with MD3 tokens: uses var(--md-sys-*) CSS variables for theming, spacing, typography, shape, motion, and elevation
// No className or Tailwind dependencies - all styling uses direct MD3 CSS variables

import React from 'react';
import Typography from '@mui/material/Typography';

interface SettingsSectionProps {
    title: string;
    subtitle?: string;
    icon: string;
    children: React.ReactNode;
    style?: React.CSSProperties;
    variant?: 'surface' | 'primary' | 'secondary' | 'tertiary';
}

const SettingsSection: React.FC<SettingsSectionProps> = ({
    title,
    subtitle,
    icon,
    children,
    style: customStyle = {},
    variant = 'surface'
}) => {
    // MD3 Token mapping for variants - using direct MD3 CSS variables
    let iconBackgroundColor = 'var(--md-sys-color-surface-container-high)';
    let iconColor = 'var(--md-sys-color-on-surface-variant)';
    let titleColor = 'var(--md-sys-color-on-surface)';

    if (variant === 'primary') {
        iconBackgroundColor = 'var(--md-sys-color-primary-container)';
        iconColor = 'var(--md-sys-color-on-primary-container)';
        titleColor = 'var(--md-sys-color-primary)';
    } else if (variant === 'secondary') {
        iconBackgroundColor = 'var(--md-sys-color-secondary-container)';
        iconColor = 'var(--md-sys-color-on-secondary-container)';
        titleColor = 'var(--md-sys-color-secondary)';
    } else if (variant === 'tertiary') {
        iconBackgroundColor = 'var(--md-sys-color-tertiary-container)';
        iconColor = 'var(--md-sys-color-on-tertiary-container)';
        titleColor = 'var(--md-sys-color-tertiary)';
    }

    const sectionStyle: React.CSSProperties = {
        backgroundColor: 'var(--md-sys-color-surface-container-low)',
        borderRadius: 'var(--md-sys-shape-corner-extra-large)',
        border: 'var(--md-sys-border-width-normal) solid var(--md-sys-color-outline-variant)',
        overflow: 'hidden',
        marginBottom: 'var(--md-sys-spacing-6)',
        boxShadow: 'var(--md-sys-elevation-level1)',
        ...customStyle
    };

    const headerStyle: React.CSSProperties = {
        backgroundColor: 'var(--md-sys-color-surface)',
        opacity: 'var(--md-sys-state-opacity-placeholder)',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--md-sys-spacing-8)',
        padding: 'var(--md-sys-spacing-5)',
        borderBottom: 'var(--md-sys-border-width-normal) solid var(--md-sys-color-outline)'
    };

    const iconContainerStyle: React.CSSProperties = {
        width: 'var(--md-sys-spacing-10)',
        height: 'var(--md-sys-spacing-10)',
        borderRadius: 'var(--md-sys-shape-corner-medium)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        backgroundColor: iconBackgroundColor,
        color: iconColor
    };

    const iconStyle: React.CSSProperties = {
        fontSize: 'var(--icon-size-medium)'
    };

    const textContainerStyle: React.CSSProperties = {
        flexGrow: 1,
        minWidth: 0
    };

    const titleStyle: React.CSSProperties = {
        fontWeight: 'var(--md-sys-typescale-body-large-font-weight)',
        color: titleColor,
        fontFamily: 'var(--md-sys-typescale-font-family)',
        fontSize: 'var(--md-sys-typescale-body-large-font-size)',
        lineHeight: 'var(--md-sys-typescale-body-large-line-height)'
    };

    const subtitleStyle: React.CSSProperties = {
        color: 'var(--md-sys-color-on-surface-variant)',
        opacity: 'var(--md-sys-state-opacity-caption)',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        fontFamily: 'var(--md-sys-typescale-font-family)',
        fontSize: 'var(--md-sys-typescale-body-large-font-size)',
        lineHeight: 'var(--md-sys-typescale-body-large-line-height)',
        fontWeight: 'var(--md-sys-typescale-body-large-font-weight)'
    };

    const contentStyle: React.CSSProperties = {
        padding: 'var(--md-sys-spacing-5)'
    };

    return (
        <section style={sectionStyle}>
            <div style={headerStyle}>
                <div style={iconContainerStyle}>
                    <span style={iconStyle}>{icon}</span>
                </div>
                <div style={textContainerStyle}>
                    <Typography component="h3" variant="subtitle1" sx={titleStyle}>{title}</Typography>
                    {subtitle && <Typography component="p" variant="body1" sx={subtitleStyle}>{subtitle}</Typography>}
                </div>
            </div>
            <div style={contentStyle}>
                {children}
            </div>
        </section>
    );
};

export default SettingsSection;

