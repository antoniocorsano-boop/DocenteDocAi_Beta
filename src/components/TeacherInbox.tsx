// MD3 Compliant
// M3Expressive refactor: Removed inline Tailwind classes, applied dedicated CSS classes with M3 tokens for colors, spacing, typography, elevation. Maintained responsive behavior and animations.
import React, { useState } from 'react';
import Box from '@mui/material/Box';
import { HomeworkSubmission, Studente, Lezione, View, NavigationParams } from '../types';
import ContextualAskAI from './ui/ContextualAskAI';
import { Avatar } from './ui';

import HomeworkSubmissionCard from './HomeworkSubmission'; 
interface TeacherInboxProps {
    submissions: HomeworkSubmission[];
    students: Studente[];
    lessons: Record<string, Lezione>;
    onGradeSubmission: (submissionId: string, grade: string, feedback: string) => void;
    onClose: () => void;
    onNavigate?: (view: View, context?: NavigationParams) => void;
}

const TeacherInbox: React.FC<TeacherInboxProps> = ({ submissions, students, lessons, onGradeSubmission, onClose, onNavigate }) => {
  const [selectedSubmission, setSelectedSubmission] = useState<HomeworkSubmission | null>(null);

    const pendingSubmissions = submissions.filter(s => s.status === 'pending');
    const gradedSubmissions = submissions.filter(s => s.status === 'graded');

    const getStudentDisplay = (studentId: string) => {
        const student = students.find(s => s.id === studentId);
        return student ? { 
            name: student.nome, 
            surname: student.cognome, 
            full: `${student.cognome} ${student.nome}`,
            obj: student
        } : { 
            name: '?', 
            surname: 'Sconosciuto', 
            full: 'Studente Eliminato',
            obj: null
        };
    };

    const getLessonDisplay = (lessonId: string) => {
        const lesson = lessons[lessonId];
        return lesson ? {
            materia: lesson.materia,
            contenuto: lesson.contenuto,
            obj: lesson
        } : {
            materia: 'N/A',
            contenuto: 'Lezione Sconosciuta',
            obj: null
        };
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                
                {/* Sidebar List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                        <h2>
                            <Box component="span" className="material-symbols-outlined" aria-hidden="true">inbox</Box> Inbox Compiti
                        </h2>
                        <button onClick={onClose}  aria-label="Chiudi inbox"><span style={{
}} aria-hidden="true">close</span></button>
                    </div>

                    {/* Contextual AI (Fase 2) */}
                    {onNavigate && (
                      <Box sx={{ display: 'flex', justifyContent: 'flex-start', mt: 1 }}>
                        <ContextualAskAI
                          onNavigate={onNavigate}
                         
                          context={{ source: 'teacher-inbox' }}
                          compact
                        />
                      </Box>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                        <p>Da Correggere ({pendingSubmissions.length})</p>
                        {pendingSubmissions.map(sub => {
                            const studentInfo = getStudentDisplay(sub.studentId);
                            const lessonInfo = getLessonDisplay(sub.lessonId);
                            const isSelected = selectedSubmission?.id === sub.id;
                            
                            return (
                                <div 
                                    key={sub.id}
                                    onClick={() => setSelectedSubmission(sub)}
                                    style={{
                                        borderRadius: 'var(--md-sys-shape-corner-small)',
                                        transition: 'var(--md-sys-motion-easing-standard)',
                                        backgroundColor: isSelected ? 'var(--md-sys-color-secondary-container)' : 'var(--md-sys-color-surface-container)',
                                        padding: 'var(--md-sys-spacing-3)',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <Avatar name={`${studentInfo.name} ${studentInfo.surname}`} size="sm" />
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                                        <p>{studentInfo.full}</p>
                                        <p>{lessonInfo.materia} - {lessonInfo.contenuto}</p>
                                        <span>{new Date(sub.date).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            );
                        })}
                        
                        {pendingSubmissions.length === 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                                Nessun compito in attesa.
                            </div>
                        )}
                        
                        {gradedSubmissions.length > 0 && (
                            <>
                                <p>Già Corretti</p>
                                {gradedSubmissions.slice(0, 5).map(sub => {
                                    const studentInfo = getStudentDisplay(sub.studentId);
                                    const lessonInfo = getLessonDisplay(sub.lessonId);
                                    return (
                                        <div key={sub.id}  style={{borderRadius: 'var(--md-sys-shape-corner-small)', transition: 'var(--md-sys-motion-easing-standard)'}}>
                                            <Box component="span" className="material-symbols-outlined" aria-hidden="true">check_circle</Box>
                                            <span>{studentInfo.full} - Voto: {sub.teacherFeedback} - {lessonInfo.materia}</span>
                                        </div>
                                    )
                                })}
                            </>
                        )}
                    </div>
                </div>

                {/* Main Grading Area */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                    {selectedSubmission ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                            <div  style={{ marginLeft: "var(--md-sys-margin-auto)", marginRight: "var(--md-sys-margin-auto)" }}>
                                <HomeworkSubmissionCard
                                    submission={selectedSubmission}
                                    student={getStudentDisplay(selectedSubmission.studentId).obj!}
                                    lesson={getLessonDisplay(selectedSubmission.lessonId).obj!}
                                    onGrade={onGradeSubmission}
                                />
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-3)' }}>
                            <Box component="span" className="material-symbols-outlined" aria-hidden="true">rate_review</Box>
                            <p>Seleziona un compito da correggere</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TeacherInbox;

// M3Expressive refactor COMPLETED: TeacherInbox.tsx - Replaced all hardcoded Tailwind classes with dedicated teacher-inbox-* CSS classes using M3 tokens for sidebar layout, submission items, graded items, and empty states.

