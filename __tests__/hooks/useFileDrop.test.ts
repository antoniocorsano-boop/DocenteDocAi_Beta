import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFileDrop } from '../../src/hooks/useFileDrop';

describe('useFileDrop', () => {
  it('should initialize with default values', () => {
    const { result } = renderHook(() => useFileDrop());
    expect(result.current.isDragActive).toBe(false);
    expect(typeof result.current.getRootProps).toBe('function');
    expect(typeof result.current.getInputProps).toBe('function');
  });

  it('should handle drag over', () => {
    const { result } = renderHook(() => useFileDrop());
    const event = { preventDefault: vi.fn() } as any;
    
    act(() => {
      result.current.getRootProps().onDragOver(event);
    });
    
    expect(event.preventDefault).toHaveBeenCalled();
    expect(result.current.isDragActive).toBe(true);
  });

  it('should not set drag active if disabled', () => {
    const { result } = renderHook(() => useFileDrop({ disabled: true }));
    const event = { preventDefault: vi.fn() } as any;
    
    act(() => {
      result.current.getRootProps().onDragOver(event);
    });
    
    expect(result.current.isDragActive).toBe(false);
  });

  it('should handle drag leave', () => {
    const { result } = renderHook(() => useFileDrop());
    const event = { preventDefault: vi.fn() } as any;
    
    act(() => {
      result.current.getRootProps().onDragOver(event);
      result.current.getRootProps().onDragLeave(event);
    });
    
    expect(result.current.isDragActive).toBe(false);
  });

  it('should handle drop', () => {
    const onDrop = vi.fn();
    const { result } = renderHook(() => useFileDrop({ onDrop }));
    const files = [new File([''], 'test.txt')];
    const event = {
      preventDefault: vi.fn(),
      dataTransfer: { files }
    } as any;
    
    act(() => {
      result.current.getRootProps().onDrop(event);
    });
    
    expect(onDrop).toHaveBeenCalledWith(files);
    expect(result.current.isDragActive).toBe(false);
  });

  it('should not call onDrop if disabled', () => {
    const onDrop = vi.fn();
    const { result } = renderHook(() => useFileDrop({ onDrop, disabled: true }));
    const event = {
      preventDefault: vi.fn(),
      dataTransfer: { files: [new File([''], 'test.txt')] }
    } as any;
    
    act(() => {
      result.current.getRootProps().onDrop(event);
    });
    
    expect(onDrop).not.toHaveBeenCalled();
  });

  it('should handle input change', () => {
    const onDrop = vi.fn();
    const { result } = renderHook(() => useFileDrop({ onDrop }));
    const files = [new File([''], 'test.txt')];
    const event = {
      target: { files }
    } as any;
    
    act(() => {
      result.current.getInputProps().onChange(event);
    });
    
    expect(onDrop).toHaveBeenCalledWith(files);
  });

  it('should handle input change with no files', () => {
    const onDrop = vi.fn();
    const { result } = renderHook(() => useFileDrop({ onDrop }));
    const event = {
      target: { files: null }
    } as any;
    
    act(() => {
      result.current.getInputProps().onChange(event);
    });
    
    expect(onDrop).not.toHaveBeenCalled();
  });

  it('should handle drop with no files', () => {
    const onDrop = vi.fn();
    const { result } = renderHook(() => useFileDrop({ onDrop }));
    const event = {
      preventDefault: vi.fn(),
      dataTransfer: { files: [] }
    } as any;
    
    act(() => {
      result.current.getRootProps().onDrop(event);
    });
    
    expect(onDrop).not.toHaveBeenCalled();
  });

  it('should reset input value after change', () => {
    const onDrop = vi.fn();
    const { result } = renderHook(() => useFileDrop({ onDrop }));
    const input = { value: 'some-file.txt' } as any;
    (result.current.getInputProps() as any).ref.current = input;
    
    const event = {
      target: { files: [new File([''], 'test.txt')] }
    } as any;
    
    act(() => {
      result.current.getInputProps().onChange(event);
    });
    
    expect(input.value).toBe('');
  });

  it('should open file dialog on click', () => {
    const { result } = renderHook(() => useFileDrop());
    const clickSpy = vi.fn();
    
    // Mock the ref
    const input = { click: clickSpy, value: '' } as any;
    (result.current.getInputProps() as any).ref.current = input;
    
    act(() => {
      result.current.getRootProps().onClick();
    });
    
    expect(clickSpy).toHaveBeenCalled();
  });
});
