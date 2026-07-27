/**
 * ConversationSidebar.tsx — P37 Standalone Conversation Sidebar
 *
 * Reusable sidebar listing all conversation threads from useConversationStore.
 * Can be embedded in SmartChatLayout, a Drawer, or any shell.
 *
 * MD3 / MUI v7 compliance:
 *   - Only MUI primitives (Box, List, Typography, IconButton, Divider, Stack, Tooltip)
 *   - No custom styled() blocks with hardcoded colours
 *   - All interactive elements carry aria-label
 *   - Spacing via sx tokens only
 */
import React from 'react';
import {
  Box,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import AddCommentIcon    from '@mui/icons-material/AddComment';
import ChevronLeftIcon   from '@mui/icons-material/ChevronLeft';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

import { useConversationStore } from '@/stores/useConversationStore';

// ── Props ─────────────────────────────────────────────────────────────────────

export interface ConversationSidebarProps {
  /** Called when the user presses "+ Nuova chat" */
  onNewChat: () => void;
  /**
   * When provided a close button is shown (used inside a temporary Drawer).
   */
  onClose?: () => void;
  /** Fixed pixel width of the sidebar. Defaults to 240. */
  width?: number;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ConversationSidebar({
  onNewChat,
  onClose,
  width = 240,
}: ConversationSidebarProps): React.ReactElement {
  const {
    conversations,
    activeId,
    switchConversation,
    deleteConversation,
  } = useConversationStore();

  return (
    <Box
      component="nav"
      aria-label="Sidebar conversazioni"
      sx={{
        width,
        height:          '100%',
        display:         'flex',
        flexDirection:   'column',
        borderRight:     '1px solid',
        borderColor:     'divider',
        backgroundColor: 'background.paper',
        overflowX:       'hidden',
      }}
    >
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <Stack
        direction="row"
        alignItems="center"
        sx={{ px: 1.5, py: 1.25, flexShrink: 0 }}
      >
        <Typography variant="subtitle2" sx={{ flex: 1 }}>
          Conversazioni
        </Typography>

        <Tooltip title="Nuova chat" placement="bottom">
          <IconButton
            size="small"
            onClick={onNewChat}
            aria-label="Nuova conversazione"
          >
            <AddCommentIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        {onClose && (
          <Tooltip title="Chiudi sidebar" placement="bottom">
            <IconButton
              size="small"
              onClick={onClose}
              aria-label="Chiudi sidebar conversazioni"
              sx={{ ml: 0.5 }}
            >
              <ChevronLeftIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Stack>

      <Divider />

      {/* ── Conversation list ────────────────────────────────────────────── */}
      <List
        dense
        disablePadding
        sx={{ flex: 1, overflowY: 'auto' }}
        aria-label="Lista conversazioni"
      >
        {conversations.length === 0 && (
          <ListItem sx={{ py: 2, justifyContent: 'center' }}>
            <Typography variant="caption" color="text.disabled" align="center">
              Nessuna conversazione
            </Typography>
          </ListItem>
        )}

        {conversations.map(conv => (
          <ListItem
            key={conv.id}
            disablePadding
            secondaryAction={
              <Tooltip title="Elimina" placement="right">
                <IconButton
                  edge="end"
                  size="small"
                  aria-label={`Elimina conversazione: ${conv.title}`}
                  onClick={e => {
                    e.stopPropagation();
                    deleteConversation(conv.id);
                  }}
                  sx={{ opacity: 0, '.MuiListItem-root:hover &': { opacity: 1 } }}
                >
                  <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
            }
          >
            <ListItemButton
              selected={conv.id === activeId}
              onClick={() => switchConversation(conv.id)}
              aria-label={`Passa a: ${conv.title}`}
              aria-current={conv.id === activeId ? 'true' : undefined}
              sx={{ borderRadius: 1, mx: 0.5, my: 0.25 }}
            >
              <ListItemText
                primary={conv.title}
                secondary={new Date(conv.updatedAt).toLocaleDateString('it-IT', {
                  day:   '2-digit',
                  month: 'short',
                })}
                slotProps={{
                  primary: {
                    variant: 'body2',
                    sx: {
                      overflow:     'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace:   'nowrap',
                    },
                  },
                  secondary: {
                    variant: 'caption',
                  },
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );
}
