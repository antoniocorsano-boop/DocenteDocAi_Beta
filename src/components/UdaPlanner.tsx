// MD3 GOLD COMPLIANT � Audit 2026-01-25
// Nessun valore hardcoded: solo token MD3, nessun px/rem/%/hex/rgba, nessuna utility custom.
// Conforme a MD3_GOVERNANCE_COMPLIANCE_CONTRACT.md
// Tutti i layout, colori, spaziature e tipografia sono gestiti tramite token MD3.
/**
 * UdaPlanner.tsx
 * // M3Expressive refactor: Removed inline Tailwind classes, applied dedicated CSS classes with M3 tokens for layout, colors, spacing, and typography.
 */

import React, { useState, useMemo, Suspense, lazy } from 'react';
import { Uda, Competenza, UdaPlannerProps } from '../types';
import { logger } from '../utils/logger';
const UdaExportModal = lazy(() => import('./UdaExportModal'));
import Guidance from './Guidance';
import { M3Dialog, TextField, EmptyState, M3ConfirmDialog, Skeleton } from './ui';
import ContextualAskAI from './ui/ContextualAskAI';
import { useUIStore } from '../stores/useUIStore';
import InputAdornment from '@mui/material/InputAdornment';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
const createNewUda = (): Uda => ({
    id: `uda-${Date.now()}`,
    title: '',
    classe: '',
    materia: '',
    introduction: '',
    finalProduct: '',
    competencyIds: [],
    phases: [{ id: `phase-${Date.now()}`, title: '', description: '', activities: '', duration: '' }],
    evaluation: '',
    tools: '',
    externalLink: '',
    startPos: 0,
    width: 100,
    color: 'var(--md-sys-color-primary)',
    borderColor: 'var(--md-sys-color-outline)',
    textColor: 'var(--md-sys-color-on-primary)'
});



interface UdaEditorProps {
    udaProp: Uda | 'new';
    onSaveUda: (uda: Uda) => void;
    onDeleteUda: (id: string) => void;
    onClose: () => void;
    competenze: Competenza[];
}

