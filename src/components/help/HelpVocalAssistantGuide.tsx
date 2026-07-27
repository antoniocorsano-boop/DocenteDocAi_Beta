import React from 'react';
import Typography from '@mui/material/Typography';
import { InfoCard } from '../ui';

export const vocalAssistantGuideData = {
    title: "Prompt Book: Assistente Vocale",
    sections: [
        {
            title: "Analisi & Dati (Lettura)",
            commands: [
                "Come sta andando lo studente Rossi?",
                "Qual è la media di matematica della 3A?",
                "Fammi un riepilogo della situazione disciplinare.",
                "Cosa ho in orario domani mattina?",
                "Quali sono le misure compensative per Verdi?"
            ]
        },
        {
            title: "Operatività (Scrittura)",
            commands: [
                "Pianifica una lezione di Storia per lunedì alle 8 su Napoleone.",
                "Metti 7 e mezzo a Bianchi nell'interrogazione di oggi.",
                "Aggiungi una nota a Rossi: non ha fatto i compiti.",
                "Segna tutti presenti tranne Gialli.",
                "Crea un evento 'Consiglio di Classe' per il 15 maggio."
            ]
        },
        {
            title: "Ricerca Web & Knowledge Base",
            commands: [
                "Cerca sul web le ultime normative sull'Esame di Stato.",
                "Trova notizie recenti sull'intelligenza artificiale a scuola.",
                "Cerca nel regolamento d'istituto la procedura uscite (KB).",
                "Cosa dice la programmazione di Storia sul Risorgimento? (KB)"
            ]
        }
    ]
};

const HelpVocalAssistantGuide: React.FC = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
        <Typography variant="button" sx={{
            display: "flex",
            alignItems: "center",
            gap: 'var(--md-sys-spacing-2)'
        }}>
            <span style={{
                color: 'var(--md-sys-color-primary)'
            }}>mic</span>
            Il tuo Copilota Didattico
        </Typography>
        <Typography variant="body2" sx={{
            color: 'var(--md-sys-color-on-surface)',
            lineHeight: "1.625"
        }}>
            L&apos;Assistente Live non è solo una chat: è collegato al registro, ai tuoi documenti e ora anche a <strong>Google Search</strong>. Premi il microfono e prova questi comandi:
        </Typography>
        
        <div style={{
            display: "grid",
            gridTemplateColumns: "var(--md-sys-grid-fr-1)",
            gap: 'var(--md-sys-spacing-8)'
        }}>
            {vocalAssistantGuideData.sections.map((section, idx) => (
                <div key={idx} style={{
                    backgroundColor: 'var(--md-sys-color-surface-container-low)',
                    padding: 'var(--md-sys-spacing-5)',
                    borderRadius: 'var(--md-sys-shape-corner-large)',
                    border: "var(--md-sys-border-width-thin) solid var(--md-sys-color-outline-variant)"
                }}>
                    <Typography variant="subtitle1" sx={{
                        color: 'var(--md-sys-color-primary)',
                        fontWeight: "var(--md-sys-typescale-weight-bold)",
                        marginBottom: 'var(--md-sys-spacing-6)',
                        display: "flex",
                        alignItems: "center",
                        gap: 'var(--md-sys-spacing-4)'
                    }}>
                        <span style={{
                            fontSize: 'var(--md-sys-typescale--font-size)'
                        }}>record_voice_over</span>
                        {section.title}
                    </Typography>
                    <ul style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 'var(--md-sys-spacing-3)'
                    }}>
                        {section.commands.map((cmd, cIdx) => (
                            <li key={cIdx} style={{
                                fontSize: 'var(--md-sys-typescale--font-size)',
                                color: 'var(--md-sys-color-on-surface)',
                                backgroundColor: 'var(--md-sys-color-surface-container-high)',
                                borderRadius: 'var(--md-sys-shape-corner-medium)',
                                padding: 'var(--md-sys-spacing-2)',
                                fontFamily: 'var(--font-family)'
                            }}>&quot;{cmd}&quot;</li>
                        ))}
                    </ul>
                </div>
            ))}
        </div>
        
        <div style={{ backgroundColor: 'var(--md-sys-color-secondary-container)' }}>
            <InfoCard 
                title="Novità: Ricerca Web Sicura"
                description="Puoi chiedere all'AI di cercare informazioni aggiornate su Google (es. normative recenti). Nota di Sicurezza: Per motivi di privacy, l'AI non userà mai la ricerca web se la tua domanda contiene nomi di studenti."
                icon="search"
                variant="outlined"
            />
        </div>
    </div>
);

export default HelpVocalAssistantGuide;
