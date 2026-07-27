// MD3 Compliant
// Shared navigable card — estrae il pattern Card duplicato in ProgettazioneHub e ClassSelection

import React from 'react';
import MuiCard from '@mui/material/Card';
import ButtonBase from '@mui/material/ButtonBase';
import CardContent from '@mui/material/CardContent';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { SxProps, Theme } from '@mui/material/styles';

const _cardTokens: Record<string, readonly [string, string]> = {
    primary:        ['var(--md-sys-color-primary-container)',      'var(--md-sys-color-primary)'],
    secondary:      ['var(--md-sys-color-secondary-container)',    'var(--md-sys-color-secondary)'],
    tertiary:       ['var(--md-sys-color-tertiary-container)',     'var(--md-sys-color-tertiary)'],
    surface:        ['var(--md-sys-color-surface-container-high)', 'var(--md-sys-color-primary)'],
    surfaceVariant: ['var(--md-sys-color-surface-container-low)',  'var(--md-sys-color-secondary)'],
};

export interface NavigationCardProps {
    icon: string;
    title: string;
    description: string;
    color?: keyof typeof _cardTokens | string;
    onClick?: () => void;
    children?: React.ReactNode;
    ariaLabel?: string;
    sx?: SxProps<Theme>;
}

export const NavigationCard: React.FC<NavigationCardProps> = ({
    icon,
    title,
    description,
    color = 'surface',
    onClick,
    children,
    ariaLabel,
    sx,
}) => {
    const tokens = _cardTokens[color as string];
    const bg = tokens ? tokens[0] : color;
    const accent = tokens ? tokens[1] : 'var(--md-sys-color-primary)';
    const clickable = Boolean(onClick);

    const cardContent = (
        <CardContent sx={{ p: 'var(--md-sys-spacing-8)', '&:last-child': { pb: 'var(--md-sys-spacing-8)' } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Box sx={{ width: 40, height: 40, borderRadius: 'var(--md-sys-shape-corner-large)', backgroundColor: 'var(--md-sys-color-surface-container-high)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 'var(--md-sys-typescale-title-large-font-size)', color: accent, userSelect: 'none' }}>
                        {icon}
                    </Box>
                </Box>
                {clickable && (
                    <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 'var(--md-sys-typescale-title-large-font-size)' }}>
                        arrow_forward
                    </Box>
                )}
            </Box>
            <Typography variant="subtitle2">{title}</Typography>
            <Typography variant="body2" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {description}
            </Typography>
            {children && (
                <Box sx={{ pt: 1, mt: 1, borderTop: '1px solid var(--md-sys-color-outline-variant)' }}>
                    {children}
                </Box>
            )}
        </CardContent>
    );

    return (
        <MuiCard
            elevation={1}
            sx={{
                backgroundColor: bg,
                borderRadius: 'var(--md-sys-shape-corner-large)',
                border: '1px solid var(--md-sys-color-outline-variant)',
                transition: 'transform 500ms cubic-bezier(0.38,1.21,0.22,1.00)',
                '&:hover': clickable ? { transform: 'scale(1.04)' } : {},
                ...((sx as object) ?? {}),
            }}
        >
            {clickable ? (
                <ButtonBase
                    onClick={onClick}
                    aria-label={ariaLabel ?? `${title}: ${description}`}
                    sx={{ display: 'block', width: '100%', height: '100%', textAlign: 'left', borderRadius: 'inherit' }}
                >
                    {cardContent}
                </ButtonBase>
            ) : (
                cardContent
            )}
        </MuiCard>
    );
};

export default NavigationCard;
