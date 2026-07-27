import React from 'react';
import Typography from '@mui/material/Typography';
import { sanitizeHtml } from '../../utils/htmlSanitizer';

export const faqContentData = [
    { q: "Cos'è il Centro Operativo (Fulmine)?", a: "È il cuore pulsante dell'app. Cliccando l'icona ⚡ in alto, accedi a tutti i flussi di lavoro (Lezione, Voti, Progettazione) organizzati per contesto. Se vedi un pallino rosso, significa che l'AI ha un suggerimento prioritario per te." },
    { q: "I documenti della KB vengono salvati su Drive come file PDF?", a: "<strong>No, non come file singoli.</strong> Il backup crea un unico archivio completo (`DocenteDoc_Backup.json`) che contiene <em>tutto</em>: voti, lezioni e anche i file della Knowledge Base. Questo mantiene il tuo Drive ordinato e garantisce che ripristinando il backup ritrovi tutto esattamente com'era." },
    { q: "A cosa servono i 'Traguardi' nella Home?", a: "Sono un sistema di <em>Gamification</em> per aiutarti a scoprire l'app. Completando azioni chiave (es. inserire la prima classe, creare un orario), sblocchi dei badge colorati. È un modo per monitorare i tuoi progressi nell'uso dello strumento." },
    { q: "Cosa posso chiedere all'Assistente Vocale?", a: "L'Assistente è ora connesso ai tuoi dati e al Web. Chiedi: 'Come va Rossi?', 'Cerca le ultime normative sull'esame di stato', 'Cerca nel regolamento d'istituto'. Può anche scrivere note e voti per te." },
    { q: "Il backup si blocca a metà?", a: "Abbiamo risolto un problema critico di 'Race Condition' che poteva interrompere il ripristino. Ora il sistema blocca il salvataggio automatico durante l'importazione per garantire l'integrità dei dati." },
];

const HelpFaq: React.FC = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
        <Typography variant="h6">Domande Frequenti (FAQ)</Typography>
        <div style={{
            marginTop: 'var(--md-sys-spacing-6)',
            display: "flex",
            flexDirection: "column",
            gap: 'var(--md-sys-spacing-3)'
        }}>
            {faqContentData.map((faq, i) => (
                <details key={i} style={{
                    transition: 'opacity, transform, background-color, color, border-color, box-shadow var(--md-sys-motion-duration-medium) var(--md-sys-motion-easing-standard)',
                    backgroundColor: 'var(--md-sys-color-surface-container-low)',
                    borderRadius: 'var(--md-sys-shape-corner-large)',
                    overflow: "hidden"
                }}>
                    <summary style={{
                        cursor: "pointer",
                        listStyle: "none",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: 'var(--md-sys-spacing-3)',
                        fontWeight: "var(--md-sys-typescale-weight-bold)"
                    }}>
                        <span dangerouslySetInnerHTML={{ __html: sanitizeHtml(faq.q) }}></span>
                        <span style={{
                            transition: "transform var(--md-sys-motion-duration-medium)",
                            fontSize: 'var(--md-sys-typescale--font-size)'
                        }}>expand_more</span>
                    </summary>
                    <div style={{
                        padding: 'var(--md-sys-spacing-3)',
                        fontFamily: 'var(--font-family)',
                        opacity: "var(--md-sys-state-opacity-caption)",
                        lineHeight: "1.625",
                        fontSize: 'var(--md-sys-typescale--font-size)'
                    }} dangerouslySetInnerHTML={{ __html: sanitizeHtml(faq.a) }}></div>
                </details>
            ))}
        </div>
    </div>
);

export default HelpFaq;
