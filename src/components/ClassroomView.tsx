import React, { useState, useMemo } from 'react';
import { Studente, MaterialeDidattico, KnowledgeBaseEntry, ClassroomViewProps, HomeworkStatus, ParticipationEntry, Uda } from '../types';
import { ClassroomRegisterTab, StudentStat } from './classroom/ClassroomRegisterTab';
import { ClassroomNotesTab } from './classroom/ClassroomNotesTab';
import { ClassroomResourcesTab } from './classroom/ClassroomResourcesTab';
import { PARTICIPATION_BADGES } from '../constants';
import ClassroomTools from './ClassroomTools';
import ShareModal from './ShareModal';
import DocumentViewerModal from './DocumentViewerModal';
import ObservationModal from './ObservationModal';
import CopyForRegisterModal from './CopyForRegisterModal';
import QuickEvaluationModal from './QuickEvaluationModal';
import { calculatePerformance } from '../utils/evaluationUtils';

import { printHomeworkSheet } from '../utils/printUtils';
import StudentProfile from './StudentProfile';
import { Avatar, M3Dialog } from './ui';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import ContextualAskAI from './ui/ContextualAskAI';

// Fase 3 continuation: Real AIBrain consumption for classroom daily gestures (aula-session)
import { AIBrain } from '../ai/brain/AIBrain';

type AttendanceStatus = 'presente' | 'assente' | 'ritardo';
type ClassroomTab = 'register' | 'tools' | 'resources' | 'notes';

