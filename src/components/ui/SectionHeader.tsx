// MD3 Compliant — Section Header
import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { SxProps, Theme } from '@mui/material/styles';

/**
 * SectionHeader Component
 *
 * Displays a section header with optional icon, title, and subtitle.
 * Uses MD3 design tokens for consistent styling.
 */

interface SectionHeaderProps {
    title: string;
    subtitle?: string;
    icon?: string;
    sx?: SxProps<Theme>;
    /** @deprecated use sx instead */
    style?: React.CSSProperties;
    className?: string;
    variant?: string;
    actions?: React.ReactNode;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
    title,
    subtitle,
    icon,
    sx,
    style,
    className
}) => {

    return (
    <Box
        className={className}
        sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--md-sys-spacing-4)',
            mb: 'var(--md-sys-spacing-4)',
            mt: 'var(--md-sys-spacing-4)',
            px: 'var(--md-sys-spacing-4)',
            ...((style as object) ?? {}),
            ...((sx as object) ?? {}),
        }}
    >
        {icon && (
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 'var(--md-sys-spacing-8)',
                    height: 'var(--md-sys-spacing-8)',
                    borderRadius: 'var(--md-sys-shape-corner-medium)',
                    backgroundColor: 'var(--md-sys-color-primary-container)',
                    color: 'var(--md-sys-color-on-primary-container)',
                    flexShrink: 0,
                }}
            >
                <Box
                    component="span"
                    className="material-symbols-outlined"
                    aria-hidden="true"
                    sx={{ fontSize: 'var(--icon-size-medium)' }}
                >
                    {icon}
                </Box>
            </Box>
        )}
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography
                variant="subtitle2"
                sx={{ color: 'var(--md-sys-color-on-surface)', fontWeight: 'var(--md-sys-typescale-weight-semibold)' }}
            >
                {title}
            </Typography>
            {subtitle && (
                <Typography
                    variant="caption"
                    sx={{ mt: 0.5, color: 'var(--md-sys-color-on-surface-variant)' }}
                >
                    {subtitle}
                </Typography>
            )}
        </Box>
    </Box>
    );
};

export default SectionHeader;

