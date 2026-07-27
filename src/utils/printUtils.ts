/**
 * printUtils.ts — Browser-native document printing
 * Replaces pdf-lib/jsPDF with HTML templates + window.print().
 * Opens a print-ready window for each document type.
 * Zero bundle cost — uses the browser's built-in PDF export.
 */
import type {
    Lezione, TimetableSettings, Studente, Valutazione, ValutazioneCompetenza,
    Uda, Competenza, PeriodoValutazione, BrochureContent,
    TechnicalDocumentContent, EssayContent, FaqItem, VocalAssistantGuide
} from '../types';
import type { GiudizioPeriodico } from '../types/student.types';

// ─── Shared Styles ───────────────────────────────────────────────────────────

const PRINT_STYLES = (landscape = false) => `<style>
  @page { size: A4 ${landscape ? 'landscape' : 'portrait'}; margin: 14mm; }
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .no-print { display: none !important; }
  }
  * { box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11pt; color: #1c1b1f; margin: 0; padding: 16px 20px; }
  h1 { font-size: 18pt; color: #6750a4; margin: 0 0 4px; }
  h2 { font-size: 13pt; color: #1c1b1f; border-bottom: 1.5px solid #cac4d0; padding-bottom: 4px; margin: 18px 0 8px; }
  h3 { font-size: 11pt; color: #49454f; margin: 10px 0 4px; }
  p { margin: 4px 0 8px; line-height: 1.5; }
  .header { border-bottom: 2px solid #6750a4; padding-bottom: 10px; margin-bottom: 16px; }
  .school-name { font-size: 9.5pt; color: #49454f; font-weight: 600; letter-spacing: 0.03em; text-transform: uppercase; }
  .meta { color: #49454f; font-size: 10pt; margin: 2px 0; }
  .section { margin-bottom: 14px; }
  .highlight-box { background: #f3edf7; border: 1.5px solid #6750a4; border-radius: 8px; padding: 12px 14px; margin: 12px 0; }
  .highlight-box .box-title { font-weight: 700; color: #6750a4; font-size: 12pt; margin-bottom: 8px; }
  table { border-collapse: collapse; width: 100%; margin: 8px 0; font-size: ${landscape ? '8pt' : '9.5pt'}; }
  th { background: #ede7f6; color: #1c1b1f; font-weight: 700; padding: 6px 8px; border: 1px solid #b0bec5; text-align: left; }
  td { padding: 5px 8px; border: 1px solid #e0e0e0; vertical-align: top; }
  tr:nth-child(even) td { background: #faf9fc; }
  .badge { display: inline-block; padding: 2px 10px; border-radius: 4px; font-weight: 700; font-size: 10pt; }
  .badge-A { background: #c8e6c9; color: #1b5e20; }
  .badge-B { background: #fff9c4; color: #f57f17; }
  .badge-C { background: #ffe0b2; color: #e65100; }
  .badge-D { background: #ffcdd2; color: #b71c1c; }
  .level-legend { margin-top: 16px; font-size: 9pt; color: #49454f; }
  ul { padding-left: 20px; margin: 4px 0 8px; }
  li { margin-bottom: 3px; }
  code { background: #f4f0fa; padding: 1px 5px; border-radius: 3px; font-size: 10pt; }
  .signature-row { display: flex; justify-content: space-between; margin-top: 36px; }
  .signature-block { text-align: center; }
  .signature-line { border-top: 1px solid #555; width: 160px; margin: 0 auto 4px; }
  .footer { margin-top: 20px; font-size: 9pt; color: #79747e; border-top: 1px solid #e6e0e9; padding-top: 8px; }
  .print-btn { display: inline-block; margin: 10px 0 14px; padding: 7px 18px; background: #6750a4; color: white; border: none; border-radius: 20px; font-size: 11pt; cursor: pointer; }
</style>`;

const printButton = `<button class="no-print print-btn" onclick="window.print()">&#128438; Stampa / Salva PDF</button>`;
const todayStr = () => new Date().toLocaleDateString('it-IT');

// ─── Print Engine ────────────────────────────────────────────────────────────

