/**
 * schoolSystems/providers/axiosProvider.ts — Generic HTTP provider adapter.
 *
 * Uses the browser Fetch API (no external axios dependency).
 * Named "AxiosProvider" after the architectural pattern (configurable REST adapter).
 * Serves as the base class for SpaggiariProvider and ArgoProvider, and can be
 * instantiated directly for any REST-compliant school management system.
 *
 * CORS: Direct browser→school-server requests will fail if the school system
 * does not set CORS headers. In production, proxy all calls through the
 * Vercel Edge Function (api/proxy.ts — to be created per installation).
 */

import type {
    SchoolSystemProvider,
    ProviderCredentials,
    RawClass,
    RawStudent,
    RawGrade,
    RawAttendance,
} from '../types';

export class AxiosProvider implements SchoolSystemProvider {
    readonly id: string = 'axios_generic';
    readonly name: string = 'Provider HTTP generico';

    protected credentials: ProviderCredentials | null = null;
    protected _connected = false;

    // ─── Auth ─────────────────────────────────────────────────────────────────

    async connect(credentials: ProviderCredentials): Promise<boolean> {
        this.credentials = { ...credentials };
        try {
            const resp = await this._get<{ ok?: boolean; status?: string }>('/auth/verify');
            this._connected = resp.ok === true || resp.status === 'ok';
        } catch {
            this._connected = false;
        }
        // Purge password from memory after auth attempt
        if (this.credentials) delete this.credentials.password;
        return this._connected;
    }

    async disconnect(): Promise<void> {
        this.credentials = null;
        this._connected = false;
    }

    isConnected(): boolean {
        return this._connected;
    }

    // ─── Fetch ────────────────────────────────────────────────────────────────

    async fetchClasses(): Promise<RawClass[]> {
        return this._get<RawClass[]>('/classes');
    }

    async fetchStudents(classCode: string): Promise<RawStudent[]> {
        return this._get<RawStudent[]>(`/classes/${encodeURIComponent(classCode)}/students`);
    }

    async fetchGrades(classCode: string, period?: string): Promise<RawGrade[]> {
        const qs = period ? `?period=${encodeURIComponent(period)}` : '';
        return this._get<RawGrade[]>(`/classes/${encodeURIComponent(classCode)}/grades${qs}`);
    }

    // ─── Push ─────────────────────────────────────────────────────────────────

    async pushGrade(grade: RawGrade): Promise<{ ok: boolean; externalId?: string }> {
        return this._post<{ ok: boolean; externalId?: string }>('/grades', grade);
    }

    async pushAttendance(entry: RawAttendance): Promise<{ ok: boolean }> {
        return this._post<{ ok: boolean }>('/attendance', entry);
    }

    // ─── HTTP helpers ─────────────────────────────────────────────────────────

    protected buildHeaders(): Record<string, string> {
        if (!this.credentials) throw new Error('Provider non connesso. Chiama connect() prima.');
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        };
        if (this.credentials.apiKey) {
            headers['Authorization'] = `Bearer ${this.credentials.apiKey}`;
        }
        if (this.credentials.schoolCode) {
            headers['X-School-Code'] = this.credentials.schoolCode;
        }
        return headers;
    }

    protected async _get<T = unknown>(path: string): Promise<T> {
        if (!this.credentials) throw new Error('Provider non connesso.');
        const url = `${this.credentials.endpoint}${path}`;
        const res = await fetch(url, { method: 'GET', headers: this.buildHeaders() });
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
        return res.json() as Promise<T>;
    }

    protected async _post<T = unknown>(path: string, body: unknown): Promise<T> {
        if (!this.credentials) throw new Error('Provider non connesso.');
        const url = `${this.credentials.endpoint}${path}`;
        const res = await fetch(url, {
            method: 'POST',
            headers: this.buildHeaders(),
            body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
        return res.json() as Promise<T>;
    }
}
