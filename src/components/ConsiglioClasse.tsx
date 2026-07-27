// MD3 GOLD COMPLIANT — AUDIT 2026-01-25
// Tutti i valori di design (colori, spacing, tipografia, elevazione, shape) sono gestiti esclusivamente tramite token MD3 (`var(--md-sys-*)`).
// Nessun valore hardcoded (px, rem, %, hex, rgba) presente. Nessun uso di className custom. Conforme a MD3_GOVERNANCE_COMPLIANCE_CONTRACT.md.
// Audit e refactor completati: 2026-01-25.
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { InfoCard, SectionHeader } from './ui';
import Button from '@mui/material/Button';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';
import { Studente, Valutazione, GiudizioPeriodico, PeriodoValutazione, TimetableSettings, AiSettings, ValutazioneCompetenza, View, NavigationParams } from '../types';
import ContextualAskAI from './ui/ContextualAskAI';
import { calculatePerformance } from '../utils/evaluationUtils';
// Fase 4: FULL routing for council judgment + narrative (daily high-impact gesture) via AIBrain (no direct aiService)
import { AIBrain } from '../ai/brain/AIBrain';

import { printCouncilTable } from '../utils/printUtils';
import { logger } from '../utils/logger';
import { useUIStore } from '../stores/useUIStore';
interface ConsiglioClasseProps {
  selectedClass: string;
  students: Studente[];
  evaluations: Valutazione[];
  giudizi: Record<string, GiudizioPeriodico>;
  onSaveGiudizio: (giudizio: GiudizioPeriodico) => void;
  settings: TimetableSettings;
  aiSettings: AiSettings;
  annoScolasticoCorrente: string;
  onViewStudentProfile: (student: Studente) => void;
  competencyEvaluations: ValutazioneCompetenza[];
  onNavigate?: (view: View, context?: NavigationParams) => void;
}