function wrapDocument(title: string, body: string, landscape = false): string {
    return `<!DOCTYPE html><html lang="it"><head><meta charset="UTF-8"><title>${title}</title>${PRINT_STYLES(landscape)}</head><body>${printButton}${body}</body></html>`;
}

function openPrintWindow(html: string): void {
    const win = window.open('', '_blank');
    if (!win) {
        // Popup blocked — fallback to blob URL
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 60000);
        return;
    }
    win.document.write(html);
    win.document.close();
}

// ─── HTML Builders ───────────────────────────────────────────────────────────

function buildHomeworkHtml(lesson: Lezione, settings: TimetableSettings): string {
    const materials = lesson.materialiDidattici ?? [];
    const materialsHtml = materials.length > 0 ? `
        <h2>Materiali di Studio</h2>
        <ul>
        ${materials.map(m => {
            const label = m.label || m.fileName || (m.file && m.file.name) || 'Materiale';
            const type = m.type === 'link' ? '(Link)' : m.type === 'kb' ? '(Documento KB)' : '(File)';
            const linkHtml = m.type === 'link' && m.url
                ? `<br><span style="font-size:9pt;color:#1565c0">${m.url}</span>` : '';
            return `<li>${label} ${type}${linkHtml}</li>`;
        }).join('')}
        </ul>` : '';

    const body = `
        <div class="header">
            <div class="school-name">${settings.nomeIstituto || 'Istituto Scolastico'}</div>
            <h1>Scheda Compiti &amp; Materiali</h1>
            <div class="meta">Classe: <strong>${lesson.classe}</strong> &nbsp;|&nbsp; Materia: <strong>${lesson.materia}</strong></div>
            <div class="meta">Docente: ${settings.nomeInsegnante} &nbsp;|&nbsp; Data: ${todayStr()}</div>
        </div>
        <div class="section">
            <h2>Argomento della Lezione</h2>
            <p>${lesson.contenuto}</p>
            ${lesson.obiettivi ? `<h3>Obiettivi Didattici</h3><p>${lesson.obiettivi}</p>` : ''}
        </div>
        <div class="highlight-box">
            <div class="box-title">Compiti per Casa</div>
            <p>${lesson.compiti || 'Nessun compito specifico assegnato.'}</p>
        </div>
        ${materialsHtml}
        <div style="margin-top:32px;border-top:1px dashed #cac4d0;padding-top:16px">
            <p style="font-size:9.5pt;color:#79747e">Spazio Studente / Note Famiglia:</p>
            <div style="border:1px solid #cac4d0;border-radius:4px;min-height:70px;margin-top:6px"></div>
        </div>`;
    return wrapDocument('Scheda Compiti - ' + lesson.materia, body);
}

function buildLessonHtml(lesson: Lezione): string {
    const body = `
        <div class="header">
            <h1>Relazione di Lezione</h1>
            <div class="meta"><strong>Classe:</strong> ${lesson.classe} &nbsp;|&nbsp; <strong>Materia:</strong> ${lesson.materia}</div>
            <div class="meta">Data: ${todayStr()}</div>
        </div>
        <div class="section">
            <h2>Argomento</h2>
            <p>${lesson.contenuto}</p>
        </div>
        ${lesson.obiettivi ? `<div class="section"><h2>Obiettivi</h2><p>${lesson.obiettivi}</p></div>` : ''}
        ${lesson.compiti ? `<div class="section"><h2>Compiti Assegnati</h2><p>${lesson.compiti}</p></div>` : ''}
        ${lesson.nota ? `<div class="section"><h2>Note Docente</h2><p>${lesson.nota}</p></div>` : ''}`;
    return wrapDocument('Relazione Lezione - ' + lesson.materia, body);
}

