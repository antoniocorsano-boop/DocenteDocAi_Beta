/**
 * contexts/AuthContext.tsx — P25 / P28
 *
 * AuthProvider globale per DocenteDoc AI.
 *
 * Integra:
 *   • useSystemStore — fonte di verità per lo user state (Zustand)
 *   • backend Express (VITE_BACKEND_URL) — per login/logout con sessione server-side
 *   • KeyVault automatico — initKeyVault/clearKeyVault già wired in useSystemStore.setUser
 *   • Google One Tap / GIS — loginWithGoogle(credential) → POST /auth/google
 *
 * Pattern:
 *   • Al mount: GET /user/me — se sessione attiva, sincronizza utente in store (con plan)
 *   • loginWithGoogle(credential): POST /auth/google → aggiorna store
 *   • login(email, password): dev stub, POST /auth/login
 *   • logout(): POST /auth/logout → pulisce store e sessione server-side
 *   • isAuthenticated: derivato da user !== null
 *
 * Uso:
 *   // In main.tsx (wrappa l'intera app):
 *   <AuthProvider>
 *     <App />
 *   </AuthProvider>
 *
 *   // In qualsiasi componente:
 *   const { user, isAuthenticated, loginWithGoogle, logout } = useAuth();
 */

import React, { createContext, useContext, useEffect, useCallback } from 'react';
import { useSystemStore } from '../stores/useSystemStore';
import type { UserProfile } from '../types';

// ─── Config ───────────────────────────────────────────────────────────────────

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL as string | undefined ?? '';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AuthContextValue {
  /** Profilo utente corrente, null se non autenticato. */
  user:            UserProfile | null;
  /** true se l'utente è autenticato. */
  isAuthenticated: boolean;
  /**
   * Esegue il login tramite Google ID token (One Tap / GIS).
   * Invia il credential JWT a POST /auth/google per la verifica server-side.
   * @throws se la richiesta fallisce o il token non è valido
   */
  loginWithGoogle: (credential: string) => Promise<void>;
  /**
   * Esegue il login via backend Express (dev stub — email/password).
   * In produzione usare loginWithGoogle.
   * @throws se la richiesta fallisce o le credenziali non sono valide
   */
  login:  (email: string, password: string) => Promise<void>;
  /** Esegue il logout: distrugge la sessione server e pulisce lo store. */
  logout: () => Promise<void>;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const user        = useSystemStore(s => s.user);
  const setUser     = useSystemStore(s => s.actions.setUser);

  // Al mount: tenta di ripristinare la sessione dal backend (se disponibile).
  useEffect(() => {
    if (!BACKEND_URL) return;

    const controller = new AbortController();

    fetch(`${BACKEND_URL}/user/me`, {
      credentials: 'include',
      signal:      controller.signal,
    })
      .then(async res => {
        if (!res.ok) return;
        const data = await res.json() as { userId: string; email: string | null; plan?: 'free' | 'pro' };
        setUser({
          id:          data.userId,
          displayName: data.email ?? data.userId,
          email:       data.email ?? undefined,
          plan:        data.plan  ?? 'free',
        });
      })
      .catch(err => {
        if ((err as Error).name !== 'AbortError') {
          console.warn('[AuthContext] /user/me non disponibile:', (err as Error).message);
        }
      });

    return () => controller.abort();
  }, [setUser]);

  const loginWithGoogle = useCallback(async (credential: string): Promise<void> => {
    if (!BACKEND_URL) {
      // Dev fallback without backend: parse email from credential (it's the email in stub mode)
      setUser({ id: credential, displayName: credential, email: credential, plan: 'free' });
      return;
    }

    const res = await fetch(`${BACKEND_URL}/auth/google`, {
      method:      'POST',
      headers:     { 'Content-Type': 'application/json' },
      credentials: 'include',
      body:        JSON.stringify({ credential }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: 'Errore di rete' })) as { error?: string };
      throw new Error(body.error ?? `Login Google fallito (${res.status})`);
    }

    const { user: serverUser } = await res.json() as {
      user: { userId: string; email: string; displayName?: string; photoUrl?: string; plan: 'free' | 'pro' }
    };
    setUser({
      id:          serverUser.userId,
      displayName: serverUser.displayName ?? serverUser.email,
      email:       serverUser.email,
      photoURL:    serverUser.photoUrl,
      plan:        serverUser.plan,
    });
  }, [setUser]);

  const login = useCallback(async (email: string, password: string): Promise<void> => {
    if (!BACKEND_URL) {
      setUser({ id: email, displayName: email, email, plan: 'free' });
      return;
    }

    const res = await fetch(`${BACKEND_URL}/auth/login`, {
      method:      'POST',
      headers:     { 'Content-Type': 'application/json' },
      credentials: 'include',
      body:        JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: 'Errore di rete' })) as { error?: string };
      throw new Error(body.error ?? `Login fallito (${res.status})`);
    }

    const { user: serverUser } = await res.json() as { user: { userId: string; email: string; plan?: 'free' | 'pro' } };
    setUser({
      id:          serverUser.userId,
      displayName: serverUser.email,
      email:       serverUser.email,
      plan:        serverUser.plan ?? 'free',
    });
  }, [setUser]);

  const logout = useCallback(async (): Promise<void> => {
    setUser(null);

    if (!BACKEND_URL) return;

    try {
      await fetch(`${BACKEND_URL}/auth/logout`, {
        method:      'POST',
        credentials: 'include',
      });
    } catch (err) {
      console.warn('[AuthContext] logout backend fallito:', (err as Error).message);
    }
  }, [setUser]);

  const value: AuthContextValue = {
    user,
    isAuthenticated: user !== null,
    loginWithGoogle,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Restituisce il contesto di autenticazione.
 * @throws se usato fuori da AuthProvider
 */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve essere usato dentro <AuthProvider>');
  return ctx;
}

export default AuthProvider;
