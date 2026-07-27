/**
 * stores/usePlanStore.ts — P28 Go-to-Market Tier 1
 *
 * Zustand store per il piano di abbonamento dell'utente.
 *
 * Responsabilità:
 *   • Mantiene il piano corrente ('free' | 'pro')
 *   • Espone isPro() per feature gating
 *   • Avvia upgrade Stripe Checkout via checkoutUpgrade()
 *   • Si sincronizza con useSystemStore.user.plan al login
 *
 * Uso:
 *   const { plan, isPro, checkoutUpgrade } = usePlanStore();
 */

import { create }         from 'zustand';
import { useSystemStore } from './useSystemStore';

const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL as string | undefined) ?? '';

// ─── Types ────────────────────────────────────────────────────────────────────

export type Plan = 'free' | 'pro';

interface PlanState {
  plan:            Plan;
  checkoutLoading: boolean;
  checkoutError:   string | null;

  /** Sync plan from UserProfile (called by AuthProvider after login). */
  setPlan:          (plan: Plan) => void;
  /** Returns true when user has a Pro subscription. */
  isPro:            () => boolean;
  /** Initiates Stripe Checkout — opens redirect URL returned by /billing/checkout. */
  checkoutUpgrade:  () => Promise<void>;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const usePlanStore = create<PlanState>((set, get) => ({
  plan:            'free',
  checkoutLoading: false,
  checkoutError:   null,

  setPlan: (plan) => set({ plan }),

  isPro: () => get().plan === 'pro',

  checkoutUpgrade: async () => {
    set({ checkoutLoading: true, checkoutError: null });

    if (!BACKEND_URL) {
      // Dev fallback: show message instead of redirect
      set({ checkoutLoading: false, checkoutError: 'Backend non configurato (dev mode)' });
      return;
    }

    try {
      const res = await fetch(`${BACKEND_URL}/billing/checkout`, {
        method:      'POST',
        headers:     { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (res.status === 401) {
        set({ checkoutLoading: false, checkoutError: 'Accedi prima di effettuare il pagamento' });
        return;
      }

      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: 'Errore di rete' })) as { error?: string };
        set({ checkoutLoading: false, checkoutError: body.error ?? 'Errore durante il checkout' });
        return;
      }

      const { url } = await res.json() as { url: string };
      if (url) {
        window.location.href = url;  // Stripe handles the rest
      }
    } catch (err) {
      set({
        checkoutLoading: false,
        checkoutError:   (err as Error).message ?? 'Errore di connessione',
      });
    }
  },
}));

// ─── Sync helper ─────────────────────────────────────────────────────────────

/**
 * Synchronizes the plan store whenever the user's profile changes in useSystemStore.
 * Call this once at app startup (e.g. in AuthProvider or main.tsx).
 */
export function syncPlanFromUser(): () => void {
  return useSystemStore.subscribe((state) => {
    const plan = state.user?.plan ?? 'free';
    usePlanStore.getState().setPlan(plan);
  });
}
