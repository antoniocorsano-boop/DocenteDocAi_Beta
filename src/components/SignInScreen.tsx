// MD3 Compliant - Migration completed

import React, { useState } from 'react';
import { TextField } from './ui';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { UserProfile } from '../types';

interface SignInScreenProps {
  onSignInSuccess: (profile: UserProfile) => void;
}

const SignInScreen: React.FC<SignInScreenProps> = ({ onSignInSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password.trim()) {
      setError('Inserisci email e password');
      return;
    }
    // Simulazione login OK
    onSignInSuccess({ id: email, displayName: email });
  };

  return (
    <div
      style={{
        minHeight: 'var(--md-sys-viewport-height-full)',
        width: 'var(--md-sys-viewport-width-full)',
        background: 'var(--md-sys-color-surface)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          background: 'var(--md-sys-color-surface-container-high)',
          borderRadius: 'var(--md-sys-shape-corner-large)',
          boxShadow: 'var(--md-sys-elevation-level1)',
          padding: 'var(--md-sys-spacing-8)',
          minWidth: 0,
          width: 'var(--md-sys-percent-100)',
          maxWidth: 'var(--md-sys-spacing-96)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'var(--md-sys-spacing-8)',
        }}
        aria-label="Login docente"
      >
        <Typography variant="h6" sx={{ textAlign: 'center', color: 'var(--md-sys-color-on-surface)' }}>
          Accedi a DocenteDoc AI
        </Typography>
        <Typography variant="body2" sx={{ textAlign: 'center', color: 'var(--md-sys-color-on-surface-variant)' }}>
          Inserisci le tue credenziali per continuare
        </Typography>
        <TextField
          label="Email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          autoComplete="email"
          fullWidth
        />
        <TextField
          label="Password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          fullWidth
        />
        {error && (
          <Typography variant="body2" sx={{ color: 'var(--md-sys-color-error)', width: 'var(--md-sys-percent-100)', textAlign: 'center' }}>{error}</Typography>
        )}
        <Button
          type="submit"
          variant="contained"
          sx={{ width: 'var(--md-sys-percent-100)' }}
        >
          Accedi
        </Button>
      </form>
    </div>
  );
};

export default SignInScreen;

