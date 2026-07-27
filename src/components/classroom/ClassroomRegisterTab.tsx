import React, { useState, useMemo } from 'react';
import { Studente, Lezione, HomeworkStatus, ParticipationEntry, ObservationEntry } from '../../types';
import { Avatar } from '../ui';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Tooltip from '@mui/material/Tooltip';

type AttendanceStatus = 'presente' | 'assente' | 'ritardo';

export type StudentStat = {
    student: Studente;
    grade: string;
    trend: string;
    writtenCount: number;
    writtenAvg: string;
    oralCount: number;
    oralAvg: string;
    notes: ObservationEntry | string;
};

interface ClassroomRegisterTabProps {
    lesson: Lezione;
    studentStats: StudentStat[];
    studentAttendance: Record<string, AttendanceStatus>;
    homeworkCheck: Record<string, HomeworkStatus>;
    participation: Record<string, ParticipationEntry[]>;
    checkedObjectives: Record<number, boolean>;
    onAttendanceToggle: (studentId: string) => void;
    onObjectiveCheck: (index: number, isChecked: boolean) => void;
    onSelectStudentForActions: (student: Studente) => void;
    onViewStudentProfile: (student: Studente) => void;
}

const PARTICIPATION_ICON: Record<ParticipationEntry['type'], string> = {
    positive:      'star',
    question:      'help',
    collaboration: 'handshake',
    distraction:   'warning',
};

const ATTENDANCE_ICON: Record<AttendanceStatus, string> = {
    presente: 'check_circle',
    assente:  'cancel',
    ritardo:  'schedule',
};

const ATTENDANCE_LABEL: Record<AttendanceStatus, string> = {
    presente: 'Presente',
    assente:  'Assente',
    ritardo:  'Ritardo',
};

const HW_ICON: Record<HomeworkStatus, string>  = { completed: 'task_alt', missing: 'unpublished', partial: 'pending', default: 'help_outline' };
const HW_LABEL: Record<HomeworkStatus, string> = { completed: 'Svolti', missing: 'Mancanti', partial: 'Parziali', default: '—' };

function gradeColor(grade: string): string {
    const g = parseFloat(grade);
    if (!g) return 'var(--md-sys-color-on-surface-variant)';
    if (g >= 8) return 'var(--md-sys-color-primary)';
    if (g >= 6) return 'var(--md-sys-color-secondary)';
    return 'var(--md-sys-color-error)';
}

const thStyle: React.CSSProperties = {
    padding: 'var(--md-sys-spacing-2) var(--md-sys-spacing-3)',
    textAlign: 'left',
    fontWeight: 'var(--md-sys-typescale-weight-bold)' as React.CSSProperties['fontWeight'],
    fontSize: 'var(--md-sys-typescale-label-small-font-size)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: 'var(--md-sys-color-on-surface-variant)',
    borderBottom: '2px solid var(--md-sys-color-outline-variant)',
    whiteSpace: 'nowrap',
    backgroundColor: 'var(--md-sys-color-surface-container-high)',
};

const tdStyle: React.CSSProperties = {
    padding: 'var(--md-sys-spacing-2) var(--md-sys-spacing-3)',
    verticalAlign: 'middle',
    borderBottom: '1px solid var(--md-sys-color-outline-variant)',
};

