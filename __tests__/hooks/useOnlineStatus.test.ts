import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useOnlineStatus } from '../../src/hooks/useOnlineStatus';

describe('useOnlineStatus', () => {
  const originalNavigator = global.navigator;

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    Object.defineProperty(global, 'navigator', {
      value: originalNavigator,
      configurable: true
    });
  });

  it('should return initial online status', () => {
    Object.defineProperty(global, 'navigator', {
      value: { onLine: true },
      configurable: true
    });
    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(true);
  });

  it('should return initial offline status', () => {
    Object.defineProperty(global, 'navigator', {
      value: { onLine: false },
      configurable: true
    });
    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(false);
  });

  it('should update status when going online', () => {
    Object.defineProperty(global, 'navigator', {
      value: { onLine: false },
      configurable: true
    });
    const { result } = renderHook(() => useOnlineStatus());
    
    act(() => {
      window.dispatchEvent(new Event('online'));
    });
    
    expect(result.current).toBe(true);
  });

  it('should update status when going offline', () => {
    Object.defineProperty(global, 'navigator', {
      value: { onLine: true },
      configurable: true
    });
    const { result } = renderHook(() => useOnlineStatus());
    
    act(() => {
      window.dispatchEvent(new Event('offline'));
    });
    
    expect(result.current).toBe(false);
  });

  it('should cleanup event listeners on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
    const { unmount } = renderHook(() => useOnlineStatus());
    
    unmount();
    
    expect(removeEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function));
  });
});
