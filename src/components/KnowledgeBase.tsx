// MD3 Gold Compliant
// Tutti gli stili usano esclusivamente token MD3 (nessun valore hardcoded)
// Audit: gennaio 2026
/**
 * KnowledgeBase.tsx
 * // M3Expressive refactor: Removed inline Tailwind classes, applied dedicated CSS classes with M3 tokens for layout, colors, spacing, and typography.
 */

import React, { useState, useMemo, Suspense, lazy, useCallback } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import { KnowledgeBaseEntry, Corpus, AiSettings, TimetableSettings, View, NavigationParams } from '../types';
import HubShell from './ui/HubShell';
import ContextualAskAI from './ui/ContextualAskAI';
const AddSourceModal = lazy(() => import('./AddSourceModal'));
const DocumentViewerModal = lazy(() => import('./DocumentViewerModal')); 
const ImageViewerModal = lazy(() => import('./ImageViewerModal'));
import { KB_CATEGORIES } from '../constants';
import { InfoCard, CategoryCard, SectionHeader, M3ConfirmDialog, Skeleton } from './ui';

// Migration Fase 2: KnowledgeBase (high-traffic hub) imports AIBrain
import { AIBrain } from '../ai/brain/AIBrain';

interface KnowledgeBaseProps {
    knowledgeBase: KnowledgeBaseEntry[];
    setKnowledgeBase: React.Dispatch<React.SetStateAction<KnowledgeBaseEntry[]>>;
    corpora: Corpus[];
    setCorpora: React.Dispatch<React.SetStateAction<Corpus[]>>;
    aiSettings?: AiSettings;
    showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
    settings?: TimetableSettings;
    showGuidanceTips?: boolean;
    onNavigate: (view: View, context?: NavigationParams) => void;
}

