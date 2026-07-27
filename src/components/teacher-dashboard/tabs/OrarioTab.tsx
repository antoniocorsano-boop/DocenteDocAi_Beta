/**
 * OrarioTab.tsx — Visualizza lezioni per classe raggruppate per giorno.
 * Usa LessonCard presentazionale. Dati da useAcademicStore.
 * MD3 Gold Compliant.
 */
import React, { useMemo } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import M3Surface from '../../ui/M3Surface';
import LessonCard from '../LessonCard';
import { useAcademicStore } from '../../../stores/useAcademicStore';
import type { Lezione } from '../../../types';

function tok(name: string) {
  return `var(--md-sys-color-${name})`;
}

const GIORNI_ORDER = [
  'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato',
];

interface OrarioTabProps {
  selectedClass: string;
  onLessonClick?: (lesson: Lezione) => void;
}

const OrarioTab: React.FC<OrarioTabProps> = ({ selectedClass, onLessonClick }) => {
  const lessons = useAcademicStore((s) => s.lessons);
  const slots   = useAcademicStore((s) => s.slots);

  // Raccogli le lezioni della classe selezionata raggruppate per giorno
  const grouped = useMemo<Map<string, Lezione[]>>(() => {
    const classLessons = Object.values(lessons).filter(
      (l) => l.classe === selectedClass
    );

    // Primo: usa gli slot per sapere il giorno
    const byDay = new Map<string, Lezione[]>();

    Object.entries(slots).forEach(([slotKey, slot]) => {
      if (slot.classe !== selectedClass) return;
      const lesson = slot.lezioneId ? lessons[slot.lezioneId] : null;
      if (!lesson) {
        // Crea lezione "placeholder" dallo slot
        const placeholder: Lezione = {
          id:          `slot-${slotKey}`,
          classe:      slot.classe ?? selectedClass,
          materia:     slot.materia ?? 'N/D',
          contenuto:   `Ora: ${slot.ora}`,
          svolta:      false,
          tipoLezione: 'Teoria',
        };
        const group = byDay.get(slot.giorno) ?? [];
        group.push(placeholder);
        byDay.set(slot.giorno, group);
      } else {
        const group = byDay.get(slot.giorno) ?? [];
        if (!group.some((l) => l.id === lesson.id)) {
          group.push(lesson);
        }
        byDay.set(slot.giorno, group);
      }
    });

    // Lezioni senza slot associato (hanno una data) — raggruppale per giorno della settimana
    const withDate = classLessons.filter(
      (l) => l.data && !Object.values(slots).some((s) => s.lezioneId === l.id)
    );
    withDate.forEach((l) => {
      if (!l.data) return;
      const d = new Date(l.data);
      const dayNames = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
      const giorno = dayNames[d.getDay()] ?? 'Altro';
      const group = byDay.get(giorno) ?? [];
      if (!group.some((g) => g.id === l.id)) group.push(l);
      byDay.set(giorno, group);
    });

    return byDay;
  }, [lessons, slots, selectedClass]);

  if (grouped.size === 0) {
    return (
      <M3Surface
        elevation={1}
        sx={{
          p:            'var(--md-sys-spacing-6)',
          borderRadius: 'var(--md-sys-shape-corner-large)',
          textAlign:    'center',
        }}
      >
        <Box
          component="span"
          className="material-symbols-outlined"
          aria-hidden="true"
          sx={{ fontSize: 48, color: tok('on-surface-variant'), display: 'block', mb: 2 }}
        >
          event_note
        </Box>
        <Typography variant="titleMedium" sx={{ color: tok('on-surface-variant') }}>
          Nessuna lezione trovata per la classe{' '}
          <strong>{selectedClass || 'selezionata'}</strong>.
        </Typography>
        <Typography variant="bodySmall" sx={{ color: tok('on-surface-variant'), mt: 1 }}>
          Aggiungi lezioni dalla sezione Lezioni o carica i dati demo dall'onboarding.
        </Typography>
      </M3Surface>
    );
  }

  // Ordina i giorni secondo l'ordine settimanale
  const sortedDays = GIORNI_ORDER.filter((g) => grouped.has(g));
  const extraDays  = [...grouped.keys()].filter((g) => !GIORNI_ORDER.includes(g));

  return (
    <Stack spacing={3}>
      {[...sortedDays, ...extraDays].map((giorno) => {
        const dayLessons = grouped.get(giorno) ?? [];
        return (
          <M3Surface
            key={giorno}
            elevation={1}
            component="section"
            aria-label={`Lezioni di ${giorno}`}
            sx={{ borderRadius: 'var(--md-sys-shape-corner-large)', overflow: 'hidden' }}
          >
            {/* Day header */}
            <Box
              sx={{
                px:      'var(--md-sys-spacing-4)',
                py:      'var(--md-sys-spacing-2)',
                bgcolor: tok('secondary-container'),
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--md-sys-spacing-2)',
              }}
            >
              <Box
                component="span"
                className="material-symbols-outlined"
                aria-hidden="true"
                sx={{ fontSize: 18, color: tok('on-secondary-container'), fontVariationSettings: '"FILL" 1' }}
              >
                calendar_today
              </Box>
              <Typography
                variant="titleSmall"
                sx={{
                  color:      tok('on-secondary-container'),
                  fontWeight: 'var(--md-sys-typescale-weight-semibold)',
                }}
              >
                {giorno}
              </Typography>
              <Typography
                variant="labelSmall"
                sx={{ color: tok('on-secondary-container'), ml: 'auto' }}
              >
                {dayLessons.length} {dayLessons.length === 1 ? 'ora' : 'ore'}
              </Typography>
            </Box>

            {/* Cards */}
            <Box
              sx={{
                display:             'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                gap:                 'var(--md-sys-spacing-3)',
                p:                   'var(--md-sys-spacing-3)',
              }}
            >
              {dayLessons.map((lesson) => (
                <LessonCard
                  key={lesson.id}
                  lesson={lesson}
                  onClick={onLessonClick ? () => onLessonClick(lesson) : undefined}
                />
              ))}
            </Box>
          </M3Surface>
        );
      })}
    </Stack>
  );
};

export default OrarioTab;
