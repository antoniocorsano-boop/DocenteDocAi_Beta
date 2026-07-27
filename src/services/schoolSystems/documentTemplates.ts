/**
 * schoolSystems/documentTemplates.ts — Official Italian school document generator.
 *
 * Generates structured Markdown documents that comply with Italian ministerial
 * formatting standards. Markdown output can be rendered in-app or exported to PDF.
 *
 * Supported types:
 *   pagella                   — School report card (Scheda di Valutazione)
 *   verbale_scrutinio         — Grading meeting minutes (Verbale Scrutinio)
 *   relazione_finale          — End-of-year class report
 *   certificazione_competenze — Competency certification (DM n. 742/2017)
 *   piano_recupero            — Remediation plan for failing students
 *   comunicazione_famiglie    — Family communication letter
 *
 * All generated documents include:
 *   - School header with codice meccanografico
 *   - ISO 8601 generation timestamp
 *   - Structured tables formatted in GitHub-flavoured Markdown
 */

import type {
    OfficialDocumentType,
    OfficialDocumentTemplate,
    ExportableDocument,
} from './types';
import type { Studente, Valutazione } from '../../types';

// ─── Common header ────────────────────────────────────────────────────────────

function buildHeader(meta: OfficialDocumentTemplate, title: string): string {
    const date = new Date(meta.generatedAt).toLocaleDateString('it-IT', {
        day: '2-digit', month: 'long', year: 'numeric',
    });
    return [
        `# ${meta.schoolName}`,
        `**Codice meccanografico:** ${meta.schoolCode}`,
        `**Anno scolastico:** ${meta.schoolYear}`,
        `**Classe:** ${meta.classCode}`,
        meta.subject ? `**Materia:** ${meta.subject}` : '',
        `**Docente:** ${meta.teacherName}`,
        `**Data:** ${date}`,
        '',
        `---`,
        '',
        `## ${title}`,
        '',
    ].filter(Boolean).join('\n');
}

function buildFooter(meta: OfficialDocumentTemplate): string {
    return [
        '',
        '---',
        '',
        `*Documento generato da DocenteDoc AI il ${new Date(meta.generatedAt).toLocaleString('it-IT')}.*`,
        `*Firma docente: ${meta.teacherName}* ___________________________`,
    ].join('\n');
}

// ─── Template builders ────────────────────────────────────────────────────────

function buildPagella(
    meta: OfficialDocumentTemplate,
    students: Studente[],
    valutazioni: Valutazione[],
): string {
    const header = buildHeader(meta, 'Scheda di Valutazione');

    const gradeMap = new Map<string, Valutazione[]>();
    for (const v of valutazioni) {
        const list = gradeMap.get(v.studenteId) ?? [];
        list.push(v);
        gradeMap.set(v.studenteId, list);
    }

    const rows = students.map((s) => {
        const grades = gradeMap.get(s.id) ?? [];
        const avgRaw = grades.length
            ? grades
                .map((g) => parseFloat(g.voto))
                .filter((n) => !isNaN(n))
                .reduce((a, b) => a + b, 0) / grades.filter((g) => !isNaN(parseFloat(g.voto))).length
            : NaN;
        const avg = isNaN(avgRaw) ? '—' : avgRaw.toFixed(1);
        return `| ${s.cognome} ${s.nome} | ${grades.length} | ${avg} |`;
    });

    const table = [
        '| Studente | N. Voti | Media |',
        '|----------|---------|-------|',
        ...rows,
    ].join('\n');

    return header + table + buildFooter(meta);
}

function buildVerbaleScrutinio(
    meta: OfficialDocumentTemplate,
    students: Studente[],
    valutazioni: Valutazione[],
): string {
    const header = buildHeader(meta, 'Verbale di Scrutinio');
    const ordine = [
        '**Ordine del giorno:**',
        '1. Appello e verifica presenze',
        '2. Presentazione proposte di voto',
        '3. Delibera valutazioni finali',
        '4. Varie ed eventuali',
        '',
        '**Delibere:**',
        '',
    ].join('\n');

    const gradeMap = new Map<string, string[]>();
    for (const v of valutazioni) {
        const list = gradeMap.get(v.studenteId) ?? [];
        list.push(`${v.materia}: ${v.voto}`);
        gradeMap.set(v.studenteId, list);
    }

    const rows = students.map((s) => {
        const grades = (gradeMap.get(s.id) ?? []).join(', ') || '—';
        return `| ${s.cognome} ${s.nome} | ${grades} | Ammesso/a |`;
    });

    const table = [
        '| Studente | Voti | Esito |',
        '|----------|------|-------|',
        ...rows,
    ].join('\n');

    return header + ordine + table + buildFooter(meta);
}

