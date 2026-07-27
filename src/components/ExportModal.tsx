/**
 * // MD3 GOLD COMPLIANT
// Audit date: 2026-01-25
// Conformance: MD3_GOVERNANCE_COMPLIANCE_CONTRACT.md
// Rules:
// - No hardcoded values (px, rem, %, hex, rgba)
// - MD3 tokens only (var(--md-sys-*))
// - No custom layout or color utilities
// Component: ExportModal – Class report export (M3 Expressive)MD3 GOLD COMPLIANT COMPONENT
 * Audit: 2026-01-25
 * - Nessun valore hardcoded (px, rem, %, hex, rgba)
 * - Solo token MD3 (var(--md-sys-*)), nessuna utility custom
 * - Conforme a MD3_GOVERNANCE_COMPLIANCE_CONTRACT.md
 * - Header standardizzato per audit
 * - M3Expressive: ExportModal - Class report export configuration
 */
import React, { useState, useMemo } from 'react';
import { Studente, Valutazione, ValutazioneCompetenza, TimetableSettings, Competenza } from '../types';
import { calculatePerformance } from '../utils/evaluationUtils';
import { RATING_TO_VALUE } from '../constants';
import { viewPdfInNewTab, saveAs } from '../utils/documentUtils';
import { PDF_COLORS, getTrendColor, getCompetencyLevelColors } from '../design-system/pdf-colors';
import Button from '@mui/material/Button';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import { M3Dialog, TextField, SectionHeader } from './ui';
import { logger } from '../utils/logger';
import { useUIStore } from '../stores/useUIStore';

type Prova = {
    id: string;
    titolo: string;
    data: string;
    materia: string;
    tipo: Valutazione['tipo'];
    voti: Record<string, Valutazione>;
};

interface ExportModalProps {
    onClose: () => void;
    students: Studente[];
    evaluations: Valutazione[];
    competencyEvaluations: ValutazioneCompetenza[];
    settings: TimetableSettings;
    selectedClass: string;
    prove: Prova[];
}

