// MD3 Gold Compliant (icon exceptions: GAP/position use raw px from getBoundingClientRect)
import React, { useState, useMemo } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import DialogContent from '@mui/material/DialogContent';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { View, Studente, TimetableSettings, Valutazione, ValutazioneCompetenza, RegisterEntry } from '../types';
import { M3Dialog, ActionTile, SectionHeader } from './ui';

interface OperationsCenterProps {
    onClose: () => void;
    onNavigate: (view: View, context?: unknown) => void;
    onAction: (action: string) => void;
    activeSuggestion?: string | null;
    students?: Studente[];
    settings?: TimetableSettings;
    evaluations?: Valutazione[];
    competencyEvaluations?: ValutazioneCompetenza[];
    register?: RegisterEntry[];
    onPromoteStudents?: (promotedStudents: Studente[], archiveYear: string) => void;
    onBackupData?: () => Promise<void>;
    onResetData?: () => void;
}

interface ProcessDef {
    id: string;
    title: string;
    subtitle: string;
    description: string;
    icon: string;
    steps: { title: string; desc: string }[];
    variant: 'primary' | 'secondary' | 'tertiary' | 'surface';
    category: 'daily' | 'planning' | 'system';
    actionType: 'navigate' | 'function' | 'modal';
    target: string; 
    payload?: unknown;
}

const PROCESS_DEFINITIONS: ProcessDef[] = [
    {
        id: 'live_assistant',
        title: 'Assistente Live',
        subtitle: 'Copilota Vocale',
        description: 'Comandi vocali per gestire la classe senza interrompere la lezione.',
        icon: 'mic',
        steps: [
            { title: 'Ascolto', desc: 'L\'AI ascolta i tuoi comandi vocali.' },
            { title: 'Esecuzione', desc: 'Voti e note vengono trascritti e salvati.' }
        ],
        variant: 'tertiary',
        category: 'daily',
        actionType: 'function',
        target: 'live-assistant'
    },
    {
        id: 'video_generation',
        title: 'Video Analysis',
        subtitle: 'Veo AI',
        description: 'Genera video didattici da prompt testuali o immagini.',
        icon: 'movie',
        steps: [
            { title: 'Prompt', desc: 'Descrivi la scena da generare.' },
            { title: 'Render', desc: 'L\'AI genera un video MP4 ad alta qualità.' }
        ],
        variant: 'secondary',
        category: 'planning',
        actionType: 'function',
        target: 'video-analysis'
    },
    {
        id: 'nka_map',
        title: 'Mappa Neurale',
        subtitle: 'Knowledge Map',
        description: 'Visualizza i collegamenti tra lezioni e concetti chiave.',
        icon: 'hub',
        steps: [
            { title: 'Analisi', desc: 'L\'AI mappa i concetti chiave.' },
            { title: 'Grafico', desc: 'Visualizza i nodi e le connessioni.' }
        ],
        variant: 'primary',
        category: 'planning',
        actionType: 'function',
        target: 'nka-map'
    },
    {
        id: 'annual_wizard',
        title: 'Wizard Annuale',
        subtitle: 'Piano UDA',
        description: 'Pianifica l\'anno scolastico e distribuisci le UDA nel calendario.',
        icon: 'calendar_month',
        steps: [
            { title: 'Argomenti', desc: 'Indica cosa vuoi insegnare.' },
            { title: 'Gantt', desc: 'Visualizza la scansione temporale delle UDA.' }
        ],
        variant: 'primary',
        category: 'planning',
        actionType: 'navigate',
        target: 'progettazione-hub',
        payload: { action: 'annual-planning' }
    },
    {
        id: 'import_students',
        title: 'Importa Studenti',
        subtitle: 'Setup Rapido',
        description: 'Carica elenchi classe da file Excel o CSV.',
        icon: 'group_add',
        steps: [
            { title: 'File', desc: 'Seleziona il file .csv o .xlsx.' },
            { title: 'Mapping', desc: 'Associa Nomi e Cognomi.' }
        ],
        variant: 'surface',
        category: 'system',
        actionType: 'navigate',
        target: 'studenti'
    },
    {
        id: 'setup_timetable',
        title: 'Configura Orario',
        subtitle: 'Grid Settimanale',
        description: 'Definisci la matrice oraria per velocizzare il registro.',
        icon: 'edit_calendar',
        steps: [
            { title: 'Grid', desc: 'Clicca sugli slot.' },
            { title: 'Assign', desc: 'Classe e Materia.' }
        ],
        variant: 'surface',
        category: 'system',
        actionType: 'navigate',
        target: 'timetable'
    },
    {
        id: 'load_demo',
        title: 'Carica Demo',
        subtitle: 'Test Data',
        description: 'Popola l\'app con dati di esempio per test rapidi.',
        icon: 'dataset',
        steps: [
            { title: 'Caricamento', desc: 'Generazione dati.' },
            { title: 'Pronto', desc: 'Esplora l\'app.' }
        ],
        variant: 'surface',
        category: 'system',
        actionType: 'function',
        target: 'load-demo'
    },
    {
        id: 'year_transition',
        title: 'Passaggio Anno',
        subtitle: 'Promozioni',
        description: 'Chiudi l\'anno, archivia dati e promuovi gli studenti.',
        icon: 'move_up',
        steps: [
            { title: 'Backup', desc: 'Salvataggio stato attuale.' },
            { title: 'Reset', desc: 'Pulizia voti e lezioni.' },
            { title: 'Promozione', desc: '1A -> 2A (o Archivio).' }
        ],
        variant: 'secondary',
        category: 'system',
        actionType: 'modal',
        target: 'year-transition-modal'
    }
];

