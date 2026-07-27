import React from 'react';
import { Lezione, MaterialeDidattico } from '../../types';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

interface ClassroomResourcesTabProps {
    lesson: Lezione;
    onPreviewMaterial: (material: MaterialeDidattico) => void;
}

export const ClassroomResourcesTab: React.FC<ClassroomResourcesTabProps> = ({ lesson, onPreviewMaterial }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-2)' }}>
        {lesson.materialiDidattici && lesson.materialiDidattici.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'var(--md-sys-grid-fr-1)', gap: 'var(--md-sys-spacing-3)' }}>
                {lesson.materialiDidattici.map(mat => (
                    <div
                        key={mat.id}
                        style={{
                            borderRadius: 'var(--md-sys-shape-corner-large)',
                            backgroundColor: 'var(--md-sys-color-surface)',
                            padding: 'var(--md-sys-spacing-3)',
                            border: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--md-sys-spacing-3)',
                            cursor: 'pointer'
                        }}
                        onClick={() => onPreviewMaterial(mat)}
                    >
                        <div
                            style={{
                                borderRadius: 'var(--md-sys-shape-corner-large)',
                                width: 'var(--md-sys-spacing-10)',
                                height: 'var(--md-sys-spacing-10)',
                                backgroundColor: 'var(--md-sys-color-tertiary-container)',
                                color: 'var(--md-sys-color-on-tertiary-container)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 'var(--md-sys-typescale-title-large-font-size)' }}>
                                {mat.type === 'link' ? 'link' : 'article'}
                            </Box>
                        </div>
                        <div style={{ flexGrow: 1, minWidth: 0 }}>
                            <Typography variant="body2" sx={{ fontWeight: 'var(--md-sys-typescale-weight-bold)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--md-sys-color-on-surface)' }}>{mat.label || mat.fileName}</Typography>
                            <Typography variant="caption" sx={{ color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase' }}>{mat.type}</Typography>
                        </div>
                    </div>
                ))}
            </div>
        ) : (
            <div style={{ textAlign: 'center', padding: 'var(--md-sys-spacing-4)', opacity: 'var(--md-sys-state-opacity-secondary)' }}>
                <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ marginBottom: 'var(--md-sys-spacing-2)', fontSize: 'var(--md-sys-typescale-title-large-font-size)', color: 'var(--md-sys-color-on-surface-variant)' }}>folder_off</Box>
                <Typography variant="body1" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Nessun materiale.</Typography>
            </div>
        )}

        {lesson.adattamenti && (
            <div style={{ color: 'var(--md-sys-color-on-secondary-container)', borderRadius: 'var(--md-sys-shape-corner-large)', padding: 'var(--md-sys-spacing-4)', backgroundColor: 'var(--md-sys-color-secondary-container)' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'var(--md-sys-typescale-weight-bold)', display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-2)', marginBottom: 'var(--md-sys-spacing-2)' }}>
                    <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ color: 'var(--md-sys-color-on-secondary-container)', fontSize: 'var(--md-sys-typescale-title-large-font-size)' }}>accessibility_new</Box>
                    Inclusione
                </Typography>
                <Typography variant="body2" sx={{ color: 'var(--md-sys-color-on-secondary-container)', opacity: 'var(--md-sys-state-opacity-hover-overlay)', whiteSpace: 'pre-wrap' }}>{lesson.adattamenti}</Typography>
            </div>
        )}
    </div>
);
