/**
 * CognitiveDebugPanel — Fase 4 Explainability devtools.
 *
 * DEV-ONLY. Never rendered in production.
 * Visible when URL contains  ?debug=cognitive
 *
 * Shows in real-time:
 *   - EmotionalProfile (baseline state, adaptability, update count)
 *   - CognitiveStyle (structure / autonomy / speed / exploration)
 *   - CognitiveStyleSignals (raw counters)
 *   - Last merge rule applied by mergeStrategy (via observe event bus)
 */
import React, { useEffect, useState } from 'react';
import Box          from '@mui/material/Box';
import Chip         from '@mui/material/Chip';
import Divider      from '@mui/material/Divider';
import IconButton   from '@mui/material/IconButton';
import Paper        from '@mui/material/Paper';
import Stack        from '@mui/material/Stack';
import Typography   from '@mui/material/Typography';
import CloseIcon    from '@mui/icons-material/Close';

import { registerObserver, type ObservePayload } from '@/utils/observability';
import { useChatPrefsStore }                      from '@/stores/useChatPrefsStore';

interface MergeSnapshot {
  rule:        string;
  priority:    number;
  emotional:   string;
  structure:   string;
  exploration: string;
  ts:          number;
}

export function CognitiveDebugPanel(): React.ReactElement | null {
  const [visible, setVisible]       = useState(true);
  const [lastMerge, setLastMerge]   = useState<MergeSnapshot | null>(null);

  const cognitiveStyle        = useChatPrefsStore(s => s.cognitiveStyle);
  const emotionalProfile      = useChatPrefsStore(s => s.emotionalProfile);
  const cognitiveStyleSignals = useChatPrefsStore(s => s.cognitiveStyleSignals);
  const revealClickCount      = useChatPrefsStore(s => s.revealClickCount);
  const acceptedSuggestions   = useChatPrefsStore(s => s.acceptedSuggestions);
  const rejectedSuggestions   = useChatPrefsStore(s => s.rejectedSuggestions);

  useEffect(() => {
    return registerObserver((payload: ObservePayload) => {
      if (payload.event === 'merge.rule.applied') {
        setLastMerge({
          rule:        String(payload.data.rule        ?? ''),
          priority:    Number(payload.data.priority    ?? 2),
          emotional:   String(payload.data.emotional   ?? ''),
          structure:   String(payload.data.structure   ?? ''),
          exploration: String(payload.data.exploration ?? ''),
          ts:          payload.ts,
        });
      }
    });
  }, []);

  if (!visible) return null;

  return (
    <Paper
      elevation={8}
      sx={{
        position:   'fixed',
        bottom:     80,
        right:      16,
        width:      320,
        zIndex:     9999,
        p:          1.5,
        borderRadius: 2,
        border:     '2px solid',
        borderColor: 'warning.main',
        bgcolor:    'background.paper',
        maxHeight:  '65vh',
        overflowY:  'auto',
      }}
    >
      {/* Header */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
        <Typography variant="subtitle2" color="warning.main" sx={{ fontWeight: 'var(--md-sys-typescale-weight-bold)' }}>
          🧠 Cognitive Debug Panel
        </Typography>
        <IconButton size="small" onClick={() => setVisible(false)} aria-label="Chiudi debug panel">
          <CloseIcon fontSize="small" />
        </IconButton>
      </Stack>

      {/* Emotional Profile */}
      <Divider sx={{ mb: 0.75 }} />
      <Typography variant="caption" sx={{ fontWeight: 'var(--md-sys-typescale-weight-semibold)', color: 'text.secondary' }}>
        Emotional Profile
      </Typography>
      <Stack direction="row" flexWrap="wrap" gap={0.5} useFlexGap sx={{ mt: 0.5, mb: 1 }}>
        <Chip size="small" label={`baseline: ${emotionalProfile.baselineState}`}              color="default" />
        <Chip size="small" label={`adaptability: ${emotionalProfile.adaptability.toFixed(2)}`} color="default" />
        <Chip size="small" label={`updates: ${emotionalProfile.updateCount}`}                  color="default" />
      </Stack>

      {/* Cognitive Style */}
      <Divider sx={{ mb: 0.75 }} />
      <Typography variant="caption" sx={{ fontWeight: 'var(--md-sys-typescale-weight-semibold)', color: 'text.secondary' }}>
        Cognitive Style
      </Typography>
      <Stack direction="row" flexWrap="wrap" gap={0.5} useFlexGap sx={{ mt: 0.5, mb: 1 }}>
        <Chip size="small" color="primary" label={`structure: ${cognitiveStyle.structure}`}           />
        <Chip size="small" color="primary" label={`autonomy: ${cognitiveStyle.autonomy}`}             />
        <Chip size="small" color="primary" label={`speed: ${cognitiveStyle.speedPreference}`}         />
        <Chip size="small" color="primary" label={`exploration: ${cognitiveStyle.exploration}`}       />
      </Stack>

      {/* Signals */}
      <Divider sx={{ mb: 0.75 }} />
      <Typography variant="caption" sx={{ fontWeight: 'var(--md-sys-typescale-weight-semibold)', color: 'text.secondary' }}>
        Signals
      </Typography>
      <Stack direction="row" flexWrap="wrap" gap={0.5} useFlexGap sx={{ mt: 0.5, mb: 1 }}>
        <Chip size="small" label={`turns: ${cognitiveStyleSignals.totalTurns}`}            />
        <Chip size="small" label={`reveal: ${revealClickCount}`}                           />
        <Chip size="small" label={`✓ accepted: ${acceptedSuggestions}`}  color="success"  />
        <Chip size="small" label={`✗ rejected: ${rejectedSuggestions}`}  color="error"    />
        <Chip size="small" label={`deep: ${cognitiveStyleSignals.deepModeUsageCount}`}     />
        <Chip size="small" label={`fast: ${cognitiveStyleSignals.fastModeUsageCount}`}     />
        <Chip size="small" label={`blocked: ${cognitiveStyleSignals.blockedTurns}`}        />
      </Stack>

      {/* Last Merge Rule */}
      <Divider sx={{ mb: 0.75 }} />
      <Typography variant="caption" sx={{ fontWeight: 'var(--md-sys-typescale-weight-semibold)', color: 'text.secondary' }}>
        Last Merge Rule
      </Typography>
      {lastMerge ? (
        <Box sx={{ mt: 0.5 }}>
          <Stack direction="row" flexWrap="wrap" gap={0.5} useFlexGap>
            <Chip size="small" color="warning" label={lastMerge.rule}                   />
            <Chip size="small"                 label={`P${lastMerge.priority}`}          />
            <Chip size="small"                 label={`tone: ${lastMerge.emotional}`}    />
          </Stack>
          <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 0.5 }}>
            {new Date(lastMerge.ts).toLocaleTimeString()}
          </Typography>
        </Box>
      ) : (
        <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, display: 'block' }}>
          In attesa del primo turno…
        </Typography>
      )}
    </Paper>
  );
}

export default CognitiveDebugPanel;
