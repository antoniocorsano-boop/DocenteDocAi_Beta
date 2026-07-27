// MD3 Compliant
import React, { useState } from 'react';
import { sanitizeHTML } from '../utils/securityUtils';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import { M3Dialog } from './ui';
import { logger } from '../utils/logger';
import { useUIStore } from '../stores/useUIStore';
interface DocumentViewerModalProps {
    title: string;
    htmlContent: string;
    onClose: () => void;
    onSaveToKb?: (isFormattedDoc: boolean, data: { title: string, content: string, htmlContent: string }) => void;
    onOpenCreateLesson?: (content: { title: string; htmlContent: string }) => void;
}

const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({ title, htmlContent, onClose, onSaveToKb, onOpenCreateLesson }) => {
  const { showToast } = useUIStore(state => ({ showToast: state.actions.showToast }));
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');

    // Sanitize content before rendering to prevent XSS
    const safeHtml = sanitizeHTML(htmlContent);

    const handleCopyToClipboard = () => {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = safeHtml;
        const textContent = tempDiv.textContent || tempDiv.innerText || '';
        navigator.clipboard.writeText(textContent).then(() => {
            setCopyStatus('copied');
            setTimeout(() => setCopyStatus('idle'), 2000);
        }).catch(err => {
            logger.error('Failed to copy text: ', err);
            showToast('Impossibile copiare il testo.', 'error');
        });
    };

    const handleSave = () => {
        if (!onSaveToKb) return;
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = safeHtml;
        const textContent = tempDiv.textContent || tempDiv.innerText || '';
        onSaveToKb(true, {
            title: title,
            content: textContent,
            htmlContent: safeHtml
        });
    };

    const handleCreateLesson = () => {
        if (onOpenCreateLesson) {
            onOpenCreateLesson({ title, htmlContent: safeHtml });
            onClose();
        }
    };

    return (
        <M3Dialog
            title={`Anteprima: ${title}`}
            onClose={onClose}
            maxWidth="xl"
            buttons={
                <>
                    {onSaveToKb && (
                        <Button onClick={handleSave} variant="outlined">
                            <Box component="span" className="material-symbols-outlined" sx={{ mr: 'var(--md-sys-spacing-2)' }}>save</Box>
                            Salva in KB
                        </Button>
                    )}
                    <Button onClick={onClose} variant="text">Chiudi</Button>
                    <Button onClick={handleCopyToClipboard} variant="contained" color="secondary">
                        <Box component="span" className="material-symbols-outlined" sx={{ mr: 'var(--md-sys-spacing-2)' }}>{copyStatus === 'copied' ? 'check' : 'content_copy'}</Box>
                        {copyStatus === 'copied' ? 'Copiato!' : 'Copia Testo'}
                    </Button>
                    {onOpenCreateLesson && (
                        <Button onClick={handleCreateLesson} variant="contained">
                            <Box component="span" className="material-symbols-outlined" sx={{ mr: 'var(--md-sys-spacing-2)' }}>add_task</Box>
                            Crea Lezione
                        </Button>
                    )}
                </>
            }
        >
            {!safeHtml ? (
                 <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <Box sx={{ borderRadius: 'var(--md-sys-spacing-4)', height: 'var(--md-sys-spacing-4)', width: 'var(--md-sys-spacing-4)', borderColor: 'var(--md-sys-color-primary)' }} />
                </Box>
            ) : (
                <div
                    dangerouslySetInnerHTML={{ __html: safeHtml }}
                />
            )}
        </M3Dialog>
    );
};

export default DocumentViewerModal;

