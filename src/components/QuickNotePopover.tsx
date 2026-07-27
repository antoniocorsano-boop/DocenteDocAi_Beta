// MD3 Compliant

// M3Expressive: QuickNotePopover - Quick note input popover with voice recording
import React, { useState } from 'react';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import { M3Popover, TextField } from './ui';
import VoiceNoteRecorder from './VoiceNoteRecorder';

interface QuickNotePopoverProps {
    anchorEl: HTMLElement | null;
    initialValue: string;
    onSave: (note: string) => void;
    onClose: () => void;
}

const QuickNotePopover: React.FC<QuickNotePopoverProps> = ({ anchorEl, initialValue, onSave, onClose }) => {
    const [note, setNote] = useState(initialValue);

    const handleSave = () => {
        onSave(note);
        onClose();
    };

    const handleTranscription = (text: string) => {
        setNote(prev => prev ? `${prev} ${text}` : text);
    };

    return (
        <M3Popover
            open={Boolean(anchorEl)}
            anchorEl={anchorEl}
            onClose={onClose}
            minWidth={300}
            maxWidth={300}
        >
            {/* Header */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                <h3>
                    Nota Rapida
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                    <VoiceNoteRecorder onTranscription={handleTranscription} compact={true} />
                    <button
                        onClick={onClose}
                        
                        aria-label="Chiudi nota"
                    >
                        <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 'var(--md-sys-typescale-body-medium-font-size)' }}>
                            close
                        </Box>
                    </button>
                </div>
            </div>

            {/* Content */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                <TextField
                    multiline
                    rows={4}
                    fullWidth
                    placeholder="Scrivi una nota..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    autoFocus
                />

                {/* Save Button */}
                <Button
                    variant="contained"
                    fullWidth
                    onClick={handleSave}
                >
                    Salva Nota
                </Button>
            </div>
        </M3Popover>
    );
};

export default QuickNotePopover;

