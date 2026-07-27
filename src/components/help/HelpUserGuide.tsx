import React from 'react';
import Typography from '@mui/material/Typography';

const HelpUserGuide: React.FC = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
        <Typography variant="h6">Guida Rapida al Flusso di Lavoro</Typography>
        <div style={{
            display: "grid",
            gridTemplateColumns: "var(--md-sys-grid-fr-1)",
            gap: 'var(--md-sys-spacing-8)',
            marginTop: 'var(--md-sys-spacing-6)'
        }}>
            <div style={{
                backgroundColor: 'var(--md-sys-color-surface-container-low)',
                borderRadius: 'var(--md-sys-shape-corner-large)',
                borderLeft: "var(--md-sys-border-width-normal) solid var(--md-sys-color-primary)",
                padding: 'var(--md-sys-spacing-4)'
            }}>
                <Typography variant="button" sx={{
                    color: 'var(--md-sys-color-primary)'
                }}>1. Centro Operativo</Typography>
                <Typography variant="body2" sx={{
                    lineHeight: "1.625",
                    opacity: "var(--md-sys-state-opacity-caption)"
                }}>Tutto parte dall&apos;icona <strong>Fulmine (⚡)</strong> in alto. Lì trovi i processi divisi per &quot;Quotidianità&quot; (Aula) e &quot;Progettazione&quot; (Strategia). Segui i pallini di suggerimento.</Typography>
            </div>
            <div style={{
                backgroundColor: 'var(--md-sys-color-surface-container-low)',
                borderRadius: 'var(--md-sys-shape-corner-large)',
                borderLeft: "var(--md-sys-border-width-normal) solid var(--md-sys-color-secondary)",
                padding: 'var(--md-sys-spacing-4)'
            }}>
                <Typography variant="button" sx={{
                    color: 'var(--md-sys-color-secondary)'
                }}>2. Progettazione Intelligente</Typography>
                <Typography variant="body2" sx={{
                    lineHeight: "1.625",
                    opacity: "var(--md-sys-state-opacity-caption)"
                }}>Carica i tuoi PDF nella <strong>Knowledge Base</strong>. Usa il <strong>Wizard Annuale</strong> nel Centro Operativo per creare percorsi didattici che l&apos;AI validerà automaticamente.</Typography>
            </div>
            <div style={{
                backgroundColor: 'var(--md-sys-color-surface-container-low)',
                borderRadius: 'var(--md-sys-shape-corner-large)',
                borderLeft: "var(--md-sys-border-width-normal) solid var(--md-sys-color-tertiary)",
                padding: 'var(--md-sys-spacing-4)'
            }}>
                <Typography variant="button" sx={{
                    color: 'var(--md-sys-color-tertiary)'
                }}>3. In Aula (Continuità)</Typography>
                <Typography variant="body2" sx={{
                    lineHeight: "1.625",
                    opacity: "var(--md-sys-state-opacity-caption)"
                }}>Quando apri una lezione, vedrai automaticamente il riepilogo della lezione precedente per riprendere il filo. Usa il <strong>Centro Operativo</strong> per avviare l&apos;Assistente Vocale.</Typography>
            </div>
            <div style={{
                backgroundColor: 'var(--md-sys-color-surface-container-low)',
                borderRadius: 'var(--md-sys-shape-corner-large)',
                borderLeft: "var(--md-sys-border-width-normal) solid var(--md-sys-color-error)",
                padding: 'var(--md-sys-spacing-4)'
            }}>
                <Typography variant="button" sx={{
                    color: 'var(--md-sys-color-error)'
                }}>4. Analisi &amp; Report</Typography>
                <Typography variant="body2" sx={{
                    lineHeight: "1.625",
                    opacity: "var(--md-sys-state-opacity-caption)"
                }}>Prima dei consigli di classe, visita l&apos;<strong>Analytics Hub</strong> per avere grafici chiari. Genera poi il PDF del verbale con un click.</Typography>
            </div>
        </div>
    </div>
);

export default HelpUserGuide;
