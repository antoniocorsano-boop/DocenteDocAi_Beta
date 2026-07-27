// MD3 Gold Compliant
// Tutti gli stili usano esclusivamente token MD3 (nessun valore hardcoded)
// Audit: gennaio 2026
// M3Expressive: LoadingModal - Loading indicator modal with M3 tokens
import React from 'react';
import { M3Dialog } from './ui';

interface LoadingModalProps {
  message: string;
}

const LoadingModal: React.FC<LoadingModalProps> = ({ message }) => {
  return (
    <M3Dialog
      onClose={() => {}}
      title=""
      maxWidth="sm"
      hideCloseButton
      hideBackdrop={true}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
          <div></div>
          <div></div>
        </div>
      <p>{message}</p>
    </M3Dialog>
  );
};

export default LoadingModal;