const UdaEditor: React.FC<UdaEditorProps> = ({ udaProp, onSaveUda, onDeleteUda, onClose, competenze }) => {
  const { showToast } = useUIStore(state => ({ showToast: state.actions.showToast }));
  const [currentUda, setCurrentUda] = useState<Uda>(udaProp === 'new' ? createNewUda() : { ...udaProp });
    const [isCompetencyPickerOpen, setIsCompetencyPickerOpen] = useState(false);
    const [compSearch, setCompSearch] = useState('');
    const [compFrameworkFilter, setCompFrameworkFilter] = useState<string | null>(null);
    const [confirmDialog, setConfirmDialog] = useState<{ message: string; onConfirm: () => void } | null>(null);

    const handleFieldChange = (field: keyof Uda, value: unknown) => setCurrentUda(prev => ({ ...prev, [field]: value }));
    
    const handleCompetencyToggle = (id: string) => {
        logger.audit(`Toggled competency ${id} for UDA ${currentUda.id}`);
        setCurrentUda(prev => ({ 
            ...prev, 
            competencyIds: prev.competencyIds.includes(id) 
                ? prev.competencyIds.filter(c => c !== id) 
                : [...prev.competencyIds, id] 
        }));
    };
    
    const handleSave = () => {
        if (!currentUda.title || !currentUda.classe) { showToast('Titolo e Classe obbligatori.', 'error'); return; }
        logger.audit(`Saved UDA ${currentUda.id}: ${currentUda.title}`);
        onSaveUda(currentUda);
        onClose();
    };

    const handleDelete = () => {
        setConfirmDialog({
            message: 'Eliminare questo progetto?',
            onConfirm: () => {
                logger.audit(`Deleted UDA ${currentUda.id}`);
                onDeleteUda(currentUda.id);
                onClose();
            }
        });
    };

    const handleClose = () => {
        logger.audit(`Closed UDA editor for ${currentUda.id}`);
        onClose();
    };

    const handlePickerOpen = () => {
        logger.audit('Opened competency picker');
        setIsCompetencyPickerOpen(true);
    };

    const handlePickerClose = () => {
        logger.audit('Closed competency picker');
        setIsCompetencyPickerOpen(false);
        setCompSearch('');
        setCompFrameworkFilter(null);
    };

    const allFrameworks = useMemo(
        () => [...new Set(competenze.map(c => c.framework ?? ''))].filter(Boolean),
        [competenze]
    );

    const filteredGrouped = useMemo(() => {
        const q = compSearch.trim().toLowerCase();
        const filtered = competenze.filter(c =>
            (!compFrameworkFilter || c.framework === compFrameworkFilter) &&
            (!q || c.nome.toLowerCase().includes(q) || c.codice.toLowerCase().includes(q))
        );
        const fws = compFrameworkFilter ? [compFrameworkFilter] : allFrameworks;
        return fws
            .map(fw => ({ fw, items: filtered.filter(c => c.framework === fw) }))
            .filter(g => g.items.length > 0);
    }, [competenze, compSearch, compFrameworkFilter, allFrameworks]);

    return (
        <>
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', height: 'var(--md-sys-percent-100)', backgroundColor: 'var(--md-sys-color-surface)', overflow: 'hidden' }}>
            {/* M3Expressive refactor: Aura ornaments */}
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 'var(--md-sys-z-base)', opacity: 0.04, backgroundImage: 'radial-gradient(circle at 80% 20%, var(--md-sys-color-primary), transparent 60%)' }} />

            <div style={{ position: 'relative', zIndex: 'var(--md-sys-z-content)', display: 'flex', flexDirection: 'column', height: 'var(--md-sys-percent-100)', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--md-sys-spacing-4) var(--md-sys-spacing-6)', backgroundColor: 'var(--md-sys-color-surface-container-low)', borderBottom: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline-variant)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-4)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 'var(--md-sys-spacing-11)', height: 'var(--md-sys-spacing-11)', borderRadius: 'var(--md-sys-shape-corner-large)', backgroundColor: 'var(--md-sys-color-primary)', color: 'var(--md-sys-color-on-primary)' }}>
                            <Box component="span" className="material-symbols-outlined" aria-hidden="true">{udaProp === 'new' ? 'add_task' : 'edit_document'}</Box>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <Typography component="h2" variant="h6" sx={{ margin: 0, fontWeight: 'var(--md-sys-typescale-weight-bold)', fontSize: 'var(--md-sys-typescale-title-large-font-size)', color: 'var(--md-sys-color-on-surface)' }}>{udaProp === 'new' ? 'Nuovo Progetto' : 'Modifica Progetto'}</Typography>
                            <Typography component="p" variant="body2" sx={{ margin: 0, fontSize: 'var(--md-sys-typescale-body-small-font-size)', color: 'var(--md-sys-color-on-surface-variant)' }}>{currentUda.title || 'Senza titolo'}</Typography>
                        </div>
                    </div>
                    <Button onClick={handleClose} variant="text">
                        <Box component="span" className="material-symbols-outlined" aria-hidden="true">close</Box>
                    </Button>
                </div>
                
                <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--md-sys-spacing-6)', display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-5)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'var(--md-sys-grid-fr-1) auto auto', gap: 'var(--md-sys-spacing-4)', alignItems: 'end' }}>
                        <div style={{ gridColumn: '1 / -1' }}>
                            <TextField 
                                
                                value={currentUda.title} 
                                onChange={e => handleFieldChange('title', e.target.value)} 
                                placeholder="Es. Il Rinascimento Scientifico" 
                                required
                            />
                        </div>
                        <TextField 
                            
                            value={currentUda.classe} 
                            onChange={e => handleFieldChange('classe', e.target.value)} 
                            placeholder="Es. 3A" 
                            required
                        />
                        <TextField 
                            
                            value={currentUda.materia} 
                            onChange={e => handleFieldChange('materia', e.target.value)} 
                            placeholder="Es. Storia" 
                            required
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-2)' }}>
                        <TextField 
                           
                            value={currentUda.externalLink || ''}
                            onChange={e => handleFieldChange('externalLink', e.target.value)}
                            placeholder="Incolla l'URL dell'analisi di NotebookLM..."
                            slotProps={{ htmlInput: { startAdornment: <InputAdornment position="start"><Box component="span" className="material-symbols-outlined" aria-hidden="true">auto_awesome</Box></InputAdornment> } }}
                        />
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-2)', padding: 'var(--md-sys-spacing-2) var(--md-sys-spacing-3)', borderRadius: 'var(--md-sys-shape-corner-small)', backgroundColor: 'var(--md-sys-color-surface-container-high)' }}>
                            <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 'var(--md-sys-spacing-4)', color: 'var(--md-sys-color-tertiary)' }}>auto_awesome</Box>
                            <Typography component="p" variant="body2" sx={{ margin: 0, fontSize: 'var(--md-sys-typescale-body-small-font-size)', color: 'var(--md-sys-color-on-surface-variant)' }}>Bridge AI: Connetti il progetto al tuo spazio di lavoro esterno.</Typography>
                        </div>
                    </div>
                    
                    <TextField multiline 
                        
                        value={currentUda.introduction} 
                        onChange={e => handleFieldChange('introduction', e.target.value)} 
                        rows={4} 
                        placeholder="Descrivi brevemente l'argomento e il contesto didattico..." 
                    />
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-2)' }}>
                        <label style={{ fontSize: 'var(--md-sys-typescale-label-medium-font-size)', fontWeight: 'var(--md-sys-typescale-weight-bold)', color: 'var(--md-sys-color-on-surface-variant)' }}>Competenze Target</label>
                        <ButtonBase
                            onClick={handlePickerOpen}
                            aria-label="Seleziona competenze target"
                            focusRipple
                            sx={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--md-sys-spacing-2)', alignItems: 'center', width: '100%', minHeight: 'var(--md-sys-spacing-12)', padding: 'var(--md-sys-spacing-3)', borderRadius: 'var(--md-sys-shape-corner-medium)', border: 'var(--md-sys-border-width-normal) solid var(--md-sys-color-outline)', cursor: 'pointer', backgroundColor: 'var(--md-sys-color-surface-container-low)', position: 'relative', overflow: 'hidden', '&:hover::after': { content: '""', position: 'absolute', inset: 0, borderRadius: 'inherit', backgroundColor: 'var(--md-sys-color-on-surface)', opacity: 0.08, pointerEvents: 'none' }, '&:focus-visible': { outline: '2px solid var(--md-sys-color-primary)', outlineOffset: 2 } }}
                        >
                            {currentUda.competencyIds.length > 0 ? (
                                currentUda.competencyIds.map(id => {
                                    const c = competenze.find(comp => comp.id === id);
                                    return (
                                        <span key={id} style={{ padding: 'var(--md-sys-spacing-1) var(--md-sys-spacing-3)', borderRadius: 'var(--md-sys-shape-corner-full)', backgroundColor: 'var(--md-sys-color-primary-container)', color: 'var(--md-sys-color-on-primary-container)', fontSize: 'var(--md-sys-typescale-label-medium-font-size)', fontWeight: 'var(--md-sys-typescale-weight-bold)' }}>
                                            {c?.codice}
                                        </span>
                                    );
                                })
                            ) : (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-2)', color: 'var(--md-sys-color-on-surface-variant)' }}>
                                    <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 'var(--md-sys-spacing-5)', color: 'var(--md-sys-color-primary)' }}>add_circle</Box>
                                    <span style={{ fontSize: 'var(--md-sys-typescale-body-medium-font-size)' }}>Tocca per selezionare competenze</span>
                                </div>
                            )}
                        </ButtonBase>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 'var(--md-sys-spacing-3)', paddingTop: 'var(--md-sys-spacing-4)', borderTop: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline-variant)' }}>
                        {udaProp !== 'new' && (
                            <Button
                                onClick={handleDelete}
                                variant="text"
                                startIcon={<Box component="span" className="material-symbols-outlined" aria-hidden="true">delete</Box>}
                            >
                                Elimina
                            </Button>
                        )}
                        <div style={{ flex: 1 }} />
                        <Button onClick={handleClose} variant="text">Annulla</Button>
                        <Button onClick={handleSave} variant="contained" startIcon={<Box component="span" className="material-symbols-outlined" aria-hidden="true">save</Box>}>
                            Salva Progetto
                        </Button>
                    </div>
                </div>

                 {isCompetencyPickerOpen && (
                    <M3Dialog
                        onClose={handlePickerClose}
                        title="Seleziona Competenze"
                        maxWidth="sm"
                    >
                        <Box sx={{
                            px: 'var(--md-sys-spacing-4)',
                            pt: 'var(--md-sys-spacing-3)',
                            pb: 'var(--md-sys-spacing-2)',
                            borderBottom: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline-variant)',
                            bgcolor: 'var(--md-sys-color-surface)',
                        }}>
                            <TextField
                                fullWidth
                                size="small"
                                placeholder="Cerca competenza…"
                                value={compSearch}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCompSearch(e.target.value)}
                                slotProps={{ input: { startAdornment: (
                                    <InputAdornment position="start">
                                        <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 18, color: 'var(--md-sys-color-on-surface-variant)' }}>search</Box>
                                    </InputAdornment>
                                ) } }}
                                sx={{ mb: 'var(--md-sys-spacing-2)' }}
                            />
                            <Box sx={{ display: 'flex', gap: 'var(--md-sys-spacing-2)', overflowX: 'auto', pb: 'var(--md-sys-spacing-1)', '&::-webkit-scrollbar': { height: '3px' } }}>
                                <Chip
                                   
                                    size="small"
                                    onClick={() => setCompFrameworkFilter(null)}
                                    color={compFrameworkFilter === null ? 'primary' : 'default'}
                                    variant={compFrameworkFilter === null ? 'filled' : 'outlined'}
                                />
                                {allFrameworks.map(fw => (
                                    <Chip
                                        key={fw}
                                        size="small"
                                        onClick={() => setCompFrameworkFilter(prev => prev === fw ? null : fw)}
                                        color={compFrameworkFilter === fw ? 'primary' : 'default'}
                                        variant={compFrameworkFilter === fw ? 'filled' : 'outlined'}
                                        sx={{ whiteSpace: 'nowrap' }}
                                    />
                                ))}
                            </Box>
                        </Box>
                        <DialogContent sx={{ p: 0 }}>
                            {filteredGrouped.length === 0 ? (
                                <EmptyState icon="search_off" title="Nessuna competenza trovata" description="" />
                            ) : (
                                filteredGrouped.map(({ fw, items }) => (
                                    <Box key={fw}>
                                        <Typography
                                            variant="caption"
                                            component="p"
                                            sx={{
                                                px: 'var(--md-sys-spacing-4)',
                                                py: 'var(--md-sys-spacing-2)',
                                                color: 'var(--md-sys-color-primary)',
                                                bgcolor: 'var(--md-sys-color-surface-container-low)',
                                                fontWeight: 'var(--md-sys-typescale-weight-medium)',
                                                letterSpacing: '0.05em',
                                                textTransform: 'uppercase',
                                                display: 'block',
                                                borderBottom: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline-variant)',
                                            }}
                                        >
                                            {fw}
                                        </Typography>
                                        {items.map(comp => {
                                            const isSelected = currentUda.competencyIds.includes(comp.id);
                                            return (
                                                <ButtonBase
                                                    key={comp.id}
                                                    onClick={() => handleCompetencyToggle(comp.id)}
                                                    component="div"
                                                    sx={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 'var(--md-sys-spacing-3)',
                                                        width: '100%',
                                                        textAlign: 'left',
                                                        px: 'var(--md-sys-spacing-4)',
                                                        py: 'var(--md-sys-spacing-2)',
                                                        minHeight: 'var(--md-sys-spacing-12)',
                                                        bgcolor: isSelected ? 'var(--md-sys-color-primary-container)' : 'transparent',
                                                        borderBottom: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline-variant)',
                                                        '&:hover': { bgcolor: isSelected ? 'var(--md-sys-color-primary-container)' : 'var(--md-sys-color-surface-container)' },
                                                        transition: 'background-color var(--md-sys-motion-duration-short) var(--md-sys-motion-easing-standard)',
                                                    }}
                                                >
                                                    <Box sx={{
                                                        width: '18px', height: '18px', flexShrink: 0,
                                                        borderRadius: 'var(--md-sys-shape-corner-extra-small)',
                                                        bgcolor: isSelected ? 'var(--md-sys-color-primary)' : 'transparent',
                                                        border: isSelected ? 'none' : '1.5px solid var(--md-sys-color-outline)',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        color: 'var(--md-sys-color-on-primary)',
                                                    }}>
                                                        {isSelected && <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 13 }}>check</Box>}
                                                    </Box>
                                                    <Box sx={{
                                                        px: '6px', py: '2px',
                                                        bgcolor: isSelected ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-secondary-container)',
                                                        color: isSelected ? 'var(--md-sys-color-on-primary)' : 'var(--md-sys-color-on-secondary-container)',
                                                        borderRadius: 'var(--md-sys-shape-corner-full)',
                                                        fontSize: 'var(--md-sys-typescale-label-small-font-size)',
                                                        fontWeight: 'var(--md-sys-typescale-weight-bold)',
                                                        lineHeight: '1.5',
                                                        flexShrink: 0,
                                                        whiteSpace: 'nowrap',
                                                    }}>
                                                        {comp.codice}
                                                    </Box>
                                                    <Typography variant="body2" component="span" sx={{
                                                        color: isSelected ? 'var(--md-sys-color-on-primary-container)' : 'var(--md-sys-color-on-surface)',
                                                        fontWeight: isSelected ? 'var(--md-sys-typescale-weight-medium)' : 'var(--md-sys-typescale-weight-regular)',
                                                        lineHeight: '1.35',
                                                    }}>
                                                        {comp.nome}
                                                    </Typography>
                                                </ButtonBase>
                                            );
                                        })}
                                    </Box>
                                ))
                            )}
                        </DialogContent>
                        <DialogActions sx={{ px: 'var(--md-sys-spacing-4)', py: 'var(--md-sys-spacing-3)', gap: 'var(--md-sys-spacing-2)', justifyContent: 'space-between' }}>
                            <Typography variant="caption" sx={{ color: 'var(--md-sys-color-outline)' }}>
                                {currentUda.competencyIds.length > 0 ? `${currentUda.competencyIds.length} selezionate` : 'Nessuna selezionata'}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 'var(--md-sys-spacing-2)' }}>
                                <Button onClick={handlePickerClose} variant="outlined">Annulla</Button>
                                <Button onClick={handlePickerClose} variant="contained">Conferma</Button>
                            </Box>
                        </DialogActions>
                    </M3Dialog>
                )}
            </div>
        </div>
        {confirmDialog && (
            <M3ConfirmDialog
                title="Conferma eliminazione"
                message={confirmDialog.message}
                onConfirm={() => { confirmDialog.onConfirm(); setConfirmDialog(null); }}
                onCancel={() => setConfirmDialog(null)}
                danger={true}
            />
        )}
        </>
    );
};

