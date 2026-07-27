// MD3 Compliant — Quiz Skeleton

import React from 'react';

interface QuizSkeletonProps {
    questions?: number;
}

const QuizSkeleton: React.FC<QuizSkeletonProps> = ({
    questions = 5
}) => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
            {Array.from({ length: questions }).map((_, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-2)' }}>
                    {/* Question skeleton */}
                    <div
                        style={{
                            height: 'var(--md-sys-spacing-8)',
                            backgroundColor: 'var(--md-sys-color-surface-container-high)',
                            borderRadius: 'var(--md-sys-shape-corner-small)',
                            animation: `pulse var(--md-sys-motion-duration-extra-long) var(--md-sys-motion-easing-standard) infinite`,
                            width: 'var(--md-sys-percent-85)'
                        }}
                    />

                    {/* Answer options skeleton */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-1)', marginLeft: 'var(--md-sys-spacing-4)' }}>
                        {Array.from({ length: 4 }).map((_, j) => (
                            <div
                                key={j}
                                style={{
                                    height: 'var(--md-sys-spacing-4)',
                                    backgroundColor: 'var(--md-sys-color-surface-container-high)',
                                    borderRadius: 'var(--md-sys-shape-corner-small)',
                                    animation: `pulse var(--md-sys-motion-duration-extra-long) var(--md-sys-motion-easing-standard) infinite`,
                                    width: 'var(--md-sys-percent-70)',
                                    animationDelay: `${(i * 4 + j) * 0.05}s`
                                }}
                            />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default QuizSkeleton;

