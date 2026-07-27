// MD3 Compliant - Block J Migration Complete (4 violations eliminated)

import React, { useState } from 'react';
import { Studente, StudentHistoryRecord } from '../types';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Badge from '@mui/material/Badge';
import { M3Dialog, TextField } from './ui';
import { useUIStore } from '../stores/useUIStore';
interface StudentTransferModalProps {
    student: Studente;
    userClasses: string[];
    onClose: () => void;
    onSave: (student: Studente) => void;
    currentSchoolYear: string;
}

const StudentTransferModal: React.FC<StudentTransferModalProps> = ({ student, userClasses, onClose, onSave, currentSchoolYear }) => {
  const { showToast } = useUIStore(state => ({ showToast: state.actions.showToast }));
  const [mode, setMode] = useState<'change_class' | 'transfer_out'>('change_class');
    const [newClass, setNewClass] = useState(student.classe);
    const [outcome, setOutcome] = useState<'Trasferito' | 'Ritirato'>('Trasferito');

    // We allow user to create a new class on the fly if needed
    const [isCustomClass, setIsCustomClass] = useState(false);
    const [customClass, setCustomClass] = useState('');

    const handleSave = () => {
        const updatedStudent = { ...student };
        const currentDate = new Date().toISOString().split('T')[0];

        if (mode === 'change_class') {
            const targetClass = isCustomClass ? customClass.toUpperCase() : newClass;
            if (!targetClass) {
                showToast('Seleziona o inserisci la nuova classe.', 'error');
                return;
            }

            // Create a history record for the partial year in the old class
            const historyRecord: StudentHistoryRecord = {
                year: currentSchoolYear,
                classe: student.classe,
                averageGrade: '-', // Grade calculation would require props drilling, keep it simple for now or calc if available
                absencesPercentage: 0,
                finalOutcome: 'Trasferito', // Internal transfer
                competencySummary: [{ name: 'Cambio Classe', level: `Passaggio alla ${targetClass} il ${currentDate}` }]
            };

            updatedStudent.classe = targetClass;
            updatedStudent.history = [...(student.history || []), historyRecord];

        } else {
            // Archive student
            const historyRecord: StudentHistoryRecord = {
                year: currentSchoolYear,
                classe: student.classe,
                averageGrade: '-',
                absencesPercentage: 0,
                finalOutcome: outcome,
                competencySummary: [{ name: 'Uscita', level: `Data: ${currentDate}` }]
            };

            updatedStudent.isArchived = true;
            updatedStudent.archiveYear = currentSchoolYear;
            updatedStudent.history = [...(student.history || []), historyRecord];
        }

        onSave(updatedStudent);
        onClose();
    };

    return (
        <M3Dialog
            onClose={onClose}
            title="Mobilità Studente"
            maxWidth="sm"
            buttons={<>
                <Button onClick={onClose} variant="text">Annulla</Button>
                <Button
                    onClick={handleSave}
                    variant="contained"
                    color={mode === 'transfer_out' ? 'error' : 'primary'}
                >
                    {mode === 'change_class' ? 'Sposta Studente' : 'Archivia Studente'}
                </Button>
            </>}
        >
            <Box sx={{ backgroundColor: 'var(--md-sys-color-surface-container-high)', opacity: 'var(--md-sys-state-opacity-tint-moderate)' }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-6)', pt: 'var(--md-sys-spacing-4)', pb: 'var(--md-sys-spacing-4)' }}>
                    <Box sx={{ backgroundColor: 'var(--md-sys-color-secondary-container)', opacity: 'var(--md-sys-state-opacity-tint-faint)', borderRadius: 'var(--md-sys-shape-corner-large)', padding: 'var(--md-sys-spacing-8)', border: 'var(--md-sys-border-width-normal) solid var(--md-sys-color-outline)' }}>
                        <Typography variant="body2" sx={{ color: 'var(--md-sys-color-on-primary)' }}>
                            Gestisci lo spostamento di <strong>{student.cognome} {student.nome}</strong>
                        </Typography>
                    </Box>

                                        <Tabs
                      value={mode}
                      onChange={(_, v: string) => ((id) => setMode(id as 'change_class' | 'transfer_out'))(v)}
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
                            { id: 'change_class', label: 'Cambio Classe' },
                            { id: 'transfer_out', label: 'Trasferimento / Ritiro' }
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

                    {mode === 'change_class' ? (
                        <Box sx={{ backgroundColor: 'var(--md-sys-color-surface-container-low)', borderRadius: 'var(--md-sys-shape-corner-large)', padding: 'var(--md-sys-spacing-8)', border: 'var(--md-sys-border-width-normal) solid var(--md-sys-color-outline)', display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-8)' }}>
                            <Typography variant="h6" sx={{ color: 'var(--md-sys-color-primary)', px: 'var(--md-sys-spacing-4)' }}>Nuova Destinazione</Typography>

                            {!isCustomClass ? (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-8)' }}>
                                                                        <FormControl fullWidth>
                                      <InputLabel id="transfer-classe-label" shrink>Seleziona Classe Esistente</InputLabel>
                                      <Select
                                        labelId="transfer-classe-label"
                                        value={newClass}
                                        label="Seleziona Classe Esistente"
                                        displayEmpty
                                        notched
                                        onChange={(e: SelectChangeEvent) => setNewClass(e.target.value)}
                                      >
                                        {userClasses.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                                      </Select>
                                    </FormControl>
                                    <Button
                                        variant="text"
                                        onClick={() => setIsCustomClass(true)}
                                    >
                                        + Crea Nuova Classe
                                    </Button>
                                </Box>
                            ) : (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-8)' }}>
                                    <TextField
                                        label="Nome Nuova Classe"
                                        value={customClass}
                                        onChange={(e) => setCustomClass(e.target.value)}
                                        placeholder="es. 1A"
                                        fullWidth
                                    />
                                    <Button
                                        variant="text"
                                        onClick={() => setIsCustomClass(false)}
                                    >
                                        Torna a lista esistente
                                    </Button>
                                </Box>
                            )}
                        </Box>
                    ) : (
                        <Box sx={{ backgroundColor: 'var(--md-sys-color-error-container)', opacity: 'var(--md-sys-state-opacity-tint-faint)', borderRadius: 'var(--md-sys-shape-corner-large)', padding: 'var(--md-sys-spacing-8)', border: 'var(--md-sys-border-width-normal) solid var(--md-sys-color-outline)', display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-8)' }}>
                            <Typography variant="h6" sx={{ color: 'var(--md-sys-color-error)', px: 'var(--md-sys-spacing-4)' }}>Motivazione Uscita</Typography>
                                                        <FormControl fullWidth>
                              <InputLabel id="transfer-outcome-label" shrink>Esito</InputLabel>
                              <Select
                                labelId="transfer-outcome-label"
                                value={outcome}
                                label="Esito"
                                displayEmpty
                                notched
                                onChange={(e: SelectChangeEvent) => setOutcome(e.target.value as 'Ritirato' | 'Trasferito')}
                              >
                                <MenuItem value="Trasferito">Trasferito ad altra scuola</MenuItem>
                                <MenuItem value="Ritirato">Ritirato dagli studi</MenuItem>
                              </Select>
                            </FormControl>
                            <Typography variant="body2" sx={{ color: 'var(--md-sys-color-on-surface-variant)', px: 'var(--md-sys-spacing-4)' }}>
                                Lo studente verrà rimosso dall'elenco attivo e spostato nell'archivio storico.
                            </Typography>
                        </Box>
                    )}
                </Box>
            </Box>
        </M3Dialog>
    );
};

export default StudentTransferModal;

