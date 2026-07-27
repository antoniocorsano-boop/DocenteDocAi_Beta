// MD3 Gold Compliant
// Reusable thin wrapper for the common "Chiedi all'AI" teaser pattern
// used across hubs, dashboards, and special views (Phase 4 dedup)

// Migration A: All AI entry points now go through the single AIBrain
import React from 'react';
import Box from '@mui/material/Box';
import AskAIButton from '../AskAIButton';
import { View, NavigationParams } from '../../types';

interface ContextualAskAIProps {
  onNavigate: (view: View, context?: NavigationParams) => void;
  context?: NavigationParams;
  /** Optional override for fullWidth (defaults to true for hub usage) */
  fullWidth?: boolean;
  /** Compact variant (smaller button) */
  compact?: boolean;
  /** @deprecated Use smart label resolver in AskAIButton instead */
  label?: string;
}

const ContextualAskAI: React.FC<ContextualAskAIProps> = ({
  onNavigate,
  context,
  fullWidth = true,
  compact = false,
}) => {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 'var(--md-sys-spacing-4)' }}>
      <AskAIButton
        onNavigate={onNavigate}
        context={context}
        fullWidth={fullWidth}
        compact={compact}
      />
    </Box>
  );
};

export default ContextualAskAI;