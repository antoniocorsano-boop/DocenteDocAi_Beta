import React, { useState } from 'react';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Badge from '@mui/material/Badge';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import SettingsGroup from './SettingsGroupAccordion';
import { TextField, InfoCard, M3ConfirmDialog } from '../ui';
import ChipInputList from '../ChipInputList';
import { TimetableSettings, AiSettings } from '../../types';
import { AI_PROFILES, SCHOOL_LEVELS } from '../../constants';
import { generateNextSchoolYear } from '../../utils/schoolUtils';

interface SettingsAISectionProps {
    expanded: boolean;
    onToggle: () => void;
    localSettings: TimetableSettings;
    localAiSettings: AiSettings;
    handleChange: (field: keyof TimetableSettings, value: unknown) => void;
    handleAiProfileChange: (profile: keyof typeof AI_PROFILES) => void;
    showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
    toggleAssociation: (classId: string, subjectId: string) => void;
    updateAssignmentHours: (id: string, hours: number) => void;
    handleBulkAssign: (selectedClasses: string[], selectedSubjects: string[]) => void;
}

export const SettingsAISection: React.FC<SettingsAISectionProps> = ({
    expanded, onToggle, localSettings, localAiSettings, handleChange,
    handleAiProfileChange, showToast, toggleAssociation, updateAssignmentHours, handleBulkAssign
}) => {
    const [newSubjectName, setNewSubjectName] = useState('');
    const [selLevel, setSelLevel] = useState(SCHOOL_LEVELS[2]);
    const [selSpec, setSelSpec] = useState('');
    const [selYears, setSelYears] = useState<string[]>(['1', '2', '3']);
    const [selSections, setSelSections] = useState<string[]>(['A', 'B']);
    const [confirmDialog, setConfirmDialog] = useState<{ message: string; onConfirm: () => void } | null>(null);

    const currentAiProfile = localAiSettings.model === AI_PROFILES.esperto.model ? 'esperto' : 'rapido';

    const handleAddNextYear = () => {
        const nextYear = generateNextSchoolYear(localSettings.annoScolasticoCorrente);
        if (!(localSettings.anniScolastici ?? []).includes(nextYear)) {
            handleChange('anniScolastici', [...(localSettings.anniScolastici ?? []), nextYear]);
            handleChange('annoScolasticoCorrente', nextYear);
            showToast(`Anno ${nextYear} aggiunto e selezionato.`, 'success');
        } else {
            showToast(`Anno ${nextYear} già presente.`, 'info');
        }
    };

    const handleGenerateClasses = () => {
        const newClasses: string[] = [];
        selYears.forEach(y => {
            selSections.forEach(s => {
                const name = `${y}${s}${selSpec ? ' ' + selSpec : ''}`;
                if (!(localSettings.classi ?? []).includes(name)) newClasses.push(name);
            });
        });
        if (newClasses.length > 0) {
            handleChange('classi', [...(localSettings.classi ?? []), ...newClasses]);
            showToast(`${newClasses.length} classi generate con successo!`, 'success');
        } else {
            showToast('Nessuna nuova classe da generare.', 'info');
        }
    };

    const handleAddSubject = () => {
        if (!newSubjectName.trim()) return;
        if ((localSettings.disciplines ?? []).includes(newSubjectName.trim())) {
            showToast('Materia già presente', 'info');
            return;
        }
        handleChange('disciplines', [...(localSettings.disciplines ?? []), newSubjectName.trim()]);
        setNewSubjectName('');
    };

    return (
        <SettingsGroup
            id="ai_didattica"
            title="AI & Didattica"
            subtitle="Cervello AI e cattedra"
            icon="psychology"
            variant="secondary"
            expanded={expanded}
            onToggle={onToggle}
        >
            <Stack spacing={2}>
                {/* MODELLO AI */}
                <Box sx={{ p: 2, bgcolor: 'var(--md-sys-color-surface-container)', borderRadius: 'var(--md-sys-shape-corner-large)', border: '1px solid', borderColor: 'var(--md-sys-color-outline-variant)' }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                        <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 'var(--md-sys-typescale-body-large-font-size)', color: 'var(--md-sys-color-primary)' }}>smart_toy</Box>
                        <Typography variant="overline" sx={{ color: 'var(--md-sys-color-primary)', fontWeight: 'var(--md-sys-typescale-weight-bold)', lineHeight: 1.5 }}>Modello Intelligenza</Typography>
                    </Stack>
                    <Tabs
                        value={currentAiProfile}
                        onChange={(_, v: string) => handleAiProfileChange(v as keyof typeof AI_PROFILES)}
                        indicatorColor="primary"
                        textColor="primary"
                        aria-label="Profilo AI"
                        sx={{ bgcolor: 'var(--md-sys-color-surface-container-low)', borderRadius: 'var(--md-sys-shape-corner-full)', border: '1px solid var(--md-sys-color-outline-variant)', minHeight: 'auto', p: 0.5 }}
                    >
                        {(Object.keys(AI_PROFILES) as Array<keyof typeof AI_PROFILES>).map(key => (
                            <Tab
                                key={key}
                                value={key}
                                id={`tab-${key}`}
                                aria-controls={`panel-${key}`}
                                data-testid={`tab-${key}`}
                                label={
                                    <Badge color="error">
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            {AI_PROFILES[key].icon && <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 'var(--md-sys-typescale-label-large-font-size)' }}>{AI_PROFILES[key].icon}</Box>}
                                            {AI_PROFILES[key].label}
                                        </Box>
                                    </Badge>
                                }
                                sx={{ borderRadius: 'var(--md-sys-shape-corner-full)', minHeight: 'auto', py: 1, px: 2, textTransform: 'uppercase', fontSize: 'var(--md-sys-typescale-label-small-font-size)' }}
                            />
                        ))}
                    </Tabs>
                    <Box sx={{
                        display: 'flex', alignItems: 'flex-start', gap: 'var(--md-sys-spacing-3)',
                        p: 'var(--md-sys-spacing-6)',
                        bgcolor: currentAiProfile === 'esperto' ? 'var(--md-sys-color-secondary-container)' : 'var(--md-sys-color-primary-container)',
                        borderRadius: 'var(--md-sys-shape-corner-medium)',
                        border: `var(--md-sys-border-width-thin) solid ${currentAiProfile === 'esperto' ? 'var(--md-sys-color-secondary)' : 'var(--md-sys-color-primary)'}`
                    }}>
                        <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 'var(--md-sys-typescale-body-large-font-size)', color: currentAiProfile === 'esperto' ? 'var(--md-sys-color-on-secondary-container)' : 'var(--md-sys-color-on-primary-container)', marginTop: 'var(--md-sys-spacing-4)' }}>info</Box>
                        <Typography variant="body2" sx={{ color: currentAiProfile === 'esperto' ? 'var(--md-sys-color-on-secondary-container)' : 'var(--md-sys-color-on-primary-container)', margin: 0 }}>
                            {AI_PROFILES[currentAiProfile as keyof typeof AI_PROFILES]?.description}
                        </Typography>
                    </Box>
                </Box>

                {/* ANNO SCOLASTICO */}
                <Box sx={{ p: 2, bgcolor: 'var(--md-sys-color-surface-container)', borderRadius: 'var(--md-sys-shape-corner-large)', border: '1px solid', borderColor: 'var(--md-sys-color-outline-variant)' }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                        <Stack direction="row" spacing={1} alignItems="center">
                            <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 'var(--md-sys-typescale-body-large-font-size)', color: 'var(--md-sys-color-primary)' }}>calendar_month</Box>
                            <Typography variant="overline" sx={{ color: 'var(--md-sys-color-on-surface)', fontWeight: 'var(--md-sys-typescale-weight-bold)', lineHeight: 1.5 }}>Anno Scolastico</Typography>
                        </Stack>
                        <Button onClick={handleAddNextYear} variant="outlined" size="small" startIcon={<Box component="span" className="material-symbols-outlined" aria-hidden="true">add_circle</Box>}>
                            Aggiungi anno
                        </Button>
                    </Stack>
                    <Stack spacing={2}>
                        <FormControl size="small" fullWidth>
                            <InputLabel id="select-anno-corrente-label" htmlFor="select-anno-corrente">Anno Corrente</InputLabel>
                            <Select labelId="select-anno-corrente-label" inputProps={{ id: 'select-anno-corrente', name: 'annoScolasticoCorrente' }} label="Anno Corrente" value={localSettings.annoScolasticoCorrente} onChange={e => handleChange('annoScolasticoCorrente', e.target.value as string)}>
                                {(localSettings.anniScolastici ?? []).map(year => <MenuItem key={year} value={year}>{year}</MenuItem>)}
                            </Select>
                        </FormControl>
                        <ChipInputList
                            label="Storico Anni"
                            items={localSettings.anniScolastici}
                            onAdd={(item: string) => handleChange('anniScolastici', [...localSettings.anniScolastici, item])}
                            onRemove={(idx: number) => handleChange('anniScolastici', localSettings.anniScolastici.filter((_, i: number) => i !== idx))}
                            placeholder="Es: 2025/2026"
                            icon="history"
                        />
                    </Stack>
                </Box>

                {/* CONFIGURAZIONE ORARIO GIORNALIERO */}
                <Box sx={{ p: 2, bgcolor: 'var(--md-sys-color-surface-container)', borderRadius: 'var(--md-sys-shape-corner-large)', border: '1px solid', borderColor: 'var(--md-sys-color-outline-variant)' }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                        <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 'var(--md-sys-typescale-body-large-font-size)', color: 'var(--md-sys-color-tertiary)' }}>schedule</Box>
                        <Typography variant="overline" sx={{ color: 'var(--md-sys-color-on-surface)', fontWeight: 'var(--md-sys-typescale-weight-bold)', lineHeight: 1.5 }}>Configurazione Orario</Typography>
                    </Stack>
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'var(--md-sys-grid-fr-1) var(--md-sys-grid-fr-1)', gap: 2 }}>
                        <FormControl size="small" fullWidth>
                            <InputLabel id="select-ore-giornaliere-label" htmlFor="select-ore-giornaliere">Ore giornaliere</InputLabel>
                            <Select
                                labelId="select-ore-giornaliere-label"
                                inputProps={{ id: 'select-ore-giornaliere', name: 'oreGiornaliere' }}
                                label="Ore giornaliere"
                                value={localSettings.oreGiornaliere ?? 6}
                                onChange={e => {
                                    const ore = Number(e.target.value);
                                    const startH = parseInt((localSettings.orarioInizio ?? '08:00').split(':')[0], 10);
                                    const startM = parseInt((localSettings.orarioInizio ?? '08:00').split(':')[1], 10);
                                    const slots = Array.from({ length: ore }, (_, i) => {
                                        const total = startH * 60 + startM + i * 60;
                                        const h = Math.floor(total / 60).toString().padStart(2, '0');
                                        const m = (total % 60).toString().padStart(2, '0');
                                        return `${h}:${m}`;
                                    });
                                    handleChange('oreGiornaliere', ore);
                                    handleChange('timeSlots', slots);
                                }}
                            >
                                {[4, 5, 6, 7, 8, 9, 10].map(n => (
                                    <MenuItem key={n} value={n}>{n} ore</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <FormControl size="small" fullWidth>
                            <InputLabel id="select-inizio-lezioni-label" htmlFor="select-inizio-lezioni">Inizio lezioni</InputLabel>
                            <Select
                                labelId="select-inizio-lezioni-label"
                                inputProps={{ id: 'select-inizio-lezioni', name: 'orarioInizio' }}
                                label="Inizio lezioni"
                                value={localSettings.orarioInizio ?? '08:00'}
                                onChange={e => {
                                    const start = e.target.value as string;
                                    const ore = localSettings.oreGiornaliere ?? 6;
                                    const [sh, sm] = start.split(':').map(Number);
                                    const slots = Array.from({ length: ore }, (_, i) => {
                                        const total = sh * 60 + sm + i * 60;
                                        const h = Math.floor(total / 60).toString().padStart(2, '0');
                                        const m = (total % 60).toString().padStart(2, '0');
                                        return `${h}:${m}`;
                                    });
                                    handleChange('orarioInizio', start);
                                    handleChange('timeSlots', slots);
                                }}
                            >
                                {['07:00', '07:30', '08:00', '08:30', '09:00'].map(t => (
                                    <MenuItem key={t} value={t}>{t}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>
                    {(localSettings.timeSlots ?? []).length > 0 && (
                        <Box sx={{ mt: 2, p: 1.5, bgcolor: 'var(--md-sys-color-surface-container-low)', borderRadius: 'var(--md-sys-shape-corner-medium)', border: '1px solid', borderColor: 'var(--md-sys-color-outline-variant)', display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {(localSettings.timeSlots ?? []).map(slot => (
                                <Box key={slot} sx={{ px: 1.5, py: 0.5, bgcolor: 'var(--md-sys-color-tertiary-container)', color: 'var(--md-sys-color-on-tertiary-container)', borderRadius: 'var(--md-sys-shape-corner-full)', fontSize: 'var(--md-sys-typescale-label-small-font-size)', fontWeight: 'var(--md-sys-typescale-weight-medium)' }}>
                                    {slot}
                                </Box>
                            ))}
                        </Box>
                    )}
                </Box>

                {/* GESTIONE CATTEDRA */}
                <Box sx={{ p: 2, bgcolor: 'var(--md-sys-color-surface-container)', borderRadius: 'var(--md-sys-shape-corner-large)', border: '1px solid', borderColor: 'var(--md-sys-color-outline-variant)' }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                        <Stack direction="row" spacing={1} alignItems="center">
                            <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 'var(--md-sys-typescale-body-large-font-size)', color: 'var(--md-sys-color-secondary)' }}>school</Box>
                            <Typography variant="overline" sx={{ color: 'var(--md-sys-color-on-surface)', fontWeight: 'var(--md-sys-typescale-weight-bold)', lineHeight: 1.5 }}>Gestione Cattedra</Typography>
                        </Stack>
                        <Button onClick={() => setConfirmDialog({ message: 'Sei sicuro di voler svuotare tutta la cattedra?', onConfirm: () => handleChange('teachingAssignments', []) })} variant="outlined">
                            Svuota Tutto
                        </Button>
                    </Stack>

                    {/* FORMAZIONE CLASSI STRUTTURATA */}
                    <Box sx={{ mt: 2, p: 2, bgcolor: 'var(--md-sys-color-surface-container)', borderRadius: 'var(--md-sys-shape-corner-large)', border: '1px solid', borderColor: 'var(--md-sys-color-outline-variant)' }}>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                            <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 'var(--md-sys-typescale-body-large-font-size)', color: 'var(--md-sys-color-primary)' }}>account_tree</Box>
                            <Typography variant="overline" sx={{ color: 'var(--md-sys-color-primary)', fontWeight: 'var(--md-sys-typescale-weight-bold)', lineHeight: 1.5 }}>Formazione Classi Strutturata</Typography>
                        </Stack>
                        <Box sx={{ display: 'grid', gridTemplateColumns: 'var(--md-sys-grid-fr-1) var(--md-sys-grid-fr-1)', gap: 2, mb: 2 }}>
                            <FormControl size="small" fullWidth>
                                <InputLabel id="select-ordinamento-label" htmlFor="select-ordinamento">Ordinamento Scolastico</InputLabel>
                                <Select labelId="select-ordinamento-label" inputProps={{ id: 'select-ordinamento', name: 'ordinamentoScolastico' }} label="Ordinamento Scolastico" value={selLevel} onChange={e => setSelLevel(e.target.value as string)}>
                                    {SCHOOL_LEVELS.map(l => <MenuItem key={l} value={l}>{l}</MenuItem>)}
                                </Select>
                            </FormControl>
                            <TextField id="settings-indirizzo" name="indirizzo" label="Indirizzo / Specializzazione" value={selSpec} onChange={e => setSelSpec(e.target.value)} placeholder="Es: Scientifico, CAT, Musicale..." />
                        </Box>
                        <Box sx={{ display: 'grid', gridTemplateColumns: 'var(--md-sys-grid-fr-1) var(--md-sys-grid-fr-1)', gap: 2, mb: 2 }}>
                            <Stack spacing={1}>
                                <Typography variant="body2" sx={{ color: 'var(--md-sys-color-on-surface)', fontWeight: 'var(--md-sys-typescale-weight-medium)' }}>Livelli / Anni</Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                    {['1', '2', '3', '4', '5'].map(y => (
                                        <Button key={y} variant={selYears.includes(y) ? 'contained' : 'outlined'} size="small" onClick={() => setSelYears(prev => prev.includes(y) ? prev.filter(i => i !== y) : [...prev, y])} sx={{ minWidth: 44 }}>
                                            {y}° Anno
                                        </Button>
                                    ))}
                                </Box>
                            </Stack>
                            <Stack spacing={1}>
                                <Typography variant="body2" sx={{ color: 'var(--md-sys-color-on-surface)', fontWeight: 'var(--md-sys-typescale-weight-medium)' }}>Sezioni</Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                    {['A', 'B', 'C', 'D', 'E', 'F'].map(s => (
                                        <Button key={s} variant={selSections.includes(s) ? 'contained' : 'outlined'} size="small" onClick={() => setSelSections(prev => prev.includes(s) ? prev.filter(i => i !== s) : [...prev, s])} sx={{ minWidth: 44 }}>
                                            {s}
                                        </Button>
                                    ))}
                                </Box>
                            </Stack>
                        </Box>
                        <Button onClick={handleGenerateClasses} variant="contained" disabled={selYears.length === 0 || selSections.length === 0} startIcon={<Box component="span" className="material-symbols-outlined" aria-hidden="true">auto_awesome</Box>}>
                            Genera Combinazioni Classi
                        </Button>
                    </Box>

                    {/* INPUT RAPIDI MATERIE */}
                    <Box sx={{ mt: 2, p: 2, bgcolor: 'var(--md-sys-color-surface-container)', borderRadius: 'var(--md-sys-shape-corner-large)', border: '1px solid', borderColor: 'var(--md-sys-color-outline-variant)' }}>
                        <Stack direction="row" spacing={2} alignItems="flex-end">
                            <Box sx={{ flex: 1 }}>
                                <TextField
                                    id="settings-materia-singola"
                                    name="materiaSingola"
                                    label="Materia Singola"
                                    placeholder="Es: Italiano"
                                    value={newSubjectName}
                                    onChange={e => setNewSubjectName(e.target.value)}
                                    onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleAddSubject()}
                                />
                            </Box>
                            <Button onClick={handleAddSubject} variant="contained" startIcon={<Box component="span" className="material-symbols-outlined" aria-hidden="true">add</Box>}>
                                Aggiungi
                            </Button>
                        </Stack>
                    </Box>

                    {/* MATRICE INTERATTIVA */}
                    <Box sx={{ mt: 2, p: 2, bgcolor: 'var(--md-sys-color-surface-container)', borderRadius: 'var(--md-sys-shape-corner-large)', border: '1px solid', borderColor: 'var(--md-sys-color-outline-variant)', overflowX: 'auto' }}>
                        <TableContainer component={Box}>
                            <Table sx={{ width: '100%' }}>
                                <TableHead>
                                    <TableRow sx={{ backgroundColor: 'var(--md-sys-color-surface-container-high)' }}>
                                        <TableCell component="th" scope="col" sx={{ padding: `var(--md-sys-spacing-3) var(--md-sys-spacing-4)`, textAlign: 'left', fontWeight: 'var(--md-sys-typescale-weight-semibold)', color: 'var(--md-sys-color-on-surface)', borderBottom: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline-variant)', fontSize: 'var(--md-sys-typescale-body-large-font-size)' }}>Materia / Classe</TableCell>
                                        {(localSettings.classi ?? []).map(cls => (
                                            <TableCell component="th" scope="col" key={cls} sx={{ padding: `var(--md-sys-spacing-3) var(--md-sys-spacing-4)`, textAlign: 'center', fontWeight: 'var(--md-sys-typescale-weight-semibold)', color: 'var(--md-sys-color-on-surface)', borderBottom: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline-variant)', borderLeft: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline-variant)', fontSize: 'var(--md-sys-typescale-body-large-font-size)', position: 'relative' }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--md-sys-spacing-4)' }}>
                                                    <span>{cls}</span>
                                                    <IconButton size="small" onClick={() => handleChange('classi', localSettings.classi.filter(c => c !== cls))} aria-label={`Rimuovi classe ${cls}`} sx={{ color: 'var(--md-sys-color-error)', p: 'var(--md-sys-spacing-1)' }}>
                                                        <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 'var(--md-sys-typescale-body-large-font-size)' }}>close</Box>
                                                    </IconButton>
                                                </Box>
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {(localSettings.disciplines ?? []).map(subj => (
                                        <TableRow key={subj} sx={{ borderBottom: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline-variant)' }}>
                                            <TableCell sx={{ padding: `var(--md-sys-spacing-3) var(--md-sys-spacing-4)`, backgroundColor: 'var(--md-sys-color-surface-container-high)', borderRight: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline-variant)' }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--md-sys-spacing-4)' }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-4)', flex: 1 }}>
                                                        <Typography component="span" variant="body2" sx={{ fontWeight: 'var(--md-sys-typescale-weight-medium)', color: 'var(--md-sys-color-on-surface)' }}>{subj}</Typography>
                                                        <Button onClick={() => handleBulkAssign(localSettings.classi, [subj])} variant="outlined" size="small">Associa a tutte</Button>
                                                    </Box>
                                                    <IconButton size="small" onClick={() => handleChange('disciplines', localSettings.disciplines.filter(s => s !== subj))} aria-label={`Rimuovi materia ${subj}`} sx={{ color: 'var(--md-sys-color-error)', p: 'var(--md-sys-spacing-4)', borderRadius: 'var(--md-sys-shape-corner-small)' }}>
                                                        <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 'var(--md-sys-typescale-body-large-font-size)' }}>delete</Box>
                                                    </IconButton>
                                                </Box>
                                            </TableCell>
                                            {(localSettings.classi ?? []).map(cls => {
                                                const assignment = localSettings.teachingAssignments.find(a => a.classId === cls && a.subjectId === subj);
                                                return (
                                                    <TableCell key={`${subj}-${cls}`} sx={{ padding: 'var(--md-sys-spacing-4)', textAlign: 'center', borderLeft: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline-variant)', cursor: 'pointer' }}>
                                                        <Box
                                                            onClick={() => toggleAssociation(cls, subj)}
                                                            sx={{
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                p: 'var(--md-sys-spacing-3)', borderRadius: 'var(--md-sys-shape-corner-medium)',
                                                                bgcolor: assignment ? 'var(--md-sys-color-primary-container)' : 'var(--md-sys-color-surface-container)',
                                                                border: `var(--md-sys-border-width-thin) solid ${assignment ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-outline-variant)'}`,
                                                                transition: 'opacity, transform, background-color, color, border-color, box-shadow var(--md-sys-motion-duration-short) var(--md-sys-motion-easing-standard)',
                                                                minHeight: 'var(--md-sys-spacing-4)', cursor: 'pointer',
                                                            }}
                                                        >
                                                            {assignment ? (
                                                                <>
                                                                    <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ color: 'var(--md-sys-color-primary)', fontSize: 'var(--md-sys-typescale-body-large-font-size)', marginRight: 'var(--md-sys-spacing-4)' }}>check_circle</Box>
                                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-4)' }} onClick={e => e.stopPropagation()}>
                                                                        <input
                                                                            type="number"
                                                                            id={`hours-${cls}-${subj}`}
                                                                            name="hoursPerWeek"
                                                                            aria-label={`Ore settimanali ${subj} - ${cls}`}
                                                                            value={assignment.hoursPerWeek}
                                                                            onChange={e => updateAssignmentHours(assignment.id ?? `${assignment.classId}-${subj}`, parseInt(e.target.value) || 1)}
                                                                            style={{ width: '44px', padding: 'var(--md-sys-spacing-1)', border: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline)', borderRadius: 'var(--md-sys-shape-corner-small)', backgroundColor: 'var(--md-sys-color-surface)', color: 'var(--md-sys-color-on-surface)', fontSize: 'var(--md-sys-typescale-body-large-font-size)', textAlign: 'center' }}
                                                                        />
                                                                        <Box component="span" sx={{ fontSize: 'var(--md-sys-typescale-body-large-font-size)', color: 'var(--md-sys-color-on-surface-variant)' }}>h</Box>
                                                                    </Box>
                                                                </>
                                                            ) : (
                                                                <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ color: 'var(--md-sys-color-outline-variant)', fontSize: 'var(--md-sys-typescale-body-large-font-size)' }}>add</Box>
                                                            )}
                                                        </Box>
                                                    </TableCell>
                                                );
                                            })}
                                        </TableRow>
                                    ))}
                                    {localSettings.disciplines.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={localSettings.classi.length + 1} sx={{ padding: 'var(--md-sys-spacing-4)', textAlign: 'center', color: 'var(--md-sys-color-on-surface-variant)', fontStyle: 'italic' }}>
                                                Aggiungi una materia per iniziare la configurazione...
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>

                    <InfoCard
                        title="Come funziona"
                        description="Questa matrice è il tuo centro di controllo. Clicca su una cella per associare una materia a una classe. Modifica il numero per impostare le ore settimanali."
                        icon="info"
                        variant="contained"
                    />
                </Box>
            </Stack>
            {confirmDialog && (
                <M3ConfirmDialog
                    title="Conferma"
                    message={confirmDialog.message}
                    onConfirm={() => { confirmDialog.onConfirm(); setConfirmDialog(null); }}
                    onCancel={() => setConfirmDialog(null)}
                    danger={true}
                />
            )}
        </SettingsGroup>
    );
};

export default SettingsAISection;
