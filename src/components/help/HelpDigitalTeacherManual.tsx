import React from 'react';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import { ManualSection, UseCaseCard } from '../help';
import { InfoCard } from '../ui';
import { saveAs } from '../../utils/documentUtils';

export const MANUAL_MARKDOWN_CONTENT = `# DocenteDoc AI: Documento Tecnico e Manuale Integrale
**Versione 4.1.0 - M3 Expressive Edition**

---

## 📑 Sommario Esecutivo
Questo documento costituisce la guida di riferimento completa per **DocenteDoc AI**, definendo non solo le procedure operative, ma il perimetro normativo, tecnologico e strategico della soluzione. È destinato a Docenti, Animatori Digitali, DPO e Dirigenti Scolastici.

---

## 1. ⚖️ Quadro Normativo e Sicurezza (Compliance)

### 1.1 Conformità GDPR (Regolamento UE 2016/679)
DocenteDoc AI adotta un approccio radicale di **Privacy by Design**:
*   **Sovranità del Dato:** L'applicazione opera secondo il paradigma "Local-First". Nessun dato personale (studenti, voti, note) viene inviato a server proprietari del fornitore del software.
*   **Minimizzazione:** L'AI accede ai dati solo su esplicita richiesta dell'utente e solo per il contesto necessario.
*   **Diritto all'Oblio:** La cancellazione dei dati dal dispositivo è definitiva e irreversibile da parte di terzi.

### 1.2 Sicurezza dell'Infrastruttura (BYOC)
Il sistema utilizza il modello **BYOC (Bring Your Own Cloud)**:
*   **Storage:** I backup crittografati risiedono esclusivamente sul **Google Drive istituzionale o personale** del docente.
*   **Protocollo:** Autenticazione via OAuth 2.0 con scope limitato (\`drive.file\`).

### 1.3 Normativa Scolastica Italiana
*   **DPR 122/2009 (Valutazione):** Supporto per la valutazione formativa e sommativa.
*   **Legge 170/2010 (DSA) & Direttiva BES 2012:** Modulo dedicato per la gestione di PEI e PDP.
*   **Linee Guida per la Valutazione (O.M. 172/2020):** Supporto nativo per la valutazione descrittiva per livelli.

---

## 2. 📘 Manuale Operativo

### FASE 1: Setup e Strategia
1.  **Configurazione Identità:** Definizione parametri istituto e calendario scolastico.
2.  **Knowledge Base (RAG):** Caricamento dei documenti strategici (PTOF, Programmazioni Dipartimentali).

### FASE 2: Progettazione Didattica
1.  **Wizard Annuale:** Strumento per la definizione delle Unità di Apprendimento (UDA).
2.  **Studio AI:** Laboratorio per la creazione di verifiche, rubriche e materiali didattici.

### FASE 3: Gestione Aula (Live)
1.  **Modalità Focus:** Interfaccia semplificata per tablet/smartphone.
2.  **Registro Vocale:** Trascrizione automatica di note disciplinari tramite dettatura.

### FASE 4: Valutazione Multidimensionale
Il sistema di **Valutazione Unificata** permette di registrare simultaneamente:
*   **Performance:** Voto numerico (per il calcolo della media).
*   **Competenza:** Livello raggiunto (per la certificazione delle competenze).

---

## 3. 📊 Reportistica e Analisi

### Analytics Hub
Dashboard decisionale che offre:
*   **Analisi Trend:** Grafici per visualizzare il progresso nel tempo.
*   **Radar Competenze:** Mappatura visiva dei punti di forza/debolezza della classe.
*   **AI Insight:** Interpretazione automatica dei dati per individuare studenti a rischio.

---

## 4. 🚀 Visione Strategica

### Per il Dirigente Scolastico
DocenteDoc AI standardizza la qualità della documentazione prodotta dai docenti e garantisce che la progettazione (UDA) sia effettivamente svolta e monitorata.

### Per l'Animatore Digitale
L'adozione favorisce lo sviluppo delle competenze digitali dei docenti (DigCompEdu) in un ambiente sicuro ("Sandbox").

---
*Documento generato automaticamente da DocenteDoc AI v4.1.0*`;

