// MD3 Gold Compliant
// Tutti gli stili usano esclusivamente token MD3 (nessun valore hardcoded)
// Audit: gennaio 2026
import React, { useState } from 'react';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import { M3Dialog } from './ui';
import { useUIStore } from '../stores/useUIStore';
interface DocumentGeneratorModalProps {
    onClose: () => void;
    onGenerate: (prompt: string) => void;
}

const DocumentGeneratorModal: React.FC<DocumentGeneratorModalProps> = ({ onClose, onGenerate }) => {
  const { showToast } = useUIStore(state => ({ showToast: state.actions.showToast }));
  const [prompt, setPrompt] = useState('');

    const handleSubmit = () => {
        if (!prompt.trim()) {
            showToast('Per favore, inserisci un prompt per il documento.', 'error');
            return;
        }
        onGenerate(prompt);
    };

    return (
        <M3Dialog
            title="Crea Documento Formattato"
            onClose={onClose}
            maxWidth="sm"
            buttons={
                <>
                    <Button type="button" onClick={onClose} variant="text">Annulla</Button>
                    <Button type="button" onClick={handleSubmit} variant="contained">
                        <Typography component="span" className="material-symbols-outlined" sx={{ mr: 'var(--md-sys-spacing-2)' }}>auto_awesome</Typography>
                        Genera Documento
                    </Button>
                </>
            }
        >
            <Box component="form" id="doc-generator-form" onSubmit={(e: React.FormEvent) => { e.preventDefault(); handleSubmit(); }} sx={{ gap: 'var(--md-sys-spacing-6)', display: 'flex', flexDirection: 'column' }}>
                    <TextField multiline
                        id="doc-generator-prompt"
                        label="Descrivi il documento che vuoi creare"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        rows={6}
                        placeholder="Es. 'Scrivi una relazione dettagliata sul Rinascimento italiano, organizzata in sezioni per arte, scienza e politica.'..."
                        autoFocus
                    />
            </Box>
        </M3Dialog>
    );
};

export default DocumentGeneratorModal;

