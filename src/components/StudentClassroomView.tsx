import React, { useState, useMemo } from 'react';
import { Studente, Lezione, KnowledgeBaseEntry, HomeworkSubmission, RegisterEntry, TimetableSettings, View, NavigationParams } from '../types';
import { blobToBase64Parts } from '../utils/documentUtils';
import { printHomeworkSheet } from '../utils/printUtils';
import { useFileDrop } from '../hooks/useFileDrop';
import { SectionHeader, Avatar } from './ui';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import MuiCard from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Badge from '@mui/material/Badge';
import PinPadModal from './PinPadModal';
import AskAIButton from './AskAIButton';
import { logger } from '../utils/logger';

// Note: AIBrain import removed — no consumption needed in student view (teacher daily gestures prioritized in other components)

// Local Card component (MUI-native replacement for M3ExpressiveCard)
const _cardTokens: Record<string, readonly [string, string]> = {
    primary:        ['var(--md-sys-color-primary-container)',      'var(--md-sys-color-primary)'],
    secondary:      ['var(--md-sys-color-secondary-container)',    'var(--md-sys-color-secondary)'],
    tertiary:       ['var(--md-sys-color-tertiary-container)',     'var(--md-sys-color-tertiary)'],
    surface:        ['var(--md-sys-color-surface-container-high)', 'var(--md-sys-color-primary)'],
    surfaceVariant: ['var(--md-sys-color-surface-container-low)',  'var(--md-sys-color-secondary)'],
};
interface CardProps {
    icon: string; title: string; description: string;
    color?: string; onClick?: () => void;
    children?: React.ReactNode; ariaLabel?: string; style?: React.CSSProperties;
}
const Card: React.FC<CardProps> = ({ icon, title, description, color = 'surface', onClick, children, ariaLabel, style }) => {
    const tokens = _cardTokens[color];
    const bg = tokens ? tokens[0] : color;
    const accent = tokens ? tokens[1] : 'var(--md-sys-color-primary)';
    const clickable = Boolean(onClick);
    return (
        <MuiCard
            onClick={onClick}
            role={clickable ? 'button' : undefined}
            tabIndex={clickable ? 0 : undefined}
            aria-label={ariaLabel ?? (clickable ? `${title}: ${description}` : undefined)}
            onKeyDown={(e) => { if (clickable && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onClick?.(); } }}
            sx={[style ?? {}, {
                backgroundColor: bg,
                borderRadius: 'var(--md-sys-shape-corner-large)',
                border: '1px solid var(--md-sys-color-outline-variant)',
                cursor: clickable ? 'pointer' : 'default',
                boxShadow: 'var(--md-sys-elevation-level1)',
                transition: 'transform 500ms cubic-bezier(0.38,1.21,0.22,1.00), box-shadow var(--md-sys-motion-duration-short2) var(--md-sys-motion-easing-standard)',
                '&:hover': clickable ? { transform: 'scale(1.04)', boxShadow: 'var(--md-sys-elevation-level3)' } : {},
            }]}
        >
            <CardContent sx={{ p: 'var(--md-sys-spacing-8)', '&:last-child': { pb: 'var(--md-sys-spacing-8)' } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Box sx={{ width: 40, height: 40, borderRadius: 'var(--md-sys-shape-corner-large)', backgroundColor: 'var(--md-sys-color-surface-container-high)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 'var(--md-sys-typescale-title-large-font-size)', color: accent, userSelect: 'none' }}>{icon}</Box>
                    </Box>
                    {clickable && <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 'var(--md-sys-typescale-title-large-font-size)' }}>arrow_forward</Box>}
                </Box>
                <Typography variant="subtitle2">{title}</Typography>
                <Typography variant="body2" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{description}</Typography>
                {children && (
                    <Box sx={{ pt: 1, mt: 1, borderTop: '1px solid var(--md-sys-color-outline-variant)' }}>
                        {children}
                    </Box>
                )}
            </CardContent>
        </MuiCard>
    );
};

interface StudentClassroomViewProps {
    student: Studente;
    lessons: Lezione[];
    register: RegisterEntry[];
    kb: KnowledgeBaseEntry[];
    submissions: HomeworkSubmission[];
    onUploadSubmission: (submission: HomeworkSubmission) => void;
    onLogout: () => void;
    onExitMode?: () => void; 
    securityPin?: string;
    settings?: TimetableSettings; 
    onNavigate?: (view: View, context?: NavigationParams) => void;
}

const StudentClassroomView: React.FC<StudentClassroomViewProps> = ({ 
    student, lessons, register, kb, submissions, onUploadSubmission, onLogout, onExitMode, securityPin = '0000', settings, onNavigate
}) => {
    const [activeTab, setActiveTab] = useState<'feed' | 'homework' | 'materials'>('feed');
    const [isExitMenuOpen, setIsExitMenuOpen] = useState(false);
    const [isPinModalOpen, setIsPinModalOpen] = useState(false);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

    // Filter relevant data
    const classLessons = useMemo(() => 
        lessons.filter(l => l.classe === student.classe).sort((a,b) => b.id.localeCompare(a.id)), 
    [lessons, student.classe]);

    const feedItems = useMemo(() => {
        const items = [];
        for (const entry of register) {
            if (entry.classe === student.classe && entry.status === 'finalized') {
                const lesson = lessons.find(l => l.id === entry.lessonId);
                if (lesson) {
                    items.push({
                        type: 'lesson',
                        date: entry.date,
                        title: lesson.materia,
                        content: lesson.contenuto,
                        homework: lesson.compiti,
                        id: lesson.id,
                        originalLesson: lesson
                    });
                }
            }
        }
        return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [register, lessons, student.classe]);

    const pendingHomework = useMemo(() => {
        return classLessons.filter(l => 
            l.compiti && 
            (l.svolta || register.some(r => r.lessonId === l.id && r.status === 'finalized')) &&
            !submissions.find(s => s.lessonId === l.id && s.studentId === student.id)
        );
    }, [classLessons, submissions, student.id, register]);

    const submittedHomework = useMemo(() => {
        return submissions.filter(s => s.studentId === student.id);
    }, [submissions, student.id]);

    const handleUpload = async (file: File, lessonId: string) => {
        try {
            const { data, mimeType } = await blobToBase64Parts(file);
            const submission: HomeworkSubmission = {
                id: `sub-${Date.now()}`,
                studentId: student.id,
                lessonId: lessonId,
                date: new Date().toISOString(),
                file: { name: file.name, data, mimeType },
                status: 'pending'
            };
            onUploadSubmission(submission);
        } catch (e) {
            logger.error(e);
        }
    };
    
    const handleDownloadHomeworkSheet = (lesson: Lezione) => {
        if (!settings) return;
        setIsGeneratingPdf(true);
        try {
            printHomeworkSheet(lesson, settings);
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    const UploadButton: React.FC<{ lessonId: string }> = ({ lessonId }) => {
        const onDrop = (acceptedFiles: File[]) => {
            if (acceptedFiles.length > 0) handleUpload(acceptedFiles[0], lessonId);
        };
        const { getRootProps, getInputProps } = useFileDrop({ onDrop, multiple: false });
        return (
            <div {...getRootProps()} style={{
                backgroundColor: 'var(--md-sys-color-primary)',
                opacity: 'var(--md-sys-state-opacity-tint-hairline)',
                borderRadius: 'var(--md-sys-shape-corner-large)',
                cursor: "pointer",
                padding: 'var(--md-sys-spacing-6)',
                textAlign: "center",
                transition: 'opacity, transform, background-color, color, border-color, box-shadow var(--md-sys-motion-duration-medium) var(--md-sys-motion-easing-standard)',
                marginTop: 'var(--md-sys-spacing-4)'
            }}>
                <input {...getInputProps()} />
                <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{color: "var(--md-sys-color-primary)", marginBottom: 'var(--md-sys-spacing-8)', transition: "transform var(--md-sys-motion-duration-medium)"}}>cloud_upload</Box>
                <Typography variant="caption" sx={{textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--md-sys-color-primary)"}}>Carica Elaborato</Typography>
                <Typography variant="caption" sx={{ color: 'var(--md-sys-color-on-surface-variant)', opacity: "var(--md-sys-state-opacity-secondary)", marginTop: 'var(--md-sys-spacing-4)'}}>Trascina qui il file o clicca per selezionare</Typography>
            </div>
        );
    }

    return (
        <div  style={{minHeight: "var(--md-sys-viewport-height-full)", display: "flex", flexDirection: "column", backgroundColor: 'var(--md-sys-color-surface)'}}>
            {/* Aura Ornaments */}
            <div style={{ backgroundColor: 'var(--md-sys-color-primary)', opacity: 0.05, borderRadius: 'var(--md-sys-spacing-4)' }} />
            <div style={{ backgroundColor: 'var(--md-sys-color-tertiary)', opacity: 0.05, borderRadius: 'var(--md-sys-spacing-4)' }} />

            <header style={{ backgroundColor: 'var(--md-sys-color-surface-container-low)', opacity: 'var(--md-sys-state-opacity-tint-moderate)', borderBottom: "var(--md-sys-border-width-normal) solid var(--md-sys-color-outline)", padding: 'var(--md-sys-spacing-6)', display: "flex", justifyContent: "space-between", alignItems: "center"}}>
                <div style={{display: "flex", alignItems: "center", gap: 'var(--md-sys-spacing-8)'}}>
                    <Avatar name={`${student.nome} ${student.cognome}`} size="md"  />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                        <Typography variant="h6" sx={{ color: 'var(--md-sys-color-on-surface)', fontWeight: "var(--md-sys-typescale-weight-black)", letterSpacing: "-0.005em" }}>Diario di Classe</Typography>
                        <Typography variant="caption" sx={{ color: 'var(--md-sys-color-on-surface-variant)', textTransform: "uppercase", letterSpacing: "0.1em", opacity: "var(--md-sys-state-opacity-supporting)" }}>Classe {student.classe} • {student.nome} {student.cognome}</Typography>
                    </div>
                </div>
                <Button onClick={() => setIsExitMenuOpen(!isExitMenuOpen)} variant="outlined" startIcon={<Box component="span" className="material-symbols-outlined" aria-hidden="true">power_settings_new</Box>} sx={{color: "var(--md-sys-color-error)"}} />
                
                {isExitMenuOpen && (
                    <div style={{ backgroundColor: 'var(--md-sys-color-surface-container-high)', opacity: 'var(--md-sys-state-opacity-hover-overlay)', borderRadius: 'var(--md-sys-shape-corner-large)', border: "var(--md-sys-border-width-normal) solid var(--md-sys-color-outline)", padding: 'var(--md-sys-spacing-6)', display: "flex", flexDirection: "column"}}>
                        <button 
                            onClick={() => { onLogout(); setIsExitMenuOpen(false); }}
                            style={{ color: 'var(--md-sys-color-on-surface)', borderRadius: 'var(--md-sys-shape-corner-large)', padding: 'var(--md-sys-spacing-8)', textAlign: "left", display: "flex", alignItems: "center", gap: 'var(--md-sys-spacing-8)', transition: "color var(--md-sys-motion-duration-medium)"}}
                        >
                            <span className="material-symbols-outlined" aria-hidden="true" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>logout</span>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                                <Typography variant="caption" sx={{ fontWeight: "var(--md-sys-typescale-weight-black)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Termina Sessione</Typography>
                                <Typography variant="caption" sx={{ color: 'var(--md-sys-color-on-surface-variant)', opacity: "var(--md-sys-state-opacity-supporting)" }}>Torna al login studenti</Typography>
                            </div>
                        </button>
                        {onExitMode && (
                            <button 
                                onClick={() => { setIsPinModalOpen(true); setIsExitMenuOpen(false); }}
                                style={{ borderRadius: 'var(--md-sys-shape-corner-large)', padding: 'var(--md-sys-spacing-8)', textAlign: "left", color: "var(--md-sys-color-error)", display: "flex", alignItems: "center", gap: 'var(--md-sys-spacing-8)', transition: "color var(--md-sys-motion-duration-medium)", marginTop: 'var(--md-sys-spacing-4)'}}
                            >
                                <span className="material-symbols-outlined" aria-hidden="true">lock</span>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                                    <Typography variant="caption" sx={{ fontWeight: "var(--md-sys-typescale-weight-black)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Menu Docente</Typography>
                                    <Typography variant="caption" sx={{ opacity: "var(--md-sys-state-opacity-supporting)" }}>Richiede PIN di sicurezza</Typography>
                                </div>
                            </button>
                        )}
                    </div>
                )}
                {isExitMenuOpen && <div  onClick={() => setIsExitMenuOpen(false)}></div>}
            </header>

            <div style={{ backgroundColor: 'var(--md-sys-color-surface-container-low)', opacity: 'var(--md-sys-state-opacity-placeholder)', padding: 'var(--md-sys-spacing-8)', borderBottom: "var(--md-sys-border-width-normal) solid var(--md-sys-color-outline)"}}>
                                  <Tabs
                   value={activeTab}
                   onChange={(_, v: string) => ((id) => setActiveTab(id as 'feed' | 'homework' | 'materials'))(v)}
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
                        { id: 'feed', label: 'Attività', icon: 'feed' },
                        { id: 'homework', label: 'Compiti', icon: 'assignment', badge: pendingHomework.length || undefined },
                        { id: 'materials', label: 'Materiali', icon: 'folder' }
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
            </div>

            <main  style={{flexGrow: "1", overflowY: "auto", padding: 'var(--md-sys-spacing-6)', gap: 'var(--md-sys-spacing-8)'}}>
                
                {activeTab === 'feed' && (
                    <div  style={{gap: 'var(--md-sys-spacing-6)', marginLeft: "var(--md-sys-margin-auto)", marginRight: "var(--md-sys-margin-auto)"}}>
                        {feedItems.length > 0 ? feedItems.map((item) => (
                            <Card 
                                key={item.id}
                                icon="feed"
                                title={item.title}
                                description={item.content}
                            >
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                    <div style={{display: "flex", alignItems: "center", gap: 'var(--md-sys-spacing-6)'}}>
                                        <span style={{ backgroundColor: 'var(--md-sys-color-secondary)', opacity: 'var(--md-sys-state-opacity-tint-faint)', fontWeight: "var(--md-sys-typescale-weight-black)", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--md-sys-color-secondary)", borderRadius: 'var(--md-sys-spacing-4)'}}>
                                            {new Date(item.date).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })}
                                        </span>
                                        <span style={{fontWeight: "var(--md-sys-typescale-weight-black)", textTransform: "uppercase", color: "var(--md-sys-color-primary)"}}>{item.title}</span>
                                    </div>
                                </div>
                                <Typography variant="h5" sx={{ color: 'var(--md-sys-color-on-surface)', fontWeight: "var(--md-sys-typescale-weight-black)", letterSpacing: "-0.005em" }}>{item.content}</Typography>
                                {item.homework && (
                                    <div style={{ backgroundColor: 'var(--md-sys-color-tertiary)', opacity: 0.05, borderRadius: 'var(--md-sys-shape-corner-large)', padding: 'var(--md-sys-spacing-6)', border: "var(--md-sys-border-width-normal) solid var(--md-sys-color-outline)"}}>
                                        <div style={{display: "flex", alignItems: "center", gap: 'var(--md-sys-spacing-8)', color: "var(--md-sys-color-tertiary)"}}>
                                            <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: "var(--md-sys-typescale-headline-small-font-size)" }}>home_work</Box>
                                            <span style={{ fontWeight: "var(--md-sys-typescale-weight-black)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Compito per casa</span>
                                        </div>
                                        <Typography variant="body2" sx={{ color: 'var(--md-sys-color-on-surface-variant)', lineHeight: "1.625" }}>{item.homework}</Typography>
                                    </div>
                                )}
                                {settings && (
                                     <Button 
                                        onClick={() => handleDownloadHomeworkSheet(item.originalLesson)}
                                        disabled={isGeneratingPdf}
                                        variant="text"
                                        sx={{ color: 'var(--md-sys-color-on-surface-variant)', width: "var(--md-sys-percent-100)", fontWeight: "var(--md-sys-typescale-weight-black)", textTransform: "uppercase", letterSpacing: "0.1em" }}
                                     >
                                         <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ marginRight: "var(--md-sys-spacing-2)", fontSize: "var(--md-sys-typescale-body-large-font-size)" }}>print</Box>
                                         {isGeneratingPdf ? 'Generazione PDF...' : 'Scarica Scheda Lezione'}
                                     </Button>
                                )}
                            </Card>
                        )) : (
                            <div style={{ padding: 'var(--md-sys-spacing-4)', backgroundColor: 'var(--md-sys-color-surface-container-low)', opacity: 'var(--md-sys-state-opacity-tint-moderate)', borderRadius: 'var(--md-sys-shape-corner-large)', textAlign: "center", border: "var(--md-sys-border-width-normal) solid var(--md-sys-color-outline)"}}>
                                <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ color: 'var(--md-sys-color-on-surface-variant)', marginBottom: 'var(--md-sys-spacing-8)', opacity: "var(--md-sys-state-opacity-tint-subtle)"}}>feed</Box>
                                <Typography variant="body2" sx={{ color: 'var(--md-sys-color-on-surface-variant)', fontWeight: "var(--md-sys-typescale-weight-black)", textTransform: "uppercase", letterSpacing: "0.1em", opacity: "var(--md-sys-state-opacity-empty)" }}>Nessuna attività recente nel registro.</Typography>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'homework' && (
                    <div  style={{ marginLeft: "var(--md-sys-margin-auto)", marginRight: "var(--md-sys-margin-auto)" }}>
                        
                        <div style={{gap: 'var(--md-sys-spacing-6)'}}>
                            <SectionHeader 
                                title={`Da Consegnare (${pendingHomework.length})`} 
                                icon="pending_actions" 
                                
                            />
                            <div style={{marginTop: 'var(--md-sys-spacing-4)'}}>
                                {pendingHomework.map(lesson => (
                                    <Card 
                                        key={lesson.id}
                                        icon="assignment"
                                        title={lesson.materia}
                                        description={lesson.contenuto}
                                    >
                                        <div style={{display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 'var(--md-sys-spacing-8)'}}>
                                            <div style={{gap: 'var(--md-sys-spacing-1)'}}>
                                                <Typography variant="h6" sx={{ fontWeight: "var(--md-sys-typescale-weight-black)", letterSpacing: "-0.005em" }}>{lesson.materia}</Typography>
                                                <Typography variant="caption" sx={{ color: 'var(--md-sys-color-on-surface-variant)', fontWeight: "var(--md-sys-typescale-weight-black)", textTransform: "uppercase", letterSpacing: "0.1em", opacity: "var(--md-sys-state-opacity-secondary)" }}>{lesson.contenuto}</Typography>
                                            </div>
                                            <Chip label="Nuovo" size="small" sx={{ color: 'var(--md-sys-color-on-primary)', backgroundColor: 'var(--md-sys-color-primary)', fontWeight: 'var(--md-sys-typescale-weight-black)', textTransform: 'uppercase', letterSpacing: '0.1em', borderRadius: 'var(--md-sys-spacing-4)' }} />
                                        </div>
                                        <div style={{ backgroundColor: 'var(--md-sys-color-surface-container-high)', opacity: 'var(--md-sys-state-opacity-placeholder)', borderRadius: 'var(--md-sys-shape-corner-large)', padding: 'var(--md-sys-spacing-6)', fontSize: "var(--md-sys-typescale-body-large-font-size)", fontWeight: "var(--md-sys-typescale-weight-medium)", lineHeight: "1.625"}}>
                                            {lesson.compiti}
                                        </div>
                                        <UploadButton lessonId={lesson.id} />
                                    </Card>
                                ))}
                                {pendingHomework.length === 0 && (
                                    <div style={{ padding: 'var(--md-sys-spacing-4)', backgroundColor: 'var(--md-sys-color-surface-container-low)', opacity: 'var(--md-sys-state-opacity-tint-moderate)', borderRadius: 'var(--md-sys-shape-corner-large)', border: "var(--md-sys-border-width-normal) solid var(--md-sys-color-outline)", textAlign: "center"}}>
                                        <Typography variant="body2" sx={{ color: 'var(--md-sys-color-on-surface-variant)', fontWeight: "var(--md-sys-typescale-weight-black)", textTransform: "uppercase", letterSpacing: "0.1em", opacity: "var(--md-sys-state-opacity-empty)" }}>Nessun compito in sospeso.</Typography>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div style={{gap: 'var(--md-sys-spacing-6)'}}>
                            <SectionHeader 
                                title="Storico Consegne" 
                                icon="history" 
                                
                            />
                            <div style={{gap: 'var(--md-sys-spacing-3)'}}>
                                {submittedHomework.map(sub => {
                                    const relatedLesson = lessons.find(l => l.id === sub.lessonId);
                                    return (
                                        <div key={sub.id} style={{ backgroundColor: 'var(--md-sys-color-surface-container-low)', opacity: 'var(--md-sys-state-opacity-placeholder)', borderRadius: 'var(--md-sys-shape-corner-large)', padding: 'var(--md-sys-spacing-6)', border: "var(--md-sys-border-width-normal) solid var(--md-sys-color-outline)", display: "flex", justifyContent: "space-between", alignItems: "center", transition: "color var(--md-sys-motion-duration-medium)"}}>
                                            <div style={{gap: 'var(--md-sys-spacing-1)'}}>
                                                <Typography variant="caption" sx={{ fontWeight: "var(--md-sys-typescale-weight-black)", textTransform: "uppercase", letterSpacing: "0.1em" }}>{relatedLesson?.materia || 'Materia'}</Typography>
                                                <Typography variant="caption" sx={{ color: 'var(--md-sys-color-on-surface-variant)', fontWeight: "var(--md-sys-typescale-weight-medium)", opacity: "var(--md-sys-state-opacity-secondary)" }}>{new Date(sub.date).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })}</Typography>
                                            </div>
                                            <div style={{display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 'var(--md-sys-spacing-8)'}}>
                                                <span style={{
                                                    fontSize: 'var(--md-sys-typescale-body-small-font-size)',
                                                    fontWeight: 'var(--md-sys-typescale-weight-black)',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.1em',
                                                    padding: 'var(--md-sys-spacing-1) var(--md-sys-spacing-3)',
                                                    borderRadius: 'var(--md-sys-shape-corner-full)',
                                                    backgroundColor: sub.status === 'graded' ? 'var(--md-sys-color-secondary-container)' : 'var(--md-sys-color-tertiary-container)',
                                                    opacity: 'var(--md-sys-state-opacity-placeholder)',
                                                    color: sub.status === 'graded' ? 'var(--md-sys-color-on-secondary-container)' : 'var(--md-sys-color-on-tertiary-container)'
                                                }}>
                                                    {sub.status === 'graded' ? 'Valutato' : 'In attesa'}
                                                </span>
                                                {sub.teacherFeedback && <span style={{fontSize: "var(--md-sys-typescale-body-small-font-size)", fontWeight: "var(--md-sys-typescale-weight-black)", color: "var(--md-sys-color-primary)"}}>Voto: {sub.teacherFeedback}</span>}
                                            </div>
                                        </div>
                                    )
                                })}
                                {submittedHomework.length === 0 && (
                                    <Typography variant="body2" sx={{ color: 'var(--md-sys-color-on-surface-variant)', textAlign: "center", fontWeight: "var(--md-sys-typescale-weight-black)", textTransform: "uppercase", letterSpacing: "0.1em", opacity: "var(--md-sys-state-opacity-empty)" }}>Nessuna consegna effettuata.</Typography>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'materials' && (
                     <div  style={{display: "grid", gridTemplateColumns: "var(--md-sys-grid-fr-1) var(--md-sys-grid-fr-1)", gap: 'var(--md-sys-spacing-6)', marginLeft: "var(--md-sys-margin-auto)", marginRight: "var(--md-sys-margin-auto)"}}>
                        {kb.map(entry => (
                            <Card 
                                key={entry.id}
                                icon={entry.fileName.endsWith('.pdf') ? 'picture_as_pdf' : 'description'}
                                title={entry.fileName}
                                description={''}
                            >
                                <div style={{ borderRadius: 'var(--md-sys-shape-corner-large)', backgroundColor: 'var(--md-sys-color-secondary)', opacity: 'var(--md-sys-state-opacity-tint-faint)', width: 'var(--md-sys-spacing-4)', height: 'var(--md-sys-spacing-4)', color: "var(--md-sys-color-secondary)", display: "flex", alignItems: "center", justifyContent: "center", transition: "color var(--md-sys-motion-duration-medium)"}}>
                                    <span style={{ color: 'var(--md-sys-color-secondary)' }}>
                                        {entry.fileName.endsWith('.pdf') ? 'picture_as_pdf' : 'description'}
                                    </span>
                                </div>
                                <Typography variant="body2" sx={{ color: 'var(--md-sys-color-on-surface-variant)', fontWeight: "var(--md-sys-typescale-weight-black)", textTransform: "uppercase", letterSpacing: "0.1em", lineHeight: "1.625" }}>{entry.fileName}</Typography>
                            </Card>
                        ))}
                        {kb.length === 0 && (
                            <div style={{ padding: 'var(--md-sys-spacing-4)', backgroundColor: 'var(--md-sys-color-surface-container-low)', opacity: 'var(--md-sys-state-opacity-tint-moderate)', borderRadius: 'var(--md-sys-shape-corner-large)', textAlign: "center", border: "var(--md-sys-border-width-thin) solid var(--md-sys-color-outline)"}}>
                                <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ color: 'var(--md-sys-color-on-surface-variant)', marginBottom: 'var(--md-sys-spacing-8)', opacity: "var(--md-sys-state-opacity-tint-subtle)"}}>folder_off</Box>
                                <Typography variant="body2" sx={{ color: 'var(--md-sys-color-on-surface-variant)', fontWeight: "var(--md-sys-typescale-weight-black)", textTransform: "uppercase", letterSpacing: "0.1em", opacity: "var(--md-sys-state-opacity-empty)" }}>Nessun materiale condiviso.</Typography>
                            </div>
                        )}
                     </div>
                )}

            </main>
            
            {isPinModalOpen && onExitMode && (
                <PinPadModal
                    title="Uscita Modalità Studente"
                    correctPin={securityPin}
                    onSuccess={() => { setIsPinModalOpen(false); onExitMode(); }}
                    onCancel={() => setIsPinModalOpen(false)}
                />
            )}
        </div>
    );
};

export default StudentClassroomView;

