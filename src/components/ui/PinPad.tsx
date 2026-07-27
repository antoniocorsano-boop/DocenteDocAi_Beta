// MD3 Compliant - Pure CSS tokens, no useTheme dependency
import React, { useState } from 'react';

interface PinPadProps {
    onInput: (digit: string) => void;
    onDelete: () => void;
}

/**
 * PinPad - Numeric keypad component for PIN entry.
 * Provides a 3x4 grid of number buttons with delete functionality.
 */

const PinPad: React.FC<PinPadProps> = ({ onInput, onDelete }) => {
    const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'back'];

    const [hoveredKey, setHoveredKey] = useState<string | null>(null);
    const [pressedKey, setPressedKey] = useState<string | null>(null);

    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(3, var(--md-sys-grid-fr-1))`,
            gap: 'var(--md-sys-spacing-4)',
            maxWidth: 'var(--md-sys-spacing-64)',
            margin: 'var(--md-sys-spacing-4) var(--md-sys-margin-auto) 0'
        }}>
            {keys.map((key, i) => {
                if (key === '') return <div key={i}></div>;

                const isHovered = hoveredKey === key;
                const isPressed = pressedKey === key;

                if (key === 'back') return (
                    <button
                        key={i}
                        onClick={onDelete}
                        aria-label="Cancella"
                        style={{
                            width: 'var(--md-sys-spacing-12)',
                            height: 'var(--md-sys-spacing-12)',
                            borderRadius: 'var(--md-sys-shape-corner-large)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all var(--md-sys-motion-duration-short) var(--md-sys-motion-easing-standard)',
                            border: 'none',
                            backgroundColor: isHovered ? 'var(--md-sys-color-surface-container-high)' : 'transparent',
                            cursor: 'pointer',
                            transform: isPressed ? 'scale(0.9)' : 'scale(1)'
                        }}
                        onMouseEnter={() => setHoveredKey(key)}
                        onMouseLeave={() => setHoveredKey(null)}
                        onMouseDown={() => setPressedKey(key)}
                        onMouseUp={() => setPressedKey(null)}
                    >
                        <span style={{
                            fontSize: 'var(--md-sys-typescale-label-large-font-size)',
                            fontWeight: 'var(--md-sys-typescale-weight-light)'
                        }}>backspace</span>
                    </button>
                );

                return (
                    <button
                        key={i}
                        onClick={() => onInput(key)}
                        aria-label={`Cifra ${key}`}
                        style={{
                            width: 'var(--md-sys-spacing-12)',
                            height: 'var(--md-sys-spacing-12)',
                            borderRadius: 'var(--md-sys-shape-corner-large)',
                            backgroundColor: isHovered ? 'var(--md-sys-color-surface)' : 'var(--md-sys-color-surface-container-low)',
                            fontSize: 'var(--md-sys-typescale-label-large-font-size)',
                            fontWeight: 'var(--md-sys-typescale-weight-extrabold)',
                            border: `var(--md-sys-border-width-thick) solid ${isHovered ? 'var(--md-sys-color-primary)' : 'color-mix(in srgb, var(--md-sys-color-outline-variant) var(--md-sys-percent-30), transparent)'}`,
                            transition: 'all var(--md-sys-motion-duration-short) var(--md-sys-motion-easing-standard)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: isHovered ? 'var(--md-sys-elevation-level3)' : 'none',
                            transform: isPressed ? 'scale(0.9)' : 'scale(1)'
                        }}
                        onMouseEnter={() => setHoveredKey(key)}
                        onMouseLeave={() => setHoveredKey(null)}
                        onMouseDown={() => setPressedKey(key)}
                        onMouseUp={() => setPressedKey(null)}
                    >
                        {key}
                    </button>
                );
            })}
        </div>
    );
};

export default PinPad;

