/**
 * schoolSystems/providers/spaggiariProvider.ts — Spaggiari RE (Registro Elettronico) adapter.
 *
 * Spaggiari is one of Italy's most widely-used school management systems.
 * This adapter translates Spaggiari's proprietary API shapes into the
 * provider-agnostic SchoolSystemProvider contract.
 *
 * Authentication: OAuth2 PKCE flow with username/password → access_token.
 * Token is held in memory only. Password is cleared immediately after login.
 *
 * Default endpoint: https://web.spaggiari.eu/rest/v1
 * Community API reference: https://github.com/Lioydiano/Classeviva-Official-Endpoints
 */

import { AxiosProvider } from './axiosProvider';
import type {
    ProviderCredentials,
    RawClass,
    RawStudent,
    RawGrade,
    RawAttendance,
} from '../types';

// ─── Spaggiari-native response shapes ─────────────────────────────────────────

interface SpaggLoginResponse {
    token?: string;
    access_token?: string;
    expire?: string;
}

interface SpaggStudent {
    pk: string;
    cognome: string;
    nome: string;
    classeId: string;
    dataNascita?: string;
    codiceFiscale?: string;
    bes?: boolean;
    dsa?: boolean;
    l104?: boolean;
}

interface SpaggGrade {
    pk: string;
    alunnoId: string;
    materiaDesc: string;
    datGiorno: string;           // "DD/MM/YYYY"
    decValore: string;           // "7.50", "8"
    tipoValutazione?: string;    // "scritto" | "orale" | "pratico"
    periodoDesc?: string;
    testo?: string;
}

interface SpaggClass {
    pk: string;
    anno: number;
    sezione: string;
    annoScolastico: string;
    corso?: string;
}

// ─── Adapter ──────────────────────────────────────────────────────────────────

export class SpaggiariProvider extends AxiosProvider {
    override readonly id = 'spaggiari';
    override readonly name = 'Spaggiari Registro Elettronico';

    private accessToken: string | null = null;

    // ─── Auth ─────────────────────────────────────────────────────────────────

    override async connect(credentials: ProviderCredentials): Promise<boolean> {
        this.credentials = { ...credentials };
        try {
            const res = await fetch(`${credentials.endpoint}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    uid: credentials.username,
                    pwd: credentials.password,
                    cid: credentials.schoolCode,
                }),
            });
            if (!res.ok) return false;
            const data = await res.json() as SpaggLoginResponse;
            this.accessToken = data.access_token ?? data.token ?? null;
            this._connected = this.accessToken !== null;
        } catch {
            this._connected = false;
        }
        // SECURITY: clear password from memory immediately
        if (this.credentials) delete this.credentials.password;
        return this._connected;
    }

    override async disconnect(): Promise<void> {
        this.accessToken = null;
        await super.disconnect();
    }

    protected override buildHeaders(): Record<string, string> {
        if (!this.accessToken) throw new Error('Spaggiari: token di accesso mancante. Ricollegati.');
        return {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${this.accessToken}`,
        };
    }

    // ─── Fetch with Spaggiari-native shape mapping ────────────────────────────

    override async fetchClasses(): Promise<RawClass[]> {
        const data = await this._get<{ items: SpaggClass[] }>('/classi');
        return data.items.map((c) => ({
            externalId: c.pk,
            code: `${c.anno}${c.sezione}`,
            year: c.anno,
            schoolYear: c.annoScolastico,
            section: c.sezione,
            course: c.corso,
        }));
    }

    override async fetchStudents(classCode: string): Promise<RawStudent[]> {
        const data = await this._get<{ items: SpaggStudent[] }>(
            `/classi/${encodeURIComponent(classCode)}/alunni`,
        );
        return data.items.map((s) => ({
            externalId: s.pk,
            firstName: s.nome,
            lastName: s.cognome,
            classCode,
            birthDate: s.dataNascita ? this.toIso(s.dataNascita) : undefined,
            fiscalCode: s.codiceFiscale,
            specialNeeds: { bes: s.bes, dsa: s.dsa, l104: s.l104 },
        }));
    }

    override async fetchGrades(classCode: string, period?: string): Promise<RawGrade[]> {
        const qs = period ? `?periodo=${encodeURIComponent(period)}` : '';
        const data = await this._get<{ items: SpaggGrade[] }>(
            `/classi/${encodeURIComponent(classCode)}/voti${qs}`,
        );
        return data.items.map((g) => ({
            externalId: g.pk,
            studentExternalId: g.alunnoId,
            subject: g.materiaDesc,
            date: this.toIso(g.datGiorno),
            gradeValue: g.decValore,
            gradeType: g.tipoValutazione,
            period: g.periodoDesc,
            note: g.testo,
        }));
    }

    override async pushGrade(grade: RawGrade): Promise<{ ok: boolean; externalId?: string }> {
        const res = await this._post<{ ok: boolean; pk?: string }>('/voti', {
            alunnoId: grade.studentExternalId,
            materiaDesc: grade.subject,
            datGiorno: this.toItDate(grade.date),
            decValore: grade.gradeValue,
            tipoValutazione: grade.gradeType ?? 'scritto',
            testo: grade.note,
        });
        return { ok: res.ok, externalId: res.pk };
    }

    override async pushAttendance(entry: RawAttendance): Promise<{ ok: boolean }> {
        return this._post<{ ok: boolean }>('/assenze', {
            alunnoId: entry.studentExternalId,
            datGiorno: this.toItDate(entry.date),
            tipo: entry.type,
            minuti: entry.minutes,
        });
    }

    // ─── Date helpers ─────────────────────────────────────────────────────────

    /** "DD/MM/YYYY" → "YYYY-MM-DD" */
    private toIso(date: string): string {
        if (date.includes('-')) return date; // already ISO
        const [day, month, year] = date.split('/');
        return `${year}-${month}-${day}`;
    }

    /** "YYYY-MM-DD" → "DD/MM/YYYY" */
    private toItDate(iso: string): string {
        const [year, month, day] = iso.split('-');
        return `${day}/${month}/${year}`;
    }
}
