// MD3 Compliant
import React, { useState } from 'react';
import { EventoCalendario, TipoEvento } from '../types';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import { M3Dialog, TextField } from './ui';
interface EventModalProps {
    eventToEdit?: Partial<EventoCalendario>;
    onClose: () => void;
    onSave: (event: EventoCalendario) => void;
    onDelete: (eventId: string) => void;
}

const eventTypes: { value: TipoEvento; label: string; icon: string }[] = [
    { value: 'impegno', label: 'Impegno', icon: 'event' },
    { value: 'scadenza', label: 'Scadenza', icon: 'flag' },
    { value: 'consiglio', label: 'Consiglio', icon: 'groups' },
    { value: 'formazione', label: 'Formazione', icon: 'school' },
];

const ChoiceCard: React.FC<{ icon: string; label: string; onClick: () => void; selected: boolean }> = ({ icon, label, onClick, selected }) => (
  <Card
    component="button"
    type="button"
    onClick={onClick}
    aria-pressed={selected}
    sx={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      p: 4, borderRadius: 'var(--md-sys-shape-corner-extra-large)',
      border: `2px solid ${selected ? 'var(--md-sys-color-primary)' : 'color-mix(in srgb, var(--md-sys-color-outline-variant) 19%, transparent)'}`,
      bgcolor: selected ? 'var(--md-sys-color-primary-container)' : 'color-mix(in srgb, var(--md-sys-color-surface-container) 50%, transparent)',
      color: selected ? 'var(--md-sys-color-on-primary-container)' : 'var(--md-sys-color-on-surface)',
      boxShadow: selected ? 'var(--md-sys-elevation-level4)' : 'none',
      transform: selected ? 'scale(1.05)' : 'scale(1)',
      transition: 'all var(--md-sys-motion-duration-short) var(--md-sys-motion-easing-standard)',
      gap: 2, minWidth: 'var(--md-sys-spacing-16)', cursor: 'pointer',
      '&:hover': { border: `2px solid var(--md-sys-color-outline)`, bgcolor: selected ? 'var(--md-sys-color-primary-container)' : 'var(--md-sys-color-surface-container-high)' },
    }}
  >
    <Box sx={{ width: 'var(--md-sys-spacing-12)', height: 'var(--md-sys-spacing-12)', borderRadius: 'var(--md-sys-shape-corner-medium)', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: selected ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-surface)', color: selected ? 'var(--md-sys-color-on-primary)' : 'var(--md-sys-color-primary)', boxShadow: selected ? 'var(--md-sys-elevation-level2)' : 'none', transition: 'all var(--md-sys-motion-duration-short) var(--md-sys-motion-easing-standard)' }}>
      <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 'var(--icon-size-medium)', userSelect: 'none', fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>{icon}</Box>
    </Box>
    <Box component="span" sx={{ fontSize: 'var(--md-sys-typescale-body-large-font-size)', fontFamily: 'var(--md-sys-typescale-body-small-font-family)' }}>{label}</Box>
  </Card>
);

const EventModal: React.FC<EventModalProps> = ({ eventToEdit, onClose, onSave, onDelete }) => {
  const [event, setEvent] = useState<Partial<EventoCalendario>>({
        data: new Date().toISOString().split('T')[0],
        tipo: 'impegno',
        ...eventToEdit
    });
  const [validationError, setValidationError] = useState('');

    const handleChange = (field: keyof EventoCalendario, value: unknown) => {
        const newEvent = { ...event, [field]: value };
        if (field === 'data' && newEvent.dataFine && newEvent.dataFine < (newEvent.data || '')) {
            newEvent.dataFine = newEvent.data;
        }
        setEvent(newEvent);
    };

    const handleSubmit = (e?: React.FormEvent | React.MouseEvent) => {
        if (e) e.preventDefault();
        if (!event.titolo || !event.data || !event.tipo) {
            setValidationError('Titolo, data e tipo sono obbligatori.');
            return;
        }
        setValidationError('');
        const eventToSave: EventoCalendario = {
            id: event.id || `evt-${Date.now()}`,
            titolo: event.titolo!,
            data: event.data!,
            dataFine: event.dataFine,
            tipo: event.tipo as TipoEvento,
            oraInizio: event.oraInizio,
            oraFine: event.oraFine,
            descrizione: event.descrizione };
        onSave(eventToSave);
    };

    return (
        <M3Dialog
            title={event.id ? 'Modifica Evento' : 'Nuovo Evento'}
            onClose={onClose}
            maxWidth="lg"
            buttons={
                <>
                    {event.id && (
                        <Button onClick={() => onDelete(event.id!)} variant="text" sx={{ fontWeight: 'var(--md-sys-typescale-weight-black)' }}>
                            Elimina
                        </Button>
                    )}
                    <Button onClick={onClose} variant="text">Annulla</Button>
                    <Button onClick={handleSubmit} variant="contained">Salva</Button>
                </>
            }
        >
            <Box component="form" id="event-modal-form" onSubmit={handleSubmit} sx={{ mt: 'var(--md-sys-spacing-8)' }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                    <Typography component="label" sx={{ color: 'var(--md-sys-color-primary)', fontWeight: 'var(--md-sys-typescale-weight-black)', textTransform: 'uppercase', pl: 'var(--md-sys-spacing-4)', pr: 'var(--md-sys-spacing-4)', mb: 'var(--md-sys-spacing-8)', display: 'block' }}>Tipo Evento</Typography>
                    <Box sx={{ display: 'flex', gap: 'var(--md-sys-spacing-6)', overflowX: 'auto' }}>
                        {eventTypes.map(t => (
                            <ChoiceCard
                                key={t.value}
                                icon={t.icon}
                                label={t.label}
                                onClick={() => handleChange('tipo', t.value)}
                                selected={event.tipo === t.value}
                            />
                        ))}
                    </Box>
                </Box>

                <TextField
                    id="event-titolo-input"
                    name="event-titolo"
                    label="Titolo"
                    value={event.titolo || ''}
                    onChange={e => handleChange('titolo', e.target.value)}
                    placeholder="Es. Consiglio di Classe 3A"
                    required
                    autoFocus
                />

                <Box sx={{ display: 'grid', gridTemplateColumns: 'var(--md-sys-grid-fr-1) var(--md-sys-grid-fr-1)', gap: 'var(--md-sys-spacing-8)' }}>
                    <TextField
                        id="event-data-input"
                        name="event-data"
                        label="Data Inizio"
                        type="date"
                        value={event.data || ''}
                        onChange={e => handleChange('data', e.target.value)}
                        required
                    />
                    <TextField
                        id="event-ora-input"
                        name="event-ora"
                        label="Ora Inizio"
                        type="time"
                        value={event.oraInizio || ''}
                        onChange={e => handleChange('oraInizio', e.target.value)}
                    />
                </Box>

                <TextField multiline
                    id="event-desc-textarea"
                    name="event-desc"
                    label="Descrizione / Note"
                    value={event.descrizione || ''}
                    onChange={e => handleChange('descrizione', e.target.value)}
                    rows={3}
                    sx={{ backgroundColor: 'var(--md-sys-color-surface-container-low)' }}
                />
                {validationError && (
                    <Typography variant="body2" sx={{ color: 'var(--md-sys-color-error)', mt: 'var(--md-sys-spacing-2)' }}>
                        {validationError}
                    </Typography>
                )}
            </Box>
        </M3Dialog>
    );
};

export default React.memo(EventModal);

