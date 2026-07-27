// MD3 Compliant — Table Skeleton

import React from 'react';

interface TableSkeletonProps {
    rows?: number;
    columns?: number;
}

const TableSkeleton: React.FC<TableSkeletonProps> = ({
    rows = 3,
    columns = 3
}) => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-2)' }}>
            {/* Table header skeleton */}
            <div style={{ display: 'flex', gap: 'var(--md-sys-spacing-6)' }}>
                {Array.from({ length: columns }).map((_, i) => (
                    <div
                        key={i}
                        style={{
                            height: 'var(--md-sys-spacing-12)',
                            backgroundColor: 'var(--md-sys-color-surface-container-high)',
                            borderRadius: 'var(--md-sys-shape-corner-small)',
                            animation: `pulse var(--md-sys-motion-duration-extra-long) var(--md-sys-motion-easing-standard) infinite`,
                            flex: 1,
                            animationDelay: `${i * 0.05}s`
                        }}
                    />
                ))}
            </div>

            {/* Table rows skeleton */}
            {Array.from({ length: rows }).map((_, rowIndex) => (
                <div key={rowIndex} style={{ display: 'flex', gap: 'var(--md-sys-spacing-6)' }}>
                    {Array.from({ length: columns }).map((_, colIndex) => (
                        <div
                            key={colIndex}
                            style={{
                                height: 'var(--md-sys-spacing-12)',
                                backgroundColor: 'var(--md-sys-color-surface-container-high)',
                                borderRadius: 'var(--md-sys-shape-corner-small)',
                                animation: `pulse var(--md-sys-motion-duration-extra-long) var(--md-sys-motion-easing-standard) infinite`,
                                flex: 1,
                                animationDelay: `${(rowIndex * columns + colIndex) * 0.05}s`
                            }}
                        />
                    ))}
                </div>
            ))}
        </div>
    );
};

export default TableSkeleton;

