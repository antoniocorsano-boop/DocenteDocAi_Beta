// MD3 Compliant - Block J Migration Complete (1 violation eliminated)

import React, { useState, useMemo } from 'react';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { Report } from '../types';
import { saveAs } from '../utils/documentUtils';
import { EmptyState } from './ui';

// Fase 3 continuation: Route daily report archive gestures through AIBrain
import { AIBrain } from '../ai/brain/AIBrain';


// M3Expressive: Refactored to use dedicated CSS classes with M3 tokens for report archive layout, search functionality, and table styling
interface ArchivioReportProps {
    reportistica: Report[];
    onDeleteReport: (reportId: string) => void;
    onSaveReportToKb: (report: Report) => void;
}

const ArchivioReport: React.FC<ArchivioReportProps> = ({ reportistica, onDeleteReport, onSaveReportToKb }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredReports = reportistica.filter(r => 
        r.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.contesto.titolo.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Fase 3 continuation (user-centric daily gesture): Real AIBrain consumption in ArchivioReport
    const reportsContext = useMemo(() => AIBrain.buildContext({
      source: 'archivio-report',
      extra: { reportsCount: reportistica.length, filteredCount: filteredReports.length }
    }), [reportistica.length, filteredReports.length]);

    const reportsRecs = useMemo(() => {
      try {
        return AIBrain.getUnifiedRecommendations(reportsContext);
      } catch {
        return null;
      }
    }, [reportsContext]);

    const [reportsAiTip, setReportsAiTip] = React.useState<string | null>(null);
    const [reportsAiLoading, setReportsAiLoading] = React.useState(false);

    const fetchReportsAiTip = React.useCallback(async () => {
      setReportsAiLoading(true);
      try {
        const res = await AIBrain.ask({
          prompt: `Suggerisci un insight rapido per l'archivio report (totale: ${reportistica.length}).`,
          context: reportsContext,
          mode: 'balanced'
        });
        setReportsAiTip(res.content);
        if (import.meta.env.DEV) {
          AIBrain.migrateLegacyAsk('legacy-archivio-report', reportsContext).catch(() => {});
        }
      } catch {
        setReportsAiTip('Impossibile ottenere suggerimento AIBrain.');
      } finally {
        setReportsAiLoading(false);
      }
    }, [reportistica.length, reportsContext]);

    // Auto-fetch tip on mount / count change (daily gesture)
    React.useEffect(() => {
      if (reportistica.length > 0) {
        fetchReportsAiTip();
      }
    }, [reportistica.length, fetchReportsAiTip]);
    
    const handleDownload = (report: Report) => {
        const byteCharacters = atob(report.file.content);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: report.file.mimeType });
        saveAs(blob, report.file.name);
    };

    return (
        <Stack spacing={2}>
            <Box>
                <Typography component="h1" variant="h5" sx={{ mb: 'var(--md-sys-spacing-2)' }}>Archivio Report</Typography>
                <Typography component="p" variant="body1" sx={{ color: 'var(--md-sys-color-on-surface-variant)', m: 0 }}>Consulta, esporta e salva i report generati con l'AI.</Typography>
            </Box>
            <Stack spacing={2}>
                <Stack direction="row" alignItems="center" spacing={1.5}>
                        <Box component="span" className="material-symbols-outlined" aria-hidden="true">search</Box>
                        <TextField
                            type="text"
                            placeholder="Cerca report per nome o contesto..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            size="small"
                            fullWidth
                            inputProps={{ 'aria-label': 'Cerca report per nome o contesto' }}
                        />
                </Stack>

                {/* Fase 3 continuation: Real AIBrain consumption + visible block (daily report archive gesture) */}
                {reportsRecs?.primary && (
                  <Box sx={{ mt: 1, p: 1.5, borderRadius: 'var(--md-sys-shape-corner-medium)', bgcolor: 'var(--md-sys-color-primary-container)' }}>
                    <Typography variant="caption" sx={{ color: 'var(--md-sys-color-on-primary-container)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Box component="span" className="material-symbols-outlined" sx={{ fontSize: '1rem' }}>auto_awesome</Box>
                      AIBrain (Fase 3): {reportsRecs.primary.label || reportsRecs.primary.title}
                    </Typography>
                  </Box>
                )}

                <Box sx={{ mt: 1, mb: 2, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={fetchReportsAiTip}
                    disabled={reportsAiLoading}
                    startIcon={<Box component="span" className="material-symbols-outlined" sx={{ fontSize: '1rem' }}>auto_awesome</Box>}
                  >
                    {reportsAiLoading ? 'AIBrain…' : 'Insight AIBrain (Report)'}
                  </Button>
                  {reportsAiTip && (
                    <Box sx={{ p: 1, borderRadius: 'var(--md-sys-shape-corner-small)', bgcolor: 'var(--md-sys-color-tertiary-container)', flex: 1, minWidth: 180 }}>
                      <Typography variant="caption" sx={{ color: 'var(--md-sys-color-on-tertiary-container)', fontWeight: 500 }}>
                        AIBrain (Fase 3): {reportsAiTip}
                      </Typography>
                    </Box>
                  )}
                </Box>
                <Box>
                    <table>
                        <thead>
                            <tr>
                                <th>Nome Report</th>
                                <th>Data Creazione</th>
                                <th>Contesto</th>
                                <th>Modello Usato</th>
                                <th>Azioni</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredReports.map(report => (
                                <tr key={report.id}>
                                    <td>{report.nome}</td>
                                    <td>{new Date(report.dataCreazione).toLocaleDateString('it-IT')}</td>
                                    <td>{report.contesto.titolo}</td>
                                    <td>
                                        <span 
                                            style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                padding: 'var(--md-sys-spacing-1) var(--md-sys-spacing-2)',
                                                borderRadius: 'var(--md-sys-shape-corner-small)',
                                                fontSize: 'var(--md-sys-typescale-body-large-font-size)', // caption equivalent
                                                fontWeight: 'var(--md-sys-typescale-weight-medium)',
                                                border: 'none',
                                                backgroundColor: report.modelloUsato.tipo === 'pdf' ? 'var(--md-sys-color-error-container)' : 'var(--md-sys-color-primary-container)',
                                                color: report.modelloUsato.tipo === 'pdf' ? 'var(--md-sys-color-on-error-container)' : 'var(--md-sys-color-on-primary-container)'
                                            }}
                                        >
                                            {report.modelloUsato.nome}
                                        </span>
                                    </td>
                                    <td>
                                            <IconButton onClick={() => onSaveReportToKb(report)} title="Salva in Knowledge Base" aria-label="Salva report in Knowledge Base"><Box component="span" className="material-symbols-outlined" aria-hidden="true">inventory_2</Box></IconButton>
                                            <IconButton onClick={() => handleDownload(report)} title="Scarica" aria-label="Scarica report"><Box component="span" className="material-symbols-outlined" aria-hidden="true">download</Box></IconButton>
                                            <IconButton onClick={() => onDeleteReport(report.id)} title="Elimina" aria-label="Elimina report"><Box component="span" className="material-symbols-outlined" aria-hidden="true">delete</Box></IconButton>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Box>
                {filteredReports.length === 0 && (
                  <EmptyState
                    icon="description"
                    title={reportistica.length > 0 ? 'Nessun risultato' : 'Nessun report'}
                    description={reportistica.length > 0 ? 'Nessun report corrisponde alla ricerca.' : 'Nessun report generato. Esportane uno da un progetto per vederlo qui.'}
                  />
                )}
            </Stack>
        </Stack>
    );
}

export default ArchivioReport;

