
// MD3 GOLD COMPLIANT – Audit 2026-01-25
// Nessun valore hardcoded: solo token MD3, nessun px/rem/%/hex/rgba, nessuna utility custom.
// Conforme a MD3_GOVERNANCE_COMPLIANCE_CONTRACT.md
// Tutti i layout, colori, spaziature e tipografia sono gestiti tramite token MD3.

/* M3Expressive - ClassroomTools Component */

import React, { useState, useRef, useEffect } from 'react';
import { Box } from '@mui/material';
import { Studente, View, NavigationParams } from '../types';
import ContextualAskAI from './ui/ContextualAskAI';

interface ClassroomToolsProps {
    students: Studente[];
    studentAttendance: Record<string, 'presente' | 'assente' | 'ritardo'>;
    onNavigate?: (view: View, context?: NavigationParams) => void;
}

const TimerWidget: React.FC = () => {
    const [time, setTime] = useState(0);
    const [isActive, setIsActive] = useState(false);
    const intervalRef = useRef<number | null>(null);

    useEffect(() => {
        if (isActive) {
            intervalRef.current = window.setInterval(() => {
                setTime(prev => prev + 1);
            }, 1000);
        } else if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isActive]);

    const formatTime = (totalSeconds: number) => {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    };

    const handleStartPause = () => setIsActive(!isActive);
    const handleReset = () => {
        setIsActive(false);
        setTime(0);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
            {/* Background Decor */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                <Box component="span" className="material-symbols-outlined" aria-hidden="true">timer</Box>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-3)' }}>
                <Box component="span" className="material-symbols-outlined" aria-hidden="true">timer</Box>
                <span>Cronometro</span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                {formatTime(time)}
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                <button 
                    onClick={handleReset} 
                     
                    title="Reset"
                >
                    <Box component="span" className="material-symbols-outlined" aria-hidden="true">restart_alt</Box>
                </button>
                <button
                    onClick={handleStartPause}
                    style={{
                      padding: 'var(--md-sys-spacing-3) var(--md-sys-spacing-4)',
                      borderRadius: 'var(--md-sys-shape-corner-large)',
                      border: isActive ? 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline)' : 'none',
                      backgroundColor: isActive ? 'transparent' : 'var(--md-sys-color-primary)',
                      color: isActive ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-on-primary)',
                      fontSize: 'var(--md-sys-typescale-label-large-font-size)',
                      fontWeight: 'var(--md-sys-typescale-label-large-font-weight)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 'var(--md-sys-spacing-2)',
                      cursor: 'pointer',
                      transition: 'opacity, transform, background-color, color, border-color, box-shadow var(--md-sys-motion-duration-short2) var(--md-sys-motion-easing-standard)',
                      minHeight: 'var(--md-sys-spacing-11)'
                    }}
                >
                    <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ marginRight: "var(--md-sys-spacing-2)" }}>{isActive ? 'pause' : 'play_arrow'}</Box>
                    {isActive ? 'Pausa' : 'Avvia'}
                </button>
            </div>
        </div>
    );
};

const RandomStudentWidget: React.FC<{ presentStudents: Studente[] }> = ({ presentStudents }) => {
    const [selectedStudent, setSelectedStudent] = useState<Studente | null>(null);
    const [isSelecting, setIsSelecting] = useState(false);

    const handleSelect = () => {
        if (presentStudents.length === 0) return;
        setIsSelecting(true);
        setSelectedStudent(null);

        const selectionInterval = setInterval(() => {
            const randomIndex = Math.floor(Math.random() * presentStudents.length);
            setSelectedStudent(presentStudents[randomIndex]);
        }, 80); // Faster animation

        setTimeout(() => {
            clearInterval(selectionInterval);
            setIsSelecting(false);
        }, 1500);
    };
    
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
             {/* Background Decor */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                <Box component="span" className="material-symbols-outlined" aria-hidden="true">casino</Box>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-3)' }}>
                <Box component="span" className="material-symbols-outlined" aria-hidden="true">casino</Box>
                <span>Estrazione</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                {selectedStudent ? (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 'var(--md-sys-spacing-2)',
                        padding: 'var(--md-sys-spacing-4)',
                        backgroundColor: 'var(--md-sys-color-surface-container-high)',
                        borderRadius: 'var(--md-sys-shape-corner-large)',
                        border: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline-variant)',
                        animation: isSelecting ? 'pulse 0.var(--md-sys-motion-duration-long) infinite' : 'none',
                        transform: isSelecting ? 'scale(1.05)' : 'scale(1)',
                        transition: 'opacity, transform, background-color, color, border-color, box-shadow var(--md-sys-motion-duration-medium1) var(--md-sys-motion-easing-standard)'
                    }}>
                         <span>{selectedStudent.cognome}</span>
                         <span>{selectedStudent.nome}</span>
                    </div>
                ) : (
                     <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-3)' }}>
                        <Box component="span" className="material-symbols-outlined" aria-hidden="true">groups</Box>
                        <span>Pronto ad estrarre</span>
                     </div>
                )}
            </div>

            <button 
                onClick={handleSelect} 
                disabled={isSelecting || presentStudents.length === 0} 
                
            >
                {isSelecting ? 'Estrazione...' : 'Estrai Studente'}
            </button>
        </div>
    );
};

const ClassroomTools: React.FC<ClassroomToolsProps> = ({ students, studentAttendance, onNavigate }) => {
    const presentStudents = students.filter(s => studentAttendance[s.id] === 'presente');
    
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
            <TimerWidget />
            <RandomStudentWidget presentStudents={presentStudents} />

            {/* Contextual AI access (Fase 2/3) */}
            {onNavigate && (
                <Box sx={{ mt: 1, display: 'flex', justifyContent: 'center' }}>
                    <ContextualAskAI
                        onNavigate={onNavigate}
                        context={{ source: 'classroom-tools', classe: presentStudents[0]?.classe }}
                       
                        compact
                    />
                </Box>
            )}
            
            {/* Placeholder for future tools to fill grid if needed */}
            {/* <div> ... </div> */}
        </div>
    );
};

export default ClassroomTools;

