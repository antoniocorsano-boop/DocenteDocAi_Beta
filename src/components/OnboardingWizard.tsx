// MD3 Gold Compliant — solo token MD3, nessun valore hardcoded
// Onboarding wizard completo (6 step) mostrato al primo avvio dell'app
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { TimetableSettings, Lezione, Uda, KnowledgeBaseEntry, Studente } from '../types';
import type { InteractionMode } from '../types/aiMaturita.types';
import { useAcademicStore } from '../stores/useAcademicStore';
import { useAIMaturitaStore } from '../stores/useAIMaturitaStore';
import { useStudentStore } from '../stores/useStudentStore';
import { useSystemStore } from '../stores/useSystemStore';
import { useTeacherModelStore } from '../stores/useTeacherModelStore';
import { cognitionBus } from '../cognition/CognitionBus';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';
import Chip from '@mui/material/Chip';
import Collapse from '@mui/material/Collapse';
import CircularProgress from '@mui/material/CircularProgress';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import SchoolIcon from '@mui/icons-material/School';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import DownloadIcon from '@mui/icons-material/Download';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckIcon from '@mui/icons-material/Check';
import WavingHandIcon from '@mui/icons-material/WavingHand';
import SettingsSuggestIcon from '@mui/icons-material/SettingsSuggest';
import InsightsIcon from '@mui/icons-material/Insights';
import SearchIcon from '@mui/icons-material/Search';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import LanguageIcon from '@mui/icons-material/Language';

// ── Constants ─────────────────────────────────────────────────────────────────

const TOTAL_STEPS = 6;
const LS_KEY = 'docentedoc-onboarding-state';

const DISCIPLINE_DEFAULTS = [
  'Italiano', 'Matematica', 'Storia', 'Geografia', 'Scienze',
  'Inglese', 'Arte', 'Musica', 'Educazione Fisica', 'Tecnologia',
  'Fisica', 'Chimica', 'Filosofia', 'Diritto', 'Informatica',
  'Latino', 'Greco', 'Religione', 'Economia', 'Biologia',
];

const SCHOOL_TYPES = [
  "Scuola dell'Infanzia",
  'Scuola Primaria',
  'Scuola Secondaria di I Grado',
  'Scuola Secondaria di II Grado',
  'Istruzione Tecnica',
  'Istruzione Professionale',
  'Liceo',
];

const UDA_COLORS = ['#6750A4', '#0061A4', '#006C4C', '#6E4E37', '#984061'];

// ── Types ─────────────────────────────────────────────────────────────────────

interface OnboardingWizardProps {
  settings: TimetableSettings;
  onComplete: (updates: Partial<TimetableSettings>) => void;
}

interface ImportedData {
  lessonsMap: Record<string, Lezione>;
  udasMap: Uda[];
  lessonCount: number;
  udaCount: number;
}

interface SchoolRecord {
  codiceMeccanografico: string;
  denominazione: string;
  tipo: string;
  indirizzo: string;
  comune: string;
  provincia: string;
  regione: string;
  emailScuola: string;
  sitoWeb: string;
}

interface SchoolDocument {
  title: string;
  url: string;
  category: string;
  snippet: string;
}

interface PersistedState {
  step: number;
  nome: string;
  cognome: string;
  email: string;
  istituto: string;
  citta: string;
  schoolType: string;
  disciplines: string[];
  importedData: ImportedData | null;
  interactionMode: InteractionMode;
  schoolRecord: SchoolRecord | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function loadPersistedState(): Partial<PersistedState> | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function savePersistedState(state: PersistedState): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  } catch { /* quota exceeded — silent */ }
}

function clearPersistedState(): void {
  try { localStorage.removeItem(LS_KEY); } catch { /* ignored */ }
}

/**
 * Parse Argo / Spaggiari / ClasseViva student CSV export.
 * Argo:       cognome;nome;classe;dataNascita;codiceFiscale;bes;dsa;h104
 * Spaggiari:  Cognome,Nome,Classe,DataNascita  (comma-separated)
 * Generic:    any CSV with cognome/nome/classe columns (either separator)
 */
function parseStudentsCSV(text: string): Studente[] {
  const sep = text.includes(';') ? ';' : ',';
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(sep).map(h =>
    h.trim().toLowerCase().replace(/[" ]/g, '').replace('data_nascita', 'datanascita')
  );

  return lines.slice(1).flatMap((line, i) => {
    const cols = line.split(sep);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => { row[h] = (cols[idx] ?? '').trim().replace(/^"|"$/g, ''); });

    const cognome = row['cognome'] ?? row['lastname'] ?? row['surname'] ?? '';
    const nome = row['nome'] ?? row['firstname'] ?? row['name'] ?? '';
    if (!cognome && !nome) return [];

    const student: Studente = {
      id: `st-import-${Date.now()}-${i}`,
      nome: nome || '—',
      cognome: cognome || '—',
      classe: row['classe'] ?? row['class'] ?? row['sezione'] ?? '',
    };
    if (row['datanascita']) student.dataNascita = row['datanascita'];
    student.hasBES = row['bes']?.toLowerCase() === 'si' || row['bes'] === '1' || row['bes']?.toLowerCase() === 'true';
    student.hasDSA = row['dsa']?.toLowerCase() === 'si' || row['dsa'] === '1' || row['dsa']?.toLowerCase() === 'true';
    student.has104 = row['h104']?.toLowerCase() === 'si' || row['h104'] === '1'
      || row['104']?.toLowerCase() === 'si';
    return [student];
  });
}

/** Parse CSV text into lessons map. Expected columns: id,classe,materia,contenuto,data,svolta */
function parseLessonsCSV(text: string): Record<string, Lezione> {
  const map: Record<string, Lezione> = {};
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return map;
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',');
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => { row[h] = (cols[idx] ?? '').trim().replace(/^"|"$/g, ''); });
    const id = row['id'] || `lesson-${Date.now()}-${i}`;
    map[id] = {
      id,
      classe: row['classe'] ?? '',
      materia: row['materia'] ?? '',
      contenuto: row['contenuto'] ?? '',
      svolta: row['svolta']?.toLowerCase() === 'true' || row['svolta'] === '1',
      data: row['data'] ?? undefined,
    };
  }
  return map;
}

/** Parse CSV text into UDA array. Expected columns: id,title,classe,materia,introduction,startDate,endDate */
function parseUdaCSV(text: string): Uda[] {
  const udas: Uda[] = [];
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return udas;
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',');
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => { row[h] = (cols[idx] ?? '').trim().replace(/^"|"$/g, ''); });
    const color = UDA_COLORS[i % UDA_COLORS.length];
    udas.push({
      id: row['id'] || `uda-${Date.now()}-${i}`,
      title: row['title'] ?? `UDA ${i}`,
      classe: row['classe'] ?? '',
      materia: row['materia'] ?? '',
      introduction: row['introduction'] ?? '',
      finalProduct: row['finalproduct'] ?? '',
      competencyIds: [],
      phases: [],
      evaluation: '',
      tools: '',
      startDate: row['startdate'] ?? undefined,
      endDate: row['enddate'] ?? undefined,
      startPos: i * 10,
      width: 15,
      color,
      borderColor: color,
      textColor: '#FFFFFF',
    });
  }
  return udas;
}

/** Parse a JSON import payload into ImportedData */
function parseJSON(text: string): ImportedData | null {
  try {
    const parsed = JSON.parse(text);
    // Support: { lessons, uda } or { lessonsMap, udasMap }
    const rawLessons: Record<string, Lezione> = parsed.lessons ?? parsed.lessonsMap ?? {};
    const rawUdas: Uda[] = Array.isArray(parsed.uda)
      ? parsed.uda
      : Array.isArray(parsed.udasMap)
        ? parsed.udasMap
        : [];
    return {
      lessonsMap: rawLessons,
      udasMap: rawUdas,
      lessonCount: Object.keys(rawLessons).length,
      udaCount: rawUdas.length,
    };
  } catch {
    return null;
  }
}

