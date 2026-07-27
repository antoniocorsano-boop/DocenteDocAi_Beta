// MD3 Compliant - Migration completed
// PassaggioAnnoWizard.tsx - All styling uses MD3 tokens via style props
import React, { useState, useMemo, useEffect } from 'react';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { Studente, TimetableSettings, Valutazione, ValutazioneCompetenza, RegisterEntry, StudentHistoryRecord } from '../types';
import { getNextClass } from '../utils/schoolUtils';
import { calculatePerformance } from '../utils/evaluationUtils';
import { InfoCard } from './ui';
import { logger } from '../utils/logger';
import { useUIStore } from '../stores/useUIStore';
interface PassaggioAnnoWizardProps {
    onClose: () => void;
    students: Studente[];
    settings: TimetableSettings;
    evaluations: Valutazione[];
    competencyEvaluations: ValutazioneCompetenza[];
    register: RegisterEntry[];
    onPromoteStudents: (promotedStudents: Studente[], archiveYear: string) => void;
    onBackupData: () => Promise<void>; 
    onResetData: () => void; 
}

type WizardStep = 'intro' | 'decisions' | 'confirm';
type OutcomeType = 'promote' | 'retain' | 'archive' | 'transfer';

interface StudentOutcome {
    studentId: string;
    action: OutcomeType;
    nextClass: string;
}

