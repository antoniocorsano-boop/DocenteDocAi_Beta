// MD3 Compliant - Block G Migration (5 violations eliminated)
import React, { useState, useEffect } from 'react';
import { Studente } from '../types';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import { M3Dialog, TextField } from './ui';
import { useUIStore } from '../stores/useUIStore';
interface AddStudentModalProps {
    studentToEdit?: Studente;
    userClasses: string[];
    onClose: () => void;
    onSave: (student: Studente) => void;
}

const AddStudentModal: React.FC<AddStudentModalProps> = ({ studentToEdit, userClasses, onClose, onSave }) => {
  const { showToast } = useUIStore(state => ({ showToast: state.actions.showToast }));
  const [formData, setFormData] = useState({
        cognome: '',
        nome: '',
        classe: userClasses[0] || ''
    });

    useEffect(() => {
        if (studentToEdit) {
            setFormData({
                cognome: studentToEdit.cognome,
                nome: studentToEdit.nome,
                classe: studentToEdit.classe });
        }
    }, [studentToEdit]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.cognome.trim() || !formData.nome.trim()) {
            showToast('Compila tutti i campi obbligatori.', 'error');
            return;
        }
        onSave({
            id: studentToEdit?.id || `student-${Date.now()}`,
            ...formData });
    };

    return (
        <M3Dialog
            title={studentToEdit ? 'Modifica Studente' : 'Aggiungi Studente'}
            onClose={onClose}
            maxWidth="md"
            buttons={<>
                <Button onClick={onClose} variant="text">Annulla</Button>
                <Button form="add-student-form" type="submit" variant="contained">Salva</Button>
            </>}
        >
            <Box
                component="form"
                id="add-student-form"
                onSubmit={handleSubmit}
                sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-6)' }}
            >
                <Box sx={{ display: 'grid', gridTemplateColumns: 'var(--md-sys-grid-fr-1)', gap: 'var(--md-sys-spacing-8)' }}>
                    <TextField
                        id="student-cognome-input"
                        name="cognome"
                        label="Cognome"
                        value={formData.cognome}
                        onChange={e => setFormData({ ...formData, cognome: e.target.value })}
                        placeholder="Es. Rossi"
                        required
                    />
                    <TextField
                        id="student-nome-input"
                        name="nome"
                        label="Nome"
                        value={formData.nome}
                        onChange={e => setFormData({ ...formData, nome: e.target.value })}
                        placeholder="Es. Mario"
                        required
                    />
                </Box>
                <FormControl fullWidth>
                  <InputLabel id="student-classe-label" shrink>Classe</InputLabel>
                  <Select
                    labelId="student-classe-label"
                    id="student-classe-select"
                    value={formData.classe}
                    label="Classe"
                    displayEmpty
                    notched
                    required
                    onChange={(e: SelectChangeEvent) => setFormData({ ...formData, classe: e.target.value })}
                    renderValue={(v) => v || <Typography component="span" variant="body1" sx={{ color: 'var(--md-sys-color-on-surface-variant)', opacity: 0.6 }}>Seleziona...</Typography>}
                  >
                    {userClasses.map(c => (
                      <MenuItem key={c} value={c}>{c}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
            </Box>
        </M3Dialog>
    );
};

export default AddStudentModal;

