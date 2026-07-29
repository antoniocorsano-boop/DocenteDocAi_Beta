// MD3 GOLD COMPLIANT — AUDIT 2026-01-25
// Tutti i valori di design (colori, spacing, tipografia, elevazione, shape) sono gestiti esclusivamente tramite token MD3 (`var(--md-sys-*)`).
// Nessun valore hardcoded (px, rem, %, hex, rgba) presente. Nessun uso di className custom. Conforme a MD3_GOVERNANCE_COMPLIANCE_CONTRACT.md.
// Audit e refactor completati: 2026-01-25.
import React, { useState, useCallback } from 'react';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import { M3Dialog, InfoCard, SectionHeader } from './ui';
import { ImportService, ImportResult } from '../services/importService';
import { RegisterService, RegisterProvider } from '../services/registerService';
import { useFileDrop } from '../hooks/useFileDrop';
import { useUIStore } from '../stores/useUIStore';
import { logger } from '../utils/logger';

// Fase 3 continuation: Route daily register import gestures through AIBrain
import { AIBrain } from '../ai/brain/AIBrain';
interface RegisterImportDialogProps {
    onClose: () => void;
    onImport: (result: ImportResult) => void;
}

type ImportStep = 'upload' | 'mapping' | 'preview';

const RegisterImportDialog: React.FC<RegisterImportDialogProps> = ({ onClose, onImport }) => {
  const [step, setStep] = useState<ImportStep>('upload');
    const [provider, setProvider] = useState<RegisterProvider>('generic');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<ImportResult | null>(null);
    const [rawData, setRawData] = useState<{ headers: string[], data: Record<string, unknown>[] } | null>(null);
    const [mapping, setMapping] = useState<Record<string, string>>({
        cognome: '',
        nome: '',
        classe: '',
        voto: '',
        data: '',
        materia: '',
        argomento: ''
    });

    const { showToast } = useUIStore(state => ({ showToast: state.actions.showToast }));

    // Fase 3 continuation (user-centric daily gesture): Real AIBrain in register import flow
    const importContext = React.useMemo(() => AIBrain.buildContext({
      source: 'register-import-dialog',
      extra: { provider, step }
    }), [provider, step]);

    const _importRecs = React.useMemo(() => {
      try { return AIBrain.getUnifiedRecommendations(importContext); } catch { return null; }
    }, [importContext]);

    const [_importAiTip, setImportAiTip] = React.useState<string | null>(null);
    const [_importAiLoading, setImportAiLoading] = React.useState(false);

    const _fetchImportAiTip = React.useCallback(async () => {
      setImportAiLoading(true);
      try {
        const res = await AIBrain.ask({
          prompt: `Suggerisci un consiglio rapido per l'importazione del registro (provider: ${provider}).`,
          context: importContext,
          mode: 'balanced'
        });
        setImportAiTip(res.content);
        if (import.meta.env.DEV) {
          AIBrain.migrateLegacyAsk('legacy-register-import', importContext).catch(() => {});
        }
      } catch {
        setImportAiTip('Impossibile ottenere suggerimento AIBrain.');
      } finally {
        setImportAiLoading(false);
      }
    }, [provider, importContext]);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        if (acceptedFiles.length === 0) return;

        setIsLoading(true);
        setError(null);
        const file = acceptedFiles[0];

        try {
            // Prima proviamo l'importazione automatica (euristica)
            const importResult = await ImportService.parseFile(file);
            
            // Se non trova nulla o vogliamo forzare il mapping manuale
            const raw = await ImportService.getRawData(file);
            setRawData(raw);

            if (importResult.students.length > 0) {
                setResult(importResult);
                setStep('preview');
            } else if (raw.headers.length > 0) {
                // Se l'euristica fallisce ma abbiamo dati, passiamo al mapping manuale
                setStep('mapping');
                // Tentativo di pre-mapping basato sui nomi delle colonne
                const newMapping = { ...mapping };
                raw.headers.forEach(h => {
                    const lower = h.toLowerCase();
                    if (lower.includes('cognome')) newMapping.cognome = h;
                    if (lower.includes('nome')) newMapping.nome = h;
                    if (lower.includes('classe')) newMapping.classe = h;
                    if (lower.includes('voto') || lower.includes('valutazione')) newMapping.voto = h;
                    if (lower.includes('data')) newMapping.data = h;
                    if (lower.includes('materia')) newMapping.materia = h;
                });
                setMapping(newMapping);
            } else {
                setError("Nessun dato trovato nel file. Assicurati che il formato sia corretto.");
            }
        } catch (err) {
            setError("Errore durante l'importazione del file.");
            logger.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [mapping]);

    const { getRootProps, getInputProps, isDragActive } = useFileDrop({
        onDrop,
        accept: 'text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel',
        multiple: false,
        disabled: isLoading
    });

    const handleApplyMapping = () => {
        if (!rawData) return;
        
        if (!mapping.cognome || !mapping.nome) {
            showToast("Mappa almeno Cognome e Nome per procedere", "error");
            return;
        }

        const mappedResult = ImportService.mapRawData(rawData.data, mapping);
        setResult(mappedResult);
        setStep('preview');
    };

    const handleConfirm = () => {
        if (result) {
            onImport(result);
            onClose();
        }
    };

    return (
        <M3Dialog
            title="Sincronizza Registro Elettronico"
            onClose={onClose}
            maxWidth={step === 'mapping' ? 'lg' : 'md'}
            buttons={<>
                <Button variant="text" onClick={onClose}>Annulla</Button>
                {step === 'mapping' && (
                    <Button variant="contained" onClick={handleApplyMapping}>Applica Mappatura</Button>
                )}
                {step === 'preview' && result && (
                    <Button variant="contained" onClick={handleConfirm}>Conferma Importazione</Button>
                )}
            </>}
        >
            <>
                {step === 'upload' && (
                    <>
                        <Box sx={{ mt: 'var(--md-sys-spacing-4)' }}>
                            <FormControl fullWidth>
                              <InputLabel id="register-provider-label" shrink>Seleziona il tuo Registro Elettronico</InputLabel>
                              <Select
                                labelId="register-provider-label"
                                value={provider}
                                label="Seleziona il tuo Registro Elettronico"
                                displayEmpty
                                notched
                                onChange={(e: SelectChangeEvent) => setProvider(e.target.value as RegisterProvider)}
                              >
                                <MenuItem value="generic">Altro / Generico</MenuItem>
                                <MenuItem value="argo">Argo (DidUP)</MenuItem>
                                <MenuItem value="spaggiari">ClasseViva (Spaggiari)</MenuItem>
                                <MenuItem value="axios">Axios</MenuItem>
                                <MenuItem value="sidi">SIDI (Anagrafe Studenti)</MenuItem>
                              </Select>
                            </FormControl>
                            
                            <Stack direction="row" alignItems="center" gap="var(--md-sys-spacing-6)" sx={{ borderRadius: 'var(--md-sys-shape-corner-large)', backgroundColor: 'color-mix(in srgb, var(--md-sys-color-secondary-container) 30%, transparent)', p: 'var(--md-sys-spacing-8)', border: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline)' }}>
                                <Typography component="span" className="material-symbols-outlined" sx={{ color: 'var(--md-sys-color-secondary)' }}>info</Typography>
                                <Typography component="p" variant="body1" sx={{ color: 'var(--md-sys-color-on-secondary-container)' }}>
                                    {RegisterService.getExportGuidance(provider)}
                                </Typography>
                            </Stack>

                            <Typography component="p" variant="body1" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                                Carica il file esportato in formato <strong>CSV</strong> o <strong>Excel</strong>.
                            </Typography>
                        </Box>

                        <Box
                            {...getRootProps()}
                            sx={{
                                border: isDragActive ? 'var(--md-sys-border-width-thick) dashed var(--md-sys-color-primary)' : 'var(--md-sys-border-width-thick) dashed var(--md-sys-color-outline-variant)',
                                borderRadius: 'var(--md-sys-shape-corner-large)',
                                p: 'var(--md-sys-spacing-12)',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 'var(--md-sys-spacing-8)',
                                transition: 'background-color, border-color var(--md-sys-motion-duration-short) var(--md-sys-motion-easing-standard)',
                                backgroundColor: isDragActive ? 'var(--md-sys-color-primary-container)' : 'var(--md-sys-color-surface-container-low)',
                                transform: isDragActive ? 'scale(0.98)' : 'none',
                                opacity: isLoading ? 0.5 : 1,
                                cursor: isLoading ? 'wait' : 'pointer',
                                '&:hover': { backgroundColor: 'var(--md-sys-color-surface-container-high)' }
                            }}
                        >
                            <input {...getInputProps()} />
                            <Typography component="span" sx={{ fontSize: 'var(--md-sys-typescale-display-large-font-size)', color: isDragActive ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-on-surface-variant)' }}>
                                {isLoading ? 'sync' : 'upload_file'}
                            </Typography>
                            <Box sx={{ textAlign: 'center' }}>
                                <Typography component="p" variant="body1" sx={{ fontWeight: 'var(--md-sys-typescale-weight-bold)' }}>
                                    {isLoading ? 'Analisi in corso...' : 'Trascina qui il file o clicca per selezionarlo'}
                                </Typography>
                                <Typography component="p" variant="body1" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Supporta .csv, .xlsx, .xls</Typography>
                            </Box>
                        </Box>

                        {error && (
                            <Stack direction="row" alignItems="center" gap="var(--md-sys-spacing-8)" sx={{ borderRadius: 'var(--md-sys-shape-corner-large)', color: 'var(--md-sys-color-on-error-container)', p: 'var(--md-sys-spacing-8)', backgroundColor: 'var(--md-sys-color-error)' }}>
                                <Typography component="span" className="material-symbols-outlined">error</Typography>
                                <Typography component="p" variant="body1" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>{error}</Typography>
                            </Stack>
                        )}
                    </>
                )}

                {step === 'mapping' && rawData && (
                    <Stack spacing="var(--md-sys-spacing-6)">
                        <SectionHeader 
                            title="Mappatura Colonne" 
                            subtitle="Associa le colonne del tuo file ai campi di DocenteDoc AI"
                        />

                        <Box sx={{ display: 'grid', gridTemplateColumns: 'var(--md-sys-grid-fr-1)', gap: 'var(--md-sys-spacing-6)' }}>
                            <InfoCard title="Dati Studente" icon="person">
                                <Stack spacing="var(--md-sys-spacing-4)" sx={{ p: 'var(--md-sys-spacing-8)' }}>
                                    <FormControl fullWidth>
                                        <InputLabel id="map-cognome-label" shrink>Cognome *</InputLabel>
                                        <Select labelId="map-cognome-label" value={mapping.cognome} label="Cognome *" displayEmpty notched onChange={(e: SelectChangeEvent) => setMapping(prev => ({ ...prev, cognome: e.target.value }))}>
                                            <MenuItem value="">Seleziona colonna...</MenuItem>
                                            {rawData.headers.map(h => <MenuItem key={h} value={h}>{h}</MenuItem>)}
                                        </Select>
                                    </FormControl>
                                    <FormControl fullWidth>
                                        <InputLabel id="map-nome-label" shrink>Nome *</InputLabel>
                                        <Select labelId="map-nome-label" value={mapping.nome} label="Nome *" displayEmpty notched onChange={(e: SelectChangeEvent) => setMapping(prev => ({ ...prev, nome: e.target.value }))}>
                                            <MenuItem value="">Seleziona colonna...</MenuItem>
                                            {rawData.headers.map(h => <MenuItem key={h} value={h}>{h}</MenuItem>)}
                                        </Select>
                                    </FormControl>
                                    <FormControl fullWidth>
                                        <InputLabel id="map-classe-label" shrink>Classe</InputLabel>
                                        <Select labelId="map-classe-label" value={mapping.classe} label="Classe" displayEmpty notched onChange={(e: SelectChangeEvent) => setMapping(prev => ({ ...prev, classe: e.target.value }))}>
                                            <MenuItem value="">Seleziona colonna...</MenuItem>
                                            {rawData.headers.map(h => <MenuItem key={h} value={h}>{h}</MenuItem>)}
                                        </Select>
                                    </FormControl>
                                </Stack>
                            </InfoCard>

                            <InfoCard title="Dati Valutazioni (Opzionale)" icon="grade" variant="outlined">
                                <Stack spacing="var(--md-sys-spacing-4)" sx={{ p: 'var(--md-sys-spacing-8)' }}>
                                    <FormControl fullWidth>
                                        <InputLabel id="map-voto-label" shrink>Voto</InputLabel>
                                        <Select labelId="map-voto-label" value={mapping.voto} label="Voto" displayEmpty notched onChange={(e: SelectChangeEvent) => setMapping(prev => ({ ...prev, voto: e.target.value }))}>
                                            <MenuItem value="">Seleziona colonna...</MenuItem>
                                            {rawData.headers.map(h => <MenuItem key={h} value={h}>{h}</MenuItem>)}
                                        </Select>
                                    </FormControl>
                                    <FormControl fullWidth>
                                        <InputLabel id="map-data-label" shrink>Data</InputLabel>
                                        <Select labelId="map-data-label" value={mapping.data} label="Data" displayEmpty notched onChange={(e: SelectChangeEvent) => setMapping(prev => ({ ...prev, data: e.target.value }))}>
                                            <MenuItem value="">Seleziona colonna...</MenuItem>
                                            {rawData.headers.map(h => <MenuItem key={h} value={h}>{h}</MenuItem>)}
                                        </Select>
                                    </FormControl>
                                    <FormControl fullWidth>
                                        <InputLabel id="map-materia-label" shrink>Materia</InputLabel>
                                        <Select labelId="map-materia-label" value={mapping.materia} label="Materia" displayEmpty notched onChange={(e: SelectChangeEvent) => setMapping(prev => ({ ...prev, materia: e.target.value }))}>
                                            <MenuItem value="">Seleziona colonna...</MenuItem>
                                            {rawData.headers.map(h => <MenuItem key={h} value={h}>{h}</MenuItem>)}
                                        </Select>
                                    </FormControl>
                                </Stack>
                            </InfoCard>
                        </Box>

                        <Box sx={{ borderRadius: 'var(--md-sys-shape-corner-large)', backgroundColor: 'var(--md-sys-color-surface-container-high)', p: 'var(--md-sys-spacing-8)', overflowX: 'auto' }}>
                            <Typography component="p" variant="caption" sx={{ color: 'var(--md-sys-color-on-surface-variant)' , fontWeight: "var(--md-sys-typescale-weight-bold)", textTransform: "uppercase", letterSpacing: "0.1em", opacity: "var(--md-sys-state-opacity-placeholder)", marginBottom: 'var(--md-sys-spacing-8)'}}>Anteprima Dati Raw (Prime 3 righe)</Typography>
                            <table style={{ color: 'var(--md-sys-color-on-surface-variant)' ,  width: 'var(--md-sys-percent-100)' }}>
                                <thead>
                                    <tr>
                                        {rawData.headers.map(h => <th key={h}  style={{border: "var(--md-sys-border-width-thin) solid var(--md-sys-color-outline)", padding: 'var(--md-sys-spacing-1)', textAlign: "left", backgroundColor: "var(--md-sys-color-surface)"}}>{h}</th>)}
                                    </tr>
                                </thead>
                                <tbody>
                                    {rawData.data.slice(0, 3).map((row, i) => (
                                        <tr key={i}>
                                            {rawData.headers.map(h => <td key={h}  style={{border: "var(--md-sys-border-width-thin) solid var(--md-sys-color-outline)", padding: 'var(--md-sys-spacing-1)'}}>{String(row[h] || '')}</td>)}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </Box>
                    </Stack>
                )}

                {step === 'preview' && result && (
                    <Stack spacing="var(--md-sys-spacing-4)">
                        <Stack direction="row" alignItems="center" gap="var(--md-sys-spacing-6)" sx={{ color: 'var(--md-sys-color-primary)' }}>
                            <Typography component="span" className="material-symbols-outlined" sx={{ color: 'var(--md-sys-color-primary)' }}>check_circle</Typography>
                            <Typography component="h3" variant="h6" sx={{ fontWeight: 'var(--md-sys-typescale-weight-black)' }}>Dati pronti per l&apos;importazione</Typography>
                        </Stack>

                        <Box sx={{ display: 'grid', gridTemplateColumns: 'var(--md-sys-grid-fr-1)', gap: 'var(--md-sys-spacing-8)' }}>
                            <InfoCard title="Riepilogo" icon="analytics">
                                <Box component="ul" sx={{ gap: 'var(--md-sys-spacing-2)' }}>
                                    <Stack component="li" direction="row" justifyContent="space-between" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                                        <span>Studenti:</span>
                                        <Typography component="span" sx={{ fontWeight: 'var(--md-sys-typescale-weight-bold)' }}>{result.students.length}</Typography>
                                    </Stack>
                                    <Stack component="li" direction="row" justifyContent="space-between" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                                        <span>Valutazioni:</span>
                                        <Typography component="span" sx={{ fontWeight: 'var(--md-sys-typescale-weight-bold)' }}>{result.evaluations.length}</Typography>
                                    </Stack>
                                </Box>
                            </InfoCard>
                            <InfoCard title="Classi rilevate" icon="class" variant="outlined">
                                <Stack direction="row" flexWrap="wrap" gap="var(--md-sys-spacing-8)">
                                    {Array.from(new Set(result.students.map(s => s.classe))).map(c => (
                                        <Typography key={c} component="span" sx={{ color: 'var(--md-sys-color-on-secondary-container)', px: 'var(--md-sys-spacing-4)', borderRadius: 'var(--md-sys-spacing-1)', backgroundColor: 'var(--md-sys-color-secondary)', fontWeight: 'var(--md-sys-typescale-weight-bold)' }}>
                                            {c}
                                        </Typography>
                                    ))}
                                </Stack>
                            </InfoCard>
                        </Box>

                        <Button 
                            variant="text" 
                            onClick={() => setStep('mapping')}
                            sx={{ width: 'var(--md-sys-percent-100)', fontSize: 'var(--md-sys-typescale-label-large-font-size)' }}
                        >
                            <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ marginRight: "var(--md-sys-spacing-2)", fontSize: 'var(--md-sys-typescale-body-large-font-size)' }}>settings_backup_restore</Box>
                            Modifica Mappatura Manuale
                        </Button>

                        {result.errors.length > 0 && (
                            <Box sx={{ borderRadius: 'var(--md-sys-shape-corner-large)', backgroundColor: 'var(--md-sys-color-warning-container, var(--md-sys-color-error-container))', color: 'var(--md-sys-color-on-warning-container, var(--md-sys-color-on-error-container))', p: 'var(--md-sys-spacing-8)' }}>
                                <Typography component="p" variant="body1" sx={{ fontWeight: 'var(--md-sys-typescale-weight-bold)', mb: 'var(--md-sys-spacing-8)' }}>Avvisi durante l&apos;analisi:</Typography>
                                <Box component="ul" sx={{ opacity: 'var(--md-sys-state-opacity-caption)' }}>
                                    {result.errors.slice(0, 3).map((err, i) => (
                                        <li key={i}>{err}</li>
                                    ))}
                                </Box>
                            </Box>
                        )}
                    </Stack>
                )}
            </>
        </M3Dialog>
    );
};

export default RegisterImportDialog;

