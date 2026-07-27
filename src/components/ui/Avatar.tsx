// MD3 Compliant - Updated for layered theme access
import React from 'react';

interface AvatarProps {
    name: string;
    src?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
}

/**
 * Avatar - User avatar component with initials fallback.
 */

const Avatar: React.FC<AvatarProps> = ({ name, src, size = 'md' }) => {

    const initials = name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);

    const sizeStyles = {
        sm: { width: 'var(--md-sys-spacing-8)', height: 'var(--md-sys-spacing-8)', fontSize: 'var(--md-sys-typescale-body-large-font-size)' },
        md: { width: 'var(--md-sys-spacing-10)', height: 'var(--md-sys-spacing-10)', fontSize: 'var(--md-sys-typescale-body-large-font-size)' },
        lg: { width: 'var(--md-sys-spacing-12)', height: 'var(--md-sys-spacing-12)', fontSize: 'var(--md-sys-typescale-body-large-font-size)' },
        xl: { width: 'var(--md-sys-spacing-16)', height: 'var(--md-sys-spacing-16)', fontSize: 'var(--md-sys-typescale-display-large-font-size)' }
    };

    return (
    <div style={{
        position: 'relative',
        flexShrink: 0,
        borderRadius: 'var(--md-sys-shape-corner-extra-large)',
        overflow: 'hidden',
        backgroundColor: 'var(--md-sys-color-primary-container)',
        color: 'var(--md-sys-color-on-primary-container)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 'var(--md-sys-typescale-weight-black)',
        ...sizeStyles[size]
    }}>
        {src ? (
            <img src={src} alt={name} style={{ width: 'var(--md-sys-percent-100)', height: 'var(--md-sys-percent-100)', objectFit: 'cover' }} />
        ) : (
            <span>{initials}</span>
        )}
    </div>
    );
};

export default Avatar;

