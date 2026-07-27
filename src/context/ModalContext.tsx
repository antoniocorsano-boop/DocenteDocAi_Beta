import React, { createContext, useContext, useState, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import Paper from '@mui/material/Paper';
import { logger } from '../utils/logger';

interface ModalEntry {
  id: string;
  component: ReactNode;
}

interface ModalContextValue {
  stack: ModalEntry[];
  pushModal: (entry: ModalEntry) => void;
  popModal: (id: string) => void;
}

const ModalContext = createContext<ModalContextValue | null>(null);

export const ModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [stack, setStack] = useState<ModalEntry[]>([]);

  const pushModal = (entry: ModalEntry) => {
    setStack((prev) => {
      if (prev.some((m) => m.id === entry.id)) {
        logger.warn(`Modal with ID "${entry.id}" is already open`);
        return prev;
      }
      return [...prev, entry];
    });
  };

  const popModal = (id: string) => {
    setStack((prev) => prev.filter((m) => m.id !== id));
  };

  return (
    <ModalContext.Provider value={{ stack, pushModal, popModal }}>
      {children}
      {stack.length > 0 && createPortal(
        <Paper
          role="dialog"
          aria-modal="true"
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 'var(--md-sys-z-modal)',
            pointerEvents: 'auto',
            bgcolor: 'transparent',
            borderRadius: 0,
          }}
        >
          {stack.map((entry) => (
            <React.Fragment key={entry.id}>{entry.component}</React.Fragment>
          ))}
        </Paper>,
        document.body
      )}
    </ModalContext.Provider>
  );
};

export const useModal = (): ModalContextValue => {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error('useModal must be used within a ModalProvider');
  return ctx;
};
