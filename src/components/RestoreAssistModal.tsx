// MD3 Compliant

import * as React from 'react';
import { messages } from '../messages';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import { M3Dialog } from './ui';

// M3Expressive: Refactored to use dedicated CSS classes with M3 tokens for colors, spacing, typography, elevation, and animations

interface RestoreAssistModalProps {
  onLoadDemo: () => void;
  onRestoreFile: () => void;
  onConnectDrive: () => void;
  onClose: () => void;
  error?: string;
}

const RestoreAssistModal: React.FC<RestoreAssistModalProps> = ({
  onLoadDemo,
  onRestoreFile,
  onConnectDrive,
  onClose,
  error
}) => {
  const dialogButtons = <Button onClick={onClose} variant="text">{messages.restore.cancel}</Button>;
  return (
    <M3Dialog
      title={messages.restore.title}
      onClose={onClose}
      maxWidth="md"
      buttons={dialogButtons}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-3)' }}>
          <Box component="span" className="material-symbols-outlined" aria-hidden="true">warning</Box>
          <p>
            {messages.restore.description}
          </p>
        </div>

        {error && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-3)' }}>
          <Button onClick={onLoadDemo} variant="contained" >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-3)' }}>
              <Box component="span" className="material-symbols-outlined" aria-hidden="true">auto_awesome</Box>
              <span>{messages.restore.demo}</span>
            </div>
          </Button>

          <Button onClick={onRestoreFile} variant="outlined" >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-3)' }}>
              <Box component="span" className="material-symbols-outlined" aria-hidden="true">upload</Box>
              <span>{messages.restore.file}</span>
            </div>
          </Button>

          <Button onClick={onConnectDrive} variant="contained" color="secondary" >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-3)' }}>
              <Box component="span" className="material-symbols-outlined" aria-hidden="true">cloud_sync</Box>
              <span>{messages.restore.drive}</span>
            </div>
          </Button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
          <p>
            {messages.restore.privacy}
          </p>
        </div>
    </M3Dialog>
  );
};

export default RestoreAssistModal;