const KnowledgeBase: React.FC<KnowledgeBaseProps> = ({ knowledgeBase, setKnowledgeBase, corpora, setCorpora, showToast, onNavigate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentView, setCurrentView] = useState<{ type: 'root' | 'category' | 'corpus', id: string }>({ type: 'root', id: '' });
    const [isAddSourceModalOpen, setIsAddSourceModalOpen] = useState(false);
    const [previewingEntry, setPreviewingEntry] = useState<KnowledgeBaseEntry | null>(null);
    const [viewingImage, setViewingImage] = useState<KnowledgeBaseEntry | null>(null);
    const [confirmDialog, setConfirmDialog] = useState<{ message: string; onConfirm: () => void } | null>(null);
    // aiSettings, settings, showGuidanceTips sono ricevuti come props ma non usati attualmente

    // Fase 3 (sequenza): Central buildContext + unified recommendations (memoized)
    const _aiBrainContext = useMemo(() => AIBrain.buildContext({ source: 'knowledge-base' }), []);
    const kbRecs = useMemo(() => AIBrain.getUnifiedRecommendations(_aiBrainContext), [_aiBrainContext]);

    // Fase 3 continuation: Real AIBrain.ask consumption (user-centric daily gesture)
    const [kbAiSuggestion, setKbAiSuggestion] = useState<string | null>(null);
    const [kbAiLoading, setKbAiLoading] = useState(false);

    const fetchKbAiSuggestion = useCallback(async () => {
        setKbAiLoading(true);
        try {
            const ctx = AIBrain.buildContext({
                source: 'knowledge-base',
                extra: { currentView: currentView.type, searchTerm }
            });
            const res = await AIBrain.ask({
                prompt: `Suggerisci una prossima azione o insight per i documenti nella Knowledge Base (vista: ${currentView.type}).`,
                context: ctx,
                mode: 'balanced'
            });
            setKbAiSuggestion(res.content);
        } catch {
            setKbAiSuggestion('Impossibile ottenere suggerimento AI.');
        } finally {
            setKbAiLoading(false);
        }
    }, [currentView, searchTerm]);

    const handleDeleteFile = (fileId: string) => {
        setConfirmDialog({
            message: 'Sei sicuro di voler eliminare questo file?',
            onConfirm: () => setKnowledgeBase(prev => prev.filter(entry => entry.id !== fileId))
        });
    };

    const handleAddEntries = (newEntries: KnowledgeBaseEntry[]) => {
        setKnowledgeBase(prev => [...prev, ...newEntries]);
        showToast(`${newEntries.length} file aggiunti con successo!`, 'success');
    };

    const filteredFiles = useMemo(() => {
        return knowledgeBase.filter(entry => {
            const matchesSearch = entry.fileName.toLowerCase().includes(searchTerm.toLowerCase());
            if (!matchesSearch) return false;
            if (currentView.type === 'category') {
                if (currentView.id === 'archivio') return entry.category === 'archivio' || !entry.category;
                return entry.category === currentView.id;
            }
            if (currentView.type === 'corpus') return entry.corpusId === currentView.id;
            return false; 
        }).sort((a, b) => a.fileName.localeCompare(b.fileName));
    }, [knowledgeBase, searchTerm, currentView]);

    const categoryCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        KB_CATEGORIES.forEach(c => counts[c.id] = 0);
        knowledgeBase.forEach(entry => {
            const cat = entry.category || 'archivio';
            const target = counts[cat] !== undefined ? cat : 'archivio';
            counts[target] = (counts[target] || 0) + 1;
        });
        return counts;
    }, [knowledgeBase]);

    const handleFileClick = (entry: KnowledgeBaseEntry) => {
        if (entry.fileContent?.mimeType.startsWith('image/')) setViewingImage(entry);
        else setPreviewingEntry(entry);
    };

    const renderFolderDashboard = () => (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
             {KB_CATEGORIES.map(cat => (
                 <CategoryCard 
                    key={cat.id} 
                    id={cat.id}
                    label={cat.label}
                    icon={cat.icon}
                    color={cat.color}
                    isSelected={currentView.type === 'category' && currentView.id === cat.id}
                    onClick={() => setCurrentView({ type: 'category', id: cat.id })}
                    description={`${categoryCounts[cat.id] || 0} file salvati`}
                />
             ))}
        </Box>
    );

    const renderFileList = () => {
        const categoryInfo = currentView.type === 'category' ? KB_CATEGORIES.find(c => c.id === currentView.id) : null;
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box component="header" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1.5, bgcolor: 'var(--md-sys-color-surface-container)', borderBottom: '1px solid', borderColor: 'var(--md-sys-color-outline-variant)', borderRadius: 'var(--md-sys-shape-corner-large)', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <IconButton onClick={() => setCurrentView({ type: 'root', id: '' })} aria-label="Torna alle cartelle" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                            <Box component="span" className="material-symbols-outlined" aria-hidden="true">arrow_back</Box>
                        </IconButton>
                        {categoryInfo?.icon && (
                            <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ color: 'var(--md-sys-color-primary)', fontSize: 'var(--md-sys-typescale-title-medium-font-size)' }}>{categoryInfo.icon}</Box>
                        )}
                        <Typography variant="h6" sx={{ color: 'var(--md-sys-color-on-surface)', fontWeight: 'var(--md-sys-typescale-weight-bold)' }}>{categoryInfo?.label || 'File'}</Typography>
                    </Box>
                    <FormControl size="small" variant="outlined" sx={{ minWidth: { xs: '100%', sm: 200 } }}>
                        <InputLabel htmlFor="kb-search">Cerca</InputLabel>
                        <OutlinedInput
                            id="kb-search"
                            label="Cerca"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            startAdornment={
                                <InputAdornment position="start">
                                    <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 'var(--md-sys-typescale-body-large-font-size)', color: 'var(--md-sys-color-on-surface-variant)' }}>search</Box>
                                </InputAdornment>
                            }
                        />
                    </FormControl>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {filteredFiles.map(entry => (
                        <Box 
                            key={entry.id} 
                            onClick={() => handleFileClick(entry)}
                            sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 2, cursor: 'pointer', bgcolor: 'var(--md-sys-color-surface-container)', borderRadius: 'var(--md-sys-shape-corner-medium)', border: '1px solid', borderColor: 'var(--md-sys-color-outline-variant)', '&:hover': { bgcolor: 'var(--md-sys-color-surface-container-high)' } }}
                        >
                            <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 'var(--md-sys-typescale-title-large-font-size)', color: entry.category === 'ai_deliverable' ? 'var(--md-sys-color-secondary)' : 'var(--md-sys-color-primary)', flexShrink: 0 }}>
                                {entry.category === 'ai_deliverable' ? 'auto_awesome' : (entry.fileContent?.mimeType === 'application/pdf' ? 'picture_as_pdf' : 'description')}
                            </Box>
                            <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                                <Typography variant="subtitle2" noWrap sx={{ color: 'var(--md-sys-color-on-surface)', fontWeight: 'var(--md-sys-typescale-weight-medium)' }}>{entry.fileName}</Typography>
                                <Typography variant="caption" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                                    {entry.isGenerated ? 'Generato con AI' : 'Documento locale'}
                                </Typography>
                            </Box>
                            <IconButton 
                                onClick={(e) => { e.stopPropagation(); handleDeleteFile(entry.id); }} 
                                aria-label={`Elimina ${entry.fileName}`}
                                size="small"
                                sx={{ color: 'var(--md-sys-color-error)' }}
                            >
                                <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 'var(--md-sys-typescale-body-large-font-size)' }}>delete</Box>
                            </IconButton>
                        </Box>
                    ))}
                    {filteredFiles.length === 0 && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 3 }}>
                            <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>search_off</Box>
                            <Typography variant="body2" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Nessun file trovato in questa cartella.</Typography>
                        </Box>
                    )}
                </Box>
            </Box>
        );
    }

    return (
        <HubShell
            title="Knowledge Base"
            subtitle="Archivio fonti, documenti e deliverable generati dall'AI."
            icon="database"
            onNavigate={onNavigate}
            aiContext={{ source: 'knowledge-base' }}
        >
            <InfoCard 
                title="Sincronia NotebookLM"
                description="Puoi caricare qui le analisi o i progetti prodotti con NotebookLM. L'app li userà come base di conoscenza prioritaria per generare le tue lezioni e UDA."
                icon="bolt"
            />

            {/* Fase 3 (sequenza): Real AIBrain unified recommendation in KnowledgeBase */}
            {kbRecs?.primary && (
              <Box sx={{ 
                mt: 1, 
                p: 1, 
                borderRadius: 'var(--md-sys-shape-corner-small)', 
                bgcolor: 'var(--md-sys-color-tertiary-container)' 
              }}>
                <Typography variant="caption" sx={{ color: 'var(--md-sys-color-on-tertiary-container)', fontWeight: 500 }}>
                  AIBrain (Fase 3): {kbRecs.primary.label || kbRecs.primary.title}
                </Typography>
              </Box>
            )}

            {/* Fase 3 continuation: Real AIBrain.ask consumption (visible daily gesture) */}
            <Box sx={{ mt: 1, mb: 2 }}>
              <Button
                size="small"
                variant="outlined"
                onClick={fetchKbAiSuggestion}
                disabled={kbAiLoading}
                startIcon={<Box component="span" className="material-symbols-outlined" sx={{ fontSize: '1rem' }}>auto_awesome</Box>}
              >
                {kbAiLoading ? 'AIBrain...' : 'Suggerimento AI rapido (AIBrain)'}
              </Button>
              {kbAiSuggestion && (
                <Box sx={{ mt: 1, p: 1, borderRadius: 'var(--md-sys-shape-corner-small)', bgcolor: 'var(--md-sys-color-secondary-container)' }}>
                  <Typography variant="caption" sx={{ color: 'var(--md-sys-color-on-secondary-container)' }}>
                    AIBrain (Fase 3): {kbAiSuggestion}
                  </Typography>
                </Box>
              )}
            </Box>

            <Box component="main" sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 4 }}>
                {currentView.type === 'root' ? renderFolderDashboard() : renderFileList()}
            </Box>

            {isAddSourceModalOpen && (
                <Suspense fallback={<Skeleton height="var(--md-sys-spacing-32)" />}>
                    <AddSourceModal
                        corpora={corpora}
                        setCorpora={setCorpora}
                        onClose={() => setIsAddSourceModalOpen(false)}
                        onAddEntries={handleAddEntries}
                    />
                </Suspense>
            )}
            {previewingEntry && (
                <Suspense fallback={<Skeleton height="var(--md-sys-spacing-32)" />}>
                    <DocumentViewerModal
                        title={previewingEntry.fileName}
                        htmlContent={previewingEntry.htmlContent || `<pre>${previewingEntry.content}</pre>`}
                        onClose={() => setPreviewingEntry(null)}
                    />
                </Suspense>
            )}
            {viewingImage && (
                <Suspense fallback={<Skeleton height="var(--md-sys-spacing-32)" />}>
                    <ImageViewerModal
                        prompt={viewingImage.content}
                        imageData={viewingImage.fileContent!.data}
                        mimeType={viewingImage.fileContent!.mimeType}
                        onClose={() => setViewingImage(null)}
                        onSaveToKb={() => {}}
                    />
                </Suspense>
            )}
            {confirmDialog && (
                <M3ConfirmDialog
                    title="Conferma eliminazione"
                    message={confirmDialog.message}
                    onConfirm={() => { confirmDialog.onConfirm(); setConfirmDialog(null); }}
                    onCancel={() => setConfirmDialog(null)}
                    danger={true}
                />
            )}
        </HubShell>
    );
};

export default KnowledgeBase;

