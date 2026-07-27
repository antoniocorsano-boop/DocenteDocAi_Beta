/**
 * CommandPalette.tsx — Raycast-style command palette (Ctrl+K).
 *
 * Overlay fullscreen con input di testo, parsing skill via SkillRegistry
 * e fuzzy-match sui label. Mostra max 8 risultati, naviga con ↑↓, esegue
 * con Enter.
 *
 * Shortcut attivi:
 *   Ctrl+K   → apre/chiude
 *   ↑↓       → naviga risultati
 *   Enter    → esegue azione selezionata
 *   Esc      → chiude
 *
 * MD3 Gold Compliant:
 *   - M3Surface per overlay e item
 *   - nessun div per container visivi
 *   - fontWeight via token
 *   - aria-* per accessibilità
 */

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import Box        from '@mui/material/Box';
import Chip       from '@mui/material/Chip';
import Divider    from '@mui/material/Divider';
import InputBase  from '@mui/material/InputBase';
import Stack      from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import SearchIcon        from '@mui/icons-material/Search';
import AutoAwesomeIcon   from '@mui/icons-material/AutoAwesome';
import ChevronRightIcon  from '@mui/icons-material/ChevronRight';

import M3Surface from './M3Surface';
import { skillRegistry } from '../../modules/orchestration/skillRegistry';
import type { OrbitSkill } from '../../modules/orchestration/skillRegistry';

// ─── Fuzzy match ──────────────────────────────────────────────────────────────

/**
 * Ritorna true se ogni carattere del pattern appare in ordine in str.
 * (fuzzy subsequence — stesso algoritmo di Raycast)
 */
function fuzzyMatch(str: string, pattern: string): boolean {
  if (!pattern) return true;
  const s = str.toLowerCase();
  const p = pattern.toLowerCase();
  let pi = 0;
  for (let si = 0; si < s.length && pi < p.length; si++) {
    if (s[si] === p[pi]) pi++;
  }
  return pi === p.length;
}

function scoreMatch(skill: OrbitSkill, pattern: string): number {
  if (!pattern) return 0;
  const lbl = skill.label.toLowerCase();
  const p   = pattern.toLowerCase();
  // Exact prefix = highest score
  if (lbl.startsWith(p)) return 100;
  // Contains = good
  if (lbl.includes(p)) return 60;
  // Fuzzy = lower
  return fuzzyMatch(lbl, p) ? 30 : -1;
}

// ─── Domain labels ────────────────────────────────────────────────────────────

const DOMAIN_LABEL: Record<string, string> = {
  pedagogical:    'Didattica',
  compliance:     'Compliance',
  administrative: 'Amministrativo',
  technical:      'Tecnico',
  operational:    'Operativo',
  commercial:     'Commerciale',
  unknown:        'Altro',
};

// ─── Props ────────────────────────────────────────────────────────────────────

