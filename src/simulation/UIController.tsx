/**
 * simulation/UIController.tsx — Overlay React per le landing della simulazione.
 *
 * Osserva useSimulationStore.activeLanding e renderizza il componente
 * landing correto (ScheduleLanding / ClassLanding / LessonLanding) come
 * overlay fullscreen con backdrop blur.
 *
 * onNavigate → aggiorna activeLanding nello store per simulare
 * la transizione tra landing senza re-avviare il loop principale.
 *
 * MD3 compliant: niente <div> per container visivi, niente box-shadow
 * custom, usa var(--md-sys-color-*) per i token colore.
 */

import React, { useCallback } from 'react';
import { Box } from '@mui/material';

import ScheduleLanding  from '../components/landing/ScheduleLanding';
import ClassLanding     from '../components/landing/ClassLanding';
import LessonLanding    from '../components/landing/LessonLanding';
import SettingsLanding  from '../components/settings/SettingsLanding';

import { useSimulationStore } from './simulationStore';
import type { ScheduleContext } from '../modules/orchestration/types';
import type { LandingType }     from './types';

// ─── UIController ─────────────────────────────────────────────────────────────

export default function UIController(): React.JSX.Element | null {
  const activeLanding = useSimulationStore(s => s.activeLanding);
  const scheduleCtx   = useSimulationStore(s => s.scheduleCtx);
  const setActiveLanding = useSimulationStore(s => s._actions.setActiveLanding);

  const handleClose = useCallback(() => {
    setActiveLanding(null);
  }, [setActiveLanding]);

  const handleNavigate = useCallback(
    (type: string, ctx: ScheduleContext) => {
      setActiveLanding(type as LandingType, ctx);
    },
    [setActiveLanding],
  );

  if (!activeLanding) return null;

  return (
    <Box
      sx={{
        position:   'fixed',
        inset:      0,
        zIndex:     1600,
        backdropFilter: 'blur(6px)',
        backgroundColor: 'rgba(0,0,0,0.38)',
        display:    'flex',
        alignItems: 'stretch',
        animation:  'orbitIn 180ms ease-out',
        '@keyframes orbitIn': {
          from: { opacity: 0     },
          to:   { opacity: 1     },
        },
      }}
    >
      {activeLanding === 'schedule' && (
        <ScheduleLanding
          onClose={handleClose}
          onNavigate={handleNavigate}
          ctx={scheduleCtx}
        />
      )}
      {activeLanding === 'class' && (
        <ClassLanding
          onClose={handleClose}
          onNavigate={handleNavigate}
          ctx={scheduleCtx}
        />
      )}
      {activeLanding === 'lesson' && (
        <LessonLanding
          onClose={handleClose}
          ctx={scheduleCtx}
        />
      )}
      {activeLanding === 'settings' && (
        <SettingsLanding
          onClose={handleClose}
          tenantId="sim-tenant"
        />
      )}
    </Box>
  );
}
