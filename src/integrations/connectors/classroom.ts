/**
 * Google Classroom Connector
 *
 * Wraps the Google Classroom REST API using the same GAPI/OAuth pattern
 * already established by googleDriveService.ts.
 *
 * Requires OAuth scope: https://www.googleapis.com/auth/classroom.courses.readonly
 *                       https://www.googleapis.com/auth/classroom.rosters.readonly
 *
 * Usage:
 *   await classroomConnector.connect();
 *   const courses = await classroomConnector.listCourses();
 *   const students = await classroomConnector.listStudents(courseId);
 */

import type { ClassroomCourse, ClassroomStudent } from '../../types/integration.types';
import { loadGapiClient, requestAccessToken, getAccessToken } from '../../services/googleDriveService';

// ─── Constants ────────────────────────────────────────────────────────────────

const CLASSROOM_SCOPES = [
    'https://www.googleapis.com/auth/classroom.courses.readonly',
    'https://www.googleapis.com/auth/classroom.rosters.readonly',
].join(' ');

const BASE_URL = 'https://classroom.googleapis.com/v1';

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function classroomFetch<T>(path: string): Promise<T> {
    const token = getAccessToken();
    if (!token) throw new Error('Non autenticato. Connetti Google Classroom prima di procedere.');

    const res = await fetch(`${BASE_URL}${path}`, {
        headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`Classroom API ${res.status}: ${body}`);
    }

    return res.json() as Promise<T>;
}

// ─── Connector ────────────────────────────────────────────────────────────────

export const classroomConnector = {
    /**
     * Trigger the Google OAuth flow requesting Classroom read scopes.
     * If GAPI is already loaded (from Drive), reuses it.
     */
    async connect(): Promise<void> {
        await loadGapiClient();
        await requestAccessToken(CLASSROOM_SCOPES);
    },

    /**
     * List all active courses the authenticated teacher owns or teaches.
     */
    async listCourses(): Promise<ClassroomCourse[]> {
        const data = await classroomFetch<{ courses?: GoogleCourse[] }>('/courses?courseStates=ACTIVE&teacherId=me');
        return (data.courses ?? []).map(normaliseCourse);
    },

    /**
     * List enrolled students for a given course ID.
     */
    async listStudents(courseId: string): Promise<ClassroomStudent[]> {
        const data = await classroomFetch<{ students?: GoogleStudent[] }>(`/courses/${courseId}/students`);
        return (data.students ?? []).map((s) => normaliseStudent(s, courseId));
    },
};

// ─── Normalisation ────────────────────────────────────────────────────────────

interface GoogleCourse {
    id: string;
    name: string;
    section?: string;
    enrollmentCode?: string;
}

interface GoogleStudent {
    userId: string;
    profile: {
        name: { fullName: string };
        emailAddress?: string;
    };
}

function normaliseCourse(c: GoogleCourse): ClassroomCourse {
    return {
        id: c.id,
        name: c.name,
        section: c.section,
        enrollmentCode: c.enrollmentCode,
    };
}

function normaliseStudent(s: GoogleStudent, courseId: string): ClassroomStudent {
    return {
        id: s.userId,
        name: s.profile.name.fullName,
        email: s.profile.emailAddress ?? '',
        courseId,
    };
}
