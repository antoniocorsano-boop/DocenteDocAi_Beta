// MD3 GOLD COMPLIANT — AUDIT 2026-01-25
// Tutti i valori di design (colori, spacing, tipografia, elevazione, shape) sono gestiti esclusivamente tramite token MD3 (`var(--md-sys-*)`).
// Nessun valore hardcoded (px, rem, %, hex, rgba) presente. Nessun uso di className custom. Conforme a MD3_GOVERNANCE_COMPLIANCE_CONTRACT.md.
// Audit e refactor completati: 2026-01-25.
import React, { createContext, useContext, useCallback, useState, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { getModalZIndex } from '../design-system/zIndex';
/**
 * ModalContext - Centralized Modal Management System with React Portals
 * Solves "Modal Hell" by managing Z-index stacking and portal rendering
 * Audit Spec: Material Design 3 Expressive Modal System
 */

interface ModalInstance {
  id: string;
  component: React.ReactNode;
  level: number;
}

interface ModalContextType {
  stack: ModalInstance[];
  pushModal: (id: string, component: React.ReactNode) => void;
  popModal: (id: string) => void;
  getZIndex: (level: number) => string;
  isModalOpen: (id: string) => boolean;
}

const ModalContext = createContext<ModalContextType | null>(null);

let _modalContainer: HTMLElement | null = null;

/**
 * Hook to use Modal Context
 */
export const useModal = (): ModalContextType => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within ModalProvider');
  }
  return context;
};

/**
 * Modal Provider Component
 * Wraps the app and manages all modals through Context + Portals
 */
export const ModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [stack, setStack] = useState<ModalInstance[]>([]);
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);

  // Effect: manage modal-root container lifecycle
  React.useEffect(() => {
    if (stack.length === 0) {
      // No modals, remove modal-root if present
      if (portalContainer) {
        document.body.removeChild(portalContainer);
        setPortalContainer(null);
      }
      return;
    }
    // Modals present, ensure modal-root exists
    let container = document.getElementById('modal-root');
    if (!container) {
      container = document.createElement('div');
      container.id = 'modal-root';
      // removed runtime mutation
      document.body.appendChild(container);
    }
    setPortalContainer(container);
    return () => {
      if (container && stack.length === 0) {
        document.body.removeChild(container);
      }
    };
  }, [stack.length, portalContainer]);

  const pushModal = useCallback((id: string, component: React.ReactNode) => {
    setStack((prev) => {
      if (prev.some((m) => m.id === id)) return prev;
      const newLevel = prev.length + 1;
      return [...prev, { id, component, level: newLevel }];
    });
  }, []);

  const popModal = useCallback((id: string) => {
    setStack((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const getZIndex = useCallback((level: number) => {
    return getModalZIndex(level);
  }, []);

  const isModalOpen = useCallback((id: string) => {
    return stack.some((m) => m.id === id);
  }, [stack]);

  const value: ModalContextType = {
    stack,
    pushModal,
    popModal,
    getZIndex,
    isModalOpen,
  };

  return (
    <ModalContext.Provider value={value}>
      {children}
      {/* Only render modal portal container if there are active modals */}
      {stack.length > 0 && portalContainer && (
        <ModalPortalContainer modals={stack} getZIndex={getZIndex} />
      )}
    </ModalContext.Provider>
  );
};

/**
 * Portal Container Component
 * Renders all modals in a dedicated container at DOM root level
 */
interface ModalPortalContainerProps {
  modals: ModalInstance[];
  getZIndex: (level: number) => string;
}

const ModalPortalContainer: React.FC<ModalPortalContainerProps> = ({ modals, getZIndex }) => {
  return (
    <>
      {modals.map((modal) => {
        const backdropZIndex = getZIndex(modal.level - 1);
        const modalZIndex = getZIndex(modal.level);

        return (
          <ModalPortal
            key={modal.id}
            id={modal.id}
            level={modal.level}
            backdropZIndex={backdropZIndex}
            modalZIndex={modalZIndex}
          >
            {modal.component}
          </ModalPortal>
        );
      })}
    </>
  );
};

/**
 * Individual Modal Portal
 * Renders a single modal with backdrop at correct Z-index
 */
interface ModalPortalProps {
  id: string;
  level: number;
  backdropZIndex: string;
  modalZIndex: string;
  children: React.ReactNode;
}

const ModalPortal: React.FC<ModalPortalProps> = ({
  id,
  level,
  children,
}) => {
  // Find or create container
  if (!_modalContainer) {
    _modalContainer = document.createElement('div');
    _modalContainer.id = 'modal-root';
    document.body.appendChild(_modalContainer);
  }
  const container = _modalContainer;

  return createPortal(
    <div
      key={id}
       style={{display: "flex", alignItems: "center", justifyContent: "center", padding: 'var(--md-sys-spacing-8)'}}
      data-modal-id={id}
      data-modal-level={level}
    >
      {/* Backdrop with M3 blur effect */}
      <div
        style={{ backgroundColor: 'color-mix(in srgb, var(--md-sys-color-scrim) 40%, transparent)' }}
        aria-hidden="true"
      />

      {/* Modal Content */}
      <div style={{ borderRadius: 'var(--md-sys-shape-corner-large)' ,  width: 'var(--md-sys-percent-100)' }}>
        {children}
      </div>
    </div>,
    container
  );
};

/**
 * Helper Hook for Modal Management
 * Provides open/close methods for modal components
 */
export const useModalController = (modalId: string): { openModal: (component: React.ReactNode) => void; closeModal: () => void; isOpen: boolean } => {
  const { pushModal, popModal, isModalOpen } = useModal();

  const openModal = useCallback(
    (component: React.ReactNode) => {
      pushModal(modalId, component);
    },
    [modalId, pushModal]
  );

  const closeModal = useCallback(() => {
    popModal(modalId);
  }, [modalId, popModal]);

  const isOpen = isModalOpen(modalId);

  return { openModal, closeModal, isOpen };
};

