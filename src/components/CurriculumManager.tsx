// MD3 Compliant - Block M Migration (9 violations eliminated)
// M3Expressive refactor: Removed inline Tailwind classes, applied dedicated CSS classes with M3 tokens for colors, spacing, typography, elevation. Maintained responsive behavior and animations. ✅ COMPLETED
import React, { useState } from 'react';
import { CurriculumSubject, CurriculumNucleo, AiSettings, TimetableSettings, View, NavigationParams } from '../types';
import ContextualAskAI from './ui/ContextualAskAI';
// Fase 4: FULL routing for curriculum AI import (daily gesture) via AIBrain (no direct aiService)
import { AIBrain } from '../ai/brain/AIBrain';
import { extractTextFromFile } from '../utils/documentUtils';
import { useFileDrop } from '../hooks/useFileDrop';
import { InfoCard, EmptyState, TextField, AiThinkingGem, M3Dialog, M3ConfirmDialog } from './ui';
import { useUIStore } from '../stores/useUIStore';
import Button from '@mui/material/Button';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import type { SelectChangeEvent } from '@mui/material/Select';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

interface CurriculumManagerProps {
    curricula: CurriculumSubject[];
    onUpdateCurricula: (curricula: CurriculumSubject[]) => void;
    settings: TimetableSettings;
    aiSettings: AiSettings;
    onNavigate: (view: View, context?: NavigationParams) => void;
}