function buildRelazione(
    meta: OfficialDocumentTemplate,
    students: Studente[],
): string {
    const header = buildHeader(meta, 'Relazione Finale del Docente');
    const body = [
        '### Composizione della classe',
        '',
        `La classe ${meta.classCode} è composta da **${students.length} studenti**.`,
        students.filter((s) => s.hasBES || s.hasDSA || s.has104).length > 0
            ? `Sono presenti ${students.filter((s) => s.hasBES).length} alunni BES, ` +
              `${students.filter((s) => s.hasDSA).length} con DSA, ` +
              `${students.filter((s) => s.has104).length} con certificazione L.104/92.`
            : '',
        '',
        '### Obiettivi raggiunti',
        '',
        '_[Da compilare]_',
        '',
        '### Metodologie adottate',
        '',
        '_[Da compilare]_',
        '',
        '### Valutazione del profitto',
        '',
        '_[Da compilare]_',
    ].filter(Boolean).join('\n');

    return header + body + buildFooter(meta);
}

function buildCertificazione(
    meta: OfficialDocumentTemplate,
    student: Studente,
    competencies: Array<{ name: string; level: string }>,
): string {
    const header = buildHeader(
        { ...meta, classCode: `${meta.classCode} — ${student.cognome} ${student.nome}` },
        'Certificazione delle Competenze (DM 742/2017)',
    );

    const rows = competencies.map((c) => `| ${c.name} | ${c.level} |`);
    const table = [
        '| Competenza | Livello |',
        '|------------|---------|',
        ...rows,
    ].join('\n');

    return header + table + buildFooter(meta);
}

function buildPianoRecupero(
    meta: OfficialDocumentTemplate,
    student: Studente,
    subject: string,
    gaps: string[],
): string {
    const header = buildHeader(
        { ...meta, subject, classCode: `${meta.classCode} — ${student.cognome} ${student.nome}` },
        'Piano di Recupero',
    );

    const gapList = gaps.map((g) => `- ${g}`).join('\n');
    const body = [
        `**Studente:** ${student.cognome} ${student.nome}`,
        `**Materia:** ${subject}`,
        '',
        '### Carenze rilevate',
        '',
        gapList || '- _Non specificate_',
        '',
        '### Interventi previsti',
        '',
        '_[Da compilare]_',
        '',
        '### Modalità di verifica del recupero',
        '',
        '_[Da compilare]_',
    ].join('\n');

    return header + body + buildFooter(meta);
}

function buildComunicazione(
    meta: OfficialDocumentTemplate,
    student: Studente,
    subject: string,
    body: string,
): string {
    const header = buildHeader(meta, 'Comunicazione alle Famiglie');
    const content = [
        `**Destinatario:** Famiglia di ${student.cognome} ${student.nome}`,
        `**Oggetto:** ${subject}`,
        '',
        body,
    ].join('\n');
    return header + content + buildFooter(meta);
}

// ─── Public API ───────────────────────────────────────────────────────────────

export type DocumentGenerationInput =
    | { type: 'pagella';                   students: Studente[]; valutazioni: Valutazione[] }
    | { type: 'verbale_scrutinio';         students: Studente[]; valutazioni: Valutazione[] }
    | { type: 'relazione_finale';          students: Studente[] }
    | { type: 'certificazione_competenze'; student: Studente; competencies: Array<{ name: string; level: string }> }
    | { type: 'piano_recupero';            student: Studente; subject: string; gaps: string[] }
    | { type: 'comunicazione_famiglie';    student: Studente; subject: string; body: string };

const TYPE_LABELS: Record<OfficialDocumentType, string> = {
    pagella:                   'Scheda_Valutazione',
    verbale_scrutinio:         'Verbale_Scrutinio',
    relazione_finale:          'Relazione_Finale',
    certificazione_competenze: 'Certificazione_Competenze',
    piano_recupero:            'Piano_Recupero',
    comunicazione_famiglie:    'Comunicazione_Famiglie',
};

/**
 * Generate an official Italian school document.
 *
 * @param meta  - Document metadata (school, teacher, class, school year)
 * @param input - Document-specific data payload
 * @returns ExportableDocument with filename and Markdown content
 */
export function generateOfficialDocument(
    meta: OfficialDocumentTemplate,
    input: DocumentGenerationInput,
): ExportableDocument {
    let content: string;

    switch (input.type) {
        case 'pagella':
            content = buildPagella(meta, input.students, input.valutazioni);
            break;
        case 'verbale_scrutinio':
            content = buildVerbaleScrutinio(meta, input.students, input.valutazioni);
            break;
        case 'relazione_finale':
            content = buildRelazione(meta, input.students);
            break;
        case 'certificazione_competenze':
            content = buildCertificazione(meta, input.student, input.competencies);
            break;
        case 'piano_recupero':
            content = buildPianoRecupero(meta, input.student, input.subject, input.gaps);
            break;
        case 'comunicazione_famiglie':
            content = buildComunicazione(meta, input.student, input.subject, input.body);
            break;
    }

    const dateStamp = meta.generatedAt.split('T')[0];
    const filename = `${TYPE_LABELS[input.type]}_${meta.classCode}_${dateStamp}.md`
        .replace(/[^a-zA-Z0-9_\-.]/g, '_');

    return { type: input.type, filename, content, metadata: meta };
}
