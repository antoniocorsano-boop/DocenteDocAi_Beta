import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '../../src/hooks/useDebounce';

describe('useDebounce', () => {
  it('should return initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 500));
    expect(result.current).toBe('initial');
  });

  it('should debounce value changes', () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 500), {
      initialProps: { value: 'initial' }
    });

    expect(result.current).toBe('initial');

    // Change value
    rerender({ value: 'changed' });
    expect(result.current).toBe('initial'); // Still initial

    // Fast forward time
    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current).toBe('changed');
    vi.useRealTimers();
  });

  it('should clear timeout on unmount', () => {
    vi.useFakeTimers();
    const spy = vi.spyOn(global, 'clearTimeout');
    const { unmount } = renderHook(() => useDebounce('value', 500));
    
    unmount();
    expect(spy).toHaveBeenCalled();
    vi.useRealTimers();
  });
});
