/**
 * schoolSystems/providerRegistry.ts — Runtime registry of connected school system providers.
 *
 * Singleton pattern (module-level), consistent with other DocenteDoc singletons.
 * Providers are registered once per session. Credentials remain inside the
 * provider instance (in memory only) — they are never stored in the registry itself.
 *
 * Usage:
 *   providerRegistry.register(new SpaggiariProvider());
 *   await providerRegistry.get('spaggiari')?.connect(creds);
 *   providerRegistry.getConnected();           // all live providers
 */

import type { SchoolSystemProvider } from './types';

class ProviderRegistryImpl {
    private readonly providers = new Map<string, SchoolSystemProvider>();

    register(provider: SchoolSystemProvider): void {
        this.providers.set(provider.id, provider);
    }

    unregister(providerId: string): void {
        this.providers.delete(providerId);
    }

    get(providerId: string): SchoolSystemProvider | undefined {
        return this.providers.get(providerId);
    }

    getAll(): SchoolSystemProvider[] {
        return [...this.providers.values()];
    }

    /** Returns only providers that have an active connection */
    getConnected(): SchoolSystemProvider[] {
        return this.getAll().filter((p) => p.isConnected());
    }

    has(providerId: string): boolean {
        return this.providers.has(providerId);
    }

    /** Disconnect and remove all providers (e.g. on user logout) */
    async disconnectAll(): Promise<void> {
        for (const p of this.getAll()) {
            await p.disconnect().catch(() => undefined);
        }
        this.providers.clear();
    }
}

export const providerRegistry = new ProviderRegistryImpl();
