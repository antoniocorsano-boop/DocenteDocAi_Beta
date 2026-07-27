// MD3 Compliant
/**
 * AssistantView.tsx
 * 
 * Vista principale "Assistente" — la destinazione dedicata per l'esperienza AI completa (P44.6).
 * 
 * Riutilizza il core cognitivo esistente (SmartChat) senza duplicare logica.
 * Questo è il "secondo modo" ufficiale per accedere all'AI dopo il consolidamento Fase 0.
 */

import React from 'react';
import { Box, Typography } from '@mui/material';
import { SmartChat } from '../chat/SmartChat';
import { useSettingsStore } from '../../stores/useSettingsStore';

interface AssistantViewProps {
  initialMode?: 'chat' | 'docs' | 'tools';
  /** Optional context passed from AskAIButton or navigation (e.g. { class: '3A', source: 'lessons' }) */
  context?: Record<string, unknown>;
}

const AssistantView: React.FC<AssistantViewProps> = ({ initialMode, context }) => {
  const aiSettings = useSettingsStore((s) => s.aiSettings);
  const userPlan = (aiSettings as any)?.plan === 'pro' ? 'pro' : 'free';

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
      role="main"
      aria-label="Assistente AI DocenteDoc"
    >
      {/* Lightweight context banner — does not touch core SmartChat / P44.6 logic */}
      {context && Object.keys(context).length > 0 && (
        <Box
          sx={{
            px: 'var(--md-sys-spacing-3)',
            py: 'var(--md-sys-spacing-1)',
            bgcolor: 'var(--md-sys-color-surface-container)',
            borderBottom: '1px solid var(--md-sys-color-outline-variant)',
            fontSize: 'var(--md-sys-typescale-label-small-font-size)',
            color: 'var(--md-sys-color-on-surface-variant)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--md-sys-spacing-1)',
            flexWrap: 'wrap',
          }}
        >
          <Box component="span" className="material-symbols-outlined" sx={{ fontSize: 16 }}>info</Box>
          <Typography variant="labelSmall" sx={{ color: 'inherit' }}>
            Contesto:
          </Typography>
          {Object.entries(context).map(([key, value], idx) => (
            <Box
              key={idx}
              component="span"
              sx={{
                px: 'var(--md-sys-spacing-1)',
                py: '1px',
                bgcolor: 'var(--md-sys-color-surface-container-high)',
                borderRadius: 'var(--md-sys-shape-corner-small)',
                fontSize: 'var(--md-sys-typescale-label-small-font-size)',
              }}
            >
              {key}: {String(value)}
            </Box>
          ))}
        </Box>
      )}

      <SmartChat
        userPlan={userPlan}
        height="100%"
        // Passiamo il contesto che l'utente si aspetta dalla vista dedicata
        forceCompact={false}
      />
    </Box>
  );
};

export default AssistantView;