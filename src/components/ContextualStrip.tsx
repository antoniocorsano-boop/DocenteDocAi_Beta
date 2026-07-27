// MD3 Compliant — Contextual Strip

import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
interface ContextualStripProps {
    message: string;
    actionLabel: string;
    onAction: () => void;
    onDismiss: () => void;
    visible: boolean;
}

const ContextualStrip: React.FC<ContextualStripProps> = ({ message, actionLabel, onAction, onDismiss, visible }) => {
  const [render, setRender] = useState(visible);

    useEffect(() => {
        if (visible) setRender(true);
        else setTimeout(() => setRender(false), 400); // Wait for animation (matches CSS duration)
    }, [visible]);

    if (!render) return null;

    // MD3-compliant style for the root strip
    const stripStyle: React.CSSProperties = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 'var(--md-sys-spacing-8)',
        backgroundColor: 'var(--md-sys-color-surface-container-high)',
        color: 'var(--md-sys-color-on-surface)',
        borderRadius: 'var(--md-sys-shape-corner-large)',
        boxShadow: 'var(--md-sys-elevation-level2)',
        padding: 'var(--md-sys-spacing-8)',
        minHeight: 'var(--md-sys-spacing-14)',
        margin: 'var(--md-sys-spacing-8) 0',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(var(--md-sys-spacing-6))',
        transition: 'opacity var(--md-sys-motion-duration-medium) var(--md-sys-motion-easing-standard), transform var(--md-sys-motion-duration-medium) var(--md-sys-motion-easing-standard)',
        pointerEvents: visible ? 'auto' : 'none',
        zIndex: 'var(--md-sys-z-nav)'
    };

    return (
        <div style={stripStyle}>
            {/* Icon & Message Group */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: 'var(--md-sys-spacing-6)', flexGrow: 1, minWidth: 0 }}>
                <div
                    style={{
                        backgroundColor: 'var(--md-sys-color-tertiary-container)',
                        width: "var(--md-sys-spacing-7)",
                        height: "var(--md-sys-spacing-7)",
                        borderRadius: 'var(--md-sys-shape-corner-medium)',
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0
                    }}
                >
                    <Box component="span" className="material-symbols-outlined" aria-hidden="true">auto_awesome</Box>
                </div>
                <p>{message}</p>
            </div>

            {/* Actions Group */}
            <div style={{ display: "flex", alignItems: "center", gap: 'var(--md-sys-spacing-4)', flexShrink: 0 }}>
                <button onClick={onAction}>
                    {actionLabel}
                </button>
                <button
                    onClick={onDismiss}
                    style={{ opacity: 'var(--md-sys-state-opacity-supporting)' }}
                    aria-label="Chiudi suggerimento"
                >
                    <Box component="span" className="material-symbols-outlined" aria-hidden="true">close</Box>
                </button>
            </div>
        </div>
    );
};

export default ContextualStrip;

