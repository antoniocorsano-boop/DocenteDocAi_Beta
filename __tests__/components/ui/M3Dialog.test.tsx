import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { M3Dialog } from '../../../src/components/ui/M3Dialog';

describe('M3Dialog Accessibility', () => {
  const onClose = vi.fn();

  beforeEach(() => {
    onClose.mockClear();
    // Mock focus methods
    HTMLElement.prototype.focus = vi.fn();
  });

  it('should render with correct ARIA roles', () => {
    render(
      <M3Dialog title="Test Dialog" onClose={onClose} isOpen={true}>
        <div>Content</div>
      </M3Dialog>
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'dialog-title');
  });

  it('should call onClose when Escape is pressed', () => {
    render(
      <M3Dialog title="Test Dialog" onClose={onClose} isOpen={true}>
        <div>Content</div>
      </M3Dialog>
    );

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('should focus the first focusable element on open', async () => {
    render(
      <M3Dialog title="Test Dialog" onClose={onClose} isOpen={true}>
        <button data-testid="first-btn">First</button>
        <button>Second</button>
      </M3Dialog>
    );

    // useKeyboardNavigation uses a small timeout (100ms)
    await waitFor(() => {
      expect(screen.getByTestId('first-btn').focus).toHaveBeenCalled();
    }, { timeout: 500 });
  });

  it('should trap focus within the dialog on Tab', async () => {
    render(
      <M3Dialog title="Test Dialog" onClose={onClose} isOpen={true}>
        <button data-testid="first-btn">First</button>
        <button data-testid="last-btn">Last</button>
      </M3Dialog>
    );

    const firstBtn = screen.getByTestId('first-btn');
    const lastBtn = screen.getByTestId('last-btn');

    // Mock activeElement
    Object.defineProperty(document, 'activeElement', {
      value: lastBtn,
      writable: true
    });

    // Tab on last element should wrap to the first focusable element in content
    fireEvent.keyDown(window, { key: 'Tab' });

    await waitFor(() => {
      expect(firstBtn.focus).toHaveBeenCalled();
    });
  });
});