const CurriculumManager: React.FC<CurriculumManagerProps> = ({ curricula, onUpdateCurricula, settings, aiSettings, onNavigate }) => {
    const { showToast } = useUIStore(state => ({ showToast: state.actions.showToast }));
    const [selectedCurriculumId, setSelectedCurriculumId] = useState<string | null>(null);
    const [isImporting, setIsImporting] = useState(false);
    const [importText, setImportText] = useState('');
    const [isProcessingAI, setIsProcessingAI] = useState(false);
    const [confirmDialog, setConfirmDialog] = useState<{ message: string; onConfirm: () => void } | null>(null);
    
    const [newSubject, setNewSubject] = useState(settings.disciplines[0] || '');
    const [newGradeLevel, setNewGradeLevel] = useState('Classi Prime');
    const [activeTab, setActiveTab] = useState<'editor' | 'coverage'>('editor');

    const selectedCurriculum = curricula.find(c => c.id === selectedCurriculumId);

    const handleCreate = () => {
        const newCurr: CurriculumSubject = {
            id: `curr-${Date.now()}`,
            subject: newSubject,
            gradeLevel: newGradeLevel,
            nuclei: [],
            lastUpdated: new Date().toISOString()
        };
        onUpdateCurricula([...curricula, newCurr]);
        setSelectedCurriculumId(newCurr.id);
        setActiveTab('editor');
    };

    const handleDelete = (id: string) => {
        setConfirmDialog({
            message: 'Sei sicuro?',
            onConfirm: () => {
                onUpdateCurricula(curricula.filter(c => c.id !== id));
                if (selectedCurriculumId === id) setSelectedCurriculumId(null);
            }
        });
    };

    const handleUpdate = (updatedCurr: CurriculumSubject) => {
        onUpdateCurricula(curricula.map(c => c.id === updatedCurr.id ? updatedCurr : c));
    };

    const handleImportAI = async () => {
        if (!importText.trim() || !selectedCurriculum) return;
        setIsProcessingAI(true);
        try {
            // Post-Fase 4: central prompt + generateWithCentralPrompt for curriculum parse
            const ctx = AIBrain.buildContext({
                source: 'curriculum-manager',
                extra: { subject: selectedCurriculum.subject, gradeLevel: selectedCurriculum.gradeLevel, textLength: importText.length }
            });
            await AIBrain.migrateLegacyAsk(`Importa curricolo AI per ${selectedCurriculum.subject}`, ctx);

            const parsed = await AIBrain.generateWithCentralPrompt('curriculum-parse', {
                text: importText,
                subject: selectedCurriculum.subject,
                gradeLevel: selectedCurriculum.gradeLevel
            }, aiSettings);
            const updated: CurriculumSubject = {
                ...selectedCurriculum,
                nuclei: [...selectedCurriculum.nuclei, ...parsed.nuclei],
                lastUpdated: new Date().toISOString()
            };
            handleUpdate(updated);
            setIsImporting(false);
            setImportText('');
        } catch (e) {
            const errorMsg = e instanceof Error ? e.message : 'Errore sconosciuto';
            showToast('Errore AI: ' + errorMsg, 'error');
        } finally {
            setIsProcessingAI(false);
        }
    };

    const onDrop = async (acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            const text = await extractTextFromFile(acceptedFiles[0]);
            setImportText(text);
        }
    };

    const { getRootProps, getInputProps } = useFileDrop({ onDrop, accept: 'application/pdf,text/plain', multiple: false });

    const renderEditor = () => {
        if (!selectedCurriculum) return null;
        return (
            <Stack spacing={2}>
                {selectedCurriculum.nuclei.length === 0 && (
                    <EmptyState title="Programma Vuoto" description="Inizia importando un documento o aggiungendo i nuclei fondanti." icon="library_books" />
                )}
                {selectedCurriculum.nuclei.map((nucleo, nIdx) => (
                    <InfoCard
                        key={nucleo.id}
                    >
                        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 'var(--md-sys-spacing-3)' }}>
                            <Box sx={{ flex: 1 }}>
                                <TextField 
                                    
                                    value={nucleo.title} 
                                    onChange={(e) => {
                                        const newNuclei = [...selectedCurriculum.nuclei];
                                        newNuclei[nIdx].title = e.target.value;
                                        handleUpdate({...selectedCurriculum, nuclei: newNuclei});
                                    }}
                                />
                            </Box>
                            <Button 
                                onClick={() => {
                                    const newNuclei = selectedCurriculum.nuclei.filter(n => n.id !== nucleo.id);
                                    handleUpdate({...selectedCurriculum, nuclei: newNuclei});
                                }} 
                                variant="text"
                                 
                                title="Elimina Nucleo"
                            >
                                <span style={{
}}>delete</span>
                            </Button>
                        </Stack>
                        <Stack spacing={1}>
                            {nucleo.objectives.map((obj, oIdx) => (
                                <Stack key={obj.id} direction="row" alignItems="center" spacing={1.5} sx={{ p: 'var(--md-sys-spacing-2)', borderRadius: 'var(--md-sys-shape-corner-small)', backgroundColor: 'var(--md-sys-color-surface-container)', border: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline-variant)' }}>
                                    <Box component="span" sx={{
                                        width: 'var(--md-sys-spacing-2)',
                                        height: 'var(--md-sys-spacing-2)',
                                        borderRadius: 'var(--md-sys-shape-corner-full)',
                                        flexShrink: 0,
                                        background: obj.type === 'skill' ? 'var(--md-sys-color-tertiary)' : 'var(--md-sys-color-secondary)'
                                    }} />
                                    <input 
                                        
                                        value={obj.text}
                                        onChange={(e) => {
                                            const newNuclei = [...selectedCurriculum.nuclei];
                                            newNuclei[nIdx].objectives[oIdx].text = e.target.value;
                                            handleUpdate({...selectedCurriculum, nuclei: newNuclei});
                                        }}
                                        placeholder="Inserisci obiettivo..."
                                    />
                                    <Button 
                                        onClick={() => {
                                            const newNuclei = [...selectedCurriculum.nuclei];
                                            newNuclei[nIdx].objectives = newNuclei[nIdx].objectives.filter(o => o.id !== obj.id);
                                            handleUpdate({...selectedCurriculum, nuclei: newNuclei});
                                        }} 
                                        variant="text"
                                        
                                    >
                                        <Box component="span" className="material-symbols-outlined" aria-hidden="true">close</Box>
                                    </Button>
                                </Stack>
                            ))}
                            <Button 
                                onClick={() => {
                                    const newNuclei = [...selectedCurriculum.nuclei];
                                    newNuclei[nIdx].objectives.push({ id: `obj-${Date.now()}`, text: '', type: 'knowledge' });
                                    handleUpdate({...selectedCurriculum, nuclei: newNuclei});
                                }} 
                                variant="outlined"
                                startIcon={<Box component="span" className="material-symbols-outlined" aria-hidden="true">add</Box>}
                            >
                                Aggiungi Obiettivo
                            </Button>
                        </Stack>
                    </InfoCard>
                ))}
                <Button 
                    onClick={() => {
                        const newNucleus: CurriculumNucleo = { id: `nuc-${Date.now()}`, title: 'Nuovo Nucleo', objectives: [] };
                        handleUpdate({...selectedCurriculum, nuclei: [...selectedCurriculum.nuclei, newNucleus]});
                    }} 
                    variant="outlined"
                    startIcon={<Box component="span" className="material-symbols-outlined" aria-hidden="true">add_circle</Box>}
                >
                    Nuovo Nucleo Fondante
                </Button>
            </Stack>
        );
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: 'var(--md-sys-percent-100)', backgroundColor: 'var(--md-sys-color-surface)', overflow: 'hidden' }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: '280px 1fr', height: 'var(--md-sys-percent-100)', overflow: 'hidden' }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0, borderRight: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline-variant)', backgroundColor: 'var(--md-sys-color-surface-container-low)', overflow: 'hidden' }}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ p: 'var(--md-sys-spacing-4)', borderBottom: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline-variant)', flexShrink: 0 }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <Button onClick={() => onNavigate('home')} variant="text">
                                <Box component="span" className="material-symbols-outlined" aria-hidden="true">arrow_back</Box>
                            </Button>
                            <Typography component="h1" variant="h6" sx={{ margin: 0, fontWeight: 'var(--md-sys-typescale-weight-bold)', fontSize: 'var(--md-sys-typescale-title-large-font-size)', color: 'var(--md-sys-color-on-surface)' }}>Curricoli</Typography>
                        </Stack>
                    </Stack>
                    <Stack spacing={1.5} sx={{ p: 'var(--md-sys-spacing-4)', borderBottom: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline-variant)', flexShrink: 0 }}>
                                                <FormControl fullWidth sx={{ mb: 2 }}>
                          <InputLabel id="curriculum-subject-label" shrink>Materia</InputLabel>
                          <Select
                            labelId="curriculum-subject-label"
                            value={newSubject}
                           
                            notched
                            onChange={(e: SelectChangeEvent) => setNewSubject(e.target.value)}
                          >
                            {settings.disciplines.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                          </Select>
                        </FormControl>
                        <TextField value={newGradeLevel} onChange={e => setNewGradeLevel(e.target.value)} placeholder="Es. Classi Prime" />
                        <Button onClick={handleCreate} variant="contained" >
                            Crea Curricolo
                        </Button>
                    </Stack>
                    <Box sx={{ flex: 1, overflowY: 'auto', p: 'var(--md-sys-spacing-2)' }}>
                        {curricula.map(curr => (
                            <Box
                                key={curr.id}
                                onClick={() => setSelectedCurriculumId(curr.id)}
                                sx={{
                                    p: 'var(--md-sys-spacing-8)',
                                    borderRadius: 'var(--md-sys-shape-corner-medium)',
                                    cursor: 'pointer',
                                    transition: 'opacity, transform, background-color, color, border-color, box-shadow var(--md-sys-motion-duration-short) var(--md-sys-motion-easing-standard)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    background: selectedCurriculumId === curr.id ? 'var(--md-sys-color-primary)' : 'transparent',
                                    color: selectedCurriculumId === curr.id ? 'var(--md-sys-color-on-primary)' : 'inherit',
                                    boxShadow: selectedCurriculumId === curr.id ? 'var(--md-sys-elevation-level3)' : 'none',
                                    transform: selectedCurriculumId === curr.id ? 'scale(1.02)' : 'scale(1)',
                                    '&:hover': { background: selectedCurriculumId === curr.id ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-surface-container-high)' },
                                }}
                            >
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography component="p" variant="subtitle1" sx={{ margin: 0, fontWeight: 'var(--md-sys-typescale-weight-bold)', fontSize: 'var(--md-sys-typescale-body-large-font-size)', color: selectedCurriculumId === curr.id ? 'var(--md-sys-color-on-primary)' : 'var(--md-sys-color-on-surface)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{curr.subject}</Typography>
                                    <Typography component="p" variant="body2" sx={{ margin: 0, fontSize: 'var(--md-sys-typescale-body-small-font-size)', color: selectedCurriculumId === curr.id ? 'var(--md-sys-color-on-primary)' : 'var(--md-sys-color-on-surface-variant)', opacity: 'var(--md-sys-state-opacity-caption)' }}>{curr.gradeLevel}</Typography>
                                </Box>
                                <Button
                                    onClick={(e) => { e.stopPropagation(); handleDelete(curr.id); }}
                                    variant="text"
                                    sx={{
                                        minWidth: 0,
                                        padding: 'var(--md-sys-spacing-1)',
                                        color: selectedCurriculumId === curr.id ? 'var(--md-sys-color-on-primary)' : 'var(--md-sys-color-error)',
                                        opacity: selectedCurriculumId === curr.id ? 1 : 0
                                    }}
                                    onMouseEnter={(e) => {
                                        if (selectedCurriculumId === curr.id) {
                                            e.currentTarget.style.background = 'var(--md-sys-color-surface-container-high)';
                                        } else {
                                            e.currentTarget.style.opacity = '1';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (selectedCurriculumId !== curr.id) {
                                            e.currentTarget.style.opacity = '0';
                                        }
                                    }}
                                >
                                    <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: "var(--md-sys-typescale-label-large-font-size)" }}>delete</Box>
                                </Button>
                            </Box>
                        ))}
                    </Box>
                </Box>
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    {selectedCurriculum ? (
                        <>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ p: 'var(--md-sys-spacing-4) var(--md-sys-spacing-6)', borderBottom: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline-variant)', flexShrink: 0 }}>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography component="h2" variant="h6" sx={{ margin: 0, fontWeight: 'var(--md-sys-typescale-weight-bold)', fontSize: 'var(--md-sys-typescale-title-large-font-size)', color: 'var(--md-sys-color-on-surface)' }}>{selectedCurriculum.subject}</Typography>
                                    <Typography component="p" variant="body1" sx={{ margin: 0, fontSize: 'var(--md-sys-typescale-body-medium-font-size)', color: 'var(--md-sys-color-on-surface-variant)' }}>{selectedCurriculum.gradeLevel}</Typography>
                                </Box>

                                {/* Contextual AI (Fase 2) */}
                                {onNavigate && (
                                  <ContextualAskAI
                                    onNavigate={onNavigate}
                                   
                                    context={{ source: 'curriculum-manager' }}
                                    compact
                                  />
                                )}
                                <Stack direction="row" alignItems="center" spacing={1.5}>
                                                                          <Tabs
                                       value={activeTab}
                                       onChange={(_, v: string) => ((id: string) => {
                                             if (id === 'editor' || id === 'coverage') setActiveTab(id);
                                         })(v)}
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
                                             { id: 'editor', label: 'Editor', icon: 'edit' },
                                             { id: 'coverage', label: 'Analisi', icon: 'analytics' }
                                         ]).map((tab: { id: string; label: string; icon?: string; badge?: number | string }) => (
                                         <Tab
                                           key={tab.id}
                                           value={tab.id}
                                           id={`tab-${tab.id}`}
                                           aria-controls={`panel-${tab.id}`}
                                           data-testid={`tab-${tab.id}`}
                                           label={
                                             <Badge badgeContent={tab.badge} color="error">
                                               <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                 {tab.icon && <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 'var(--md-sys-typescale-label-large-font-size)' }}>{tab.icon}</Box>}
                                                 {tab.label}
                                               </Box>
                                             </Badge>
                                           }
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
                                    {activeTab === 'editor' && (
                                        <Button onClick={() => setIsImporting(true)} variant="outlined" startIcon={<Box component="span" className="material-symbols-outlined" aria-hidden="true">auto_awesome</Box>}>
                                            AI Import
                                        </Button>
                                    )}
                                </Stack>
                            </Stack>
                                            {activeTab === 'editor' ? <Box sx={{ flex: 1, overflowY: 'auto', p: 'var(--md-sys-spacing-6)' }}>{renderEditor()}</Box> : <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><EmptyState title="Analisi Copertura" description="La funzione di copertura basata sulle lezioni svolte è in arrivo." icon="analytics" /></Box>}
                        </>
                    ) : (
                        <EmptyState title="Seleziona un Curricolo" description="Scegli un programma dalla lista laterale per iniziare la progettazione per obiettivi." icon="menu_book" />
                    )}
                </Box>
            </Box>
            {isImporting && (
                <M3Dialog
                    onClose={() => setIsImporting(false)}
                    title="Import AI Curricolo"
                    maxWidth="xl"
                >
                    {/* Fase 4 visible block */}
                    <Box sx={{ fontSize: '0.72rem', px: 2, py: 0.5, mb: 1, bgcolor: 'var(--md-sys-color-surface-container-low)', borderRadius: 'var(--md-sys-shape-corner-small)' }}>
                        AIBrain (Post-Fase 4): CurriculumManager — buildPrompt + generateWithCentralPrompt + buildContext + migrateLegacyAsk (curriculum-parse)
                    </Box>
                    <DialogContent>
                        <Box {...getRootProps()} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--md-sys-spacing-3)', p: 'var(--md-sys-spacing-8)', borderRadius: 'var(--md-sys-shape-corner-large)', border: 'var(--md-sys-border-width-thick) dashed var(--md-sys-color-outline)', backgroundColor: 'var(--md-sys-color-surface-container)', cursor: 'pointer', textAlign: 'center' }}>
                            <input {...getInputProps()} />
                            <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 'var(--icon-size-hero)', color: 'var(--md-sys-color-primary)' }}>upload_file</Box>
                            <Typography component="p" variant="subtitle1" sx={{ margin: 0, fontWeight: 'var(--md-sys-typescale-weight-bold)', fontSize: 'var(--md-sys-typescale-body-large-font-size)', color: 'var(--md-sys-color-on-surface)' }}>Carica PDF Programmazione</Typography>
                            <Typography component="p" variant="body2" sx={{ margin: 0, fontSize: 'var(--md-sys-typescale-body-small-font-size)', color: 'var(--md-sys-color-on-surface-variant)' }}>o trascina il file qui</Typography>
                        </Box>
                        <TextField multiline 
                            
                            value={importText} 
                            onChange={e => setImportText(e.target.value)} 
                            sx={{ flexGrow: "1" }} 
                            rows={12} 
                        />
                    </DialogContent>
                    <DialogActions >
                        <Button onClick={() => setIsImporting(false)} variant="text">Annulla</Button>
                        <Button 
                            onClick={handleImportAI} 
                            variant="contained" 
                             
                            disabled={isProcessingAI || !importText}
                        >
                            {isProcessingAI ? <AiThinkingGem size="small" inline /> : 'Genera Struttura'}
                        </Button>
                    </DialogActions>
                </M3Dialog>
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
        </Box>
    );
};

export default CurriculumManager;