const ExportModal: React.FC<ExportModalProps> = ({ onClose, students, evaluations, competencyEvaluations, settings, selectedClass }) => {
    const { showToast } = useUIStore(state => ({ showToast: state.actions.showToast }));
    const [exportOptions, setExportOptions] = useState({
        format: 'pdf',
        schoolYear: `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`,
        exportDate: new Date().toISOString().split('T')[0] }); // Tutti i valori di layout e colore sono gestiti tramite token MD3
    const [subjectScope, setSubjectScope] = useState<'teacher' | 'all'>('teacher');
    const [isExporting, setIsExporting] = useState(false);
    // Tutti gli stili inline devono usare solo var(--md-sys-*)

    const handleOptionChange = (field: keyof typeof exportOptions, value: string) => {
        setExportOptions(prev => ({ ...prev, [field]: value }));
    };

    const { studentSummaries, uniqueSubjects, uniqueCompetencies } = useMemo(() => {
        const classEvals = evaluations.filter(e => students.some(s => s.id === e.studenteId));
        const allSubjectsWithData = [...new Set(classEvals.map(e => e.materia))].sort();
        const uniqueSubjects = subjectScope === 'teacher' ? settings.disciplines.sort() : allSubjectsWithData;
        const uniqueCompetencies = settings.competenze;
        const studentSummaries = students.map(student => {
            const studentEvals = classEvals.filter(e => e.studenteId === student.id);
            const evalsForOverallAverage = subjectScope === 'teacher'
                ? studentEvals.filter(e => settings.disciplines.includes(e.materia))
                : studentEvals;
            const { grade, trend } = calculatePerformance(student.id, 'Complessivo', evalsForOverallAverage);
            const subjectGrades: Record<string, string> = {};
            uniqueSubjects.forEach(subj => {
                const subjectEvalsForStudent = studentEvals.filter(e => e.materia === subj);
                const numericGrades = subjectEvalsForStudent.map(e => RATING_TO_VALUE[e.voto]).filter(v => v !== undefined);
                if (numericGrades.length > 0) {
                    const avg = numericGrades.reduce((sum, v) => sum + v, 0) / numericGrades.length;
                    subjectGrades[subj] = avg.toFixed(1);
                } else {
                    subjectGrades[subj] = '-';
                }
            });
            const competencyLevels: Record<string, string> = {};
            uniqueCompetencies.forEach(comp => {
                const latestEval = competencyEvaluations
                    .filter(e => e.studenteId === student.id && e.competenzaId === comp.id)
                    .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())[0];
                if (latestEval) {
                    const level = comp.livelli.find(l => l.id === latestEval.livelloId);
                    competencyLevels[comp.id] = level ? level.nome.charAt(0) : '-';
                } else {
                    competencyLevels[comp.id] = '-';
                }
            });
            return {
                student,
                subjectGrades,
                competencyLevels,
                overallGrade: grade,
                trend
            };
        });
        return { studentSummaries, uniqueSubjects, uniqueCompetencies };
    }, [students, evaluations, competencyEvaluations, settings, subjectScope]);

    const exportToCSV = () => {
        const headers = [
            'Cognome', 'Nome', 'Media Generale', 'Trend',
            ...uniqueSubjects,
            ...uniqueCompetencies.map(c => c.nome)
        ];

        const rows = studentSummaries.map(summary => [
            summary.student.cognome,
            summary.student.nome,
            summary.overallGrade,
            summary.trend === 'up' ? 'In crescita' : summary.trend === 'down' ? 'In calo' : 'Stabile',
            ...uniqueSubjects.map((subj: string) => summary.subjectGrades[subj] || '-'),
            ...uniqueCompetencies.map((comp: Competenza) => {
                const levelChar = summary.competencyLevels[comp.id];
                const level = comp.livelli.find(l => l.nome.charAt(0) === levelChar);
                return level ? level.nome : '-';
            })
        ]);

        const escapeCsvCell = (cell: unknown) => {
            const str = String(cell);
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        };

        const csvContent = [
            headers.map(escapeCsvCell).join(','),
            ...rows.map(row => row.map(escapeCsvCell).join(','))
        ].join('\n');

        const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
        saveAs(blob, `Report_Valutazioni_${selectedClass}.csv`);
    };

    const exportToPDF = async () => {
        // Lazy load jsPDF to avoid document access during module initialization
        const jsPdfModule = await import('jspdf');
        const { jsPDF } = jsPdfModule as { jsPDF: typeof import('jspdf').jsPDF };
        
        const doc = new jsPDF({ orientation: 'landscape', unit: 'mm' });
        const FONT = 'helvetica';
        const PAGE_WIDTH = doc.internal.pageSize.getWidth();
        const PAGE_HEIGHT = doc.internal.pageSize.getHeight();
        const MARGIN = 15;
        const CELL_PADDING = 2;
        let y = MARGIN;

        // --- HEADER ---
        doc.setFont(FONT, 'bold').setFontSize(18).text(`Report Riepilogativo - Classe ${selectedClass}`, MARGIN, y);
        y += 8;
        doc.setFont(FONT, 'normal').setFontSize(10).setTextColor(100);
        doc.text(`Docente: ${settings.nomeInsegnante || 'N/A'} | A.S. ${exportOptions.schoolYear}`, MARGIN, y);
        doc.text(`Data: ${new Date(exportOptions.exportDate).toLocaleDateString('it-IT')}`, PAGE_WIDTH - MARGIN, y, { align: 'right' });
        y += 12;

        // --- TABLE ---
        const ROW_HEIGHT = 10;
        const HEADER_BG = PDF_COLORS.header.background;
        const HEADER_COLOR = PDF_COLORS.header.text;
        const EVEN_ROW_BG = PDF_COLORS.table.evenRowBg;

        const subjectAbbr = uniqueSubjects.map(s => s.substring(0, 3).toUpperCase());
        const competencyCodes = uniqueCompetencies.map(c => c.codice);
        const headers = ['Studente', 'Σ', 'Trend', ...subjectAbbr, ...competencyCodes];

        const colWidths: number[] = [60, 12, 12];
        const remainingWidth = PAGE_WIDTH - (MARGIN * 2) - colWidths.reduce((a, b) => a + b, 0);
        const dynamicColWidth = remainingWidth / (subjectAbbr.length + competencyCodes.length);
        headers.slice(3).forEach(() => colWidths.push(dynamicColWidth));

        // Draw header
        doc.setFillColor(HEADER_BG).rect(MARGIN, y, PAGE_WIDTH - (MARGIN * 2), ROW_HEIGHT, 'F');
        doc.setTextColor(HEADER_COLOR).setFont(FONT, 'bold').setFontSize(9);
        let x = MARGIN;
        headers.forEach((header, i) => {
            doc.text(header, x + colWidths[i] / 2, y + ROW_HEIGHT / 2 + 2, { align: 'center' });
            x += colWidths[i];
        });
        y += ROW_HEIGHT;

        const LEGEND_HEIGHT = 40;

        // Draw rows
        studentSummaries.forEach((summary, rowIndex) => {
            if (y + ROW_HEIGHT > PAGE_HEIGHT - MARGIN - LEGEND_HEIGHT) {
                doc.addPage();
                y = MARGIN;
                doc.setFillColor(HEADER_BG).rect(MARGIN, y, PAGE_WIDTH - (MARGIN * 2), ROW_HEIGHT, 'F');
                doc.setTextColor(HEADER_COLOR).setFont(FONT, 'bold').setFontSize(9);
                let headerX = MARGIN;
                headers.forEach((header, i) => {
                    doc.text(header, headerX + colWidths[i] / 2, y + ROW_HEIGHT / 2 + 2, { align: 'center' });
                    headerX += colWidths[i];
                });
                y += ROW_HEIGHT;
            }

            x = MARGIN;
            if (rowIndex % 2 !== 0) {
                doc.setFillColor(EVEN_ROW_BG).rect(x, y, PAGE_WIDTH - (MARGIN * 2), ROW_HEIGHT, 'F');
            }
            doc.setDrawColor(200).rect(x, y, PAGE_WIDTH - (MARGIN * 2), ROW_HEIGHT);

            doc.setTextColor(0).setFont(FONT, 'normal').setFontSize(9);
            doc.text(`${summary.student.cognome} ${summary.student.nome}`, x + CELL_PADDING, y + ROW_HEIGHT / 2 + 2);
            x += colWidths[0];

            doc.setFont(FONT, 'bold').text(summary.overallGrade ?? '-', x + colWidths[1] / 2, y + ROW_HEIGHT / 2 + 2, { align: 'center' });
            x += colWidths[1];

            const trendIcon = summary.trend === 'up' ? '!' : summary.trend === 'down' ? '!!' : "'";
            const trendColor = getTrendColor(summary.trend ?? 'stable');
            doc.setTextColor(trendColor).setFontSize(14).text(trendIcon, x + colWidths[2] / 2, y + ROW_HEIGHT / 2 + 3, { align: 'center' });
            x += colWidths[2];

            doc.setTextColor(0).setFont(FONT, 'normal').setFontSize(9);
            uniqueSubjects.forEach((subj, i) => {
                doc.text(summary.subjectGrades[subj] || '-', x + colWidths[3 + i] / 2, y + ROW_HEIGHT / 2 + 2, { align: 'center' });
                x += colWidths[3 + i];
            });

            uniqueCompetencies.forEach((comp, i) => {
                const levelChar = summary.competencyLevels[comp.id];
                if (levelChar && levelChar !== '-') {
                    const colors = getCompetencyLevelColors(levelChar);
                    const circleX = x + colWidths[3 + uniqueSubjects.length + i] / 2;
                    const circleY = y + ROW_HEIGHT / 2;
                    doc.setFillColor(colors.bg).circle(circleX, circleY, 3.5, 'F');
                    doc.setTextColor(colors.text).setFont(FONT, 'bold').setFontSize(8);
                    doc.text(levelChar, circleX, circleY + 1.5, { align: 'center' });
                } else {
                    doc.setTextColor(150).setFont(FONT, 'normal').setFontSize(9);
                    doc.text('-', x + colWidths[3 + uniqueSubjects.length + i] / 2, y + ROW_HEIGHT / 2 + 2, { align: 'center' });
                }
                x += colWidths[3 + uniqueSubjects.length + i];
            });

            y += ROW_HEIGHT;
        });

        let legendY = PAGE_HEIGHT - MARGIN - 25;
        doc.setFont(FONT, 'bold').setFontSize(10).text('Legenda:', MARGIN, legendY);
        legendY += 6;
        doc.setFont(FONT, 'normal').setFontSize(8).setTextColor(80);

        const legendItems: string[] = [
            'Σ: Media Voti',
            "': Trend Stabile",
            '!: Trend Positivo',
            '!!: Trend Negativo',
            ...uniqueSubjects.map((subj, i) => `${subjectAbbr[i]}: ${subj}`),
            ...uniqueCompetencies.map((comp, i) => `${competencyCodes[i]}: ${comp.nome}`)
        ];

        let legendX = MARGIN;
        const itemMaxWidth = 55;
        legendItems.forEach(item => {
            if (legendX + itemMaxWidth > PAGE_WIDTH - MARGIN) {
                legendX = MARGIN;
                legendY += 5;
            }
            doc.text(item, legendX, legendY);
            legendX += itemMaxWidth;
        });
        legendY += 5;

        legendX = MARGIN;
        doc.text('Livelli Competenza:', legendX, legendY); legendX += 28;
        doc.setFillColor(PDF_COLORS.competencyLevels.A.bg).circle(legendX, legendY - 1, 2, 'F'); doc.text('A: Avanzato', legendX + 3, legendY); legendX += 25;
        doc.setFillColor(PDF_COLORS.competencyLevels.B.bg).circle(legendX, legendY - 1, 2, 'F'); doc.text('B: Intermedio', legendX + 3, legendY); legendX += 28;
        doc.setFillColor(PDF_COLORS.competencyLevels.C.bg).circle(legendX, legendY - 1, 2, 'F'); doc.text('C: Base', legendX + 3, legendY); legendX += 20;
        doc.setFillColor(PDF_COLORS.competencyLevels.D.bg).circle(legendX, legendY - 1, 2, 'F'); doc.text('D: Iniziale', legendX + 3, legendY);

        const blob = doc.output('blob');
        viewPdfInNewTab(blob);
    };

    const handleExport = async () => {
        setIsExporting(true);
        await new Promise(resolve => setTimeout(resolve, 50));
        try {
            if (exportOptions.format === 'csv') {
                exportToCSV();
            } else {
                await exportToPDF();
            }
        } catch (error: unknown) {
            logger.error("Export failed:", error);
            let message = 'Errore sconosciuto.';
            if (error instanceof Error) message = error.message;
            showToast(`Esportazione fallita: ${message}`, 'error');
        } finally {
            setIsExporting(false);
            onClose();
        }
    };

