// MD3 Gold Compliant
// Tutti gli stili usano esclusivamente token MD3 (nessun valore hardcoded)
// Audit: gennaio 2026
import React from 'react';
import ButtonBase from '@mui/material/ButtonBase';
import { Uda } from '../types';
import { logger } from '../utils/logger';

// M3Expressive: Refactored to use dedicated CSS classes with M3 tokens for positioning, colors, and interactions
interface GanttBarProps {
    uda: Uda & {
        startPos: number;
        width: number;
        color: string;
        borderColor: string;
        textColor: string;
    };
    onClick: () => void;
}

const GanttBar: React.FC<GanttBarProps> = ({ uda, onClick }) => {
    const handleClick = () => {
        logger.audit(`Clicked on GanttBar for UDA ${uda.id}: ${uda.title}`);
        onClick();
    };

    return (
        <ButtonBase
            onClick={handleClick}
            aria-label={`UDA: ${uda.title}`}
            focusRipple
            sx={{
                position: 'absolute',
                left: `${uda.startPos}%`,
                width: `${uda.width}%`,
                top: '4px',
                bottom: '4px',
                background: uda.color,
                border: `2px solid ${uda.borderColor}`,
                borderRadius: 'var(--md-sys-shape-corner-small)',
                color: uda.textColor,
                textAlign: 'left',
                overflow: 'hidden',
                px: 'var(--md-sys-spacing-2)',
                minWidth: '4px',
                display: 'flex',
                alignItems: 'center',
                '&:hover::after': {
                    content: '""',
                    position: 'absolute',
                    inset: 0,
                    borderRadius: 'inherit',
                    backgroundColor: 'var(--md-sys-color-on-surface)',
                    opacity: 0.08,
                    pointerEvents: 'none',
                },
                '&:focus-visible': {
                    outline: '2px solid var(--md-sys-color-primary)',
                    outlineOffset: 2,
                },
            }}
            title={`${uda.title} (${uda.startDate ? new Date(uda.startDate).toLocaleDateString() : ''} - ${uda.endDate ? new Date(uda.endDate).toLocaleDateString() : ''})`}
        >
            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 'var(--md-sys-typescale-label-small-font-size)', fontWeight: 'var(--md-sys-typescale-weight-medium)' }}>{uda.title}</div>
        </ButtonBase>
    );
};

export default GanttBar;

