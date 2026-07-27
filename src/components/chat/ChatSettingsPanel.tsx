/**
 * ChatSettingsPanel — settings side-sheet for SmartChat. (v2 — P38)
 *
 * Opened via the gear icon in the SmartChat top bar.
 * Controls:
 *   - User profile (role) — pre-selects device defaults
 *   - Default mode per device (mobile / desktop)
 *   - Auto-upgrade threshold (word count)
 *   - Auto-sandbox toggle
 *   - Landing page preference
 *   - History clear
 *
 * All preferences are persisted via useChatPrefsStore (localStorage).
 * MD3 Gold Compliant — spacing via tokens only.
 */

import React from 'react';
import Box                from '@mui/material/Box';
import Button             from '@mui/material/Button';
import Chip               from '@mui/material/Chip';
import Divider            from '@mui/material/Divider';
import Drawer             from '@mui/material/Drawer';
import FormControlLabel   from '@mui/material/FormControlLabel';
import IconButton         from '@mui/material/IconButton';
import MenuItem           from '@mui/material/MenuItem';
import Select             from '@mui/material/Select';
import LinearProgress    from '@mui/material/LinearProgress';
import Slider             from '@mui/material/Slider';
import Stack              from '@mui/material/Stack';
import Switch             from '@mui/material/Switch';
import ToggleButton       from '@mui/material/ToggleButton';
import ToggleButtonGroup  from '@mui/material/ToggleButtonGroup';
import Tooltip            from '@mui/material/Tooltip';
import Typography         from '@mui/material/Typography';
import CloseIcon          from '@mui/icons-material/Close';
import DeleteOutlineIcon  from '@mui/icons-material/DeleteOutline';
import PhoneAndroidIcon   from '@mui/icons-material/PhoneAndroid';
import DesktopWindowsIcon from '@mui/icons-material/DesktopWindows';
import TuneIcon           from '@mui/icons-material/Tune';
import PersonIcon         from '@mui/icons-material/Person';
import HomeIcon           from '@mui/icons-material/Home';
import TrendingUpIcon     from '@mui/icons-material/TrendingUp';
import PsychologyIcon     from '@mui/icons-material/Psychology';
import RestartAltIcon     from '@mui/icons-material/RestartAlt';
import LockOutlinedIcon            from '@mui/icons-material/LockOutlined';
import FileDownloadOutlinedIcon    from '@mui/icons-material/FileDownloadOutlined';
import VisibilityOffOutlinedIcon   from '@mui/icons-material/VisibilityOffOutlined';

import type { Mode }                 from '@/modules/orchestration/ModeEngine';
import { useConversationStore }      from '@/stores/useConversationStore';
import { useChatPrefsStore }         from '@/stores/useChatPrefsStore';
import type { UserRole }             from '@/stores/useChatPrefsStore';
import { useSuggestedMode }          from '@/hooks/useSuggestedMode';

// ── Cognitive style labels (Fase 2, Task 5) ────────────────────────────────

// ── Cognitive style slider helpers (Fase 3) ─────────────────────────────

// ── P40: export type \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\ntype _ExportData = { chatPrefs: object; conversations: object[] };

const LEVEL_MARKS = [
  { value: 0, label: 'Bassa'  },
  { value: 1, label: 'Media'  },
  { value: 2, label: 'Alta'   },
];
const SPEED_MARKS = [
  { value: 0, label: 'Rapido'     },
  { value: 1, label: 'Bilanciato' },
  { value: 2, label: 'Riflessivo' },
];
const LEVEL_VALUES: Record<string, number> = { low: 0, medium: 1, high: 2 };
const SPEED_VALUES: Record<string, number> = { fast: 0, balanced: 1, deliberate: 2 };
const LEVELS        = ['low', 'medium', 'high']          as const;
const SPEEDS        = ['fast', 'balanced', 'deliberate'] as const;

// ── Mode options ───────────────────────────────────────────────────────────────

const MODE_OPTIONS: { value: Mode; label: string; hint: string }[] = [
  { value: 'fast',     label: '⚡ Veloce',    hint: 'Risposta rapida, un solo step' },
  { value: 'balanced', label: '⚖️ Bilanciato', hint: 'Equilibrio qualità/velocità' },
  { value: 'creative', label: '✨ Creativo',   hint: 'Stile libero e narrativo' },
  { value: 'deep',     label: '🧠 Profondo',  hint: 'Analisi multi-step (PRO)' },
];