function buildStudentProfileHtml(student: Studente, evaluations: Valutazione[], competencyEvaluations: ValutazioneCompetenza[], settings: TimetableSettings): string {
    const subjects = Array.from(new Set(evaluations.map(e => e.materia)));
    const evalsHtml = evaluations.length > 0 ? `
        <h2>Valutazioni Disciplinari</h2>
        <table>
            <thead><tr><th>Materia</th><th>Media</th><th>N. Voti</th></tr></thead>
            <tbody>
            ${subjects.map(sub => {
                const subEvals = evaluations.filter(e => e.materia === sub);
                const avg = (subEvals.reduce((acc, e) => acc + parseFloat(e.voto.replace(',', '.')), 0) / subEvals.length).toFixed(2);
                return `<tr><td>${sub}</td><td><strong>${avg}</strong></td><td>${subEvals.length}</td></tr>`;
            }).join('')}
            </tbody>
        </table>` : '';

    const compHtml = competencyEvaluations.length > 0 ? `
        <h2>Livelli di Competenza</h2>
        <ul>
        ${competencyEvaluations.map(ce => `<li>${ce.competenzaId}: Livello ${ce.livelloId} (${ce.materia})</li>`).join('')}
        </ul>` : '';

    const body = `
        <div class="header">
            <div class="school-name">${settings.nomeIstituto || ''}</div>
            <h1>Profilo Studente</h1>
            <div class="meta"><strong>${student.cognome} ${student.nome}</strong></div>
            <div class="meta">Classe: ${student.classe} &nbsp;|&nbsp; A.S. ${settings.annoScolasticoCorrente}</div>
        </div>
        ${evalsHtml}
        ${compHtml}`;
    return wrapDocument('Profilo - ' + student.cognome + ' ' + student.nome, body);
}

function buildCertificazioneHtml(student: Studente, competencyData: { competencyName: string; level: string }[], settings: TimetableSettings): string {
    const rows = competencyData.map(item => `
        <tr>
            <td>${item.competencyName}</td>
            <td><span class="badge badge-${item.level}">${item.level}</span></td>
        </tr>`).join('');

    const body = `
        <div class="header" style="text-align:center">
            <h1>Certificazione delle Competenze</h1>
            <p style="font-size:11pt">Al termine del primo ciclo di istruzione</p>
        </div>
        <p>L'alunno/a: <strong>${student.cognome} ${student.nome}</strong></p>
        <p>Nato/a il: ${student.dataNascita || '__________'} &nbsp;|&nbsp; Classe: ${student.classe} &nbsp;|&nbsp; A.S. ${settings.annoScolasticoCorrente}</p>
        <p>Visti gli atti d'ufficio relativi alle valutazioni espresse dagli insegnanti,<br>
           si certifica che l'alunno/a ha raggiunto i seguenti livelli di competenza:</p>
        <table>
            <thead><tr><th>Competenza Chiave Europea</th><th>Livello</th></tr></thead>
            <tbody>${rows}</tbody>
        </table>
        <div class="level-legend">
            <strong>Legenda:</strong>
            <span class="badge badge-A">A</span> Avanzato &nbsp;
            <span class="badge badge-B">B</span> Intermedio &nbsp;
            <span class="badge badge-C">C</span> Base &nbsp;
            <span class="badge badge-D">D</span> Iniziale
        </div>
        <div class="signature-row">
            <div class="signature-block">
                <div class="signature-line"></div>
                <p>Data: ${todayStr()}</p>
            </div>
            <div class="signature-block">
                <div class="signature-line"></div>
                <p>Il Dirigente Scolastico</p>
            </div>
        </div>`;
    return wrapDocument('Certificazione Competenze - ' + student.cognome, body);
}

