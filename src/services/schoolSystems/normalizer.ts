/**
 * schoolSystems/normalizer.ts — Maps raw external provider data to DocenteDoc types.
 *
 * This is the ONLY layer that translates provider-native formats into the
 * canonical Studente / Valutazione types used by the rest of the application.
 *
 * Rules:
 *   - Core types (Studente, Valutazione) are never modified here — only constructed.
 *   - Normalized IDs are prefixed `ext_${providerId}_...` for stable deduplication.
 *   - The `saveStudent()` store action deduplicates by ID, so re-syncing is safe.
 *   - Grade type labels are normalized across Italian (Spaggiari) and English (Argo) conventions.
 */

import type { Studente, Valutazione } from '../../types';
import type { RawStudent, RawGrade, RawClass, NormalizedClass } from './types';

// ─── Grade type normalization ─────────────────────────────────────────────────

const GRADE_TYPE_MAP: Readonly<Record<string, Valutazione['tipo']>> = {
    // Italian (Spaggiari style)
    orale:    'Orale',
    scritto:  'Scritto',
    pratico:  'Pratico',
    test:     'Test',
    verifica: 'Verifica',
    // English (Argo code style)
    oral:     'Orale',
    written:  'Scritto',
    practical:'Pratico',
    quiz:     'Test',
    // Argo single-char codes
    o: 'Orale',
    s: 'Scritto',
    p: 'Pratico',
};

function mapGradeType(raw?: string): Valutazione['tipo'] {
    if (!raw) return 'Verifica';
    return GRADE_TYPE_MAP[raw.toLowerCase()] ?? 'Verifica';
}

// ─── Student normalization ────────────────────────────────────────────────────

/**
 * Convert a raw provider student record into a DocenteDoc `Studente`.
 *
 * The `id` is prefixed with the provider id to:
 *   a) prevent collisions when multiple providers are connected
 *   b) guarantee idempotent upserts via `saveStudent()` (deduplicates by id)
 */
export function normalizeStudent(raw: RawStudent, providerId: string): Studente {
    return {
        id:          `ext_${providerId}_${raw.externalId}`,
        nome:        raw.firstName.trim(),
        cognome:     raw.lastName.trim(),
        classe:      raw.classCode,
        dataNascita: raw.birthDate,
        hasBES:      raw.specialNeeds?.bes  ?? false,
        hasDSA:      raw.specialNeeds?.dsa  ?? false,
        has104:      raw.specialNeeds?.l104 ?? false,
        isArchived:  false,
    };
}

// ─── Grade normalization ──────────────────────────────────────────────────────

/**
 * Convert a raw provider grade record into a DocenteDoc `Valutazione`.
 *
 * The `studenteId` resolves to the normalized student ID that was produced
 * by `normalizeStudent()` for the same provider and external student ID.
 *
 * NOTE: The returned object includes an `id`. When passed to `addEvaluation()`
 * (which takes `Omit<Valutazione, 'id'>`), strip the `id` field using
 * `routeSchoolSyncIntent` which handles this automatically.
 */
export function normalizeGrade(raw: RawGrade, providerId: string): Valutazione {
    return {
        id:         `ext_${providerId}_grade_${raw.externalId}`,
        studenteId: `ext_${providerId}_${raw.studentExternalId}`,
        materia:    raw.subject,
        data:       raw.date,
        tipo:       mapGradeType(raw.gradeType),
        voto:       raw.gradeValue,
        note:       raw.note,
    };
}

// ─── Class normalization ──────────────────────────────────────────────────────

export function normalizeClass(raw: RawClass, providerId: string): NormalizedClass {
    return {
        id:          `ext_${providerId}_class_${raw.externalId}`,
        externalId:  raw.externalId,
        providerId,
        code:        raw.code,
        year:        raw.year,
        schoolYear:  raw.schoolYear,
        course:      raw.course,
    };
}

// ─── Batch helpers ────────────────────────────────────────────────────────────

export function normalizeStudents(raws: RawStudent[], providerId: string): Studente[] {
    return raws.map((r) => normalizeStudent(r, providerId));
}

export function normalizeGrades(raws: RawGrade[], providerId: string): Valutazione[] {
    return raws.map((r) => normalizeGrade(r, providerId));
}

export function normalizeClasses(raws: RawClass[], providerId: string): NormalizedClass[] {
    return raws.map((r) => normalizeClass(r, providerId));
}