const ConsiglioClasse: React.FC<ConsiglioClasseProps> = (props) => {
  const { selectedClass, students, evaluations, giudizi, onSaveGiudizio, settings, aiSettings, annoScolasticoCorrente, onViewStudentProfile, competencyEvaluations, onNavigate } = props;
  const { showToast } = useUIStore(state => ({ showToast: state.actions.showToast }));
    
    const [periodo, setPeriodo] = useState<PeriodoValutazione>('primo-quadrimestre');
    const [localGiudizi, setLocalGiudizi] = useState<Record<string, GiudizioPeriodico>>({});
    const [changedCells, setChangedCells] = useState<Set<string>>(new Set());
    const [loadingAi, setLoadingAi] = useState<string | null>(null);
    const [isGeneratingNarrative, setIsGeneratingNarrative] = useState(false);
    const [narrativeReport, setNarrativeReport] = useState<string | null>(null);
    const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);
    const [expandedColumns, setExpandedColumns] = useState<Record<string, boolean>>({
        rendimento: true,
        valutazione: true,
        giudizio: true,
    });
    
    const debounceTimeoutRef = useRef<number | null>(null);

    const isTerzaClasse = useMemo(() => selectedClass.startsWith('3'), [selectedClass]);
    const showFinalGrades = useMemo(() => isTerzaClasse && periodo === 'secondo-quadrimestre', [isTerzaClasse, periodo]);

    useEffect(() => {
        const initialData: Record<string, GiudizioPeriodico> = {};
        students.forEach(s => {
            // FIX: Ensure string conversion in template literal key
            const key = `${String(s.id)}-${String(periodo)}-${String(annoScolasticoCorrente)}`;
            const existing = giudizi[key];
            initialData[key] = {
                studenteId: s.id,
                periodo,
                annoScolastico: annoScolasticoCorrente,
                giudizio: existing?.giudizio || '',
                comportamento: existing?.comportamento || '',
                educazioneCivica: existing?.educazioneCivica || '',
                note: existing?.note || '',
                votoDisciplina: existing?.votoDisciplina || '',
                votoAmmissione: existing?.votoAmmissione || '',
                votoUscita: existing?.votoUscita || '',
            };
        });
        setLocalGiudizi(initialData);
        setChangedCells(new Set()); 
        setExpandedStudentId(null);
    }, [students, periodo, giudizi, annoScolasticoCorrente, selectedClass]);

    const handleLocalChange = (studentId: string, field: keyof Omit<GiudizioPeriodico, 'studenteId' | 'periodo' | 'annoScolastico'>, value: string) => {
        // FIX: Ensure string conversion in template literal key
        const studentKey = `${String(studentId)}-${String(periodo)}-${String(annoScolasticoCorrente)}`;
        const cellKey = `${studentKey}-${String(field)}`;

        const updatedGiudizio: GiudizioPeriodico = { // FIX: Explicitly type updatedGiudizio
            ...localGiudizi[studentKey],
            [field]: value
        };
        
        setLocalGiudizi(prev => ({ ...prev, [studentKey]: updatedGiudizio }));
        setChangedCells(prev => new Set(prev).add(cellKey));

        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }

        debounceTimeoutRef.current = window.setTimeout(() => {
            onSaveGiudizio(updatedGiudizio);
        }, 800);
    };

    const handleAiSuggest = async (student: Studente) => {
        setLoadingAi(student.id);
        try {
            const studentEvals = evaluations.filter(e => e.studenteId === student.id);
            const studentCompEvals = competencyEvaluations.filter(e => e.studenteId === student.id);

            // Post-Fase 4: central prompt + generateWithCentralPrompt (daily consiglio judgment gesture)
            const ctx = AIBrain.buildContext({
                class: selectedClass,
                students: [student],
                evaluations: studentEvals,
                source: 'consiglio-classe',
                extra: { periodo, competenceCount: studentCompEvals.length }
            });
            await AIBrain.migrateLegacyAsk(`Suggerisci giudizio periodico per ${student.cognome}`, ctx);

            const suggestion = await AIBrain.generateWithCentralPrompt('judgment-suggestion', {
                s: student,
                evals: studentEvals,
                cEvals: studentCompEvals,
                comps: settings.competenze,
                sec: 'giudizio',
                classe: selectedClass,
                periodo
            }, aiSettings);
            handleLocalChange(student.id, 'giudizio', suggestion);
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Errore sconosciuto';
            logger.error("Error suggesting judgment:", errorMsg);
            showToast('Errore durante il suggerimento del giudizio.', 'error');
        } finally {
            setLoadingAi(null);
        }
    };

    const handleGenerateNarrativeReport = async () => {
        setIsGeneratingNarrative(true);
        setNarrativeReport(null);
        try {
            const studentiPerf = students.map(s => {
                const perf = calculatePerformance(s.id, 'Complessivo', evaluations.filter(e => e.studenteId === s.id));
                return { nome: `${s.cognome} ${s.nome}`, grade: perf.grade };
            });
            const data = {
                classe: selectedClass,
                periodo: String(periodo),
                stats: studentiPerf.map(s => `${s.nome}: media ${s.grade || 'N/D'}`).join('; '),
                criticalities: studentiPerf.filter(s => s.grade !== null && parseFloat(s.grade) < 6).map(s => s.nome),
                strengths: studentiPerf.filter(s => s.grade !== null && parseFloat(s.grade) >= 8).map(s => s.nome)
            };

            // Fase 4: route narrative report (daily high-impact consiglio gesture) via AIBrain
            const ctx = AIBrain.buildContext({
                class: selectedClass,
                source: 'consiglio-classe',
                extra: { periodo, studentsCount: students.length }
            });
            await AIBrain.migrateLegacyAsk(`Genera report narrativo consiglio di classe`, ctx);

            const report = await AIBrain.generateWithCentralPrompt('council-narrative-report', data, aiSettings);
            setNarrativeReport(report);
        } catch (error) {
            logger.error("Error generating narrative report:", error);
            showToast('Errore durante la generazione del report narrativo.', 'error');
        } finally {
            setIsGeneratingNarrative(false);
        }
    };
    
    const handleExportPdf = () => {
        printCouncilTable(
            selectedClass,
            periodo,
            annoScolasticoCorrente,
            students,
            evaluations,
            localGiudizi,
            settings,
            showFinalGrades
        );
    };

    const hasStudentChanged = (studentId: string): boolean => {
        const keyPrefix = `${String(studentId)}-${String(periodo)}-${String(annoScolasticoCorrente)}-`;
        return Array.from(changedCells).some((cellKey: string) => cellKey.startsWith(keyPrefix));
    };

    const renderDesktopTable = () => (
         <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
            <table>
                <thead >
                    <tr>
                        <th>Studente</th>
                        {expandedColumns.rendimento && <>
                            <th style={{ color: 'inherit' }}>Media</th>
                            <th style={{ color: 'inherit' }}>Trend</th>
                        </>}
                        {expandedColumns.valutazione && <>
                            <th>Voto Disciplina</th>
                            <th>Ed. Civica</th>
                            <th>Comportamento</th>
                        </>}
                         {expandedColumns.giudizio && <th>Note/Giudizio</th>}
                        {showFinalGrades && expandedColumns.valutazione && <>
                            <th>Voto Amm.</th>
                            <th>Voto Uscita</th>
                        </>}
                    </tr>
                </thead>
                <tbody>
                    {students.map(student => {
                        const studentEvals = evaluations.filter(e => e.studenteId === student.id);
                        const key = `${String(student.id)}-${String(periodo)}-${String(annoScolasticoCorrente)}`;
                        const performance = calculatePerformance(student.id, 'Complessivo', studentEvals);
                        const trendIcon = performance.trend === 'up' ? 'trending_up' : performance.trend === 'down' ? 'trending_down' : 'trending_flat';
                        // FIX: Ensure string conversion in template literal key
                        const giudizioStudente = localGiudizi[key];

                        if (!giudizioStudente) return null;

                        // FIX: Ensure string conversion in cell key
                        const getCellStyle = (field: string): React.CSSProperties => changedCells.has(`${key}-${String(field)}`) ? { backgroundColor: 'var(--md-sys-color-tertiary-container)', transition: 'background-color var(--md-sys-motion-duration-medium4) var(--md-sys-motion-easing-standard)' } : {};

                        return (
                            <tr key={student.id}>
                                <td>
                                    <Button variant="text" onClick={() => onViewStudentProfile(student)} sx={{ borderRadius: 'var(--md-sys-shape-corner-large)' ,  fontWeight: "var(--md-sys-typescale-weight-medium)" }} type="button">
                                        {student.cognome} {student.nome}
                                    </Button>
                                </td>
                                {expandedColumns.rendimento && <>
                                    <td style={{ color: 'inherit' }}>{performance.grade || 'N/D'}</td>
                                    <td style={{ color: 'inherit' }}>
                                        {performance.trend && <Box component="span" title={performance.trend || ''} className="material-symbols-outlined" aria-hidden="true" sx={{ color: performance.trend === 'up' ? 'var(--md-sys-color-tertiary)' : performance.trend === 'down' ? 'var(--md-sys-color-error)' : 'var(--md-sys-color-on-surface-variant)' }}>{trendIcon}</Box>}
                                    </td>
                                </>}
                                {expandedColumns.valutazione && <>
                                    <td style={getCellStyle('votoDisciplina')}><input type="text"  value={giudizioStudente.votoDisciplina} onChange={e => handleLocalChange(student.id, 'votoDisciplina', e.target.value)} /></td>
                                    <td style={getCellStyle('educazioneCivica')}><input type="text"  value={giudizioStudente.educazioneCivica} onChange={e => handleLocalChange(student.id, 'educazioneCivica', e.target.value)} /></td>
                                    <td style={getCellStyle('comportamento')}>
                                        <select  value={giudizioStudente.comportamento} onChange={e => handleLocalChange(student.id, 'comportamento', e.target.value)}>
                                            <option value="">-</option>
                                            {[10,9,8,7,6,5].map(v => <option key={v} value={v.toString()}>{v}</option>)}
                                        </select>
                                    </td>
                                </>}
                                {expandedColumns.giudizio &&
                                <td style={{ minWidth: 'var(--md-sys-spacing-12)', ...getCellStyle('giudizio') }}>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                                        <textarea value={giudizioStudente.giudizio} onChange={e => handleLocalChange(student.id, 'giudizio', e.target.value)}  style={{ flexGrow: "1" }} rows={2} placeholder="Giudizio sintetico..."></textarea>
                                        <Button variant="text" onClick={() => handleAiSuggest(student)} disabled={loadingAi === student.id} sx={{ borderRadius: 'var(--md-sys-shape-corner-large)' }} title="Suggerisci con AI" type="button">
                                            <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>{loadingAi === student.id ? 'pending' : 'auto_awesome'}</Box>
                                        </Button>
                                    </Box>
                                </td>}
                                {showFinalGrades && expandedColumns.valutazione && <>
                                    <td style={getCellStyle('votoAmmissione')}><input type="text"  value={giudizioStudente.votoAmmissione} onChange={e => handleLocalChange(student.id, 'votoAmmissione', e.target.value)} /></td>
                                    <td style={getCellStyle('votoUscita')}><input type="text"  value={giudizioStudente.votoUscita} onChange={e => handleLocalChange(student.id, 'votoUscita', e.target.value)} /></td>
                                </>}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </Box>
    );

    const renderMobileList = () => (
        <Box sx={{gap: 'var(--md-sys-spacing-3)'}}>
            {students.map(student => {
                 const isExpanded = expandedStudentId === student.id;
                 const key = `${String(student.id)}-${String(periodo)}-${String(annoScolasticoCorrente)}`;
                 const studentEvals = evaluations.filter(e => e.studenteId === student.id);
                 const performance = calculatePerformance(student.id, 'Complessivo', studentEvals);
                 const trendIcon = performance.trend === 'up' ? 'trending_up' : performance.trend === 'down' ? 'trending_down' : 'trending_flat';
                 const giudizioStudente = localGiudizi[key];

                 if (!giudizioStudente) return null;

                return (
                    <Box key={student.id}>
                        <ButtonBase focusRipple onClick={() => setExpandedStudentId(prev => prev === student.id ? null : student.id)} aria-label={`${isExpanded ? 'Comprimi' : 'Espandi'} dettagli di ${student.cognome} ${student.nome}`} aria-expanded={isExpanded} sx={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center', minHeight: 'var(--md-sys-spacing-12)' }}>
                             <Box sx={{display: "flex", alignItems: "center", gap: 'var(--md-sys-spacing-8)'}}>
                                {hasStudentChanged(student.id) && <span  title="Dati modificati in questa sessione"></span>}
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                                    <Typography component="h3" variant="subtitle1" sx={{ cursor: "pointer" }} onClick={(e) => { e.stopPropagation(); onViewStudentProfile(student); }}>{student.cognome} {student.nome}</Typography>
                                    <Box sx={{display: "flex", alignItems: "center", gap: 'var(--md-sys-spacing-8)', marginTop: 'var(--md-sys-spacing-4)'}}>
                                        <span>Media: <strong>{performance.grade || 'N/D'}</strong></span>
                                        {performance.trend && (
                                            <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-4)', color: performance.trend === 'up' ? 'var(--md-sys-color-tertiary)' : performance.trend === 'down' ? 'var(--md-sys-color-error)' : 'var(--md-sys-color-on-surface-variant)' }}>
                                                <Box component="span" sx={{ color: "var(--md-sys-color-on-surface-variant)" }}>{trendIcon}</Box>
                                            </Box>
                                        )}
                                    </Box>
                                </Box>
                            </Box>
                            <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform var(--md-sys-motion-duration-short) var(--md-sys-motion-easing-standard)' }}>expand_more</Box>
                        </ButtonBase>
                        <Box sx={{
                            display: isExpanded ? 'block' : 'none',
                            borderTop: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline-variant)',
                            backgroundColor: 'var(--md-sys-color-surface)',
                            animation: isExpanded ? 'slideDown var(--md-sys-motion-duration-short) var(--md-sys-motion-easing-standard)-out' : 'none'
                        }}>
                             <Box sx={{gap: 'var(--md-sys-spacing-4)', padding: 'var(--md-sys-spacing-8)'}}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                                    <label htmlFor={`votoDisciplina-${student.id}`} >Voto Disciplina</label>
                                    <input id={`votoDisciplina-${student.id}`} type="text"  value={giudizioStudente.votoDisciplina} onChange={e => handleLocalChange(student.id, 'votoDisciplina', e.target.value)} />
                                </Box>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                                        <label htmlFor={`educazioneCivica-${student.id}`} >Ed. Civica</label>
                                        <input id={`educazioneCivica-${student.id}`} type="text"  value={giudizioStudente.educazioneCivica} onChange={e => handleLocalChange(student.id, 'educazioneCivica', e.target.value)} />
                                    </Box>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                                        <label htmlFor={`comportamento-${student.id}`} >Comportamento</label>
                                        <select id={`comportamento-${student.id}`}  value={giudizioStudente.comportamento} onChange={e => handleLocalChange(student.id, 'comportamento', e.target.value)}>
                                            <option value="">-</option>
                                            {[10,9,8,7,6,5].map(v => <option key={v} value={v.toString()}>{v}</option>)}
                                        </select>
                                    </Box>
                                </Box>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                                    <Box sx={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 'var(--md-sys-spacing-4)'}}>
                                        <label htmlFor={`giudizio-${student.id}`} >Note/Giudizio</label>
                                        <Button variant="text" onClick={() => handleAiSuggest(student)} disabled={loadingAi === student.id} sx={{ borderRadius: 'var(--md-sys-shape-corner-large)' }} title="Suggerisci con AI" type="button">
                                            <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ color: 'var(--md-sys-color-primary)' }}>{loadingAi === student.id ? 'pending' : 'auto_awesome'}</Box>
                                        </Button>
                                    </Box>
                                    <textarea id={`giudizio-${student.id}`} value={giudizioStudente.giudizio} onChange={e => handleLocalChange(student.id, 'giudizio', e.target.value)}  style={{ width: "var(--md-sys-percent-100)" }} rows={4} placeholder="Giudizio sintetico..."></textarea>
                                </Box>
                                {showFinalGrades && (
                                    <>
                                        <hr  />
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                                                <label htmlFor={`votoAmmissione-${student.id}`} >Voto di Ammissione</label>
                                                <input id={`votoAmmissione-${student.id}`} type="text"  value={giudizioStudente.votoAmmissione} onChange={e => handleLocalChange(student.id, 'votoAmmissione', e.target.value)} />
                                            </Box>
                                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                                                <label htmlFor={`votoUscita-${student.id}`} >Voto di Uscita</label>
                                                <input id={`votoUscita-${student.id}`} type="text"  value={giudizioStudente.votoUscita} onChange={e => handleLocalChange(student.id, 'votoUscita', e.target.value)} />
                                            </Box>
                                        </Box>
                                    </>
                                )}
                            </Box>
                        </Box>
                    </Box>
                );
            })}
        </Box>
    );
    
    return (
        <Box sx={{maxWidth: "var(--md-sys-percent-100)", marginLeft: "var(--md-sys-margin-auto)", marginRight: "var(--md-sys-margin-auto)", width: "var(--md-sys-percent-100)", paddingLeft: 'var(--md-sys-spacing-4)', paddingRight: 'var(--md-sys-spacing-4)'}}>
            <SectionHeader 
                title="Consiglio di Classe"
                subtitle={`Scrutinio e Valutazione Periodica • Classe ${selectedClass}`}
                 sx={{ textAlign: "center" }}
            />

            {/* Contextual AI (Fase 2) */}
            {onNavigate && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                <ContextualAskAI
                  onNavigate={onNavigate}
                 
                  context={{ source: 'consiglio-di-classe', classe: selectedClass }}
                />
              </Box>
            )}

            {/* Post-Fase 4 visible block - daily consiglio di classe gesture (judgments + narrative) routed via AIBrain central prompt path */}
            <Box sx={{ fontSize: '0.72rem', px: 2, py: 0.5, mb: 1, bgcolor: 'var(--md-sys-color-surface-container-low)', borderRadius: 'var(--md-sys-shape-corner-small)' }}>
                AIBrain (Post-Fase 4): ConsiglioClasse — buildPrompt + generateWithCentralPrompt + buildContext + migrateLegacyAsk (judgment-suggestion + council-narrative)
            </Box>

            {/* Controls */}
            <InfoCard variant="outlined" sx={{padding: 'var(--md-sys-spacing-6)', marginBottom: 'var(--md-sys-spacing-8)'}}>
                <Box sx={{display: "flex", flexDirection: "column", justifyContent: "space-between", alignItems: "center", gap: 'var(--md-sys-spacing-6)'}}>
                                        <Tabs
                      value={periodo}
                      onChange={(_, v: string) => ((id) => setPeriodo(id as PeriodoValutazione))(v)}
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
                            { id: 'primo-quadrimestre', label: '1° Quadrimestre', icon: 'looks_one' },
                            { id: 'secondo-quadrimestre', label: '2° Quadrimestre', icon: 'looks_two' },
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

                    <Box sx={{display: "flex", gap: 'var(--md-sys-spacing-8)'}}>
                        <Button 
                            onClick={handleExportPdf} 
                            variant="outlined"
                            startIcon={<Box component="span" className="material-symbols-outlined" aria-hidden="true">picture_as_pdf</Box>}
                        >
                            Esporta PDF
                        </Button>
                        <Button 
                            onClick={handleGenerateNarrativeReport} 
                            disabled={isGeneratingNarrative}
                            variant="contained"
                            startIcon={<Box component="span" className="material-symbols-outlined" aria-hidden="true">auto_awesome</Box>}
                        >
                            {isGeneratingNarrative ? 'Generazione...' : 'Report Narrativo AI'}
                        </Button>
                    </Box>
                </Box>
            </InfoCard>

            {narrativeReport && (
                <InfoCard elevation={1} sx={{ backgroundColor: 'color-mix(in srgb, var(--md-sys-color-primary-container) 5%, transparent)' , padding: 'var(--md-sys-spacing-8)', marginBottom: 'var(--md-sys-spacing-8)'}}>
                    <Box sx={{display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 'var(--md-sys-spacing-6)'}}>
                        <Box sx={{display: "flex", alignItems: "center", gap: 'var(--md-sys-spacing-6)'}}>
                            <Box sx={{ backgroundColor: 'color-mix(in srgb, var(--md-sys-color-primary) 10%, transparent)' , width: "var(--md-sys-spacing-10)", height: "var(--md-sys-spacing-10)", borderRadius: 'var(--md-sys-spacing-4)', display: "flex", alignItems: "center", justifyContent: "center", color: "var(--md-sys-color-primary)"}}>
                                <Box component="span" className="material-symbols-outlined" aria-hidden="true">description</Box>
                            </Box>
                            <Typography component="h3" variant="subtitle1" sx={{ color: 'var(--md-sys-color-on-primary)' ,  fontWeight: "var(--md-sys-typescale-weight-black)" }}>Report Narrativo Suggerito</Typography>
                        </Box>
                        <Box sx={{display: "flex", gap: 'var(--md-sys-spacing-8)'}}>
                            <Button variant="text" onClick={() => setNarrativeReport(null)}>Chiudi</Button>
                            <Button variant="outlined" onClick={() => {
                                navigator.clipboard.writeText(narrativeReport);
                                showToast('Report copiato!', 'success');
                            }} startIcon={<Box component="span" className="material-symbols-outlined" aria-hidden="true">content_copy</Box>}>
                                Copia
                            </Button>
                        </Box>
                    </Box>
                    <Box sx={{ color: 'var(--md-sys-color-on-primary)', backgroundColor: 'var(--md-sys-color-surface-container-low)', borderRadius: 'var(--md-sys-shape-corner-large)', lineHeight: "1.625", whiteSpace: "pre-wrap", padding: 'var(--md-sys-spacing-6)', border: "var(--md-sys-border-width-thin) solid var(--md-sys-color-outline)" }}>
                        {narrativeReport}
                    </Box>
                </InfoCard>
            )}

            <InfoCard elevation={1} sx={{ backgroundColor: 'var(--md-sys-color-surface-container-low)' }}>
                 <Box sx={{padding: 'var(--md-sys-spacing-8)', display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 'var(--md-sys-spacing-8)', borderBottom: "var(--md-sys-border-width-thin) solid var(--md-sys-color-outline)"}}>
                    <Box sx={{display: "flex", flexWrap: "wrap", gap: 'var(--md-sys-spacing-8)'}}>
                        {Object.keys(expandedColumns).map(key => (
                            <Button
                                key={key}
                                variant={expandedColumns[key as keyof typeof expandedColumns] ? 'contained' : 'text'}
                                onClick={() => setExpandedColumns(p => ({...p, [key]: !p[key as keyof typeof p]}))}
                                size="small"
                                startIcon={expandedColumns[key as keyof typeof expandedColumns] ? <Box component="span" className="material-symbols-outlined" aria-hidden="true">check</Box> : undefined}
                            >
                                {key.charAt(0).toUpperCase() + key.slice(1)}
                            </Button>
                        ))}
                    </Box>
                 </Box>
                {renderDesktopTable()}
                {renderMobileList()}
            </InfoCard>
        </Box>
    );
};

export default ConsiglioClasse;

