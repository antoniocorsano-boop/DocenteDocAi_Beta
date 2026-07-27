/**
 * NotificationToast.tsx — Sprint 11: Proactive notification panel.
 *
 * Renders a stacked list of NotificationDecision items with:
 *   - MD3 semantic color tokens per type (critical/warning/suggestion/info)
 *   - Material Symbol icon per type
 *   - Urgency score progress indicator
 *   - Per-item dismiss + "dismiss all" actions
 *
 * Returns null when the queue is empty (no visual footprint).
 *
 * @example
 * const { notifications, dismiss, dismissAll } = useProactiveNotifications();
 * <NotificationToast
 *   notifications={notifications}
 *   onDismiss={dismiss}
 *   onDismissAll={dismissAll}
 * />
 */

import React from 'react';
import Box        from '@mui/material/Box';
import Stack      from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Button     from '@mui/material/Button';
import LinearProgress from '@mui/material/LinearProgress';
import type { NotificationDecision } from '../../hooks/useProactiveNotifications';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  notifications: NotificationDecision[];
  onDismiss:     (actionId: string) => void;
  onDismissAll:  () => void;
}

// ─── Style maps ──────────────────────────────────────────────────────────────

type NotifType = NotificationDecision['type'];

const CONTAINER_BG: Record<NotifType, string> = {
  critical:   'var(--md-sys-color-error-container)',
  warning:    'var(--md-sys-color-tertiary-container)',
  suggestion: 'var(--md-sys-color-secondary-container)',
  info:       'var(--md-sys-color-primary-container)',
};

const CONTAINER_FG: Record<NotifType, string> = {
  critical:   'var(--md-sys-color-on-error-container)',
  warning:    'var(--md-sys-color-on-tertiary-container)',
  suggestion: 'var(--md-sys-color-on-secondary-container)',
  info:       'var(--md-sys-color-on-primary-container)',
};

const INDICATOR_COLOR: Record<NotifType, string> = {
  critical:   'var(--md-sys-color-error)',
  warning:    'var(--md-sys-color-tertiary)',
  suggestion: 'var(--md-sys-color-secondary)',
  info:       'var(--md-sys-color-primary)',
};

const TYPE_ICON: Record<NotifType, string> = {
  critical:   'error',
  warning:    'warning',
  suggestion: 'lightbulb',
  info:       'check_circle',
};

const TYPE_LABEL: Record<NotifType, string> = {
  critical:   'Critica',
  warning:    'Attenzione',
  suggestion: 'Suggerimento',
  info:       'Completata',
};

// ─── Single notification item ─────────────────────────────────────────────────

interface ItemProps {
  notification: NotificationDecision;
  onDismiss:    (actionId: string) => void;
}

const NotificationItem: React.FC<ItemProps> = ({ notification, onDismiss }) => {
  const { type, title, message, actionId, urgencyScore } = notification;
  const bg   = CONTAINER_BG[type];
  const fg   = CONTAINER_FG[type];
  const bar  = INDICATOR_COLOR[type];
  const icon = TYPE_ICON[type];

  return (
    <Box
      role="alert"
      aria-live={type === 'critical' ? 'assertive' : 'polite'}
      sx={{
        borderRadius: 'var(--md-sys-shape-corner-medium)',
        backgroundColor: bg,
        overflow: 'hidden',
        transition: 'box-shadow 150ms ease',
        '&:hover': {
          boxShadow: type === 'critical'
            ? '0 2px 8px oklch(from var(--md-sys-color-error) l c h / 0.24)'
            : 'none',
        },
      }}
    >
      {/* Urgency bar */}
      <LinearProgress
        variant="determinate"
        value={urgencyScore * 100}
        aria-hidden="true"
        sx={{
          height: 3,
          backgroundColor: 'transparent',
          '& .MuiLinearProgress-bar': {
            backgroundColor: bar,
            borderRadius: 0,
          },
        }}
      />

      <Stack
        direction="row"
        alignItems="flex-start"
        gap="var(--md-sys-spacing-3)"
        sx={{ p: 'var(--md-sys-spacing-3)' }}
      >
        {/* Icon */}
        <Box
          component="span"
          className="material-symbols-outlined"
          aria-hidden="true"
          sx={{
            fontSize: 'var(--md-sys-icon-size-md)',
            color: fg,
            flexShrink: 0,
            mt: '2px',
          }}
        >
          {icon}
        </Box>

        {/* Text */}
        <Stack flexGrow={1} minWidth={0} gap="var(--md-sys-spacing-05)">
          <Stack direction="row" alignItems="center" gap="var(--md-sys-spacing-1)">
            <Typography
              component="span"
              variant="labelSmall"
              sx={{
                color: fg,
                opacity: 0.7,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                fontSize: 'var(--md-sys-typescale-label-small-size)',
              }}
            >
              {TYPE_LABEL[type]}
            </Typography>
          </Stack>
          <Typography
            variant="labelMedium"
            sx={{
              color: fg,
              fontWeight: 'var(--md-sys-typescale-weight-semibold)',
            }}
          >
            {title}
          </Typography>
          <Typography
            variant="bodySmall"
            sx={{ color: fg, opacity: 0.85, lineHeight: 1.4 }}
          >
            {message}
          </Typography>
        </Stack>

        {/* Dismiss */}
        <IconButton
          size="small"
          aria-label={`Chiudi notifica: ${title}`}
          onClick={() => onDismiss(actionId)}
          sx={{
            color: fg,
            opacity: 0.7,
            flexShrink: 0,
            p: 'var(--md-sys-spacing-1)',
            '&:hover': { opacity: 1, backgroundColor: 'transparent' },
          }}
        >
          <Box
            component="span"
            className="material-symbols-outlined"
            aria-hidden="true"
            sx={{ fontSize: 'var(--md-sys-icon-size-sm)' }}
          >
            close
          </Box>
        </IconButton>
      </Stack>
    </Box>
  );
};

// ─── Panel ────────────────────────────────────────────────────────────────────

const NotificationToast: React.FC<Props> = ({ notifications, onDismiss, onDismissAll }) => {
  if (notifications.length === 0) return null;

  return (
    <Stack gap="var(--md-sys-spacing-2)">
      {/* Panel header */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ px: 'var(--md-sys-spacing-1)' }}
      >
        <Stack direction="row" alignItems="center" gap="var(--md-sys-spacing-1)">
          <Box
            component="span"
            className="material-symbols-outlined"
            aria-hidden="true"
            sx={{
              fontSize: 'var(--md-sys-icon-size-sm)',
              color: 'var(--md-sys-color-on-surface-variant)',
            }}
          >
            notifications_active
          </Box>
          <Typography
            variant="labelSmall"
            sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}
          >
            {notifications.length === 1
              ? '1 notifica attiva'
              : `${notifications.length} notifiche attive`}
          </Typography>
        </Stack>

        {notifications.length > 1 && (
          <Button
            variant="text"
            size="small"
            onClick={onDismissAll}
            aria-label="Chiudi tutte le notifiche"
            sx={{
              color: 'var(--md-sys-color-on-surface-variant)',
              fontSize: 'var(--md-sys-typescale-label-small-size)',
              minWidth: 'unset',
              p: 'var(--md-sys-spacing-1)',
            }}
          >
            Chiudi tutto
          </Button>
        )}
      </Stack>

      {/* Notification items — critical first */}
      {[...notifications]
        .sort((a, b) => b.urgencyScore - a.urgencyScore)
        .map((n) => (
          <NotificationItem
            key={n.actionId}
            notification={n}
            onDismiss={onDismiss}
          />
        ))}
    </Stack>
  );
};

export default NotificationToast;
