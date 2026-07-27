/**
 * LandingNav.tsx
 *
 * Sticky navigation bar for the public landing page.
 *
 * Features:
 * - Scroll-spy: active section is highlighted automatically
 * - Smooth-scroll to anchor on click
 * - Mobile: collapsible hamburger menu
 * - Thin reading-progress bar below the nav
 */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import Container from '@mui/material/Container';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import PsychologyIcon from '@mui/icons-material/Psychology';

// ── nav links ─────────────────────────────────────────────────────────────────

export const NAV_LINKS = [
  { id: 'hero',          label: 'Home' },
  { id: 'demo',          label: 'Demo' },
  { id: 'come-funziona', label: 'Come funziona' },
  { id: 'funzionalita',  label: 'Funzionalità' },
  { id: 'per-chi',       label: 'Per chi' },
  { id: 'guida',         label: 'Guida' },
  { id: 'valori',        label: 'Valori' },
  { id: 'etica-ai',      label: 'Etica AI' },
  { id: 'partecipa',     label: 'Partecipa' },
] as const;

// ── helpers ───────────────────────────────────────────────────────────────────

function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ── main component ────────────────────────────────────────────────────────────

const LandingNav: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeId, setActiveId] = useState<string>('');
  const [scrollProgress, setScrollProgress] = useState(0);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Scroll-spy via IntersectionObserver
  useEffect(() => {
    const ids = NAV_LINKS.map(l => l.id);

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible.length) setActiveId(visible[0].target.id);
      },
      { threshold: 0.2 }
    );

    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) observerRef.current!.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, []);

  // Reading progress bar
  useEffect(() => {
    const handle = () => {
      const el = document.documentElement;
      const scrolled = el.scrollTop / (el.scrollHeight - el.clientHeight);
      setScrollProgress(Math.round(Math.min(scrolled * 100, 100)));
    };
    window.addEventListener('scroll', handle, { passive: true });
    return () => window.removeEventListener('scroll', handle);
  }, []);

  const handleNav = useCallback((id: string) => {
    scrollToSection(id);
    setDrawerOpen(false);
  }, []);

  return (
    <>
      <AppBar
        position="sticky"
        elevation={scrollProgress > 2 ? 1 : 0}
        sx={{
          bgcolor: 'var(--md-sys-color-surface)',
          borderBottom: '1px solid var(--md-sys-color-outline-variant)',
          color: 'var(--md-sys-color-on-surface)',
          transition: 'box-shadow 0.2s',
        }}
      >
        {/* Reading progress */}
        <LinearProgress
          variant="determinate"
          value={scrollProgress}
          aria-hidden="true"
          sx={{
            height: 2,
            bgcolor: 'transparent',
            '& .MuiLinearProgress-bar': { bgcolor: 'var(--md-sys-color-primary)' },
          }}
        />

        <Toolbar disableGutters sx={{ px: 'var(--md-sys-spacing-4)' }}>
          <Container maxWidth="lg" disableGutters sx={{ display: 'flex', alignItems: 'center' }}>
            {/* Logo / brand */}
            <Stack direction="row" spacing={1} alignItems="center" sx={{ flexGrow: 1 }}>
              <PsychologyIcon sx={{ color: 'var(--md-sys-color-primary)', fontSize: 28 }} aria-hidden />
              <Typography
                variant="titleMedium"
                component="span"
                sx={{ color: 'var(--md-sys-color-primary)', fontWeight: 'var(--md-sys-typescale-weight-bold)', letterSpacing: '-0.5px' }}
              >
                DocenteDoc<Box component="span" sx={{ color: 'var(--md-sys-color-tertiary)' }}>AI</Box>
              </Typography>
            </Stack>

            {/* Desktop nav links */}
            {!isMobile && (
              <Stack direction="row" spacing={0.5} role="navigation" aria-label="Navigazione principale landing page">
                {NAV_LINKS.map(link => (
                  <Button
                    key={link.id}
                    onClick={() => handleNav(link.id)}
                    size="small"
                    aria-label={`Vai alla sezione ${link.label}`}
                    aria-current={activeId === link.id ? 'location' : undefined}
                    sx={{
                      color: activeId === link.id
                        ? 'var(--md-sys-color-primary)'
                        : 'var(--md-sys-color-on-surface-variant)',
                      fontWeight: activeId === link.id
                        ? 'var(--md-sys-typescale-weight-bold)'
                        : 'var(--md-sys-typescale-weight-medium)',
                      borderRadius: 'var(--md-sys-shape-corner-full)',
                      px: 'var(--md-sys-spacing-3)',
                      position: 'relative',
                      '&::after': activeId === link.id ? {
                        content: '""',
                        position: 'absolute',
                        bottom: 4,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: 20,
                        height: 2,
                        bgcolor: 'var(--md-sys-color-primary)',
                        borderRadius: 1,
                      } : {},
                    }}
                  >
                    {link.label}
                  </Button>
                ))}
              </Stack>
            )}

            {/* Mobile hamburger */}
            {isMobile && (
              <IconButton
                onClick={() => setDrawerOpen(true)}
                aria-label="Apri menu di navigazione"
                sx={{ color: 'var(--md-sys-color-on-surface)' }}
              >
                <MenuIcon />
              </IconButton>
            )}
          </Container>
        </Toolbar>
      </AppBar>

      {/* Mobile drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: 260,
            bgcolor: 'var(--md-sys-color-surface-container)',
            p: 'var(--md-sys-spacing-2)',
          },
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" px={1} py={1}>
          <Typography variant="titleMedium" sx={{ color: 'var(--md-sys-color-on-surface)' }}>
            Menu
          </Typography>
          <IconButton
            onClick={() => setDrawerOpen(false)}
            aria-label="Chiudi menu"
            size="small"
            sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}
          >
            <CloseIcon />
          </IconButton>
        </Stack>

        <Collapse in={drawerOpen}>
          <List dense role="navigation" aria-label="Menu mobile landing page">
            {NAV_LINKS.map(link => (
              <ListItem key={link.id} disablePadding>
                <ListItemButton
                  onClick={() => handleNav(link.id)}
                  selected={activeId === link.id}
                  aria-label={`Vai alla sezione ${link.label}`}
                  aria-current={activeId === link.id ? 'location' : undefined}
                  sx={{
                    borderRadius: 'var(--md-sys-shape-corner-medium)',
                    mb: 0.5,
                    '&.Mui-selected': {
                      bgcolor: 'var(--md-sys-color-primary-container)',
                      color: 'var(--md-sys-color-on-primary-container)',
                    },
                  }}
                >
                  <ListItemText
                    primary={link.label}
                    slotProps={{ primary: { variant: 'bodyMedium' as const } }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Collapse>
      </Drawer>
    </>
  );
};

export default LandingNav;
