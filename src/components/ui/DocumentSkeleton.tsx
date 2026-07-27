// MD3 Compliant - Pure CSS tokens, no useTheme dependency
import React from 'react';

interface DocumentSkeletonProps {
    lines?: number;
}

/**
 * DocumentSkeleton - Loading skeleton for document content.
 * Shows animated placeholder lines to indicate content loading.
 */

const DocumentSkeleton: React.FC<DocumentSkeletonProps> = ({
    lines = 5
}) => {

    return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)'}}>
        {/* Title skeleton */}
        <div style={{
            height: 'var(--md-sys-spacing-4)',
            backgroundColor: 'var(--md-sys-color-surface-container-high)',
            borderRadius: 'var(--md-sys-shape-corner-small)',
            animation: `pulse var(--md-sys-motion-duration-extra-long) var(--md-sys-motion-easing-standard) infinite`,
            width: 'var(--md-sys-percent-70)'
        }} />

        {/* Content lines skeleton */}
        {Array.from({ length: lines }).map((_, i) => (
            <div
                key={i}
                style={{
                    height: 'var(--md-sys-spacing-8)',
                    backgroundColor: 'var(--md-sys-color-surface-container-high)',
                    borderRadius: 'var(--md-sys-shape-corner-full)',
                    animation: `pulse var(--md-sys-motion-duration-extra-long) var(--md-sys-motion-easing-standard) infinite`,
                    width: i === lines - 1 ? 'var(--md-sys-percent-60)' : 'var(--md-sys-percent-100)',
                    animationDelay: `${i * 0.1}s`
                }}
            />
        ))}
    </div>
    );
};

export default DocumentSkeleton;

