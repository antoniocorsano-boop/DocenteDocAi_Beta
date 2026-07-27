// MD3 Compliant

import React, { useMemo } from 'react';
import { Studente, Valutazione } from '../types';
import { calculatePerformance } from '../utils/evaluationUtils';
import BarChart from './charts/BarChart';
import DonutChart from './charts/DonutChart';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { M3Dialog } from './ui';
interface ClassAnalyticsProps {
    userClasses: string[];
    students: Studente[];
    evaluations: Valutazione[];
    onClose: () => void;
}

const ClassAnalytics: React.FC<ClassAnalyticsProps> = ({ userClasses, students, evaluations, onClose }) => {
  const classPerformanceData = useMemo(() => {
        return userClasses.map(className => {
            const classStudents = students.filter(s => s.classe === className);
            if (classStudents.length === 0) return { label: className, value: 0 };

            const studentAverages = classStudents.map(s => {
                const sEvals = evaluations.filter(e => e.studenteId === s.id);
                const { grade } = calculatePerformance(s.id, 'Complessivo', sEvals);
                return grade ? parseFloat(grade) : null;
            }).filter((v): v is number => v !== null);

            const classAverage = studentAverages.length > 0 
                ? studentAverages.reduce((a, b) => a + b, 0) / studentAverages.length 
                : 0;

            return { label: className, value: parseFloat(classAverage.toFixed(1)) };
        }).filter(d => d.value > 0);
    }, [userClasses, students, evaluations]);

    const globalStats = useMemo(() => {
        const totalStudents = students.length;
        const studentsWithInsufficient = students.filter(s => {
            const { grade } = calculatePerformance(s.id, 'Complessivo', evaluations.filter(e => e.studenteId === s.id));
            return grade && parseFloat(grade) < 6;
        }).length;

        return [
            { label: 'Sufficienti', value: totalStudents - studentsWithInsufficient, color: 'var(--md-sys-color-primary)' },
            { label: 'Insufficienti', value: studentsWithInsufficient, color: 'var(--md-sys-color-error)' }
        ];
     
    }, [students, evaluations]);

    return (
        <M3Dialog
            title="Analisi Comparata Classi"
            onClose={onClose}
            maxWidth="xl"
        >
            <DialogContent sx={{gap: 'var(--md-sys-spacing-6)'}}>
                <div  style={{display: "grid", gridTemplateColumns: "var(--md-sys-grid-fr-1)", gap: 'var(--md-sys-spacing-6)'}}>
                    <div style={{ backgroundColor: 'var(--md-sys-color-surface-container-low)', borderRadius: 'var(--md-sys-shape-corner-large)' , padding: 'var(--md-sys-spacing-6)', border: "var(--md-sys-border-width-thin) solid var(--md-sys-color-outline)"}}>
                        <Typography component="h3" variant="h5" sx={{ color: 'var(--md-sys-color-on-primary)' , fontSize: 'var(--md-sys-typescale-headline-small-font-size)', fontWeight: "var(--md-sys-typescale-weight-bold)", marginBottom: 'var(--md-sys-spacing-8)'}}>Media Voti per Classe</Typography>
                        <div style={{
  display: 'flex',
  justifyContent: 'center'
}}>
                            {classPerformanceData.length > 0 ? (
                                <BarChart data={classPerformanceData} color="var(--md-sys-color-tertiary)" />
                            ) : (
                                <Typography component="p" variant="body1" sx={{ color: 'var(--md-sys-color-on-surface-variant)' , padding: 'var(--md-sys-spacing-8)'}}>Dati insufficienti per generare il grafico.</Typography>
                            )}
                        </div>
                        <Typography component="p" variant="body2" sx={{ color: 'var(--md-sys-color-on-surface-variant)' , fontSize: 'var(--md-sys-typescale-body-small-font-size)', marginTop: 'var(--md-sys-spacing-4)', textAlign: "center"}}>
                            Confronto della media aritmetica dei voti di tutti gli studenti per ogni classe.
                        </Typography>
                    </div>

                    <div style={{ backgroundColor: 'var(--md-sys-color-surface-container-low)', borderRadius: 'var(--md-sys-shape-corner-large)' , padding: 'var(--md-sys-spacing-6)', border: "var(--md-sys-border-width-thin) solid var(--md-sys-color-outline)", display: "flex", flexDirection: "column", alignItems: "center"}}>
                        <Typography component="h3" variant="h5" sx={{ color: 'var(--md-sys-color-on-primary)' , fontSize: 'var(--md-sys-typescale-headline-small-font-size)', fontWeight: "var(--md-sys-typescale-weight-bold)", marginBottom: 'var(--md-sys-spacing-8)'}}>Situazione Globale</Typography>
                        <DonutChart data={globalStats} />
                        <Typography component="p" variant="body2" sx={{ color: 'var(--md-sys-color-on-surface-variant)' , fontSize: 'var(--md-sys-typescale-body-small-font-size)', marginTop: 'var(--md-sys-spacing-4)', textAlign: "center"}}>
                            Proporzione di studenti con media sufficiente vs insufficiente su tutte le classi.
                        </Typography>
                    </div>
                </div>
                
                <div style={{ backgroundColor: 'var(--md-sys-color-surface-container-low)', borderRadius: 'var(--md-sys-shape-corner-large)' , padding: 'var(--md-sys-spacing-6)', border: "var(--md-sys-border-width-thin) solid var(--md-sys-color-outline)"}}>
                     <Typography component="h3" variant="h5" sx={{ color: 'var(--md-sys-color-on-primary)' , fontSize: 'var(--md-sys-typescale-headline-small-font-size)', fontWeight: "var(--md-sys-typescale-weight-bold)", marginBottom: 'var(--md-sys-spacing-8)'}}>Dettaglio Numerico</Typography>
                     <div style={{ overflowX: "auto" }}>
                         <table  style={{ width: "var(--md-sys-percent-full)", textAlign: "left" }}>
                             <thead>
                                 <tr  style={{borderBottom: "var(--md-sys-border-width-thin) solid var(--md-sys-color-outline)"}}>
                                     <th style={{ color: 'var(--md-sys-color-on-surface-variant)' , paddingLeft: 'var(--md-sys-spacing-4)', paddingRight: 'var(--md-sys-spacing-4)', fontSize: 'var(--md-sys-typescale-body-medium-font-size)', fontWeight: "var(--md-sys-typescale-weight-bold)"}}>Classe</th>
                                     <th style={{ color: 'var(--md-sys-color-on-surface-variant)' , paddingLeft: 'var(--md-sys-spacing-4)', paddingRight: 'var(--md-sys-spacing-4)', fontSize: 'var(--md-sys-typescale-body-medium-font-size)', fontWeight: "var(--md-sys-typescale-weight-bold)"}}>Studenti</th>
                                     <th style={{ color: 'var(--md-sys-color-on-surface-variant)' , paddingLeft: 'var(--md-sys-spacing-4)', paddingRight: 'var(--md-sys-spacing-4)', fontSize: 'var(--md-sys-typescale-body-medium-font-size)', fontWeight: "var(--md-sys-typescale-weight-bold)"}}>Media Classe</th>
                                     <th style={{ color: 'var(--md-sys-color-on-surface-variant)' , paddingLeft: 'var(--md-sys-spacing-4)', paddingRight: 'var(--md-sys-spacing-4)', fontSize: 'var(--md-sys-typescale-body-medium-font-size)', fontWeight: "var(--md-sys-typescale-weight-bold)"}}>Verifiche Svolte</th>
                                 </tr>
                             </thead>
                             <tbody>
                                 {userClasses.map(c => {
                                     const sCount = students.filter(s => s.classe === c).length;
                                     const avg = classPerformanceData.find(d => d.label === c)?.value || '-';
                                     const evalsCount = evaluations.filter(e => students.find(s => s.id === e.studenteId)?.classe === c).length;
                                     return (
                                         <tr key={c}  style={{borderBottom: "var(--md-sys-border-width-thin) solid var(--md-sys-color-outline)", transition: "color var(--md-sys-motion-duration-medium)"}}>
                                             <td style={{ color: 'var(--md-sys-color-on-primary)' , paddingLeft: 'var(--md-sys-spacing-4)', paddingRight: 'var(--md-sys-spacing-4)', fontWeight: "var(--md-sys-typescale-weight-bold)"}}>{c}</td>
                                             <td style={{ color: 'var(--md-sys-color-on-surface-variant)' , paddingLeft: 'var(--md-sys-spacing-4)', paddingRight: 'var(--md-sys-spacing-4)'}}>{sCount}</td>
                                             <td style={{ color: 'var(--md-sys-color-on-surface-variant)' , paddingLeft: 'var(--md-sys-spacing-4)', paddingRight: 'var(--md-sys-spacing-4)'}}>{avg}</td>
                                             <td style={{ color: 'var(--md-sys-color-on-surface-variant)' , paddingLeft: 'var(--md-sys-spacing-4)', paddingRight: 'var(--md-sys-spacing-4)'}}>{evalsCount}</td>
                                         </tr>
                                     )
                                 })}
                             </tbody>
                         </table>
                     </div>
                </div>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} variant="contained">Chiudi</Button>
            </DialogActions>
        </M3Dialog>
    );
};

export default ClassAnalytics;

