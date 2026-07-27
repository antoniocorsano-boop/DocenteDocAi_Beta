// MD3 Compliant — Consiglio Classe Wizard

import React, { useState, useMemo } from 'react';
import { Studente, Valutazione, TimetableSettings, AiSettings, Report, ValutazioneCompetenza, PeriodoValutazione } from '../types';
import { printCouncilData } from '../utils/printUtils';
import { M3Dialog, InfoCard } from './ui';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

interface ConsiglioClasseWizardProps {
    onClose: () => void;
    userClasses: string[];
    students: Studente[];
    evaluations: Valutazione[];
    competencyEvaluations: ValutazioneCompetenza[];
    settings: TimetableSettings;
    aiSettings: AiSettings;
    onSaveReport: (report: Report) => void;
}

const ConsiglioClasseWizard: React.FC<ConsiglioClasseWizardProps> = (props) => {
  const [step, setStep] = useState<1 | 2>(1);
    const [selectedClass, setSelectedClass] = useState<string>(props.userClasses[0] || '');
    const [periodo, setPeriodo] = useState<PeriodoValutazione>('primo-quadrimestre');
    const [isLoading, _setIsLoading] = useState(false);
    const [loadingMessage, _setLoadingMessage] = useState('');

    const classStudents = useMemo(() => {
        return props.students.filter(s => s.classe === selectedClass);
    }, [selectedClass, props.students]);
    
    const handleGeneratePdf = () => {
        if (!selectedClass) return;
        printCouncilData(
            selectedClass,
            periodo,
            classStudents,
            props.evaluations,
            props.competencyEvaluations,
            props.settings
        );
        props.onClose();
    };

    const renderStep1 = () => (
        <>
            <DialogContent sx={{gap: 'var(--md-sys-spacing-6)'}}>
                <InfoCard 
                    title="Seleziona il contesto" 
                    description="Scegli la classe e il periodo di riferimento per il quale desideri generare il report." 
                    icon="tune"
                    variant="surface"
                    
                />
                
                <FormControl fullWidth>
                  <InputLabel id="council-class-label" shrink>Classe</InputLabel>
                  <Select
                    labelId="council-class-label"
                    id="council-class-select"
                    value={selectedClass}
                    label="Classe"
                    displayEmpty
                    notched
                    onChange={(e: SelectChangeEvent) => setSelectedClass(e.target.value)}
                    renderValue={(v) => v || <Typography component="span" variant="body1" sx={{ color: 'var(--md-sys-color-on-surface-variant)', opacity: 0.6 }}>Seleziona...</Typography>}
                  >
                    {props.userClasses.map(c => (
                      <MenuItem key={c} value={c}>{c}</MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Stack spacing="var(--md-sys-spacing-2)">
                    <Typography sx={{color: "var(--md-sys-color-primary)", fontWeight: "var(--md-sys-typescale-weight-black)", textTransform: "uppercase", px: 'var(--md-sys-spacing-4)'}}>Periodo di Valutazione</Typography>
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
                        ...{ width: 'var(--md-sys-percent-100)' },
                      }}
                    >
                      {([
                            { id: 'primo-quadrimestre', label: 'Primo Quadrimestre (1Q)' },
                            { id: 'secondo-quadrimestre', label: 'Scrutinio Finale (2Q)' }
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
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button variant="text" onClick={props.onClose}>Annulla</Button>
                <Button 
                    variant="contained" 
                    onClick={() => setStep(2)} 
                    disabled={!selectedClass}
                    endIcon={<Box component="span" className="material-symbols-outlined" aria-hidden="true">arrow_forward</Box>}
                >
                    Continua
                </Button>
            </DialogActions>
        </>
    );

    const renderStep2 = () => (
        <>
            <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-6)' }}>
                <Box sx={{ bgcolor: 'color-mix(in srgb, var(--md-sys-color-primary-container) 20%, transparent)', borderRadius: 'var(--md-sys-shape-corner-large)', p: 'var(--md-sys-spacing-5)', border: `var(--md-sys-border-width-thin) solid var(--md-sys-color-outline)`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Stack spacing="var(--md-sys-spacing-4)">
                        <Typography component="p" variant="caption" sx={{fontWeight: "var(--md-sys-typescale-weight-black)", textTransform: "uppercase", letterSpacing: "var(--md-sys-typescale-label-large-tracking)", color: "var(--md-sys-color-primary)"}}>Context Active</Typography>
                        <Typography component="h3" variant="h6" sx={{ color: 'var(--md-sys-color-on-primary-container)', fontWeight: "var(--md-sys-typescale-weight-black)" }}>{selectedClass} • {periodo === 'primo-quadrimestre' ? '1Q' : 'Finale'}</Typography>
                    </Stack>
                    <Button variant="outlined" onClick={() => setStep(1)} sx={{ fontSize: "var(--md-sys-typescale-body-small-font-size)", fontWeight: "var(--md-sys-typescale-weight-bold)", textTransform: "uppercase" }}>Cambia</Button>
                </Box>

                <Stack spacing="var(--md-sys-spacing-3)">
                    <Button variant="outlined" onClick={handleGeneratePdf} fullWidth sx={{ borderRadius: 'var(--md-sys-shape-corner-large)', justifyContent: 'flex-start', textAlign: 'left', p: 'var(--md-sys-spacing-4)', gap: 'var(--md-sys-spacing-4)' }}>
                        <Box component="span" className="material-symbols-outlined" aria-hidden="true">picture_as_pdf</Box>
                        <Stack spacing="var(--md-sys-spacing-1)" alignItems="flex-start">
                            <Typography variant="body1" sx={{ fontWeight: 'var(--md-sys-typescale-weight-bold)' }}>Tabellone Dati (PDF)</Typography>
                            <Typography variant="body2" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Medie, trend e rilevazioni competenze.</Typography>
                        </Stack>
                    </Button>
                </Stack>
                
                <Typography component="p" variant="body1" sx={{ color: 'var(--md-sys-color-on-surface-variant)' , textAlign: "center", paddingLeft: 'var(--md-sys-spacing-4)', paddingRight: 'var(--md-sys-spacing-4)'}}>
                    Il report verrà generato e aperto in una nuova scheda del browser.
                </Typography>
            </DialogContent>
            <DialogActions>
                <Button variant="text" onClick={() => setStep(1)}>Indietro</Button>
            </DialogActions>
        </>
    );
    
    if (isLoading) {
        return (
             <M3Dialog
                 onClose={() => {}}
                 title=""
                 maxWidth="sm"
             >
                <DialogContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                    <Box sx={{ borderRadius: 'var(--md-sys-shape-corner-medium)', width: 'var(--md-sys-spacing-10)', height: 'var(--md-sys-spacing-10)', border: `var(--md-sys-border-width-thick) solid var(--md-sys-color-primary)`, borderTopColor: 'transparent', mb: 'var(--md-sys-spacing-6)', animation: 'spin 0.8s linear infinite', '@keyframes spin': { to: { transform: 'rotate(360deg)' } } }} />
                    <Typography component="p" variant="body1" sx={{fontWeight: "var(--md-sys-typescale-weight-black)", color: "var(--md-sys-color-primary)"}}>{loadingMessage}</Typography>
                </DialogContent>
            </M3Dialog>
        )
    }

    return (
        <M3Dialog
            onClose={props.onClose}
            title="Wizard Report Consiglio"
            maxWidth="xl"
        >
            {step === 1 ? renderStep1() : renderStep2()}
        </M3Dialog>
    );
};

export default ConsiglioClasseWizard;

