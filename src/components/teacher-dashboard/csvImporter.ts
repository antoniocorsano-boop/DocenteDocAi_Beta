/**
 * csvImporter.ts — Parser CSV per importazione studenti e lezioni.
 * parseStudentsCsv(raw) e parseLessonsCsv(raw) — funzioni pure, senza side-effect.
 *
 * Formato atteso studenti:
 *   cognome,nome,classe,dataNascita,hasDSA,hasBES,has104
 *
 * Formato atteso lezioni:
 *   classe,materia,contenuto,data,tipoLezione,svolta,obiettivi,unitaDiApprendimento
 */
import type { Studente, Lezione } from '../../types';

// ── helpers ───────────────────────────────────────────────────────────────────

function parseBoolean(val: string | undefined): boolean {
  if (!val) return false;
  return ['1', 'true', 'sì', 'si', 'yes'].includes(val.trim().toLowerCase());
}

function parseCsvRows(raw: string): string[][] {
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) =>
      line.split(',').map((cell) => cell.trim().replace(/^"|"$/g, ''))
    );
}

// ── public API ────────────────────────────────────────────────────────────────

/**
 * Parsa un CSV di studenti e restituisce un array di Studente.
 * La prima riga è interpretata come intestazione e saltata se contiene
 * la parola "cognome" o "nome" (case-insensitive).
 *
 * @param raw  Testo CSV grezzo
 * @returns    Array di Studente con ID auto-generato
 */
export function parseStudentsCsv(raw: string): Studente[] {
  const rows = parseCsvRows(raw);
  if (rows.length === 0) return [];

  // Salta l'intestazione se presente
  const startIdx =
    rows[0][0]?.toLowerCase().includes('cognome') ||
    rows[0][1]?.toLowerCase().includes('nome')
      ? 1
      : 0;

  const results: Studente[] = [];

  for (let i = startIdx; i < rows.length; i++) {
    const [cognome, nome, classe, dataNascita, hasDSA, hasBES, has104] = rows[i];
    if (!cognome || !nome || !classe) continue; // Riga incompleta — salta

    results.push({
      id:          `csv-s-${Date.now()}-${i}`,
      cognome:     cognome,
      nome:        nome,
      classe:      classe,
      dataNascita: dataNascita ?? undefined,
      hasDSA:      parseBoolean(hasDSA),
      hasBES:      parseBoolean(hasBES),
      has104:      parseBoolean(has104),
    });
  }

  return results;
}

/**
 * Parsa un CSV di lezioni e restituisce un array di Lezione.
 * La prima riga è interpretata come intestazione e saltata se contiene
 * la parola "classe" o "materia".
 *
 * @param raw  Testo CSV grezzo
 * @returns    Array di Lezione con ID auto-generato
 */
export function parseLessonsCsv(raw: string): Lezione[] {
  const rows = parseCsvRows(raw);
  if (rows.length === 0) return [];

  const VALID_TYPES: NonNullable<Lezione['tipoLezione']>[] = [
    'Teoria', 'Disegno', 'Laboratorio', 'Test', 'Verifica', 'Disposizione', 'Ricevimento',
  ];

  const startIdx =
    rows[0][0]?.toLowerCase().includes('classe') ||
    rows[0][1]?.toLowerCase().includes('materia')
      ? 1
      : 0;

  const results: Lezione[] = [];

  for (let i = startIdx; i < rows.length; i++) {
    const [
      classe,
      materia,
      contenuto,
      data,
      tipoLezioneRaw,
      svoltaRaw,
      obiettivi,
      unitaDiApprendimento,
    ] = rows[i];

    if (!classe || !materia || !contenuto) continue;

    const tipoLezione = VALID_TYPES.find(
      (t) => t.toLowerCase() === (tipoLezioneRaw ?? '').trim().toLowerCase()
    );

    results.push({
      id:                  `csv-l-${Date.now()}-${i}`,
      classe,
      materia,
      contenuto,
      data:                data ?? undefined,
      tipoLezione:         tipoLezione ?? 'Teoria',
      svolta:              parseBoolean(svoltaRaw),
      obiettivi:           obiettivi ?? undefined,
      unitaDiApprendimento: unitaDiApprendimento ?? undefined,
    });
  }

  return results;
}
