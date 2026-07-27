/**
 * Material Design 3 Expressive - Modal Management System
 * Architettura degli Overlay - Soluzione "Modal Hell"
 *
 * Features:
 * - Centralized modal stacking with React Portals
 * - Dynamic Z-index calculation (supports 3+ levels)
 * - M3 Expressive transitions (fade + scale)
 * - Backdrop blur effects
 * - Full TypeScript support
 * - Accessibility first (ARIA attributes)
 * 
 * @audit Sezione 1: Architettura degli Overlay
 */

import React, { createContext, useContext, useCallback, useState, ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { getModalZIndex } from '../design-system/zIndex';
import Paper from '@mui/material/Paper';
import { logger } from '../utils/logger';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/**
 * Modal instance in the stack
 */
interface ModalInstance {
  id: string;
  component: React.ReactNode;
  level: number;
  onClose?: () => void;
  backdropClickable?: boolean;
  backdropOpacity?: 'light' | 'medium' | 'dark';
}

/**
 * ModalContext public API
 */
interface ModalContextType {
  // Stack management
  stack: ModalInstance[];
  
  // Modal operations
  pushModal: (options: PushModalOptions) => void;
  popModal: (id: string) => void;
  popAllModals: () => void;
  
  // Utilities
  getZIndex: (level: number) => string | number;
  isModalOpen: (id: string) => boolean;
  getTopModal: () => ModalInstance | undefined;
}

/**
 * Options for pushing a new modal
 */
interface PushModalOptions {
  id: string;
  component: React.ReactNode;
  onClose?: () => void;
  backdropClickable?: boolean;
  backdropOpacity?: 'light' | 'medium' | 'dark';
}

// ============================================================================
// CONTEXT & HOOKS
// ============================================================================

const ModalContext = createContext<ModalContextType | null>(null);

/**
 * Hook to use Modal Context
 * @throws Error if used outside ModalProvider
 */
export const useModal = (): ModalContextType => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within ModalProvider');
  }
  return context;
};

/**
 * Simplified hook for single modal lifecycle
 */
export const useModalController = (modalId: string): { openModal: (component: React.ReactNode, onClose?: () => void) => void; closeModal: () => void; isOpen: boolean } => {
  const { pushModal, popModal, isModalOpen } = useModal();

  const openModal = useCallback(
    (component: React.ReactNode, onClose?: () => void) => {
      pushModal({
        id: modalId,
        component,
        onClose,
        backdropClickable: true,
        backdropOpacity: 'medium',
      });
    },
    [modalId, pushModal]
  );

  const closeModal = useCallback(() => {
    popModal(modalId);
  }, [modalId, popModal]);

  const isOpen = isModalOpen(modalId);

  return { openModal, closeModal, isOpen };
};

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

interface ModalProviderProps {
  children: ReactNode;
}

/**
 * ModalProvider - Wraps app and manages all modals through Context + Portals
 * 
 * Usage:
 * ```tsx
 * <ModalProvider>
 *   <App />
 * </ModalProvider>
 * 
 */
export const ModalProvider: React.FC<ModalProviderProps> = ({ children }) => {
  const [stack, setStack] = useState<ModalInstance[]>([]);
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);

  // Initialize portal container ONLY when needed
  useEffect(() => {
    if (stack.length === 0) {
      // No modals, ensure container is removed
      if (portalContainer) {
        document.body.removeChild(portalContainer);
        setPortalContainer(null);
      }
      return;
    }

    // Modals exist, ensure container is created
    let container = document.getElementById('modal-root');

    if (!container) {
      container = document.createElement('div');
      container.id = 'modal-root';
      container.style.position = 'fixed';
      container.style.top = '0';
      container.style.left = '0';
      // MD3 Exception: overlay/modal root must fill viewport, no MD3 token available
      container.style.width = '100%'; // Exception documented
      container.style.height = '100%'; // Exception documented
      container.style.pointerEvents = 'auto'; // Allow interactions when modals are present
      container.style.zIndex = getModalZIndex(0); // Use semantic z-index
      document.body.appendChild(container);
    }

    setPortalContainer(container);

    return () => {
      // Cleanup: remove container when no modals
      if (container && stack.length === 0) {
        document.body.removeChild(container);
      }
    };
  }, [stack.length, portalContainer]);

  // Push modal to stack
  const pushModal = useCallback(
    (options: PushModalOptions): void => {
      setStack((prev) => {
        // Prevent duplicate modal IDs
        if (prev.some((m) => m.id === options.id)) {
          logger.warn(`Modal with ID "${options.id}" is already open`);
          return prev;
        }

        const newLevel = prev.length + 1;
        return [
          ...prev,
          {
            id: options.id,
            component: options.component,
            level: newLevel,
            onClose: options.onClose,
            backdropClickable: options.backdropClickable ?? true,
            backdropOpacity: options.backdropOpacity ?? 'medium',
          },
        ];
      });
    },
    []
  );

  // Pop modal from stack
  const popModal = useCallback((id: string) => {
    setStack((prev) => {
      const modal = prev.find((m) => m.id === id);
      if (modal?.onClose) {
        modal.onClose();
      }
      return prev.filter((m) => m.id !== id);
    });
  }, []);

  // Pop all modals
  const popAllModals = useCallback(() => {
    setStack((prev) => {
      prev.forEach((m) => {
        if (m.onClose) {
          m.onClose();
        }
      });
      return [];
    });
  }, []);

  // Calculate Z-index for level using centralized Z_INDEX constant
  // Centralized in: src/design-system/zIndex.ts
  const getZIndex = useCallback((level: number): string => {
    return getModalZIndex(level);
  }, []);

  // Check if modal is open
  const isModalOpen = useCallback((id: string): boolean => {
    return stack.some((m) => m.id === id);
  }, [stack]);

  // Get top modal
  const getTopModal = useCallback((): ModalInstance | undefined => {
    return stack[stack.length - 1];
  }, [stack]);

  const value: ModalContextType = {
    stack,
    pushModal,
    popModal,
    popAllModals,
    getZIndex,
    isModalOpen,
    getTopModal,
  };

  return (
    <ModalContext.Provider value={value}>
      {children}
      {portalContainer && <ModalPortalContainer stack={stack} getZIndex={getZIndex} />}
    </ModalContext.Provider>
  );
};

