/**
 * mockTeacherData.ts — Dati demo realistici per la Teacher Dashboard.
 * MOCK_LESSONS, MOCK_UDA, MOCK_STUDENTS, MOCK_EVALUATIONS, MOCK_SLOTS.
 */
import type { Lezione, Uda, Studente, Valutazione, Slot } from '../../types';

// ── Lezioni ──────────────────────────────────────────────────────────────────

export const MOCK_LESSONS: Lezione[] = [
  {
    id: 'ml-001', classe: '3A', materia: 'Matematica',
    contenuto: 'Equazioni di secondo grado — formula risolutiva e discriminante',
    svolta: true, data: '2026-03-16', tipoLezione: 'Teoria',
    obiettivi: 'Saper risolvere equazioni di 2° grado con il metodo della formula',
    unitaDiApprendimento: 'Algebra avanzata',
  },
  {
    id: 'ml-002', classe: '3A', materia: 'Matematica',
    contenuto: 'Esercitazione equazioni di secondo grado — casi particolari e delta nullo',
    svolta: true, data: '2026-03-17', tipoLezione: 'Laboratorio',
    obiettivi: 'Consolidare la padronanza della formula con esercizi graduati',
  },
  {
    id: 'ml-003', classe: '3A', materia: 'Scienze',
    contenuto: 'Il ciclo dell\'acqua — evaporazione, condensazione, precipitazione e infiltrazione',
    svolta: false, data: '2026-03-18', tipoLezione: 'Teoria',
    unitaDiApprendimento: 'Geosfera e idrosfera',
  },
  {
    id: 'ml-004', classe: '3A', materia: 'Storia',
    contenuto: 'La Prima Guerra Mondiale — cause strutturali e scintilla di Sarajevo',
    svolta: true, data: '2026-03-14', tipoLezione: 'Teoria',
    unitaDiApprendimento: 'Il Novecento',
  },
  {
    id: 'ml-005', classe: '3B', materia: 'Italiano',
    contenuto: 'Analisi del Canto V dell\'Inferno — Paolo e Francesca',
    svolta: true, data: '2026-03-16', tipoLezione: 'Teoria',
    obiettivi: 'Analisi retorica e tematica del testo dantesco',
    unitaDiApprendimento: 'Divina Commedia',
  },
  {
    id: 'ml-006', classe: '3B', materia: 'Italiano',
    contenuto: 'Verifica scritta su "I Promessi Sposi" — capitoli 1-8',
    svolta: false, data: '2026-03-19', tipoLezione: 'Verifica',
  },
  {
    id: 'ml-007', classe: '3B', materia: 'Storia',
    contenuto: 'Il Risorgimento italiano — Cavour, Mazzini e Garibaldi a confronto',
    svolta: true, data: '2026-03-15', tipoLezione: 'Teoria',
    unitaDiApprendimento: 'Ottocento italiano',
  },
  {
    id: 'ml-008', classe: '4A', materia: 'Fisica',
    contenuto: 'La corrente elettrica — legge di Ohm e resistenza dei conduttori',
    svolta: true, data: '2026-03-15', tipoLezione: 'Teoria',
    unitaDiApprendimento: 'Elettromagnetismo',
  },
  {
    id: 'ml-009', classe: '4A', materia: 'Fisica',
    contenuto: 'Laboratorio misure di resistenza con multimetro digitale',
    svolta: false, data: '2026-03-18', tipoLezione: 'Laboratorio',
  },
  {
    id: 'ml-010', classe: '4A', materia: 'Matematica',
    contenuto: 'Derivate — regole fondamentali e interpretazione geometrica',
    svolta: true, data: '2026-03-16', tipoLezione: 'Teoria',
    unitaDiApprendimento: 'Calcolo differenziale',
  },
];

// ── UDA ──────────────────────────────────────────────────────────────────────

