// MD3 Gold Compliant
// Reusable "Chiedi all'AI" button — Fase 2 contextual AI entry
// Always navigates to the dedicated "Assistente" view (P44.6)
// Can optionally pass context via NavigationParams

import React from 'react';
import ButtonBase from '@mui/material/ButtonBase';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { View, NavigationParams } from '../types';

// NEW: Use the single AI Brain (migration step A)
import { AIBrain } from '../ai/brain/AIBrain';

interface AskAIButtonProps {
  onNavigate: (view: View, params?: NavigationParams) => void;
  /** Optional context to pass to the assistente view */
  context?: NavigationParams;
  /** Label override */
  label?: string;
  /** Compact version (smaller) */
  compact?: boolean;
  /** Full width */
  fullWidth?: boolean;
}

const AskAIButton: React.FC<AskAIButtonProps> = ({
  onNavigate,
  context,
  label,
  compact = false,
  fullWidth = false,
}) => {
  // Smart default label derivation (Phase 4 consistency)
  const resolvedLabel = label || (() => {
    if (!context) return 'Chiedi all’AI';

    const src = (context as any).source as string | undefined;
    const classe = (context as any).classe as string | undefined;

    // === CANONICAL LABELS (Phase 4) ===
    const CANONICAL: Record<string, string> = {
      'home': 'Chiedi all’AI',
      'aula': 'Chiedi all’AI per questa classe',
      'aula-session': 'Chiedi all’AI per questa lezione',
      'classroom-tools': 'Chiedi all’AI per questa lezione',
      'progettazione-hub': 'Chiedi all’AI per pianificare',
      'lessons': 'Chiedi all’AI per generare lezioni',
      'uda': 'Chiedi all’AI per nuovi progetti',
      'analytics': 'Chiedi all’AI con questi dati',
      'studio': 'Chiedi all’AI nello Studio',
      'knowledge-base': 'Chiedi all’AI sulla Knowledge Base',
      'register': 'Chiedi all’AI sul registro',
      'evaluations': 'Chiedi all’AI per le valutazioni',
      'studenti': 'Chiedi all’AI sugli studenti',
      'welcome': 'Chiedi all’AI per iniziare',
      'copilot': 'Chiedi all’AI per il Copilot',
      'video-analysis': 'Chiedi all’AI per video',
      'feed-manager': 'Chiedi all’AI per feed e circolari',
      'didattica-inclusiva': 'Chiedi all’AI per inclusione',
      'improvement-guide': 'Chiedi all’AI per il piano di miglioramento',
    };

    if (src && CANONICAL[src]) return CANONICAL[src];
    if (classe) return `Chiedi all’AI per ${classe}`;
    if (src) return `Chiedi all’AI per ${src}`;
    return 'Chiedi all’AI';
  })();

  const handleClick = () => {
    // Migration to single AIBrain (step A / Fase 3)
    // Real consumption using canonical path + deprecation helper example
    if (context) {
      // Use migrateLegacyAsk for gradual deprecation path (rollback-safe)
      AIBrain.migrateLegacyAsk('Chiedi all’AI', context as any).catch(() => {});
    }
    onNavigate('assistente', context);
  };

  const size = compact ? 'var(--md-sys-spacing-10)' : 'var(--md-sys-spacing-12)';

  return (
    <ButtonBase
      onClick={handleClick}
      aria-label={resolvedLabel}
      focusRipple
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--md-sys-spacing-2)',
        width: fullWidth ? '100%' : 'auto',
        px: compact ? 'var(--md-sys-spacing-3)' : 'var(--md-sys-spacing-4)',
        py: compact ? 'var(--md-sys-spacing-1-5)' : 'var(--md-sys-spacing-2)',
        borderRadius: 'var(--md-sys-shape-corner-full)',
        bgcolor: 'var(--md-sys-color-primary-container)',
        color: 'var(--md-sys-color-on-primary-container)',
        transition: 'filter 0.15s ease, background-color 0.15s ease',
        '&:hover': {
          filter: 'brightness(0.95)',
          bgcolor: 'var(--md-sys-color-primary-container)',
        },
        '&:focus-visible': {
          outline: '2px solid var(--md-sys-color-primary)',
          outlineOffset: 2,
        },
      }}
    >
      <Box
        component="span"
        className="material-symbols-outlined"
        aria-hidden="true"
        sx={{
          fontSize: compact ? 20 : 24,
          color: 'var(--md-sys-color-primary)',
        }}
      >
        auto_awesome
      </Box>

      <Typography
        variant={compact ? 'labelMedium' : 'labelLarge'}
        sx={{
          fontWeight: 'var(--md-sys-typescale-weight-medium)',
          color: 'inherit',
        }}
      >
        {resolvedLabel}
      </Typography>

      {!compact && (
        <Box
          component="span"
          className="material-symbols-outlined"
          aria-hidden="true"
          sx={{ fontSize: 18, opacity: 0.7, ml: 'var(--md-sys-spacing-1)' }}
        >
          arrow_forward
        </Box>
      )}
    </ButtonBase>
  );
};

export default AskAIButton;
