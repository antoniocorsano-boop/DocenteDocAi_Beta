// MD3 Compliant
import React from 'react';
import RestoreAssistModal from './RestoreAssistModal';

// M3Expressive: Controller component that delegates to RestoreAssistModal - no inline classes to refactor

interface RestoreAssistControllerProps {
  isOpen: boolean;
  error?: string;
  onLoadDemo: () => void;
  onRestoreFile: () => void;
  onConnectDrive: () => void;
  onClose: () => void;
}

const RestoreAssistController: React.FC<RestoreAssistControllerProps> = ({
  isOpen,
  error,
  onLoadDemo,
  onRestoreFile,
  onConnectDrive,
  onClose
}) => {
  if (!isOpen) return null;
  return (
    <RestoreAssistModal
      onLoadDemo={onLoadDemo}
      onRestoreFile={onRestoreFile}
      onConnectDrive={onConnectDrive}
      onClose={onClose}
      error={error}
    />
  );
};

export default RestoreAssistController;