export const MOCK_UDA: Uda[] = [
  {
    id: 'mu-001',
    title: 'Algebra e geometria analitica',
    classe: '3A', materia: 'Matematica',
    introduction: 'Percorso di matematica avanzata che collega algebra e geometria nel piano cartesiano.',
    finalProduct: 'Prova scritta con problemi misti e relazione di laboratorio su GeoGebra',
    competencyIds: ['comp-math-1', 'comp-math-2'],
    phases: [
      { id: 'ph-1', title: 'Equazioni', description: 'Studio equazioni 2° grado', activities: 'Teoria + esercizi in progressione', duration: '3 settimane' },
      { id: 'ph-2', title: 'Geometria', description: 'Coordinate cartesiane e rette', activities: 'Lab GeoGebra + problemi di verifica', duration: '2 settimane' },
    ],
    evaluation: 'Verifica scritta (70%) + portfolio esercizi (30%)',
    tools: 'GeoGebra, calcolatrice scientifica',
    startDate: '2026-03-01', endDate: '2026-04-10',
    startPos: 0, width: 200, color: '#6750A4', borderColor: '#381E72', textColor: '#FFFFFF',
  },
  {
    id: 'mu-002',
    title: 'Il Novecento in Letteratura e Storia',
    classe: '3B', materia: 'Italiano',
    introduction: 'UDA interdisciplinare che collega i grandi eventi storici del \'900 alle opere letterarie coeve.',
    finalProduct: 'Presentazione multimediale + saggio argomentativo',
    competencyIds: ['comp-ita-1', 'comp-sto-1'],
    phases: [
      { id: 'ph-1', title: 'Contestualizzazione storica', description: 'Prima e Seconda Guerra Mondiale', activities: 'Lezioni frontali + analisi fonti', duration: '2 settimane' },
      { id: 'ph-2', title: 'Testi letterari', description: 'Ungaretti, Montale, Pavese', activities: 'Analisi testi + discussione guidata', duration: '3 settimane' },
    ],
    evaluation: 'Saggio argomentativo (60%) + orale (40%)',
    tools: 'Canva, Google Workspace',
    startDate: '2026-03-10', endDate: '2026-04-30',
    startPos: 0, width: 240, color: '#625B71', borderColor: '#1D192B', textColor: '#FFFFFF',
  },
];

// ── Studenti ─────────────────────────────────────────────────────────────────

export const MOCK_STUDENTS: Studente[] = [
  { id: 'ms-001', nome: 'Giulia',     cognome: 'Rossi',     classe: '3A', dataNascita: '2010-05-12' },
  { id: 'ms-002', nome: 'Luca',       cognome: 'Bianchi',   classe: '3A', dataNascita: '2010-07-23', hasDSA: true },
  { id: 'ms-003', nome: 'Sofia',      cognome: 'Ferrari',   classe: '3A', dataNascita: '2010-03-08' },
  { id: 'ms-004', nome: 'Marco',      cognome: 'Esposito',  classe: '3A', dataNascita: '2010-11-30' },
  { id: 'ms-005', nome: 'Chiara',     cognome: 'Conti',     classe: '3A', dataNascita: '2010-09-15', hasBES: true },
  { id: 'ms-006', nome: 'Alessandro', cognome: 'Ricci',     classe: '3B', dataNascita: '2010-01-20' },
  { id: 'ms-007', nome: 'Valentina',  cognome: 'Marino',    classe: '3B', dataNascita: '2010-06-04' },
  { id: 'ms-008', nome: 'Matteo',     cognome: 'Greco',     classe: '3B', dataNascita: '2010-10-18' },
  { id: 'ms-009', nome: 'Francesca',  cognome: 'Bruno',     classe: '4A', dataNascita: '2009-04-25' },
  { id: 'ms-010', nome: 'Andrea',     cognome: 'Gallo',     classe: '4A', dataNascita: '2009-08-11', has104: true },
  { id: 'ms-011', nome: 'Elena',      cognome: 'Moretti',   classe: '4A', dataNascita: '2009-12-03' },
  { id: 'ms-012', nome: 'Davide',     cognome: 'Romano',    classe: '3A', dataNascita: '2010-08-19' },
];

// ── Valutazioni ───────────────────────────────────────────────────────────────

