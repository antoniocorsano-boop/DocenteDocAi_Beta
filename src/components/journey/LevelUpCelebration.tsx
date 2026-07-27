/**
 * LevelUpCelebration — MD3 Dialog shown when levelUpPending=true.
 *
 * - Auto-closes after 8 seconds
 * - Calls markLevelUpSeen() on close
 * - Lists what's newly available at the new level
 */

import React, { useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import { useTeacherModelStore } from '../../stores/useTeacherModelStore';
import { useJourneyProgress } from '../../hooks/useJourneyProgress';
import type { JourneyLevel } from '../../types/teacherModel.types';

const LEVEL_FEATURES: Record<JourneyLevel, { title: string; features: string[] }> = {
  esploratore: {
    title: 'Benvenuto Esploratore!',
    features: ['Registro lezioni', 'Gestione studenti', 'Valutazioni base'],
  },
  praticante: {
    title: 'Sei diventato Praticante! 🎓',
    features: [
      'Insight di oggi nella Home',
      'Pianificazione UDA avanzata',
      'Hint contestuali AI abilitati',
      'Backup Google Drive suggerito',
    ],
  },
  maestro: {
    title: 'Hai raggiunto il livello Maestro! ⭐',
    features: [
      'Automazioni AI complete',
      'Modalità Osmotica disponibile',
      'Dashboard Maturità AI sbloccata',
      'Suggerimenti proattivi avanzati',
    ],
  },
};

const LevelUpCelebration: React.FC = () => {
  const markLevelUpSeen = useTeacherModelStore((s) => s.markLevelUpSeen);
  const { level, levelUpPending } = useJourneyProgress();

  useEffect(() => {
    if (!levelUpPending) return;
    const timer = setTimeout(() => {
      markLevelUpSeen();
    }, 8000);
    return () => clearTimeout(timer);
  }, [levelUpPending, markLevelUpSeen]);

  const content = LEVEL_FEATURES[level];

  return (
    <Dialog
      open={levelUpPending}
      onClose={markLevelUpSeen}
      aria-labelledby="level-up-title"
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle id="level-up-title">
        <Stack direction="row" spacing={1} alignItems="center">
          <Box
            component="span"
            className="material-symbols-outlined"
            aria-hidden="true"
            sx={{ color: 'var(--md-sys-color-tertiary)', fontSize: 'var(--md-sys-icon-size-xl)' }}
          >
            auto_awesome
          </Box>
          <Typography variant="titleLarge" component="span">
            {content.title}
          </Typography>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Typography variant="bodyMedium" sx={{ mb: 1.5, color: 'var(--md-sys-color-on-surface-variant)' }}>
          Nuove funzionalità disponibili:
        </Typography>
        <List dense disablePadding>
          {content.features.map((feature) => (
            <ListItem key={feature} disableGutters>
              <ListItemIcon sx={{ minWidth: 28 }}>
                <Box
                  component="span"
                  className="material-symbols-outlined"
                  aria-hidden="true"
                  sx={{ fontSize: 'var(--md-sys-icon-size-sm)', color: 'var(--md-sys-color-primary)' }}
                >
                  check_circle
                </Box>
              </ListItemIcon>
              <ListItemText primary={feature} primaryTypographyProps={{ variant: 'bodySmall' }} />
            </ListItem>
          ))}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={markLevelUpSeen} variant="contained" aria-label="Chiudi celebrazione livello">
          Ottimo!
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LevelUpCelebration;
