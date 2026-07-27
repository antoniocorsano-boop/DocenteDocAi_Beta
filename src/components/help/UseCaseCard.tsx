// HelpModal - UseCaseCard component
import React from 'react';
import Typography from '@mui/material/Typography';
import { sanitizeHtml } from '../../utils/htmlSanitizer';

interface UseCaseCardProps {
    scenario: string;
    steps: string[];
    tip?: string;
}

export const UseCaseCard: React.FC<UseCaseCardProps> = ({ scenario, steps, tip }) => (
    <div style={{
        backgroundColor: 'var(--md-sys-color-surface-container-low)',
        borderRadius: 'var(--md-sys-shape-corner-large)',
        padding: 'var(--md-sys-spacing-4)',
        border: `var(--md-sys-border-width-thin) solid var(--md-sys-color-outline-variant)`
    }}>
        <Typography variant="body1" sx={{
            fontWeight: 'var(--md-sys-typescale-weight-bold)',
            color: 'primary.main',
            mb: 1.5
        }}>{scenario}</Typography>
        <ol style={{
            margin: 0,
            paddingLeft: 'var(--md-sys-spacing-5)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--md-sys-spacing-2)'
        }}>
            {steps.map((step, i) => (
                <li key={i} style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 'var(--md-sys-spacing-2)',
                    color: 'var(--md-sys-color-on-surface)'
                }}>
                    <span style={{
                        color: 'var(--md-sys-color-primary)',
                        fontSize: 'var(--md-sys-typescale--font-size)',
                        marginTop: 'var(--md-sys-spacing-1)',
                        flexShrink: 0
                    }}>check_circle</span>
                    <span dangerouslySetInnerHTML={{ __html: sanitizeHtml(step) }}></span>
                </li>
            ))}
        </ol>
        {tip && (
            <div style={{
                marginTop: 'var(--md-sys-spacing-3)',
                padding: 'var(--md-sys-spacing-2)',
                backgroundColor: 'var(--md-sys-color-primary-container)',
                borderRadius: 'var(--md-sys-shape-corner-medium)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--md-sys-spacing-2)'
            }}>
                <span style={{
                    color: 'var(--md-sys-color-primary)'
                }}>lightbulb</span>
                <Typography variant="body2" sx={{ color: 'var(--md-sys-color-on-primary-container)' }}>
                    {tip}
                </Typography>
            </div>
        )}
    </div>
);

export default UseCaseCard;
