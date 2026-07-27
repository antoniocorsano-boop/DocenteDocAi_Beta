import React from 'react';
import Typography from '@mui/material/Typography';
import { InfoCard } from '../ui';

const HelpNormativa: React.FC = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
        <Typography variant="h6">Privacy e Cloud</Typography>
        <Typography variant="body2" sx={{
            color: 'var(--md-sys-color-on-surface)',
            lineHeight: "1.625"
        }}>OrarioDoc AI adotta un approccio <strong>privacy-by-design</strong> innovativo.</Typography>
        
        <div style={{
            backgroundColor: 'var(--md-sys-color-surface-container-low)',
            borderRadius: 'var(--md-sys-shape-corner-extra-large)',
            padding: 'var(--md-sys-spacing-4)'
        }}>
            <Typography variant="subtitle1" sx={{
                fontWeight: "var(--md-sys-typescale-weight-bold)",
                color: 'var(--md-sys-color-primary)'
            }}>I Tuoi Dati, Il Tuo Cloud</Typography>
            <ul style={{
                display: "flex",
                flexDirection: "column",
                gap: 'var(--md-sys-spacing-3)'
            }}>
                <li style={{
                    fontSize: 'var(--md-sys-typescale--font-size)',
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 'var(--md-sys-spacing-2)'
                }}>
                    <span style={{
                        color: 'var(--md-sys-color-primary)',
                        fontSize: 'var(--md-sys-typescale--font-size)',
                        marginTop: 'var(--md-sys-spacing-1)',
                        flexShrink: 0
                    }}>shield</span>
                    Non esiste un server centrale di OrarioDoc che legge i tuoi dati.
                </li>
                <li style={{
                    fontSize: 'var(--md-sys-typescale--font-size)',
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 'var(--md-sys-spacing-2)'
                }}>
                    <span style={{
                        color: 'var(--md-sys-color-primary)',
                        fontSize: 'var(--md-sys-typescale--font-size)',
                        marginTop: 'var(--md-sys-spacing-1)',
                        flexShrink: 0
                    }}>devices</span>
                    Tutto viene salvato nel tuo dispositivo (IndexedDB).
                </li>
                <li style={{
                    fontSize: 'var(--md-sys-typescale--font-size)',
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 'var(--md-sys-spacing-2)'
                }}>
                    <span style={{
                        color: 'var(--md-sys-color-primary)',
                        fontSize: 'var(--md-sys-typescale--font-size)',
                        marginTop: 'var(--md-sys-spacing-1)',
                        flexShrink: 0
                    }}>cloud_done</span>
                    Il backup avviene sul <strong>TUO Google Drive</strong> personale. L&apos;app ha accesso solo alla propria cartella di backup.
                </li>
            </ul>
        </div>

        <div style={{ backgroundColor: 'var(--md-sys-color-primary-container)' }}>
            <InfoCard 
                title="Interazione AI"
                description="Quando usi l'AI (es. 'Analizza questa classe'), l'app invia solo i dati anonimizzati strettamente necessari per quella richiesta a Google Gemini. Nessun dato viene trattenuto per l'addestramento dei modelli."
                icon="psychology"
                variant="contained"
            />
        </div>
    </div>
);

export default HelpNormativa;