const PassaggioAnnoWizard: React.FC<PassaggioAnnoWizardProps> = ({ 
    onClose, students, settings, evaluations, competencyEvaluations, register, 
    onPromoteStudents, onBackupData, onResetData 
}) => {
  const { showToast } = useUIStore(state => ({ showToast: state.actions.showToast }));
  const [step, setStep] = useState<WizardStep>('intro');
    const [isProcessing, setIsProcessing] = useState(false);
    const [outcomes, setOutcomes] = useState<Record<string, StudentOutcome>>({});

    const activeStudents = useMemo(() => students.filter(s => !s.isArchived), [students]);

    // Initialize outcomes based on logic
    useEffect(() => {
        const initialOutcomes: Record<string, StudentOutcome> = {};
        activeStudents.forEach(s => {
            const { nextClass, isArchived } = getNextClass(s.classe, settings.schoolType);
            // Default logic: If isArchived (e.g. 5th year -> Diplomato), set archive. Else promote.
            const action = isArchived ? 'archive' : 'promote';
            initialOutcomes[s.id] = {
                studentId: s.id,
                action,
                nextClass: isArchived ? 'Archiviato' : nextClass
            };
        });
        setOutcomes(initialOutcomes);
    }, [activeStudents, settings.schoolType]);

    const nextYear = useMemo(() => {
        const currentSplit = settings.annoScolasticoCorrente.split('/');
        if (currentSplit.length === 2) {
              const start = parseInt(currentSplit[0]);
            return `${start + 1}/${start + 2}`;
        }
        return `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`;
    }, [settings.annoScolasticoCorrente]);

    const handleOutcomeChange = (studentId: string, action: OutcomeType) => {
        setOutcomes(prev => {
            const student = activeStudents.find(s => s.id === studentId);
            if (!student) return prev;

            let nextClass = '';
            if (action === 'promote') {
                const result = getNextClass(student.classe, settings.schoolType);
                nextClass = result.isArchived ? 'Diplomato' : result.nextClass;
            } else if (action === 'retain') {
                nextClass = student.classe; // Stays in same class
            } else if (action === 'transfer') {
                nextClass = 'Trasferito/Ritirato';
            } else {
                nextClass = 'Archiviato';
            }

            return {
                ...prev,
                [studentId]: { studentId, action, nextClass }
            };
        });
    };

    const stats = useMemo(() => {
        const vals: StudentOutcome[] = Object.values(outcomes);
        return {
            promote: vals.filter(o => o.action === 'promote').length,
            retain: vals.filter(o => o.action === 'retain').length,
            archive: vals.filter(o => o.action === 'archive' || o.action === 'transfer').length
        };
    }, [outcomes]);

    // Helper: Calculate History for a student
    const calculateHistoryForStudent = (student: Studente, outcome: StudentOutcome): StudentHistoryRecord => {
        const studentEvals = evaluations.filter(e => e.studenteId === student.id);
        const { grade } = calculatePerformance(student.id, 'Complessivo', studentEvals);
        
        // Calculate Absences %
        const studentEntries = register.filter(r => r.classe === student.classe);
        const totalLessons = studentEntries.length;
        const absences = studentEntries.filter(r => r.studentAttendance[student.id] === 'assente').length;
        const absencesPercentage = totalLessons > 0 ? Math.round((absences / totalLessons) * 100) : 0;
        
        // Final outcome string for history
        let finalOutcome: 'Promosso' | 'Bocciato' | 'Sospeso' | 'Ritirato' | 'Trasferito' = 'Promosso';
        
        if (outcome.action === 'retain') finalOutcome = 'Bocciato';
        if (outcome.action === 'transfer') finalOutcome = 'Trasferito';
        if (outcome.action === 'archive' && !grade) finalOutcome = 'Sospeso'; 

        // Competency Summary
        const studentComps = competencyEvaluations.filter(e => e.studenteId === student.id);
        const compSummary = studentComps.length > 0 ? [{ name: 'Competenze Valutate', level: `${studentComps.length} rilevazioni` }] : [];

        return {
            year: settings.annoScolasticoCorrente,
            classe: student.classe,
            averageGrade: grade || '-',
            absencesPercentage,
            finalOutcome,
            competencySummary: compSummary
        };
    };

    const handleConfirm = async () => {
        setIsProcessing(true);
        try {
            // 1. Force Backup
            await onBackupData();
            
            // 2. Prepare new student objects
            const newStudents = students.map(s => {
                // If archived previously, keep as is
                if (s.isArchived) return s;

                const outcome = outcomes[s.id];
                // Should not happen, but safety check
                if (!outcome) return s; 

                const historyRecord = calculateHistoryForStudent(s, outcome);
                const previousHistory = s.history || [];
                
                const isNowArchived = outcome.action === 'archive' || outcome.action === 'transfer' || (outcome.action === 'promote' && outcome.nextClass === 'Diplomato');

                return {
                    ...s,
                    classe: outcome.nextClass === 'Archiviato' || outcome.nextClass === 'Diplomato' || outcome.nextClass === 'Trasferito/Ritirato' ? s.classe : outcome.nextClass, 
                    isArchived: isNowArchived,
                    archiveYear: isNowArchived ? settings.annoScolasticoCorrente : undefined,
                    history: [...previousHistory, historyRecord]
                };
            });

            // 3. Execute Actions
            onResetData();
            onPromoteStudents(newStudents, nextYear);
            
            showToast(`Passaggio all'anno ${nextYear} completato!`, 'success');
            onClose();
        } catch (e) {
            logger.error(e);
            showToast("Errore durante il passaggio d'anno. Verifica il backup.", 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <Dialog open onClose={onClose} maxWidth="xl" fullWidth hideBackdrop>
            <DialogTitle>Passaggio Anno Scolastico</DialogTitle>
            <DialogContent sx={{ backgroundColor: 'var(--md-sys-color-surface-container-low)' }}>
                    {step === "intro" && (
                        <div  style={{gap: 'var(--md-sys-spacing-8)', marginLeft: 'var(--md-sys-margin-auto)', marginRight: 'var(--md-sys-margin-auto)', paddingTop: 'var(--md-sys-spacing-4)', paddingBottom: 'var(--md-sys-spacing-4)'}}>
                            <InfoCard 
                                title={`Chiusura Anno ${settings.annoScolasticoCorrente}`}
                                description="Procedura guidata per archiviare i dati, calcolare lo storico e preparare le classi per il nuovo anno."
                                icon="school"
                                variant="contained"
                                sx={{ backgroundColor: 'color-mix(in srgb, var(--md-sys-color-primary-container) 20%, transparent)' }}
                            />
                            
                            <div style={{ backgroundColor: 'var(--md-sys-color-surface-container-low)', borderRadius: 'var(--md-sys-shape-corner-large)', padding: 'var(--md-sys-spacing-8)', border: "var(--md-sys-border-width-thin) solid var(--md-sys-color-outline)" }}>
                                <Typography component="h3" variant="h6" sx={{ color: 'var(--md-sys-color-on-primary)', fontWeight: "var(--md-sys-typescale-weight-black)", marginBottom: 'var(--md-sys-spacing-6)' }}>Checklist Automatica</Typography>
                                <ul style={{ marginTop: 'var(--md-sys-spacing-4)' }}>
                                    {[
                                        { icon: "check_circle", text: "Backup completo dei dati su Drive/Locale." },
                                        { icon: "history_edu", text: "Salvataggio storico (media voti, assenze) nel profilo studente." },
                                        { icon: "delete_sweep", text: "Reset registro voti, lezioni e assenze giornaliere." },
                                        { icon: "trending_up", text: "Promozione classi (es. 1A ? 2A) con gestione bocciature." }
                                    ].map((item, i) => (
                                        <li key={i} style={{ color: 'var(--md-sys-color-on-surface-variant)', display: "flex", alignItems: "center", gap: 'var(--md-sys-spacing-8)' }}>
                                            <span style={{ color: 'var(--md-sys-color-primary)', fontSize: "var(--md-sys-spacing-6)" }}>{item.icon}</span>
                                            <span style={{ fontWeight: "var(--md-sys-typescale-weight-medium)" }}>{item.text}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}

                    {step === "decisions" && (
                        <div style={{ gap: 'var(--md-sys-spacing-6)', paddingTop: 'var(--md-sys-spacing-4)', paddingBottom: 'var(--md-sys-spacing-4)' }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 'var(--md-sys-spacing-8)' }}>
                                <Typography component="h3" variant="h6" sx={{ color: 'var(--md-sys-color-on-primary)', fontWeight: "var(--md-sys-typescale-weight-black)" }}>Esiti Scrutinio</Typography>
                                <div style={{ display: "flex", gap: 'var(--md-sys-spacing-6)' }}>
                                    <span style={{ backgroundColor: 'var(--md-sys-color-primary)', color: 'var(--md-sys-color-on-primary)', paddingLeft: 'var(--md-sys-spacing-4)', paddingRight: 'var(--md-sys-spacing-4)', borderRadius: 'var(--md-sys-shape-corner-small)', fontWeight: "var(--md-sys-typescale-weight-black)", textTransform: "uppercase", letterSpacing: "var(--md-sys-typescale-label-large-tracking)", border: "var(--md-sys-border-width-thin) solid var(--md-sys-color-outline)" }}>{stats.promote} Promossi</span>
                                    <span style={{ backgroundColor: 'var(--md-sys-color-error-container)', color: 'var(--md-sys-color-on-error-container)', paddingLeft: 'var(--md-sys-spacing-4)', paddingRight: 'var(--md-sys-spacing-4)', borderRadius: 'var(--md-sys-shape-corner-small)', fontWeight: "var(--md-sys-typescale-weight-black)", textTransform: "uppercase", letterSpacing: "var(--md-sys-typescale-label-large-tracking)", border: "var(--md-sys-border-width-thin) solid var(--md-sys-color-outline)" }}>{stats.retain} Bocciati</span>
                                    <span style={{ backgroundColor: 'var(--md-sys-color-surface-container-high)', color: 'var(--md-sys-color-on-surface-variant)', paddingLeft: 'var(--md-sys-spacing-4)', paddingRight: 'var(--md-sys-spacing-4)', borderRadius: 'var(--md-sys-shape-corner-small)', fontWeight: "var(--md-sys-typescale-weight-black)", textTransform: "uppercase", letterSpacing: "var(--md-sys-typescale-label-large-tracking)", border: "var(--md-sys-border-width-thin) solid var(--md-sys-color-outline)" }}>{stats.archive} Archiviati</span>
                                </div>
                            </div>
                            
                            <div style={{ backgroundColor: 'var(--md-sys-color-surface-container-low)', borderRadius: 'var(--md-sys-shape-corner-large)', border: "var(--md-sys-border-width-thin) solid var(--md-sys-color-outline)" }}>
                                <table style={{ width: 'var(--md-sys-percent-100)' }}>
                                    <thead>
                                        <tr style={{ backgroundColor: 'var(--md-sys-color-surface-container-high)' }}>
                                            <th style={{ color: 'var(--md-sys-color-on-surface-variant)', textAlign: "left", padding: 'var(--md-sys-spacing-8)', fontWeight: "var(--md-sys-typescale-weight-black)", textTransform: "uppercase", letterSpacing: "var(--md-sys-typescale-label-large-tracking)" }}>Studente</th>
                                            <th style={{ color: 'var(--md-sys-color-on-surface-variant)', textAlign: "left", padding: 'var(--md-sys-spacing-8)', fontWeight: "var(--md-sys-typescale-weight-black)", textTransform: "uppercase", letterSpacing: "var(--md-sys-typescale-label-large-tracking)" }}>Classe</th>
                                            <th style={{ color: 'var(--md-sys-color-on-surface-variant)', textAlign: "left", padding: 'var(--md-sys-spacing-8)', fontWeight: "var(--md-sys-typescale-weight-black)", textTransform: "uppercase", letterSpacing: "var(--md-sys-typescale-label-large-tracking)" }}>Media</th>
                                            <th style={{ color: 'var(--md-sys-color-on-surface-variant)', textAlign: "left", padding: 'var(--md-sys-spacing-8)', fontWeight: "var(--md-sys-typescale-weight-black)", textTransform: "uppercase", letterSpacing: "var(--md-sys-typescale-label-large-tracking)" }}>Esito</th>
                                            <th style={{ color: 'var(--md-sys-color-on-surface-variant)', textAlign: "left", padding: 'var(--md-sys-spacing-8)', fontWeight: "var(--md-sys-typescale-weight-black)", textTransform: "uppercase", letterSpacing: "var(--md-sys-typescale-label-large-tracking)" }}>Futuro</th>
                                        </tr>
                                    </thead>
                                    <tbody >
                                        {activeStudents.map((s) => {
                                            const { grade } = calculatePerformance(s.id, "Complessivo", evaluations.filter(e => e.studenteId === s.id));
                                            const isInsufficient = grade && parseFloat(grade) < 6;
                                            const outcome = outcomes[s.id];

                                            return (
                                                <tr key={s.id}  style={{ transition: "color var(--md-sys-motion-duration-medium)" }}>
                                                    <td style={{ color: 'var(--md-sys-color-on-primary)', padding: 'var(--md-sys-spacing-8)', fontWeight: "var(--md-sys-typescale-weight-black)"}}>{s.cognome} {s.nome}</td>
                                                    <td style={{ color: 'var(--md-sys-color-on-surface-variant)', padding: 'var(--md-sys-spacing-8)', fontWeight: "var(--md-sys-typescale-weight-medium)"}}>{s.classe}</td>
                                                    <td style={{
                                                        padding: 'var(--md-sys-spacing-8)',
                                                        fontWeight: 'var(--md-sys-typescale-weight-black)',
                                                        color: isInsufficient ? 'var(--md-sys-color-error)' : 'var(--md-sys-color-primary)'
                                                    }}>{grade || "-"}</td>
                                                    <td style={{padding: 'var(--md-sys-spacing-6)'}}>
                                                        <select
                                                            value={outcome?.action || "promote"}
                                                            onChange={(e) => handleOutcomeChange(s.id, e.target.value as OutcomeType)}
                                                            style={{
                                                                width: 'var(--md-sys-percent-100)',
                                                                fontSize: 'var(--md-sys-typescale-body-small-font-size)',
                                                                fontWeight: 'var(--md-sys-typescale-weight-black)',
                                                                textTransform: 'uppercase',
                                                                letterSpacing: 'var(--md-sys-typescale-label-large-tracking)',
                                                                padding: 'var(--md-sys-spacing-4) var(--md-sys-spacing-3) var(--md-sys-spacing-4) var(--md-sys-spacing-8)',
                                                                borderRadius: 'var(--md-sys-shape-corner-medium)',
                                                                border: 'none',
                                                                outline: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline-variant)',
                                                                backgroundColor: outcome?.action === "retain" ? 'var(--md-sys-color-error-container)' :
                                                                               outcome?.action === "archive" || outcome?.action === "transfer" ? 'var(--md-sys-color-surface-container-high)' :
                                                                               'var(--md-sys-color-primary-container)',
                                                                color: outcome?.action === "retain" ? 'var(--md-sys-color-error)' :
                                                                     outcome?.action === "archive" || outcome?.action === "transfer" ? 'var(--md-sys-color-on-surface-variant)' :
                                                                     'var(--md-sys-color-primary)',
                                                                transition: 'opacity, transform, background-color, color, border-color, box-shadow var(--md-sys-motion-duration-medium) var(--md-sys-motion-easing-standard)',
                                                                cursor: 'pointer',
                                                                minHeight: 'var(--md-sys-spacing-11)'
                                                            }}
                                                        >
                                                            <option value="promote">Promosso</option>
                                                            <option value="retain">Bocciato</option>
                                                            <option value="transfer">Trasferito</option>
                                                            <option value="archive">Diplomato</option>
                                                        </select>
                                                    </td>
                                                    <td style={{ color: 'var(--md-sys-color-on-surface-variant)', padding: 'var(--md-sys-spacing-8)', fontWeight: "var(--md-sys-typescale-weight-black)", textTransform: "uppercase", letterSpacing: "var(--md-sys-typescale-label-large-tracking)", opacity: "var(--md-sys-state-opacity-secondary)" }}>{outcome?.nextClass}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {step === "confirm" && (
                        <div style={{ textAlign: "center", marginLeft: 'var(--md-sys-margin-auto)', marginRight: 'var(--md-sys-margin-auto)' }}>
                            <div style={{ backgroundColor: 'var(--md-sys-color-error-container)', borderRadius: 'var(--md-sys-shape-corner-large)', width: 'var(--md-sys-spacing-12)', height: 'var(--md-sys-spacing-12)', color: 'var(--md-sys-color-on-error-container)', display: "flex", alignItems: "center", justifyContent: "center", marginLeft: 'var(--md-sys-margin-auto)', marginRight: 'var(--md-sys-margin-auto)', marginBottom: 'var(--md-sys-spacing-8)' }}>
                                <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ color: 'var(--md-sys-color-on-error-container)' }}>warning</Box>
                            </div>
                            <Typography component="h3" variant="h6" sx={{ color: 'var(--md-sys-color-on-primary)', fontWeight: "var(--md-sys-typescale-weight-black)", marginBottom: 'var(--md-sys-spacing-8)' }}>Confermi l'operazione?</Typography>
                            <Typography component="p" variant="body1" sx={{ color: 'var(--md-sys-color-on-surface-variant)', lineHeight: "1.625" }}>
                                L'anno scolastico verr? impostato a <strong style={{color: 'var(--md-sys-color-primary)'}}>{nextYear}</strong>.
                                <br/><br/>
                                ?? I dati giornalieri verranno <strong style={{color: "var(--md-sys-color-error)"}}>resettati</strong>. I dati storici saranno salvati nel profilo di ogni studente.
                            </Typography>
                            
                            <div style={{ backgroundColor: 'var(--md-sys-color-surface-container-low)', borderRadius: 'var(--md-sys-shape-corner-large)', padding: 'var(--md-sys-spacing-6)', border: "var(--md-sys-border-width-thin) solid var(--md-sys-color-outline)", textAlign: "left" }}>
                                <Typography component="p" variant="caption" sx={{ fontWeight: "var(--md-sys-typescale-weight-black)", textTransform: "uppercase", letterSpacing: "var(--md-sys-typescale-label-large-tracking)", color: 'var(--md-sys-color-primary)', marginBottom: 'var(--md-sys-spacing-8)' }}>Riepilogo Azioni:</Typography>
                                <ul style={{gap: 'var(--md-sys-spacing-3)'}}>
                                    {[
                                        "Reset Valutazioni e Competenze",
                                        "Reset Registro di Classe e Diario",
                                        "Reset Piani di Inclusione",
                                        "Promozione studenti secondo schema"
                                    ].map((text, i) => (
                                        <li key={i} style={{ color: 'var(--md-sys-color-on-surface-variant)', display: "flex", alignItems: "center", gap: 'var(--md-sys-spacing-6)' }}>
                                            <span style={{ borderRadius: 'var(--md-sys-shape-corner-small)', backgroundColor: 'var(--md-sys-color-primary)' }}></span>
                                            {text}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}
            </DialogContent>

            <DialogActions sx={{ backgroundColor: 'var(--md-sys-color-surface-container-low)', borderTop: "var(--md-sys-border-width-thin) solid var(--md-sys-color-outline)", padding: 'var(--md-sys-spacing-6)' }}>
                    {step === "intro" && (
                        <>
                            <Button onClick={onClose} variant="text" sx={{ fontWeight: "var(--md-sys-typescale-weight-black)", fontSize: "var(--md-sys-typescale-body-small-font-size)", textTransform: "uppercase", letterSpacing: "var(--md-sys-typescale-label-large-tracking)" }}>Annulla</Button>
                            <Button onClick={() => setStep("decisions")} variant="contained"  sx={{ fontWeight: "var(--md-sys-typescale-weight-black)", fontSize: "var(--md-sys-typescale-body-small-font-size)", textTransform: "uppercase", letterSpacing: "var(--md-sys-typescale-label-large-tracking)" }}>Inizia Scrutinio</Button>
                        </>
                    )}
                    {step === "decisions" && (
                        <>
                            <Button onClick={() => setStep("intro")} variant="text" sx={{ fontWeight: "var(--md-sys-typescale-weight-black)", fontSize: "var(--md-sys-typescale-body-small-font-size)", textTransform: "uppercase", letterSpacing: "var(--md-sys-typescale-label-large-tracking)" }}>Indietro</Button>
                            <Button onClick={() => setStep("confirm")} variant="contained"  sx={{ fontWeight: "var(--md-sys-typescale-weight-black)", fontSize: "var(--md-sys-typescale-body-small-font-size)", textTransform: "uppercase", letterSpacing: "var(--md-sys-typescale-label-large-tracking)" }}>Conferma Esiti</Button>
                        </>
                    )}
                    {step === "confirm" && (
                        <>
                            <Button onClick={() => setStep("decisions")} variant="text" sx={{ fontWeight: "var(--md-sys-typescale-weight-black)", fontSize: "var(--md-sys-typescale-body-small-font-size)", textTransform: "uppercase", letterSpacing: "var(--md-sys-typescale-label-large-tracking)" }} disabled={isProcessing}>Indietro</Button>
                            <Button onClick={handleConfirm} variant="contained" sx={{ backgroundColor: 'var(--md-sys-color-error)', color: 'var(--md-sys-color-on-error)', fontWeight: "var(--md-sys-typescale-weight-black)", fontSize: "var(--md-sys-typescale-body-small-font-size)", textTransform: "uppercase", letterSpacing: "var(--md-sys-typescale-label-large-tracking)" }} disabled={isProcessing}>
                                {isProcessing ? "Elaborazione..." : "Esegui Passaggio Anno"}
                            </Button>
                        </>
                    )}
            </DialogActions>
        </Dialog>
    );
};

export default PassaggioAnnoWizard;