export const ClassroomRegisterTab: React.FC<ClassroomRegisterTabProps> = ({
    lesson,
    studentStats,
    studentAttendance,
    homeworkCheck,
    participation,
    checkedObjectives,
    onAttendanceToggle,
    onObjectiveCheck,
    onSelectStudentForActions,
    onViewStudentProfile,
}) => {
    const [objectivesOpen, setObjectivesOpen] = useState(false);

    const totals = useMemo(() => {
        const present = studentStats.filter(s => !studentAttendance[s.student.id] || studentAttendance[s.student.id] === 'presente').length;
        const absent  = studentStats.filter(s => studentAttendance[s.student.id] === 'assente').length;
        const late    = studentStats.filter(s => studentAttendance[s.student.id] === 'ritardo').length;
        return { present, absent, late };
    }, [studentStats, studentAttendance]);

    const objectives = lesson.obiettivi ? lesson.obiettivi.split('\n').filter(o => o.trim()) : [];

    return (
        <Box sx={{ marginTop: 'var(--md-sys-spacing-4)', display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>

            {/* â”€â”€ Obiettivi collapsibili â”€â”€ */}
            {objectives.length > 0 && (
                <Box sx={{
                    borderRadius: 'var(--md-sys-shape-corner-large)',
                    border: '1px solid var(--md-sys-color-outline-variant)',
                    overflow: 'hidden',
                }}>
                    <ButtonBase
                        focusRipple
                        onClick={() => setObjectivesOpen(o => !o)}
                        sx={{
                            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: 'var(--md-sys-spacing-3) var(--md-sys-spacing-4)',
                            backgroundColor: 'var(--md-sys-color-surface-container)',
                            color: 'var(--md-sys-color-primary)',
                        }}
                        aria-expanded={objectivesOpen}
                        aria-controls="register-objectives"
                    >
                        <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-2)', fontWeight: 'var(--md-sys-typescale-weight-bold)', fontSize: 'var(--md-sys-typescale-label-large-font-size)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                            <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 18 }}>target</Box>
                            Obiettivi Didattici ({objectives.filter((_, i) => checkedObjectives[i]).length}/{objectives.length})
                        </Box>
                        <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 20, transition: 'transform 200ms' }}>
                            {objectivesOpen ? 'expand_less' : 'expand_more'}
                        </Box>
                    </ButtonBase>
                    {objectivesOpen && (
                        <Box id="register-objectives" sx={{ padding: 'var(--md-sys-spacing-3) var(--md-sys-spacing-4)', display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-2)', backgroundColor: 'var(--md-sys-color-surface)' }}>
                            {objectives.map((obj, idx) => (
                                <label key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--md-sys-spacing-3)', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        id={`obj-${idx}`}
                                        name={`objective-${idx}`}
                                        checked={checkedObjectives[idx] || false}
                                        onChange={e => onObjectiveCheck(idx, e.target.checked)}
                                        style={{ marginTop: '2px', accentColor: 'var(--md-sys-color-primary)' }}
                                    />
                                    <Typography variant="body2" sx={{ color: checkedObjectives[idx] ? 'var(--md-sys-color-on-surface-variant)' : 'var(--md-sys-color-on-surface)', textDecoration: checkedObjectives[idx] ? 'line-through' : 'none' }}>
                                        {obj.replace(/^- /, '')}
                                    </Typography>
                                </label>
                            ))}
                        </Box>
                    )}
                </Box>
            )}
            {/* â”€â”€ Riepilogo presenze â”€â”€ */}
            <Box sx={{ display: 'flex', gap: 'var(--md-sys-spacing-3)', flexWrap: 'wrap' }}>
                {([
                    { label: 'Presenti', value: totals.present, icon: 'check_circle', color: 'var(--md-sys-color-primary)' },
                    { label: 'Assenti',  value: totals.absent,  icon: 'cancel',        color: 'var(--md-sys-color-error)' },
                    { label: 'Ritardo',  value: totals.late,    icon: 'schedule',      color: 'var(--md-sys-color-tertiary)' },
                ] as const).map(chip => (
                    <Box key={chip.label} sx={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-1)', padding: 'var(--md-sys-spacing-1) var(--md-sys-spacing-3)', borderRadius: 'var(--md-sys-shape-corner-full)', backgroundColor: 'var(--md-sys-color-surface-container)', border: '1px solid var(--md-sys-color-outline-variant)' }}>
                    <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 16, color: chip.color }}>{chip.icon}</Box>
                    <Typography variant="caption" sx={{ fontWeight: 'var(--md-sys-typescale-weight-bold)', color: chip.color }}>{chip.value}</Typography>
                    <Typography variant="caption" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>{chip.label}</Typography>
                </Box>
                ))}
            </Box>

            {/* â”€â”€ Tabella compatta â”€â”€ */}
            <Box sx={{ overflowX: 'auto', borderRadius: 'var(--md-sys-shape-corner-large)', border: '1px solid var(--md-sys-color-outline-variant)' }}>
                <table
                    style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'auto' }}
                    role="grid"
                    aria-label="Registro studenti"
                >
                    <thead>
                        <tr>
                            <th style={{ ...thStyle, minWidth: '160px' }}>Studente</th>
                            <th style={{ ...thStyle, textAlign: 'center', minWidth: '64px' }}>Pres.</th>
                            <th style={{ ...thStyle, textAlign: 'center', minWidth: '64px' }}>Compiti</th>
                            <th style={{ ...thStyle, minWidth: '100px' }}>Partecip.</th>
                            <th style={{ ...thStyle, textAlign: 'center', minWidth: '56px' }}>Scritti</th>
                            <th style={{ ...thStyle, textAlign: 'center', minWidth: '56px' }}>Orali</th>
                            <th style={{ ...thStyle, textAlign: 'center', minWidth: '72px' }}>Media</th>
                            <th style={{ ...thStyle, textAlign: 'center', minWidth: '44px' }}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {studentStats.map((stat, index) => {
                            const student = stat.student;
                            const status  = studentAttendance[student.id] || 'presente';
                            const hwStatus = homeworkCheck[student.id];
                            const badges   = participation[student.id] || [];
                            const isAbsent = status === 'assente';
                            const rowBg = isAbsent
                                ? 'color-mix(in srgb, var(--md-sys-color-error-container) 30%, transparent)'
                                : index % 2 === 0
                                    ? 'var(--md-sys-color-surface)'
                                    : 'var(--md-sys-color-surface-container)';

                            return (
                                <tr
                                    key={student.id}
                                    onClick={() => onViewStudentProfile(student)}
                                    tabIndex={0}
                                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { onViewStudentProfile(student); e.preventDefault(); } }}
                                    style={{ backgroundColor: rowBg, cursor: 'pointer' }}
                                    role="row"
                                    aria-label={`${student.cognome} ${student.nome}, ${ATTENDANCE_LABEL[status]}`}
                                >
                                    {/* Studente */}
                                    <td style={tdStyle}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-2)' }}>
                                            <Avatar name={student.cognome} size="sm" />
                                            <Box sx={{ minWidth: 0 }}>
                                                <Typography variant="body2" sx={{ fontWeight: 'var(--md-sys-typescale-weight-bold)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: isAbsent ? 'var(--md-sys-color-on-surface-variant)' : 'var(--md-sys-color-on-surface)', textDecoration: isAbsent ? 'line-through' : 'none' }}>
                                                    {student.cognome} {student.nome}
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>{student.classe}</Typography>
                                            </Box>
                                        </Box>
                                    </td>

                                    {/* Presenza */}
                                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                                        <Tooltip title={ATTENDANCE_LABEL[status]} placement="top">
                                            <ButtonBase
                                                focusRipple
                                                onClick={e => { e.stopPropagation(); onAttendanceToggle(student.id); }}
                                                aria-label={`Presenza: ${ATTENDANCE_LABEL[status]}. Click per cambiare`}
                                                sx={{
                                                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                                    width: 'var(--md-sys-spacing-12)', height: 'var(--md-sys-spacing-12)',
                                                    borderRadius: 'var(--md-sys-shape-corner-full)',
                                                    backgroundColor: status === 'presente' ? 'var(--md-sys-color-primary-container)' : status === 'assente' ? 'var(--md-sys-color-error-container)' : 'var(--md-sys-color-tertiary-container)',
                                                    color: status === 'presente' ? 'var(--md-sys-color-on-primary-container)' : status === 'assente' ? 'var(--md-sys-color-on-error-container)' : 'var(--md-sys-color-on-tertiary-container)',
                                                    transition: 'background-color var(--md-sys-motion-duration-short)',
                                                }}
                                            >
                                                <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 18 }}>{ATTENDANCE_ICON[status]}</Box>
                                            </ButtonBase>
                                        </Tooltip>
                                    </td>

                                    {/* Compiti */}
                                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                                        {hwStatus ? (
                                            <Tooltip title={HW_LABEL[hwStatus]} placement="top">
                                                <Box component="span" className="material-symbols-outlined" aria-label={HW_LABEL[hwStatus]} sx={{
                                                    fontSize: 20,
                                                    color: hwStatus === 'completed' ? 'var(--md-sys-color-primary)' : hwStatus === 'missing' ? 'var(--md-sys-color-error)' : 'var(--md-sys-color-tertiary)',
                                                    display: 'inline-block',
                                                }}>{HW_ICON[hwStatus]}</Box>
                                            </Tooltip>
                                        ) : (
                                            <Typography variant="body2" component="span" sx={{ color: 'var(--md-sys-color-outline)' }}>—</Typography>
                                        )}
                                    </td>

                                    {/* Partecipazione */}
                                    <td style={tdStyle}>
                                            <Box sx={{ display: 'flex', gap: 'var(--md-sys-spacing-1)', flexWrap: 'wrap' }}>
                                            {(['positive', 'question', 'collaboration', 'distraction'] as ParticipationEntry['type'][]).map(type => {
                                                const count = badges.filter(b => b.type === type).length;
                                                if (!count) return null;
                                                return (
                                                    <Tooltip key={type} title={`${type} ×${count}`} placement="top">
                                                        <Box component="span" sx={{
                                                            display: 'inline-flex', alignItems: 'center', gap: '2px',
                                                            padding: '1px 6px',
                                                            borderRadius: 'var(--md-sys-shape-corner-full)',
                                                            fontSize: 'var(--md-sys-typescale-label-small-font-size)', fontWeight: 'var(--md-sys-typescale-weight-bold)',
                                                            backgroundColor: type === 'positive' ? 'var(--md-sys-color-primary-container)' : type === 'distraction' ? 'var(--md-sys-color-error-container)' : 'var(--md-sys-color-secondary-container)',
                                                            color: type === 'positive' ? 'var(--md-sys-color-on-primary-container)' : type === 'distraction' ? 'var(--md-sys-color-on-error-container)' : 'var(--md-sys-color-on-secondary-container)',
                                                        }}>
                                                            <Box component="span" className="material-symbols-outlined" sx={{ fontSize: 12 }}>{PARTICIPATION_ICON[type]}</Box>
                                                            {count > 1 && count}
                                                        </Box>
                                                    </Tooltip>
                                                );
                                            })}
                                        </Box>
                                    </td>

                                    {/* Scritti */}
                                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                                        {stat.writtenCount > 0 ? (
                                            <Tooltip title={`${stat.writtenCount} valutazioni`} placement="top">
                                                <Typography variant="body2" component="span" sx={{ fontWeight: 'var(--md-sys-typescale-weight-bold)', color: gradeColor(stat.writtenAvg) }}>
                                                    {stat.writtenAvg}
                                                </Typography>
                                            </Tooltip>
                                        ) : (
                                            <Typography variant="body2" component="span" sx={{ color: 'var(--md-sys-color-outline)' }}>—</Typography>
                                        )}
                                    </td>

                                    {/* Orali */}
                                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                                        {stat.oralCount > 0 ? (
                                            <Tooltip title={`${stat.oralCount} valutazioni`} placement="top">
                                                <Typography variant="body2" component="span" sx={{ fontWeight: 'var(--md-sys-typescale-weight-bold)', color: gradeColor(stat.oralAvg) }}>
                                                    {stat.oralAvg}
                                                </Typography>
                                            </Tooltip>
                                        ) : (
                                            <Typography variant="body2" component="span" sx={{ color: 'var(--md-sys-color-outline)' }}>—</Typography>
                                        )}
                                    </td>

                                    {/* Media + trend */}
                                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                                        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--md-sys-spacing-1)' }}>
                                            <Typography variant="body2" component="span" sx={{ fontWeight: 'var(--md-sys-typescale-weight-bold)', color: gradeColor(stat.grade) }}>
                                                {stat.grade || '—'}
                                            </Typography>
                                            <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{
                                                fontSize: 16,
                                                color: stat.trend === 'up' ? 'var(--md-sys-color-primary)' : stat.trend === 'down' ? 'var(--md-sys-color-error)' : 'var(--md-sys-color-on-surface-variant)',
                                            }}>
                                                {stat.trend === 'up' ? 'trending_up' : stat.trend === 'down' ? 'trending_down' : 'trending_flat'}
                                            </Box>
                                        </Box>
                                    </td>

                                    {/* Azioni */}
                                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                                        <ButtonBase
                                            focusRipple
                                            onClick={e => { e.stopPropagation(); onSelectStudentForActions(student); }}
                                            aria-label={`Azioni per ${student.cognome}`}
                                            sx={{
                                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                                width: 'var(--md-sys-spacing-12)', height: 'var(--md-sys-spacing-12)',
                                                backgroundColor: 'transparent',
                                                borderRadius: 'var(--md-sys-shape-corner-full)',
                                                color: 'var(--md-sys-color-on-surface-variant)',
                                            }}
                                        >
                                            <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 20 }}>more_vert</Box>
                                        </ButtonBase>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </Box>
        </Box>
    );
};
