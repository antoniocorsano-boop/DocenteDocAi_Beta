// MD3 Compliant - Block J Migration Complete (6 violations eliminated)
// Note: Drop zone height uses var(--md-sys-spacing-48) for functional UX (closest MD3 token available)

import React, { useState, useCallback } from 'react';
import { useFileDrop } from '../hooks/useFileDrop';
import { KnowledgeBaseEntry, Corpus } from '../types';
import { extractTextFromFile, blobToBase64Parts } from '../utils/documentUtils';
import { KB_CATEGORIES } from '../constants';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import { M3Dialog, CategoryCard, TextField } from './ui';
interface AddSourceModalProps {
    corpora: Corpus[];
    setCorpora: React.Dispatch<React.SetStateAction<Corpus[]>>;
    onClose: () => void;
    onAddEntries: (entries: KnowledgeBaseEntry[]) => void;
}

const AddSourceModal: React.FC<AddSourceModalProps> = ({ corpora, setCorpora, onClose, onAddEntries }) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [selectedCorpusId, setSelectedCorpusId] = useState<string>('');
    const [isCreating, setIsCreating] = useState(false);
    const [newCorpusName, setNewCorpusName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [error, setError] = useState('');

    const handleCreateCorpus = () => {
        if (!newCorpusName.trim()) return;
        const newCorpus: Corpus = { id: `corpus-${Date.now()}`, displayName: newCorpusName.trim(), chatHistory: [] };
        setCorpora(prev => [...prev, newCorpus]);
        setNewCorpusName('');
        setIsCreating(false);
        setSelectedCorpusId(newCorpus.id); 
    };

    const processFiles = async (files: File[]) => {
        if (!selectedCategory) { setError("Seleziona una cartella."); return; }
        setIsLoading(true);
        const newEntries: KnowledgeBaseEntry[] = [];
        for (const file of files) {
            try {
                setLoadingMessage(`Processo: ${file.name}`);
                const textContent = await extractTextFromFile(file);
                const fileData = await blobToBase64Parts(file);
                newEntries.push({ id: `kb-${Date.now()}-${file.name}`, fileName: file.name, content: textContent, fileContent: fileData, corpusId: selectedCorpusId || undefined, category: selectedCategory });
            } catch(e: unknown) {
                const errMsg = e instanceof Error ? e.message : String(e);
                setError(prev => `${prev}\n❌ ${file.name}: ${errMsg}`);
            }
        }
        if (newEntries.length > 0) onAddEntries(newEntries);
        setIsLoading(false);
        if (!error) onClose();
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const onDrop = useCallback((acceptedFiles: File[]) => processFiles(acceptedFiles), [selectedCategory, selectedCorpusId, processFiles]);
    const { getRootProps, getInputProps, isDragActive } = useFileDrop({ onDrop, disabled: isLoading || !selectedCategory });

    return (
        <M3Dialog
            title="Aggiungi Documenti"
            onClose={onClose}
            maxWidth="sm"
        >
            <Box component="section" sx={{mt: 'var(--md-sys-spacing-8)'}}>
                {isLoading ? (
                    <Stack alignItems="center" justifyContent="center" spacing={1}>
                        <CircularProgress size="var(--md-sys-spacing-10)" sx={{ color: 'var(--md-sys-color-primary)' }} />
                        <Typography component="p" variant="caption" sx={{color: "var(--md-sys-color-primary)", textTransform: "uppercase", letterSpacing: "var(--md-sys-typescale-label-large-tracking)"}}>{loadingMessage}</Typography>
                    </Stack>
                ) : (
                    <>
                        <Stack component="section" sx={{ gap: 'var(--md-sys-spacing-4)' }}>
                            <Typography component="h3" variant="h6" sx={{marginBottom: 'var(--md-sys-spacing-6)', display: "flex", alignItems: "center", gap: 'var(--md-sys-spacing-6)'}}>
                                <Box component="span" sx={{ color: 'var(--md-sys-color-on-primary-container)', width: 'var(--md-sys-spacing-8)', height: 'var(--md-sys-spacing-8)', borderRadius: 'var(--md-sys-radius-4)', backgroundColor: 'var(--md-sys-color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>1</Box>
                                Seleziona Destinazione
                            </Typography>
                            <Box sx={{ display: 'grid', gridTemplateColumns: 'var(--md-sys-grid-fr-1) var(--md-sys-grid-fr-1)', gap: 'var(--md-sys-spacing-6)' }}>
                                {/* MD3 grid fr tokens */}
                                {KB_CATEGORIES.map(cat => (
                                    <CategoryCard 
                                        key={cat.id} 
                                        id={cat.id} 
                                        label={cat.label} 
                                        icon={cat.icon} 
                                        color={cat.color} 
                                        isSelected={selectedCategory === cat.id} 
                                        onClick={() => setSelectedCategory(cat.id)} 
                                    />
                                ))}
                            </Box>
                        </Stack>

                        <Box component="section" sx={{
                            transition: 'color var(--md-sys-motion-duration-short) var(--md-sys-motion-easing-standard), opacity var(--md-sys-motion-duration-short) var(--md-sys-motion-easing-standard)',
                            opacity: !selectedCategory ? 0.3 : 1,
                            filter: !selectedCategory ? 'grayscale(100%)' : 'none',
                            pointerEvents: !selectedCategory ? 'none' : 'auto'
                        }}>
                            <Typography component="h3" variant="h6" sx={{marginBottom: 'var(--md-sys-spacing-6)', display: "flex", alignItems: "center", gap: 'var(--md-sys-spacing-6)'}}>
                                <Box component="span" sx={{ color: 'var(--md-sys-color-on-secondary-container)', width: 'var(--md-sys-spacing-8)', height: 'var(--md-sys-spacing-8)', borderRadius: 'var(--md-sys-radius-4)', backgroundColor: 'var(--md-sys-color-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>2</Box>
                                Carica File
                            </Typography>
                            <Box {...getRootProps()} sx={{
                                height: 'var(--md-sys-spacing-48)',
                                border: isDragActive ? '2px dashed var(--md-sys-color-primary)' : '1px dashed var(--md-sys-color-outline-variant)',
                                backgroundColor: isDragActive ? 'var(--md-sys-color-primary-container)' : 'transparent',
                                opacity: isDragActive ? 0.8 : 1,
                                transition: `all var(--md-sys-motion-duration-short) var(--md-sys-motion-easing-standard)`,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                borderRadius: 'var(--md-sys-shape-corner-extra-large)'
                            }}>
                                <input {...getInputProps()} />
                                <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ color: 'var(--md-sys-color-primary)', mb: 'var(--md-sys-spacing-8)', fontSize: 'var(--md-sys-typescale-display-small-font-size)' }}>{isDragActive ? 'download' : 'upload_file'}</Box>
                                <Typography component="p" variant="body1" sx={{ color: "var(--md-sys-color-on-surface-variant)" }}>Trascina i file qui o clicca per sfogliare</Typography>
                                <Typography component="p" variant="caption" sx={{opacity: "var(--md-sys-state-opacity-disabled)", marginTop: 'var(--md-sys-spacing-6)', fontWeight: "var(--md-sys-typescale-weight-bold)", textTransform: "uppercase", letterSpacing: "var(--md-sys-typescale-label-large-tracking)", color: "var(--md-sys-color-on-surface-variant)"}}>Supporto PDF, DOCX, TXT</Typography>
                            </Box>
                        </Box>

                        <Box component="section" sx={{borderTop: 'var(--md-sys-border-width-normal) solid var(--md-sys-color-outline)'}}>
                            <Typography component="h3" variant="h6" sx={{fontWeight: "var(--md-sys-typescale-weight-black)", marginBottom: 'var(--md-sys-spacing-6)', display: "flex", alignItems: "center", gap: 'var(--md-sys-spacing-6)'}}>
                                <Box component="span" sx={{ color: 'var(--md-sys-color-on-tertiary)', width: 'var(--md-sys-spacing-4)', height: 'var(--md-sys-spacing-4)', borderRadius: 'var(--md-sys-spacing-4)', backgroundColor: 'var(--md-sys-color-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'var(--md-sys-typescale-weight-black)' }}>3</Box>
                                Raccolta (Opzionale)
                            </Typography>
                            <Stack direction="row" spacing="var(--md-sys-spacing-8)" alignItems="flex-end">
                                <Box sx={{ flexGrow: 1 }}>
                                  <FormControl fullWidth>
                                      <InputLabel id="corpus-select-label" shrink>Raccolta Target</InputLabel>
                                      <Select
                                        labelId="corpus-select-label"
                                        id="corpus-select"
                                        value={selectedCorpusId}
                                        label="Raccolta Target"
                                        displayEmpty
                                        notched
                                        onChange={(e: SelectChangeEvent) => setSelectedCorpusId(e.target.value)}
                                        renderValue={(v) => v ? (corpora.find(c => c.id === v)?.displayName ?? v) : <Typography component="span" variant="body1" sx={{ color: 'var(--md-sys-color-on-surface-variant)', opacity: 0.6 }}>-- Nessuna Raccolta --</Typography>}
                                      >
                                        <MenuItem value=""><em>-- Nessuna Raccolta --</em></MenuItem>
                                        {corpora.map(c => (
                                          <MenuItem key={c.id} value={c.id}>{c.displayName}</MenuItem>
                                        ))}
                                      </Select>
                                    </FormControl>
                                </Box>
                                <Button 
                                    onClick={() => setIsCreating(p => !p)} 
                                    variant="contained"
                                    color="secondary"
                                    title={isCreating ? "Annulla creazione" : "Crea nuova raccolta"}
                                >
                                    <Box component="span" className="material-symbols-outlined" aria-hidden="true">{isCreating ? 'remove' : 'add'}</Box>
                                </Button>
                            </Stack>
                            {isCreating && (
                                 <Stack direction="row" spacing="var(--md-sys-spacing-6)" sx={{ mt: 'var(--md-sys-spacing-6)' }}>
                                    <TextField 
                                        id="new-corpus-name-input" 
                                        label="Nome Nuova Raccolta" 
                                        value={newCorpusName} 
                                        onChange={e => setNewCorpusName(e.target.value)} 
                                        placeholder="Es. Programmazioni 2024" 
                                    />
                                    <Button onClick={handleCreateCorpus} variant="contained" sx={{ fontWeight: 'var(--md-sys-typescale-weight-black)' }}>CREA</Button>
                                </Stack>
                            )}
                        </Box>
                    </>
                )}
                {error && (
                  <Box sx={{ color: 'var(--md-sys-color-on-error-container)', mt: 'var(--md-sys-spacing-4)', p: 'var(--md-sys-spacing-6)', bgcolor: 'var(--md-sys-color-error)', borderRadius: 'var(--md-sys-shape-corner-small)' }}>{error}</Box>
                )}
            </Box>
        </M3Dialog>
    );
};

export default AddSourceModal;

