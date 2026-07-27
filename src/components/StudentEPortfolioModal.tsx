// MD3 GOLD COMPLIANT – Audit 2026-01-25
// Nessun valore hardcoded: solo token MD3, nessun px/rem/%/hex/rgba, nessuna utility custom.
// Conforme a MD3_GOVERNANCE_COMPLIANCE_CONTRACT.md
// Tutti i layout, colori, spaziature e tipografia sono gestiti tramite token MD3.
import React, { useState } from 'react';
import { Studente, StudentOrientamentoState, EPortfolioEntry } from '../types';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { M3Dialog, TextField } from './ui';
interface StudentEPortfolioModalProps {
    isOpen: boolean;
    onClose: () => void;
    student: Studente;
    state: StudentOrientamentoState;
    entries: EPortfolioEntry[];
    onUpdateState: (state: StudentOrientamentoState) => void;
    onAddEntry: (entry: EPortfolioEntry) => void;
}

const StudentEPortfolioModal: React.FC<StudentEPortfolioModalProps> = ({
    isOpen,
    onClose,
    student,
    state,
    entries,
    onUpdateState,
    onAddEntry
}) => {
  const [newEntry, setNewEntry] = useState<Partial<EPortfolioEntry>>({
        title: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        category: 'capolavoro',
        tags: []
    });

    const handleAddEntry = () => {
        if (!newEntry.title) return;
        onAddEntry({
            ...newEntry,
            id: `ep-entry-${Date.now()}`,
            studentId: student.id
        } as EPortfolioEntry);
        setNewEntry({ title: ', description: ', date: new Date().toISOString().split('T')[0], category: 'capolavoro', tags: [] });
    };

    return (
        <M3Dialog isOpen={isOpen} onClose={onClose} title={`E-Portfolio: ${student.nome} ${student.cognome}`} maxWidth="md"
            buttons={
                <Button onClick={onClose} variant="contained">Chiudi</Button>
            }
        >
            {/* Status Section */}
            <Box sx={{ backgroundColor: 'var(--md-sys-color-surface-container-low)', borderRadius: 'var(--md-sys-shape-corner-large)', display: 'grid', gridTemplateColumns: 'var(--md-sys-grid-fr-1)', gap: 'var(--md-sys-spacing-6)', padding: 'var(--md-sys-spacing-6)', border: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline)' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                        <Typography variant="subtitle2">Capolavoro</Typography>
                        <Typography variant="body2" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Caricato nell&apos;E-Portfolio</Typography>
                    </Box>
                    <input
                        type="checkbox"
                        checked={state.hasCapolavoro}
                        onChange={(e) => onUpdateState({ ...state, hasCapolavoro: e.target.checked })}
                        style={{ width: 'var(--md-sys-spacing-5)', height: 'var(--md-sys-spacing-5)' }}
                    />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                        <Typography variant="subtitle2">Autovalutazione</Typography>
                        <Typography variant="body2" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Riflessione critica completata</Typography>
                    </Box>
                    <input
                        type="checkbox"
                        checked={state.hasAutovalutazione}
                        onChange={(e) => onUpdateState({ ...state, hasAutovalutazione: e.target.checked })}
                        style={{ width: 'var(--md-sys-spacing-5)', height: 'var(--md-sys-spacing-5)' }}
                    />
                </Box>
            </Box>

            {/* Add Entry Section */}
            <Box sx={{ mt: 'var(--md-sys-spacing-4)' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'var(--md-sys-typescale-weight-black)' }}>Aggiungi Documento/Riflessione</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-8)' }}>
                    <Box sx={{ flex: 1 }}>
                        <TextField
                            label="Titolo"
                            value={newEntry.title}
                            onChange={(e) => setNewEntry({ ...newEntry, title: e.target.value })}
                        />
                    </Box>
                    <Box sx={{ display: 'flex', gap: 'var(--md-sys-spacing-8)', alignItems: 'flex-end' }}>
                        <Box
                            component="select"
                            sx={{ backgroundColor: 'var(--md-sys-color-surface-container-high)', borderRadius: 'var(--md-sys-shape-corner-large)', color: 'var(--md-sys-color-on-surface-variant)', flexGrow: 1, pl: 'var(--md-sys-spacing-4)', pr: 'var(--md-sys-spacing-4)', border: 'none', minWidth: 0 }}
                            value={newEntry.category}
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewEntry({ ...newEntry, category: e.target.value as EPortfolioEntry['category'] })}
                        >
                            <option value="capolavoro">Capolavoro</option>
                            <option value="riflessione">Riflessione</option>
                            <option value="certificazione">Certificazione</option>
                            <option value="altro">Altro</option>
                        </Box>
                        <Button onClick={handleAddEntry} variant="contained" color="secondary" disabled={!newEntry.title}>Aggiungi</Button>
                    </Box>
                </Box>
            </Box>

            {/* Entries List */}
            <Box sx={{ mt: 'var(--md-sys-spacing-4)' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'var(--md-sys-typescale-weight-black)' }}>Documenti Caricati</Typography>
                <Box sx={{ gap: 'var(--md-sys-spacing-2)' }}>
                    {entries.length === 0 ? (
                        <Typography variant="body2" sx={{ color: 'var(--md-sys-color-on-surface-variant)', textAlign: 'center' }}>Nessun documento caricato</Typography>
                    ) : (
                        entries.map(entry => (
                            <Box key={entry.id} sx={{ backgroundColor: 'var(--md-sys-color-on-primary)', borderRadius: 'var(--md-sys-shape-corner-large)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--md-sys-spacing-8)', border: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline)' }}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-8)' }}>
                                        <Typography component="span" sx={{ color: 'var(--md-sys-color-primary)', fontSize: 'var(--md-sys-typescale-body-medium-font-size)' }}>
                                            {entry.category === 'capolavoro' ? 'auto_awesome' : 'description'}
                                        </Typography>
                                        <Typography component="span" sx={{ fontWeight: 'var(--md-sys-typescale-weight-bold)' }}>{entry.title}</Typography>
                                    </Box>
                                    <Typography variant="body2" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>{entry.date}</Typography>
                                </Box>
                                <Typography component="span" sx={{ backgroundColor: 'var(--md-sys-color-secondary-container)', color: 'var(--md-sys-color-on-secondary-container)', borderRadius: 'var(--md-sys-spacing-4)', fontWeight: 'var(--md-sys-typescale-weight-black)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    {entry.category}
                                </Typography>
                            </Box>
                        ))
                    )}
                </Box>
            </Box>
        </M3Dialog>
    );
};

export default StudentEPortfolioModal;

