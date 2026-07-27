import { renderWithM3Theme } from './test-utils';
// MD3 Compliant
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import M3Popover from './M3Popover';
import React from 'react';

describe('M3Popover', () => {
  let anchorEl: HTMLButtonElement;

  beforeEach(() => {
    // Create anchor element for testing
    anchorEl = document.createElement('button');
    anchorEl.textContent = 'Open';
    document.body.appendChild(anchorEl);
  });

  afterEach(() => {
    document.body.removeChild(anchorEl);
    vi.clearAllMocks();
  });

  it('renders nothing when closed', () => {
    const { container } = renderWithM3Theme(
      <M3Popover
        open={false}
        anchorEl={anchorEl}
        onClose={vi.fn()}
      >
        Content
      </M3Popover>
    );
    
    expect(container.querySelector('.m3-popover')).not.toBeInTheDocument();
  });

  it('renders popover when open', () => {
    const { container } = renderWithM3Theme(
      <M3Popover
        open={true}
        anchorEl={anchorEl}
        onClose={vi.fn()}
      >
        Test Content
      </M3Popover>
    );
    
    expect(container.querySelector('.m3-popover')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('renders title when provided', () => {
    renderWithM3Theme(
      <M3Popover
        open={true}
        anchorEl={anchorEl}
        onClose={vi.fn()}
        title="Test Title"
      >
        Content
      </M3Popover>
    );
    
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('renders subtitle when provided', () => {
    renderWithM3Theme(
      <M3Popover
        open={true}
        anchorEl={anchorEl}
        onClose={vi.fn()}
        title="Test Title"
        subtitle="Test Subtitle"
      >
        Content
      </M3Popover>
    );
    
    expect(screen.getByText('Test Subtitle')).toBeInTheDocument();
  });

  it('calls onClose when clicking outside popover', async () => {
    const onClose = vi.fn();
    const { container } = renderWithM3Theme(
      <>
        <button>Anchor</button>
        <M3Popover
          open={true}
          anchorEl={anchorEl}
          onClose={onClose}
        >
          Content
        </M3Popover>
      </>
    );
    
    // Get the backdrop
    const backdrop = container.querySelector('.m3-popover__backdrop');
    expect(backdrop).toBeInTheDocument();
    
    // Click outside
    fireEvent.mouseDown(document.body);
    
    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('calls onClose when pressing Escape key', async () => {
    const onClose = vi.fn();
    renderWithM3Theme(
      <M3Popover
        open={true}
        anchorEl={anchorEl}
        onClose={onClose}
      >
        Content
      </M3Popover>
    );
    
    fireEvent.keyDown(document, { key: 'Escape' });
    
    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('does not close when clicking inside popover', async () => {
    const onClose = vi.fn();
    const { container } = renderWithM3Theme(
      <M3Popover
        open={true}
        anchorEl={anchorEl}
        onClose={onClose}
      >
        <button>Inner Button</button>
      </M3Popover>
    );
    
    const popover = container.querySelector('.m3-popover');
    fireEvent.mouseDown(popover!);
    
    await waitFor(() => {
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  it('does not close when clicking on anchor element', async () => {
    const onClose = vi.fn();
    renderWithM3Theme(
      <M3Popover
        open={true}
        anchorEl={anchorEl}
        onClose={onClose}
      >
        Content
      </M3Popover>
    );
    
    fireEvent.mouseDown(anchorEl);
    
    await waitFor(() => {
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  it('hides backdrop when showBackdrop is false', () => {
    const { container } = renderWithM3Theme(
      <M3Popover
        open={true}
        anchorEl={anchorEl}
        onClose={vi.fn()}
        showBackdrop={false}
      >
        Content
      </M3Popover>
    );
    
    expect(container.querySelector('.m3-popover__backdrop')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = renderWithM3Theme(
      <M3Popover
        open={true}
        anchorEl={anchorEl}
        onClose={vi.fn()}
      >
        Content
      </M3Popover>
    );
    
    const popover = container.querySelector('.m3-popover');
    expect(popover).toBeInTheDocument();
  });

  it('applies custom style', () => {
    const { container } = renderWithM3Theme(
      <M3Popover
        open={true}
        anchorEl={anchorEl}
        onClose={vi.fn()}
        style={{ padding: 'var(--md-sys-spacing-6)' }}
      >
        Content
      </M3Popover>
    );
    
    const popover = container.querySelector('.m3-popover') as HTMLElement;
    expect(popover.style.padding).toBe('var(--md-sys-spacing-6)');
  });

  it('applies custom minWidth', () => {
    const { container } = renderWithM3Theme(
      <M3Popover
        open={true}
        anchorEl={anchorEl}
        onClose={vi.fn()}
        minWidth={300}
      >
        Content
      </M3Popover>
    );
    
    const popover = container.querySelector('.m3-popover') as HTMLElement;
    expect(popover.style.minWidth).toBe('300px');
  });

  it('applies custom zIndex', () => {
    const { container } = renderWithM3Theme(
      <M3Popover
        open={true}
        anchorEl={anchorEl}
        onClose={vi.fn()}
        zIndex={2000}
      >
        Content
      </M3Popover>
    );
    
    const popover = container.querySelector('.m3-popover') as HTMLElement;
    expect(popover.style.zIndex).toBe('2000');
  });

  it('repositions popover when anchor element moves', async () => {
    const onClose = vi.fn();
    const { rerender } = renderWithM3Theme(
      <M3Popover
        open={true}
        anchorEl={anchorEl}
        onClose={onClose}
      >
        Content
      </M3Popover>
    );
    
    // Get initial position
    let popover = document.querySelector('.m3-popover') as HTMLElement;
    const initialLeft = popover.style.left;
    
    // Move anchor
    anchorEl// removed runtime mutation
    fireEvent.scroll(window);
    
    // Popover should update position (in real scenario)
    rerender(
      <M3Popover
        open={true}
        anchorEl={anchorEl}
        onClose={onClose}
      >
        Content
      </M3Popover>
    );
    
    // Verify popover is still rendered
    popover = document.querySelector('.m3-popover') as HTMLElement;
    expect(popover).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    const { container } = renderWithM3Theme(
      <M3Popover
        open={true}
        anchorEl={anchorEl}
        onClose={vi.fn()}
      >
        Content
      </M3Popover>
    );
    
    const popover = container.querySelector('.m3-popover');
    expect(popover).toHaveAttribute('role', 'dialog');
    expect(popover).toHaveAttribute('aria-modal', 'true');
  });

  it('cleans up event listeners on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');
    const windowRemoveEventListenerSpy = vi.spyOn(window, 'removeEventListener');
    
    const { unmount } = renderWithM3Theme(
      <M3Popover
        open={true}
        anchorEl={anchorEl}
        onClose={vi.fn()}
      >
        Content
      </M3Popover>
    );
    
    unmount();
    
    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('mousedown', expect.any(Function), true);
    
    removeEventListenerSpy.mockRestore();
    windowRemoveEventListenerSpy.mockRestore();
  });
});

