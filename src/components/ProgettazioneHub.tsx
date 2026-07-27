// MD3 Compliant - Progettazione Hub
/**
 * ProgettazioneHub.tsx
 * // M3Expressive refactor: Removed inline Tailwind classes, applied dedicated CSS classes with M3 tokens for layout, colors, spacing, and typography.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import NotebookLMImportModal from './NotebookLMImportModal';
import { logger } from '../utils/logger';
import TemplateManager from './TemplateManager';
import { KnowledgeBaseEntry } from '../types';
import { ProgettazioneHubProps, Uda, Competenza } from '../types';
import AnnualPlanningWizard from './AnnualPlanningWizard';
import SmartImportModal from './SmartImportModal';
import CompetencyManager from './CompetencyManager';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Badge from '@mui/material/Badge';
import Button from '@mui/material/Button';
import TimelineView from './TimelineView';
import UdaDetailModal from './UdaDetailModal';
import HubShell from './ui/HubShell';
import ToolsGrid from './ui/ToolsGrid';
import NavigationCard from './ui/NavigationCard';

// Migration Fase 2: High-traffic hub now imports the single AIBrain
import { AIBrain } from '../ai/brain/AIBrain';

const ProgettazioneHub: React.FC<ProgettazioneHubProps> = ({ 
    onNavigate, 
    udas, 
    events, 
    settings, 
    aiSettings, 
    onSaveUda, 
    onAddLessons, 
    onSaveReport, 
    onSaveEvent, 
    initialAction, 
    knowledgeBase, 
    students, 
    pianiInclusione, 
    onUpdateCompetencies, 
    onUpdateKnowledgeBase,
    driveSyncState,
    onConnectDrive
}) => {
  const [isPlanningWizardOpen, setIsPlanningWizardOpen] = useState(false);
    const [isSmartImportOpen, setIsSmartImportOpen] = useState(false);
    const [isNotebookLMImportOpen, setIsNotebookLMImportOpen] = useState(false);
    const [isTemplateManagerOpen, setIsTemplateManagerOpen] = useState(false);
    const [selectedUda, setSelectedUda] = useState<Uda | null>(null);
    
    // State for Main Tabs
    const [activeTab, setActiveTab] = useState<'dashboard' | 'frameworks'>('dashboard');

    // Dragging / feedback state
    const [previewMessage] = useState<string | null>(null);

    // Fase 3 continuation: Real AIBrain.ask result storage (visible consumption)
    const [aiQuickSuggestion, setAiQuickSuggestion] = useState<string | null>(null);
    const [isAiQuickLoading, setIsAiQuickLoading] = useState(false);

    useEffect(() => {
        if (initialAction === 'annual-planning') {
            setIsPlanningWizardOpen(true);
        }
    }, [initialAction]);
    
    const handleUpdateCompetencies = (newCompetenze: Competenza[]) => {
        if (onUpdateCompetencies) {
            onUpdateCompetencies(newCompetenze);
        } else {
            logger.warn("onUpdateCompetencies not provided to ProgettazioneHub");
        }
    };

    // Fase 3 continuation: Real consumption of AIBrain.ask + buildContext (memoized handler)
    const handleAIBrainQuickAsk = useCallback(async (prompt: string) => {
        setIsAiQuickLoading(true);
        try {
            const ctx = AIBrain.buildContext({ 
                source: 'progettazione', 
                extra: { prompt, udasCount: udas?.length || 0 } 
            });
            const result = await AIBrain.ask({ prompt, context: ctx, mode: 'balanced' });
            
            // Make result visible (user-centric daily gesture)
            setAiQuickSuggestion(result.content);
            console.log('[AIBrain] Progettazione quick ask result:', result.content);

            // Fase 3 deprecation path usage (non-breaking)
            if (import.meta.env.DEV) {
              console.log('Fase 3 deprecation note:', AIBrain.getDeprecationNotice('legacy-progettazione'));
            }
        } catch (e) {
            logger.error('AIBrain quick ask failed', e);
            setAiQuickSuggestion('Errore durante la richiesta AI. Riprova.');
        } finally {
            setIsAiQuickLoading(false);
        }
    }, [udas]);

    // Fase 3 — Real consumption of unified recs + central context (memoized)
    const progettazioneRecs = useMemo(() => AIBrain.getUnifiedRecommendations(
      AIBrain.buildContext({ source: 'progettazione' })
    ), []);

    return (
        <HubShell
            title="Progettazione"
            subtitle="Dall'ispirazione alla pianificazione annuale. Gestisci i tuoi materiali, crea progetti e organizza le lezioni in un unico hub."
            icon="design_services"
            onNavigate={onNavigate}
            aiContext={{ source: 'progettazione' }}
        >

            {/* Tab Navigation */}
            <Box sx={{ mb: 'var(--md-sys-spacing-8)' }}>
                                  <Tabs
                   value={activeTab}
                   onChange={(_, v: string) => ((id: string) => setActiveTab(id as 'dashboard' | 'frameworks'))(v)}
                   indicatorColor="primary"
                   textColor="primary"
                   aria-label="Sezioni di navigazione"
                   sx={{
                     bgcolor: 'var(--md-sys-color-surface-container-low)',
                     borderRadius: 'var(--md-sys-shape-corner-full)',
                     border: '1px solid var(--md-sys-color-outline-variant)',
                     minHeight: 'auto',
                     p: 0.5,
                   }}
                 >
                   {([
                        { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
                        { id: 'frameworks', label: 'Frameworks & Competenze', icon: 'model_training' },
                    ]).map((tab: { id: string; label: string; icon?: string; badge?: number | string }) => (
                     <Tab
                       key={tab.id}
                       value={tab.id}
                       id={`tab-${tab.id}`}
                       aria-controls={`panel-${tab.id}`}
                       data-testid={`tab-${tab.id}`}
                       label={(
                         <Badge badgeContent={tab.badge} color="error">
                           <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                             {tab.icon && <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 'var(--md-sys-typescale-label-large-font-size)' }}>{tab.icon}</Box>}
                             {tab.label}
                           </Box>
                         </Badge>
                       )}
                       sx={{
                         borderRadius: 'var(--md-sys-shape-corner-full)',
                         minHeight: 'auto',
                         py: 1,
                         px: 2,
                         textTransform: 'uppercase',
                         fontSize: 'var(--md-sys-typescale-label-small-font-size)',
                       }}
                     />
                   ))}
                 </Tabs>
            </Box>

            {activeTab === 'dashboard' ? (
                <>
                    {/* 1. HERO ACTION: WIZARD */}
                    <NavigationCard
                        icon="calendar_month"
                        title="Wizard Annuale"
                        description="Pianifica l'intero anno scolastico. Definisci UDA, scadenze e monte ore con il supporto dell'AI."
                        color="var(--md-sys-color-primary-container)"
                        onClick={() => {
                            logger.audit('Opened Annual Planning Wizard');
                            setIsPlanningWizardOpen(true);
                        }}
                        sx={{ mb: 'var(--md-sys-spacing-8)' }}
                    />

                    {/* 2. TIMELINE (GANTT 2.0 DYNAMIC) */}
                    <TimelineView 
                        udas={udas} 
                        events={events} 
                        onUdaClick={(uda) => setSelectedUda(uda)}
                        startDate={settings.activityStartDate}
                        endDate={settings.activityEndDate}
                        previewMessage={previewMessage}
                        // setPreviewMessage={setPreviewMessage}
                        onSaveUda={onSaveUda}
                    />

                    {/* 3. BENTO GRID — now using ToolsGrid for dedup (Phase 4) */}
                    <ToolsGrid
                        items={[
                            { view: 'uda', icon: 'assignment', label: 'Planner UDA', caption: 'Gestisci le Unità di Apprendimento, le fasi di lavoro e le competenze target.', bg: 'var(--md-sys-color-secondary-container)' },
                            { view: 'studio', icon: 'auto_fix_high', label: 'Studio AI', caption: 'Genera quiz, riassunti e materiali dai tuoi documenti.', bg: 'var(--md-sys-color-tertiary-container)' },
                            { view: '', icon: 'transform', label: 'Importa & Ristruttura', caption: 'Converti vecchi file in documenti standard.', onClick: () => setIsSmartImportOpen(true) },
                            { view: '', icon: 'cloud_download', label: 'Importa da NotebookLM', caption: 'Sfoglia e importa materiali dal tuo spazio Google NotebookLM.', onClick: () => setIsNotebookLMImportOpen(true) },
                            { view: 'knowledge-base', icon: 'folder_open', label: 'Knowledge Base', caption: 'Archivio documenti.' },
                            { view: '', icon: 'description', label: 'Template', caption: 'Gestisci i modelli per UDA e verifiche.', onClick: () => setIsTemplateManagerOpen(true) },
                            { view: 'lessons', icon: 'history_edu', label: 'Lezioni', caption: 'Piani di lezione.' },
                            { view: 'rubriche', icon: 'schema', label: 'Rubriche', caption: 'Griglie valutazione.' },
                            { view: 'reportistica', icon: 'print', label: 'Report', caption: 'Stampe & PDF.' },
                        ]}
                        onNavigate={onNavigate}
                    />

                    {/* Fase 3 (sequenza): Visible AIBrain unified recommendation in Progettazione */}
                    {progettazioneRecs?.primary && (
                      <Box sx={{ mt: 2, p: 1.5, borderRadius: 'var(--md-sys-shape-corner-medium)', bgcolor: 'var(--md-sys-color-primary-container)' }}>
                        <Typography variant="caption" sx={{ color: 'var(--md-sys-color-on-primary-container)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Box component="span" className="material-symbols-outlined" sx={{ fontSize: '1rem' }}>auto_awesome</Box>
                          AIBrain (Fase 3): {progettazioneRecs.primary.label || progettazioneRecs.primary.title}
                        </Typography>
                      </Box>
                    )}

                    {/* Fase 3 continuation: Real AIBrain.ask consumption + visible result (user-centric daily gesture) */}
                    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<Box component="span" className="material-symbols-outlined" sx={{ fontSize: '1rem' }}>auto_awesome</Box>}
                        onClick={() => handleAIBrainQuickAsk('Suggerisci un\'idea di UDA o attività per la classe attuale')}
                        disabled={isAiQuickLoading}
                        sx={{ alignSelf: 'flex-start' }}
                      >
                        {isAiQuickLoading ? 'AIBrain sta pensando…' : 'Chiedi suggerimento AI rapido (AIBrain)'}
                      </Button>

                      {aiQuickSuggestion && (
                        <Box sx={{ p: 1.5, borderRadius: 'var(--md-sys-shape-corner-medium)', bgcolor: 'var(--md-sys-color-secondary-container)' }}>
                          <Typography variant="caption" sx={{ color: 'var(--md-sys-color-on-secondary-container)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Box component="span" className="material-symbols-outlined" sx={{ fontSize: '1rem' }}>auto_awesome</Box>
                            AIBrain (Fase 3) — Risposta rapida: {aiQuickSuggestion}
                          </Typography>
                        </Box>
                      )}

                      {/* Fase 3 deprecation path demo (visible for developers) */}
                      {import.meta.env.DEV && (
                        <Typography variant="caption" sx={{ opacity: 0.6, fontSize: '0.65rem' }}>
                          (Fase 3) Usando AIBrain.ask — migrazione legacy in corso
                        </Typography>
                      )}
                    </Box>
                </>
            ) : (
                /* COMPETENCY MANAGER */
                <CompetencyManager 
                    competenze={settings.competenze} 
                    onUpdateCompetencies={handleUpdateCompetencies}
                    onNavigate={onNavigate}
                />
            )}

            {isPlanningWizardOpen && (
                <AnnualPlanningWizard 
                    onClose={() => setIsPlanningWizardOpen(false)}
                    userClasses={settings.classi}
                    settings={settings}
                    aiSettings={aiSettings}
                    udas={udas || []}
                    onSaveUda={onSaveUda}
                    onAddLessons={onAddLessons}
                    onSaveReport={onSaveReport}
                    onSaveEvent={onSaveEvent}
                    knowledgeBase={knowledgeBase || []}
                    students={students}
                    pianiInclusione={pianiInclusione}
                    onNavigate={onNavigate}
                />
            )}

            {isSmartImportOpen && (
                <SmartImportModal
                    onClose={() => setIsSmartImportOpen(false)}
                    aiSettings={aiSettings}
                />
            )}

            {selectedUda && (
                <UdaDetailModal 
                    uda={selectedUda}
                    onClose={() => setSelectedUda(null)}
                    onEdit={() => {
                        setSelectedUda(null);
                        onNavigate('uda');
                    }}
                    aiSettings={aiSettings}
                    knowledgeBase={knowledgeBase || []}
                />
            )}

            {/* Modale Import NotebookLM */}
            {isNotebookLMImportOpen && (
                <NotebookLMImportModal
                    open={isNotebookLMImportOpen}
                    onClose={() => setIsNotebookLMImportOpen(false)}
                    isAuthenticated={driveSyncState?.isAuthenticated}
                    onConnect={onConnectDrive}
                    onImport={(importedFiles: KnowledgeBaseEntry[]) => {
                        // Aggiorna la Knowledge Base con i materiali importati
                        if (onUpdateKnowledgeBase && typeof onUpdateKnowledgeBase === 'function') {
                            // Se ï¿½ fornito un dispatcher esplicito
                            onUpdateKnowledgeBase([
                                ...knowledgeBase,
                                ...importedFiles
                            ]);
                        } else {
                            // Fallback: log e chiudi modale
                            logger.warn('onUpdateKnowledgeBase non fornito, impossibile aggiornare la Knowledge Base.');
                        }
                        setIsNotebookLMImportOpen(false);
                    }}
                />
            )}

            {/* Modale Template Manager */}
            {isTemplateManagerOpen && (
                <TemplateManager
                    onClose={() => setIsTemplateManagerOpen(false)}
                />
            )}
        </HubShell>
    );
};

export default ProgettazioneHub;


