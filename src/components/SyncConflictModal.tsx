// MD3 Compliant - Migration completed
// SyncConflictModal.tsx - All styling uses MD3 tokens via style props

import React from 'react';
import { SyncConflictData } from '../types';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import { M3Dialog, InfoCard } from './ui';
interface SyncConflictModalProps {
    data: SyncConflictData;
    onRestore: () => void;
    onIgnore: () => void;
}

const SyncConflictModal: React.FC<SyncConflictModalProps> = ({ data, onRestore, onIgnore }) => {
  // Determina quale è più recente
    const isRemoteNewer = (data.remoteTime ?? data.lastModifiedRemote ?? 0) > (data.localTime ?? data.lastModifiedLocal ?? 0);
    const remoteDate = new Date(data.remoteTime ?? data.lastModifiedRemote ?? 0);
    const localDate = (data.localTime ?? data.lastModifiedLocal) ? new Date((data.localTime ?? data.lastModifiedLocal)!) : null;

    return (
        <M3Dialog
            onClose={onIgnore}
            title="Conflitto Sincronizzazione"
            maxWidth="sm"
            buttons={<>
                <Button onClick={onIgnore} variant="text">Mantieni Dati Locali</Button>
                <Button onClick={onRestore} variant="contained" startIcon={<Box component="span" className="material-symbols-outlined" aria-hidden="true">download</Box>}>
                    Sincronizza dal Cloud
                </Button>
            </>}
        >
            <Box sx={{ backgroundColor: 'color-mix(in srgb, var(--md-sys-color-surface-container-high) var(--md-sys-percent-30), transparent)' }}>
                <div style={{display: "flex", flexDirection: "column", gap: 'var(--md-sys-spacing-6)', paddingTop: 'var(--md-sys-spacing-4)', paddingBottom: 'var(--md-sys-spacing-4)'}}>
                    <div style={{display: "flex", flexDirection: "column", gap: 'var(--md-sys-spacing-6)'}}>
                        {/* LOCAL CARD */}
                                                <div
                                                    style={{
                                                        padding: 'var(--md-sys-spacing-8)',
                                                        borderRadius: 'var(--md-sys-shape-corner-extra-large)',
                                                        border: 'var(--md-sys-border-width-normal) solid var(--md-sys-color-outline)',
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        backgroundColor: !isRemoteNewer ? 'var(--md-sys-color-secondary-container)' : 'var(--md-sys-color-surface-container-low)',
                                                        boxShadow: !isRemoteNewer ? 'var(--md-sys-elevation-level1)' : undefined,
                                                        opacity: !isRemoteNewer ? 1 : 0.7,
                                                        transform: !isRemoteNewer ? 'scale(1.02)' : undefined,
                                                        transition: 'opacity, transform, background-color, color, border-color, box-shadow var(--md-sys-motion-duration-medium) var(--md-sys-motion-easing-standard)' }}
                                                >
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                                <Typography component="p" variant="caption" sx={{fontSize: 'var(--md-sys-typescale-label-large-font-size)', fontWeight: "var(--md-sys-typescale-weight-bold)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 'var(--md-sys-spacing-4)', display: "flex", alignItems: "center", gap: 'var(--md-sys-spacing-4)'}}>
                                    <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 'var(--md-sys-typescale-body-large-font-size)' }}>devices</Box>
                                    Dati Locali (Attuali)
                                </Typography>
                                <Typography component="p" variant="subtitle1" sx={{ color: 'var(--md-sys-color-on-primary)', fontSize: 'var(--md-sys-typescale-body-large-font-size)', fontWeight: "var(--md-sys-typescale-weight-black)" }}>
                                    {localDate ? localDate.toLocaleString() : 'Nessun dato'}
                                </Typography>
                            </div>
                            {!isRemoteNewer && <Chip label="Più Recente" size="small" sx={{ backgroundColor: 'var(--md-sys-color-secondary)', color: 'var(--md-sys-color-on-secondary-container)', fontWeight: 'var(--md-sys-typescale-weight-black)', textTransform: 'uppercase', letterSpacing: '0.05em', borderRadius: 'var(--md-sys-spacing-2)' }} />}
                        </div>

                        {/* DIRECTION ARROW */}
                        <div  style={{ display: "flex", justifyContent: "center" }}>
                            <div style={{ backgroundColor: 'var(--md-sys-color-surface-container-high)', borderRadius: 'var(--md-sys-spacing-2)', padding: 'var(--md-sys-spacing-8)', color: "var(--md-sys-color-primary)" }}>
                                <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ display: "block" }}>sync_problem</Box>
                            </div>
                        </div>

                        {/* REMOTE CARD */}
                                                <div
                                                    style={{
                                                        padding: 'var(--md-sys-spacing-8)',
                                                        borderRadius: 'var(--md-sys-shape-corner-extra-large)',
                                                        border: 'var(--md-sys-border-width-normal) solid var(--md-sys-color-outline)',
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        backgroundColor: isRemoteNewer ? 'var(--md-sys-color-primary-container)' : 'var(--md-sys-color-surface-container-low)',
                                                        boxShadow: isRemoteNewer ? 'var(--md-sys-elevation-level2)' : undefined,
                                                        opacity: isRemoteNewer ? 0.8 : 1,
                                                        transform: isRemoteNewer ? 'scale(1.02)' : undefined,
                                                        transition: 'opacity, transform, background-color, color, border-color, box-shadow var(--md-sys-motion-duration-medium) var(--md-sys-motion-easing-standard)' }}
                                                >
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                                <Typography component="p" variant="caption" sx={{fontSize: 'var(--md-sys-typescale-label-large-font-size)', fontWeight: "var(--md-sys-typescale-weight-bold)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 'var(--md-sys-spacing-4)', display: "flex", alignItems: "center", gap: 'var(--md-sys-spacing-4)'}}>
                                    <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 'var(--md-sys-typescale-body-large-font-size)' }}>cloud</Box>
                                    Cloud (Drive)
                                </Typography>
                                <Typography component="p" variant="subtitle1" sx={{fontSize: 'var(--md-sys-typescale-body-large-font-size)', fontWeight: "var(--md-sys-typescale-weight-black)", color: "var(--md-sys-color-primary)"}}>
                                    {remoteDate.toLocaleString()}
                                </Typography>
                            </div>
                            {isRemoteNewer && <Chip label="Consigliato" size="small" sx={{ backgroundColor: 'var(--md-sys-color-primary)', color: 'var(--md-sys-color-on-primary)', fontWeight: 'var(--md-sys-typescale-weight-black)', textTransform: 'uppercase', letterSpacing: '0.05em', borderRadius: 'var(--md-sys-spacing-2)' }} />}
                        </div>
                    </div>

                    <InfoCard 
                        type="warning" 
                        message="Se scegli di sincronizzare dal Cloud, i dati locali verranno sovrascritti definitivamente." 
                    />
                </div>
            </Box>
        </M3Dialog>
    );
};

export default SyncConflictModal;

