/**
 * CopilotPreferencesInline — Accordion UI for customizing suggestion categories.
 *
 * Shows 4 category checkboxes that adjust suggestion priorities (not hard gating).
 * Changes are persisted to TeacherModel.preferences via Zustand store.
 *
 * MD3 compliance:
 *   - Container via M3Surface, no raw <div> for layout
 *   - All text via Typography — no inline fontSize/fontWeight
 *   - All interactive elements have aria-label
 *   - Spacing via MD3 tokens
 */

import React from 'react';
import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import Collapse from '@mui/material/Collapse';
import FormControlLabel from '@mui/material/FormControlLabel';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import M3Surface from '../ui/M3Surface';
import { useTeacherModelStore } from '../../stores/useTeacherModelStore';
import type { TeacherPreferences } from '../../types/teacherModel.types';

interface Category {
  key: keyof TeacherPreferences;
  label: string;
  description: string;
}

const CATEGORIES: Category[] = [
  {
    key: 'acceptsClassManagementSuggestions',
    label: 'Gestione classe',
    description: 'Suggerimenti su studenti, registro e presenze',
  },
  {
    key: 'acceptsLessonDesignSuggestions',
    label: 'Progettazione didattica',
    description: 'Suggerimenti su UDA, pianificazione e materiali',
  },
  {
    key: 'acceptsArtisticSuggestions',
    label: 'Attività artistiche',
    description: 'Attività creative e interdisciplinari dal Consilium',
  },
  {
    key: 'acceptsBookIntegrationSuggestions',
    label: 'Integrazione libri',
    description: 'Suggerimenti su libri di testo e risorse editoriali',
  },
];

const CopilotPreferencesInline: React.FC = () => {
  const preferences = useTeacherModelStore((s) => s.preferences);
  const updatePreferences = useTeacherModelStore((s) => s.updatePreferences);
  const [open, setOpen] = React.useState(false);

  function isChecked(key: keyof TeacherPreferences): boolean {
    const val = preferences[key];
    // Default true for undefined optional booleans
    if (typeof val === 'boolean') return val;
    return true;
  }

  function toggle(key: keyof TeacherPreferences) {
    updatePreferences({ [key]: !isChecked(key) } as Partial<TeacherPreferences>);
  }

  return (
    <M3Surface
      elevation={0}
      sx={{
        borderRadius: 'var(--md-sys-shape-corner-medium)',
        border: '1px solid var(--md-sys-color-outline-variant)',
        overflow: 'hidden',
      }}
    >
      {/* Accordion header */}
      <Box
        component="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="copilot-pref-content"
        aria-label="Personalizza categorie di suggerimenti"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          px: 'var(--md-sys-spacing-4)',
          py: 'var(--md-sys-spacing-3)',
          bgcolor: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--md-sys-color-on-surface)',
          textAlign: 'left',
        }}
      >
        <Box
          sx={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-2)' }}
        >
          <Box
            component="span"
            className="material-symbols-outlined"
            aria-hidden="true"
            sx={{ fontSize: 'var(--md-sys-icon-size-sm)' }}
          >
            tune
          </Box>
          <Typography variant="labelMedium" sx={{ color: 'var(--md-sys-color-on-surface)' }}>
            Personalizza suggerimenti
          </Typography>
        </Box>
        <Box
          component="span"
          className="material-symbols-outlined"
          aria-hidden="true"
          sx={{ fontSize: 'var(--md-sys-icon-size-sm)' }}
        >
          {open ? 'expand_less' : 'expand_more'}
        </Box>
      </Box>

      {/* Collapsible checkbox list */}
      <Collapse in={open} id="copilot-pref-content">
        <Stack
          spacing={0}
          sx={{
            px: 'var(--md-sys-spacing-4)',
            pb: 'var(--md-sys-spacing-3)',
            borderTop: '1px solid var(--md-sys-color-outline-variant)',
          }}
        >
          {CATEGORIES.map((cat) => (
            <FormControlLabel
              key={cat.key}
              control={
                <Checkbox
                  checked={isChecked(cat.key)}
                  onChange={() => toggle(cat.key)}
                  inputProps={{ 'aria-label': cat.label }}
                  size="small"
                />
              }
              label={
                <Box>
                  <Typography
                    variant="bodySmall"
                    sx={{ color: 'var(--md-sys-color-on-surface)' }}
                  >
                    {cat.label}
                  </Typography>
                  <Typography
                    variant="bodySmall"
                    sx={{
                      color: 'var(--md-sys-color-on-surface-variant)',
                      fontSize: 'var(--md-sys-typescale-label-small-font-size)',
                    }}
                  >
                    {cat.description}
                  </Typography>
                </Box>
              }
              sx={{ py: 'var(--md-sys-spacing-2)', m: 0 }}
            />
          ))}
        </Stack>
      </Collapse>
    </M3Surface>
  );
};

export default CopilotPreferencesInline;
