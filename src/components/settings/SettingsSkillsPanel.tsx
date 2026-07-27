/**
 * settings/SettingsSkillsPanel.tsx — Pannello Skills del Settings Hub.
 *
 * Mostra le skill Orbit registrate con le relative opzioni configurabili
 * (automazione, abilitazione). Ogni skill è un accordion collassabile.
 *
 * Props: { skills: SkillSettings[] }
 * MD3 compliant: M3Surface, niente <div> per container, niente box-shadow.
 */

import React, { useState } from 'react';
import {
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Switch,
  FormControl,
  Select,
  MenuItem,
  Chip,
  Typography,
} from '@mui/material';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExtensionIcon  from '@mui/icons-material/Extension';
import StarIcon       from '@mui/icons-material/Star';

import M3Surface from '../ui/M3Surface';
import type { SkillSettings, SettingsOption } from '../../types/settings.types';

// ─── Props ────────────────────────────────────────────────────────────────────

interface SettingsSkillsPanelProps {
  skills: SkillSettings[];
  /** Callback quando l'utente modifica un'opzione */
  onOptionChange?: (skillCtaType: string, optionId: string, value: boolean | string | number) => void;
}

// ─── SkillOptionRow ───────────────────────────────────────────────────────────

interface SkillOptionRowProps {
  option: SettingsOption;
  onChange: (value: boolean | string | number) => void;
}

