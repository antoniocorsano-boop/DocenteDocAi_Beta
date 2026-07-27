// MD3 Compliant - Pure CSS tokens, no useTheme dependency
import React from 'react';

interface ImageSkeletonProps {
    aspectRatio?: string;
}

/**
 * ImageSkeleton - Loading skeleton for image content.
 * Shows animated placeholder with icon and text during image generation.
 */

const ImageSkeleton: React.FC<ImageSkeletonProps> = ({
    aspectRatio = '16/9'
}) => {

    return (
    <div
        style={{
            backgroundColor: 'var(--md-sys-color-surface-container-high)',
            borderRadius: 'var(--md-sys-shape-corner-small)',
            animation: `pulse var(--md-sys-motion-duration-extra-long) var(--md-sys-motion-easing-standard) infinite`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            aspectRatio
        }}
    >
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 'var(--md-sys-spacing-4)',
            color: `color-mix(in srgb, var(--md-sys-color-on-surface-variant) var(--md-sys-state-opacity-disabled), transparent)`
        }}>
            <span style={{
                fontSize: 'var(--md-sys-typescale-display-small-font-size)'
            }}>image</span>
            <span style={{
                fontSize: 'var(--md-sys-typescale-body-small-font-size)',
                fontWeight: 'var(--md-sys-typescale-weight-medium)'
            }}>Generazione immagine...</span>
        </div>
    </div>
    );
};

export default ImageSkeleton;

