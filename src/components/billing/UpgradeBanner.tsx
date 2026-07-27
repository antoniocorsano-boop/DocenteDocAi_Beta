/**
 * components/billing/UpgradeBanner.tsx — P28 Go-to-Market Tier 1
 *
 * Banner MD3 non invasivo che appare in-context quando una feature Pro
 * viene tentata su piano Free. Contiene una CTA che avvia Stripe Checkout.
 *
 * Uso:
 *   <UpgradeBanner
 *     feature="Analisi AI avanzata"
 *     sx={{ mt: 2 }}
 *   />
 *
 * Il banner è nascosto automaticamente se l'utente è già Pro.
 */

import React, { useState, useEffect } from 'react';
import Alert       from '@mui/material/Alert';
import Box         from '@mui/material/Box';
import Button      from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Collapse    from '@mui/material/Collapse';
import Typography  from '@mui/material/Typography';
import type { SxProps, Theme } from '@mui/material/styles';

import { usePlanStore }                from '../../stores/usePlanStore';
import { getTokenState }               from '../../modules/system/TokenController';
import { registerObserver }            from '../../utils/observability';

// ─── Props ────────────────────────────────────────────────────────────────────

interface UpgradeBannerProps {
  /** Etichetta della feature bloccata, es. "Analisi predittiva". */
  feature?: string;
  /** Messaggio custom, sovrascrive `feature` se fornito. */
  message?: string;
  sx?: SxProps<Theme>;
}

// ─── Component ────────────────────────────────────────────────────────────────

const UpgradeBanner: React.FC<UpgradeBannerProps> = ({ feature, message, sx }) => {
  const { isPro, checkoutUpgrade, checkoutLoading, checkoutError } = usePlanStore();
  const [dismissed, setDismissed] = useState(false);
  const [tokenState, setTokenState] = useState(() => getTokenState());

  // Keep token counter live
  useEffect(() => {
    const unsub = registerObserver((payload) => {
      if (payload.event.startsWith('token.')) setTokenState(getTokenState());
    });
    return unsub;
  }, []);

  // Nothing to show if Pro or dismissed
  if (isPro() || dismissed) return null;

  const bannerMessage = message
    ?? (feature
      ? `${feature} è disponibile nel piano Pro.`
      : 'Questa funzione è disponibile nel piano Pro.');

  return (
    <Collapse in={!dismissed}>
      <Alert
        severity="info"
        variant="outlined"
        onClose={() => setDismissed(true)}
        sx={{
          borderColor:     'var(--md-sys-color-primary)',
          '& .MuiAlert-icon': { color: 'var(--md-sys-color-primary)' },
          ...sx,
        }}
        action={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button
              size="small"
              variant="contained"
              aria-label="Passa al piano Pro"
              disabled={checkoutLoading}
              onClick={() => void checkoutUpgrade()}
              sx={{
                bgcolor: 'var(--md-sys-color-primary)',
                color:   'var(--md-sys-color-on-primary)',
                '&:hover': { bgcolor: 'var(--md-sys-color-primary-container)' },
                minWidth: 100,
              }}
            >
              {checkoutLoading
                ? <CircularProgress size={16} color="inherit" aria-label="Caricamento..." />
                : 'Passa a Pro'}
            </Button>
          </Box>
        }
      >
        <Typography variant="bodySmall" component="span">
          {bannerMessage}
          {' — '}
          <Typography
            variant="bodySmall"
            component="span"
            sx={{ color: tokenState.remaining <= 100 ? 'var(--md-sys-color-error)' : 'inherit' }}
            aria-label={`Token rimanenti: ${tokenState.remaining}`}
          >
            {tokenState.remaining.toLocaleString('it-IT')} token rimasti
          </Typography>
          {checkoutError && (
            <Typography
              variant="bodySmall"
              component="span"
              sx={{ display: 'block', color: 'var(--md-sys-color-error)', mt: 0.5 }}
            >
              {checkoutError}
            </Typography>
          )}
        </Typography>
      </Alert>
    </Collapse>
  );
};

export default UpgradeBanner;