// ============================================================================
// PORTAL CONTAINER
// ============================================================================

interface ModalPortalContainerProps {
  stack: ModalInstance[];
  getZIndex: (level: number) => string | number;
}

/**
 * Portal Container - Renders all modals in dedicated container
 */
const ModalPortalContainer: React.FC<ModalPortalContainerProps> = ({ stack, getZIndex }) => {
  const container = document.getElementById('modal-root');
  if (!container) return null;

  return createPortal(
    <>
      {stack.map((modal) => {
        const backdropZIndex = getZIndex(modal.level - 1);
        const modalZIndex = getZIndex(modal.level);

        return (
          <ModalPortal
            key={modal.id}
            id={modal.id}
            level={modal.level}
            backdropZIndex={backdropZIndex}
            modalZIndex={modalZIndex}
            backdropClickable={modal.backdropClickable}
            backdropOpacity={modal.backdropOpacity}
            onBackdropClick={() => {
              // Context has access via useModal hook
            }}
          >
            {modal.component}
          </ModalPortal>
        );
      })}
    </>,
    container
  );
};

// ============================================================================
// INDIVIDUAL MODAL PORTAL
// ============================================================================

interface ModalPortalProps {
  id: string;
  level: number;
  backdropZIndex?: string | number;
  modalZIndex: string | number;
  backdropClickable?: boolean;
  backdropOpacity?: 'light' | 'medium' | 'dark';
  onBackdropClick?: () => void;
  children: React.ReactNode;
}

/**
 * Individual Modal Portal - Renders single modal with backdrop
 * Handles animations and accessibility
 */
const ModalPortal: React.FC<ModalPortalProps> = ({
  id,
  level,
  modalZIndex,
  backdropClickable = true,
  backdropOpacity = 'medium',
  onBackdropClick: _onBackdropClick,
  children,
}) => {
  const { popModal } = useModal();

  const handleBackdropClick = useCallback(() => {
    if (backdropClickable) {
      popModal(id);
    }
  }, [backdropClickable, id, popModal]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Escape' && backdropClickable) {
      popModal(id);
    }
  }, [backdropClickable, id, popModal]);

  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && backdropClickable) {
        popModal(id);
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => document.removeEventListener('keydown', handleEscapeKey);
  }, [backdropClickable, id, popModal]);

  return (
    <Paper
      elevation={8}
      role="dialog"
      aria-modal="true"
      aria-labelledby={`modal-title-${id}`}
      aria-describedby={`modal-content-${id}`}
      tabIndex={-1}
      onKeyDown={handleKeyDown}
      sx={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 4,
        zIndex: modalZIndex as number,
        bgcolor: 'transparent',
      }}
      data-modal-id={id}
      data-modal-level={level}
    >
      {/* Backdrop - M3 Expressive with blur */}
      <Paper
        elevation={0}
        onClick={handleBackdropClick}
        aria-hidden="true"
        role="presentation"
        sx={{
          position: 'absolute',
          inset: 0,
          backdropFilter: 'blur(4px)',
          animation: `modal-fade-in var(--md-sys-motion-duration-short2) var(--md-sys-motion-easing-standard-decelerate)`,
          backgroundColor: backdropOpacity === 'light'
            ? 'color-mix(in srgb, var(--md-sys-color-scrim) 20%, transparent)'
            : backdropOpacity === 'medium'
            ? 'color-mix(in srgb, var(--md-sys-color-scrim) 40%, transparent)'
            : 'color-mix(in srgb, var(--md-sys-color-scrim) 60%, transparent)',
          cursor: backdropClickable ? 'pointer' : 'default',
          borderRadius: 0,
        }}
      />

      {/* Modal Content Wrapper */}
      <Paper
        elevation={0}
        role="document"
        sx={{
          position: 'relative',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: `modal-zoom-in var(--md-sys-motion-duration-short2) var(--md-sys-motion-easing-standard-decelerate)`,
          bgcolor: 'transparent',
        }}
        data-modal-portal-content
        id={`modal-content-${id}`}
      >
        {children}
      </Paper>
    </Paper>
  );
};

// ============================================================================
// EXPORTS
// ============================================================================

export { ModalContext, type ModalContextType, type ModalInstance, type PushModalOptions };