// ── Role options ───────────────────────────────────────────────────────────────

const ROLE_OPTIONS: { value: UserRole; label: string; emoji: string }[] = [
  { value: 'teacher',     label: 'Docente',      emoji: '👩‍🏫' },
  { value: 'coordinator', label: 'Coordinatore', emoji: '🗂' },
  { value: 'principal',   label: 'Dirigente',    emoji: '🏫' },
  { value: 'student',     label: 'Studente',     emoji: '🎒' },
  { value: 'parent',      label: 'Genitore',     emoji: '👪' },
];

// ── Section header ─────────────────────────────────────────────────────────────

function SectionHeader({ icon, label }: { icon: React.ReactElement; label: string }) {
  return (
    <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 1 }}>
      {React.cloneElement(icon, { fontSize: 'small', sx: { color: 'text.secondary' } })}
      <Typography variant="subtitle2" color="text.secondary">
        {label}
      </Typography>
    </Stack>
  );
}

// ── Props ──────────────────────────────────────────────────────────────────────

export interface ChatSettingsPanelProps {
  open:           boolean;
  onClose:        () => void;
  mode:           Mode;
  setMode:        (m: Mode) => void;
  /** Whether buildUIBlocks should auto-append a sandbox block on HTML/code output */
  autoSandbox:    boolean;
  setAutoSandbox: (v: boolean) => void;
}

// ── Component ──────────────────────────────────────────────────────────────────

