/**
 * ArtisticConsiliumPanel — UI for the AI Artistica Educativa feature.
 *
 * Allows a teacher to generate creative interdisciplinary activity suggestions
 * by providing context (subject, grade level, UDA title). Uses the
 * ArtisticConsilium service which calls the 'artistic.consilium' AI pipeline.
 *
 * MD3 compliance:
 *  - All containers use M3Surface or Box with MD3 spacing tokens
 *  - Typography uses labelSmall / bodySmall / titleSmall as per MD3 scale
 *  - All interactive elements have aria-label
 *  - No raw <div> for semantic containers
 */

import React, { useState } from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Chip from '@mui/material/Chip';
import PaletteIcon from '@mui/icons-material/Palette';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import TheaterComedyIcon from '@mui/icons-material/TheaterComedy';
import M3Surface from '../ui/M3Surface';
import {
  generateArtisticSuggestions,
} from '../../services/ArtisticConsilium';
import type { ArtisticContext, ArtisticSuggestion } from '../../services/ArtisticConsilium';

// ── Icon + label map ────────────────────────────────────────────────────────

const TYPE_ICONS: Record<ArtisticSuggestion['activityType'], React.ReactElement> = {
  visual: <PaletteIcon fontSize="small" />,
  musical: <MusicNoteIcon fontSize="small" />,
  theatrical: <TheaterComedyIcon fontSize="small" />,
  literary: <MenuBookIcon fontSize="small" />,
  interdisciplinary: <AutoAwesomeIcon fontSize="small" />,
};

const TYPE_LABELS: Record<ArtisticSuggestion['activityType'], string> = {
  visual: 'Visuale',
  musical: 'Musicale',
  theatrical: 'Teatrale',
  literary: 'Letterario',
  interdisciplinary: 'Interdisciplinare',
};

// ── Props ────────────────────────────────────────────────────────────────────

export interface ArtisticConsiliumPanelProps {
  /** Pre-filled subject (materia) — e.g. from the selected UDA */
  defaultSubject?: string;
  /** Pre-filled UDA title — passed from CopilotDocentePanel */
  defaultUdaTitle?: string;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function ArtisticConsiliumPanel({
  defaultSubject = '',
  defaultUdaTitle = '',
}: ArtisticConsiliumPanelProps): JSX.Element {
  const [subject, setSubject] = useState(defaultSubject);
  const [gradeLevel, setGradeLevel] = useState('');
  const [udaTitle, setUdaTitle] = useState(defaultUdaTitle);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ArtisticSuggestion[]>([]);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const ctx: ArtisticContext = {
        subject: subject.trim() || undefined,
        gradeLevel: gradeLevel.trim() || undefined,
        udaTitle: udaTitle.trim() || undefined,
      };
      const suggestions = await generateArtisticSuggestions(ctx);
      setResults(suggestions);
      if (!suggestions.length) {
        setError('Nessuna attività generata. Aggiungi più contesto (materia, livello o UDA) e riprova.');
      }
    } catch {
      setError('Errore nella generazione AI. Verifica la connessione e riprova.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}
      role="region"
      aria-label="AI Artistica Educativa — Consilium"
    >
      {/* Header */}
      <Box>
        <Typography
          component="h3"
          variant="titleMedium"
          sx={{ color: 'var(--md-sys-color-primary)', display: 'flex', alignItems: 'center', gap: 1 }}
        >
          <PaletteIcon aria-hidden fontSize="small" />
          AI Artistica Educativa
        </Typography>
        <Typography variant="bodySmall" color="text.secondary" sx={{ mt: 'var(--md-sys-spacing-1)' }}>
          Genera attività creative e interdisciplinari per arricchire le tue UDA con il Consilium Artistico.
        </Typography>
      </Box>

      {/* Context inputs */}
      <Box sx={{ display: 'flex', gap: 'var(--md-sys-spacing-3)', flexWrap: 'wrap' }}>
        <TextField
          label="Materia"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          size="small"
          sx={{ flex: '1 1 160px' }}
          placeholder="es. Italiano, Arte, Musica"
          aria-label="Materia scolastica"
          disabled={loading}
        />
        <TextField
          label="Livello scolastico"
          value={gradeLevel}
          onChange={(e) => setGradeLevel(e.target.value)}
          size="small"
          sx={{ flex: '1 1 200px' }}
          placeholder="es. Secondaria I grado, biennio"
          aria-label="Livello scolastico"
          disabled={loading}
        />
        <TextField
          label="Titolo UDA (opzionale)"
          value={udaTitle}
          onChange={(e) => setUdaTitle(e.target.value)}
          size="small"
          sx={{ flex: '2 1 240px' }}
          placeholder="es. Il Romanticismo in Europa"
          aria-label="Titolo UDA opzionale"
          disabled={loading}
        />
      </Box>

      <Button
        variant="contained"
        onClick={handleGenerate}
        disabled={loading}
        startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <PaletteIcon />}
        aria-label="Genera attività artistiche con AI"
        sx={{ alignSelf: 'flex-start' }}
      >
        {loading ? 'Generazione in corso…' : 'Genera attività artistiche'}
      </Button>

      {error && (
        <Typography
          variant="bodySmall"
          sx={{ color: 'var(--md-sys-color-error)' }}
          role="alert"
          aria-live="polite"
        >
          {error}
        </Typography>
      )}

      {/* Results */}
      {results.length > 0 && (
        <Box
          sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-3)' }}
          aria-label="Attività artistiche generate"
        >
          <Typography variant="labelSmall" color="text.secondary">
            {results.length} attività suggerita{results.length > 1 ? 'e' : ''}
          </Typography>

          {results.map((s) => (
            <M3Surface
              key={s.id}
              elevation={1}
              sx={{
                p: 'var(--md-sys-spacing-4)',
                borderRadius: 'var(--md-sys-shape-corner-medium)',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--md-sys-spacing-2)' }}>
                <Box
                  sx={{ color: 'var(--md-sys-color-primary)', mt: '2px', flexShrink: 0 }}
                  aria-hidden
                >
                  {TYPE_ICONS[s.activityType]}
                </Box>

                <Box sx={{ flex: 1, minWidth: 0 }}>
                  {/* Title + badges row */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-2)', flexWrap: 'wrap', mb: 'var(--md-sys-spacing-1)' }}>
                    <Typography variant="titleSmall">{s.title}</Typography>
                    <Chip
                      label={TYPE_LABELS[s.activityType]}
                      size="small"
                      variant="outlined"
                      aria-label={`Tipo attività: ${TYPE_LABELS[s.activityType]}`}
                    />
                    <Chip
                      label={`${s.estimatedMinutes} min`}
                      size="small"
                      variant="outlined"
                      aria-label={`Durata: ${s.estimatedMinutes} minuti`}
                    />
                  </Box>

                  {/* Description */}
                  <Typography variant="bodySmall" color="text.secondary" sx={{ mb: 'var(--md-sys-spacing-2)' }}>
                    {s.description}
                  </Typography>

                  {/* Materials */}
                  {s.materials.length > 0 && (
                    <Box>
                      <Typography variant="labelSmall" color="text.secondary">
                        Materiali:
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 'var(--md-sys-spacing-1)', flexWrap: 'wrap', mt: 'var(--md-sys-spacing-1)' }}>
                        {s.materials.map((m) => (
                          <Chip
                            key={m}
                            label={m}
                            size="small"
                            aria-label={`Materiale: ${m}`}
                          />
                        ))}
                      </Box>
                    </Box>
                  )}
                </Box>
              </Box>
            </M3Surface>
          ))}
        </Box>
      )}
    </Box>
  );
}