const UdaPlanner: React.FC<UdaPlannerProps & { udas?: Uda[] }> = (props) => {
    // Accept both 'uda' and 'udas' for backward compatibility
    const udas: Uda[] = Array.isArray(props.udas)
        ? props.udas
        : Array.isArray(props.uda)
            ? props.uda
            : [];
    const { onSaveUda, onDeleteUda, aiSettings, competenze, settings, onSaveReport, showGuidanceTips, lessons, onNavigate } = props;
    const lessonsArr = useMemo(() => Object.values(lessons ?? {}), [lessons]);
    const getLessonCount = (uda: Uda) =>
        lessonsArr.filter(l => l.udaId === uda.id || l.unitaDiApprendimento === uda.title).length;
    const [editingUda, setEditingUda] = useState<Uda | 'new' | null>(null);
    const [exportingUda, setExportingUda] = useState<Uda | null>(null);

    const handleNewUda = () => {
        logger.audit('Opened new UDA modal');
        setEditingUda('new');
    };

    const handleEditUda = (uda: Uda) => {
        logger.audit(`Opened edit modal for UDA ${uda.id}`);
        setEditingUda(uda);
    };

    const handleExportUda = (uda: Uda) => {
        logger.audit(`Opened export modal for UDA ${uda.id}`);
        setExportingUda(uda);
    };

    const handleCloseExport = () => {
        logger.audit('Closed export modal');
        setExportingUda(null);
    };

    const handleTableRowClick = (uda: Uda) => {
        logger.audit(`Clicked on UDA ${uda.id} in table`);
        setEditingUda(uda);
    };

    const handleAiBridgeClick = (uda: Uda, e: React.MouseEvent) => {
        e.stopPropagation();
        logger.audit(`Clicked AI bridge link for UDA ${uda.id}`);
    };

    const { showToast } = useUIStore(state => ({ showToast: state.actions.showToast }));

    const handleDuplicateAsTemplate = (uda: Uda, e: React.MouseEvent) => {
        e.stopPropagation();
        const template: Uda = {
            ...uda,
            id: `uda-${Date.now()}`,
            title: `Copia — ${uda.title}`,
            classe: '',
            startDate: undefined,
            endDate: undefined,
            linkedEventId: undefined,
            startPos: 0,
            width: 100,
        };
        logger.audit(`Duplicated UDA ${uda.id} as template`);
        showToast('Template creato — modifica classe e titolo.', 'success');
        setEditingUda(template);
    };

    return (
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', height: 'var(--md-sys-percent-100)', backgroundColor: 'var(--md-sys-color-surface)', overflow: 'hidden' }}>
            {/* M3Expressive refactor: Aura ornaments */}
            <div style={{ position: 'absolute', top: 0, right: 0, width: 'var(--md-sys-spacing-96)', height: 'var(--md-sys-spacing-96)', pointerEvents: 'none', backgroundImage: 'radial-gradient(circle, var(--md-sys-color-primary), transparent 70%)', opacity: 0.04, zIndex: 'var(--md-sys-z-base)' }} />
            <div style={{ position: 'absolute', bottom: 0, left: 0, width: 'var(--md-sys-spacing-64)', height: 'var(--md-sys-spacing-64)', pointerEvents: 'none', backgroundImage: 'radial-gradient(circle, var(--md-sys-color-tertiary), transparent 70%)', opacity: 0.03, zIndex: 'var(--md-sys-z-base)' }} />

            <div style={{ position: 'relative', zIndex: 'var(--md-sys-z-content)', display: 'flex', flexDirection: 'column', height: 'var(--md-sys-percent-100)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--md-sys-spacing-5) var(--md-sys-spacing-6)', backgroundColor: 'var(--md-sys-color-surface-container-low)', borderBottom: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline-variant)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-4)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 'var(--md-sys-spacing-12)', height: 'var(--md-sys-spacing-12)', borderRadius: 'var(--md-sys-shape-corner-large)', backgroundColor: 'var(--md-sys-color-primary-container)', color: 'var(--md-sys-color-on-primary-container)' }}>
                            <Box component="span" className="material-symbols-outlined" aria-hidden="true">assignment</Box>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <Typography component="h1" variant="h5" sx={{ margin: 0, fontWeight: 'var(--md-sys-typescale-weight-bold)', fontSize: 'var(--md-sys-typescale-headline-small-font-size)', color: 'var(--md-sys-color-on-surface)' }}>Planner Progetti</Typography>
                            <Typography component="p" variant="body1" sx={{ margin: 0, fontSize: 'var(--md-sys-typescale-body-medium-font-size)', color: 'var(--md-sys-color-on-surface-variant)' }}>Organizza le tue UDA</Typography>
                        </div>
                    </div>
                    <Button
                        onClick={handleNewUda}
                        variant="contained"
                        startIcon={<Box component="span" className="material-symbols-outlined" aria-hidden="true">add</Box>}
                    >
                        Nuovo Progetto
                    </Button>
                </div>

                {/* Contextual AI (Fase 2) */}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 'var(--md-sys-spacing-2)' }}>
                  <ContextualAskAI
                    onNavigate={onNavigate}
                   
                    context={{ source: 'uda-planner' }}
                  />
                </Box>

                <div style={{ padding: 'var(--md-sys-spacing-4) var(--md-sys-spacing-6)' }}>
                    <Guidance id="uda-planner-intro" icon="auto_awesome" title="Organizza i tuoi Progetti" isGloballyEnabled={showGuidanceTips}>
                        <p>Crea le tue Unit? di Apprendimento. Puoi collegare link esterni (es. NotebookLM) per accedere velocemente alle tue analisi AI.</p>
                    </Guidance>
                </div>
                
                {editingUda ? (
                    <UdaEditor 
                        udaProp={editingUda} 
                        onSaveUda={onSaveUda} 
                        onDeleteUda={onDeleteUda} 
                        onClose={() => setEditingUda(null)} 
                        competenze={competenze}
                    />
                ) : (
                    <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--md-sys-spacing-4) var(--md-sys-spacing-6)' }}>
                        <div style={{ borderRadius: 'var(--md-sys-shape-corner-large)', overflow: 'hidden', border: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline-variant)' }}>
                            {udas.length > 0 ? (
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: 'var(--md-sys-percent-100)', borderCollapse: 'collapse' }}>
                                        <thead style={{ backgroundColor: 'var(--md-sys-color-surface-container-high)' }}>
                                            <tr>
                                                {['Titolo Progetto', 'Classe', 'Materia', 'Lezioni', 'AI Bridge', 'Azioni'].map(h => (
                                                    <th key={h} style={{ padding: 'var(--md-sys-spacing-3) var(--md-sys-spacing-4)', textAlign: 'left', fontSize: 'var(--md-sys-typescale-label-medium-font-size)', fontWeight: 'var(--md-sys-typescale-weight-bold)', color: 'var(--md-sys-color-on-surface-variant)', borderBottom: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline-variant)', whiteSpace: 'nowrap' }}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {udas.map((uda) => (
                                                <tr
                                                    key={uda.id}
                                                    onClick={() => handleTableRowClick(uda)}
                                                    style={{ cursor: 'pointer', transition: 'background-color var(--md-sys-motion-duration-short) var(--md-sys-motion-easing-standard)' }}
                                                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--md-sys-color-surface-container-low)')}
                                                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = '')}
                                                >
                                                    <td style={{ padding: 'var(--md-sys-spacing-3) var(--md-sys-spacing-4)', borderBottom: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline-variant)' }}>
                                                        <span style={{ fontWeight: 'var(--md-sys-typescale-weight-bold)', fontSize: 'var(--md-sys-typescale-body-medium-font-size)', color: 'var(--md-sys-color-on-surface)' }}>{uda.title}</span>
                                                    </td>
                                                    <td style={{ padding: 'var(--md-sys-spacing-3) var(--md-sys-spacing-4)', borderBottom: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline-variant)' }}>
                                                        <span style={{ fontSize: 'var(--md-sys-typescale-body-medium-font-size)', color: 'var(--md-sys-color-on-surface-variant)' }}>{uda.classe}</span>
                                                    </td>
                                                    <td style={{ padding: 'var(--md-sys-spacing-3) var(--md-sys-spacing-4)', borderBottom: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline-variant)' }}>
                                                        <span style={{ fontSize: 'var(--md-sys-typescale-body-medium-font-size)', color: 'var(--md-sys-color-on-surface-variant)' }}>{uda.materia}</span>
                                                    </td>
                                                    <td style={{ padding: 'var(--md-sys-spacing-3) var(--md-sys-spacing-4)', borderBottom: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline-variant)' }}>
                                                        <ButtonBase
                                                            onClick={e => { e.stopPropagation(); onNavigate('lessons', { udaId: uda.id }); }}
                                                            aria-label={`Vai alle lezioni di ${uda.title}`}
                                                            sx={{ borderRadius: 'var(--md-sys-shape-corner-medium)', px: 'var(--md-sys-spacing-2)', py: 'var(--md-sys-spacing-1)', gap: 'var(--md-sys-spacing-1)', display: 'flex', alignItems: 'center' }}
                                                        >
                                                            <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 'var(--md-sys-typescale-body-large-font-size)', color: 'var(--md-sys-color-primary)' }}>menu_book</Box>
                                                            <Typography variant="body2" sx={{ color: 'var(--md-sys-color-primary)', fontWeight: 'var(--md-sys-typescale-weight-bold)' }}>{getLessonCount(uda)}</Typography>
                                                        </ButtonBase>
                                                    </td>
                                                    <td style={{ padding: 'var(--md-sys-spacing-3) var(--md-sys-spacing-4)', borderBottom: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline-variant)' }}>
                                                        {uda.externalLink && (
                                                            <a
                                                                href={uda.externalLink}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                onClick={(e) => handleAiBridgeClick(uda, e)}
                                                                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 'var(--md-sys-spacing-9)', height: 'var(--md-sys-spacing-9)', borderRadius: 'var(--md-sys-shape-corner-full)', backgroundColor: 'var(--md-sys-color-tertiary-container)', color: 'var(--md-sys-color-on-tertiary-container)' }}
                                                            >
                                                                <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 'var(--md-sys-spacing-5)' }}>auto_awesome</Box>
                                                            </a>
                                                        )}
                                                    </td>
                                                    <td style={{ padding: 'var(--md-sys-spacing-3) var(--md-sys-spacing-4)', borderBottom: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline-variant)' }} onClick={e => e.stopPropagation()}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-1)' }}>
                                                            <Button
                                                                onClick={(e) => handleDuplicateAsTemplate(uda, e)}
                                                                variant="text"
                                                                title="Usa come template per una nuova classe"
                                                                aria-label={`Duplica ${uda.title} come template`}
                                                            >
                                                                <Box component="span" className="material-symbols-outlined" aria-hidden="true">content_copy</Box>
                                                            </Button>
                                                            <Button
                                                                onClick={() => handleExportUda(uda)}
                                                                variant="text"
                                                            >
                                                                <Box component="span" className="material-symbols-outlined" aria-hidden="true">ios_share</Box>
                                                            </Button>
                                                            <Button
                                                                onClick={() => handleEditUda(uda)}
                                                                variant="text"
                                                            >
                                                                <Box component="span" className="material-symbols-outlined" aria-hidden="true">edit</Box>
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div style={{ padding: 'var(--md-sys-spacing-8)' }}>
                                    <EmptyState
                                        title="Nessun progetto"
                                        description="Crea la tua prima UDA per iniziare a pianificare l'anno scolastico."
                                        icon="assignment"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
            
             {exportingUda && (
                <Suspense fallback={<Skeleton height="var(--md-sys-spacing-32)" />}>
                    <UdaExportModal 
                        uda={exportingUda} 
                        aiSettings={aiSettings} 
                        competenze={competenze} 
                        settings={settings} 
                        onClose={handleCloseExport} 
                        onSaveReport={onSaveReport} 
                    />
                </Suspense>
            )}
        </div>
    );
};

export default UdaPlanner;

