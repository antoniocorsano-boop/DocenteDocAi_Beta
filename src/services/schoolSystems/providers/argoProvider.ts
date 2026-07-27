/**
 * schoolSystems/providers/argoProvider.ts — Argo ScuolaNext adapter.
 *
 * Argo is the second most widely-used school registry in Italy.
 * Authentication: custom header-based session with username/password.
 * After the initial request, the server returns an `x-auth-token` header
 * which is used for all subsequent requests.
 *
 * Standard request headers (set per community documentation):
 *   x-key-app     — public app key (community-known)
 *   x-version     — app version string
 *   x-cod-min     — school codice meccanografico
 *   x-cognome     — teacher last name (UPPERCASE)
 *   x-nome        — teacher first name (UPPERCASE)
 *   x-user-id     — provider username
 *   x-user-password — provider password (login request only)
 *   x-auth-token  — session token returned by login
 *
 * Reference: https://github.com/hearot/ArgoScuolaNext-Python
 * Default endpoint: https://www.portaleargo.it/famiglia/api/rest
 */

import { AxiosProvider } from './axiosProvider';
import type {
    ProviderCredentials,
    RawClass,
    RawStudent,
    RawGrade,
    RawAttendance,
} from '../types';

// Community-known public application key — not a secret
const ARGO_APP_KEY = 'ax6542sdru3217t4eesd9';
const ARGO_APP_VERSION = '2.4.0';

// ─── Argo-native response shapes ──────────────────────────────────────────────

interface ArgoStudent {
    alunno: {
        id: string;
        cognome: string;
        nome: string;
        dataNascita?: string;
        codiceFiscale?: string;
    };
    classeFrequentata: string;
    bes?: '1' | '0';
    dsa?: '1' | '0';
    h104?: '1' | '0';
}

interface ArgoGrade {
    pkVoto: string;
    prgAlunno: string;
    desMateria: string;
    datEvento: string;     // ISO 8601 "YYYY-MM-DD"
    decVoto: string;       // "7", "8.50"
    codTipo?: string;      // "S" scritto, "O" orale, "P" pratico
    periodoCod?: string;   // "Q" quadrimestre, "1T" first trimester
    desCommento?: string;
}

interface ArgoClass {
    prgClasse: string;
    desDenominazione: string;   // "3 A", "2 B"
    numAnno: number;
    annoScolastico: string;     // "2025/26"
    desCorsoBreve?: string;     // "LIC.SCIENTIFICO"
}

// ─── Adapter ──────────────────────────────────────────────────────────────────

export class ArgoProvider extends AxiosProvider {
    override readonly id = 'argo';
    override readonly name = 'Argo ScuolaNext';

    private authToken: string | null = null;
    private teacherLast = '';
    private teacherFirst = '';

    // ─── Auth ─────────────────────────────────────────────────────────────────

    override async connect(credentials: ProviderCredentials): Promise<boolean> {
        this.credentials = { ...credentials };

        // Argo stores teacher name in username format "COGNOME.NOME"
        const parts = (credentials.username ?? '').split('.');
        this.teacherLast  = (parts[0] ?? '').toUpperCase();
        this.teacherFirst = (parts[1] ?? '').toUpperCase();

        try {
            const res = await fetch(`${credentials.endpoint}/login`, {
                method: 'GET',
                headers: this.buildArgoHeaders({ includePassword: true }),
            });
            if (!res.ok) return false;
            this.authToken = res.headers.get('x-auth-token');
            this._connected = this.authToken !== null;
        } catch {
            this._connected = false;
        }
        // SECURITY: clear password from memory immediately
        if (this.credentials) delete this.credentials.password;
        return this._connected;
    }

    override async disconnect(): Promise<void> {
        this.authToken = null;
        await super.disconnect();
    }

    protected override buildHeaders(): Record<string, string> {
        return this.buildArgoHeaders({ includePassword: false });
    }

    private buildArgoHeaders(opts: { includePassword: boolean }): Record<string, string> {
        if (!this.credentials) throw new Error('Argo: credenziali mancanti.');
        const h: Record<string, string> = {
            'x-key-app':  ARGO_APP_KEY,
            'x-version':  ARGO_APP_VERSION,
            'x-cod-min':  this.credentials.schoolCode,
            'x-cognome':  this.teacherLast,
            'x-nome':     this.teacherFirst,
            'x-user-id':  this.credentials.username ?? '',
            'Content-Type': 'application/json',
            'Accept':       'application/json',
        };
        if (opts.includePassword && this.credentials.password) {
            h['x-user-password'] = this.credentials.password;
        }
        if (this.authToken) {
            h['x-auth-token'] = this.authToken;
        }
        return h;
    }

    // ─── Fetch with Argo-native shape mapping ─────────────────────────────────

    override async fetchClasses(): Promise<RawClass[]> {
        const data = await this._get<{ dati: ArgoClass[] }>('/classi');
        return data.dati.map((c) => ({
            externalId: c.prgClasse,
            // Argo often formats "3 A" — collapse to "3A"
            code: c.desDenominazione.replace(/\s+/g, ''),
            year: c.numAnno,
            schoolYear: c.annoScolastico,
            course: c.desCorsoBreve,
        }));
    }

    override async fetchStudents(classCode: string): Promise<RawStudent[]> {
        const data = await this._get<{ dati: ArgoStudent[] }>(
            `/alunni?classe=${encodeURIComponent(classCode)}`,
        );
        return data.dati.map((s) => ({
            externalId: s.alunno.id,
            firstName:  s.alunno.nome,
            lastName:   s.alunno.cognome,
            classCode,
            birthDate:   s.alunno.dataNascita,
            fiscalCode:  s.alunno.codiceFiscale,
            specialNeeds: {
                bes: s.bes === '1',
                dsa: s.dsa === '1',
                l104: s.h104 === '1',
            },
        }));
    }

    override async fetchGrades(classCode: string, period?: string): Promise<RawGrade[]> {
        const qs = period ? `&periodo=${encodeURIComponent(period)}` : '';
        const data = await this._get<{ dati: ArgoGrade[] }>(
            `/voti?classe=${encodeURIComponent(classCode)}${qs}`,
        );
        return data.dati.map((g) => ({
            externalId:        g.pkVoto,
            studentExternalId: g.prgAlunno,
            subject:           g.desMateria,
            date:              g.datEvento,
            gradeValue:        g.decVoto,
            gradeType:         g.codTipo,
            period:            g.periodoCod,
            note:              g.desCommento,
        }));
    }

    override async pushGrade(grade: RawGrade): Promise<{ ok: boolean; externalId?: string }> {
        const res = await this._post<{ pkVoto?: string }>('/voti', {
            prgAlunno:   grade.studentExternalId,
            desMateria:  grade.subject,
            datEvento:   grade.date,
            decVoto:     grade.gradeValue,
            codTipo:     grade.gradeType ?? 'S',
            desCommento: grade.note,
        });
        return { ok: !!res.pkVoto, externalId: res.pkVoto };
    }

    override async pushAttendance(entry: RawAttendance): Promise<{ ok: boolean }> {
        await this._post<{ ok: boolean }>('/assenze', {
            prgAlunno: entry.studentExternalId,
            datEvento: entry.date,
            codTipo:   entry.type,
            numMinuti: entry.minutes ?? 0,
        });
        return { ok: true };
    }
}