export interface CommandPaletteProps {
  open:      boolean;
  onClose:   () => void;
  onExecute: (ctaType: string) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

const MAX_RESULTS = 8;

export default function CommandPalette({
  open,
  onClose,
  onExecute,
}: CommandPaletteProps): React.JSX.Element | null {
  const [query,    setQuery]   = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef  = useRef<HTMLDivElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery('');
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Keyboard handler
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!open) return;
    if (e.key === 'Escape') { e.preventDefault(); onClose(); }
  }, [open, onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Results computation
  const results = useMemo(() => {
    const all = skillRegistry.list();
    return all
      .map(skill => ({ skill, score: scoreMatch(skill, query) }))
      .filter(x => x.score >= 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_RESULTS)
      .map(x => x.skill);
  }, [query]);

  const handleSelect = useCallback((ctaType: string) => {
    onExecute(ctaType);
    onClose();
  }, [onExecute, onClose]);

  const handleInputKey = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelected(s => Math.min(s + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelected(s => Math.max(s - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selected]) handleSelect(results[selected].ctaType);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  }, [results, selected, handleSelect, onClose]);

  // Scroll selected item into view
  useEffect(() => {
    const el = listRef.current?.children[selected] as HTMLElement | undefined;
    el?.scrollIntoView({ block: 'nearest' });
  }, [selected]);

  if (!open) return null;

  return (
    // Backdrop
    <Box
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Palette comandi"
      sx={{
        position:        'fixed',
        inset:           0,
        zIndex:          1500,
        bgcolor:         'rgba(0,0,0,0.45)',
        display:         'flex',
        alignItems:      'flex-start',
        justifyContent:  'center',
        pt:              '14vh',
        backdropFilter:  'blur(2px)',
        animation:       'cpIn 120ms ease-out',
        '@keyframes cpIn': {
          from: { opacity: 0 },
          to:   { opacity: 1 },
        },
      }}
    >
      {/* Palette panel */}
      <M3Surface
        elevation={4}
        onClick={e => e.stopPropagation()}
        aria-label={undefined}
        sx={{
          width:        580,
          maxWidth:     '92vw',
          borderRadius:  3,
          overflow:      'hidden',
          display:       'flex',
          flexDirection: 'column',
          animation:     'cpPanelIn 140ms ease-out',
          '@keyframes cpPanelIn': {
            from: { opacity: 0, transform: 'translateY(-10px) scale(0.98)' },
            to:   { opacity: 1, transform: 'translateY(0) scale(1)' },
          },
        }}
      >
        {/* Input row */}
        <Stack
          direction="row"
          alignItems="center"
          spacing={1.5}
          sx={{
            px:           2,
            py:           1.25,
            borderBottom: '1px solid var(--md-sys-color-outline-variant)',
          }}
        >
          <SearchIcon
            sx={{
              fontSize:  'var(--md-sys-icon-size-md, 20px)',
              color:     'var(--md-sys-color-on-surface-variant)',
              flexShrink: 0,
            }}
            aria-hidden
          />
          <InputBase
            inputRef={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setSelected(0); }}
            onKeyDown={handleInputKey}
            placeholder="Cerca azione o skill…"
            aria-label="Cerca skill o azione"
            fullWidth
            sx={{
              fontSize:    'var(--md-sys-typescale-body-large-font-size, 1rem)',
              color:       'var(--md-sys-color-on-surface)',
              '& .MuiInputBase-input::placeholder': {
                color:   'var(--md-sys-color-on-surface-variant)',
                opacity: 1,
              },
            }}
          />
          <Chip
            label="Esc"
            size="small"
            variant="outlined"
            onClick={onClose}
            aria-label="Chiudi palette"
            sx={{
              height:      20,
              fontSize:    10,
              cursor:      'pointer',
              borderColor: 'var(--md-sys-color-outline)',
              color:       'var(--md-sys-color-on-surface-variant)',
              flexShrink:  0,
            }}
          />
        </Stack>

        {/* Results list */}
        <Box
          ref={listRef}
          role="listbox"
          aria-label="Risultati ricerca"
          sx={{ maxHeight: 360, overflowY: 'auto' }}
        >
          {results.length === 0 ? (
            <Stack alignItems="center" justifyContent="center" sx={{ py: 4 }}>
              <Typography
                variant="body2"
                sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}
              >
                Nessun risultato per «{query}»
              </Typography>
            </Stack>
          ) : (
            results.map((skill, idx) => (
              <React.Fragment key={skill.ctaType}>
                {idx > 0 && <Divider sx={{ opacity: 0.4 }} />}
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={1.5}
                  role="option"
                  aria-selected={idx === selected}
                  onClick={() => handleSelect(skill.ctaType)}
                  onMouseEnter={() => setSelected(idx)}
                  tabIndex={-1}
                  sx={{
                    px:      2,
                    py:      0.875,
                    cursor:  'pointer',
                    bgcolor: idx === selected
                      ? 'var(--md-sys-color-surface-container)'
                      : 'transparent',
                    transition: 'background-color 80ms',
                    '&:hover': { bgcolor: 'var(--md-sys-color-surface-container-low)' },
                  }}
                >
                  <AutoAwesomeIcon
                    sx={{
                      fontSize:   'var(--md-sys-icon-size-sm, 16px)',
                      color:      idx === selected
                        ? 'var(--md-sys-color-primary)'
                        : 'var(--md-sys-color-on-surface-variant)',
                      flexShrink: 0,
                      transition: 'color 80ms',
                    }}
                    aria-hidden
                  />
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography
                      variant="labelMedium"
                      component="p"
                      sx={{
                        color:      'var(--md-sys-color-on-surface)',
                        fontWeight: idx === selected
                          ? 'var(--md-sys-typescale-weight-semibold)'
                          : 'var(--md-sys-typescale-weight-regular)',
                      }}
                    >
                      {skill.label}
                    </Typography>
                    <Typography
                      variant="labelSmall"
                      sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}
                    >
                      {DOMAIN_LABEL[skill.domain] ?? skill.domain}
                    </Typography>
                  </Box>
                  {idx === selected && (
                    <Chip
                      label="Enter"
                      size="small"
                      variant="outlined"
                      aria-hidden
                      sx={{
                        height:      18,
                        fontSize:    10,
                        borderColor: 'var(--md-sys-color-primary)',
                        color:       'var(--md-sys-color-primary)',
                        flexShrink:  0,
                      }}
                    />
                  )}
                  <ChevronRightIcon
                    sx={{
                      fontSize:   'var(--md-sys-icon-size-sm, 16px)',
                      color:      'var(--md-sys-color-on-surface-variant)',
                      opacity:    idx === selected ? 1 : 0.4,
                      flexShrink: 0,
                    }}
                    aria-hidden
                  />
                </Stack>
              </React.Fragment>
            ))
          )}
        </Box>

        {/* Footer hint */}
        <Stack
          direction="row"
          spacing={2}
          sx={{
            px:         2,
            py:         1,
            borderTop:  '1px solid var(--md-sys-color-outline-variant)',
            bgcolor:    'var(--md-sys-color-surface-container-lowest)',
          }}
          aria-hidden
        >
          {[['↑↓', 'naviga'], ['↵', 'esegui'], ['Esc', 'chiudi']].map(([key, act]) => (
            <Stack key={key} direction="row" spacing={0.75} alignItems="center">
              <Chip
                label={key}
                size="small"
                variant="outlined"
                sx={{
                  height: 18, fontSize: 10,
                  borderColor: 'var(--md-sys-color-outline)',
                  color:       'var(--md-sys-color-on-surface-variant)',
                }}
              />
              <Typography variant="labelSmall" sx={{ color: 'var(--md-sys-color-outline)' }}>
                {act}
              </Typography>
            </Stack>
          ))}
        </Stack>
      </M3Surface>
    </Box>
  );
}
