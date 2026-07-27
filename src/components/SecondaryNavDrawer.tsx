// MD3 GOLD COMPLIANT — UnifiedNavDrawer: menu principale + tutte le sezioni
// Drawer laterale sinistro, stile Google Drive — si apre sempre da logo/header

import React, { useState } from 'react';
import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import ButtonBase from '@mui/material/ButtonBase';
import Collapse from '@mui/material/Collapse';
import { View } from '../types';
import { VIEW_LABELS } from './viewRegistry';
import { PRIMARY_NAV_ITEMS } from './navConfig';
import AskAIButton from './AskAIButton'; // keep direct here (prominent drawer action)

export interface SecondaryNavGroup {
  label: string;
  icon: string;
  items: { id: View; icon: string }[];
}

export const SECONDARY_NAV_GROUPS: SecondaryNavGroup[] = [
  // === STRUMENTI (tutto unito per ridurre ulteriormente le voci secondarie) ===
  {
    label: 'Strumenti',
    icon: 'apps',
    items: [
      { id: 'studenti', icon: 'person' },
      { id: 'register', icon: 'menu_book' },
      { id: 'lessons',  icon: 'library_books' },
      { id: 'settings', icon: 'settings' },
    ],
  },
];

interface SecondaryNavDrawerProps {
  open: boolean;
  onClose: () => void;
  onNavigate: (view: View) => void;
  activeView: View;
}

// Primary nav items — sourced from shared 5-voice config (Fase 1)
const drawerPrimaryItems = PRIMARY_NAV_ITEMS; // already the canonical 5 voices

