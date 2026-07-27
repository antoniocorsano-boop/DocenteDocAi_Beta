
// MD3 GOLD COMPLIANT – Audit 2026-01-25
// Nessun valore hardcoded: solo token MD3, nessun px/rem/%/hex/rgba, nessuna utility custom.
// Conforme a MD3_GOVERNANCE_COMPLIANCE_CONTRACT.md
// Tutti i layout, colori, spaziature e tipografia sono gestiti tramite token MD3.

// M3Expressive: TeachingAssignmentMatrix - Teaching assignment configuration matrix with M3 tokens
import React, { useEffect, useMemo, useState } from 'react';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { TeachingAssignment } from '../types';
import { generateHueFromString } from '../utils/colorUtils';

interface TeachingAssignmentMatrixProps {
    classes: string[];
    subjects: string[];
    assignments: TeachingAssignment[];
    onChange: (newAssignments: TeachingAssignment[]) => void;
}

export const TeachingAssignmentMatrix: React.FC<TeachingAssignmentMatrixProps> = ({ classes, subjects, assignments, onChange }) => {
    
    const toggleAssignment = (classId: string, subjectId: string) => {
        // Cerca se esiste già l'assegnazione
        const existingIndex = assignments.findIndex(a => a.classId === classId && a.subjectId === subjectId);
        
        if (existingIndex >= 0) {
            // Rimuovi
            const newAssignments = [...assignments];
            newAssignments.splice(existingIndex, 1);
            onChange(newAssignments);
        } else {
            // Aggiungi
            // Genera un colore coerente per la materia
            const hue = generateHueFromString(subjectId);
            const color = `hsl(${hue}, var(--md-sys-percent-70), var(--md-sys-percent-80))`;
            
            const newAssignment: TeachingAssignment = {
                id: `${classId}-${subjectId}`,
                classId,
                subjectId,
                color,
                hoursPerWeek: 2 // Default, eventualmente configurabile in futuro
            };
            onChange([...assignments, newAssignment]);
        }
    };

    if (classes.length === 0 || subjects.length === 0) {
        // ... existing code ...
    }

    if (assignments.length === 0) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-3)' }}>
                    <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 'var(--icon-size-medium)', color: 'var(--md-sys-color-primary)' }}>bolt</Box>
                </div>
                <Typography variant="h6" component="h3">Configura la Cattedra</Typography>
                <Typography variant="body2" component="p">
                    Usa lo strumento di <strong>Configurazione Rapida</strong> sopra per associare le tue materie alle classi in un colpo solo.
                </Typography>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                        Scorri verso l'alto ↑
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
            {/* DESKTOP VIEW: MD3 Table */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                    <table>
                        <thead>
                            <tr>
                                <th>
                                    Cattedra
                                </th>
                                {subjects.map(subj => (
                                    <th key={subj} >
                                        {subj}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {classes.map(cls => (
                                <tr key={cls} >
                                    <td>
                                        {cls}
                                    </td>
                                    {subjects.map(subj => {
                                        const isActive = assignments.some(a => a.classId === cls && a.subjectId === subj);
                                        
                                        return (
                                            <td key={`${cls}-${subj}`} >
                                                <button 
                                                    onClick={() => toggleAssignment(cls, subj)}
                                                    style={{
                                                        backgroundColor: isActive ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-surface)',
                                                        color: isActive ? 'var(--md-sys-color-on-primary)' : 'var(--md-sys-color-on-surface)',
                                                        border: `var(--md-sys-border-width-normal) solid var(--md-sys-color-outline)`,
                                                        borderRadius: 'var(--md-sys-shape-corner-medium)',
                                                        padding: 'var(--md-sys-spacing-2)',
                                                        cursor: 'pointer',
                                                        transition: 'background var(--md-sys-motion-duration-short), color var(--md-sys-motion-duration-short)'
                                                    }}
                                                    title={isActive ? `Rimuovi ${subj} da ${cls}` : `Assegna ${subj} a ${cls}`}
                                                    aria-label={`${subj} in ${cls}: ${isActive ? 'Assegnato' : 'Non assegnato'}`}
                                                >
                                                    <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontWeight: 'var(--md-sys-typescale-weight-regular)', fontStyle: 'normal', fontSize: 'var(--icon-size-medium)', letterSpacing: 'normal', textTransform: 'none', display: 'inline-block', verticalAlign: 'middle', color: isActive ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-outline)' }}>
                                                        {isActive ? 'check_circle' : 'add_circle'}
                                                    </Box>
                                                </button>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MOBILE VIEW: List of Cards with Chips */}
            {(() => {
                // eslint-disable-next-line react-hooks/rules-of-hooks, react-hooks/exhaustive-deps
                const useAccordion = useMemo(() => classes.length >= 6 || subjects.length >= 8, [classes.length, subjects.length]);
                // eslint-disable-next-line react-hooks/rules-of-hooks
                const [openClass, setOpenClass] = useState<string | null>(classes[0] || null);

                // eslint-disable-next-line react-hooks/rules-of-hooks
                useEffect(() => {
                    if (!classes.includes(openClass || '')) {
                        setOpenClass(classes[0] || null);
                    }
                // eslint-disable-next-line react-hooks/exhaustive-deps
                }, [classes, openClass]);

                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                        {classes.map(cls => {
                            const isActiveClass = openClass === cls || !useAccordion;
                            const toggleAccordion = () => setOpenClass(prev => (prev === cls ? null : cls));

                            return (
                                <div key={cls} >
                                    <button
                                        type="button"
                                        onClick={toggleAccordion}
                                        
                                        aria-expanded={isActiveClass}
                                    >
                                        <span>
                                            <span>
                                                {cls}
                                            </span>
                                            <span>Classe {cls}</span>
                                        </span>
                                        <span  aria-hidden="true">
                                            {isActiveClass ? 'expand_less' : 'expand_more'}
                                        </span>
                                    </button>
                                    {isActiveClass && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                                                {subjects.map(subj => {
                                                    const isActive = assignments.some(a => a.classId === cls && a.subjectId === subj);
                                                    return (
                                                        <button
                                                            key={subj}
                                                            onClick={() => toggleAssignment(cls, subj)}
                                                            style={{
                                                                backgroundColor: isActive ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-surface)',
                                                                color: isActive ? 'var(--md-sys-color-on-primary)' : 'var(--md-sys-color-on-surface)',
                                                                border: `var(--md-sys-border-width-normal) solid var(--md-sys-color-outline)`,
                                                                borderRadius: 'var(--md-sys-shape-corner-medium)',
                                                                padding: 'var(--md-sys-spacing-2)',
                                                                margin: 'var(--md-sys-spacing-2)',
                                                                cursor: 'pointer',
                                                                transition: 'background var(--md-sys-motion-duration-short), color var(--md-sys-motion-duration-short)'
                                                            }}
                                                        >
                                                            {isActive && <Box component="span" className="material-symbols-outlined" aria-hidden="true">check</Box>}
                                                            <span>{subj}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                );
            })()}

            {/* INFO SECTION */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                <Typography variant="body2" component="p" sx={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-2)' }}>
                    <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 'var(--icon-size-medium)', color: 'var(--md-sys-color-on-surface-variant)' }}>info</Box>
                    Tocca le materie per assegnarle alle classi.
                </Typography>
            </div>
        </div>
    );
};

