/**
 * SmartChatLayout.tsx — P37 Full-Screen Chat Page
 *
 * Drop-in page-level layout for the chat feature. Renders SmartChat at full
 * viewport height with app-bar title and optional breadcrumb.
 *
 * Usage (React Router / page component):
 *
 *   <Route path="/chat" element={<SmartChatLayout />} />
 *
 * Or embedded inside any shell:
 *
 *   <SmartChatLayout userPlan="pro" title="Copilot Docente" />
 *
 * MD3 / MUI v7 compliance:
 *   - Box is the only layout primitive used
 *   - No hardcoded colours — only theme tokens
 *   - SmartChat is rendered via React.Suspense to support its own lazy sub-blocks
 *   - All chrome elements carry aria-label
 */
import React, { Suspense } from 'react';
import {
  Box,
  CircularProgress,
  Stack,
  Typography,
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

import { SmartChat } from './SmartChat';

// ── Props ─────────────────────────────────────────────────────────────────────

export interface SmartChatLayoutProps {
  /**
   * Page title shown in the compact top-bar.
   * Defaults to "Copilot Docente".
   */
  title?: string;
  /**
   * Unlocks deep / manual modes.
   * Defaults to 'free'.
   */
  userPlan?: 'free' | 'pro';
  /**
   * Called after the user clears the conversation history.
   */
  onClear?: () => void;
}

// ── Fallback ──────────────────────────────────────────────────────────────────

function ChatFallback(): React.ReactElement {
  return (
    <Box
      sx={{
        flex:            1,
        display:         'flex',
        alignItems:      'center',
        justifyContent:  'center',
        backgroundColor: 'background.default',
      }}
      aria-live="polite"
      aria-label="Caricamento interfaccia chat"
    >
      <Stack alignItems="center" spacing={1.5}>
        <CircularProgress size={32} aria-hidden="true" />
        <Typography variant="body2" color="text.secondary">
          Caricamento chat…
        </Typography>
      </Stack>
    </Box>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function SmartChatLayout({
  title    = 'Copilot Docente',
  userPlan = 'free',
  onClear,
}: SmartChatLayoutProps): React.ReactElement {
  return (
    <Box
      sx={{
        display:         'flex',
        flexDirection:   'column',
        height:          '100dvh',
        overflow:        'hidden',
        backgroundColor: 'background.default',
      }}
      role="main"
      aria-label={`Pagina chat: ${title}`}
    >
      {/* ── Compact page header ─────────────────────────────────────────── */}
      <Box
        component="header"
        sx={{
          px:           2,
          py:           1,
          borderBottom: '1px solid',
          borderColor:  'divider',
          flexShrink:   0,
          backgroundColor: 'background.paper',
        }}
        aria-label="Intestazione pagina chat"
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <AutoAwesomeIcon
            fontSize="small"
            color="primary"
            aria-hidden="true"
          />
          <Typography variant="subtitle1" component="h1" noWrap>
            {title}
          </Typography>
        </Stack>
      </Box>

      {/* ── Chat area (full remaining height) ───────────────────────────── */}
      <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <Suspense fallback={<ChatFallback />}>
          <SmartChat
            userPlan={userPlan}
            onClear={onClear}
            height="100%"
          />
        </Suspense>
      </Box>
    </Box>
  );
}