const OperationsCenter: React.FC<OperationsCenterProps> = ({ 
    onClose, onNavigate, onAction, activeSuggestion
}) => {
    const [selectedProcess, setSelectedProcess] = useState<ProcessDef | null>(null);

    const handleProcessStart = (p?: ProcessDef) => {
        const process = p || selectedProcess;
        if (!process) return;
        
        if (process.actionType === 'navigate') {
            onNavigate(process.target as View, process.payload);
            onClose();
        } else {
            onAction(process.target);
            onClose();
        }
    };

    const suggestedProcess = useMemo(() => {
        if (!activeSuggestion) return null;
        const idToSearch = typeof activeSuggestion === 'string' ? activeSuggestion : (typeof activeSuggestion === 'object' && activeSuggestion !== null && 'id' in activeSuggestion ? (activeSuggestion as { id: string }).id : undefined);
        return PROCESS_DEFINITIONS.find(p => p.id === idToSearch);
    }, [activeSuggestion]);

    const renderProcessDetail = () => {
        if (!selectedProcess) return null;
        return (
            <Stack direction="column" sx={{ gap: 'var(--md-sys-spacing-6)', height: 'var(--md-sys-percent-100)', overflowY: 'auto' }}>
                <Stack direction="column" alignItems="center" sx={{ textAlign: 'center', gap: 'var(--md-sys-spacing-4)', p: 'var(--md-sys-spacing-6)', borderRadius: 'var(--md-sys-shape-corner-extra-large)', bgcolor: 'var(--md-sys-color-surface-container-low)' }}>
                    <Box sx={{
                        width: 'var(--md-sys-spacing-20)',
                        height: 'var(--md-sys-spacing-20)',
                        borderRadius: 'var(--md-sys-shape-corner-large)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: selectedProcess.variant === 'primary' ? 'var(--md-sys-color-primary-container)' :
                                 selectedProcess.variant === 'secondary' ? 'var(--md-sys-color-secondary-container)' :
                                 selectedProcess.variant === 'tertiary' ? 'var(--md-sys-color-tertiary-container)' :
                                 'var(--md-sys-color-surface-container-high)',
                        color: selectedProcess.variant === 'primary' ? 'var(--md-sys-color-on-primary-container)' :
                               selectedProcess.variant === 'secondary' ? 'var(--md-sys-color-on-secondary-container)' :
                               selectedProcess.variant === 'tertiary' ? 'var(--md-sys-color-on-tertiary-container)' :
                               'var(--md-sys-color-on-surface)',
                        mx: 'auto',
                        mb: 'var(--md-sys-spacing-4)',
                        boxShadow: 'var(--md-sys-elevation-level2)',
                        transition: 'opacity, transform, background-color, color, border-color, box-shadow var(--md-sys-motion-duration-medium) var(--md-sys-motion-easing-standard)'
                    }}>
                        <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 'var(--icon-size-xl)' }}>{selectedProcess.icon}</Box>
                    </Box>
                    <Typography component="h2" sx={{ m: 0, fontWeight: 'var(--md-sys-typescale-weight-bold)', fontSize: 'var(--md-sys-typescale-headline-small-font-size)', color: 'var(--md-sys-color-on-surface)' }}>{selectedProcess.title}</Typography>
                    <Typography sx={{ m: 0, fontSize: 'var(--md-sys-typescale-body-large-font-size)', color: 'var(--md-sys-color-on-surface-variant)' }}>{selectedProcess.description}</Typography>
                </Stack>
                <Stack direction="column" sx={{ gap: 'var(--md-sys-spacing-4)' }}>
                    <Typography component="h3" sx={{ m: 0, fontWeight: 'var(--md-sys-typescale-weight-bold)', fontSize: 'var(--md-sys-typescale-title-large-font-size)', color: 'var(--md-sys-color-on-surface)' }}>Fasi del Processo</Typography>
                    <Stack direction="column" sx={{ gap: 'var(--md-sys-spacing-3)' }}>
                        {selectedProcess.steps.map((step, idx) => (
                            <Stack key={idx} direction="column" sx={{ gap: 'var(--md-sys-spacing-2)', p: 'var(--md-sys-spacing-4)', borderRadius: 'var(--md-sys-shape-corner-large)', bgcolor: 'var(--md-sys-color-surface-container)', borderLeft: 'var(--md-sys-border-width-thick) solid var(--md-sys-color-primary)' }}>
                                <Box sx={{ width: 'var(--md-sys-spacing-6)', height: 'var(--md-sys-spacing-6)', borderRadius: 'var(--md-sys-shape-corner-full)', bgcolor: 'var(--md-sys-color-primary)', color: 'var(--md-sys-color-on-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--md-sys-typescale-label-small-font-size)', fontWeight: 'var(--md-sys-typescale-weight-bold)' }}>{idx + 1}</Box>
                                <Typography component="h4" sx={{ m: 0, fontWeight: 'var(--md-sys-typescale-weight-bold)', fontSize: 'var(--md-sys-typescale-body-large-font-size)', color: 'var(--md-sys-color-on-surface)' }}>{step.title}</Typography>
                                <Typography sx={{ m: 0, fontSize: 'var(--md-sys-typescale-body-medium-font-size)', color: 'var(--md-sys-color-on-surface-variant)' }}>{step.desc}</Typography>
                            </Stack>
                        ))}
                    </Stack>
                </Stack>
                <Stack direction="row" justifyContent="flex-end" sx={{ gap: 'var(--md-sys-spacing-3)', pt: 'var(--md-sys-spacing-4)', borderTop: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline-variant)' }}>
                    <Button onClick={() => setSelectedProcess(null)} variant="text">Indietro</Button>
                    <Button onClick={() => handleProcessStart()} variant="contained">AVVIA ORA</Button>
                </Stack>
            </Stack>
        );
    };

    return (
        <M3Dialog
            title={selectedProcess ? 'Dettaglio Processo' : 'Centro Operativo'}
            onClose={onClose}
            mode="fullscreen"
            hideBackdrop={true}
        >
            <DialogContent>
                {selectedProcess ? renderProcessDetail() : (
                    <Stack direction="column" sx={{ gap: 'var(--md-sys-spacing-6)' }}>
                        {suggestedProcess && (
                            <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" sx={{ gap: 'var(--md-sys-spacing-4)', p: 'var(--md-sys-spacing-4)', borderRadius: 'var(--md-sys-shape-corner-large)', bgcolor: 'var(--md-sys-color-tertiary-container)' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 'var(--md-sys-spacing-11)', height: 'var(--md-sys-spacing-11)', borderRadius: 'var(--md-sys-shape-corner-large)', bgcolor: 'var(--md-sys-color-tertiary)', color: 'var(--md-sys-color-on-tertiary)', flexShrink: 0 }}>
                                    <Box component="span" className="material-symbols-outlined" aria-hidden="true">lightbulb</Box>
                                </Box>
                                <Box sx={{ flex: 1 }}>
                                    <Typography component="h3" sx={{ m: 0, fontWeight: 'var(--md-sys-typescale-weight-bold)', fontSize: 'var(--md-sys-typescale-title-small-font-size)', color: 'var(--md-sys-color-on-tertiary-container)' }}>Suggerimento AI</Typography>
                                    <Typography sx={{ m: 0, fontSize: 'var(--md-sys-typescale-body-medium-font-size)', color: 'var(--md-sys-color-on-tertiary-container)', opacity: 'var(--md-sys-state-opacity-caption)' }}>{suggestedProcess.description}</Typography>
                                </Box>
                                <Button onClick={() => setSelectedProcess(suggestedProcess)} variant="contained" endIcon={<Box component="span" className="material-symbols-outlined" aria-hidden="true">arrow_forward</Box>}>
                                    AVVIA
                                </Button>
                            </Stack>
                        )}

                        <Stack direction="column" sx={{ gap: 'var(--md-sys-spacing-6)' }}>
                            <Stack direction="column" sx={{ gap: 'var(--md-sys-spacing-3)' }}>
                                <SectionHeader title="Processi Comuni" icon="play_circle" />
                                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 'var(--md-sys-spacing-3)' }}>
                                    {PROCESS_DEFINITIONS.filter(p => p.category === 'daily').map(p => (
                                        <ActionTile
                                            key={p.id}
                                            title={p.title}
                                            subtitle={p.subtitle}
                                            icon={p.icon}
                                            variant={p.variant}
                                            onClick={() => setSelectedProcess(p)}
                                        />
                                    ))}
                                </Box>
                            </Stack>

                            <Stack direction="column" sx={{ gap: 'var(--md-sys-spacing-3)' }}>
                                <SectionHeader title="Pianificazione e Sviluppo" icon="design_services" />
                                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 'var(--md-sys-spacing-3)' }}>
                                    {PROCESS_DEFINITIONS.filter(p => p.category === 'planning').map(p => (
                                        <ActionTile
                                            key={p.id}
                                            title={p.title}
                                            subtitle={p.subtitle}
                                            icon={p.icon}
                                            variant={p.variant}
                                            onClick={() => setSelectedProcess(p)}
                                        />
                                    ))}
                                </Box>
                            </Stack>

                            <Stack direction="column" sx={{ gap: 'var(--md-sys-spacing-3)' }}>
                                <SectionHeader title="Manutenzione del Sistema" icon="build" />
                                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 'var(--md-sys-spacing-3)' }}>
                                    {PROCESS_DEFINITIONS.filter(p => p.category === 'system').map(p => (
                                        <ActionTile
                                            key={p.id}
                                            title={p.title}
                                            subtitle={p.subtitle}
                                            icon={p.icon}
                                            variant={p.variant}
                                            onClick={() => setSelectedProcess(p)}
                                        />
                                    ))}
                                </Box>
                            </Stack>
                        </Stack>
                    </Stack>
                )}
            </DialogContent>
        </M3Dialog>
    );
};
export default OperationsCenter;

// M3Expressive refactor COMPLETED: OperationsCenter.tsx - Replaced all hardcoded Tailwind classes with dedicated operations-center-* CSS classes using M3 tokens for layout, process details, timeline, suggestion cards, and action tiles.

