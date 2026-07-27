// MD3 Compliant - Migrated to CSS variables
import React, { useState } from 'react';

interface AiMemoryChipProps {
    label?: string;
}

const AiMemoryChip: React.FC<AiMemoryChipProps> = ({ label }) => {
    const [hovered, setHovered] = useState(false);

    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--md-sys-spacing-4)',
                padding: 'var(--md-sys-spacing-2) var(--md-sys-spacing-2)',
                minHeight: 'var(--md-sys-spacing-8)',
                opacity: hovered ? 1 : 0.6,
                transition: 'opacity var(--md-sys-motion-duration-short2) var(--md-sys-motion-easing-standard)',
                userSelect: 'none',
                cursor: 'help',
                backgroundColor: 'var(--md-sys-color-tertiary-container)',
                borderRadius: 'var(--md-sys-shape-corner-full)',
                border: 'var(--md-sys-border-width-normal) solid var(--md-sys-color-tertiary)'
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            title="Contesto utilizzato dall'AI"
            role="note"
            aria-label={`Contesto AI: ${label}`}
        >
            <span
                style={{
                    fontSize: 'var(--md-sys-typescale-body-large-font-size)',
                    color: 'var(--md-sys-color-on-tertiary-container)',
                    fontWeight: 'var(--md-sys-typescale-weight-bold)',
                    animation: `pulse var(--md-sys-motion-duration-extra-long) var(--md-sys-motion-easing-standard) infinite`
                }}
            >
                psychology
            </span>
            <span
                style={{
                    fontSize: 'var(--md-sys-typescale-body-large-font-size)',
                    fontWeight: 'var(--md-sys-typescale-weight-extrabold)',
                    color: 'var(--md-sys-color-on-tertiary-container)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.15em'
                }}
            >
                {label}
            </span>
        </div>
    );
};

export default AiMemoryChip;

