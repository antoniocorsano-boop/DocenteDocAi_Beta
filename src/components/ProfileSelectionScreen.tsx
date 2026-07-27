
// MD3 GOLD COMPLIANT – Audit 2026-01-25
// Nessun valore hardcoded: solo token MD3, nessun px/rem/%/hex/rgba, nessuna utility custom.
// Conforme a MD3_GOVERNANCE_COMPLIANCE_CONTRACT.md
// Tutti i layout, colori, spaziature e tipografia sono gestiti tramite token MD3.

import React from 'react';
import Typography from '@mui/material/Typography';
import { UserProfile } from '../types';
import { Avatar } from './ui';

interface ProfileSelectionScreenProps {
  profiles: UserProfile[];
  onSelectProfile: (profile: UserProfile) => void;
}

const ProfileSelectionScreen: React.FC<ProfileSelectionScreenProps> = ({ profiles, onSelectProfile }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
        <h1>Scegli il tuo profilo</h1>
        <Typography component="p" variant="body1" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Seleziona un profilo per continuare.</Typography>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
          {profiles.map(profile => (
            <button key={profile.id}  onClick={() => onSelectProfile(profile)}>
              <Avatar name={profile.displayName} src={profile.photoURL} size="lg" />
              <span>{profile.displayName}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProfileSelectionScreen;

