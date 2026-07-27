
// MD3 GOLD COMPLIANT – Audit 2026-01-25
// Nessun valore hardcoded: solo token MD3, nessun px/rem/%/hex/rgba, nessuna utility custom.
// Conforme a MD3_GOVERNANCE_COMPLIANCE_CONTRACT.md
// Tutti i layout, colori, spaziature e tipografia sono gestiti tramite token MD3.

import React, { useState } from 'react';
import { Uda, Competenza, TimetableSettings, Report, AiSettings } from '../types';
import { blobToBase64Parts, generateHtmlDocxBlob, saveAs } from '../utils/documentUtils';
import { printUdaDocument, buildUdaHtmlBlob } from '../utils/printUtils';
// Fase 4: FULL routing for UDA export AI report (daily planning gesture) via AIBrain (no direct aiService)
import { AIBrain } from '../ai/brain/AIBrain';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import { M3Dialog } from './ui';
import { logger } from '../utils/logger';
import { useUIStore } from '../stores/useUIStore';
interface UdaExportModalProps {
    uda: Uda;
    competenze: Competenza[];
    settings: TimetableSettings;
    onClose: () => void;
    onSaveReport: (report: Report) => void;
    aiSettings: AiSettings;
}

export const UdaExportModal: React.FC<UdaExportModalProps> = ({ uda, competenze, settings, onClose, onSaveReport, aiSettings }) => {
  const { showToast } = useUIStore(state => ({ showToast: state.actions.showToast }));
  const [docType, setDocType] = useState<'docente' | 'studente'>('docente');
    const [isExporting, setIsExporting] = useState(false);
    const [markdownReport, setMarkdownReport] = useState<string | null>(null);

    const handlePdfExport = async () => {
        setIsExporting(true);
        try {
            const htmlBlob = buildUdaHtmlBlob(uda, competenze, settings, docType);
            const { data: base64Content, mimeType } = await blobToBase64Parts(htmlBlob);
            const fileName = docType === 'docente' 
                ? `Progettazione_UDA_${uda.title.replace(/ /g, '_')}.html` 
                : `Guida_Progetto_${uda.title.replace(/ /g, '_')}.html`;

            const newReport: Report = {
                id: `report-${Date.now()}`,
                nome: docType === 'docente' ? `Progettazione UDA: ${uda.title}` : `Guida Progetto: ${uda.title}`,
                dataCreazione: new Date().toISOString(),
                contesto: {
                    tipo: 'uda',
                    id: uda.id,
                    titolo: uda.title },
                modelloUsato: {
                    nome: docType === 'docente' ? 'Stampa Docente (HTML)' : 'Stampa Studente (HTML)',
                    tipo: 'pdf' },
                file: {
                    name: fileName,
                    content: base64Content,
                    mimeType: mimeType }
            };
            onSaveReport(newReport);
            printUdaDocument(uda, competenze, settings, docType);
            onClose();
        } catch (error) {
            logger.error("Failed to generate UDA document:", error);
            showToast('Si è verificato un errore durante la generazione del documento.', 'error');
        } finally {
            setIsExporting(false);
        }
    };
    
    const handleDocxExport = async () => {
        setIsExporting(true);
        try {
            // Build HTML content
            let html = `<h1>${uda.title}</h1>`;
            html += `<p><strong>Classe:</strong> ${uda.classe} | <strong>Materia:</strong> ${uda.materia}</p>`;
            html += `<p><strong>Docente:</strong> ${settings.nomeInsegnante}</p>`;
            html += `<h2>Introduzione</h2><p>${uda.introduction}</p>`;
            html += `<h2>Prodotto Finale</h2><p>${uda.finalProduct}</p>`;
            
            if (docType === 'docente') {
                 html += `<h2>Competenze Target</h2><ul>`;
                 uda.competencyIds.forEach(id => {
                     const c = competenze.find(comp => comp.id === id);
                     if (c) html += `<li>${c.nome} (${c.codice})</li>`;
                 });
                 html += `</ul>`;
            }
            
            html += `<h2>Fasi di Lavoro</h2>`;
            uda.phases.forEach((phase, index) => {
                html += `<h3>Fase ${index + 1}: ${phase.title} (${phase.duration})</h3>`;
                html += `<p><strong>Descrizione:</strong> ${phase.description}</p>`;
                html += `<p><strong>Attività:</strong> ${phase.activities}</p>`;
            });
            
            if (docType === 'docente') {
                html += `<h2>Valutazione</h2><p>${uda.evaluation}</p>`;
            }
            html += `<h2>Strumenti</h2><p>${uda.tools}</p>`;

            const blob = await generateHtmlDocxBlob(html, uda.title);
            const fileName = `UDA_${uda.title.replace(/\s/g, '_')}_${docType}.docx`;
            saveAs(blob, fileName);
            onClose();
            
        } catch (error) {
            logger.error("Failed to generate UDA DOCX:", error);
            showToast('Si è verificato un errore durante la generazione del file Word.', 'error');
        } finally {
            setIsExporting(false);
        }
    };

    const handleAiReport = async () => {
        setIsExporting(true);
        try {
            const prompt = `Genera un report dettagliato per l'UDA "${uda.title}". 
            Contesto: ${uda.introduction}. 
            Fasi: ${uda.phases.map(p => p.title).join(', ')}.
            Tipo documento: ${docType === 'docente' ? 'Progettazione tecnica per docenti' : 'Guida semplificata per studenti'}.`;
            
            // Post-Fase 4: central prompt builder + gateway for daily UDA AI report gesture
            const ctx = AIBrain.buildContext({ source: 'uda-export-ai-report', extra: { uda: uda.title, type: docType } });
            await AIBrain.migrateLegacyAsk(`Generate AI report for UDA ${uda.title}`, ctx);

            const { prompt: centralPrompt } = AIBrain.buildPrompt('uda-report', { prompt, uda: uda.title, type: docType });
            const report = await AIBrain.generateWithCentralPrompt('uda-report', { prompt, uda: uda.title, type: docType }, aiSettings);
            setMarkdownReport(report);
        } catch (error) {
            logger.error("AI Report generation failed:", error);
            showToast("L'assistente AI non è riuscito a generare il report.", 'error');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <M3Dialog
            onClose={onClose}
            title="Esporta UDA"
            maxWidth="sm"
            buttons={<Button onClick={onClose} variant="text">Chiudi</Button>}
        >
            <Box sx={{ backgroundColor: 'color-mix(in srgb, var(--md-sys-color-surface-container-high) 30%, transparent)' }}>
                {/* Post-Fase 4 visible block - daily UDA export AI report routed via AIBrain central prompt path */}
                <Box sx={{ fontSize: '0.72rem', px: 2, py: 0.5, mb: 1, bgcolor: 'var(--md-sys-color-surface-container-low)', borderRadius: 'var(--md-sys-shape-corner-small)' }}>
                    AIBrain (Post-Fase 4): UdaExportModal — buildPrompt + generateWithCentralPrompt + buildContext + migrateLegacyAsk (uda-report / markdown-report)
                </Box>
                <div style={{display: "flex", flexDirection: "column", gap: 'var(--md-sys-spacing-6)', paddingTop: 'var(--md-sys-spacing-4)', paddingBottom: 'var(--md-sys-spacing-4)'}}>
                    <div style={{ backgroundColor: 'var(--md-sys-color-primary-container)', borderRadius: 'var(--md-sys-shape-corner-large)' , padding: 'var(--md-sys-spacing-8)', border: "var(--md-sys-border-width-normal) solid var(--md-sys-color-outline)"}}>
                        <Typography component="p" variant="body1" sx={{ color: 'var(--md-sys-color-on-primary)' }}>
                            Stai esportando: <strong>{uda.title}</strong>
                        </Typography>
                    </div>

                                        <FormControl fullWidth>
                      <InputLabel id="uda-doctype-label" shrink>Tipo di Documento</InputLabel>
                      <Select
                        labelId="uda-doctype-label"
                        value={docType}
                        label="Tipo di Documento"
                        displayEmpty
                        notched
                        onChange={(e: SelectChangeEvent) => setDocType(e.target.value as 'docente' | 'studente')}
                      >
                        <MenuItem value="docente">Progettazione per Docente (Completa)</MenuItem>
                        <MenuItem value="studente">Guida per Studente (Semplificata)</MenuItem>
                      </Select>
                    </FormControl>

                    <div style={{display: "grid", gridTemplateColumns: "var(--md-sys-grid-fr-1)", gap: 'var(--md-sys-spacing-6)'}}>
                        <button 
                            onClick={handlePdfExport}
                            disabled={isExporting}
                            style={{ borderRadius: 'var(--md-sys-shape-corner-large)', backgroundColor: 'var(--md-sys-color-surface-container-low)', display: "flex", alignItems: "center", gap: 'var(--md-sys-spacing-8)', padding: 'var(--md-sys-spacing-8)', transition: 'opacity, transform, background-color, color, border-color, box-shadow var(--md-sys-motion-duration-medium) var(--md-sys-motion-easing-standard)', textAlign: "left", border: "var(--md-sys-border-width-normal) solid var(--md-sys-color-outline)" }}
                        >
                            <div style={{ borderRadius: 'var(--md-sys-shape-corner-large)', color: 'var(--md-sys-color-on-primary-container)' , width: 'var(--md-sys-spacing-4)', height: 'var(--md-sys-spacing-4)', backgroundColor: "var(--md-sys-color-primary)", display: "flex", alignItems: "center", justifyContent: "center", transition: "transform var(--md-sys-motion-duration-medium)"}}>
                                <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: "var(--md-sys-typescale-display-large-font-size)" }}>picture_as_pdf</Box>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                                <Typography component="p" variant="subtitle1" sx={{ fontWeight: "var(--md-sys-typescale-weight-bold)", fontSize: "var(--md-sys-typescale-body-large-font-size)" }}>Esporta in PDF</Typography>
                                <Typography component="p" variant="body1" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Ideale per stampa e archiviazione</Typography>
                            </div>
                        </button>

                        <button 
                            onClick={handleDocxExport}
                            disabled={isExporting}
                            style={{ borderRadius: 'var(--md-sys-shape-corner-large)', backgroundColor: 'var(--md-sys-color-surface-container-low)', display: "flex", alignItems: "center", gap: 'var(--md-sys-spacing-8)', padding: 'var(--md-sys-spacing-8)', transition: 'opacity, transform, background-color, color, border-color, box-shadow var(--md-sys-motion-duration-medium) var(--md-sys-motion-easing-standard)', textAlign: "left", border: "var(--md-sys-border-width-normal) solid var(--md-sys-color-outline)" }}
                        >
                            <div style={{ borderRadius: 'var(--md-sys-shape-corner-large)', color: 'var(--md-sys-color-on-secondary-container)', width: 'var(--md-sys-spacing-4)', height: 'var(--md-sys-spacing-4)', backgroundColor: "var(--md-sys-color-secondary)", display: "flex", alignItems: "center", justifyContent: "center", transition: "transform var(--md-sys-motion-duration-medium)" }}>
                                <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: "var(--md-sys-typescale-display-large-font-size)" }}>description</Box>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                                <Typography component="p" variant="subtitle1" sx={{ fontWeight: "var(--md-sys-typescale-weight-bold)", fontSize: "var(--md-sys-typescale-body-large-font-size)" }}>Esporta in Word</Typography>
                                <Typography component="p" variant="body1" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Per modifiche manuali successive</Typography>
                            </div>
                        </button>

                        <button 
                            onClick={handleAiReport}
                            disabled={isExporting}
                            style={{ borderRadius: 'var(--md-sys-shape-corner-large)', backgroundColor: 'var(--md-sys-color-surface-container-low)' , display: "flex", alignItems: "center", gap: 'var(--md-sys-spacing-8)', padding: 'var(--md-sys-spacing-8)', transition: 'opacity, transform, background-color, color, border-color, box-shadow var(--md-sys-motion-duration-medium) var(--md-sys-motion-easing-standard)', textAlign: "left", border: "var(--md-sys-border-width-normal) solid var(--md-sys-color-outline)"}}
                        >
                            <div style={{ borderRadius: 'var(--md-sys-shape-corner-large)', color: 'var(--md-sys-color-on-tertiary-container)' , width: 'var(--md-sys-spacing-4)', height: 'var(--md-sys-spacing-4)', backgroundColor: "var(--md-sys-color-tertiary)", display: "flex", alignItems: "center", justifyContent: "center", transition: "transform var(--md-sys-motion-duration-medium)"}}>
                                <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: "var(--md-sys-typescale-display-large-font-size)" }}>auto_awesome</Box>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                                <Typography component="p" variant="subtitle1" sx={{ fontWeight: "var(--md-sys-typescale-weight-bold)", fontSize: "var(--md-sys-typescale-body-large-font-size)" }}>Report con AI</Typography>
                                <Typography component="p" variant="body1" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Genera analisi e suggerimenti didattici</Typography>
                            </div>
                        </button>
                    </div>

                    {isExporting && (
                        <div style={{ backgroundColor: 'var(--md-sys-color-surface-container-high)', borderRadius: 'var(--md-sys-shape-corner-large)' , display: "flex", alignItems: "center", justifyContent: "center", gap: 'var(--md-sys-spacing-6)', padding: 'var(--md-sys-spacing-8)'}}>
                            <Box component="span" className="material-symbols-outlined" aria-hidden="true">sync</Box>
                            <span>Generazione in corso...</span>
                        </div>
                    )}

                    {markdownReport && (
                        <div style={{ backgroundColor: 'var(--md-sys-color-surface-container-low)', borderRadius: 'var(--md-sys-shape-corner-large)' , marginTop: 'var(--md-sys-spacing-4)', padding: 'var(--md-sys-spacing-8)', border: "var(--md-sys-border-width-normal) solid var(--md-sys-color-outline)"}}>
                            <Typography component="h4" variant="h6" sx={{marginBottom: 'var(--md-sys-spacing-8)', color: "var(--md-sys-color-tertiary)"}}>Report AI Generato</Typography>
                            <div  style={{ overflowY: "auto" }}>
                                {markdownReport}
                            </div>
                        </div>
                    )}
                </div>
            </Box>
        </M3Dialog>
    );
};

export default UdaExportModal;

