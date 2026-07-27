// HelpModal - ManualSection component
import React, { useState } from 'react';
import Typography from '@mui/material/Typography';

interface ManualSectionProps {
    title: string;
    icon: string;
    defaultOpen?: boolean;
    children: React.ReactNode;
}

export const ManualSection: React.FC<ManualSectionProps> = ({ title, icon, defaultOpen = false, children }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div style={{
            border: `var(--md-sys-border-width-thin) solid var(--md-sys-color-outline-variant)`,
            borderRadius: 'var(--md-sys-shape-corner-large)',
            marginBottom: 'var(--md-sys-spacing-4)',
            overflow: 'hidden'
        }}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    width: 'var(--md-sys-percent-100)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 'var(--md-sys-spacing-4)',
                    backgroundColor: 'var(--md-sys-color-surface-container-low)',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'background-color var(--md-sys-motion-duration-short2) var(--md-sys-motion-easing-standard)'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--md-sys-color-surface-container-high)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--md-sys-color-surface-container-low)'}
            >
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--md-sys-spacing-3)'
                }}>
                    <span style={{
                        color: 'var(--md-sys-color-primary)',
                        fontSize: 'var(--md-sys-typescale--font-size)'
                    }}>{icon}</span>
                    <Typography variant="subtitle2">{title}</Typography>
                </div>
                <span style={{
                    color: 'var(--md-sys-color-on-surface-variant)',
                    transition: 'transform var(--md-sys-motion-duration-short2) var(--md-sys-motion-easing-standard)',
                    transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)'
                }}>expand_more</span>
            </button>
            {isOpen && <div style={{
                padding: 'var(--md-sys-spacing-4)',
                backgroundColor: 'var(--md-sys-color-surface)',
                borderTop: `var(--md-sys-border-width-thin) solid var(--md-sys-color-outline-variant)`
            }}>{children}</div>}
        </div>
    );
};

export default ManualSection;
