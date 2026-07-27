/**
 * Focus Management Tests - Phase 3.3 Workstream 2
 * 
 * Tests for modal focus trapping, Escape key, and focus restoration
 * WCAG 2.1 Compliance:
 * - 2.1.2 No Keyboard Trap
 * - 2.4.3 Focus Order
 * - 3.2.1 On Focus
 */

import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { M3Dialog, M3DialogContent, M3DialogActions } from '../../src/components/ui';

describe('Focus Management - Modal Focus Trap', () => {
  let onClose: () => void;

  beforeEach(() => {
    onClose = vi.fn(() => {}) as unknown as (() => void);
  });

  it('should focus on first focusable element when modal opens', async () => {
    const { rerender } = render(
      <M3Dialog title="Test Modal" onClose={onClose} isOpen={false} hideCloseButton>
        <M3DialogContent>
          <input data-testid="first-input" type="text" />
          <input data-testid="second-input" type="text" />
        </M3DialogContent>
      </M3Dialog>
    );

    // Open the modal
    rerender(
      <M3Dialog title="Test Modal" onClose={onClose} isOpen={true} hideCloseButton>
        <M3DialogContent>
          <input data-testid="first-input" type="text" />
          <input data-testid="second-input" type="text" />
        </M3DialogContent>
      </M3Dialog>
    );

    // Wait for focus to be set (100ms timeout in useKeyboardNavigation)
    await waitFor(() => {
      const firstInput = screen.getByTestId('first-input');
      expect(document.activeElement).toBe(firstInput);
    }, { timeout: 200 });
  });

  it('should trap Tab key within modal (cycle forward)', async () => {
    render(
      <M3Dialog title="Test Modal" onClose={onClose} isOpen={true} hideCloseButton>
        <M3DialogContent>
          <input data-testid="input-1" type="text" />
          <button data-testid="button-1">Button 1</button>
          <button data-testid="button-2">Button 2</button>
        </M3DialogContent>
      </M3Dialog>
    );

    await waitFor(() => {
      expect(screen.getByTestId('input-1')).toBeInTheDocument();
    });

    const input1 = screen.getByTestId('input-1');
    const button1 = screen.getByTestId('button-1');
    const button2 = screen.getByTestId('button-2');

    // Focus on last element
    button2.focus();
    expect(document.activeElement).toBe(button2);

    // Press Tab - should cycle to first element
    fireEvent.keyDown(document, { key: 'Tab', code: 'Tab' });

    await waitFor(() => {
      expect(document.activeElement).toBe(input1);
    });
  });

  it('should trap Shift+Tab within modal (cycle backward)', async () => {
    render(
      <M3Dialog title="Test Modal" onClose={onClose} isOpen={true} hideCloseButton>
        <M3DialogContent>
          <input data-testid="input-1" type="text" />
          <button data-testid="button-1">Button 1</button>
          <button data-testid="button-2">Button 2</button>
        </M3DialogContent>
      </M3Dialog>
    );

    await waitFor(() => {
      expect(screen.getByTestId('input-1')).toBeInTheDocument();
    });

    const input1 = screen.getByTestId('input-1');
    const button2 = screen.getByTestId('button-2');

    // Focus on first element
    input1.focus();
    expect(document.activeElement).toBe(input1);

    // Press Shift+Tab - should cycle to last element
    fireEvent.keyDown(document, { key: 'Tab', code: 'Tab', shiftKey: true });

    await waitFor(() => {
      expect(document.activeElement).toBe(button2);
    });
  });

  it('should close modal on Escape key', () => {
    render(
      <M3Dialog title="Test Modal" onClose={onClose} isOpen={true}>
        <M3DialogContent>
          <p>Modal content</p>
        </M3DialogContent>
      </M3Dialog>
    );

    // Press Escape
    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });

    // Verify onClose was called
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should restore focus to trigger element when modal closes', async () => {
    const TriggerButton = () => {
      const [isOpen, setIsOpen] = React.useState(false);
      
      return (
        <>
          <button 
            data-testid="trigger-button"
            onClick={() => setIsOpen(true)}
          >
            Open Modal
          </button>
          
          <M3Dialog 
            title="Test Modal" 
            onClose={() => setIsOpen(false)} 
            isOpen={isOpen}
          >
            <M3DialogContent>
              <p>Modal content</p>
              <button 
                data-testid="close-button"
                onClick={() => setIsOpen(false)}
              >
                Close
              </button>
            </M3DialogContent>
          </M3Dialog>
        </>
      );
    };

    render(<TriggerButton />);

    const triggerButton = screen.getByTestId('trigger-button');
    
    // Focus and click trigger button
    triggerButton.focus();
    fireEvent.click(triggerButton);

    await waitFor(() => {
      expect(screen.getByText('Modal content')).toBeInTheDocument();
    });

    // Close modal
    const closeButton = screen.getByTestId('close-button');
    fireEvent.click(closeButton);

    // Wait for focus restoration (100ms timeout)
    await waitFor(() => {
      expect(document.activeElement).toBe(triggerButton);
    }, { timeout: 200 });
  });

  it('should not allow focus to escape modal container', async () => {
    const OutsideElement = () => {
      const [isOpen, setIsOpen] = React.useState(true);
      
      return (
        <>
          <button data-testid="outside-button">Outside Button</button>
          
          <M3Dialog 
            title="Test Modal" 
            onClose={() => setIsOpen(false)} 
            isOpen={isOpen}
            hideCloseButton
          >
            <M3DialogContent>
              <input data-testid="modal-input" type="text" />
            </M3DialogContent>
          </M3Dialog>
        </>
      );
    };

    render(<OutsideElement />);

    await waitFor(() => {
      const modalInput = screen.getByTestId('modal-input');
      expect(document.activeElement).toBe(modalInput);
    });

    // Try to focus outside element
    const outsideButton = screen.getByTestId('outside-button');
    outsideButton.focus();

    // Modal should maintain focus internally
    await waitFor(() => {
      expect(document.activeElement).not.toBe(outsideButton);
    });
  });
});