const ClassroomView: React.FC<ClassroomViewProps> = ({
    draftKey,
    draftEntry,
    students,
    lessons,
    uda,
    knowledgeBase,
    evaluations,
    competencyEvaluations,
    onUpdateDraftEntry,
    onFinalizeRegister,
    onCloseView,
    onSaveOralEvaluation,
    onSaveCompetencyEvaluation,
    onOpenLiveAssistant,
    settings,
    aiSettings,
    onNavigate,
}) => {
    const [activeTab, setActiveTab] = useState<ClassroomTab>('register');
    const [selectedStudentForActions, setSelectedStudentForActions] = useState<Studente | null>(null);
    const [confirmFinalizeOpen, setConfirmFinalizeOpen] = useState(false);
    const [quickEvalStudent, setQuickEvalStudent] = useState<Studente | null>(null);
    const [observationStudent, setObservationStudent] = useState<Studente | null>(null);
    const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
    const [isShareInfoOpen, setIsShareInfoOpen] = useState(false);
    const [previewingMaterial, setPreviewingMaterial] = useState<KnowledgeBaseEntry | null>(null);
    const [viewingStudentProfile, setViewingStudentProfile] = useState<Studente | null>(null);

    const lesson = useMemo(() => {
        return lessons[draftEntry.lessonId] || {
            id: draftEntry.lessonId,
            materia: draftEntry.materia || 'Sconosciuta',
            contenuto: 'Lezione (Dati Mancanti)',
            classe: draftEntry.classe,
            svolta: false
        };
    }, [lessons, draftEntry.lessonId, draftEntry.materia, draftEntry.classe]);

    const linkedUda = useMemo<Uda | undefined>(() => {
        if (!uda || !lesson.udaId) return undefined;
        return uda.find(u => u.id === lesson.udaId);
    }, [uda, lesson.udaId]);

  const classStudents = useMemo(() => {
    return students.filter(s => s.classe === draftEntry.classe).sort((a, b) => a.cognome.localeCompare(b.cognome));
  }, [students, draftEntry.classe]);

  // Fase 3 continuation: Real AIBrain consumption (user-centric daily gesture in aula/classroom)
  // buildContext + getUnifiedRecommendations + ask (wrapped safely)
  const aulaContext = useMemo(() => AIBrain.buildContext({
    class: draftEntry.classe,
    source: 'aula-session',
    extra: { lessonId: draftEntry.lessonId, studentsInClass: classStudents.length }
  }), [draftEntry.classe, draftEntry.lessonId, classStudents.length]);

  const aulaRecs = useMemo(() => {
    try {
      return AIBrain.getUnifiedRecommendations(aulaContext);
    } catch {
      return null;
    }
  }, [aulaContext]);

  // Real AIBrain.ask for classroom insight (visible daily gesture)
  const [aulaAiInsight, setAulaAiInsight] = React.useState<string | null>(null);
  const [aulaAiLoading, setAulaAiLoading] = React.useState(false);

  const fetchAulaAiInsight = React.useCallback(async () => {
    setAulaAiLoading(true);
    try {
      const res = await AIBrain.ask({
        prompt: `Suggerisci una rapida azione o insight per la lezione in corso nella classe ${draftEntry.classe}.`,
        context: aulaContext,
        mode: 'balanced'
      });
      setAulaAiInsight(res.content);

      if (import.meta.env.DEV) {
        AIBrain.migrateLegacyAsk('legacy-aula-session', aulaContext).catch(() => {});
      }
    } catch {
      setAulaAiInsight('Impossibile ottenere insight AIBrain.');
    } finally {
      setAulaAiLoading(false);
    }
  }, [draftEntry.classe, aulaContext]);

  // Auto-fetch on mount (daily classroom gesture)
  React.useEffect(() => {
    if (classStudents.length > 0) {
      fetchAulaAiInsight();
    }
  }, [classStudents.length, fetchAulaAiInsight]);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const studentAttendance = draftEntry.studentAttendance || {};
    const homeworkCheck = draftEntry.homeworkCheck || {};
    const participation = draftEntry.participation || {};
    const checkedObjectives = draftEntry.checkedObjectives || {};
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const observations = draftEntry.observations || {};

    // --- ATTENDANCE LOGIC ---
    const handleAttendanceToggle = (studentId: string) => {
        const current = studentAttendance[studentId] || 'presente';
        let next: AttendanceStatus = 'presente';
        if (current === 'presente') next = 'assente';
        else if (current === 'assente') next = 'ritardo';
        else next = 'presente';

        const newAttendance = { ...studentAttendance, [studentId]: next };
        onUpdateDraftEntry(draftKey, { studentAttendance: newAttendance });
    };

    const attendanceSummary = useMemo(() => {
        const present = classStudents.filter(s => !studentAttendance[s.id] || studentAttendance[s.id] === 'presente').length;
        const absent = classStudents.filter(s => studentAttendance[s.id] === 'assente').length;
        const late = classStudents.filter(s => studentAttendance[s.id] === 'ritardo').length;
        return { present, absent, late };
    }, [studentAttendance, classStudents]);

    const handleHomeworkChange = (studentId: string, status: HomeworkStatus) => {
        const newHomeworkCheck = { ...homeworkCheck, [studentId]: status };
        onUpdateDraftEntry(draftKey, { homeworkCheck: newHomeworkCheck });
    };

    const handleParticipation = (studentId: string, badgeId: ParticipationEntry['type']) => {
        const newParticipation = { ...participation };
        if (!newParticipation[studentId]) newParticipation[studentId] = [];
        newParticipation[studentId].push({ type: badgeId, timestamp: Date.now() });
        onUpdateDraftEntry(draftKey, { participation: newParticipation });
        setSelectedStudentForActions(null);
    };

    const handleObjectiveCheck = (index: number, isChecked: boolean) => {
        const newCheckedObjectives = { ...checkedObjectives, [index]: isChecked };
        onUpdateDraftEntry(draftKey, { checkedObjectives: newCheckedObjectives });
    };

    const handlePreviewMaterial = (material: MaterialeDidattico) => {
        if (material.type === 'kb' && material.kbId) {
            const kbEntry = knowledgeBase.find(kb => kb.id === material.kbId);
            if (kbEntry) setPreviewingMaterial(kbEntry);
        } else if (material.type === 'file' && material.file?.content) {
            setPreviewingMaterial({
                id: crypto.randomUUID(),
                fileName: material.file.name,
                content: "Contenuto Binario",
                fileContent: { data: material.file.content, mimeType: material.file.mimeType },
                htmlContent: `<p>File binario: ${material.file.mimeType}</p>`
            });
        }
    };

    const studentStats = useMemo<StudentStat[]>(() => {
        return classStudents.map(student => {
            const sEvals = evaluations.filter(e => e.studenteId === student.id);
            const { grade, trend } = calculatePerformance(student.id, 'Complessivo', sEvals);
            const writtenEvals = sEvals.filter(e => e.tipo === 'Scritto');
            const oralEvals = sEvals.filter(e => e.tipo === 'Orale');
            const writtenAvg = writtenEvals.length > 0 ? (writtenEvals.reduce((a, b) => a + (parseFloat(b.voto) || 0), 0) / writtenEvals.length).toFixed(1) : '-';
            const oralAvg = oralEvals.length > 0 ? (oralEvals.reduce((a, b) => a + (parseFloat(b.voto) || 0), 0) / oralEvals.length).toFixed(1) : '-';
            const notes = observations[student.id] || '';
            return {
                student,
                grade: grade ?? '',
                trend: trend ?? '',
                writtenCount: writtenEvals.length,
                writtenAvg,
                oralCount: oralEvals.length,
                oralAvg,
                notes
            };
        });
    }, [classStudents, evaluations, observations]);

    const handlePrintHomework = () => {
        if (!lesson) return;
        printHomeworkSheet(lesson, settings);
    };

    return (
        <div style={{ maxWidth: 'var(--md-sys-percent-full)', display: 'flex', flexDirection: 'column', width: '100%', padding: 'var(--md-sys-spacing-4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--md-sys-spacing-4)' }}>
                <button
                    onClick={onCloseView}
                    style={{
                        backgroundColor: 'var(--md-sys-color-surface-container-low)',
                        border: 'none',
                        borderRadius: 'var(--md-sys-shape-corner-medium)',
                        padding: 'var(--md-sys-spacing-2)',
                        cursor: 'pointer',
                        color: 'var(--md-sys-color-on-surface-variant)'
                    }}
                    title="Torna indietro"
                    aria-label="Chiudi vista lezione e torna alla lista lezioni"
                >
                    <Box component="span" className="material-symbols-outlined" aria-hidden="true">arrow_back</Box>
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-4)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-1)', color: 'var(--md-sys-color-on-surface-variant)' }} aria-label="Presenti:">
                        <span className="material-symbols-outlined" aria-hidden="true">group</span>
                        <Typography variant="caption">{attendanceSummary.present} PRES.</Typography>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-1)', color: attendanceSummary.absent > 0 ? 'var(--md-sys-color-error)' : 'var(--md-sys-color-on-surface-variant)' }} aria-label="Assenti:">
                        <span className="material-symbols-outlined" aria-hidden="true">person_off</span>
                        <Typography variant="caption">{attendanceSummary.absent} ASS.</Typography>
                    </div>
                </div>

                <button
                    onClick={() => setConfirmFinalizeOpen(true)}
                    style={{
                        backgroundColor: 'var(--md-sys-color-primary)',
                        color: 'var(--md-sys-color-on-primary)',
                        border: 'none',
                        borderRadius: 'var(--md-sys-shape-corner-medium)',
                        padding: 'var(--md-sys-spacing-2) var(--md-sys-spacing-3)',
                        cursor: 'pointer',
                        fontWeight: 'var(--md-sys-typescale-weight-bold)',
                        textTransform: 'uppercase',
                        letterSpacing: 'var(--md-sys-typescale-label-large-tracking)'
                    }}
                    title="Finalizza e chiudi registro"
                    aria-label="Salva e chiudi il registro di questa lezione"
                >
                    <span className="material-symbols-outlined" aria-hidden="true">save</span> Fine
                </button>
            </div>

            <div style={{ marginBottom: 'var(--md-sys-spacing-6)' }}>
                <Typography variant="h4" sx={{ color: 'var(--md-sys-color-on-surface)', fontWeight: 'var(--md-sys-typescale-weight-bold)', marginBottom: 'var(--md-sys-spacing-1)' }}>{lesson.materia}</Typography>
                <Typography variant="body1" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>{lesson.contenuto || 'Lezione'}</Typography>
                {linkedUda && (
                    <Chip
                        size="small"
                        icon={<Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 'var(--md-sys-typescale-label-small-font-size) !important' }}>assignment</Box>}
                        sx={{ mt: 'var(--md-sys-spacing-2)', backgroundColor: 'var(--md-sys-color-primary-container)', color: 'var(--md-sys-color-on-primary-container)', fontSize: 'var(--md-sys-typescale-label-small-font-size)' }}
                    />
                )}

                <div style={{ marginTop: 'var(--md-sys-spacing-4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--md-sys-spacing-2)' }}>
                    {onNavigate && (
                        <ContextualAskAI 
                            onNavigate={onNavigate} 
                            context={{ source: 'aula-session', classe: draftEntry.classe, lessonId: draftEntry.lessonId }}
                           
                            compact
                        />
                    )}

                    {/* Fase 3 continuation: Visible AIBrain (Fase 3) in aula (daily classroom gesture) */}
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={fetchAulaAiInsight}
                      disabled={aulaAiLoading}
                      startIcon={<Box component="span" className="material-symbols-outlined" sx={{ fontSize: '1rem' }}>auto_awesome</Box>}
                    >
                      {aulaAiLoading ? 'AIBrain…' : 'Insight AIBrain'}
                    </Button>
                </div>

                {/* Fase 3: Visible AIBrain unified + ask insight (aula-session daily gesture) */}
                {aulaRecs?.primary && (
                  <Box sx={{ mb: 1, p: 1, borderRadius: 'var(--md-sys-shape-corner-small)', bgcolor: 'var(--md-sys-color-tertiary-container)' }}>
                    <Typography variant="caption" sx={{ color: 'var(--md-sys-color-on-tertiary-container)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Box component="span" className="material-symbols-outlined" sx={{ fontSize: '1rem' }}>auto_awesome</Box>
                      AIBrain (Fase 3): {aulaRecs.primary.label || aulaRecs.primary.title}
                    </Typography>
                  </Box>
                )}

                {aulaAiInsight && (
                  <Box sx={{ mb: 2, p: 1, borderRadius: 'var(--md-sys-shape-corner-small)', bgcolor: 'var(--md-sys-color-secondary-container)' }}>
                    <Typography variant="caption" sx={{ color: 'var(--md-sys-color-on-secondary-container)', fontWeight: 500 }}>
                      AIBrain (Fase 3): {aulaAiInsight}
                    </Typography>
                  </Box>
                )}

                <Tabs
                  value={activeTab}
                  onChange={(_, v: string) => ((id) => setActiveTab(id as ClassroomTab))(v)}
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
                        { id: 'register', label: 'Registro', icon: 'how_to_reg' },
                        { id: 'notes', label: 'Diario', icon: 'edit_note' },
                        { id: 'tools', label: 'Strumenti', icon: 'construction' },
                        { id: 'resources', label: 'Materiali', icon: 'folder', badge: lesson.materialiDidattici?.length || undefined },
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
            </div>

            <div style={{ marginBottom: 'var(--md-sys-spacing-4)' }}>

                {activeTab === 'register' && (
                    <ClassroomRegisterTab
                        lesson={lesson}
                        studentStats={studentStats}
                        studentAttendance={studentAttendance}
                        homeworkCheck={homeworkCheck}
                        participation={participation}
                        checkedObjectives={checkedObjectives}
                        onAttendanceToggle={handleAttendanceToggle}
                        onObjectiveCheck={handleObjectiveCheck}
                        onSelectStudentForActions={setSelectedStudentForActions}
                        onViewStudentProfile={setViewingStudentProfile}
                    />
                )}

                {activeTab === 'notes' && (
                    <ClassroomNotesTab
                        notes={draftEntry.notes || ''}
                        onNotesChange={(text) => onUpdateDraftEntry(draftKey, { notes: text })}
                        onVoiceAppend={(text) => onUpdateDraftEntry(draftKey, { notes: (draftEntry.notes ? draftEntry.notes + '\n' : '') + text })}
                        onCopy={() => setIsCopyModalOpen(true)}
                        onShare={() => setIsShareInfoOpen(true)}
                        onPrintHomework={handlePrintHomework}
                    />
                )}

                {activeTab === 'tools' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                        <ClassroomTools 
                            students={classStudents} 
                            studentAttendance={studentAttendance} 
                            onNavigate={onNavigate}
                        />
                    </div>
                )}

                {activeTab === 'resources' && (
                    <ClassroomResourcesTab
                        lesson={lesson}
                        onPreviewMaterial={handlePreviewMaterial}
                    />
                )}

            </div>

            <div style={{ position: 'fixed', bottom: 'var(--md-sys-spacing-4)', right: 'var(--md-sys-spacing-4)' }}>
                <button
                    onClick={onOpenLiveAssistant}
                    style={{
                        backgroundColor: 'var(--md-sys-color-tertiary-container)',
                        color: 'var(--md-sys-color-on-tertiary-container)',
                        border: 'none',
                        borderRadius: 'var(--md-sys-shape-corner-large)',
                        padding: 'var(--md-sys-spacing-3)',
                        cursor: 'pointer',
                        boxShadow: 'var(--md-sys-elevation-level3)'
                    }}
                >
                    <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 'var(--md-sys-typescale-title-large-font-size)' }}>mic</Box>
                </button>
            </div>

            {selectedStudentForActions && (
                <M3Dialog
                    onClose={() => setSelectedStudentForActions(null)}
                    title={`${selectedStudentForActions.cognome}`}
                    maxWidth="sm"
                >
                    <DialogContent>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-2)', marginBottom: 'var(--md-sys-spacing-3)', borderBottom: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline)', paddingBottom: 'var(--md-sys-spacing-2)' }}>
                            <Avatar name={`${selectedStudentForActions.nome}`} size="md" />
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-3)' }}>
                                <Typography variant="h6" sx={{ fontSize: 'var(--md-sys-typescale-body-large-font-size)', fontWeight: 'var(--md-sys-typescale-weight-black)', color: 'var(--md-sys-color-on-surface)' }}>{selectedStudentForActions.cognome} {selectedStudentForActions.nome}</Typography>
                                <Typography variant="caption" sx={{ fontWeight: 'var(--md-sys-typescale-weight-bold)', textTransform: 'uppercase', letterSpacing: 'var(--md-sys-typescale-label-small-tracking)', color: 'var(--md-sys-color-primary)' }}>Azioni Rapide</Typography>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, var(--md-sys-grid-fr-1))', gap: 'var(--md-sys-spacing-3)', marginBottom: 'var(--md-sys-spacing-3)' }}>
                            <button
                                onClick={() => { setQuickEvalStudent(selectedStudentForActions); setSelectedStudentForActions(null); }}
                                style={{
                                    borderRadius: 'var(--md-sys-shape-corner-large)',
                                    backgroundColor: 'var(--md-sys-color-primary-container)',
                                    border: 'none',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: 'var(--md-sys-spacing-2)',
                                    padding: 'var(--md-sys-spacing-3)',
                                    cursor: 'pointer',
                                    transition: 'opacity, transform, background-color, color, border-color, box-shadow var(--md-sys-motion-duration-medium)'
                                }}
                            >
                                <div style={{ width: 'var(--md-sys-spacing-8)', height: 'var(--md-sys-spacing-8)', borderRadius: 'var(--md-sys-shape-corner-small)', backgroundColor: 'var(--md-sys-color-primary)', color: 'var(--md-sys-color-on-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform var(--md-sys-motion-duration-medium)' }}>
                                    <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 'var(--md-sys-typescale-body-large-font-size)' }}>grading</Box>
                                </div>
                                <Typography variant="caption" sx={{ fontWeight: 'var(--md-sys-typescale-weight-black)', textTransform: 'uppercase', letterSpacing: 'var(--md-sys-typescale-label-small-tracking)', color: 'var(--md-sys-color-on-primary-container)' }}>Voto</Typography>
                            </button>
                            <button
                                onClick={() => { setObservationStudent(selectedStudentForActions); setSelectedStudentForActions(null); }}
                                style={{
                                    borderRadius: 'var(--md-sys-shape-corner-large)',
                                    backgroundColor: 'var(--md-sys-color-secondary-container)',
                                    border: 'none',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: 'var(--md-sys-spacing-2)',
                                    padding: 'var(--md-sys-spacing-3)',
                                    cursor: 'pointer',
                                    transition: 'opacity, transform, background-color, color, border-color, box-shadow var(--md-sys-motion-duration-medium)'
                                }}
                            >
                                <div style={{ width: 'var(--md-sys-spacing-8)', height: 'var(--md-sys-spacing-8)', borderRadius: 'var(--md-sys-shape-corner-small)', backgroundColor: 'var(--md-sys-color-secondary)', color: 'var(--md-sys-color-on-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform var(--md-sys-motion-duration-medium)' }}>
                                    <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 'var(--md-sys-typescale-body-large-font-size)' }}>visibility</Box>
                                </div>
                                <Typography variant="caption" sx={{ fontWeight: 'var(--md-sys-typescale-weight-black)', textTransform: 'uppercase', letterSpacing: 'var(--md-sys-typescale-label-small-tracking)', color: 'var(--md-sys-color-on-secondary-container)' }}>Osserva</Typography>
                            </button>
                            <button
                                onClick={() => { setViewingStudentProfile(selectedStudentForActions); setSelectedStudentForActions(null); }}
                                style={{
                                    borderRadius: 'var(--md-sys-shape-corner-large)',
                                    backgroundColor: 'var(--md-sys-color-surface-container-highest)',
                                    border: 'none',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: 'var(--md-sys-spacing-2)',
                                    padding: 'var(--md-sys-spacing-3)',
                                    cursor: 'pointer',
                                    transition: 'opacity, transform, background-color, color, border-color, box-shadow var(--md-sys-motion-duration-medium)'
                                }}
                            >
                                <div style={{ width: 'var(--md-sys-spacing-8)', height: 'var(--md-sys-spacing-8)', borderRadius: 'var(--md-sys-shape-corner-small)', backgroundColor: 'var(--md-sys-color-on-surface-variant)', color: 'var(--md-sys-color-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform var(--md-sys-motion-duration-medium)' }}>
                                    <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 'var(--md-sys-typescale-body-large-font-size)' }}>person</Box>
                                </div>
                                <Typography variant="caption" sx={{ color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 'var(--md-sys-typescale-weight-black)', textTransform: 'uppercase', letterSpacing: 'var(--md-sys-typescale-label-small-tracking)' }}>Profilo</Typography>
                            </button>
                        </div>

                        <div style={{ marginBottom: 'var(--md-sys-spacing-3)' }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'var(--md-sys-typescale-weight-black)', textTransform: 'uppercase', marginBottom: 'var(--md-sys-spacing-2)', paddingLeft: 'var(--md-sys-spacing-2)', paddingRight: 'var(--md-sys-spacing-2)', color: 'var(--md-sys-color-on-surface-variant)' }}>Partecipazione</Typography>
                            <div style={{ display: 'flex', gap: 'var(--md-sys-spacing-2)', overflowX: 'auto' }}>
                                {PARTICIPATION_BADGES.map(badge => (
                                    <button
                                        key={badge.id}
                                        onClick={() => handleParticipation(selectedStudentForActions.id, badge.id as ParticipationEntry["type"])}
                                        style={{
                                            backgroundColor: 'var(--md-sys-color-surface-container-high)',
                                            border: 'none',
                                            borderRadius: 'var(--md-sys-shape-corner-medium)',
                                            padding: 'var(--md-sys-spacing-2)',
                                            cursor: 'pointer',
                                            transition: 'opacity, transform, background-color, color, border-color, box-shadow var(--md-sys-motion-duration-medium)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 'var(--md-sys-spacing-1)',
                                            color: badge.color
                                        }}
                                    >
                                        <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: 'var(--md-sys-typescale-body-large-font-size)' }}>{badge.icon}</span>
                                        <Typography variant="caption" sx={{ fontSize: 'var(--md-sys-typescale-body-large-font-size)', fontWeight: 'var(--md-sys-typescale-weight-bold)' }}>{badge.label}</Typography>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'var(--md-sys-typescale-weight-black)', textTransform: 'uppercase', marginBottom: 'var(--md-sys-spacing-2)', paddingLeft: 'var(--md-sys-spacing-2)', paddingRight: 'var(--md-sys-spacing-2)', color: 'var(--md-sys-color-on-surface-variant)' }}>Compiti</Typography>
                                                        <Tabs
                              value={homeworkCheck[selectedStudentForActions.id] || 'default'}
                              onChange={(_, v: string) => ((id) => { handleHomeworkChange(selectedStudentForActions.id, id as HomeworkStatus); setSelectedStudentForActions(null); })(v)}
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
                                    { id: 'completed', label: 'Svolti' },
                                    { id: 'partial', label: 'Parziali' },
                                    { id: 'missing', label: 'No' }
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
                        </div>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setSelectedStudentForActions(null)} variant="text">Chiudi</Button>
                    </DialogActions>
                </M3Dialog>
            )}

            {confirmFinalizeOpen && (
                <M3Dialog
                    isOpen={confirmFinalizeOpen}
                    title="Finalizza registro"
                    onClose={() => setConfirmFinalizeOpen(false)}
                >
                    <DialogContent>
                        <Typography variant="bodyMedium" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                            Stai per finalizzare il registro di questa lezione. Questa azione non può essere annullata. Confermi?
                        </Typography>
                    </DialogContent>
                    <DialogActions>
                        <Button variant="text" onClick={() => setConfirmFinalizeOpen(false)}>Annulla</Button>
                        <Button variant="contained" color="primary" onClick={() => { setConfirmFinalizeOpen(false); onFinalizeRegister(draftKey); }}>Conferma</Button>
                    </DialogActions>
                </M3Dialog>
            )}

            {isCopyModalOpen && lesson && (
                <CopyForRegisterModal
                    lesson={lesson}
                    entry={draftEntry}
                    students={classStudents}
                    todaysEvaluations={evaluations.filter(e => e.data.startsWith(draftEntry.date.split('T')[0]) && e.materia === lesson.materia)}
                    onClose={() => setIsCopyModalOpen(false)}
                />
            )}

            {isShareInfoOpen && (
                <ShareModal
                    title="Lezione:"
                    text="Argomento:\nCompiti:"
                    onClose={() => setIsShareInfoOpen(false)}
                />
            )}

            {previewingMaterial && (
                <DocumentViewerModal
                    title={previewingMaterial.fileName}
                    htmlContent={typeof previewingMaterial.htmlContent === 'string' && previewingMaterial.htmlContent.trim() ? previewingMaterial.htmlContent : 'Contenuto non disponibile'}
                    onClose={() => setPreviewingMaterial(null)}
                />
            )}

            {quickEvalStudent && lesson && (
                <QuickEvaluationModal
                    student={quickEvalStudent}
                    lesson={lesson}
                    settings={settings}
                    onClose={() => setQuickEvalStudent(null)}
                    onSaveEvaluation={(data) => { onSaveOralEvaluation(data); setQuickEvalStudent(null); }}
                    onSaveCompetencyEvaluation={(data) => { onSaveCompetencyEvaluation?.(data); setQuickEvalStudent(null); }}
                />
            )}

            {observationStudent && (
                <ObservationModal
                    student={observationStudent}
                    initialData={observations[observationStudent.id]}
                    onClose={() => setObservationStudent(null)}
                    onSave={(data) => {
                        const newObservations = { ...observations, [observationStudent.id]: data };
                        onUpdateDraftEntry(draftKey, { observations: newObservations });
                        setObservationStudent(null);
                    }}
                />
            )}

            {viewingStudentProfile && (
                <div style={{ backgroundColor: 'var(--md-sys-color-surface)', overflowY: 'auto', padding: 'var(--md-sys-spacing-4)' }}>
                    <StudentProfile
                        student={viewingStudentProfile}
                        evaluations={evaluations.filter(e => e.studenteId === viewingStudentProfile.id)}
                        competencyEvaluations={competencyEvaluations.filter(e => e.studenteId === viewingStudentProfile.id)}
                        settings={settings}
                        aiSettings={aiSettings}
                        onBack={() => setViewingStudentProfile(null)}
                        onDeleteEvaluation={() => {/* Handle delete */ }}
                        register={[]}
                        lessons={lessons}
                    />
                </div>
            )}
        </div>
    );
};

export default ClassroomView;