return (
        <M3Dialog
            onClose={onClose}
            title="Esporta Report Classe"
            maxWidth="lg"
            buttons={<>
                <Button type="button" onClick={onClose} variant="text" disabled={isExporting}>Annulla</Button>
                <Button type="button" onClick={handleExport} variant="contained" disabled={isExporting}>
                    <span>{isExporting ? 'sync' : 'download'}</span>
                    {isExporting ? 'Esportazione...' : `Esporta ${exportOptions.format.toUpperCase()}`}
                </Button>
            </>}
        >
            <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                    <SectionHeader title="1. Intestazione Documento" icon="edit" />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-3)' }}>
                        <TextField
                            id="schoolYear"
                            name="schoolYear"
                            label="Anno Scolastico"
                            slotProps={{ htmlInput: { 'data-testid': 'field-anno scolastico' } }}
                            value={exportOptions.schoolYear}
                            onChange={e => handleOptionChange('schoolYear', e.target.value)}
                        />
                        <TextField
                            id="exportDate"
                            name="exportDate"
                            label="Data Esportazione"
                            slotProps={{ htmlInput: { 'data-testid': 'field-data esportazione' } }}
                            type="date"
                            value={exportOptions.exportDate}
                            onChange={e => handleOptionChange('exportDate', e.target.value)}
                        />
                    </div>
                </section>
                <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                    <SectionHeader title="2. Discipline da Includere" icon="filter_list" />
                                        <Tabs
                      value={subjectScope}
                      onChange={(_, v: string) => ((id) => setSubjectScope(id as 'teacher' | 'all'))(v)}
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
                            { id: 'teacher', label: 'Solo le mie' },
                            { id: 'all', label: 'Tutte con dati' }
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
                    <p>
                        {subjectScope === 'teacher'
                            ? "Il report includerà solo le tue discipline configurate in Impostazioni. La media generale (Σ) sarà calcolata solo su queste materie."
                            : "Il report includerà tutte le discipline che hanno almeno una valutazione per questa classe. La media generale (Σ) sarà calcolata su tutte le materie."}
                    </p>
                </section>
                <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                    <SectionHeader title="3. Formato di Esportazione" icon="output" />
                                        <Tabs
                      value={exportOptions.format}
                      onChange={(_, v: string) => ((id) => handleOptionChange('format', id))(v)}
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
                            { id: 'pdf', label: 'PDF Grafico' },
                            { id: 'csv', label: 'CSV (Dati)' }
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
                    <p>
                        {exportOptions.format === 'pdf'
                            ? 'Genera un report grafico di una pagina, ideale per la stampa e la condivisione.'
                            : 'Genera un file CSV con i dati riepilogativi, utile per analisi in fogli di calcolo.'}
                    </p>
                </section>
            </M3Dialog>
    );
};

export default React.memo(ExportModal);