export const MOCK_EVALUATIONS: Valutazione[] = [
  { id: 'me-001', studenteId: 'ms-001', materia: 'Matematica', data: '2026-03-10', tipo: 'Scritto', voto: '8',   argomento: 'Equazioni primo grado' },
  { id: 'me-002', studenteId: 'ms-001', materia: 'Scienze',    data: '2026-03-05', tipo: 'Orale',   voto: '9',   argomento: 'Ciclo acqua' },
  { id: 'me-003', studenteId: 'ms-002', materia: 'Matematica', data: '2026-03-10', tipo: 'Scritto', voto: '6.5', argomento: 'Equazioni primo grado' },
  { id: 'me-004', studenteId: 'ms-002', materia: 'Italiano',   data: '2026-03-08', tipo: 'Scritto', voto: '5',   argomento: 'Analisi del testo' },
  { id: 'me-005', studenteId: 'ms-003', materia: 'Matematica', data: '2026-03-10', tipo: 'Scritto', voto: '7',   argomento: 'Equazioni primo grado' },
  { id: 'me-006', studenteId: 'ms-004', materia: 'Matematica', data: '2026-03-10', tipo: 'Scritto', voto: '9.5', argomento: 'Equazioni primo grado' },
  { id: 'me-007', studenteId: 'ms-005', materia: 'Matematica', data: '2026-03-10', tipo: 'Scritto', voto: '5.5', argomento: 'Equazioni primo grado' },
  { id: 'me-008', studenteId: 'ms-005', materia: 'Scienze',    data: '2026-03-06', tipo: 'Orale',   voto: '6',   argomento: 'Ciclo acqua' },
  { id: 'me-009', studenteId: 'ms-006', materia: 'Italiano',   data: '2026-03-12', tipo: 'Orale',   voto: '8',   argomento: 'Dante — Inferno' },
  { id: 'me-010', studenteId: 'ms-007', materia: 'Italiano',   data: '2026-03-12', tipo: 'Orale',   voto: '7.5', argomento: 'Dante — Inferno' },
  { id: 'me-011', studenteId: 'ms-008', materia: 'Italiano',   data: '2026-03-12', tipo: 'Orale',   voto: '4.5', argomento: 'Dante — Inferno' },
  { id: 'me-012', studenteId: 'ms-009', materia: 'Fisica',     data: '2026-03-11', tipo: 'Scritto', voto: '8.5', argomento: 'Legge di Ohm' },
  { id: 'me-013', studenteId: 'ms-010', materia: 'Fisica',     data: '2026-03-11', tipo: 'Scritto', voto: '7',   argomento: 'Legge di Ohm' },
  { id: 'me-014', studenteId: 'ms-011', materia: 'Fisica',     data: '2026-03-11', tipo: 'Scritto', voto: '9',   argomento: 'Legge di Ohm' },
  { id: 'me-015', studenteId: 'ms-012', materia: 'Matematica', data: '2026-03-10', tipo: 'Scritto', voto: '6',   argomento: 'Equazioni primo grado' },
];

// ── Slot ─────────────────────────────────────────────────────────────────────

export const MOCK_SLOTS: Record<string, Slot> = {
  '3A_Lunedì_1':    { giorno: 'Lunedì',    ora: '08:00-09:00', classe: '3A', materia: 'Matematica', lezioneId: 'ml-001' },
  '3A_Lunedì_2':    { giorno: 'Lunedì',    ora: '09:00-10:00', classe: '3A', materia: 'Storia' },
  '3A_Martedì_1':   { giorno: 'Martedì',   ora: '08:00-09:00', classe: '3A', materia: 'Matematica', lezioneId: 'ml-002' },
  '3A_Martedì_2':   { giorno: 'Martedì',   ora: '09:00-10:00', classe: '3A', materia: 'Scienze' },
  '3A_Mercoledì_1': { giorno: 'Mercoledì', ora: '08:00-09:00', classe: '3A', materia: 'Scienze',    lezioneId: 'ml-003' },
  '3A_Giovedì_1':   { giorno: 'Giovedì',   ora: '08:00-09:00', classe: '3A', materia: 'Storia',     lezioneId: 'ml-004' },
  '3B_Lunedì_1':    { giorno: 'Lunedì',    ora: '10:00-11:00', classe: '3B', materia: 'Italiano',   lezioneId: 'ml-005' },
  '3B_Lunedì_2':    { giorno: 'Lunedì',    ora: '11:00-12:00', classe: '3B', materia: 'Storia',    lezioneId: 'ml-007' },
  '3B_Giovedì_1':   { giorno: 'Giovedì',   ora: '08:00-09:00', classe: '3B', materia: 'Italiano' },
  '3B_Venerdì_1':   { giorno: 'Venerdì',   ora: '08:00-09:00', classe: '3B', materia: 'Italiano',   lezioneId: 'ml-006' },
  '4A_Lunedì_1':    { giorno: 'Lunedì',    ora: '11:00-12:00', classe: '4A', materia: 'Fisica',     lezioneId: 'ml-008' },
  '4A_Mercoledì_1': { giorno: 'Mercoledì', ora: '09:00-10:00', classe: '4A', materia: 'Fisica',     lezioneId: 'ml-009' },
  '4A_Mercoledì_2': { giorno: 'Mercoledì', ora: '10:00-11:00', classe: '4A', materia: 'Matematica', lezioneId: 'ml-010' },
  '4A_Venerdì_1':   { giorno: 'Venerdì',   ora: '09:00-10:00', classe: '4A', materia: 'Matematica' },
};
