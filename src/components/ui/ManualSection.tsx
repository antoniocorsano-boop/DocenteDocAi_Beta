// MD3 Compliant
import React, { useState } from 'react';

interface ManualSectionProps {
    title: string;
    icon: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
}

const ManualSection: React.FC<ManualSectionProps> = ({
    title,
    icon,
    children,
    defaultOpen = false
}) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    const [summaryHovered, setSummaryHovered] = useState(false);
    const [iconHovered, setIconHovered] = useState(false);

    return (
        <details
            style={{
                border: 'none',
                backgroundColor: 'var(--md-sys-color-surface-container-low)',
                opacity: 'var(--md-sys-state-opacity-placeholder)',
                backdropFilter: 'blur(var(--md-sys-blur-small))',
                WebkitBackdropFilter: 'blur(var(--md-sys-blur-small))',
                borderRadius: 'var(--md-sys-shape-corner-large)',
                marginBottom: 'var(--md-sys-spacing-4)',
                overflow: 'hidden',
                transition: `all var(--md-sys-motion-duration-medium) var(--md-sys-motion-easing-standard)`
            }}
            open={isOpen}
            onToggle={(e) => setIsOpen((e.target as HTMLDetailsElement).open)}
        >
            <summary
                style={{
                    padding: 'var(--md-sys-spacing-4)',
                    backgroundColor: summaryHovered ? 'var(--md-sys-color-surface-container-high)' : 'transparent',
                    opacity: summaryHovered ? 0.8 : undefined,
                    cursor: 'pointer',
                    listStyle: 'none',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: `background-color var(--md-sys-motion-duration-medium) var(--md-sys-motion-easing-standard)`
                }}
                onMouseEnter={() => setSummaryHovered(true)}
                onMouseLeave={() => setSummaryHovered(false)}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-4)' }}>
                    <div
                        style={{
                            padding: 'var(--md-sys-spacing-6)',
                            borderRadius: 'var(--md-sys-shape-corner-large)',
                            backgroundColor: 'var(--md-sys-color-surface-container-high)',
                            boxShadow: 'var(--md-sys-elevation-level1)',
                            transform: iconHovered ? 'scale(1.1)' : 'scale(1)',
                            transition: `transform var(--md-sys-motion-duration-short) var(--md-sys-motion-easing-standard)`
                        }}
                        onMouseEnter={() => setIconHovered(true)}
                        onMouseLeave={() => setIconHovered(false)}
                    >
                        <span
                            style={{
                                fontSize: 'var(--md-sys-typescale-headline-small-font-size)',
                                fontWeight: 'var(--md-sys-typescale-headline-small-font-weight)' as React.CSSProperties['fontWeight'],
                                lineHeight: 'var(--md-sys-typescale-headline-small-line-height)',
                                color: 'var(--md-sys-color-on-surface-variant)'
                            }}
                        >
                            {icon}
                        </span>
                    </div>
                    <h3
                        style={{
                            fontSize: 'var(--md-sys-typescale-headline-medium-font-size)',
                            fontWeight: 'var(--md-sys-typescale-weight-black)',
                            lineHeight: 'var(--md-sys-typescale-headline-medium-line-height)',
                            letterSpacing: 'var(--md-sys-typescale-headline-medium-tracking)',
                            margin: 0
                        }}
                    >
                        {title}
                    </h3>
                </div>
                <div
                    style={{
                        width: 'var(--md-sys-spacing-8)',
                        height: 'var(--md-sys-spacing-8)',
                        borderRadius: 'var(--md-sys-shape-corner-full)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'var(--md-sys-color-outline-variant)',
                        opacity: 'var(--md-sys-state-opacity-tint-subtle)',
                        transition: `transform var(--md-sys-motion-duration-medium) var(--md-sys-motion-easing-emphasized)`,
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)'
                    }}
                >
                    <span
                        style={{
                            fontSize: 'var(--md-sys-typescale-body-large-font-size)',
                            color: 'var(--md-sys-color-on-primary)'
                        }}
                    >
                        expand_more
                    </span>
                </div>
            </summary>
            <div
                style={{
                    padding: 'var(--md-sys-spacing-2) var(--md-sys-spacing-6) var(--md-sys-spacing-6) var(--md-sys-spacing-6)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--md-sys-spacing-6)'
                }}
            >
                {children}
            </div>
        </details>
    );
};

export default ManualSection;

