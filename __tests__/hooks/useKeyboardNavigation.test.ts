import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useKeyboardNavigation } from '../../src/hooks/useKeyboardNavigation';

describe('useKeyboardNavigation', () => {
  let container: HTMLDivElement;
  let button1: HTMLButtonElement;
  let button2: HTMLButtonElement;

  beforeEach(() => {
    container = document.createElement('div');
    button1 = document.createElement('button');
    button2 = document.createElement('button');
    container.appendChild(button1);
    container.appendChild(button2);
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
    vi.restoreAllMocks();
  });

  it('should handle Escape key', () => {
    const onClose = vi.fn();
    renderHook(() => useKeyboardNavigation(true, onClose));
    
    const event = new KeyboardEvent('keydown', { key: 'Escape' });
    document.dispatchEvent(event);
    
    expect(onClose).toHaveBeenCalled();
  });

  it('should handle Tab key (forward)', () => {
    const { result } = renderHook(() => useKeyboardNavigation(true));
    (result.current as any).current = container;
    
    button2.focus();
    const event = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: false });
    document.dispatchEvent(event);
    
    expect(document.activeElement).toBe(button1);
  });

  it('should handle Tab key (backward)', () => {
    const { result } = renderHook(() => useKeyboardNavigation(true));
    (result.current as any).current = container;
    
    button1.focus();
    const event = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true });
    document.dispatchEvent(event);
    
    expect(document.activeElement).toBe(button2);
  });

  it('should do nothing on Tab if no focusable elements', () => {
    const emptyContainer = document.createElement('div');
    document.body.appendChild(emptyContainer);
    const { result } = renderHook(() => useKeyboardNavigation(true));
    (result.current as any).current = emptyContainer;
    
    const event = new KeyboardEvent('keydown', { key: 'Tab' });
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
    document.dispatchEvent(event);
    
    expect(preventDefaultSpy).not.toHaveBeenCalled();
    document.body.removeChild(emptyContainer);
  });

  it('should not focus if focusOnOpen is false', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useKeyboardNavigation(true, undefined, { focusOnOpen: false }));
    (result.current as any).current = container;
    
    act(() => {
      vi.advanceTimersByTime(100);
    });
    
    expect(document.activeElement).not.toBe(button1);
    vi.useRealTimers();
  });

  it('should handle focus restoration when element has no focus method', () => {
    vi.useFakeTimers();
    const prevElement = { focus: null } as any;
    // Mock document.activeElement
    const originalActiveElement = document.activeElement;
    Object.defineProperty(document, 'activeElement', { value: prevElement, configurable: true });
    
    const { unmount } = renderHook(() => useKeyboardNavigation(true, undefined, { restoreFocus: true }));
    
    unmount();
    
    act(() => {
      vi.advanceTimersByTime(100);
    });
    
    // Should not crash
    Object.defineProperty(document, 'activeElement', { value: originalActiveElement, configurable: true });
    vi.useRealTimers();
  });

  it('should focus first element on open', async () => {
    vi.useFakeTimers();
    const focusSpy = vi.spyOn(button1, 'focus');
    const { result, rerender } = renderHook(({ isOpen }) => useKeyboardNavigation(isOpen, undefined, { focusOnOpen: true }), {
      initialProps: { isOpen: false }
    });
    
    // Set the ref
    (result.current as any).current = container;
    
    rerender({ isOpen: true });
    
    act(() => {
      vi.advanceTimersByTime(100);
    });
    
    expect(focusSpy).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('should restore focus on close', async () => {
    vi.useFakeTimers();
    const prevElement = document.createElement('button');
    document.body.appendChild(prevElement);
    const focusSpy = vi.spyOn(prevElement, 'focus');
    prevElement.focus();
    
    const { result, unmount } = renderHook(() => useKeyboardNavigation(true, undefined, { restoreFocus: true }));
    
    (result.current as any).current = container;
    
    unmount();
    
    act(() => {
      vi.advanceTimersByTime(100);
    });
    
    expect(focusSpy).toHaveBeenCalled();
    document.body.removeChild(prevElement);
    vi.useRealTimers();
  });
});