// ── Shared style helpers ──────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: 'var(--md-sys-spacing-3) var(--md-sys-spacing-4)',
  borderRadius: 'var(--md-sys-shape-corner-extra-small)',
  border: '1px solid var(--md-sys-color-outline)',
  backgroundColor: 'var(--md-sys-color-surface-container-low)',
  color: 'var(--md-sys-color-on-surface)',
  fontFamily: 'var(--md-sys-typescale-body-large-font, inherit)',
  fontSize: 'var(--md-sys-typescale-body-large-size)',
  outline: 'none',
  boxSizing: 'border-box',
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: 'pointer',
  appearance: 'none',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  color: 'var(--md-sys-color-on-surface-variant)',
  fontFamily: 'var(--md-sys-typescale-label-medium-font, inherit)',
  fontSize: 'var(--md-sys-typescale-label-medium-size)',
  marginBottom: 'var(--md-sys-spacing-1)',
};

// ── Main Component ─────────────────────────────────────────────────────────────

const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ settings, onComplete }) => {
  const academicActions = useAcademicStore(s => s.actions);
  const maturitaActions = useAIMaturitaStore(s => s.actions);
  const globalScore = useAIMaturitaStore(s => s.globalScore);
  const studentActions = useStudentStore(s => s.actions);
  const systemActions = useSystemStore(s => s.actions);

  // ── Restore persisted state ──────────────────────────────────────────────────
  const persisted = loadPersistedState();

  const [step, setStep] = useState(persisted?.step ?? 1);
  const [nome, setNome] = useState(persisted?.nome ?? settings.nomeInsegnante ?? '');
  const [cognome, setCognome] = useState(persisted?.cognome ?? settings.cognomeInsegnante ?? '');
  const [email, setEmail] = useState(persisted?.email ?? settings.email ?? '');
  const [istituto, setIstituto] = useState(persisted?.istituto ?? settings.nomeIstituto ?? '');
  const [citta, setCitta] = useState(persisted?.citta ?? settings.cittaIstituto ?? '');
  const [schoolType, setSchoolType] = useState(persisted?.schoolType ?? settings.schoolType ?? SCHOOL_TYPES[2]);
  const [disciplines, setDisciplines] = useState<string[]>(
    persisted?.disciplines ?? (settings.disciplines?.length ? settings.disciplines : [])
  );
  const [importedData, setImportedData] = useState<ImportedData | null>(persisted?.importedData ?? null);
  const [interactionMode, setInteractionMode] = useState<InteractionMode>(
    persisted?.interactionMode ?? 'classica'
  );
  const [importError, setImportError] = useState<string | null>(null);
  const [disciplinesOpen, setDisciplinesOpen] = useState(true);
  const [infraProgress, setInfraProgress] = useState(0);
  const [infraDone, setInfraDone] = useState(false);

  // ── School discovery ────────────────────────────────────────────────────────
  const [schoolRecord, setSchoolRecord] = useState<SchoolRecord | null>(persisted?.schoolRecord ?? null);
  const [schoolSearching, setSchoolSearching] = useState(false);
  const [schoolSearchError, setSchoolSearchError] = useState<string | null>(null);
  const [schoolDocuments, setSchoolDocuments] = useState<SchoolDocument[]>([]);
  const [schoolCrawling, setSchoolCrawling] = useState(false);

  // ── Student import ────────────────────────────────────────────────────────
  const [importedStudents, setImportedStudents] = useState<Studente[]>([]);
  const [studentImportError, setStudentImportError] = useState<string | null>(null);

  // ── Circulars import (local-only, never fetched remotely) ────────────────
  const [circularItems, setCircularItems] = useState<{ title: string; content: string; date: string }[]>([]);
  const [circularImportError, setCircularImportError] = useState<string | null>(null);
  const [circularsOpen, setCircularsOpen] = useState(false);

  // ── Import tab selector (Programmazioni | Studenti | Circolari) ──────────
  const [importTab, setImportTab] = useState(0);

  const dialogRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Persist on state change ──────────────────────────────────────────────────
  useEffect(() => {
    savePersistedState({ step, nome, cognome, email, istituto, citta, schoolType, disciplines, importedData, interactionMode, schoolRecord });
  }, [step, nome, cognome, email, istituto, citta, schoolType, disciplines, importedData, interactionMode, schoolRecord]);

  // ── Focus trap ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const container = dialogRef.current;
    if (!container) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const focusable = Array.from(
        container.querySelectorAll<HTMLElement>('button, input, select, [tabindex]:not([tabindex="-1"])')
      ).filter(el => !(el as HTMLButtonElement).disabled && el.offsetParent !== null);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    container.addEventListener('keydown', onKey);
    return () => container.removeEventListener('keydown', onKey);
  }, [step]);

  // ── Infrastructure initialization (step 5) ───────────────────────────────────
  useEffect(() => {
    if (step !== 5) return;
    setInfraProgress(0);
    setInfraDone(false);

    const phases = [
      () => { setInfraProgress(20); },
      () => {
        if (importedData?.lessonsMap && Object.keys(importedData.lessonsMap).length) {
          academicActions.setLessons(importedData.lessonsMap);
        }
        if (importedData?.udasMap?.length) {
          academicActions.setUda(importedData.udasMap);
        }
        setInfraProgress(40);
      },
      () => {
        if (importedStudents.length) {
          studentActions.importStudents(importedStudents);
        }
        setInfraProgress(60);
      },
      () => {
        // Populate KB with school documents + local circulars
        const kbEntries: KnowledgeBaseEntry[] = [];
        schoolDocuments.forEach(d => {
          kbEntries.push({
            id: `school-doc-${Date.now()}-${d.category}-${Math.random().toString(36).slice(2)}`,
            fileName: d.title,
            content: d.snippet,
            category: d.category,
            tags: ['scuola', 'pubblico', d.category],
            htmlContent: `<a href="${d.url}" target="_blank" rel="noopener noreferrer">${d.title}</a>`,
            createdAt: new Date().toISOString(),
          });
        });
        circularItems.forEach((c, i) => {
          kbEntries.push({
            id: `circular-${Date.now()}-${i}`,
            fileName: c.title,
            content: c.content,
            category: 'circolare',
            tags: ['circolari', 'locale'],
            createdAt: c.date || new Date().toISOString(),
          });
        });
        if (kbEntries.length) {
          systemActions.setKnowledgeBase(prev => [...prev, ...kbEntries]);
        }
        setInfraProgress(80);
      },
      () => {
        maturitaActions.setInteractionMode(interactionMode);
        setInfraProgress(100);
        setTimeout(() => setInfraDone(true), 400);
      },
    ];

    const timers: ReturnType<typeof setTimeout>[] = [];
    phases.forEach((fn, i) => {
      timers.push(setTimeout(fn, 600 + i * 800));
    });

    return () => timers.forEach(t => clearTimeout(t));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // ── Navigate ─────────────────────────────────────────────────────────────────
  const goTo = useCallback((n: number) => setStep(Math.max(1, Math.min(TOTAL_STEPS, n))), []);

  // ── Complete ─────────────────────────────────────────────────────────────────
  const handleComplete = useCallback(() => {
    clearPersistedState();

    // Calibrate TeacherModel from onboarding data
    const { updateUsageProfile, capabilityLevel } = useTeacherModelStore.getState();
    updateUsageProfile({ workspaceConfigured: true });
    // Seed capabilityLevel from declared AI experience (only promote, never demote)
    if (interactionMode !== 'classica' && capabilityLevel < 2) {
      useTeacherModelStore.setState({ capabilityLevel: 2 });
    }
    cognitionBus.emit('workspace.configured', {});
    cognitionBus.emit('onboarding.completed', {});

    onComplete({
      nomeInsegnante: nome.trim() || settings.nomeInsegnante,
      cognomeInsegnante: cognome.trim() || settings.cognomeInsegnante,
      email: email.trim() || settings.email,
      nomeIstituto: istituto.trim() || settings.nomeIstituto,
      cittaIstituto: citta.trim() || settings.cittaIstituto,
      schoolType,
      disciplines: disciplines.length ? disciplines : settings.disciplines,
      onboarded: true,
    });
  }, [nome, cognome, email, istituto, citta, schoolType, disciplines, interactionMode, settings, onComplete]);

  const handleSkip = useCallback(() => {
    clearPersistedState();
    onComplete({ onboarded: true });
  }, [onComplete]);

  // ── School discovery via MIUR Open Data (server-side proxy) ──────────────────
  const handleSchoolCrawl = useCallback(async (record: SchoolRecord) => {
    setSchoolCrawling(true);
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'school_kb_crawl',
          codiceMeccanografico: record.codiceMeccanografico,
          siteUrl: record.sitoWeb || undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json() as { documents?: SchoolDocument[] };
        if (data.documents?.length) setSchoolDocuments(data.documents);
      }
    } catch { /* non-blocking — network errors don't break onboarding */ }
    finally { setSchoolCrawling(false); }
  }, []);

  const handleSchoolSearch = useCallback(async () => {
    const query = istituto.trim();
    if (query.length < 3) return;
    setSchoolSearching(true);
    setSchoolSearchError(null);
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'school_search', query }),
      });
      const data = await res.json() as { schools?: SchoolRecord[]; fallback?: boolean };
      if (data.fallback || !data.schools?.length) {
        setSchoolSearchError('Nessuna scuola trovata. Verifica il nome o procedi manualmente.');
      } else {
        const best = data.schools[0];
        setSchoolRecord(best);
        if (best.comune && !citta) setCitta(best.comune);
        if (best.tipo && !schoolType) setSchoolType(best.tipo);
        handleSchoolCrawl(best);
      }
    } catch {
      setSchoolSearchError('Servizio MIUR non raggiungibile. Puoi continuare inserendo i dati manualmente.');
    } finally {
      setSchoolSearching(false);
    }
   
  }, [istituto, citta, schoolType, handleSchoolCrawl]);

  // ── Student file import (Argo / Spaggiari CSV) ────────────────────────────────
  const handleStudentFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStudentImportError(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      if (!text) { setStudentImportError('File vuoto o non leggibile.'); return; }
      const students = parseStudentsCSV(text);
      if (!students.length) {
        setStudentImportError('Nessuno studente trovato. Colonne attese: cognome;nome;classe (separatore ; o ,)');
      } else {
        setImportedStudents(students);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }, []);

  // ── Circulars import (local-only PDF/CSV — never leave client) ────────────────
  const handleCircularFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCircularImportError(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      if (!text) { setCircularImportError('File vuoto.'); return; }
      try {
        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(text) as { title?: string; oggetto?: string; content?: string; testo?: string; date?: string; data?: string }[];
          const items = (Array.isArray(parsed) ? parsed : [parsed]).map(c => ({
            title: c.title ?? c.oggetto ?? 'Circolare',
            content: c.content ?? c.testo ?? '',
            date: c.date ?? c.data ?? new Date().toISOString().slice(0, 10),
          }));
          setCircularItems(prev => [...prev, ...items]);
        } else {
          // CSV: oggetto;data;testo
          const sep = text.includes(';') ? ';' : ',';
          const lines = text.split(/\r?\n/).filter(l => l.trim());
          const headers = (lines[0] ?? '').split(sep).map(h => h.trim().toLowerCase().replace(/"/g, ''));
          const items = lines.slice(1).map(line => {
            const cols = line.split(sep);
            const row: Record<string, string> = {};
            headers.forEach((h, i) => { row[h] = (cols[i] ?? '').trim().replace(/^"|"$/g, ''); });
            return {
              title: row['oggetto'] ?? row['title'] ?? row['titolo'] ?? 'Circolare',
              content: row['testo'] ?? row['content'] ?? row['corpo'] ?? '',
              date: row['data'] ?? row['date'] ?? new Date().toISOString().slice(0, 10),
            };
          });
          setCircularItems(prev => [...prev, ...items]);
        }
      } catch { setCircularImportError('File non riconosciuto (JSON non valido o CSV malformato).'); }
    };
    reader.readAsText(file);
    e.target.value = '';
  }, []);

  // ── Import handler ────────────────────────────────────────────────────────────
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      if (!text) { setImportError('File vuoto o non leggibile.'); return; }
      let result: ImportedData | null = null;
      if (file.name.endsWith('.json')) {
        result = parseJSON(text);
        if (!result || (result.lessonCount === 0 && result.udaCount === 0)) {
          setImportError('JSON non riconosciuto. Atteso: { lessons, uda } oppure { lessonsMap, udasMap }.');
          return;
        }
      } else if (file.name.endsWith('.csv')) {
        // Heuristic: if header has 'title' → UDA CSV, else → Lessons CSV
        const firstLine = text.split(/\r?\n/)[0].toLowerCase();
        if (firstLine.includes('title')) {
          const udas = parseUdaCSV(text);
          result = { lessonsMap: {}, udasMap: udas, lessonCount: 0, udaCount: udas.length };
        } else {
          const lessons = parseLessonsCSV(text);
          result = { lessonsMap: lessons, udasMap: [], lessonCount: Object.keys(lessons).length, udaCount: 0 };
        }
        if (!result || (result.lessonCount === 0 && result.udaCount === 0)) {
          setImportError('Nessun dato trovato nel CSV. Verificare le intestazioni.');
          return;
        }
      } else {
        setImportError('Formato non supportato. Caricare un file .csv o .json');
        return;
      }
      setImportedData(result);
    };
    reader.readAsText(file);
    // reset value so same file can be loaded again
    e.target.value = '';
  }, []);

  // ── GDPR export ───────────────────────────────────────────────────────────────
  const handleGdprExport = useCallback(() => {
    const snap = {
      exportDate: new Date().toISOString(),
      gdprSchema: 'onboarding-v2',
      docente: { nome, cognome, email, istituto, citta, schoolType },
      scuola: schoolRecord ?? null,
      disciplines,
      interactionMode,
      lessonCount: importedData?.lessonCount ?? 0,
      udaCount: importedData?.udaCount ?? 0,
      studentCount: importedStudents.length,
      kbDocumentsFromSchool: schoolDocuments.length,
      circolarCount: circularItems.length,
      globalMaturitaScore: globalScore,
    };
    const blob = new Blob([JSON.stringify(snap, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `docentedoc-onboarding-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [nome, cognome, email, istituto, citta, schoolType, schoolRecord, disciplines, interactionMode, importedData, importedStudents, schoolDocuments, circularItems, globalScore]);

  // ── Toggle disciplines ────────────────────────────────────────────────────────
  const toggleDiscipline = (d: string) =>
    setDisciplines(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);

  // ── Shared layout ─────────────────────────────────────────────────────────────
  const progressPct = ((step - 1) / (TOTAL_STEPS - 1)) * 100;

  const renderStepHeader = (title: string, subtitle: string, icon?: React.ReactNode) => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-2)' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-2)' }}>
        {icon && (
          <Box sx={{
            width: 'var(--md-sys-spacing-10)',
            height: 'var(--md-sys-spacing-10)',
            borderRadius: 'var(--md-sys-shape-corner-medium)',
            bgcolor: 'var(--md-sys-color-primary-container)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--md-sys-color-on-primary-container)',
            flexShrink: 0,
          }}>
            {icon}
          </Box>
        )}
        <Typography variant="labelLarge" sx={{ color: 'var(--md-sys-color-primary)' }}>
          Passo {step} di {TOTAL_STEPS}
        </Typography>
      </Box>
      <Typography variant="headlineSmall" component="h2" sx={{ color: 'var(--md-sys-color-on-surface)', m: 0 }}>
        {title}
      </Typography>
      <Typography variant="bodyMedium" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
        {subtitle}
      </Typography>
    </Box>
  );

  const renderNav = (onBack?: () => void, onNext?: () => void, nextLabel = 'Avanti', nextDisabled = false) => (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 'var(--md-sys-spacing-2)' }}>
      <Button
        variant="text"
        onClick={onBack ?? handleSkip}
        aria-label={onBack ? 'Torna al passo precedente' : 'Salta la configurazione iniziale'}
        startIcon={onBack ? <ArrowBackIcon /> : undefined}
        sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}
      >
        {onBack ? 'Indietro' : 'Salta tutto'}
      </Button>
      {onNext && (
        <Button
          variant="contained"
          onClick={onNext}
          disabled={nextDisabled}
          aria-label={nextLabel}
          endIcon={<ArrowForwardIcon />}
          sx={{
            bgcolor: 'var(--md-sys-color-primary)',
            color: 'var(--md-sys-color-on-primary)',
            borderRadius: 'var(--md-sys-shape-corner-full)',
            '&:hover': { bgcolor: 'var(--md-sys-color-primary)', filter: 'brightness(0.92)' },
          }}
        >
          {nextLabel}
        </Button>
      )}
    </Box>
  );

  // ── STEP 1: Welcome ──────────────────────────────────────────────────────────
  const renderStep1 = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-6)' }}>
      <Box sx={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--md-sys-spacing-4)',
        py: 'var(--md-sys-spacing-4)',
        bgcolor: 'var(--md-sys-color-primary-container)',
        borderRadius: 'var(--md-sys-shape-corner-large)',
        px: 'var(--md-sys-spacing-6)',
      }}>
        <WavingHandIcon sx={{ fontSize: 48, color: 'var(--md-sys-color-on-primary-container)' }} aria-hidden="true" />
        <Typography variant="headlineMedium" component="h1" sx={{ color: 'var(--md-sys-color-on-primary-container)', textAlign: 'center', m: 0 }}>
          Benvenuto in DocenteDoc AI
        </Typography>
        <Typography variant="bodyLarge" sx={{ color: 'var(--md-sys-color-on-primary-container)', textAlign: 'center', opacity: 0.87 }}>
          L'assistente didattico progettato per supportare il docente, nel pieno rispetto della normativa italiana e dei principi etici sull'intelligenza artificiale.
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-3)' }}>
        {[
          { icon: <SchoolIcon />, label: 'AI al servizio del docente', desc: 'Pianifica, analizza e ottimizza con suggerimenti contestuali e predittivi.' },
          { icon: <InsightsIcon />, label: 'Trasparenza e spiegabilità', desc: 'Ogni raccomandazione AI è motivata e auditabile. TrustScore sempre visibile.' },
          { icon: <CheckCircleIcon />, label: 'Privacy e GDPR Art. 13', desc: 'Dati trattati localmente. Consenso esplicito. Export GDPR-ready in qualsiasi momento.' },
        ].map(({ icon, label, desc }) => (
          <Box key={label} sx={{
            display: 'flex', gap: 'var(--md-sys-spacing-3)', alignItems: 'flex-start',
            p: 'var(--md-sys-spacing-3)',
            bgcolor: 'var(--md-sys-color-surface-container)',
            borderRadius: 'var(--md-sys-shape-corner-medium)',
          }}>
            <Box sx={{ color: 'var(--md-sys-color-primary)', pt: '2px', flexShrink: 0 }} aria-hidden="true">{icon}</Box>
            <Box>
              <Typography variant="titleSmall" sx={{ color: 'var(--md-sys-color-on-surface)', display: 'block' }}>{label}</Typography>
              <Typography variant="bodySmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>{desc}</Typography>
            </Box>
          </Box>
        ))}
      </Box>

      {renderNav(undefined, () => goTo(2), 'Inizia la configurazione')}

      {/* Prominent bypass — for returning users who have already configured */}
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Button
          variant="text"
          size="small"
          onClick={handleSkip}
          startIcon={<SkipNextIcon />}
          aria-label="Salta la configurazione iniziale e accedi direttamente all'app"
          sx={{
            color: 'var(--md-sys-color-on-surface-variant)',
            opacity: 0.65,
            fontSize: 'var(--md-sys-typescale-label-small-size)',
            '&:hover': { opacity: 1 },
          }}
        >
          Ho già configurato — accedi direttamente
        </Button>
      </Box>
    </Box>
  );

  // ── STEP 2: Configurazione Docente ────────────────────────────────────────────
  const renderStep2 = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-5)' }}>
      {renderStepHeader('Configurazione Docente', 'Inserisci i tuoi dati anagrafici e scolastici.', <SchoolIcon fontSize="small" />)}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-3)' }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--md-sys-spacing-3)' }}>
          <Box>
            <label htmlFor="onb-nome" style={labelStyle}>Nome *</label>
            <input id="onb-nome" type="text" value={nome} onChange={e => setNome(e.target.value)}
              placeholder="Maria" style={inputStyle} autoFocus autoComplete="given-name"
              aria-required="true" />
          </Box>
          <Box>
            <label htmlFor="onb-cognome" style={labelStyle}>Cognome *</label>
            <input id="onb-cognome" type="text" value={cognome} onChange={e => setCognome(e.target.value)}
              placeholder="Rossi" style={inputStyle} autoComplete="family-name" aria-required="true" />
          </Box>
        </Box>

        <Box>
          <label htmlFor="onb-email" style={labelStyle}>Email istituzionale</label>
          <input id="onb-email" type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="maria.rossi@istituto.edu.it" style={inputStyle} autoComplete="email" />
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--md-sys-spacing-3)' }}>
          <Box>
            <label htmlFor="onb-istituto" style={labelStyle}>Nome istituto *</label>
            <Box sx={{ display: 'flex', gap: 'var(--md-sys-spacing-2)' }}>
              <input id="onb-istituto" type="text" value={istituto}
                onChange={e => { setIstituto(e.target.value); setSchoolRecord(null); setSchoolSearchError(null); }}
                onKeyDown={e => { if (e.key === 'Enter') void handleSchoolSearch(); }}
                placeholder="I.C. Manzoni" style={{ ...inputStyle, flex: 1, boxSizing: 'border-box' }}
                autoComplete="organization" aria-required="true" />
              <Button
                variant="outlined"
                onClick={() => void handleSchoolSearch()}
                disabled={istituto.trim().length < 3 || schoolSearching}
                aria-label="Cerca la scuola negli open data MIUR"
                sx={{
                  borderColor: 'var(--md-sys-color-outline)',
                  color: 'var(--md-sys-color-primary)',
                  borderRadius: 'var(--md-sys-shape-corner-small)',
                  minWidth: 'unset',
                  px: 'var(--md-sys-spacing-3)',
                  flexShrink: 0,
                  height: '100%',
                }}
              >
                {schoolSearching
                  ? <CircularProgress size={16} sx={{ color: 'var(--md-sys-color-primary)' }} />
                  : <SearchIcon fontSize="small" />}
              </Button>
            </Box>

            {/* School found badge */}
            {schoolRecord && (
              <Box sx={{
                mt: 'var(--md-sys-spacing-2)',
                p: 'var(--md-sys-spacing-2) var(--md-sys-spacing-3)',
                bgcolor: 'var(--md-sys-color-secondary-container)',
                borderRadius: 'var(--md-sys-shape-corner-small)',
                display: 'flex', alignItems: 'flex-start', gap: 'var(--md-sys-spacing-2)',
              }}>
                <CheckCircleIcon sx={{ fontSize: 15, color: 'var(--md-sys-color-on-secondary-container)', mt: '2px', flexShrink: 0 }} aria-hidden="true" />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="labelSmall" sx={{ color: 'var(--md-sys-color-on-secondary-container)', display: 'block', wordBreak: 'break-word' }}>
                    {schoolRecord.denominazione} — {schoolRecord.comune} ({schoolRecord.provincia})
                  </Typography>
                  <Typography variant="labelSmall" sx={{ color: 'var(--md-sys-color-on-secondary-container)', opacity: 0.75 }}>
                    Cod. {schoolRecord.codiceMeccanografico}
                    {schoolCrawling && ' · Ricerca documenti…'}
                    {!schoolCrawling && schoolDocuments.length > 0 && ` · ${schoolDocuments.length} doc. pubblici trovati`}
                  </Typography>
                  {schoolRecord.sitoWeb && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-1)', mt: 'var(--md-sys-spacing-1)' }}>
                      <LanguageIcon sx={{ fontSize: 12, color: 'var(--md-sys-color-on-secondary-container)', opacity: 0.7 }} aria-hidden="true" />
                      <Typography variant="labelSmall" sx={{ color: 'var(--md-sys-color-on-secondary-container)', opacity: 0.7, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {schoolRecord.sitoWeb}
                      </Typography>
                    </Box>
                  )}
                </Box>
                <IconButton size="small"
                  onClick={() => { setSchoolRecord(null); setSchoolDocuments([]); setSchoolSearchError(null); }}
                  aria-label="Rimuovi scuola selezionata"
                  sx={{ color: 'var(--md-sys-color-on-secondary-container)', p: '2px', flexShrink: 0 }}>✕</IconButton>
              </Box>
            )}

            {schoolSearchError && (
              <Typography variant="bodySmall" sx={{ color: 'var(--md-sys-color-error)', mt: 'var(--md-sys-spacing-1)', display: 'block' }}>
                {schoolSearchError}
              </Typography>
            )}
          </Box>
          <Box>
            <label htmlFor="onb-citta" style={labelStyle}>Città</label>
            <input id="onb-citta" type="text" value={citta} onChange={e => setCitta(e.target.value)}
              placeholder="Milano" style={inputStyle} autoComplete="address-level2" />
          </Box>
        </Box>

        <Box>
          <label htmlFor="onb-school-type" style={labelStyle}>Tipo scuola</label>
          <select id="onb-school-type" value={schoolType} onChange={e => setSchoolType(e.target.value)}
            style={selectStyle} aria-label="Seleziona il tipo di scuola">
            {SCHOOL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </Box>

        {/* Disciplines — collapsible */}
        <Box sx={{
          border: '1px solid var(--md-sys-color-outline-variant)',
          borderRadius: 'var(--md-sys-shape-corner-medium)',
          overflow: 'hidden',
        }}>
          <Button
            onClick={() => setDisciplinesOpen(p => !p)}
            aria-expanded={disciplinesOpen}
            aria-controls="onb-disciplines-panel"
            fullWidth
            sx={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              px: 'var(--md-sys-spacing-4)', py: 'var(--md-sys-spacing-3)',
              bgcolor: 'var(--md-sys-color-surface-container-low)',
              borderRadius: 0,
              color: 'var(--md-sys-color-on-surface)',
              '&:hover': { bgcolor: 'var(--md-sys-color-surface-container)' },
            }}
          >
            <Typography variant="titleSmall" sx={{ color: 'var(--md-sys-color-on-surface)' }}>
              Materie insegnate {disciplines.length > 0 && `(${disciplines.length} selezionate)`}
            </Typography>
            <ExpandMoreIcon sx={{
              color: 'var(--md-sys-color-on-surface-variant)',
              transform: disciplinesOpen ? 'rotate(180deg)' : 'none',
              transition: 'transform 200ms ease',
            }} aria-hidden="true" />
          </Button>
          <Collapse in={disciplinesOpen} id="onb-disciplines-panel">
            <Box sx={{
              p: 'var(--md-sys-spacing-3)',
              display: 'flex', flexWrap: 'wrap', gap: 'var(--md-sys-spacing-2)',
              maxHeight: '160px', overflowY: 'auto',
            }}>
              {DISCIPLINE_DEFAULTS.map(d => {
                const selected = disciplines.includes(d);
                return (
                  <Chip
                    key={d}
                    label={d}
                    onClick={() => toggleDiscipline(d)}
                    icon={selected ? <CheckIcon /> : undefined}
                    aria-pressed={selected}
                    aria-label={`${selected ? 'Rimuovi' : 'Aggiungi'} materia ${d}`}
                    sx={{
                      bgcolor: selected ? 'var(--md-sys-color-secondary-container)' : 'transparent',
                      color: selected ? 'var(--md-sys-color-on-secondary-container)' : 'var(--md-sys-color-on-surface-variant)',
                      border: '1px solid var(--md-sys-color-outline-variant)',
                      cursor: 'pointer',
                      '& .MuiChip-icon': { color: 'var(--md-sys-color-on-secondary-container)' },
                    }}
                  />
                );
              })}
            </Box>
          </Collapse>
        </Box>
      </Box>

      {renderNav(() => goTo(1), () => goTo(3), 'Avanti')}
    </Box>
  );

  // ── STEP 3: Import Materiali (Programmazioni · Studenti · Circolari) ──────────
  const renderStep3 = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
      {renderStepHeader('Importa Materiali', 'Carica le programmazioni, gli studenti e le circolari. Tutti i passi sono facoltativi.', <UploadFileIcon fontSize="small" />)}

      {/* Tab bar */}
      <Tabs
        value={importTab}
        onChange={(_e, v: number) => setImportTab(v)}
        aria-label="Sezioni di importazione materiali"
        sx={{
          borderBottom: '1px solid var(--md-sys-color-outline-variant)',
          '& .MuiTab-root': { color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'none' },
          '& .Mui-selected': { color: 'var(--md-sys-color-primary)' },
          '& .MuiTabs-indicator': { bgcolor: 'var(--md-sys-color-primary)' },
        }}
      >
        <Tab label="Programmazioni" icon={<UploadFileIcon fontSize="small" />} iconPosition="start" id="import-tab-0" aria-controls="import-panel-0" />
        <Tab label="Studenti" icon={<PersonAddIcon fontSize="small" />} iconPosition="start" id="import-tab-1" aria-controls="import-panel-1" />
        <Tab label="Circolari" icon={<NotificationsActiveIcon fontSize="small" />} iconPosition="start" id="import-tab-2" aria-controls="import-panel-2" />
      </Tabs>

      {/* ── Tab 0: Programmazioni ── */}
      <Box role="tabpanel" id="import-panel-0" aria-labelledby="import-tab-0" hidden={importTab !== 0}
        sx={{ display: importTab === 0 ? 'flex' : 'none', flexDirection: 'column', gap: 'var(--md-sys-spacing-3)' }}>
        <Box
          component="label" htmlFor="onb-file-upload"
          sx={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--md-sys-spacing-3)',
            p: 'var(--md-sys-spacing-5)',
            border: '2px dashed var(--md-sys-color-outline-variant)',
            borderRadius: 'var(--md-sys-shape-corner-large)',
            cursor: 'pointer',
            bgcolor: 'var(--md-sys-color-surface-container-lowest)',
            '&:hover': { borderColor: 'var(--md-sys-color-primary)', bgcolor: 'var(--md-sys-color-surface-container-low)' },
          }}
          aria-label="Area caricamento programmazioni — clicca per selezionare CSV o JSON"
        >
          <UploadFileIcon sx={{ fontSize: 36, color: 'var(--md-sys-color-on-surface-variant)' }} aria-hidden="true" />
          <Typography variant="bodyLarge" sx={{ color: 'var(--md-sys-color-on-surface)', textAlign: 'center' }}>
            Clicca per caricare o trascina il file
          </Typography>
          <Typography variant="bodySmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
            Formati: .csv (lezioni o UDA), .json
          </Typography>
          <input ref={fileInputRef} id="onb-file-upload" type="file" accept=".csv,.json"
            style={{ display: 'none' }} onChange={handleFileChange} aria-label="Seleziona file CSV o JSON" />
        </Box>
        <Box sx={{ p: 'var(--md-sys-spacing-3)', bgcolor: 'var(--md-sys-color-surface-container)', borderRadius: 'var(--md-sys-shape-corner-small)', fontFamily: 'monospace', fontSize: 'var(--md-sys-typescale-code-font-size)', color: 'var(--md-sys-color-on-surface-variant)' }}>
          <div>Lezioni CSV: id, classe, materia, contenuto, data, svolta</div>
          <div>UDA CSV: id, title, classe, materia, introduction, startDate, endDate</div>
        </Box>
        {importError && (
          <Box sx={{ p: 'var(--md-sys-spacing-3)', bgcolor: 'var(--md-sys-color-error-container)', borderRadius: 'var(--md-sys-shape-corner-small)' }}>
            <Typography variant="bodySmall" sx={{ color: 'var(--md-sys-color-on-error-container)' }}>{importError}</Typography>
          </Box>
        )}
        {importedData && !importError && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-3)', p: 'var(--md-sys-spacing-3)', bgcolor: 'var(--md-sys-color-secondary-container)', borderRadius: 'var(--md-sys-shape-corner-medium)' }}>
            <CheckCircleIcon sx={{ color: 'var(--md-sys-color-on-secondary-container)' }} aria-hidden="true" />
            <Box sx={{ flex: 1 }}>
              <Typography variant="titleSmall" sx={{ color: 'var(--md-sys-color-on-secondary-container)', display: 'block' }}>Importazione riuscita</Typography>
              <Typography variant="bodySmall" sx={{ color: 'var(--md-sys-color-on-secondary-container)' }}>{importedData.lessonCount} lezioni · {importedData.udaCount} UDA</Typography>
            </Box>
            <IconButton size="small" onClick={() => { setImportedData(null); setImportError(null); }} aria-label="Rimuovi file importato" sx={{ color: 'var(--md-sys-color-on-secondary-container)' }}>✕</IconButton>
          </Box>
        )}
      </Box>

      {/* ── Tab 1: Studenti ── */}
      <Box role="tabpanel" id="import-panel-1" aria-labelledby="import-tab-1" hidden={importTab !== 1}
        sx={{ display: importTab === 1 ? 'flex' : 'none', flexDirection: 'column', gap: 'var(--md-sys-spacing-3)' }}>
        <Box
          component="label" htmlFor="onb-student-upload"
          sx={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--md-sys-spacing-3)',
            p: 'var(--md-sys-spacing-5)',
            border: '2px dashed var(--md-sys-color-outline-variant)',
            borderRadius: 'var(--md-sys-shape-corner-large)',
            cursor: 'pointer',
            bgcolor: 'var(--md-sys-color-surface-container-lowest)',
            '&:hover': { borderColor: 'var(--md-sys-color-primary)', bgcolor: 'var(--md-sys-color-surface-container-low)' },
          }}
          aria-label="Carica file classe esportato da Argo, Spaggiari o registro generico (CSV)"
        >
          <PersonAddIcon sx={{ fontSize: 36, color: 'var(--md-sys-color-on-surface-variant)' }} aria-hidden="true" />
          <Typography variant="bodyLarge" sx={{ color: 'var(--md-sys-color-on-surface)', textAlign: 'center' }}>Carica file classe da registro</Typography>
          <Typography variant="bodySmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Argo, Spaggiari/ClasseViva, AXIOS o CSV generico</Typography>
          <input id="onb-student-upload" type="file" accept=".csv,.txt"
            style={{ display: 'none' }} onChange={handleStudentFile} aria-label="Seleziona file CSV studenti" />
        </Box>
        <Box sx={{ p: 'var(--md-sys-spacing-3)', bgcolor: 'var(--md-sys-color-surface-container)', borderRadius: 'var(--md-sys-shape-corner-small)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-2)', mb: 'var(--md-sys-spacing-1)' }}>
            <InfoOutlinedIcon sx={{ fontSize: 14, color: 'var(--md-sys-color-primary)' }} aria-hidden="true" />
            <Typography variant="labelMedium" sx={{ color: 'var(--md-sys-color-on-surface)' }}>Colonne attese</Typography>
          </Box>
          <Box sx={{ fontFamily: 'monospace', fontSize: 'var(--md-sys-typescale-code-font-size)', color: 'var(--md-sys-color-on-surface-variant)', lineHeight: 1.8 }}>
            <div><strong>Argo:</strong> cognome;nome;classe;dataNascita;codiceFiscale;bes;dsa;h104</div>
            <div><strong>Spaggiari:</strong> Cognome,Nome,Classe,Data Nascita (virgola)</div>
            <div><strong>Generico:</strong> qualsiasi CSV con cognome/nome/classe</div>
          </Box>
        </Box>
        {studentImportError && (
          <Box sx={{ p: 'var(--md-sys-spacing-3)', bgcolor: 'var(--md-sys-color-error-container)', borderRadius: 'var(--md-sys-shape-corner-small)' }}>
            <Typography variant="bodySmall" sx={{ color: 'var(--md-sys-color-on-error-container)' }}>{studentImportError}</Typography>
          </Box>
        )}
        {importedStudents.length > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-3)', p: 'var(--md-sys-spacing-3)', bgcolor: 'var(--md-sys-color-secondary-container)', borderRadius: 'var(--md-sys-shape-corner-medium)' }}>
            <CheckCircleIcon sx={{ color: 'var(--md-sys-color-on-secondary-container)' }} aria-hidden="true" />
            <Box sx={{ flex: 1 }}>
              <Typography variant="titleSmall" sx={{ color: 'var(--md-sys-color-on-secondary-container)', display: 'block' }}>
                {importedStudents.length} studenti importati
              </Typography>
              <Typography variant="bodySmall" sx={{ color: 'var(--md-sys-color-on-secondary-container)' }}>
                Classi: {[...new Set(importedStudents.map(s => s.classe).filter(Boolean))].join(', ') || '—'}
                {importedStudents.some(s => s.hasDSA) ? ' · DSA presenti' : ''}
                {importedStudents.some(s => s.has104) ? ' · H presenti' : ''}
              </Typography>
            </Box>
            <IconButton size="small" onClick={() => setImportedStudents([])} aria-label="Rimuovi studenti importati" sx={{ color: 'var(--md-sys-color-on-secondary-container)' }}>✕</IconButton>
          </Box>
        )}
      </Box>

      {/* ── Tab 2: Circolari ── */}
      <Box role="tabpanel" id="import-panel-2" aria-labelledby="import-tab-2" hidden={importTab !== 2}
        sx={{ display: importTab === 2 ? 'flex' : 'none', flexDirection: 'column', gap: 'var(--md-sys-spacing-3)' }}>
        <Box sx={{ p: 'var(--md-sys-spacing-3)', bgcolor: 'var(--md-sys-color-tertiary-container)', borderRadius: 'var(--md-sys-shape-corner-small)' }}>
          <Typography variant="labelMedium" sx={{ color: 'var(--md-sys-color-on-tertiary-container)', display: 'block', mb: 'var(--md-sys-spacing-1)' }}>
            🔒 Ecosistema isolato
          </Typography>
          <Typography variant="bodySmall" sx={{ color: 'var(--md-sys-color-on-tertiary-container)' }}>
            Le circolari vengono caricate <strong>solo localmente</strong> — non lasciano mai il browser. Esporta da Argo/Spaggiari come CSV o JSON e carica qui. Le circolari dell'Albo Pretorio pubblico vengono invece recuperate automaticamente al passo 2 assieme agli altri documenti della scuola.
          </Typography>
        </Box>
        <Button
          onClick={() => setCircularsOpen(p => !p)}
          aria-expanded={circularsOpen}
          aria-controls="onb-circolari-panel"
          variant="outlined"
          startIcon={<NotificationsActiveIcon />}
          endIcon={<ExpandMoreIcon sx={{ transform: circularsOpen ? 'rotate(180deg)' : 'none', transition: 'transform 200ms ease' }} aria-hidden="true" />}
          sx={{
            borderColor: 'var(--md-sys-color-outline-variant)',
            color: 'var(--md-sys-color-on-surface)',
            justifyContent: 'space-between',
            borderRadius: 'var(--md-sys-shape-corner-medium)',
          }}
        >
          Carica circolari {circularItems.length > 0 ? `(${circularItems.length} caricate)` : '(facoltativo)'}
        </Button>
        <Collapse in={circularsOpen} id="onb-circolari-panel">
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-3)', pt: 'var(--md-sys-spacing-1)' }}>
            <Box
              component="label" htmlFor="onb-circular-upload"
              sx={{
                display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-3)',
                p: 'var(--md-sys-spacing-3)',
                border: '1px dashed var(--md-sys-color-outline-variant)',
                borderRadius: 'var(--md-sys-shape-corner-medium)',
                cursor: 'pointer',
                bgcolor: 'var(--md-sys-color-surface-container-lowest)',
                '&:hover': { borderColor: 'var(--md-sys-color-primary)' },
              }}
              aria-label="Carica circolari in formato CSV o JSON da Argo/Spaggiari"
            >
              <NotificationsActiveIcon sx={{ color: 'var(--md-sys-color-on-surface-variant)', flexShrink: 0 }} aria-hidden="true" />
              <Box>
                <Typography variant="labelMedium" sx={{ color: 'var(--md-sys-color-on-surface)' }}>Carica circolari (CSV o JSON)</Typography>
                <Typography variant="bodySmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                  CSV: oggetto;data;testo — JSON: [{'{'}title, content, date{'}'}]
                </Typography>
              </Box>
              <input id="onb-circular-upload" type="file" accept=".csv,.json" style={{ display: 'none' }} onChange={handleCircularFile} aria-label="Seleziona file circolari" />
            </Box>
            {circularImportError && (
              <Typography variant="bodySmall" sx={{ color: 'var(--md-sys-color-error)' }}>{circularImportError}</Typography>
            )}
            {circularItems.length > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-2)', p: 'var(--md-sys-spacing-2) var(--md-sys-spacing-3)', bgcolor: 'var(--md-sys-color-secondary-container)', borderRadius: 'var(--md-sys-shape-corner-small)' }}>
                <CheckCircleIcon sx={{ fontSize: 16, color: 'var(--md-sys-color-on-secondary-container)' }} aria-hidden="true" />
                <Typography variant="bodySmall" sx={{ color: 'var(--md-sys-color-on-secondary-container)', flex: 1 }}>
                  {circularItems.length} circolari — saranno aggiunte alla Knowledge Base al passo 5
                </Typography>
                <IconButton size="small" onClick={() => setCircularItems([])} aria-label="Rimuovi circolari caricate" sx={{ color: 'var(--md-sys-color-on-secondary-container)', p: '2px' }}>✕</IconButton>
              </Box>
            )}
          </Box>
        </Collapse>
      </Box>

      {renderNav(() => goTo(2), () => goTo(4), 'Avanti')}
    </Box>
  );

  // ── STEP 4: Scelta Modalità AI ────────────────────────────────────────────────
  const AI_MODES: { mode: InteractionMode; label: string; description: string; icon: React.ReactNode }[] = [
    {
      mode: 'classica',
      label: 'Classica',
      description: 'Interazione step-by-step guidata. L\'AI risponde solo quando invocata esplicitamente. Ideale per chi vuole mantenere pieno controllo.',
      icon: <SchoolIcon />,
    },
    {
      mode: 'semi-osmotica',
      label: 'Semi-osmotica',
      description: 'L\'AI suggerisce proattivamente alcune azioni in base al contesto. Analisi trend parziali attive. Bilanciamento tra controllo e autonomia.',
      icon: <SettingsSuggestIcon />,
    },
    {
      mode: 'osmotica',
      label: 'Osmotica',
      description: 'L\'AI interagisce in modo continuo e proattivo con l\'ambiente docente. Predizioni, raccomandazioni e interventi automatici su tutto il workflow.',
      icon: <AutoAwesomeIcon />,
    },
  ];

  const renderStep4 = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-5)' }}>
      {renderStepHeader('Modalità di Interazione AI', 'Scegli come vuoi interagire con il sistema AI. Modificabile in qualsiasi momento da Impostazioni.', <AutoAwesomeIcon fontSize="small" />)}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-3)' }} role="radiogroup" aria-label="Selezione modalità di interazione AI">
        {AI_MODES.map(({ mode, label, description, icon }) => {
          const selected = interactionMode === mode;
          return (
            <Box
              key={mode}
              component="button"
              type="button"
              onClick={() => setInteractionMode(mode)}
              aria-pressed={selected}
              aria-label={`Modalità ${label}: ${description}`}
              sx={{
                display: 'flex', alignItems: 'flex-start', gap: 'var(--md-sys-spacing-4)',
                p: 'var(--md-sys-spacing-4)',
                border: `2px solid ${selected ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-outline-variant)'}`,
                borderRadius: 'var(--md-sys-shape-corner-large)',
                bgcolor: selected ? 'var(--md-sys-color-primary-container)' : 'var(--md-sys-color-surface-container)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'border-color 150ms ease, background-color 150ms ease',
                '&:hover': {
                  borderColor: 'var(--md-sys-color-primary)',
                  bgcolor: selected ? 'var(--md-sys-color-primary-container)' : 'var(--md-sys-color-surface-container-high)',
                },
              }}
            >
              <Box sx={{
                width: 40, height: 40, flexShrink: 0,
                borderRadius: 'var(--md-sys-shape-corner-full)',
                bgcolor: selected ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-surface-container-high)',
                color: selected ? 'var(--md-sys-color-on-primary)' : 'var(--md-sys-color-on-surface-variant)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }} aria-hidden="true">
                {icon}
              </Box>
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-2)', mb: 'var(--md-sys-spacing-1)' }}>
                  <Typography variant="titleSmall" sx={{ color: selected ? 'var(--md-sys-color-on-primary-container)' : 'var(--md-sys-color-on-surface)' }}>
                    {label}
                  </Typography>
                  {selected && <CheckIcon sx={{ fontSize: 16, color: 'var(--md-sys-color-primary)' }} aria-hidden="true" />}
                </Box>
                <Typography variant="bodySmall" sx={{ color: selected ? 'var(--md-sys-color-on-primary-container)' : 'var(--md-sys-color-on-surface-variant)' }}>
                  {description}
                </Typography>
              </Box>
            </Box>
          );
        })}
      </Box>

      {renderNav(() => goTo(3), () => goTo(5), 'Inizializza')}
    </Box>
  );

  // ── STEP 5: Inizializzazione Infrastruttura ───────────────────────────────────
  const infraItems = [
    { label: 'Profilo docente configurato', threshold: 20 },
    { label: `Programmazioni importate (${importedData?.lessonCount ?? 0} lezioni · ${importedData?.udaCount ?? 0} UDA)`, threshold: 40 },
    { label: `Studenti importati (${importedStudents.length})`, threshold: 60 },
    { label: `Knowledge Base scuola (${schoolDocuments.length} doc. pubblici + ${circularItems.length} circolari)`, threshold: 80 },
    { label: 'Pipeline AI configurata — snapshot GDPR pronto', threshold: 100 },
  ];

  const renderStep5 = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-6)' }}>
      {renderStepHeader('Inizializzazione Infrastruttura', 'Stiamo preparando il tuo ambiente di lavoro personalizzato.', <SettingsSuggestIcon fontSize="small" />)}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-3)' }}>
        {infraItems.map(({ label, threshold }) => {
          const done = infraProgress >= threshold;
          const active = infraProgress < threshold && infraProgress >= (threshold - 30);
          return (
            <Box key={label} sx={{
              display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-3)',
              p: 'var(--md-sys-spacing-3)',
              bgcolor: done ? 'var(--md-sys-color-secondary-container)' : 'var(--md-sys-color-surface-container)',
              borderRadius: 'var(--md-sys-shape-corner-medium)',
              transition: 'background-color 400ms ease',
            }}>
              {done
                ? <CheckCircleIcon sx={{ color: 'var(--md-sys-color-on-secondary-container)', flexShrink: 0 }} aria-hidden="true" />
                : active
                  ? <CircularProgress size={20} sx={{ color: 'var(--md-sys-color-primary)', flexShrink: 0 }} aria-hidden="true" />
                  : <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: 'var(--md-sys-color-outline-variant)', flexShrink: 0 }} aria-hidden="true" />
              }
              <Typography variant="bodyMedium" sx={{
                color: done ? 'var(--md-sys-color-on-secondary-container)' : 'var(--md-sys-color-on-surface-variant)',
                transition: 'color 400ms ease',
              }}>
                {label}
              </Typography>
            </Box>
          );
        })}
      </Box>

      <LinearProgress
        variant="determinate"
        value={infraProgress}
        aria-label={`Progresso inizializzazione: ${infraProgress}%`}
        sx={{
          height: 8, borderRadius: 'var(--md-sys-shape-corner-full)',
          bgcolor: 'var(--md-sys-color-surface-container-high)',
          '& .MuiLinearProgress-bar': { bgcolor: 'var(--md-sys-color-primary)', borderRadius: 'var(--md-sys-shape-corner-full)' },
        }}
      />

      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          onClick={() => goTo(6)}
          disabled={!infraDone}
          aria-label="Vai al riepilogo finale"
          endIcon={<ArrowForwardIcon />}
          sx={{
            bgcolor: 'var(--md-sys-color-primary)',
            color: 'var(--md-sys-color-on-primary)',
            borderRadius: 'var(--md-sys-shape-corner-full)',
            '&:hover': { bgcolor: 'var(--md-sys-color-primary)', filter: 'brightness(0.92)' },
          }}
        >
          {infraDone ? 'Vai al riepilogo' : 'Attendere…'}
        </Button>
      </Box>
    </Box>
  );

  // ── STEP 6: Dashboard Riepilogo ────────────────────────────────────────────────
  const renderStep6 = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-5)' }}>
      {renderStepHeader('Tutto pronto!', `Benvenuto${nome ? `, ${nome}` : ''}. Il tuo ambiente è configurato e pronto all'uso.`, <CheckCircleIcon fontSize="small" />)}

      {/* Summary cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--md-sys-spacing-3)' }}>
        {[
          { label: 'Lezioni', value: importedData?.lessonCount ?? 0 },
          { label: 'UDA', value: importedData?.udaCount ?? 0 },
          { label: 'Studenti', value: importedStudents.length },
          { label: 'Doc. KB', value: schoolDocuments.length + circularItems.length },
          { label: 'Maturità AI', value: `${globalScore}%` },
        ].map(({ label, value }) => (
          <Box key={label} sx={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            p: 'var(--md-sys-spacing-4)',
            bgcolor: 'var(--md-sys-color-primary-container)',
            borderRadius: 'var(--md-sys-shape-corner-large)',
          }}>
            <Typography variant="headlineMedium" sx={{ color: 'var(--md-sys-color-on-primary-container)', lineHeight: 1 }}>
              {value}
            </Typography>
            <Typography variant="labelMedium" sx={{ color: 'var(--md-sys-color-on-primary-container)', opacity: 0.8, mt: 'var(--md-sys-spacing-1)' }}>
              {label}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Selected mode */}
      {(() => {
        const selected = AI_MODES.find(m => m.mode === interactionMode);
        return selected ? (
          <Box sx={{
            display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-3)',
            p: 'var(--md-sys-spacing-3)',
            bgcolor: 'var(--md-sys-color-surface-container)',
            borderRadius: 'var(--md-sys-shape-corner-medium)',
          }}>
            <Box sx={{ color: 'var(--md-sys-color-primary)' }} aria-hidden="true">{selected.icon}</Box>
            <Box>
              <Typography variant="labelMedium" sx={{ color: 'var(--md-sys-color-on-surface-variant)', display: 'block' }}>Modalità AI selezionata</Typography>
              <Typography variant="titleSmall" sx={{ color: 'var(--md-sys-color-on-surface)' }}>{selected.label}</Typography>
            </Box>
          </Box>
        ) : null;
      })()}

      {/* GDPR export */}
      <Button
        variant="outlined"
        startIcon={<DownloadIcon />}
        onClick={handleGdprExport}
        aria-label="Esporta snapshot configurazione in formato JSON per audit GDPR"
        sx={{
          borderColor: 'var(--md-sys-color-outline)',
          color: 'var(--md-sys-color-on-surface-variant)',
          borderRadius: 'var(--md-sys-shape-corner-full)',
          alignSelf: 'flex-start',
        }}
      >
        Esporta snapshot GDPR
      </Button>

      {/* Final CTA */}
      <Button
        variant="contained"
        size="large"
        onClick={handleComplete}
        aria-label="Avvia DocenteDoc AI — chiude la configurazione e apre la dashboard"
        endIcon={<AutoAwesomeIcon />}
        sx={{
          bgcolor: 'var(--md-sys-color-primary)',
          color: 'var(--md-sys-color-on-primary)',
          borderRadius: 'var(--md-sys-shape-corner-full)',
          py: 'var(--md-sys-spacing-3)',
          fontSize: 'var(--md-sys-typescale-label-large-size)',
          '&:hover': { bgcolor: 'var(--md-sys-color-primary)', filter: 'brightness(0.92)' },
        }}
      >
        Avvia DocenteDoc AI
      </Button>

      <Button
        variant="text"
        onClick={() => goTo(5)}
        aria-label="Torna al passo precedente"
        startIcon={<ArrowBackIcon />}
        sx={{ color: 'var(--md-sys-color-on-surface-variant)', alignSelf: 'flex-start' }}
      >
        Indietro
      </Button>
    </Box>
  );

  // ── Step renderer map ─────────────────────────────────────────────────────────
  const steps: Record<number, () => React.ReactNode> = {
    1: renderStep1, 2: renderStep2, 3: renderStep3,
    4: renderStep4, 5: renderStep5, 6: renderStep6,
  };

  return (
    <Box
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label="Configurazione iniziale DocenteDoc AI"
      aria-live="polite"
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 'var(--md-sys-z-modal, 600)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'var(--md-sys-color-scrim)',
        p: 'var(--md-sys-spacing-4)',
        overflowY: 'auto',
      }}
    >
      <Box sx={{
        position: 'relative',
        bgcolor: 'var(--md-sys-color-surface)',
        borderRadius: 'var(--md-sys-shape-corner-extra-large)',
        boxShadow: 'var(--md-sys-elevation-level3)',
        width: '100%',
        maxWidth: 640,
        my: 'auto',
        overflow: 'hidden',
      }}>
        {/* Global progress bar */}
        <LinearProgress
          variant="determinate"
          value={progressPct}
          aria-label={`Progresso onboarding: passo ${step} di ${TOTAL_STEPS}`}
          sx={{
            height: 4,
            bgcolor: 'var(--md-sys-color-surface-container-high)',
            '& .MuiLinearProgress-bar': { bgcolor: 'var(--md-sys-color-primary)' },
          }}
        />

        {/* Step dots */}
        <Box sx={{ display: 'flex', gap: 'var(--md-sys-spacing-1)', px: 'var(--md-sys-spacing-6)', pt: 'var(--md-sys-spacing-4)' }} aria-hidden="true">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <Box key={i} sx={{
              height: 4, flex: 1,
              borderRadius: 'var(--md-sys-shape-corner-full)',
              bgcolor: i < step ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-outline-variant)',
              transition: 'background-color 300ms ease',
            }} />
          ))}
        </Box>

        {/* Content */}
        <Box sx={{ p: 'var(--md-sys-spacing-6)', pt: 'var(--md-sys-spacing-4)' }}>
          {steps[step]?.() ?? null}
        </Box>
      </Box>
    </Box>
  );
};

export default OnboardingWizard;