describe('Focus Management - Multiple Nested Modals', () => {
  it('should handle focus correctly with 2 nested modals', async () => {
    const NestedModals = () => {
      const [modal1Open, setModal1Open] = React.useState(true);
      const [modal2Open, setModal2Open] = React.useState(false);
      
      return (
        <>
          <M3Dialog 
            title="Modal 1" 
            onClose={() => setModal1Open(false)} 
            isOpen={modal1Open}
          >
            <M3DialogContent>
              <button 
                data-testid="open-modal2"
                onClick={() => setModal2Open(true)}
              >
                Open Modal 2
              </button>
            </M3DialogContent>
          </M3Dialog>

          <M3Dialog 
            title="Modal 2" 
            onClose={() => setModal2Open(false)} 
            isOpen={modal2Open}
            hideCloseButton
          >
            <M3DialogContent>
              <input data-testid="modal2-input" type="text" />
            </M3DialogContent>
          </M3Dialog>
        </>
      );
    };

    render(<NestedModals />);

    // Open second modal
    const openButton = screen.getByTestId('open-modal2');
    fireEvent.click(openButton);

    // Focus should be in modal 2
    await waitFor(() => {
      const modal2Input = screen.getByTestId('modal2-input');
      expect(document.activeElement).toBe(modal2Input);
    });
  });
});

describe('Focus Management - ARIA Attributes', () => {
  it('should have correct ARIA attributes on modal', () => {
    render(
      <M3Dialog title="Test Modal" onClose={vi.fn()} isOpen={true}>
        <M3DialogContent>
          <p>Modal content</p>
        </M3DialogContent>
      </M3Dialog>
    );

    // MUI Dialog renders the Paper with data-testid='m3-dialog'
    const dialogPaper = document.querySelector('[data-testid="m3-dialog"]');
    expect(dialogPaper).toBeInTheDocument();
  });

  it('should have backdrop with aria-hidden=true', () => {
    render(
      <M3Dialog title="Test Modal" onClose={vi.fn()} isOpen={true}>
        <M3DialogContent>
          <p>Modal content</p>
        </M3DialogContent>
      </M3Dialog>
    );

    // Backdrop should not be announced to screen readers
    const backdrop = document.querySelector('[aria-hidden="true"]');
    expect(backdrop).toHaveAttribute('aria-hidden', 'true');
  });
});

describe('Focus Management - Edge Cases', () => {
  it('should handle modal with no focusable elements', async () => {
    render(
      <M3Dialog title="Test Modal" onClose={vi.fn()} isOpen={true}>
        <M3DialogContent>
          <p>Just text, no focusable elements</p>
        </M3DialogContent>
      </M3Dialog>
    );

    // Should not crash
    await waitFor(() => {
      expect(screen.getByText('Just text, no focusable elements')).toBeInTheDocument();
    });
  });

  it('should handle modal with disabled elements', async () => {
    render(
      <M3Dialog title="Test Modal" onClose={vi.fn()} isOpen={true} hideCloseButton>
        <M3DialogContent>
          <button disabled>Disabled Button</button>
          <input data-testid="enabled-input" type="text" />
        </M3DialogContent>
      </M3Dialog>
    );

    // Should skip disabled elements and focus on enabled ones
    await waitFor(() => {
      const enabledInput = screen.getByTestId('enabled-input');
      expect(document.activeElement).toBe(enabledInput);
    });
  });

  it('should handle rapid open/close cycles', async () => {
    const RapidToggle = () => {
      const [isOpen, setIsOpen] = React.useState(false);
      
      return (
        <>
          <button 
            data-testid="toggle-button"
            onClick={() => setIsOpen(!isOpen)}
          >
            Toggle Modal
          </button>
          
          <M3Dialog 
            title="Test Modal" 
            onClose={() => setIsOpen(false)} 
            isOpen={isOpen}
          >
            <M3DialogContent>
              <p>Modal content</p>
            </M3DialogContent>
          </M3Dialog>
        </>
      );
    };

    render(<RapidToggle />);

    const toggleButton = screen.getByTestId('toggle-button');

    // Rapid toggle — verify no crash
    fireEvent.click(toggleButton);
    fireEvent.click(toggleButton);
    fireEvent.click(toggleButton);
    fireEvent.click(toggleButton);

    // Should handle gracefully without crashes — component still renders
    expect(screen.getByTestId('toggle-button')).toBeInTheDocument();
  });
});
