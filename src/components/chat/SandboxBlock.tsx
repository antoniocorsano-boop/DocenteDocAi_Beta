/**
 * SandboxBlock.tsx — P37 Secure Sandbox Renderer
 *
 * Renders HTML previews or syntax-highlighted code inside a sandboxed iframe.
 *
 * Security measures:
 *   - sandbox="allow-same-origin" only — no scripts, no popups, no top-nav
 *   - Content injected via srcDoc (no external URL request)
 *   - Render timeout: iframe overlaid with error after MAX_RENDER_MS
 *   - No eval(), no dangerouslySetInnerHTML outside the controlled srcDoc builder
 *
 * Accessibility:
 *   - <iframe> carries a descriptive title
 *   - Copy button has aria-label
 *   - Loading spinners have aria-label
 */

import React, { useEffect, useRef, useState, memo } from 'react';
import {
  Alert,
  Box,
  CircularProgress,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CodeIcon        from '@mui/icons-material/Code';
import HtmlIcon        from '@mui/icons-material/Html';
import type { SandboxConfig } from '@/types/uiBlocks';

// ── Constants ─────────────────────────────────────────────────────────────────

const MAX_RENDER_MS = 5_000;

// ── srcDoc builder ────────────────────────────────────────────────────────────

/**
 * Builds a complete srcdoc string.
 * HTML content is used as-is (within the sandboxed iframe).
 * Code content is escaped and wrapped in a styled <pre>.
 */
function buildSrcDoc(config: SandboxConfig): string {
  if (config.html) {
    return [
      '<!DOCTYPE html>',
      '<html lang="it">',
      '<head>',
      '  <meta charset="utf-8">',
      '  <meta name="viewport" content="width=device-width, initial-scale=1">',
      '  <style>',
      '    * { box-sizing: border-box; }',
      '    body { margin: 0; padding: 12px; font-family: sans-serif; font-size: 14px; line-height: 1.5; }',
      '  </style>',
      '</head>',
      `<body>${config.html}</body>`,
      '</html>',
    ].join('\n');
  }

  if (config.code) {
    // Escape for safe embedding inside a <pre> — no actual script execution
    const escaped = config.code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

    return [
      '<!DOCTYPE html>',
      '<html lang="it">',
      '<head>',
      '  <meta charset="utf-8">',
      '  <style>',
      '    body { margin: 0; background: #1e1e1e; }',
      '    pre  { margin: 0; padding: 14px; color: #d4d4d4; font-family: "Cascadia Code", "Fira Code", monospace;',
      '           font-size: 13px; line-height: 1.55; overflow: auto; white-space: pre-wrap; word-break: break-all; }',
      '  </style>',
      '</head>',
      `<body><pre>${escaped}</pre></body>`,
      '</html>',
    ].join('\n');
  }

  return '<html><body><p style="font-family:sans-serif;color:#888;padding:16px">Nessun contenuto.</p></body></html>';
}

// ── Component ─────────────────────────────────────────────────────────────────

interface SandboxBlockProps {
  config: SandboxConfig;
}

export const SandboxBlock = memo(function SandboxBlock({ config }: SandboxBlockProps) {
  const iframeRef              = useRef<HTMLIFrameElement | null>(null);
  const timerRef               = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [copied,    setCopied  ] = useState(false);
  const [isLoading, setLoading ] = useState(true);
  const [timedOut,  setTimedOut] = useState(false);

  const srcDoc    = buildSrcDoc(config);
  const isCode    = Boolean(config.code) && !config.html;
  const iframeMin = isCode ? 120 : 200;
  const label     = config.language ?? (config.html ? 'HTML Preview' : 'Codice');
  const copyText  = config.code ?? config.html ?? '';

  // Timeout guard
  useEffect(() => {
    setLoading(true);
    setTimedOut(false);
    timerRef.current = setTimeout(() => {
      setTimedOut(true);
      setLoading(false);
    }, MAX_RENDER_MS);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [srcDoc]);

  const handleLoad = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setLoading(false);
  };

  const handleCopy = () => {
    if (!copyText) return;
    navigator.clipboard.writeText(copyText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2_000);
    }).catch(() => undefined);
  };

  return (
    <Paper variant="outlined" sx={{ borderRadius: 1, overflow: 'hidden' }}>
      {/* Toolbar */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{
          px:              1.5,
          py:              0.75,
          borderBottom:    '1px solid',
          borderColor:     'divider',
          backgroundColor: 'action.hover',
        }}
      >
        <Stack direction="row" spacing={0.75} alignItems="center">
          {config.html
            ? <HtmlIcon fontSize="small" sx={{ color: 'text.secondary' }} aria-hidden="true" />
            : <CodeIcon fontSize="small" sx={{ color: 'text.secondary' }} aria-hidden="true" />
          }
          <Typography variant="caption" color="text.secondary">
            {label}
          </Typography>
        </Stack>

        {copyText && (
          <Tooltip title={copied ? 'Copiato!' : 'Copia contenuto'}>
            <IconButton size="small" onClick={handleCopy} aria-label="Copia contenuto del blocco">
              <ContentCopyIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Tooltip>
        )}
      </Stack>

      {/* Content area */}
      <Box sx={{ position: 'relative', minHeight: iframeMin }}>
        {/* Loading overlay */}
        {isLoading && !timedOut && (
          <Box sx={{
            position:       'absolute',
            inset:          0,
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            zIndex:         1,
            backgroundColor: 'background.paper',
          }}>
            <CircularProgress size={24} aria-label="Caricamento anteprima" />
          </Box>
        )}

        {timedOut ? (
          <Box sx={{ p: 1.5 }}>
            <Alert severity="warning" variant="outlined">
              Timeout del rendering — il contenuto è troppo pesante per l'anteprima in linea.
            </Alert>
          </Box>
        ) : (
          <Box
            component="iframe"
            ref={iframeRef}
            srcDoc={srcDoc}
            title={`Anteprima: ${label}`}
            onLoad={handleLoad}
            sandbox="allow-same-origin"
            sx={{
              border:     'none',
              width:      '100%',
              minHeight:  iframeMin,
              maxHeight:  420,
              display:    isLoading ? 'none' : 'block',
              overflow:   'hidden',
            }}
          />
        )}
      </Box>
    </Paper>
  );
});
