// MD3 Compliant - Updated for layered theme access

import React, { useState, useMemo } from 'react';
import { 
    Studente, 
    OrientamentoActivity, 
    EPortfolioEntry, 
    StudentOrientamentoState,
    View,
    NavigationParams
} from '../types';
import ContextualAskAI from './ui/ContextualAskAI';
import { SectionHeader, Avatar, EmptyState, InfoCard } from './ui';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import AddOrientamentoActivityModal from './AddOrientamentoActivityModal';
import StudentEPortfolioModal from './StudentEPortfolioModal';
interface OrientamentoDashboardProps {
    students: Studente[];
    activities: OrientamentoActivity[];
    ePortfolioEntries: EPortfolioEntry[];
    studentStates: Record<string, StudentOrientamentoState>;
    userClasses: string[];
    onSaveActivity: (activity: OrientamentoActivity) => void;
    onSaveEPortfolio: (entry: EPortfolioEntry) => void;
    onUpdateStudentState: (state: StudentOrientamentoState) => void;
    showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
    onNavigate?: (view: View, context?: NavigationParams) => void;
}

const OrientamentoDashboard: React.FC<OrientamentoDashboardProps> = ({
    students,
    activities,
    ePortfolioEntries,
    studentStates,
    userClasses,
    onSaveActivity,
    onSaveEPortfolio,
    onUpdateStudentState,
    showToast,
    onNavigate
}) => {
  const [selectedClass, setSelectedClass] = useState<string>(userClasses[0] || '');
    const [activeTab, setActiveTab] = useState<'activities' | 'students'>('activities');
    const [isAddActivityModalOpen, setIsAddActivityModalOpen] = useState(false);
    const [viewingStudent, setViewingStudent] = useState<Studente | null>(null);

    const filteredStudents = useMemo(() => {
        return students.filter(s => s.classe === selectedClass);
    }, [students, selectedClass]);

    const filteredActivities = useMemo(() => {
        return activities.filter(a => a.classes.includes(selectedClass));
    }, [activities, selectedClass]);

    const totalHours = useMemo(() => {
        return filteredActivities.reduce((acc, curr) => acc + curr.durationHours, 0);
    }, [filteredActivities]);

    const renderActivitiesTab = () => (
        <div style={{gap: 'var(--md-sys-spacing-6)'}}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Typography component="h3" variant="h6" sx={{ color: 'var(--md-sys-color-on-primary)' ,  fontWeight: "var(--md-sys-typescale-weight-black)" }}>Attività di Orientamento</Typography>
                <Button onClick={() => setIsAddActivityModalOpen(true)} variant="contained" startIcon={<Box component="span" className="material-symbols-outlined" aria-hidden="true">add</Box>}>
                    Nuova Attivit�
                </Button>
            </div>

            <div  style={{display: "grid", gridTemplateColumns: "var(--md-sys-grid-fr-1)", gap: 'var(--md-sys-spacing-6)'}}>
                {filteredActivities.map(activity => (
                    <InfoCard 
                        key={activity.id}
                        title={activity.title}
                        description={`${activity.durationHours} ore • ${new Date(activity.date).toLocaleDateString('it-IT')}`}
                        icon="explore"
                        variant="surface"
                    >
                        <Typography component="p" variant="body1" sx={{ color: 'var(--md-sys-color-on-surface-variant)', marginTop: 'var(--md-sys-spacing-4)' }}>
                            {activity.description}
                        </Typography>
                    </InfoCard>
                ))}
                {filteredActivities.length === 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                        <EmptyState 
                            title="Nessuna attività" 
                            description="Inizia aggiungendo un'attività di orientamento per questa classe." 
                            icon="explore_off" 
                        />
                    </div>
                )}
            </div>
        </div>
    );

    const renderStudentsTab = () => (
        <div style={{gap: 'var(--md-sys-spacing-6)'}}>
            <Typography component="h3" variant="h6" sx={{ color: 'var(--md-sys-color-on-primary)' ,  fontWeight: "var(--md-sys-typescale-weight-black)" }}>Stato E-Portfolio Studenti</Typography>
            <div  style={{border: "var(--md-sys-border-width-thin) solid var(--md-sys-color-outline)"}}>
                <table  style={{ width: 'var(--md-sys-percent-100)' }}>
                    <thead>
                        <tr style={{ backgroundColor: 'color-mix(in srgb, var(--md-sys-color-surface-container-low) 50%, transparent)' }}>
                            <th  style={{padding: 'var(--md-sys-spacing-8)', textAlign: "left", color: "var(--md-sys-color-primary)", textTransform: "uppercase", letterSpacing: "var(--md-sys-typescale-label-large-tracking)"}}>Studente</th>
                            <th  style={{padding: 'var(--md-sys-spacing-8)', textAlign: "center", color: "var(--md-sys-color-primary)", textTransform: "uppercase", letterSpacing: "var(--md-sys-typescale-label-large-tracking)"}}>Ore Totali</th>
                            <th  style={{padding: 'var(--md-sys-spacing-8)', textAlign: "center", color: "var(--md-sys-color-primary)", textTransform: "uppercase", letterSpacing: "var(--md-sys-typescale-label-large-tracking)"}}>Capolavoro</th>
                            <th  style={{padding: 'var(--md-sys-spacing-8)', textAlign: "center", color: "var(--md-sys-color-primary)", textTransform: "uppercase", letterSpacing: "var(--md-sys-typescale-label-large-tracking)"}}>Autovalutazione</th>
                            <th  style={{padding: 'var(--md-sys-spacing-8)', textAlign: "right", color: "var(--md-sys-color-primary)", textTransform: "uppercase", letterSpacing: "var(--md-sys-typescale-label-large-tracking)"}}>Azioni</th>
                        </tr>
                    </thead>
                    <tbody >
                        {filteredStudents.map(student => {
                            const state = studentStates[student.id] || { studentId: student.id, totalHours: 0, hasCapolavoro: false, hasAutovalutazione: false };
                            const progress = Math.min(100, (totalHours / 30) * 100); // Using class total hours as per guidelines for class activities
                            
                            return (
                                <tr key={student.id}  style={{ transition: "color var(--md-sys-motion-duration-medium)" }}>
                                    <td style={{padding: 'var(--md-sys-spacing-6)'}}>
                                        <div style={{display: "flex", alignItems: "center", gap: 'var(--md-sys-spacing-6)'}}>
                                            <Avatar name={`${student.nome} ${student.cognome}`} size="sm" />
                                            <span style={{ color: 'var(--md-sys-color-on-primary)' ,  fontWeight: "var(--md-sys-typescale-weight-bold)" }}>{student.cognome} {student.nome}</span>
                                        </div>
                                    </td>
                                    <td style={{padding: 'var(--md-sys-spacing-8)', textAlign: "center"}}>
                                        <div style={{display: "flex", flexDirection: "column", alignItems: "center", gap: 'var(--md-sys-spacing-4)'}}>
                                            <span style={{fontWeight: "var(--md-sys-typescale-weight-black)", color: "var(--md-sys-color-primary)"}}>{totalHours}/30h</span>
                                            <div style={{ backgroundColor: 'var(--md-sys-color-surface-container-high)', width: 'var(--md-sys-spacing-4)', borderRadius: 'var(--md-sys-spacing-4)' }}>
                                                <div 
                                                    style={{
                                                        height: 'var(--md-sys-percent-100)',
                                                        transition: 'all',
                                                        backgroundColor: progress >= 100 ? 'var(--md-sys-color-tertiary)' : 'var(--md-sys-color-primary)',
                                                        width: `${progress}%`
                                                    }}
                                                ></div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{padding: 'var(--md-sys-spacing-8)', textAlign: "center"}}>
                                        <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={state.hasCapolavoro ? {color: 'var(--md-sys-color-tertiary)'} : {}}>
                                            {state.hasCapolavoro ? 'check_circle' : 'radio_button_unchecked'}
                                        </Box>
                                    </td>
                                    <td style={{padding: 'var(--md-sys-spacing-8)', textAlign: "center"}}>
                                        <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={state.hasAutovalutazione ? {color: 'var(--md-sys-color-tertiary)'} : {}}>
                                            {state.hasAutovalutazione ? 'check_circle' : 'radio_button_unchecked'}
                                        </Box>
                                    </td>
                                    <td style={{padding: 'var(--md-sys-spacing-8)', textAlign: "right"}}>
                                        <Button onClick={() => setViewingStudent(student)} variant="text">
                                            Dettagli
                                        </Button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
            <div  style={{display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 'var(--md-sys-spacing-8)'}}>
                <SectionHeader 
                    title="Orientamento & E-Portfolio"
                    subtitle="Monitoraggio delle 30 ore annuali e gestione documenti istituzionali (Linee Guida 2023)."
                     sx={{ flexGrow: "1" }}
                />

                {/* Contextual AI (Fase 2) */}
                {onNavigate && (
                  <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
                    <ContextualAskAI
                      onNavigate={onNavigate}
                     
                      context={{ source: 'orientamento' }}
                    />
                  </Box>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                                        <FormControl fullWidth>
                      <InputLabel id="orientamento-classe-label" shrink>Classe</InputLabel>
                      <Select
                        labelId="orientamento-classe-label"
                        value={selectedClass}
                       
                        displayEmpty
                        notched
                        onChange={(e: SelectChangeEvent) => setSelectedClass(e.target.value)}
                      >
                        {userClasses.map(c => (
                            <MenuItem key={c} value={c}>Classe {c}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                </div>
            </div>

            <div style={{display: "grid", gridTemplateColumns: "var(--md-sys-grid-fr-1)", gap: 'var(--md-sys-spacing-8)'}}>
                <InfoCard 
                    title="Ore Medie Classe" 
                    description="Target Ministeriale: 30h"
                    icon="schedule"
                    variant="contained"
                >
                    <div style={{marginTop: 'var(--md-sys-spacing-4)'}}>
                        <span style={{fontWeight: "var(--md-sys-typescale-weight-black)", color: 'var(--md-sys-color-primary)'}}>{totalHours}h</span>
                        <Typography component="p" variant="body1" sx={{ color: 'var(--md-sys-color-on-surface-variant)', marginTop: 'var(--md-sys-spacing-4)' }}>
                            {totalHours >= 30 ? '✅ Target raggiunto per la classe' : `Mancano ${30 - totalHours}h al target`}
                        </Typography>
                    </div>
                </InfoCard>

                <InfoCard 
                    title="Completamento E-Portfolio" 
                    description="Studenti con Capolavoro"
                    icon="auto_awesome"
                    variant="tertiary"
                >
                    <div style={{marginTop: 'var(--md-sys-spacing-4)'}}>
                        <span style={{fontWeight: "var(--md-sys-typescale-weight-black)", color: 'var(--md-sys-color-tertiary)'}}>
                            {filteredStudents.filter(s => studentStates[s.id]?.hasCapolavoro).length}/{filteredStudents.length}
                        </span>
                    </div>
                </InfoCard>

                <InfoCard 
                    title="Autovalutazioni" 
                    description="Riflessioni caricate"
                    icon="psychology"
                    variant="outlined"
                >
                    <div style={{marginTop: 'var(--md-sys-spacing-4)'}}>
                        <span style={{fontWeight: "var(--md-sys-typescale-weight-black)", color: 'var(--md-sys-color-secondary)'}}>
                            {filteredStudents.filter(s => studentStates[s.id]?.hasAutovalutazione).length}/{filteredStudents.length}
                        </span>
                    </div>
                </InfoCard>
            </div>

            <div style={{ borderRadius: 'var(--md-sys-shape-corner-medium)' , border: "var(--md-sys-border-width-thin) solid var(--md-sys-color-outline)"}}>
                <div style={{ backgroundColor: 'var(--md-sys-color-surface-container)' , display: "flex", borderBottom: "var(--md-sys-border-width-thin) solid var(--md-sys-color-outline)", padding: 'var(--md-sys-spacing-8)'}}>
                    <button 
                        onClick={() => setActiveTab('activities')}
                        style={{color: 'var(--md-sys-color-on-primary)'}}
                    >
                        Attivit� di Orientamento
                    </button>
                    <button 
                        onClick={() => setActiveTab('students')}
                        style={{color: 'var(--md-sys-color-on-primary)'}}
                    >
                        Stato Studenti
                    </button>
                </div>

                <div style={{padding: 'var(--md-sys-spacing-6)'}}>
                    {activeTab === 'activities' ? renderActivitiesTab() : renderStudentsTab()}
                </div>
            </div>

            {/* Modals */}
            <AddOrientamentoActivityModal
                isOpen={isAddActivityModalOpen}
                onClose={() => setIsAddActivityModalOpen(false)}
                onSave={(a) => {
                    onSaveActivity(a);
                    showToast('Attività salvata con successo', 'success');
                }}
                userClasses={userClasses}
            />

            {viewingStudent && (
                <StudentEPortfolioModal
                    isOpen={!!viewingStudent}
                    onClose={() => setViewingStudent(null)}
                    student={viewingStudent}
                    state={studentStates[viewingStudent.id] || { studentId: viewingStudent.id, hasCapolavoro: false, hasAutovalutazione: false, totalHours: 0, activities: [], ePortfolio: [], selfReflection: ', tutorNotes: ' }}
                    entries={ePortfolioEntries.filter(e => e.studentId === viewingStudent.id)}
                    onUpdateState={onUpdateStudentState}
                    onAddEntry={(e) => {
                        onSaveEPortfolio(e);
                        showToast('Documento aggiunto all\'E-Portfolio', 'success');
                    }}
                />
            )}
        </div>
    );
};

export default OrientamentoDashboard;

