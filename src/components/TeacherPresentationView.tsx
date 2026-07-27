// MD3 Compliant - Block J Migration Complete (6 violations eliminated)
// Note: minHeight: "100vh" retained for functional full viewport height (no exact MD3 token available)
import React from 'react';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Logo from './Logo';
import { View, NavigationParams } from '../types';
import { InfoCard, SectionHeader, ActionTile } from './ui';
import ContextualAskAI from './ui/ContextualAskAI';

interface TeacherPresentationViewProps {
    onNavigate: (view: View, context?: NavigationParams) => void;
}

const TeacherPresentationView: React.FC<TeacherPresentationViewProps> = ({ onNavigate }) => {
  return (
        <div  style={{minHeight: "var(--md-sys-viewport-height-full)", width: 'var(--md-sys-percent-100)', backgroundColor: "var(--md-sys-color-surface)"}}>
            {/* Aura Ornaments */}
            <div style={{ backgroundColor: 'color-mix(in srgb, var(--md-sys-color-primary) 5%, transparent)' ,  borderRadius: 'var(--md-sys-spacing-4)' }} />
            <div style={{ backgroundColor: 'color-mix(in srgb, var(--md-sys-color-tertiary) 5%, transparent)' ,  borderRadius: 'var(--md-sys-spacing-4)' }} />

            <div  style={{padding: 'var(--md-sys-spacing-6)', marginLeft: "var(--md-sys-margin-auto)", marginRight: "var(--md-sys-margin-auto)"}}>
                
                {/* Slide 1: Intro */}
                <div style={{ backgroundColor: 'var(--md-sys-color-surface-container-low)', opacity: 'var(--md-sys-state-opacity-tint-moderate)', borderRadius: 'var(--md-sys-shape-corner-large)', padding: 'var(--md-sys-spacing-8)', textAlign: "center", border: 'var(--md-sys-border-width-normal) solid var(--md-sys-color-outline)', gap: 'var(--md-sys-spacing-8)' }}>
                    <div  style={{display: "inline-block", marginBottom: 'var(--md-sys-spacing-8)'}}>
                        <Logo title="DocenteDoc AI" />
                    </div>
                    <div style={{marginTop: 'var(--md-sys-spacing-4)'}}>
                        <Typography component="h1" variant="h4" sx={{ color: 'var(--md-sys-color-on-primary)', fontWeight: "var(--md-sys-typescale-weight-black)", letterSpacing: "-0.005em", lineHeight: "1.25" }}>Il Tuo Copilota Didattico</Typography>
                        <Typography component="p" variant="h6" sx={{ color: 'var(--md-sys-color-on-surface-variant)' ,  fontSize: 'var(--md-sys-typescale-title-large-font-size)', fontWeight: "var(--md-sys-typescale-weight-medium)", opacity: "var(--md-sys-state-opacity-caption)", marginLeft: "var(--md-sys-margin-auto)", marginRight: "var(--md-sys-margin-auto)", lineHeight: "1.625" }}>
                            Tecnologia, Privacy e Innovazione al servizio dell'insegnamento.
                            Riduci il carico burocratico, aumenta l'efficacia didattica e riscopri la passione per l'insegnamento.
                        </Typography>
                    </div>
                </div>

                {/* Slide 2: Privacy */}
                <div style={{marginTop: 'var(--md-sys-spacing-8)'}}>
                    <SectionHeader title="La Nostra Promessa: Privacy Assoluta" icon="security"  />
                    <div  style={{display: "grid", gridTemplateColumns: "var(--md-sys-grid-fr-1)", gap: 'var(--md-sys-spacing-6)'}}>
                        <InfoCard
                            title="I Tuoi Dati, Solo Tuoi: Local-First"
                            description="Tutti i dati sensibili (studenti, voti, note) sono crittografati e salvati ESCLUSIVAMENTE sul tuo dispositivo. Nessun server centrale accede o raccoglie le tue informazioni. Massima privacy, totale controllo."
                            icon="lock_open"
                        />
                        <InfoCard
                            title="Backup Sicuro: Bring Your Own Cloud (BYOC)"
                            description="Sincronizza i tuoi dati sul tuo account Google Drive personale o istituzionale. L'app usa protocolli sicuri (OAuth 2.0) e accede SOLO ai file che crea, mantenendo il tuo Drive ordinato e i tuoi dati al sicuro nel TUO cloud."
                            icon="cloud_done"
                        />
                    </div>
                </div>

                {/* Slide 3: AI */}
                <div style={{marginTop: 'var(--md-sys-spacing-8)'}}>
                    <SectionHeader title="L'Intelligenza Artificiale al Tuo Fianco" icon="psychology"  />
                    <div  style={{display: "grid", gridTemplateColumns: "var(--md-sys-grid-fr-1)", gap: 'var(--md-sys-spacing-6)'}}>
                         <InfoCard
                            title="AI come Copilota, non Pilota"
                            description="La nostra AI è il tuo assistente intelligente: genera bozze di lezioni, crea verifiche e ti supporta nell'analisi. MAI prende decisioni al posto tuo. Tu mantieni sempre il controllo finale e la revisione."
                            icon="smart_toy"
                         />
                        <InfoCard
                            title="Contesto e Precisione: RAG (Knowledge Base)"
                            description="L'AI non inventa. Legge e impara dalla TUA Knowledge Base (PTOF, Programmazioni, testi) che tu carichi nell'app. Questo garantisce risposte pertinenti, professionali e allineate al tuo metodo didattico."
                            icon="library_books"
                        />
                    </div>
                </div>
                
                {/* Slide 4: Workflows */}
                <div style={{marginTop: 'var(--md-sys-spacing-8)'}}>
                    <SectionHeader title="Flussi di Lavoro Semplificati" icon="alt_route"  />
                    <div  style={{display: "grid", gridTemplateColumns: "var(--md-sys-grid-fr-1)", gap: 'var(--md-sys-spacing-6)'}}>
                        <ActionTile 
                            title="Centro Operativo"
                            subtitle="Tutti i processi in un click"
                            icon="bolt"
                            onClick={() => onNavigate('home')}
                        />
                        <ActionTile 
                            title="Pianificazione UDA"
                            subtitle="Dall'idea al Gantt completo"
                            icon="calendar_month"
                            onClick={() => onNavigate('progettazione-hub')}
                        />
                        <ActionTile 
                            title="Gestione Aula Vocale"
                            subtitle="Registro e note a mani libere"
                            icon="mic"
                            onClick={() => onNavigate('live-assistant')}
                        />
                        <ActionTile 
                            title="Valutazione Unificata"
                            subtitle="Voto e competenze insieme"
                            icon="grading"
                            onClick={() => onNavigate('evaluations')}
                        />
                    </div>
                </div>

                {/* Slide 5: Impact */}
                <div style={{marginTop: 'var(--md-sys-spacing-8)'}}>
                    <SectionHeader title="L'Impatto sul Futuro" icon="school"  />
                    <div  style={{display: "grid", gridTemplateColumns: "var(--md-sys-grid-fr-1)", gap: 'var(--md-sys-spacing-6)'}}>
                        <InfoCard
                            title="Sviluppo di Competenze Reali"
                            description="Andiamo oltre la media aritmetica. DocenteDoc AI ti aiuta a tracciare e valorizzare le competenze reali degli studenti, fornendo un profilo completo per la loro crescita personale e professionale."
                            icon="workspace_premium"
                        />
                        <InfoCard
                            title="Didattica Inclusiva"
                            description="L'AI suggerisce adattamenti mirati per studenti con BES/DSA, basandosi sui loro piani di inclusione. Ogni studente riceve il supporto necessario per raggiungere il suo massimo potenziale."
                            icon="accessibility_new"
                        />
                    </div>
                </div>

                {/* Slide 6: Call to Action */}
                <div style={{ backgroundColor: 'color-mix(in srgb, var(--md-sys-color-surface-container-low) 30%, transparent)', borderRadius: 'var(--md-sys-shape-corner-extra-large)', padding: 'var(--md-sys-spacing-4)' , textAlign: "center", border: 'var(--md-sys-border-width-normal) solid var(--md-sys-color-outline)', gap: 'var(--md-sys-spacing-8)'}}>
                    <div style={{marginTop: 'var(--md-sys-spacing-4)'}}>
                        <Typography component="h2" variant="h5" sx={{ color: 'var(--md-sys-color-on-primary)', fontWeight: "var(--md-sys-typescale-weight-black)", letterSpacing: "-0.005em" }}>Insegna Meglio, Vivi Meglio.</Typography>
                        <Typography component="p" variant="h6" sx={{ color: 'var(--md-sys-color-on-surface-variant)' ,  fontSize: 'var(--md-sys-typescale-title-large-font-size)', fontWeight: "var(--md-sys-typescale-weight-medium)", opacity: "var(--md-sys-state-opacity-caption)", marginLeft: "var(--md-sys-margin-auto)", marginRight: "var(--md-sys-margin-auto)", lineHeight: "1.625" }}>
                            DocenteDoc AI è stato creato per semplificare la tua vita professionale, garantendo sicurezza e innovazione.
                            Esplora subito il tuo copilota didattico e trasforma il tuo modo di insegnare.
                        </Typography>
                    </div>
                    <Button 
                        onClick={() => onNavigate('home')} 
                        variant="contained"
                         sx={{ transition: 'opacity, transform, background-color, color, border-color, box-shadow var(--md-sys-motion-duration-long) var(--md-sys-motion-easing-standard)' }}
                    >
                        <div style={{display: "flex", alignItems: "center", gap: 'var(--md-sys-spacing-8)'}}>
                            <span style={{ fontSize: 'var(--md-sys-typescale-title-large-font-size)', fontWeight: "var(--md-sys-typescale-weight-black)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Inizia Subito!</span>
                            <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 'var(--md-sys-typescale-title-large-font-size)', transition: "transform var(--md-sys-motion-duration-long)" }}>arrow_forward</Box>
                        </div>
                    </Button>

                    {/* Contextual AI CTA (Fase 2) */}
                    <Box sx={{ mt: 'var(--md-sys-spacing-4)' }}>
                        <ContextualAskAI 
                            onNavigate={onNavigate} 
                           
                            context={{ source: 'teacher-presentation-view' }}
                        />
                    </Box>
                </div>

            </div>
        </div>
    );
};
export default TeacherPresentationView;