const HelpDigitalTeacherManual: React.FC = () => {
    const downloadManual = () => {
        const blob = new Blob([MANUAL_MARKDOWN_CONTENT], { type: 'text/markdown;charset=utf-8' });
        saveAs(blob, 'Manuale_Tecnico_OrarioDocAI.md');
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--md-sys-spacing-6)'
        }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: 'var(--md-sys-spacing-4)'
            }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                    <Typography variant="h6">Manuale Integrale e Normativa</Typography>
                    <Typography variant="body2" sx={{ color: 'var(--md-sys-color-on-surface)' }}>Versione 4.1.0 - M3 Expressive Edition</Typography>
                </div>
                <Button onClick={downloadManual} variant="outlined" sx={{
                    fontSize: 'var(--md-sys-typescale--font-size)',
                    letterSpacing: 'var(--md-sys-typescale-label-large-tracking)',
                    textTransform: 'uppercase'
                }}>
                    <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ marginRight: 'var(--md-sys-spacing-2)' }}>download</Box>
                    Scarica .MD
                </Button>
            </div>

            <div style={{
                backgroundColor: 'var(--md-sys-color-primary-container)',
                borderRadius: 'var(--md-sys-shape-corner-large)',
                padding: 'var(--md-sys-spacing-4)',
                border: `var(--md-sys-border-width-thin) solid var(--md-sys-color-outline)`
            }}>
                <InfoCard
                    title="Documentazione Completa"
                    description="Questa sezione raccoglie le informazioni operative, le specifiche di sicurezza (GDPR) e la visione strategica. Clicca sulle sezioni per espandere."
                    icon="info"
                    variant="contained"
                />
            </div>

            <ManualSection title="1. Normativa, Sicurezza e Privacy" icon="security" defaultOpen>
                <div style={{ marginBottom: 'var(--md-sys-spacing-4)' }}>
                     <Typography variant="button" sx={{ fontWeight: 'var(--md-sys-typescale-weight-bold)', marginBottom: 'var(--md-sys-spacing-2)' }}>GDPR &amp; Sovranità del Dato</Typography>
                     <Typography variant="body2" sx={{ marginBottom: 'var(--md-sys-spacing-3)' }}>L&apos;architettura <strong>Local-First</strong> garantisce che i dati sensibili degli studenti (voti, PEI) non vengano mai inviati a server proprietari del fornitore del software. Il titolare del trattamento resta la scuola/docente.</Typography>

                     <Typography variant="button" sx={{ fontWeight: 'var(--md-sys-typescale-weight-bold)', marginBottom: 'var(--md-sys-spacing-2)' }}>Norme Scolastiche</Typography>
                     <Typography variant="body2" sx={{ marginBottom: 'var(--md-sys-spacing-3)' }}>Il sistema supporta nativamente:</Typography>
                     <ul style={{ margin: 0, paddingLeft: 'var(--md-sys-spacing-5)' }}>
                         <li><strong>L. 170/2010 &amp; Dir. BES:</strong> Modulo Inclusione dedicato.</li>
                         <li><strong>DPR 122/2009:</strong> Valutazione formativa e sommativa.</li>
                         <li><strong>O.M. 172/2020:</strong> Valutazione descrittiva primaria (livelli di competenza).</li>
                     </ul>
                </div>
            </ManualSection>

            <ManualSection title="2. Manuale Operativo" icon="school">
                <Typography variant="button">Configurazione &amp; Strategia</Typography>
                <UseCaseCard
                    scenario="Voglio che l'app conosca il mio metodo."
                    steps={[
                        "Vai nella sezione <strong>Knowledge Base</strong>.",
                        "Carica i PDF del libro di testo, la programmazione di dipartimento e il PTOF.",
                        "L'AI indicizzerà questi contenuti per creare lezioni coerenti."
                    ]}
                />

                <Typography variant="button">In Aula</Typography>
                <UseCaseCard
                    scenario="Devo segnare una nota disciplinare mentre spiego."
                    steps={[
                        "Non interrompere la lezione. Premi l'icona <strong>Microfono</strong>.",
                        "Detta: <em>'Nota per Rossi: disturba ripetutamente'</em>.",
                        "L'AI trascrive e salva la nota nel registro automaticamente."
                    ]}
                />

                <Typography variant="button">Valutazione</Typography>
                <UseCaseCard
                    scenario="Voglio dare un voto completo."
                    steps={[
                        "Clicca su uno studente in Aula o Valutazioni.",
                        "Usa la <strong>Valutazione Unificata</strong>.",
                        "Inserisci il <strong>Voto Numerico</strong> (per la media) E il <strong>Livello di Competenza</strong> (per la certificazione)."
                    ]}
                    tip="A fine anno avrai sia la media matematica che il profilo delle competenze pronto."
                />
            </ManualSection>

            <ManualSection title="3. Visione Strategica per Stakeholders" icon="campaign">
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'var(--md-sys-grid-fr-1)',
                    gap: 'var(--md-sys-spacing-4)'
                }}>
                    <div style={{
                        backgroundColor: 'var(--md-sys-color-surface-container-low)',
                        borderRadius: 'var(--md-sys-shape-corner-large)',
                        padding: 'var(--md-sys-spacing-4)',
                        border: `var(--md-sys-border-width-thin) solid var(--md-sys-color-outline-variant)`
                    }}>
                        <Typography variant="button" sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--md-sys-spacing-2)',
                            color: 'var(--md-sys-color-primary)',
                            fontWeight: 'var(--md-sys-typescale-weight-bold)',
                            marginBottom: 'var(--md-sys-spacing-3)'
                        }}>                            <span style={{ fontSize: 'var(--md-sys-typescale--font-size)' }}>admin_panel_settings</span>                            Per il Dirigente
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'var(--md-sys-color-on-surface)', lineHeight: '1.5' }}>Standardizzazione della documentazione didattica e monitoraggio effettivo delle UDA progettate. Riduzione del contenzioso grazie a valutazioni trasparenti.</Typography>
                    </div>
                    <div style={{
                        backgroundColor: 'var(--md-sys-color-surface-container-low)',
                        borderRadius: 'var(--md-sys-shape-corner-large)',
                        padding: 'var(--md-sys-spacing-4)',
                        border: `var(--md-sys-border-width-thin) solid var(--md-sys-color-outline-variant)`
                    }}>
                        <Typography variant="button" sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--md-sys-spacing-2)',
                            color: 'var(--md-sys-color-secondary)',
                            fontWeight: 'var(--md-sys-typescale-weight-bold)',
                            marginBottom: 'var(--md-sys-spacing-3)'
                        }}>                            <span style={{ fontSize: 'var(--md-sys-typescale--font-size)' }}>engineering</span>                            Per l&apos;Animatore Digitale
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'var(--md-sys-color-on-surface)', lineHeight: '1.5' }}>Ambiente &quot;Sandbox&quot; sicuro per formare i docenti all&apos;uso dell&apos;AI Generativa senza rischi per la privacy. Sviluppo competenze DigCompEdu.</Typography>
                    </div>
                </div>
            </ManualSection>
        </div>
    );
};

export default HelpDigitalTeacherManual;