function buildUdaHtml(uda: Uda, allCompetenze: Competenza[], settings: TimetableSettings, docType: 'docente' | 'studente'): string {
    const title = docType === 'docente' ? `Progettazione UDA: ${uda.title}` : `Guida al Progetto: ${uda.title}`;
    const competenzeSel = uda.competencyIds
        .map(id => allCompetenze.find(c => c.id === id))
        .filter((c): c is Competenza => c !== undefined);

    const compHtml = docType === 'docente' && competenzeSel.length > 0 ? `
        <h2>Competenze Target</h2>
        <ul>${competenzeSel.map(c => `<li>${c.nome} (${c.codice})</li>`).join('')}</ul>` : '';

    const phasesHtml = uda.phases.map((p, i) => `
        <div style="margin-bottom:10px;padding-left:12px;border-left:3px solid #6750a4">
            <h3>Fase ${i + 1}: ${p.title} <span style="font-size:9.5pt;color:#49454f">(${p.duration})</span></h3>
            <p><strong>Descrizione:</strong> ${p.description}</p>
            <p style="color:#49454f;font-size:10pt"><strong>Attività:</strong> ${p.activities}</p>
        </div>`).join('');

    const body = `
        <div class="header">
            <div class="school-name">${settings.nomeIstituto || 'Istituto Scolastico'}</div>
            <h1>${title}</h1>
            <div class="meta">Classe: <strong>${uda.classe}</strong> &nbsp;|&nbsp; Materia: <strong>${uda.materia}</strong></div>
            <div class="meta">Docente: ${settings.nomeInsegnante}</div>
        </div>
        <div class="section"><h2>Introduzione</h2><p>${uda.introduction}</p></div>
        <div class="section"><h2>Prodotto Finale</h2><p>${uda.finalProduct}</p></div>
        ${compHtml}
        <div class="section"><h2>Fasi di Lavoro</h2>${phasesHtml}</div>
        ${docType === 'docente' ? `<div class="section"><h2>Valutazione</h2><p>${uda.evaluation}</p></div>` : ''}
        <div class="section"><h2>Strumenti e Risorse</h2><p>${uda.tools}</p></div>`;
    return wrapDocument(title, body);
}

function buildCouncilDataHtml(selectedClass: string, periodo: PeriodoValutazione, students: Studente[], evaluations: Valutazione[], _competencyEvaluations: ValutazioneCompetenza[], _settings: TimetableSettings): string {
    const rows = students.map(s => {
        const studentEvals = evaluations.filter(e => e.studenteId === s.id);
        const avg = studentEvals.length > 0
            ? (studentEvals.reduce((acc, e) => acc + parseFloat(e.voto.replace(',', '.')), 0) / studentEvals.length).toFixed(2)
            : 'N/A';
        return `<tr><td>${s.cognome}</td><td>${s.nome}</td><td><strong>${avg}</strong></td><td>${studentEvals.length}</td></tr>`;
    }).join('');

    const body = `
        <div class="header">
            <h1>Dati Consiglio di Classe &mdash; ${selectedClass}</h1>
            <div class="meta">Periodo: <strong>${periodo}</strong> &nbsp;|&nbsp; Data: ${todayStr()}</div>
        </div>
        <table>
            <thead><tr><th>Cognome</th><th>Nome</th><th>Media Generale</th><th>N. Valutazioni</th></tr></thead>
            <tbody>${rows}</tbody>
        </table>`;
    return wrapDocument('Consiglio di Classe - ' + selectedClass, body);
}

function buildCouncilTableHtml(selectedClass: string, periodo: PeriodoValutazione, annoScolastico: string, students: Studente[], evaluations: Valutazione[], _giudizi: Record<string, GiudizioPeriodico>, _settings: TimetableSettings, showFinalGrades: boolean): string {
    const subjects = Array.from(new Set(evaluations.map(e => e.materia)));
    const extraCols = showFinalGrades ? ['Media'] : [];
    const headerCells = ['Studente', ...subjects, ...extraCols].map(h => `<th>${h}</th>`).join('');

    const rowsHtml = students.map(s => {
        let total = 0, count = 0;
        const subjectCells = subjects.map(sub => {
            const subEvals = evaluations.filter(e => e.studenteId === s.id && e.materia === sub);
            if (subEvals.length > 0) {
                const avg = subEvals.reduce((acc, e) => acc + parseFloat(e.voto.replace(',', '.')), 0) / subEvals.length;
                total += avg; count++;
                return `<td>${avg.toFixed(1)}</td>`;
            }
            return '<td>&mdash;</td>';
        }).join('');
        const mediaCell = showFinalGrades
            ? `<td><strong>${count > 0 ? (total / count).toFixed(2) : '&mdash;'}</strong></td>` : '';
        return `<tr><td><strong>${s.cognome} ${s.nome}</strong></td>${subjectCells}${mediaCell}</tr>`;
    }).join('');

    const body = `
        <div class="header">
            <h1>Tabellone Scrutinio &mdash; ${selectedClass}</h1>
            <div class="meta">A.S. ${annoScolastico} &nbsp;|&nbsp; Periodo: <strong>${periodo}</strong></div>
        </div>
        <table>
            <thead><tr>${headerCells}</tr></thead>
            <tbody>${rowsHtml}</tbody>
        </table>`;
    return wrapDocument('Tabellone Scrutinio - ' + selectedClass, body, true /* landscape */);
}

