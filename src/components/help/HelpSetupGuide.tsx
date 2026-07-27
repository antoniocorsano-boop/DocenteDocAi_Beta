import React from 'react';
import Typography from '@mui/material/Typography';

const HelpSetupGuide: React.FC = () => (
    <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--md-sys-spacing-4)'
    }}>
        <Typography variant="h6">Guida alla Configurazione Iniziale</Typography>
        <Typography variant="body2" sx={{ color: 'var(--md-sys-color-on-surface)' }}>Segui questi passaggi per configurare OrarioDoc AI per il nuovo anno scolastico.</Typography>

        <div style={{
            backgroundColor: 'var(--md-sys-color-surface-container-low)',
            borderRadius: 'var(--md-sys-shape-corner-large)',
            padding: 'var(--md-sys-spacing-4)',
            border: `var(--md-sys-border-width-thin) solid var(--md-sys-color-outline-variant)`
        }}>
            <Typography variant="subtitle1" sx={{
                color: 'var(--md-sys-color-primary)',
                fontWeight: 'var(--md-sys-typescale-weight-bold)',
                marginBottom: 'var(--md-sys-spacing-3)'
            }}>1. Impostazioni Generali</Typography>
            <Typography variant="body2" sx={{
                color: 'var(--md-sys-color-on-surface)',
                marginBottom: 'var(--md-sys-spacing-3)'
            }}>Vai nel menu <strong>Impostazioni</strong> (icona ingranaggio in alto a destra).</Typography>
            <ul style={{
                margin: 0,
                paddingLeft: 'var(--md-sys-spacing-5)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--md-sys-spacing-2)',
                color: 'var(--md-sys-color-on-surface)'
            }}>
                <li>Inserisci il tuo Nome e l&apos;Istituto.</li>
                <li><strong>Importante:</strong> Nella sezione &quot;Generale&quot;, imposta le date di <strong>Inizio</strong> e <strong>Fine Attività Didattica</strong>. Queste date sono fondamentali per visualizzare correttamente la Timeline dei progetti.</li>
            </ul>
        </div>

        <div style={{
            backgroundColor: 'var(--md-sys-color-primary-container)',
            borderRadius: 'var(--md-sys-shape-corner-large)',
            padding: 'var(--md-sys-spacing-4)',
            border: `var(--md-sys-border-width-thin) solid var(--md-sys-color-primary)`
        }}>
            <Typography variant="subtitle1" sx={{
                color: 'var(--md-sys-color-on-primary-container)',
                fontWeight: 'var(--md-sys-typescale-weight-bold)',
                marginBottom: 'var(--md-sys-spacing-3)'
            }}>2. Configurazione Classi e Materie</Typography>
            <Typography variant="body2" sx={{
                color: 'var(--md-sys-color-on-primary-container)',
                marginBottom: 'var(--md-sys-spacing-3)'
            }}>Sempre in Impostazioni:</Typography>
            <ul style={{
                margin: 0,
                paddingLeft: 'var(--md-sys-spacing-5)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--md-sys-spacing-2)',
                color: 'var(--md-sys-color-on-primary-container)'
            }}>
                <li>Sezione <strong>Orario &amp; Materie</strong>: Aggiungi le materie che insegni.</li>
                <li>Sezione <strong>Classi</strong>: Seleziona le combinazioni Anno/Sezione (es. 1A, 3B) che avrai quest&apos;anno.</li>
            </ul>
        </div>

        <div style={{
            backgroundColor: 'var(--md-sys-color-primary-container)',
            borderRadius: 'var(--md-sys-shape-corner-large)',
            padding: 'var(--md-sys-spacing-4)',
            border: `var(--md-sys-border-width-thin) solid var(--md-sys-color-primary)`
        }}>
            <Typography variant="subtitle1" sx={{
                color: 'var(--md-sys-color-on-primary-container)',
                fontWeight: 'var(--md-sys-typescale-weight-bold)',
                marginBottom: 'var(--md-sys-spacing-3)'
            }}>3. Inserimento Studenti</Typography>
            <Typography variant="body2" sx={{
                color: 'var(--md-sys-color-on-primary-container)',
                marginBottom: 'var(--md-sys-spacing-3)'
            }}>Apri il <strong>Centro Operativo (⚡)</strong> e scegli &quot;Importa Studenti&quot;.</Typography>
            <ul style={{
                margin: 0,
                paddingLeft: 'var(--md-sys-spacing-5)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--md-sys-spacing-2)',
                color: 'var(--md-sys-color-on-primary-container)'
            }}>
                <li>Puoi aggiungere gli studenti manualmente uno ad uno.</li>
                <li>Oppure usa l&apos;importazione CSV per caricare l&apos;elenco completo da un file Excel/CSV.</li>
            </ul>
        </div>

        <div style={{
            backgroundColor: 'var(--md-sys-color-primary-container)',
            borderRadius: 'var(--md-sys-shape-corner-large)',
            padding: 'var(--md-sys-spacing-4)',
            border: `var(--md-sys-border-width-thin) solid var(--md-sys-color-primary)`
        }}>
            <Typography variant="subtitle1" sx={{
                color: 'var(--md-sys-color-on-primary-container)',
                fontWeight: 'var(--md-sys-typescale-weight-bold)',
                marginBottom: 'var(--md-sys-spacing-3)'
            }}>4. Costruzione Orario</Typography>
            <Typography variant="body2" sx={{
                color: 'var(--md-sys-color-on-primary-container)',
                marginBottom: 'var(--md-sys-spacing-3)'
            }}>Apri il <strong>Centro Operativo (⚡)</strong> e scegli &quot;Configura Orario&quot;.</Typography>
            <ul style={{
                margin: 0,
                paddingLeft: 'var(--md-sys-spacing-5)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--md-sys-spacing-2)',
                color: 'var(--md-sys-color-on-primary-container)'
            }}>
                <li>Assegna Classe e Materia per creare il tuo orario settimanale stabile.</li>
            </ul>
        </div>
    </div>
);

export default HelpSetupGuide;
