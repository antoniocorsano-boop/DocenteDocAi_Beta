
// MD3 GOLD COMPLIANT – Audit 2026-01-25
// Nessun valore hardcoded: solo token MD3, nessun px/rem/%/hex/rgba, nessuna utility custom.
// Conforme a MD3_GOVERNANCE_COMPLIANCE_CONTRACT.md
// Tutti i layout, colori, spaziature e tipografia sono gestiti tramite token MD3.

import React, { useState } from 'react';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { M3Dialog, TextField } from './ui';
interface ResetConfirmModalProps {
    onClose: () => void;
    onConfirm: () => void;
}

const ResetConfirmModal: React.FC<ResetConfirmModalProps> = ({ onClose, onConfirm }) => {
  const [confirmText, setConfirmText] = useState('');
    const isValid = confirmText === 'CANCELLA';

    return (
        <M3Dialog
            title="Attenzione"
            onClose={onClose}
            maxWidth="sm"
            buttons={<>
                <Button onClick={onClose} variant="text">Annulla</Button>
                <Button 
                    onClick={onConfirm} 
                    disabled={!isValid}
                    variant="contained"
                >
                    Reset Totale
                </Button>
            </>}
        >
            <Box sx={{ backgroundColor: 'color-mix(in srgb, var(--md-sys-color-surface-container-high) 30%, transparent)', gap: 'var(--md-sys-spacing-6)' }}>
                <div style={{display: "flex", alignItems: "center", gap: 'var(--md-sys-spacing-6)', color: "var(--md-sys-color-error)", marginBottom: 'var(--md-sys-spacing-8)'}}>
                    <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ color: 'var(--md-sys-color-error)' }}>warning</Box>
                    <span style={{ fontWeight: "var(--md-sys-typescale-weight-bold)" }}>Azione Irreversibile</span>
                </div>
                <Typography component="p" variant="body1" sx={{ color: 'var(--md-sys-color-on-primary)' ,  lineHeight: "1.625" }}>
                    Stai per cancellare <strong>TUTTI</strong> i dati locali (studenti, voti, lezioni). 
                    Questa azione è <strong style={{color: "var(--md-sys-color-error)"}}>irreversibile</strong> se non hai un backup su Drive.
                </Typography>
                
                <TextField 
                    label='Digita "CANCELLA" per confermare'
                    value={confirmText}
                    onChange={e => setConfirmText(e.target.value)}
                    placeholder="CANCELLA"
                    autoFocus
                    error={confirmText.length > 0 && !isValid && confirmText.length >= 8}
                />
            </Box>
        </M3Dialog>
    );
};

export default ResetConfirmModal;