function buildBrochureHtml(content: BrochureContent): string {
    const useCasesHtml = content.useCases.map(uc => `
        <div class="section">
            <h2>${uc.title}</h2>
            <ul>${uc.benefits.map(b => `<li>${b}</li>`).join('')}</ul>
        </div>`).join('');

    const body = `
        <div class="header" style="text-align:center">
            <h1 style="color:#c62828">${content.brochureTitle}</h1>
            <p>${content.introduction}</p>
        </div>
        ${useCasesHtml}
        <div class="highlight-box">
            <div class="box-title">${content.callToAction}</div>
        </div>`;
    return wrapDocument(content.brochureTitle, body);
}

function buildFullAppGuideHtml(
    essayContent: EssayContent | null,
    faqContent: FaqItem[],
    specsContent: TechnicalDocumentContent,
    _techInfo: Record<string, unknown>,
    vocalGuide: VocalAssistantGuide
): string {
    const essayHtml = essayContent
        ? `<div class="section"><h2>${essayContent.title}</h2><p>${essayContent.content}</p></div>` : '';

    const faqHtml = faqContent.length > 0 ? `
        <h2>Domande Frequenti (FAQ)</h2>
        ${faqContent.map(f => `
            <div style="margin-bottom:10px">
                <p><strong>D: ${f.q}</strong></p>
                <p style="color:#49454f">R: ${f.a}</p>
            </div>`).join('')}` : '';

    const specsHtml = `
        <h2>Specifiche Tecniche</h2>
        <p><strong>${specsContent.title}</strong></p>
        <ul>${specsContent.specs.map(s => `<li>${s}</li>`).join('')}</ul>`;

    const vocalHtml = `
        <h2>${vocalGuide.title}</h2>
        ${vocalGuide.sections.map(sec => `
            <h3>${sec.title}</h3>
            <ul>${sec.commands.map(cmd => `<li><code>${cmd}</code></li>`).join('')}</ul>`).join('')}`;

    const body = `
        <div class="header" style="text-align:center">
            <h1>Guida Completa DocenteDoc AI</h1>
            <div class="meta">Generata il ${todayStr()}</div>
        </div>
        ${essayHtml}${faqHtml}${specsHtml}${vocalHtml}`;
    return wrapDocument('Guida DocenteDoc AI', body);
}

// ─── Public API: Print Functions (void) ──────────────────────────────────────

export const printHomeworkSheet = (lesson: Lezione, settings: TimetableSettings): void =>
    openPrintWindow(buildHomeworkHtml(lesson, settings));

export const printLessonDocument = (lesson: Lezione): void =>
    openPrintWindow(buildLessonHtml(lesson));

export const printStudentProfile = (
    student: Studente,
    evaluations: Valutazione[],
    competencyEvaluations: ValutazioneCompetenza[],
    settings: TimetableSettings
): void => openPrintWindow(buildStudentProfileHtml(student, evaluations, competencyEvaluations, settings));

export const printCertificazioneCompetenze = (
    student: Studente,
    competencyData: { competencyName: string; level: string }[],
    settings: TimetableSettings
): void => openPrintWindow(buildCertificazioneHtml(student, competencyData, settings));

export const printUdaDocument = (
    uda: Uda,
    allCompetenze: Competenza[],
    settings: TimetableSettings,
    docType: 'docente' | 'studente'
): void => openPrintWindow(buildUdaHtml(uda, allCompetenze, settings, docType));

