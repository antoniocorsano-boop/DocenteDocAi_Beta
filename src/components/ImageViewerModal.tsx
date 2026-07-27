// MD3 Gold Compliant
// Tutti gli stili usano esclusivamente token MD3 (nessun valore hardcoded)
// Audit: gennaio 2026
import React from 'react';
import { saveAs } from '../utils/documentUtils';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { M3Dialog } from './ui';

interface ImageViewerModalProps {
    prompt: string;
    imageData: string;
    mimeType: string;
    onClose: () => void;
    onSaveToKb: (prompt: string, imageData: { data: string, mimeType: string }) => void;
}

const ImageViewerModal: React.FC<ImageViewerModalProps> = ({ prompt, imageData, mimeType, onClose, onSaveToKb }) => {
  const dataUrl = `data:${mimeType};base64,${imageData}`;

    const handleDownload = () => {
        fetch(dataUrl)
            .then(res => res.blob())
            .then(blob => {
                saveAs(blob, `AI_Image_${prompt.substring(0, 20).replace(/\s/g, '_')}.jpg`);
            });
    };
    
    const handleSave = () => {
        onSaveToKb(prompt, { data: imageData, mimeType });
    };

    return (
        <M3Dialog
            title="Immagine Generata"
            onClose={onClose}
            maxWidth="lg"
            buttons={
                <>
                    <Button onClick={handleSave} variant="outlined">
                        <Box component="span" className="material-symbols-outlined" sx={{ mr: 'var(--md-sys-spacing-2)' }}>save</Box>
                        Salva in Knowledge Base
                    </Button>
                    <Button onClick={onClose} variant="text">Chiudi</Button>
                    <Button onClick={handleDownload} variant="contained">
                        <Box component="span" className="material-symbols-outlined" sx={{ mr: 'var(--md-sys-spacing-2)' }}>download</Box>
                        Scarica
                    </Button>
                </>
            }
        >
            <Box sx={{ backgroundColor: 'color-mix(in srgb, var(--md-sys-color-surface-container-high) 30%, transparent)', display: 'flex', justifyContent: 'center', alignItems: 'center', p: 'var(--md-sys-spacing-6)' }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                    <img 
                        src={dataUrl} 
                        alt={prompt} 
                        style={{ borderRadius: 'var(--md-sys-shape-corner-large)', maxWidth: 'var(--md-sys-percent-100)', border: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline)' }} 
                    />
                    <Box sx={{ backgroundColor: 'color-mix(in srgb, var(--md-sys-color-scrim) 40%, transparent)', borderRadius: 'var(--md-sys-shape-corner-large)', p: 'var(--md-sys-spacing-8)', opacity: 0, transition: 'opacity var(--md-sys-motion-duration-medium)' }}>
                        <Typography component="p" sx={{ color: 'var(--md-sys-color-surface)', fontSize: 'var(--md-sys-typescale-body-large-font-size)', fontWeight: 'var(--md-sys-typescale-weight-medium)' }}>"{prompt}"</Typography>
                    </Box>
                </Box>
            </Box>
        </M3Dialog>
    );
};

export default ImageViewerModal;