// Unified nav item — always row layout (icon + label)
const NavItem: React.FC<{
  icon: string;
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => (
  <ButtonBase
    onClick={onClick}
    aria-label={label}
    aria-current={isActive ? 'page' : undefined}
    focusRipple
    sx={{
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-start',
      gap: 'var(--md-sys-spacing-3)',
      px: 'var(--md-sys-spacing-3)',
      py: 'var(--md-sys-spacing-2)',
      borderRadius: 'var(--md-sys-shape-corner-large)',
      bgcolor: isActive ? 'var(--md-sys-color-secondary-container)' : 'transparent',
      color: isActive ? 'var(--md-sys-color-on-secondary-container)' : 'var(--md-sys-color-on-surface-variant)',
      transition: 'background-color 0.15s',
      width: '100%',
      textAlign: 'left',
      '&:hover': { bgcolor: isActive ? 'var(--md-sys-color-secondary-container)' : 'var(--md-sys-color-surface-container-high)' },
      '&:focus-visible': { outline: '2px solid var(--md-sys-color-primary)', outlineOffset: 2 },
    }}
  >
    <Box
      component="span"
      className="material-symbols-outlined"
      aria-hidden="true"
      sx={{
        fontSize: 20,
        fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0",
        color: 'inherit',
        flexShrink: 0,
      }}
    >
      {icon}
    </Box>
    <Typography
      variant="labelLarge"
      component="span"
      sx={{
        color: 'inherit',
        fontWeight: isActive
          ? 'var(--md-sys-typescale-weight-semibold)'
          : 'var(--md-sys-typescale-weight-regular)',
      }}
    >
      {label}
    </Typography>
  </ButtonBase>
);

const SecondaryNavDrawer: React.FC<SecondaryNavDrawerProps> = ({
  open,
  onClose,
  onNavigate,
  activeView,
}) => {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    'Strumenti': true,
  });

  const toggleGroup = (label: string) => {
    setOpenGroups(prev => ({ ...prev, [label]: !prev[label] }));
  };

  const handleItemClick = (view: View) => {
    onNavigate(view);
    onClose();
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      anchor="left"
      aria-label="Navigazione principale"
      slotProps={{
        backdrop: {
          sx: { backgroundColor: 'rgba(0, 0, 0, 0.32)' },
        },
        paper: {
          sx: {
            width: 300,
            maxWidth: '85vw',
            bgcolor: 'var(--md-sys-color-surface-container)',
            overflowY: 'auto',
            overflowX: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          },
        },
      }}
    >
      {/* ── Branding header ──────────────────────────────────────── */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 'var(--md-sys-spacing-4)',
          py: 'var(--md-sys-spacing-4)',
          flexShrink: 0,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-3)' }}>
          <Box
            component="span"
            className="material-symbols-outlined"
            aria-hidden="true"
            sx={{ fontSize: 28, color: 'var(--md-sys-color-primary)', fontVariationSettings: '"FILL" 1' }}
          >
            psychology
          </Box>
          <Typography variant="titleMedium" sx={{ color: 'var(--md-sys-color-on-surface)' }}>
            DocenteDoc <Box component="strong" sx={{ fontWeight: 'var(--md-sys-typescale-weight-bold)' }}>AI</Box>
          </Typography>
        </Box>
        <IconButton
          aria-label="Chiudi menu"
          onClick={onClose}
          size="small"
          sx={{
            color: 'var(--md-sys-color-on-surface-variant)',
            '&:hover': { bgcolor: 'var(--md-sys-color-surface-container-high)' },
          }}
        >
          <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 20 }}>close</Box>
        </IconButton>
      </Box>

      <Divider />

      {/* ── AI Prominent Action (Fase 2) ─────────────────────────── */}
      <Box sx={{ px: 'var(--md-sys-spacing-3)', pt: 'var(--md-sys-spacing-2)', pb: 'var(--md-sys-spacing-1)' }}>
        <AskAIButton
          onNavigate={onNavigate}
          fullWidth
        />
      </Box>

      {/* ── Navigazione principale ──────────────────────────────── */}
      <Box
        component="section"
        aria-label="Navigazione principale"
        sx={{ px: 'var(--md-sys-spacing-3)', pt: 'var(--md-sys-spacing-3)', pb: 'var(--md-sys-spacing-2)' }}
      >
        <Typography
          variant="overline"
          sx={{
            color: 'var(--md-sys-color-primary)',
            px: 'var(--md-sys-spacing-2)',
            display: 'block',
            mb: 'var(--md-sys-spacing-1)',
            letterSpacing: '0.08em',
            fontWeight: 'var(--md-sys-typescale-weight-semibold)',
          }}
        >
          Principale
        </Typography>
        {drawerPrimaryItems.map((item) => (
          <NavItem
            key={item.id}
            icon={item.icon}
            label={VIEW_LABELS[item.id] ?? item.id}
            isActive={activeView === item.id}
            onClick={() => handleItemClick(item.id)}
          />
        ))}
      </Box>

      <Divider />

      {/* ── Gruppi di navigazione (collapsible) ─────────────────── */}
      {SECONDARY_NAV_GROUPS.map((group) => {
        const isOpen = openGroups[group.label] ?? true;
        return (
          <Box
            component="section"
            key={group.label}
            aria-label={group.label}
            sx={{ px: 'var(--md-sys-spacing-3)', pt: 'var(--md-sys-spacing-3)', pb: 'var(--md-sys-spacing-1)' }}
          >
            <ButtonBase
              onClick={() => toggleGroup(group.label)}
              sx={{
                display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-2)',
                width: '100%', textAlign: 'left', px: 'var(--md-sys-spacing-2)',
                mb: 'var(--md-sys-spacing-1)', py: '2px',
                '&:hover': { bgcolor: 'var(--md-sys-color-surface-container-high)' },
              }}
            >
              <Box component="span" className="material-symbols-outlined" aria-hidden="true"
                sx={{ fontSize: 16, color: 'var(--md-sys-color-primary)' }}>
                {group.icon}
              </Box>
              <Typography variant="overline" sx={{
                color: 'var(--md-sys-color-primary)',
                letterSpacing: '0.08em',
                fontWeight: 'var(--md-sys-typescale-weight-semibold)',
                flex: 1,
              }}>
                {group.label}
              </Typography>
              <Box component="span" className="material-symbols-outlined" sx={{ fontSize: 18, color: 'var(--md-sys-color-on-surface-variant)' }}>
                {isOpen ? 'expand_less' : 'expand_more'}
              </Box>
            </ButtonBase>

            <Collapse in={isOpen} timeout="auto" unmountOnExit>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-1)' }}>
                {group.items.map((item) => (
                  <NavItem
                    key={item.id}
                    icon={item.icon}
                    label={VIEW_LABELS[item.id] ?? item.id}
                    isActive={activeView === item.id}
                    onClick={() => handleItemClick(item.id)}
                  />
                ))}
              </Box>
            </Collapse>
          </Box>
        );
      })}
    </Drawer>
  );
};

export default SecondaryNavDrawer;