export function ChatSettingsPanel({
  open,
  onClose,
  mode,
  setMode,
  autoSandbox,
  setAutoSandbox,
}: ChatSettingsPanelProps): React.ReactElement {
  const { conversations, clearAll } = useConversationStore();
  const convCount = conversations.length;

  const {
    role,
    mobileDefaultMode,
    desktopDefaultMode,
    autoUpgradeThreshold,
    showLanding,
    setRole,
    setMobileDefaultMode,
    setDesktopDefaultMode,
    setAutoUpgradeThreshold,
    setAutoSandbox:  prefsSetAutoSandbox,
    setShowLanding,
    acceptedSuggestions,
    rejectedSuggestions,
    autoApplySuggestions,
    cognitiveStyle,
    overrideCognitiveStyle,
    resetCognitiveStyle,
    reset: resetAllPrefs,
    emotionalProfile,
  } = useChatPrefsStore();

  const { suggested, reason } = useSuggestedMode();

  // ── Privacy: show/hide cognitive profile ─────────────────────────────────────
  const [showCognitiveData, setShowCognitiveData] = React.useState(false);

  // ── Export all user data as JSON ──────────────────────────────────────────────
  const handleExportData = React.useCallback(() => {
    const data = {
      chatPrefs: {
        role,
        mobileDefaultMode,
        desktopDefaultMode,
        cognitiveStyle,
        emotionalProfile,
        acceptedSuggestions,
        rejectedSuggestions,
      },
      conversations,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `docentedoc-dati-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [role, mobileDefaultMode, desktopDefaultMode, cognitiveStyle, emotionalProfile,
      acceptedSuggestions, rejectedSuggestions, conversations]);

  // Keep prefs store and local state in sync for auto-sandbox
  const handleAutoSandbox = (v: boolean) => {
    setAutoSandbox(v);
    prefsSetAutoSandbox(v);
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      variant="temporary"
      PaperProps={{
        sx: {
          width:         340,
          display:       'flex',
          flexDirection: 'column',
          overflowY:     'auto',
        },
      }}
      aria-label="Impostazioni chat"
    >
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <Stack
        direction="row"
        alignItems="center"
        sx={{
          px:           2,
          py:           1.5,
          borderBottom: '1px solid',
          borderColor:  'divider',
          flexShrink:   0,
          position:     'sticky',
          top:          0,
          backgroundColor: 'background.paper',
          zIndex:       1,
        }}
      >
        <TuneIcon fontSize="small" sx={{ color: 'primary.main', mr: 1 }} aria-hidden="true" />
        <Typography variant="subtitle1" sx={{ flex: 1 }}>
          Impostazioni
        </Typography>
        <Tooltip title="Chiudi" placement="left">
          <IconButton size="small" aria-label="Chiudi impostazioni" onClick={onClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>

      {/* ── Scrollable body ──────────────────────────────────────────────── */}
      <Box sx={{ flex: 1, overflowY: 'auto', px: 2, py: 2 }}>
        <Stack spacing={3}>

          {/* ── 1. Profilo utente ──────────────────────────────────────── */}
          <Box>
            <SectionHeader icon={<PersonIcon />} label="Profilo" />
            <Stack direction="row" flexWrap="wrap" gap={0.75} useFlexGap>
              {ROLE_OPTIONS.map(r => (
                <Chip
                  key={r.value}
                  label={`${r.emoji} ${r.label}`}
                  size="small"
                  variant={role === r.value ? 'filled' : 'outlined'}
                  color={role === r.value ? 'primary' : 'default'}
                  onClick={() => setRole(r.value)}
                  aria-label={`Profilo: ${r.label}`}
                  aria-pressed={role === r.value}
                  clickable
                />
              ))}
            </Stack>
          </Box>

          <Divider />

          {/* ── 2. Modalità AI corrente ─────────────────────────────────── */}
          <Box>
            <SectionHeader icon={<TuneIcon />} label="Modalità AI" />

            {/* Suggested badge */}
            {suggested !== mode && (
              <Box
                sx={{
                  mb:              1,
                  px:              1.25,
                  py:              0.75,
                  borderRadius:    1,
                  backgroundColor: 'action.selected',
                  border:          '1px dashed',
                  borderColor:     'primary.light',
                }}
              >
                <Typography variant="caption" color="primary.main">
                  ✨ Suggerito per te ora: <strong>
                    {MODE_OPTIONS.find(m => m.value === suggested)?.label}
                  </strong>
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  {reason}
                </Typography>
                <Button
                  size="small"
                  variant="text"
                  sx={{ mt: 0.5, p: 0, minWidth: 0 }}
                  onClick={() => setMode(suggested)}
                  aria-label={`Applica modalità suggerita: ${suggested}`}
                >
                  Applica
                </Button>
              </Box>
            )}

            <ToggleButtonGroup
              value={mode}
              exclusive
              onChange={(_, val: Mode | null) => val && setMode(val)}
              aria-label="Seleziona modalità AI"
              size="small"
              orientation="vertical"
              fullWidth
            >
              {MODE_OPTIONS.map(opt => (
                <Tooltip key={opt.value} title={opt.hint} placement="left">
                  <ToggleButton value={opt.value} aria-label={opt.label}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ width: '100%' }}>
                      <Typography variant="body2" sx={{ flex: 1, textAlign: 'left' }}>
                        {opt.label}
                      </Typography>
                      {opt.value === suggested && mode !== opt.value && (
                        <Typography variant="caption" color="primary.main">suggerito</Typography>
                      )}
                    </Stack>
                  </ToggleButton>
                </Tooltip>
              ))}
            </ToggleButtonGroup>
          </Box>

          <Divider />

          {/* ── 3. Preferenze dispositivo ──────────────────────────────── */}
          <Box>
            <SectionHeader icon={<PhoneAndroidIcon />} label="Modalità predefinita per dispositivo" />

            <Stack spacing={1.5}>
              {/* Mobile */}
              <Box>
                <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 0.5 }}>
                  <PhoneAndroidIcon sx={{ fontSize: 14, color: 'text.secondary' }} aria-hidden="true" />
                  <Typography variant="caption" color="text.secondary">Smartphone / tablet</Typography>
                </Stack>
                <Select
                  size="small"
                  fullWidth
                  value={mobileDefaultMode}
                  onChange={e => setMobileDefaultMode(e.target.value as Mode)}
                  aria-label="Modalità predefinita mobile"
                >
                  {MODE_OPTIONS.map(opt => (
                    <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                  ))}
                </Select>
              </Box>

              {/* Desktop */}
              <Box>
                <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 0.5 }}>
                  <DesktopWindowsIcon sx={{ fontSize: 14, color: 'text.secondary' }} aria-hidden="true" />
                  <Typography variant="caption" color="text.secondary">Computer / schermo grande</Typography>
                </Stack>
                <Select
                  size="small"
                  fullWidth
                  value={desktopDefaultMode}
                  onChange={e => setDesktopDefaultMode(e.target.value as Mode)}
                  aria-label="Modalità predefinita desktop"
                >
                  {MODE_OPTIONS.map(opt => (
                    <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                  ))}
                </Select>
              </Box>
            </Stack>
          </Box>

          <Divider />

          {/* ── 4. Auto-upgrade soglia parole ──────────────────────────── */}
          <Box>
            <SectionHeader icon={<TuneIcon />} label="Upgrade automatico modalità" />
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              Se il messaggio supera{' '}
              <strong>{autoUpgradeThreshold === 0 ? 'mai' : `${autoUpgradeThreshold} parole`}</strong>
              , la modalità sale automaticamente di un livello.
            </Typography>
            <Slider
              value={autoUpgradeThreshold}
              min={0}
              max={100}
              step={10}
              marks={[
                { value: 0,   label: 'Off' },
                { value: 40,  label: '40' },
                { value: 100, label: '100' },
              ]}
              onChange={(_, v) => setAutoUpgradeThreshold(v as number)}
              aria-label="Soglia parole per auto-upgrade modalità"
              valueLabelDisplay="auto"
            />
          </Box>

          <Divider />

          {/* ── 5. Sandbox interattiva ─────────────────────────────────── */}
          <Box>
            <SectionHeader icon={<TuneIcon />} label="Sandbox interattiva" />
            <FormControlLabel
              control={
                <Switch
                  checked={autoSandbox}
                  onChange={e => handleAutoSandbox(e.target.checked)}
                  inputProps={{ 'aria-label': 'Abilita sandbox automatica' }}
                />
              }
              label={
                <Typography variant="body2">
                  Anteprima automatica per HTML e codice
                </Typography>
              }
            />
          </Box>

          <Divider />

          {/* ── 6. Schermata home ─────────────────────────────────────── */}
          <Box>
            <SectionHeader icon={<HomeIcon />} label="Schermata iniziale" />
            <FormControlLabel
              control={
                <Switch
                  checked={showLanding}
                  onChange={e => setShowLanding(e.target.checked)}
                  inputProps={{ 'aria-label': 'Mostra landing intelligente' }}
                />
              }
              label={
                <Stack>
                  <Typography variant="body2">
                    Mostra prossimo passo
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Landing contestuale con azioni suggerite
                  </Typography>
                </Stack>
              }
            />
          </Box>

          <Divider />

          {/* ── 6b. Apprendimento ─────────────────────────────────────── */}
          <Box>
            <SectionHeader icon={<TrendingUpIcon />} label="Apprendimento" />
            <LinearProgress
              variant="determinate"
              value={Math.min(100, (acceptedSuggestions / (rejectedSuggestions * 2 + 3)) * 100)}
              sx={{ mb: 1, borderRadius: 1 }}
              aria-label="Avanzamento apprendimento suggerimenti"
            />
            {autoApplySuggestions ? (
              <Chip
                color="success"
                size="small"
                label="Il sistema si adatta automaticamente"
              />
            ) : (
              <Typography variant="caption" color="text.secondary">
                Accetta ancora {Math.max(0, 3 - acceptedSuggestions)} suggerimenti per l&apos;apprendimento automatico
              </Typography>
            )}
          </Box>

          <Divider />
          {/* ── 7b. Il mio stile di lavoro (Fase 3 — slider override) ─── */}
          <Box>
            <SectionHeader icon={<PsychologyIcon />} label="Il mio stile di lavoro" />
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">🏗 Struttura</Typography>
                <Slider
                  size="small"
                  min={0} max={2} step={1}
                  marks={LEVEL_MARKS}
                  value={LEVEL_VALUES[cognitiveStyle.structure] ?? 1}
                  onChange={(_, v) => overrideCognitiveStyle({ ...cognitiveStyle, structure: LEVELS[v as number] })}
                  aria-label="Struttura cognitiva"
                />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">🎯 Autonomia</Typography>
                <Slider
                  size="small"
                  min={0} max={2} step={1}
                  marks={LEVEL_MARKS}
                  value={LEVEL_VALUES[cognitiveStyle.autonomy] ?? 1}
                  onChange={(_, v) => overrideCognitiveStyle({ ...cognitiveStyle, autonomy: LEVELS[v as number] })}
                  aria-label="Autonomia preferita"
                />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">⚡ Velocità</Typography>
                <Slider
                  size="small"
                  min={0} max={2} step={1}
                  marks={SPEED_MARKS}
                  value={SPEED_VALUES[cognitiveStyle.speedPreference] ?? 1}
                  onChange={(_, v) => overrideCognitiveStyle({ ...cognitiveStyle, speedPreference: SPEEDS[v as number] })}
                  aria-label="Velocità di risposta preferita"
                />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">🔍 Esplorazione</Typography>
                <Slider
                  size="small"
                  min={0} max={2} step={1}
                  marks={LEVEL_MARKS}
                  value={LEVEL_VALUES[cognitiveStyle.exploration] ?? 1}
                  onChange={(_, v) => overrideCognitiveStyle({ ...cognitiveStyle, exploration: LEVELS[v as number] })}
                  aria-label="Propensione all'esplorazione"
                />
              </Box>
            </Stack>
            <Button
              size="small"
              color="warning"
              startIcon={<RestartAltIcon />}
              onClick={resetCognitiveStyle}
              sx={{ mt: 1 }}
              aria-label="Reimposta stile cognitivo ai valori di default"
            >
              Reimposta stile
            </Button>
          </Box>

          <Divider />          {/* ── 8. Privacy & Dati (P40) ────────────────────────── */}
          <Box>
            <SectionHeader icon={<LockOutlinedIcon />} label="Privacy & Dati" />

            {/* Toggle: visualizza profilo cognitivo */}
            <FormControlLabel
              control={
                <Switch
                  checked={showCognitiveData}
                  onChange={e => setShowCognitiveData(e.target.checked)}
                  inputProps={{ 'aria-label': 'Mostra dati profilo cognitivo' }}
                />
              }
              label={
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <VisibilityOffOutlinedIcon sx={{ fontSize: 14, color: 'text.secondary' }} aria-hidden="true" />
                  <Typography variant="body2">Mostra profilo cognitivo</Typography>
                </Stack>
              }
            />
            {showCognitiveData && (
              <Box
                sx={{
                  mt:              1,
                  p:               1.25,
                  borderRadius:    1,
                  backgroundColor: 'action.hover',
                  border:          '1px solid',
                  borderColor:     'divider',
                }}
                aria-live="polite"
              >
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                  Stato rilevato
                </Typography>
                <Stack direction="row" flexWrap="wrap" gap={0.5} useFlexGap>
                  <Chip label={`stile: ${cognitiveStyle.structure}`}   size="small" variant="outlined" />
                  <Chip label={`velocità: ${cognitiveStyle.speedPreference}`} size="small" variant="outlined" />
                  <Chip label={`stato: ${emotionalProfile?.baselineState ?? '—'}`} size="small" variant="outlined" />
                </Stack>
                <Typography variant="caption" color="text.disabled" display="block" sx={{ mt: 0.75 }}>
                  Questi dati restano sul dispositivo e non vengono trasmessi.
                </Typography>
              </Box>
            )}

            <Stack spacing={1} sx={{ mt: 1.5 }}>
              {/* Azzera memoria AI */}
              <Button
                variant="outlined"
                color="warning"
                size="small"
                startIcon={<RestartAltIcon />}
                onClick={() => { resetAllPrefs(); onClose(); }}
                aria-label="Azzera tutta la memoria AI: profilo emotivo, stile cognitivo e preferenze"
              >
                Azzera memoria AI
              </Button>

              {/* Esporta dati */}
              <Button
                variant="outlined"
                size="small"
                startIcon={<FileDownloadOutlinedIcon />}
                onClick={handleExportData}
                aria-label="Scarica i tuoi dati in formato JSON"
              >
                Esporta i miei dati
              </Button>
            </Stack>
          </Box>

          <Divider />          {/* ── 7. Cronologia ──────────────────────────────────────────── */}
          <Box>
            <SectionHeader icon={<DeleteOutlineIcon />} label="Cronologia" />
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {convCount}{' '}
              {convCount === 1 ? 'conversazione salvata' : 'conversazioni salvate'}
            </Typography>
            <Button
              variant="outlined"
              color="error"
              size="small"
              startIcon={<DeleteOutlineIcon />}
              onClick={() => { clearAll(); onClose(); }}
              aria-label="Cancella tutta la cronologia delle conversazioni"
              disabled={convCount === 0}
            >
              Cancella cronologia
            </Button>
          </Box>

        </Stack>
      </Box>
    </Drawer>
  );
}

export default ChatSettingsPanel;
