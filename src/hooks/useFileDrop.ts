import { useState, useCallback, useRef } from 'react';

interface UseFileDropOptions {
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  onDrop?: (files: File[]) => void;
}

interface UseFileDropReturn {
  getRootProps: () => { onClick: () => void; onDragOver: (e: React.DragEvent) => void; onDragLeave: (e: React.DragEvent) => void; onDrop: (e: React.DragEvent) => void; };
  getInputProps: () => { type: string; accept?: string; multiple?: boolean; ref: React.RefObject<HTMLInputElement>; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; };
  isDragActive: boolean;
  open: () => void;
}

export function useFileDrop(options: UseFileDropOptions = {}): UseFileDropReturn {
  const { accept, multiple = false, disabled = false, onDrop } = options;
  const [isDragActive, setIsDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragActive(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      onDrop?.(files);
    }
  }, [disabled, onDrop]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onDrop?.(files);
    }
    // Reset input value to allow selecting the same file again
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }, [onDrop]);

  const open = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const getRootProps = useCallback(() => ({
    onClick: open,
    onDragOver: handleDragOver,
    onDragLeave: handleDragLeave,
    onDrop: handleDrop,
  }), [open, handleDragOver, handleDragLeave, handleDrop]);

  const getInputProps = useCallback(() => ({
    type: 'file',
    accept,
    multiple,
    ref: inputRef,
    onChange: handleInputChange,
  }), [accept, multiple, handleInputChange]);

  return {
    getRootProps,
    getInputProps,
    isDragActive,
    open,
  };
}

