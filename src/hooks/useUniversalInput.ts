/**
 * useUniversalInput.ts
 *
 * Global invisible input layer — intercepts paste, drag & drop, and file events
 * anywhere in the workspace and feeds them into the Cognitive Layer via ingestInput().
 *
 * Responsibilities:
 *   1. Listen to window-level paste / drop / dragover events
 *   2. Normalize raw input → { content, label, inputType, meta }
 *   3. Validate: block files > 10 MB, reject unsupported MIME types
 *   4. Call ingestInput() — does NOT duplicate store/service logic
 *   5. Emit toast feedback via useUIStore
 *   6. Return isProcessing so JarvisIndicator can show "processing" state
 *
 * DOES NOT:
 *   - Open ThumbMenu automatically (Jarvis scoring selects the entry)
 *   - Duplicate existing paste handling from UserWorkspace (that block is removed)
 *   - Create new stores or services
 *
 * Security:
 *   - Max file size: 10 MB
 *   - Allowed MIME types: text/*, image/*, application/pdf
 *   - Skips paste events originating from editable fields (input, textarea, contenteditable)
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { ingestInput }     from '../modules/cognitiveLayer';
import { useUIStore }      from '../stores/useUIStore';
import type { CognitiveInputType } from '../modules/cognitiveLayer/types';

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

/** MIME type prefixes accepted by the Cognitive Layer. */
const ALLOWED_MIME_PREFIXES = ['text/', 'image/'];
const ALLOWED_MIME_EXACT    = new Set(['application/pdf']);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isAllowedMime(mimeType: string): boolean {
  return (
    ALLOWED_MIME_PREFIXES.some(p => mimeType.startsWith(p)) ||
    ALLOWED_MIME_EXACT.has(mimeType)
  );
}

/**
 * Returns true if the current focused element is an editable field.
 * Paste events inside <input>, <textarea>, or contenteditable should pass through
 * to the native handler — we do not intercept them.
 */
function isFocusedOnEditable(): boolean {
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName.toLowerCase();
  if (tag === 'input' || tag === 'textarea') return true;
  if ((el as HTMLElement).isContentEditable) return true;
  return false;
}

/** Strip HTML tags and return plain text. */
function stripHtml(html: string): string {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent ?? '';
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface UseUniversalInputOptions {
  tenantId: string;
}

export interface UseUniversalInputResult {
  /** True during ingest + 1.5 s cooldown — used to drive JarvisIndicator "processing" state. */
  isProcessing: boolean;
}

export function useUniversalInput({
  tenantId,
}: UseUniversalInputOptions): UseUniversalInputResult {

  const [isProcessing, setIsProcessing] = useState(false);
  const processingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startProcessing = useCallback(() => {
    setIsProcessing(true);
    if (processingTimerRef.current) clearTimeout(processingTimerRef.current);
    processingTimerRef.current = setTimeout(() => setIsProcessing(false), 1500);
  }, []);

  // ── Core ingest dispatcher ──────────────────────────────────────────────────
  const ingest = useCallback(async (
    content:   string,
    label:     string,
    inputType: CognitiveInputType,
    source:    'paste' | 'upload',
    meta?:     Record<string, unknown>,
  ) => {
    if (inputType === 'text' && !content.trim()) return;
    const { actions } = useUIStore.getState();
    startProcessing();
    try {
      await ingestInput({
        tenantId,
        sourceId:  `universal-${source}-${Date.now()}`,
        inputType,
        content,
        label,
        meta: { source, ...meta },
      });
      actions.showToast('Contenuto acquisito', 'success');
    } catch {
      actions.showToast("Errore durante l'acquisizione", 'error');
    }
  }, [tenantId, startProcessing]);

  // ── File dispatcher (shared by drop + file picker if needed) ───────────────
  const dispatchFile = useCallback((file: File) => {
    if (file.size > MAX_FILE_BYTES) {
      useUIStore.getState().actions.showToast(
        `${file.name}: file troppo grande (max 10 MB)`, 'error',
      );
      return;
    }
    if (!isAllowedMime(file.type)) {
      useUIStore.getState().actions.showToast(
        `${file.name}: tipo non supportato`, 'info',
      );
      return;
    }

    if (file.type === 'application/pdf') {
      // PDF: pass filename + size as content (no in-browser text extraction needed)
      void ingest(
        `[PDF] ${file.name}`,
        file.name,
        'file',
        'upload',
        { fileName: file.name, mimeType: file.type, size: file.size },
      );
      return;
    }

    const reader = new FileReader();
    if (file.type.startsWith('image/')) {
      reader.onload = () => {
        void ingest(
          reader.result as string,
          file.name,
          'file',
          'upload',
          { fileName: file.name, mimeType: file.type },
        );
      };
      reader.readAsDataURL(file);
    } else {
      // text/* files
      reader.onload = () => {
        void ingest(
          reader.result as string,
          file.name,
          'file',
          'upload',
          { fileName: file.name, mimeType: file.type },
        );
      };
      reader.readAsText(file);
    }
  }, [ingest]);

  // ── Paste handler ───────────────────────────────────────────────────────────
  const handlePaste = useCallback((e: ClipboardEvent) => {
    // Let native behaviour handle paste inside editable fields
    if (isFocusedOnEditable()) return;

    const items = Array.from(e.clipboardData?.items ?? []);
    if (items.length === 0) return;

    // Priority 1 — images (clipboard screenshot, copy-from-browser)
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (!file) continue;
        if (file.size > MAX_FILE_BYTES) {
          useUIStore.getState().actions.showToast('Immagine troppo grande (max 10 MB)', 'error');
          return;
        }
        e.preventDefault();
        const ts = new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
        const reader = new FileReader();
        reader.onload = () => {
          void ingest(
            reader.result as string,
            `Immagine ${ts}`,
            'file',
            'paste',
            { mimeType: item.type },
          );
        };
        reader.readAsDataURL(file);
        return;
      }
    }

    // Priority 2 — HTML (email, web page, registro)
    const html  = e.clipboardData?.getData('text/html')  ?? '';
    const plain = e.clipboardData?.getData('text/plain') ?? '';

    if (html.trim()) {
      const stripped = stripHtml(html).trim();
      if (stripped) {
        e.preventDefault();
        void ingest(stripped, 'Contenuto HTML incollato', 'text', 'paste', {
          mimeType: 'text/html',
        });
        return;
      }
    }

    // Priority 3 — plain text
    if (plain.trim()) {
      e.preventDefault();
      void ingest(plain.trim(), plain.trim().slice(0, 60), 'text', 'paste', {
        mimeType: 'text/plain',
      });
    }
  }, [ingest]);

  // ── Drag & Drop handlers ────────────────────────────────────────────────────
  const handleDragOver = useCallback((e: DragEvent) => {
    // Prevent browser from navigating to the file
    e.preventDefault();
  }, []);

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer?.files ?? []);
    if (files.length === 0) return;
    files.forEach(dispatchFile);
  }, [dispatchFile]);

  // ── Register listeners ──────────────────────────────────────────────────────
  useEffect(() => {
    window.addEventListener('paste',    handlePaste);
    window.addEventListener('drop',     handleDrop);
    window.addEventListener('dragover', handleDragOver);

    return () => {
      window.removeEventListener('paste',    handlePaste);
      window.removeEventListener('drop',     handleDrop);
      window.removeEventListener('dragover', handleDragOver);
      if (processingTimerRef.current) clearTimeout(processingTimerRef.current);
    };
  }, [handlePaste, handleDrop, handleDragOver]);

  return { isProcessing };
}