export const printCouncilData = (
    selectedClass: string,
    periodo: PeriodoValutazione,
    students: Studente[],
    evaluations: Valutazione[],
    competencyEvaluations: ValutazioneCompetenza[],
    settings: TimetableSettings
): void => openPrintWindow(buildCouncilDataHtml(selectedClass, periodo, students, evaluations, competencyEvaluations, settings));

export const printCouncilTable = (
    selectedClass: string,
    periodo: PeriodoValutazione,
    annoScolastico: string,
    students: Studente[],
    evaluations: Valutazione[],
    giudizi: Record<string, GiudizioPeriodico>,
    settings: TimetableSettings,
    showFinalGrades: boolean
): void => openPrintWindow(buildCouncilTableHtml(selectedClass, periodo, annoScolastico, students, evaluations, giudizi, settings, showFinalGrades));

export const printPdfBrochure = (content: BrochureContent): void =>
    openPrintWindow(buildBrochureHtml(content));

export const printFullAppGuide = (
    essayContent: EssayContent | null,
    faqContent: FaqItem[],
    specsContent: TechnicalDocumentContent,
    techInfo: Record<string, unknown>,
    vocalGuide: VocalAssistantGuide
): void => openPrintWindow(buildFullAppGuideHtml(essayContent, faqContent, specsContent, techInfo, vocalGuide));

// ─── Public API: HTML Blob Builders (batch export / report storage) ───────────

export const buildLessonHtmlBlob = (lesson: Lezione): Blob =>
    new Blob([buildLessonHtml(lesson)], { type: 'text/html' });

export const buildStudentProfileHtmlBlob = (
    student: Studente,
    evaluations: Valutazione[],
    competencyEvaluations: ValutazioneCompetenza[],
    settings: TimetableSettings
): Blob => new Blob([buildStudentProfileHtml(student, evaluations, competencyEvaluations, settings)], { type: 'text/html' });

export const buildUdaHtmlBlob = (
    uda: Uda,
    allCompetenze: Competenza[],
    settings: TimetableSettings,
    docType: 'docente' | 'studente'
): Blob => new Blob([buildUdaHtml(uda, allCompetenze, settings, docType)], { type: 'text/html' });

// ─── AI Dashboard Report ─────────────────────────────────────────────────────

import type { AIPipelineResult } from '../ai/pipeline/aiPipeline';

function healthGradeColor(grade: string): string {
    switch (grade) {
        case 'ottimo':     return '#c8e6c9';
        case 'buono':      return '#fff9c4';
        case 'sufficiente': return '#ffe0b2';
        case 'critico':    return '#ffcdd2';
        default:           return '#ede7f6';
    }
}

function progressBar(score: number): string {
    const color =
        score >= 80 ? '#4caf50'
        : score >= 65 ? '#ff9800'
        : score >= 50 ? '#2196f3'
        : '#f44336';
    return `<div style="background:#e0e0e0;border-radius:4px;height:8px;width:100%;margin:2px 0 4px">
        <div style="background:${color};width:${score}%;height:8px;border-radius:4px"></div>
    </div>`;
}

