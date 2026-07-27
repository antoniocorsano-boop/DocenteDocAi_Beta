// MD3 Compliant - AiThinkingGem component with direct MD3 tokens
import React from 'react';

interface AiThinkingGemProps {
    size?: 'small' | 'medium' | 'large';
    text?: string;
    inline?: boolean;
}

const AiThinkingGem: React.FC<AiThinkingGemProps> = ({ size = 'medium', text, inline = false }) => {
    // MD3 token-based sizing
    const sizeMap = {
        small: { width: 'var(--md-sys-spacing-8)', height: 'var(--md-sys-spacing-8)', icon: 'var(--md-sys-typescale-title-large-font-size)' },
        medium: { width: 'var(--md-sys-spacing-14)', height: 'var(--md-sys-spacing-14)', icon: 'var(--md-sys-typescale-title-large-font-size)' },
        large: { width: 'var(--md-sys-spacing-22)', height: 'var(--md-sys-spacing-22)', icon: 'var(--md-sys-typescale-display-large-font-size)' }
    };

    const dim = sizeMap[size];

    return (
        <div
            role="status"
            aria-live="polite"
            aria-atomic="true"
            aria-label={text || 'Intelligenza artificiale in elaborazione'}
            style={{
                display: 'flex',
                flexDirection: inline ? 'row' : 'column',
                gap: 'var(--md-sys-spacing-8)',
                alignItems: 'center',
                justifyContent: 'center'
            }}
        >
            <div
                style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: dim.width,
                    height: dim.height
                }}
            >
                {/* Aura Ring */}
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        borderRadius: 'var(--md-sys-shape-corner-full)',
                        background: 'var(--md-sys-color-surface-container-high)',
                        transform: 'scale(1.2)',
                        animation: `pulse var(--md-sys-motion-duration-extra-long) var(--md-sys-motion-easing-standard) infinite`,
                        opacity: 'var(--md-sys-state-opacity-empty)'
                    }}
                />

                {/* Rotating Thinking Ring */}
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        borderRadius: 'var(--md-sys-shape-corner-full)',
                        background: `conic-gradient(from 0deg, transparent var(--md-sys-percent-0), var(--md-sys-color-primary) var(50%), var(--md-sys-color-tertiary) 100%)`,
                        maskImage: 'radial-gradient(closest-side, transparent var(--md-sys-percent-78), black var(--md-sys-percent-82))',
                        WebkitMaskImage: 'radial-gradient(closest-side, transparent var(--md-sys-percent-78), black var(--md-sys-percent-82))',
                        animation: `spin var(--md-sys-motion-duration-extra-long) var(--md-sys-motion-easing-standard) infinite`
                    }}
                />

                {/* The Core Gem */}
                <div
                    style={{
                        position: 'relative',
                        zIndex: 'var(--md-sys-z-tooltip)',
                        width: 'var(--md-sys-percent-100)',
                        height: 'var(--md-sys-percent-100)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <span
                        style={{
                            fontSize: dim.icon,
                            color: 'var(--md-sys-color-primary)',
                            fontWeight: 'var(--md-sys-typescale-weight-light)'
                        }}
                    >
                        diamond
                    </span>
                </div>
            </div>
            {text && (
                <p
                    style={{
                        fontFamily: 'var(--md-sys-typescale-label-large-font-family)',
                        fontSize: 'var(--md-sys-typescale-label-large-font-size)',
                        fontWeight: 'var(--md-sys-typescale-label-large-font-weight)',
                        lineHeight: 'var(--md-sys-typescale-label-large-line-height)',
                        color: 'var(--md-sys-color-primary)',
                        letterSpacing: 'var(--md-sys-typescale-label-large-letter-spacing)',
                        textTransform: 'uppercase',
                        animation: `pulse var(--md-sys-motion-duration-extra-long) var(--md-sys-motion-easing-standard) infinite`,
                        margin: 0
                    }}
                >
                    {text}
                </p>
            )}
            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default AiThinkingGem;

