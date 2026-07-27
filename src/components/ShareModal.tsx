// MD3 Gold Compliant

import React, { useState } from 'react';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { M3Dialog } from './ui';
import { logger } from '../utils/logger';
import { useUIStore } from '../stores/useUIStore';

interface ShareModalProps {
    title: string;
    text: string;
    onClose: () => void;
}

const ShareModal: React.FC<ShareModalProps> = ({ title, text, onClose }) => {
    const { showToast } = useUIStore(state => ({ showToast: state.actions.showToast }));
    const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');

    const handleSimpleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: title,
                    text: text });
                onClose();
            } catch (error) {
                logger.error('Error sharing:', error);
            }
        } else {
            showToast('La condivisione nativa non è supportata su questo browser.', 'info');
        }
    };

    const handleCopyFormatted = () => {
        const markdownText = text.split('\n').map(line => {
            const trimmed = line.trim();
            if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                return trimmed;
            }
            return `- ${trimmed}`;
        }).join('\n');

        navigator.clipboard.writeText(markdownText).then(() => {
            setCopyStatus('copied');
            setTimeout(() => {
                setCopyStatus('idle');
                onClose();
            }, 1500);
        }).catch(err => {
            logger.error('Failed to copy markdown text: ', err);
            showToast('Impossibile copiare il testo formattato.', 'error');
        });
    };

    return (
        <M3Dialog
            onClose={onClose}
            title="Condividi"
            maxWidth="sm"
            buttons={<Button onClick={onClose} variant="text">Chiudi</Button>}
        >
            <Box sx={{ backgroundColor: 'var(--md-sys-color-surface-container-high)', opacity: 'var(--md-sys-state-opacity-tint-moderate)', gap: 'var(--md-sys-spacing-4)' }}>
                <Typography component="p" variant="body1" sx={{ color: 'var(--md-sys-color-on-surface-variant)', paddingLeft: 'var(--md-sys-spacing-4)', paddingRight: 'var(--md-sys-spacing-4)' }}>Scegli come condividere il contenuto</Typography>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-6)' }}>
                    <button 
                        onClick={handleSimpleShare} 
                        style={{
                            borderRadius: 'var(--md-sys-shape-corner-large)',
                            backgroundColor: 'var(--md-sys-color-surface-container-lowest)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--md-sys-spacing-8)',
                            padding: 'var(--md-sys-spacing-8)',
                            transition: 'opacity, transform, background-color, color, border-color, box-shadow var(--md-sys-motion-duration-medium) var(--md-sys-motion-easing-standard)',
                            textAlign: 'left',
                            border: 'var(--md-sys-border-width-normal) solid var(--md-sys-color-outline)'
                        }}
                    >
                        <div style={{
                            borderRadius: 'var(--md-sys-shape-corner-large)',
                            width: 'var(--md-sys-spacing-4)',
                            height: 'var(--md-sys-spacing-4)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'transform var(--md-sys-motion-duration-medium)',
                            color: 'var(--md-sys-color-on-secondary-container)',
                            backgroundColor: 'var(--md-sys-color-secondary-container)'
                        }}>
                            <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 'var(--icon-size-medium)' }}>share</Box>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                            <Typography variant="subtitle2">Condividi via...</Typography>
                            <Typography variant="body2" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>WhatsApp, Email, Drive</Typography>
                        </div>
                    </button>

                    <button 
                        onClick={handleCopyFormatted} 
                        style={{
                            borderRadius: 'var(--md-sys-shape-corner-large)',
                            backgroundColor: 'var(--md-sys-color-surface-container-lowest)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--md-sys-spacing-8)',
                            padding: 'var(--md-sys-spacing-8)',
                            transition: 'opacity, transform, background-color, color, border-color, box-shadow var(--md-sys-motion-duration-medium) var(--md-sys-motion-easing-standard)',
                            textAlign: 'left',
                            border: 'var(--md-sys-border-width-normal) solid var(--md-sys-color-outline)'
                        }}
                    >
                        <div style={{
                            borderRadius: 'var(--md-sys-shape-corner-large)',
                            width: 'var(--md-sys-spacing-4)',
                            height: 'var(--md-sys-spacing-4)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'transform var(--md-sys-motion-duration-medium)',
                            color: 'var(--md-sys-color-on-tertiary-container)',
                            backgroundColor: 'var(--md-sys-color-tertiary-container)'
                        }}>
                            <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 'var(--icon-size-medium)' }}>{copyStatus === 'copied' ? 'check' : 'content_paste'}</Box>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                            <Typography variant="subtitle2">{copyStatus === 'copied' ? 'Copiato!' : 'Copia Formattato'}</Typography>
                            <Typography variant="body2" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Per registro elettronico o Padlet</Typography>
                        </div>
                    </button>
                </div>
            </Box>
        </M3Dialog>
    );
};

export default ShareModal;