function buildAIReportHtml(
    className: string,
    pipeline: AIPipelineResult,
    studentNames: Map<string, string>,
): string {
    const { classHealth, riskSuggestions, excellenceSuggestions, riskPredictions, lessonAssistant } = pipeline;

    // ── Class Health section ──
    const healthRows = [
        classHealth.dimensions.gradeAverage,
        classHealth.dimensions.riskRatio,
        classHealth.dimensions.assessmentCoverage,
    ].map(d => `
        <tr>
            <td>${d.label}</td>
            <td>${d.detail}</td>
            <td style="width:120px">
                ${progressBar(d.score)}
                <span style="font-size:9pt;font-weight:700">${d.score}/100</span>
            </td>
        </tr>`).join('');

    // ── Risk suggestions section ──
    const riskRows = riskSuggestions.length === 0
        ? '<p style="color:#49454f">Nessun studente a rischio rilevato.</p>'
        : `<ul>${riskSuggestions.map(s => `<li>${s.message} <em style="color:#79747e">(confidenza: ${Math.round(s.confidence * 100)}%)</em></li>`).join('')}</ul>`;

    // ── Excellence section ──
    const excellenceRows = excellenceSuggestions.length === 0
        ? '<p style="color:#49454f">Nessuna eccellenza rilevata.</p>'
        : `<ul>${excellenceSuggestions.map(s => `<li>${s.message} <em style="color:#79747e">(confidenza: ${Math.round(s.confidence * 100)}%)</em></li>`).join('')}</ul>`;

    // ── Risk predictions table ──
    const sortedPredictions = [...riskPredictions]
        .filter(p => p.riskProbability > 0)
        .sort((a, b) => b.riskProbability - a.riskProbability);
    const predRows = sortedPredictions.length === 0
        ? '<p style="color:#49454f">Nessun dato di previsione disponibile.</p>'
        : `<table><thead><tr><th>Studente</th><th>Probabilità rischio</th><th>Fattori</th></tr></thead><tbody>
            ${sortedPredictions.map(p => {
                const pct = Math.round(p.riskProbability * 100);
                const name = studentNames.get(p.studentId) ?? p.studentId;
                const color = pct >= 70 ? '#ffcdd2' : pct >= 40 ? '#fff9c4' : '#c8e6c9';
                return `<tr><td>${name}</td><td style="background:${color};font-weight:700;text-align:center">${pct}%</td><td>${p.factors.join(', ') || '—'}</td></tr>`;
            }).join('')}
        </tbody></table>`;

    // ── Lesson suggestions section ──
    const lessonRows = lessonAssistant.suggestions.length === 0
        ? '<p style="color:#49454f">Nessuna attività suggerita.</p>'
        : `<table><thead><tr><th>Materia</th><th>Tipo</th><th>Descrizione</th></tr></thead><tbody>
            ${lessonAssistant.suggestions.map(s => `<tr><td>${s.subject}</td><td>${s.type}</td><td>${s.description}</td></tr>`).join('')}
        </tbody></table>`;

    const gradeLabel = {
        ottimo: 'OTTIMO', buono: 'BUONO', sufficiente: 'SUFFICIENTE', critico: 'CRITICO',
    }[classHealth.grade] ?? classHealth.grade.toUpperCase();

    const body = `
        <div class="header">
            <h1>Report AI — Classe ${className}</h1>
            <div class="meta">Generato il ${todayStr()} &nbsp;|&nbsp; Motore: DocenteDoc AI (locale)</div>
        </div>

        <h2>Stato della Classe</h2>
        <div class="highlight-box" style="background:${healthGradeColor(classHealth.grade)}">
            <div class="box-title" style="font-size:22pt">${classHealth.score}/100</div>
            <div style="font-size:14pt;font-weight:700;margin-bottom:4px">${gradeLabel}</div>
            <div style="font-size:10pt;color:#49454f">${classHealth.summary}</div>
        </div>
        <table>
            <thead><tr><th>Dimensione</th><th>Dettaglio</th><th>Punteggio</th></tr></thead>
            <tbody>${healthRows}</tbody>
        </table>

        <h2>Studenti a Rischio</h2>
        ${riskRows}

        <h2>Eccellenze</h2>
        ${excellenceRows}

        <h2>Previsione Rischio per Studente</h2>
        ${predRows}

        <h2>Attività Didattiche Consigliate</h2>
        <p class="meta">Lacune rilevate: ${lessonAssistant.gapsFound} &nbsp;|&nbsp; ${lessonAssistant.summary}</p>
        ${lessonRows}

        <div class="footer">
            Report generato automaticamente da DocenteDoc AI · Uso riservato al docente · Non sostituisce la valutazione professionale.
        </div>`;

    return wrapDocument(`Report AI Classe ${className}`, body);
}

export function printAIReport(
    className: string,
    pipeline: AIPipelineResult,
    studentNames: Map<string, string>,
): void {
    openPrintWindow(buildAIReportHtml(className, pipeline, studentNames));
}