function SkillOptionRow({ option, onChange }: SkillOptionRowProps): React.JSX.Element {
  return (
    <Box
      sx={{
        px: 'var(--md-sys-spacing-4, 16px)',
        py: 'var(--md-sys-spacing-2, 8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 'var(--md-sys-spacing-3, 12px)',
      }}
    >
      <Box sx={{ flex: 1 }}>
        <Typography
          variant="bodyMedium"
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            color: 'var(--md-sys-color-on-surface)',
            fontFamily: 'var(--md-sys-typescale-body-medium-font)',
            fontSize: 'var(--md-sys-typescale-body-medium-size)',
          }}
        >
          {option.label}
          {option.recommended && (
            <Chip
              icon={<StarIcon sx={{ fontSize: 'var(--md-sys-icon-size-xs, 12px)' }} />}
              label="Consigliato"
              size="small"
              sx={{
                bgcolor:    'var(--md-sys-color-tertiary-container)',
                color:      'var(--md-sys-color-on-tertiary-container)',
                fontSize:   'var(--md-sys-typescale-label-small-size)',
                height:     20,
              }}
            />
          )}
        </Typography>
        {option.description && (
          <Typography
            variant="bodySmall"
            sx={{
              color: 'var(--md-sys-color-on-surface-variant)',
              fontFamily: 'var(--md-sys-typescale-body-small-font)',
              fontSize: 'var(--md-sys-typescale-body-small-size)',
              mt: 0.5,
            }}
          >
            {option.description}
          </Typography>
        )}
      </Box>

      {/* Control */}
      {option.type === 'boolean' && (
        <Switch
          checked={option.value as boolean}
          onChange={e => onChange(e.target.checked)}
          size="small"
          inputProps={{ 'aria-label': option.label }}
        />
      )}

      {option.type === 'select' && (
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <Select
            value={option.value as string}
            onChange={e => onChange(e.target.value)}
            inputProps={{ 'aria-label': option.label }}
            sx={{ fontSize: 'var(--md-sys-typescale-body-small-size)' }}
          >
            {(option.options ?? []).map(opt => (
              <MenuItem key={String(opt.value)} value={String(opt.value)}>
                {opt.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {option.type === 'number' && (
        <Typography
          variant="bodySmall"
          sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}
        >
          {String(option.value)}
        </Typography>
      )}

      {option.type === 'string' && (
        <Typography
          variant="bodySmall"
          sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}
        >
          {String(option.value)}
        </Typography>
      )}
    </Box>
  );
}

// ─── SkillRow ─────────────────────────────────────────────────────────────────

interface SkillRowProps {
  skill: SkillSettings;
  onOptionChange: (optionId: string, value: boolean | string | number) => void;
}

function SkillRow({ skill, onOptionChange }: SkillRowProps): React.JSX.Element {
  const [open, setOpen] = useState(false);

  return (
    <M3Surface elevation={0} sx={{ mb: 'var(--md-sys-spacing-1, 4px)', borderRadius: 2, overflow: 'hidden' }}>
      <ListItemButton
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        aria-label={`Impostazioni skill ${skill.label}`}
        sx={{
          px: 'var(--md-sys-spacing-4, 16px)',
          py: 'var(--md-sys-spacing-3, 12px)',
          '&:hover': {
            bgcolor: 'var(--md-sys-color-surface-container-highest)',
          },
        }}
      >
        <ListItemIcon sx={{ minWidth: 36 }}>
          <ExtensionIcon
            sx={{
              fontSize: 'var(--md-sys-icon-size-sm, 20px)',
              color: 'var(--md-sys-color-secondary)',
            }}
          />
        </ListItemIcon>
        <ListItemText
          primary={
            <Typography
              variant="bodyLarge"
              sx={{
                fontFamily: 'var(--md-sys-typescale-body-large-font)',
                fontSize: 'var(--md-sys-typescale-body-large-size)',
                color: 'var(--md-sys-color-on-surface)',
              }}
            >
              {skill.label}
            </Typography>
          }
          secondary={
            <Typography
              variant="bodySmall"
              sx={{
                fontFamily: 'var(--md-sys-typescale-body-small-font)',
                fontSize: 'var(--md-sys-typescale-body-small-size)',
                color: 'var(--md-sys-color-on-surface-variant)',
              }}
            >
              {skill.domain} · {skill.options.length} opzioni
            </Typography>
          }
        />
        {open ? (
          <ExpandLessIcon
            sx={{
              fontSize: 'var(--md-sys-icon-size-sm, 20px)',
              color: 'var(--md-sys-color-on-surface-variant)',
            }}
          />
        ) : (
          <ExpandMoreIcon
            sx={{
              fontSize: 'var(--md-sys-icon-size-sm, 20px)',
              color: 'var(--md-sys-color-on-surface-variant)',
            }}
          />
        )}
      </ListItemButton>

      <Collapse in={open} unmountOnExit>
        <Box
          sx={{
            borderTop: '1px solid var(--md-sys-color-outline-variant)',
            bgcolor: 'var(--md-sys-color-surface-container)',
          }}
        >
          {skill.options.map(opt => (
            <SkillOptionRow
              key={opt.id}
              option={opt}
              onChange={val => onOptionChange(opt.id, val)}
            />
          ))}
        </Box>
      </Collapse>
    </M3Surface>
  );
}

// ─── SettingsSkillsPanel ──────────────────────────────────────────────────────

export default function SettingsSkillsPanel({
  skills,
  onOptionChange,
}: SettingsSkillsPanelProps): React.JSX.Element {
  if (skills.length === 0) {
    return (
      <Box
        sx={{
          px: 'var(--md-sys-spacing-4, 16px)',
          py: 'var(--md-sys-spacing-6, 24px)',
          textAlign: 'center',
        }}
      >
        <Typography
          variant="bodyMedium"
          sx={{
            color: 'var(--md-sys-color-on-surface-variant)',
            fontFamily: 'var(--md-sys-typescale-body-medium-font)',
          }}
        >
          Nessuna skill registrata.
        </Typography>
      </Box>
    );
  }

  return (
    <List disablePadding aria-label="Impostazioni skill Orbit">
      {skills.map(skill => (
        <SkillRow
          key={skill.ctaType}
          skill={skill}
          onOptionChange={(optionId, value) => {
            onOptionChange?.(skill.ctaType, optionId, value);
          }}
        />
      ))}
    </List>
  );
}
