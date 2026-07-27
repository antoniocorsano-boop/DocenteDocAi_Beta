// SettingsGroupAccordion — Accordion-style, controlled (expanded/onToggle) variant
import React from 'react';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';

interface SettingsGroupAccordionProps {
    id: string;
    title: string;
    subtitle?: string;
    icon: string;
    variant: 'primary' | 'secondary' | 'tertiary' | 'surface' | 'contained' | 'tonal' | 'elevated' | 'outlined';
    expanded: boolean;
    onToggle: () => void;
    children: React.ReactNode;
}

const SettingsGroupAccordion: React.FC<SettingsGroupAccordionProps> = ({ id, title, subtitle, icon, variant, expanded, onToggle, children }) => {

    const iconBg = variant === 'primary'
        ? 'var(--md-sys-color-primary-container)'
        : variant === 'secondary'
        ? 'var(--md-sys-color-secondary-container)'
        : variant === 'tertiary'
        ? 'var(--md-sys-color-tertiary-container)'
        : 'var(--md-sys-color-surface-container-high)';
    const iconColor = variant === 'primary'
        ? 'var(--md-sys-color-on-primary-container)'
        : variant === 'secondary'
        ? 'var(--md-sys-color-on-secondary-container)'
        : variant === 'tertiary'
        ? 'var(--md-sys-color-on-tertiary-container)'
        : 'var(--md-sys-color-on-surface-variant)';

    return (
        <Accordion
            expanded={expanded}
            onChange={() => onToggle()}
            disableGutters
            elevation={expanded ? 2 : 0}
            sx={{
                border: '1px solid',
                borderColor: expanded ? iconBg : 'var(--md-sys-color-outline-variant)',
                borderRadius: 'var(--md-sys-shape-corner-medium) !important',
                '&:before': { display: 'none' },
                transition: 'box-shadow 200ms ease, border-color 200ms ease',
            }}
        >
            <AccordionSummary
                expandIcon={
                    <Box
                        component="span"
                        className="material-symbols-outlined"
                        aria-hidden="true"
                        sx={{ fontSize: 24, color: 'var(--md-sys-color-on-surface-variant)' }}
                    >expand_more</Box>
                }
                id={`settings-group-btn-${id}`}
                aria-controls={`settings-group-panel-${id}`}
                sx={{
                    bgcolor: 'var(--md-sys-color-surface-container-high)',
                    px: 2,
                    py: 1,
                    minHeight: 72,
                    '&.Mui-expanded': {
                        minHeight: 72,
                        borderBottom: `1px solid var(--md-sys-color-outline-variant)`,
                    },
                    '& .MuiAccordionSummary-content': {
                        my: 0,
                        gap: 2,
                        alignItems: 'center',
                    },
                }}
            >
                <Box sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 3,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    bgcolor: iconBg,
                    color: iconColor,
                }}>
                    <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 24 }}>{icon}</Box>
                </Box>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'var(--md-sys-typescale-weight-bold)', color: 'var(--md-sys-color-on-surface)', lineHeight: 1.3, margin: 0 }}>{title}</Typography>
                    {subtitle && <Typography variant="body2" sx={{ color: 'var(--md-sys-color-on-surface-variant)', lineHeight: 1.4, margin: 0 }}>{subtitle}</Typography>}
                </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 2 }}>
                {children}
            </AccordionDetails>
        </Accordion>
    );
};

export default SettingsGroupAccordion;
