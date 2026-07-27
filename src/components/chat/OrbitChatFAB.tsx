/**
 * OrbitChatFAB — Orbit-branded global chat entry point.
 *
 * Renders a fixed FAB (bottom-right, stacked above FloatingSatelliteCopilot)
 * that opens SmartChat as a right-side Drawer.
 *
 * Visual state follows ORBIT_MACRO_STATES:
 *   - orbColor drives FAB background
 *   - ringSpinning shows an animated orbit ring when processing
 *
 * MD3 Gold Compliant — no hardcoded colours or spacing values.
 */

import React, { useState, useEffect } from 'react';
import Box           from '@mui/material/Box';
import Drawer        from '@mui/material/Drawer';
import Fab           from '@mui/material/Fab';
import Tooltip       from '@mui/material/Tooltip';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme }  from '@mui/material/styles';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CloseIcon       from '@mui/icons-material/Close';

import { SmartChat }              from './SmartChat';
import { ORBIT_MACRO_STATES }     from '../../theme/orbitStates';
import { useChatPrefsStore }      from '@/stores/useChatPrefsStore';
import { useSmartChat }           from '@/hooks/useSmartChat';
import { useOrbitSignalStore }    from '@/stores/useOrbitSignalStore';
import type { NexusState }        from '../ui/JarvisNexus';

// ── Constants ──────────────────────────────────────────────────────────────────

const DRAWER_WIDTH = 480;

/**
 * FloatingSatelliteCopilot sits at bottom:24px with a 56px FAB.
 * We stack OrbitChatFAB directly above it (24 + 56 + 8 gap = 88px).
 */
const FAB_BOTTOM = 'calc(var(--md-sys-spacing-6, 24px) + 56px + 8px)';
const FAB_RIGHT  = 'var(--md-sys-spacing-6, 24px)';

// ── Helpers ────────────────────────────────────────────────────────────────────

function resolveOrb(nexusState?: NexusState): { color: string; spinning: boolean } {
  if (!nexusState) return { color: 'var(--md-sys-color-primary)', spinning: false };
  for (const spec of Object.values(ORBIT_MACRO_STATES)) {
    if ((spec.nexusStates as readonly string[]).includes(nexusState)) {
      return { color: spec.orbColor, spinning: spec.ringSpinning };
    }
  }
  return { color: ORBIT_MACRO_STATES.IDLE.orbColor, spinning: false };
}

// ── Props ──────────────────────────────────────────────────────────────────────

export interface OrbitChatFABProps {
  /** Current Orbit Nexus state — drives FAB colour + ring animation */
  nexusState?: NexusState;
  /** 'pro' unlocks deep/manual modes inside SmartChat */
  userPlan?: 'free' | 'pro';
}

// ── Component ──────────────────────────────────────────────────────────────────

export function OrbitChatFAB({ nexusState, userPlan = 'free' }: OrbitChatFABProps): React.ReactElement {
  const [open, setOpen] = useState(false);

  const theme    = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const { mobileDefaultMode, desktopDefaultMode } = useChatPrefsStore();
  const deviceMode = isMobile ? mobileDefaultMode : desktopDefaultMode;

  const { color, spinning } = resolveOrb(nexusState);

  // ── OrbitDock signal bridge ─────────────────────────────────────────────────
  // Shared Zustand store: OrbitDock writes a prompt → we open + fire it.
  // `triggerPrompt` from this useSmartChat instance shares the same
  // useConversationStore as the SmartChat inside the Drawer (keepMounted).
  const pendingPrompt    = useOrbitSignalStore(s => s.pendingPrompt);
  const clearPrompt      = useOrbitSignalStore(s => s.setPendingPrompt);
  const { triggerPrompt } = useSmartChat({ initialMode: deviceMode });

  useEffect(() => {
    if (!pendingPrompt) return;
    setOpen(true);
    void triggerPrompt(pendingPrompt);
    clearPrompt(null);
  }, [pendingPrompt]); // eslint-disable-line react-hooks/exhaustive-deps
  // ^ intentionally omit stable refs (triggerPrompt/clearPrompt) to avoid
  //   re-registering on every mode change — pendingPrompt is the only signal.

  return (
    <>
      {/* ── FAB + optional orbit ring ─────────────────────────────────────── */}
      <Box
        sx={{
          position:       'fixed',
          bottom:         FAB_BOTTOM,
          right:          FAB_RIGHT,
          zIndex:         'calc(var(--md-sys-z-modal, 1300) - 1)',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
        }}
      >
        {/* Orbit ring — visible only when processing and drawer is closed */}
        {spinning && !open && (
          <Box
            aria-hidden="true"
            sx={{
              position:          'absolute',
              width:             72,
              height:            72,
              borderRadius:      '50%',
              border:            '2px solid',
              borderColor:       color,
              borderTopColor:    'transparent',
              animation:         'orbit-chat-spin 1s linear infinite',
              '@keyframes orbit-chat-spin': {
                from: { transform: 'rotate(0deg)' },
                to:   { transform: 'rotate(360deg)' },
              },
            }}
          />
        )}

        <Tooltip
          title={open ? 'Chiudi chat' : 'Chat Copilot Docente'}
          placement="left"
        >
          <Fab
            aria-label={open ? 'Chiudi chat AI' : 'Apri chat AI'}
            onClick={() => setOpen(o => !o)}
            sx={{
              backgroundColor: color,
              color:           'var(--md-sys-color-on-primary)',
              transition:      'background-color 0.35s ease, transform 0.15s ease',
              '&:hover': { transform: 'scale(1.07)' },
            }}
          >
            {open ? <CloseIcon /> : <AutoAwesomeIcon />}
          </Fab>
        </Tooltip>
      </Box>

      {/* ── Chat Drawer ───────────────────────────────────────────────────── */}
      <Drawer
        anchor="right"
        open={open}
        onClose={() => setOpen(false)}
        variant="temporary"
        ModalProps={{ keepMounted: true }}
        PaperProps={{
          sx: {
            width:       isMobile ? '100vw' : DRAWER_WIDTH,
            borderLeft:  '1px solid',
            borderColor: 'divider',
          },
        }}
        aria-label="Pannello chat AI"
      >
        <SmartChat
          userPlan={userPlan}
          height="100%"
          initialMode={deviceMode}
          forceCompact
        />
      </Drawer>
    </>
  );
}

export default OrbitChatFAB;
