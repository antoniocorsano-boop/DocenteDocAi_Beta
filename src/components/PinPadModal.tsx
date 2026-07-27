// MD3 Compliant - Block O Migration Complete (5 violations eliminated)
// Note: Circular indicators use functional borderRadius with eslint-disable comments

import React, { useState, useEffect } from 'react';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { M3Dialog, PinPad } from './ui';
interface PinPadModalProps {
    title: string;
    correctPin: string;
    onSuccess: () => void;
    onCancel: () => void;
}

const PinPadModal: React.FC<PinPadModalProps> = ({ title, correctPin, onSuccess, onCancel }) => {
  const [pin, setPin] = useState('');
    const [error, setError] = useState(false);

    useEffect(() => {
        if (pin.length === 4) {
            if (pin === correctPin) {
                onSuccess();
            } else {
                setError(true);
                setTimeout(() => {
                    setPin('');
                    setError(false);
                }, 500);
            }
        }
    }, [pin, correctPin, onSuccess]);

    const handleInput = (digit: string) => {
        if (pin.length < 4) {
            setPin(prev => prev + digit);
            setError(false);
        }
    };

    const handleDelete = () => {
        setPin(prev => prev.slice(0, -1));
        setError(false);
    };

    return (
        <M3Dialog
            title={title}
            onClose={onCancel}
            maxWidth="sm"
        >
            <Box sx={{ backgroundColor: 'color-mix(in srgb, var(--md-sys-color-surface-container-high) 30%, transparent)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: 'var(--md-sys-percent-100)' }}>
                <div style={{textAlign: "center", marginBottom: 'var(--md-sys-spacing-8)'}}>
                    <div style={{ color: 'var(--md-sys-color-on-primary-container)' , width: 'var(--md-sys-spacing-4)', height: 'var(--md-sys-spacing-4)', backgroundColor: "var(--md-sys-color-primary)", borderRadius: 'var(--md-sys-spacing-4)', display: "flex", alignItems: "center", justifyContent: "center", marginLeft: "var(--md-sys-margin-auto)", marginRight: "var(--md-sys-margin-auto)", marginBottom: 'var(--md-sys-spacing-8)'}}>
                        <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ color: 'var(--md-sys-color-primary)' }}>lock</Box>
                    </div>
                    <Typography component="p" variant="body1" sx={{ color: 'var(--md-sys-color-on-surface-variant)' , marginTop: 'var(--md-sys-spacing-4)'}}>Inserisci il PIN docente per uscire</Typography>
                </div>

                {/* PIN Display */}
                <div style={{display: "flex", justifyContent: "center", gap: 'var(--md-sys-spacing-8)', marginBottom: 'var(--md-sys-spacing-8)'}}>
                    {[0, 1, 2, 3].map((i) => (
                        <div 
                            key={i}
                            style={{
                                width: 'var(--md-sys-spacing-4)', // MD3 spacing token
                                height: 'var(--md-sys-spacing-4)', // MD3 spacing token
                                
                                borderRadius: 'var(--md-sys-shape-corner-full)', // circular indicator
                                
                                transition: 'opacity, transform, background-color, color, border-color, box-shadow var(--md-sys-motion-duration-short)', // transition-all duration-200
                                backgroundColor: i < pin.length 
                                    ? (error ? 'var(--md-sys-color-error)' : 'var(--md-sys-color-primary)')
                                    : 'var(--md-sys-color-surface-container-high)',
                                border: i >= pin.length ? `var(--md-sys-border-width-thin) solid var(--md-sys-color-outline)` : 'none',
                                transform: i < pin.length ? `scale(${error ? 1.25 : 1.1})` : 'scale(1)'
                            }}
                        />
                    ))}
                </div>

                {error && (
                    <Typography component="p" variant="body1" sx={{color: "var(--md-sys-color-error)", textAlign: "center", fontSize: "var(--md-sys-typescale-body-medium-font-size)", fontWeight: "var(--md-sys-typescale-weight-bold)", marginBottom: 'var(--md-sys-spacing-8)'}}>PIN Errato</Typography>
                )}

                <PinPad onInput={handleInput} onDelete={handleDelete} />

                <Button onClick={onCancel} variant="text" sx={{ width: 'var(--md-sys-percent-100)' }}>
                    Annulla
                </Button>
            </Box>
        </M3Dialog>
    );
};

export default PinPadModal;

