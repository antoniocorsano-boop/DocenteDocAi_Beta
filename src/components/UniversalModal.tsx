// MD3 Compliant - Uses components
/**
 * UniversalModal - MD3 Compliant Modal Component
 * Migration Status: ✅ FULLY MIGRATED & ACCESSIBLE
 */

import React from 'react';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import type { UniversalModalProps } from '../types';
import { M3Dialog } from './ui';
const UniversalModal: React.FC<UniversalModalProps> = ({
  open,
  title,
  onClose,
  children }) => {
  if (!open) return null;

  return (
    <M3Dialog
      onClose={onClose}
      title={title}
      maxWidth="sm"
    >
      <DialogContent sx={{backgroundColor: 'var(--md-sys-color-surface-container-high)',
        opacity: 'var(--md-sys-state-opacity-tint-moderate)',
        backdropFilter: 'blur(var(--md-sys-blur-small))'}}>
        {children}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="text">Chiudi</Button>
      </DialogActions>
    </M3Dialog>
  );
};

export default UniversalModal;

