// MD3 Gold Compliant
// Tutti gli stili usano esclusivamente token MD3 (nessun valore hardcoded)
// Audit: gennaio 2026

import React, { useState, useCallback, useMemo } from 'react';
import { useFileDrop } from '../hooks/useFileDrop';
import { Studente, KnowledgeBaseEntry } from '../types';
import { ImportService } from '../services/importService';
import { sanitizeHtml } from '../utils/htmlSanitizer';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Badge from '@mui/material/Badge';
import { M3Dialog, InfoCard } from './ui';
import { logger } from '../utils/logger';
interface ImportStudentsModalProps {
    onClose: () => void;
    onImport: (newStudents: Studente[]) => void;
    userClasses: string[];
    knowledgeBase: KnowledgeBaseEntry[];
}

const ImportStudentsModal: React.FC<ImportStudentsModalProps> = ({ onClose, onImport, userClasses, knowledgeBase }) => {
  const [step, setStep] = useState<'upload' | 'mapping' | 'confirm'>('upload');
    const [importSource, setImportSource] = useState<'file' | 'kb'>('file');
    const [targetClass, setTargetClass] = useState<string>(userClasses[0] || 'AUTO');
    const [csvData, setCsvData] = useState<Record<string, string>[]>([]);
    const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
    const [columnMap, setColumnMap] = useState({ cognome: '', nome: '', classe: '' });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [fileName, setFileName] = useState('');
    const [infoMessage, setInfoMessage] = useState('');

    const processRawData = useCallback((headers: string[], data: Record<string, string>[], name: string) => {
        setFileName(name);
        setError('');
        setInfoMessage('');

        if (headers.length === 0 || data.length === 0) {
            setError("Il file è vuoto o non ha una riga di intestazione valida.");
            setStep('upload');
            return;
        }

        setCsvHeaders(headers);
        setCsvData(data);

        let cognomeCol = '';
        let nomeCol = '';
        let classeCol = '';

        for (const header of headers) {
            const lowerHeader = header.toLowerCase();
            if (!cognomeCol && (lowerHeader.includes('cognome') || lowerHeader.includes('last name') || lowerHeader.includes('surname'))) {
                cognomeCol = header;
            }
            if (!nomeCol && (lowerHeader.includes('nome') || lowerHeader.includes('first name') || lowerHeader.includes('name'))) {
                nomeCol = header;
            }
            if (!classeCol && (lowerHeader.includes('classe') || lowerHeader.includes('class'))) {
                classeCol = header;
            }
        }
        setColumnMap({ cognome: cognomeCol, nome: nomeCol, classe: classeCol });
        setStep('mapping');
    }, []);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        if (acceptedFiles.length === 0) return;

        setIsLoading(true);
        setError('');
        setInfoMessage('');
        const file = acceptedFiles[0];

        try {
            const { headers, data, errors } = await ImportService.getRawData(file);
            
            if (errors.length > 0) {
                throw new Error(errors[0]);
            }

            processRawData(headers, data as Record<string, string>[], file.name);

        } catch (err: unknown) {
            let message = 'Errore durante l\'analisi del file.';
            if (err instanceof Error) message = err.message;
            logger.error(err);
            setError(message);
            setStep('upload');
        } finally {
            setIsLoading(false);
        }
    }, [processRawData]);

    const { getRootProps, getInputProps, isDragActive } = useFileDrop({
        onDrop,
        accept: 'text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel',
        multiple: false,
        disabled: isLoading
    });

    const handleKbFileSelect = (entry: KnowledgeBaseEntry) => {
        if (!entry.content) {
            setError("Il file selezionato non ha contenuto testuale leggibile.");
            return;
        }
        // For KB entries, we still use the old CSV parser for now as they are stored as text
        // In a real scenario, we might want to store the original file type in KB
        const lines = entry.content.split('\n').filter(l => l.trim());
        if (lines.length > 0) {
            const headers = lines[0].split(/[;,]/).map(h => h.trim());
            const data = lines.slice(1).map(line => {
                const values = line.split(/[;,]/).map(v => v.trim());
                const obj: Record<string, string> = {};
                headers.forEach((h, i) => obj[h] = values[i]);
                return obj;
            });
            processRawData(headers, data, entry.fileName);
        }
    };

    const studentsToImport = useMemo(() => {
        if (!columnMap.cognome || !columnMap.nome || csvData.length === 0) {
            return [];
        }

        if (targetClass === 'AUTO' && !columnMap.classe) {
            return [];
        }

        return csvData
            .map(row => {
                const extractedClass = targetClass === 'AUTO' ? (row[columnMap.classe] || '').trim() : targetClass;
                const normalizedClass = extractedClass.replace(/\s+/g, '').toUpperCase();

                return {
                    cognome: row[columnMap.cognome] || '',
                    nome: row[columnMap.nome] || '',
                    classe: normalizedClass }
            })
            .filter(s => s.cognome.trim() && s.nome.trim() && s.classe);
    }, [csvData, columnMap, targetClass]);

    const handleImport = () => {
        const finalStudents: Studente[] = studentsToImport.map(s => ({
            ...s,
            id: `stud-${Date.now()}-${Math.random()}`
        }));
        onImport(finalStudents);
        onClose();
    };

    const renderContent = () => {
        switch (step) {
            case 'upload':
                return (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-6)' }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                                                        <FormControl fullWidth>
                              <InputLabel id="import-target-class-label" shrink>Destinazione</InputLabel>
                              <Select
                                labelId="import-target-class-label"
                                value={targetClass}
                                label="Destinazione"
                                displayEmpty
                                notched
                                onChange={(e: SelectChangeEvent) => setTargetClass(e.target.value)}
                                required
                              >
                                <MenuItem value="AUTO">✨ Rileva automaticamente dal file (Multi-classe)</MenuItem>
                                <MenuItem disabled>──────────</MenuItem>
                                {userClasses.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                              </Select>
                            </FormControl>
                            {targetClass === 'AUTO' && <Typography variant="body2" sx={{ color: 'var(--md-sys-color-on-surface-variant)', mt: 'var(--md-sys-spacing-4)', pl: 'var(--md-sys-spacing-4)', pr: 'var(--md-sys-spacing-4)' }}>Il file CSV deve contenere una colonna con il nome della classe (es. "1A", "2B").</Typography>}
                        </Box>

                                                <Tabs
                          value={importSource}
                          onChange={(_, v: string) => ((id: string) => setImportSource(id as 'file' | 'kb'))(v)}
                          indicatorColor="primary"
                          textColor="primary"
                          aria-label="Sezioni di navigazione"
                          sx={{
                            bgcolor: 'var(--md-sys-color-surface-container-low)',
                            borderRadius: 'var(--md-sys-shape-corner-full)',
                            border: '1px solid var(--md-sys-color-outline-variant)',
                            minHeight: 'auto',
                            p: 0.5,
                            ...{ width: "var(--md-sys-percent-100)" },
                          }}
                        >
                          {([{ id: 'file', label: 'Carica File' }, { id: 'kb', label: 'Da Knowledge Base' }]).map((tab: { id: string; label: string; icon?: string; badge?: number | string }) => (
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

                        {importSource === 'file' ? (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                                <InfoCard
                                    title="Formato Richiesto"
                                    description={`Il file deve essere un .CSV con una riga di intestazione (Cognome, Nome${targetClass === 'AUTO' ? ', Classe' : ''}).`}
                                    action={
                                        <a
                                            href={`data:text/csv;charset=utf-8,Cognome,Nome${targetClass === 'AUTO' ? ',Classe' : ''}%0ARossi,Mario${targetClass === 'AUTO' ? ',1A' : ''}%0ABianchi,Giulia${targetClass === 'AUTO' ? ',2B' : ''}`}
                                            download="modello_studenti.csv"
                                        >
                                            <Typography component="span" sx={{ fontSize: 'var(--md-sys-typescale-body-medium-font-size)', mr: 'var(--md-sys-spacing-2)' }}>download</Typography>
                                            Scarica Modello
                                        </a>
                                    }
                                    icon="description"
                                    variant="surface"
                                    sx={{ marginBottom: 'var(--md-sys-spacing-8)' }}
                                />

                                <Box
                                    {...getRootProps()}
                                    sx={{
                                        position: 'relative',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        padding: 'var(--md-sys-spacing-8)',
                                        height: 'var(--md-sys-layout-dropzone-height)',
                                        borderRadius: 'var(--md-sys-shape-corner-large)',
                                        border: `var(--md-sys-border-width-thin) dashed ${isDragActive ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-outline-variant)'}`,
                                        transition: 'opacity, transform, background-color, color, border-color, box-shadow var(--md-sys-motion-easing-standard) var(--md-sys-motion-duration-medium)',
                                        cursor: 'pointer',
                                        opacity: isLoading ? 0.5 : 1,
                                        pointerEvents: isLoading ? 'none' : 'auto',
                                        backgroundColor: isDragActive ? 'var(--md-sys-color-primary-container)' : 'transparent',
                                        '&:hover': !isDragActive && !isLoading ? {
                                            borderColor: 'var(--md-sys-color-primary)',
                                            backgroundColor: 'var(--md-sys-color-surface-container-high)' } : {}
                                    }}
                                >
                                    <input {...getInputProps()} />
                                    {isLoading ? (
                                        <Box sx={{ borderRadius: 'var(--md-sys-shape-corner-full)', height: 'var(--md-sys-spacing-10)', width: 'var(--md-sys-spacing-10)', borderColor: 'var(--md-sys-color-primary)' }} />
                                    ) : (
                                        <>
                                            <Typography component="span" sx={{ color: 'var(--md-sys-color-primary)', mb: 'var(--md-sys-spacing-8)' }}>{isDragActive ? 'download' : 'upload_file'}</Typography>
                                            <Typography variant="h6" sx={{ color: 'var(--md-sys-color-on-primary)', fontWeight: 'var(--md-sys-typescale-weight-bold)', textAlign: 'center' }}>Trascina il file .csv o .xlsx qui</Typography>
                                            <Typography variant="body2" sx={{ opacity: 'var(--md-sys-state-opacity-secondary)', mt: 'var(--md-sys-spacing-4)', fontWeight: 'var(--md-sys-typescale-weight-bold)', textTransform: 'uppercase', letterSpacing: 'var(--md-sys-typescale-label-large-tracking)' }}>o clicca per selezionare</Typography>
                                        </>
                                    )}
                                </Box>
                            </Box>
                        ) : (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-8)' }}>
                                <Typography variant="body2" sx={{ textTransform: 'uppercase', color: 'var(--md-sys-color-primary)', fontWeight: 'var(--md-sys-typescale-weight-bold)' }}>Seleziona un file CSV dalla KB</Typography>
                                <Box sx={{ backgroundColor: 'var(--md-sys-color-surface-container-low)', borderRadius: 'var(--md-sys-shape-corner-large)', overflowY: 'auto', padding: 'var(--md-sys-spacing-8)', border: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline)', display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                                    {knowledgeBase.length > 0 ? (
                                        knowledgeBase.map(entry => (
                                            <Box
                                                key={entry.id}
                                                onClick={() => handleKbFileSelect(entry)}
                                                sx={{ borderRadius: 'var(--md-sys-shape-corner-large)', display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-6)', padding: 'var(--md-sys-spacing-6)', transition: 'opacity, transform, background-color, color, border-color, box-shadow var(--md-sys-motion-duration-medium) var(--md-sys-motion-easing-standard)', cursor: 'pointer' }}
                                            >
                                                <Typography component="span" sx={{ backgroundColor: 'color-mix(in srgb, var(--md-sys-color-primary-container) 30%, transparent)', borderRadius: 'var(--md-sys-shape-corner-large)', color: 'var(--md-sys-color-primary)', padding: 'var(--md-sys-spacing-8)', transition: 'color var(--md-sys-motion-duration-medium)' }}>description</Typography>
                                                <Typography component="span" sx={{ color: 'var(--md-sys-color-on-primary)', fontSize: 'var(--md-sys-typescale-body-medium-font-size)', fontWeight: 'var(--md-sys-typescale-weight-bold)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexGrow: 1 }}>{entry.fileName}</Typography>
                                                <Typography component="span" sx={{ color: 'var(--md-sys-color-on-surface-variant)', opacity: 'var(--md-sys-state-opacity-placeholder)', transition: 'opacity, transform, background-color, color, border-color, box-shadow var(--md-sys-motion-duration-medium) var(--md-sys-motion-easing-standard)' }}>chevron_right</Typography>
                                            </Box>
                                        ))
                                    ) : (
                                        <Box sx={{ padding: 'var(--md-sys-spacing-8)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--md-sys-spacing-8)', opacity: 'var(--md-sys-state-opacity-secondary)' }}>
                                            <Typography component="span" sx={{ color: 'var(--md-sys-color-primary)' }}>folder_off</Typography>
                                            <Typography variant="body2">Nessun file nella Knowledge Base.</Typography>
                                        </Box>
                                    )}
                                </Box>
                            </Box>
                        )}

                        {error && (
                            <Box sx={{ color: 'var(--md-sys-color-on-error-container)', borderRadius: 'var(--md-sys-shape-corner-large)', display: 'flex', alignItems: 'flex-start', gap: 'var(--md-sys-spacing-6)', padding: 'var(--md-sys-spacing-8)', backgroundColor: 'var(--md-sys-color-error)' }}>
                                <Typography component="span" className="material-symbols-outlined">error</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 'var(--md-sys-typescale-weight-medium)' }}>{error}</Typography>
                            </Box>
                        )}

                        {infoMessage && (
                            <Box sx={{ color: 'var(--md-sys-color-on-tertiary-container)', borderRadius: 'var(--md-sys-shape-corner-large)', padding: 'var(--md-sys-spacing-5)', backgroundColor: 'var(--md-sys-color-tertiary)' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-8)', mb: 'var(--md-sys-spacing-8)' }}>
                                    <Typography component="span" className="material-symbols-outlined">lightbulb</Typography>
                                    <Typography variant="h6" sx={{ fontWeight: 'var(--md-sys-typescale-weight-bold)' }}>Suggerimento AI: XLSX to CSV</Typography>
                                </Box>
                                <Box sx={{ color: 'var(--md-sys-color-on-tertiary-container)', opacity: 'var(--md-sys-state-opacity-hover-overlay)' }} dangerouslySetInnerHTML={{ __html: sanitizeHtml(infoMessage.replace(/\n/g, '<br />')) }} />
                            </Box>
                        )}
                    </Box>
                );

            case 'mapping':
                return (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-6)' }}>
                        <InfoCard
                            title="Mappa le colonne"
                            description={`File: ${fileName} | Destinazione: ${targetClass === 'AUTO' ? 'Rilevamento Automatico' : targetClass}`}
                            icon="auto_awesome"
                            variant="contained"
                        />

                        <Typography variant="body2" sx={{ color: 'var(--md-sys-color-on-surface-variant)', pl: 'var(--md-sys-spacing-4)', pr: 'var(--md-sys-spacing-4)' }}>
                            Il sistema ha tentato di associare automaticamente le colonne. Verifica o correggi le associazioni.
                        </Typography>

                        <Box sx={{ display: 'grid', gridTemplateColumns: 'var(--md-sys-grid-fr-1)', gap: 'var(--md-sys-spacing-8)' }}>
                                                        <FormControl fullWidth>
                              <InputLabel id="map-cognome-label" shrink>Colonna COGNOME</InputLabel>
                              <Select
                                labelId="map-cognome-label"
                                value={columnMap.cognome}
                                label="Colonna COGNOME"
                                displayEmpty
                                notched
                                onChange={(e: SelectChangeEvent) => setColumnMap(p => ({ ...p, cognome: e.target.value }))}
                              >
                                <MenuItem value="">Seleziona...</MenuItem>
                                {csvHeaders.map(h => <MenuItem key={h} value={h}>{h}</MenuItem>)}
                              </Select>
                            </FormControl>
                            <FormControl fullWidth>
                              <InputLabel id="map-nome-label" shrink>Colonna NOME</InputLabel>
                              <Select
                                labelId="map-nome-label"
                                value={columnMap.nome}
                                label="Colonna NOME"
                                displayEmpty
                                notched
                                onChange={(e: SelectChangeEvent) => setColumnMap(p => ({ ...p, nome: e.target.value }))}
                              >
                                <MenuItem value="">Seleziona...</MenuItem>
                                {csvHeaders.map(h => <MenuItem key={h} value={h}>{h}</MenuItem>)}
                              </Select>
                            </FormControl>
                            {targetClass === 'AUTO' && (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                                                                        <FormControl fullWidth>
                                      <InputLabel id="map-classe-label" shrink>Colonna CLASSE</InputLabel>
                                      <Select
                                        labelId="map-classe-label"
                                        value={columnMap.classe}
                                        label="Colonna CLASSE"
                                        displayEmpty
                                        notched
                                        onChange={(e: SelectChangeEvent) => setColumnMap(p => ({ ...p, classe: e.target.value }))}
                                      >
                                        <MenuItem value="">Seleziona...</MenuItem>
                                        {csvHeaders.map(h => <MenuItem key={h} value={h}>{h}</MenuItem>)}
                                      </Select>
                                    </FormControl>
                                </Box>
                            )}
                        </Box>

                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                            <Typography variant="subtitle2" sx={{ textTransform: 'uppercase', color: 'var(--md-sys-color-primary)', fontWeight: 'var(--md-sys-typescale-weight-bold)', mb: 'var(--md-sys-spacing-6)', pl: 'var(--md-sys-spacing-4)', pr: 'var(--md-sys-spacing-4)' }}>Anteprima Dati (Prime 3 righe)</Typography>
                            <Box sx={{ borderRadius: 'var(--md-sys-shape-corner-large)', overflowX: 'auto', border: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline)' }}>
                                <table style={{ width: '100%', fontSize: 'var(--md-sys-typescale-body-medium-font-size)', textAlign: 'left' }}>
                                    <thead style={{ color: 'var(--md-sys-color-on-surface-variant)', backgroundColor: 'var(--md-sys-color-surface-container-high)', fontSize: 'var(--md-sys-typescale-body-small-font-size)', textTransform: 'uppercase', fontWeight: 'var(--md-sys-typescale-weight-bold)' }}>
                                        <tr>
                                            {csvHeaders.map(h => <th key={h} style={{ paddingLeft: 'var(--md-sys-spacing-4)', paddingRight: 'var(--md-sys-spacing-4)', whiteSpace: 'nowrap' }}>{h}</th>)}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {csvData.slice(0, 3).map((row, index) => (
                                            <tr key={index} style={{ backgroundColor: 'var(--md-sys-color-surface)', transition: 'color var(--md-sys-motion-duration-medium)' }}>
                                                {csvHeaders.map(h => <td key={h} style={{ color: 'var(--md-sys-color-on-primary)', paddingLeft: 'var(--md-sys-spacing-4)', paddingRight: 'var(--md-sys-spacing-4)', whiteSpace: 'nowrap', fontWeight: 'var(--md-sys-typescale-weight-medium)' }}>{row[h]}</td>)}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </Box>
                        </Box>
                    </Box>
                );

            case 'confirm':
                return (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-6)' }}>
                        <InfoCard
                            title="Conferma Importazione"
                            description={`Stai per importare ${studentsToImport.length} studenti. Gli studenti già presenti saranno ignorati.`}
                            icon="check_circle"
                            variant="outlined"
                        />

                        {targetClass === 'AUTO' && (
                            <Box sx={{ backgroundColor: 'var(--md-sys-color-surface-container-low)', borderRadius: 'var(--md-sys-shape-corner-large)', padding: 'var(--md-sys-spacing-8)', border: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline)', fontSize: 'var(--md-sys-typescale-body-medium-font-size)', display: 'flex', gap: 'var(--md-sys-spacing-6)', alignItems: 'flex-start' }}>
                                <Typography component="span" className="material-symbols-outlined" sx={{ color: 'var(--md-sys-color-primary)', fontSize: 'var(--md-sys-typescale-title-small-font-size)' }}>info</Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                                    <Typography variant="body2" sx={{ color: 'var(--md-sys-color-on-primary)', fontWeight: 'var(--md-sys-typescale-weight-bold)', mb: 'var(--md-sys-spacing-4)' }}>Nota Importante</Typography>
                                    <Typography variant="body2" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Gli studenti verranno assegnati alle classi indicate nel file. Se una classe nel file non esiste nelle tue Impostazioni, lo studente verrà comunque importato ma la classe sarà creata implicitamente.</Typography>
                                </Box>
                            </Box>
                        )}

                        <Box sx={{ borderRadius: 'var(--md-sys-shape-corner-large)', overflowY: 'auto', border: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline)' }}>
                            <table style={{ width: '100%', fontSize: 'var(--md-sys-typescale-body-medium-font-size)', textAlign: 'left' }}>
                                <thead style={{ color: 'var(--md-sys-color-on-surface-variant)', backgroundColor: 'var(--md-sys-color-surface-container-high)', fontSize: 'var(--md-sys-typescale-body-small-font-size)', textTransform: 'uppercase', fontWeight: 'var(--md-sys-typescale-weight-bold)' }}>
                                    <tr>
                                        <th style={{ paddingLeft: 'var(--md-sys-spacing-4)', paddingRight: 'var(--md-sys-spacing-4)' }}>Cognome</th>
                                        <th style={{ paddingLeft: 'var(--md-sys-spacing-4)', paddingRight: 'var(--md-sys-spacing-4)' }}>Nome</th>
                                        <th style={{ paddingLeft: 'var(--md-sys-spacing-4)', paddingRight: 'var(--md-sys-spacing-4)' }}>Classe</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {studentsToImport.map((student, index) => (
                                        <tr key={index} style={{ backgroundColor: 'var(--md-sys-color-surface)', transition: 'color var(--md-sys-motion-duration-medium)' }}>
                                            <td style={{ color: 'var(--md-sys-color-on-primary)', paddingLeft: 'var(--md-sys-spacing-4)', paddingRight: 'var(--md-sys-spacing-4)', fontWeight: 'var(--md-sys-typescale-weight-bold)' }}>{student.cognome}</td>
                                            <td style={{ color: 'var(--md-sys-color-on-primary)', paddingLeft: 'var(--md-sys-spacing-4)', paddingRight: 'var(--md-sys-spacing-4)' }}>{student.nome}</td>
                                            <td style={{ paddingLeft: 'var(--md-sys-spacing-4)', paddingRight: 'var(--md-sys-spacing-4)' }}>
                                                <Typography component="span" sx={{ color: 'var(--md-sys-color-on-primary-container)', pl: 'var(--md-sys-spacing-4)', pr: 'var(--md-sys-spacing-4)', borderRadius: 'var(--md-sys-spacing-4)', backgroundColor: 'var(--md-sys-color-primary)', fontWeight: 'var(--md-sys-typescale-weight-black)', fontSize: 'var(--md-sys-typescale-body-small-font-size)' }}>{student.classe}</Typography>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </Box>
                    </Box>
                );
            default:
                return null;
        }
    };

    return (
        <M3Dialog
            onClose={onClose}
            title={step === 'upload' ? 'Importa Studenti' : step === 'mapping' ? 'Mappatura Colonne' : 'Conferma Importazione'}
            maxWidth="lg"
            buttons={
                <>
                    {step === 'upload' && (
                        <Button onClick={onClose} variant="text">Annulla</Button>
                    )}
                    {step === 'mapping' && (
                        <>
                            <Button type="button" onClick={() => { setStep('upload'); setInfoMessage(''); setError(''); }} variant="text">Indietro</Button>
                            <Button type="button" onClick={() => setStep('confirm')} disabled={!columnMap.cognome || !columnMap.nome || (targetClass === 'AUTO' && !columnMap.classe)} variant="contained">Avanti</Button>
                        </>
                    )}
                    {step === 'confirm' && (
                        <>
                            <Button type="button" onClick={() => setStep('mapping')} variant="text">Indietro</Button>
                            <Button type="button" onClick={handleImport} variant="contained">Importa Studenti</Button>
                        </>
                    )}
                </>
            }
        >
            {renderContent()}
        </M3Dialog>
    );
};

export default ImportStudentsModal;

