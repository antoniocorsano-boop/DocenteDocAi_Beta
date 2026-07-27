import React from 'react';
import VoiceNoteRecorder from '../VoiceNoteRecorder';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

interface ClassroomNotesTabProps {
    notes: string;
    onNotesChange: (text: string) => void;
    onVoiceAppend: (text: string) => void;
    onCopy: () => void;
    onShare: () => void;
    onPrintHomework: () => void;
}

export const ClassroomNotesTab: React.FC<ClassroomNotesTabProps> = ({
    notes,
    onNotesChange,
    onVoiceAppend,
    onCopy,
    onShare,
    onPrintHomework,
}) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-2)' }}>
        <div style={{ borderRadius: 'var(--md-sys-shape-corner-large)', backgroundColor: 'var(--md-sys-color-surface)', padding: 'var(--md-sys-spacing-4)', border: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--md-sys-spacing-4)' }}>
                <Typography variant="subtitle1">Note Pubbliche (Registro)</Typography>
                <VoiceNoteRecorder onTranscription={onVoiceAppend} compact />
            </div>
            <textarea
                value={notes}
                onChange={e => onNotesChange(e.target.value)}
                style={{
                    backgroundColor: 'var(--md-sys-color-surface-container-low)',
                    border: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline)',
                    borderRadius: 'var(--md-sys-shape-corner-medium)',
                    padding: 'var(--md-sys-spacing-2)',
                    width: 'var(--md-sys-percent-full)',
                    color: 'var(--md-sys-color-on-surface)',
                    fontFamily: 'inherit'
                }}
                rows={8}
                placeholder="Argomenti trattati, note disciplinari, promemoria..."
            />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'var(--md-sys-grid-fr-1) var(--md-sys-grid-fr-1)', gap: 'var(--md-sys-spacing-3)' }}>
            {[
                { icon: 'content_copy', label: 'Copia', onClick: onCopy },
                { icon: 'share', label: 'Condividi', onClick: onShare },
                { icon: 'assignment', label: 'Stampa Compiti (PDF)', onClick: onPrintHomework },
            ].map(({ icon, label, onClick }) => (
                <button
                    key={label}
                    onClick={onClick}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 'var(--md-sys-spacing-2)',
                        padding: 'var(--md-sys-spacing-2) var(--md-sys-spacing-3)',
                        backgroundColor: 'var(--md-sys-color-surface-container-low)',
                        color: 'var(--md-sys-color-on-surface)',
                        border: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline)',
                        borderRadius: 'var(--md-sys-shape-corner-large)',
                        cursor: 'pointer',
                        fontWeight: 'var(--md-sys-typescale-weight-bold)',
                        textTransform: 'uppercase',
                        letterSpacing: 'var(--md-sys-typescale-label-small-tracking)'
                    }}
                >
                    <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 'var(--md-sys-typescale-body-large-font-size)' }}>{icon}</Box>
                    {label}
                </button>
            ))}
        </div>
    </div>
);
