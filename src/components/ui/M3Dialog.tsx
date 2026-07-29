// Thin MUI wrapper � preserves M3Dialog props API for backward compatibility
// @mui-migrated Fase 2
import React, { useCallback } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { useKeyboardNavigation } from '../../hooks/useKeyboardNavigation';

// ============================================================================
// TYPES
// ============================================================================

export interface M3DialogProps {
  id?: string;
  title: React.ReactNode;
  headline?: string;
  children: React.ReactNode;
  buttons?: React.ReactNode;
  mode?: 'modal' | 'fullscreen';
  onClose: () => void;
  backdropClickable?: boolean;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  headerContent?: React.ReactNode;
  footerContent?: React.ReactNode;
  style?: React.CSSProperties;
  isOpen?: boolean;
  hideBackdrop?: boolean;
  hideCloseButton?: boolean;
  level?: number;
  wrapperTestId?: string;
  mobileFullscreen?: boolean;
}

const MAX_WIDTH_MAP: Record<NonNullable<M3DialogProps['maxWidth']>, 'xs' | 'sm' | 'md' | 'lg' | 'xl'> = {
  sm: 'xs', md: 'sm', lg: 'md', xl: 'lg', '2xl': 'xl',
};

// ============================================================================
// M3DIALOG COMPONENT
// ============================================================================

export const M3Dialog: React.FC<M3DialogProps> = ({
  title,
  headline,
  children,
  buttons,
  mode = 'modal',
  onClose,
  backdropClickable = true,
  maxWidth = 'lg',
  headerContent,
  footerContent,
  style = {},
  isOpen = true,
  hideBackdrop = false,
  hideCloseButton = false,
  wrapperTestId,
  mobileFullscreen = false,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  // Keep keyboard navigation hook for accessibility
  const dialogRef = useKeyboardNavigation(isOpen, onClose, { focusOnOpen: true, restoreFocus: true });

  const handleBackdropClick = useCallback(
    (_: React.MouseEvent<HTMLDivElement>) => {
      if (backdropClickable) onClose();
    },
    [backdropClickable, onClose]
  );

  return (
    <Dialog
      open={isOpen}
      maxWidth={MAX_WIDTH_MAP[maxWidth]}
      fullWidth
      fullScreen={mode === 'fullscreen' || (mobileFullscreen && isMobile)}
      hideBackdrop={hideBackdrop}
      slotProps={{
        backdrop: { onClick: handleBackdropClick },
        paper: {
          ref: dialogRef,
          'data-testid': wrapperTestId || 'm3-dialog',
          'data-fullscreen': mode === 'fullscreen' ? 'true' : 'false',
          style,
          sx: {
            bgcolor: 'var(--md-sys-color-surface-container-high)',
            borderRadius: 'var(--md-sys-shape-corner-large)',
          },
        } as Record<string, unknown>,
      }}
      aria-labelledby="dialog-title"
    >
      {headerContent || (
        <DialogTitle
          id="dialog-title"
          sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', pb: headline ? 1 : 2 }}
        >
          <Box>
            <Typography variant="h6" component="span">
              {title}
            </Typography>
            {headline && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {headline}
              </Typography>
            )}
          </Box>
          {!hideCloseButton && (
            <IconButton
              edge="end"
              aria-label="Chiudi"
              onClick={onClose}
              size="small"
              sx={{ ml: 1, mt: -0.5 }}
            >
              <Box component="span" className="material-symbols-outlined" aria-hidden="true">close</Box>
            </IconButton>
          )}
        </DialogTitle>
      )}

      <DialogContent>{children}</DialogContent>

      {footerContent || (buttons && (
        <DialogActions>{buttons}</DialogActions>
      ))}
    </Dialog>
  );
};

export default M3Dialog;

// ============================================================================
// SUBCOMPONENTS
// ============================================================================

export const M3DialogContent: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({
  children, style,
}) => <DialogContent sx={style}>{children}</DialogContent>;

export const M3DialogActions: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({
  children, style,
}) => <DialogActions sx={{ justifyContent: 'flex-end', gap: 1, ...style }}>{children}</DialogActions>;

export const M3ConfirmDialog: React.FC<{
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}> = ({
  title, message, onConfirm, onCancel,
  confirmText = 'Conferma', cancelText = 'Annulla', danger = false,
}) => (
  <M3Dialog
    title={title}
    onClose={onCancel}
    maxWidth="sm"
    buttons={
      <>
        <Button onClick={onCancel} variant="text">{cancelText}</Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color={danger ? 'error' : 'primary'}
        >
          {confirmText}
        </Button>
      </>
    }
  >
    <Typography variant="body1">{message}</Typography>
  </M3Dialog>
);
