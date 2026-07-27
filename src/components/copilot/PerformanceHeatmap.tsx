/**
 * PerformanceHeatmap — Sprint 1 Performance Insights
 *
 * Grade heatmap: rows = students, columns = subjects.
 * Each cell shows the average grade with an MD3 color bucket.
 * When selectedStudentId !== 'all', only that student's row is shown.
 */
import React, { useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import type { Studente, Valutazione } from '../../types';

// ── colour buckets ────────────────────────────────────────────────────────────

interface Bucket {
  bg: string;
  fg: string;
  label: string;
}

function gradeBucket(avg: number): Bucket {
  if (avg >= 8)
    return {
      bg: 'var(--md-sys-color-tertiary-container)',
      fg: 'var(--md-sys-color-on-tertiary-container)',
      label: 'Eccellenza',
    };
  if (avg >= 6.5)
    return {
      bg: 'var(--md-sys-color-secondary-container)',
      fg: 'var(--md-sys-color-on-secondary-container)',
      label: 'Sufficiente',
    };
  if (avg >= 6)
    return {
      bg: 'var(--md-sys-color-surface-container-high)',
      fg: 'var(--md-sys-color-on-surface-variant)',
      label: 'Borderline',
    };
  return {
    bg: 'var(--md-sys-color-error-container)',
    fg: 'var(--md-sys-color-on-error-container)',
    label: 'Rischio',
  };
}

const NO_DATA_BUCKET: Bucket = {
  bg: 'var(--md-sys-color-surface-container)',
  fg: 'var(--md-sys-color-on-surface-variant)',
  label: 'Nessun dato',
};

// ── computation ───────────────────────────────────────────────────────────────

function parseVoto(v: string): number {
  const n = parseFloat(v.replace(',', '.'));
  return isNaN(n) ? -1 : n;
}

interface CellData {
  avg: number | null; // null = no evaluations
  count: number;
  bucket: Bucket;
}

type HeatmapMatrix = Map<string /* studentId */, Map<string /* subject */, CellData>>;

function buildMatrix(
  students: Studente[],
  evaluations: Valutazione[],
  subjects: string[],
  studentId: string,
): HeatmapMatrix {
  const targets = studentId === 'all' ? students : students.filter((s) => s.id === studentId);

  const matrix: HeatmapMatrix = new Map();

  for (const student of targets) {
    const row = new Map<string, CellData>();
    for (const subject of subjects) {
      const evals = evaluations.filter(
        (e) => e.studenteId === student.id && e.materia === subject,
      );
      const valid = evals.map((e) => parseVoto(e.voto)).filter((v) => v >= 0);
      if (!valid.length) {
        row.set(subject, { avg: null, count: 0, bucket: NO_DATA_BUCKET });
      } else {
        const avg = parseFloat((valid.reduce((a, b) => a + b, 0) / valid.length).toFixed(1));
        row.set(subject, { avg, count: valid.length, bucket: gradeBucket(avg) });
      }
    }
    matrix.set(student.id, row);
  }

  return matrix;
}

// ── component ─────────────────────────────────────────────────────────────────

interface PerformanceHeatmapProps {
  students: Studente[];
  evaluations: Valutazione[];
  selectedStudentId: string;
}

const MAX_ROWS = 12; // limit render height on large classes

const PerformanceHeatmap: React.FC<PerformanceHeatmapProps> = ({
  students,
  evaluations,
  selectedStudentId,
}) => {
  const displayStudents = useMemo(
    () =>
      selectedStudentId === 'all'
        ? students.slice(0, MAX_ROWS)
        : students.filter((s) => s.id === selectedStudentId),
    [students, selectedStudentId],
  );

  const subjects = useMemo(() => {
    const set = new Set<string>();
    for (const e of evaluations) {
      if (displayStudents.some((s) => s.id === e.studenteId)) set.add(e.materia);
    }
    return [...set].sort();
  }, [evaluations, displayStudents]);

  const matrix = useMemo(
    () => buildMatrix(displayStudents, evaluations, subjects, selectedStudentId),
    [displayStudents, evaluations, subjects, selectedStudentId],
  );

  if (!displayStudents.length || !subjects.length) {
    return (
      <Box sx={{ py: 3, textAlign: 'center' }}>
        <Typography variant="body2" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
          Nessun dato di valutazione disponibile per la selezione corrente.
        </Typography>
      </Box>
    );
  }

  // Truncation note
  const truncated = selectedStudentId === 'all' && students.length > MAX_ROWS;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-2)' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 1 }}>
        <Typography
          variant="titleSmall"
          sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}
        >
          Heatmap voti per materia
        </Typography>
        {truncated && (
          <Typography variant="caption" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
            Mostrati i primi {MAX_ROWS} di {students.length} studenti
          </Typography>
        )}
      </Box>

      {/* Scrollable grid */}
      <Box sx={{ overflowX: 'auto', pb: 'var(--md-sys-spacing-1)' }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: `minmax(90px,1fr) repeat(${subjects.length}, minmax(52px,1fr))`,
            gap: 'var(--md-sys-spacing-1)',
            minWidth: 260,
          }}
        >
          {/* Header row */}
          <Box /> {/* empty corner */}
          {subjects.map((subj) => (
            <Typography
              key={subj}
              variant="caption"
              sx={{
                color: 'var(--md-sys-color-on-surface-variant)',
                fontWeight: 'var(--md-sys-typescale-weight-medium)',
                textAlign: 'center',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                px: 0.5,
              }}
            >
              {subj}
            </Typography>
          ))}

          {/* Data rows */}
          {displayStudents.map((student) => {
            const row = matrix.get(student.id);
            return (
              <React.Fragment key={student.id}>
                {/* Student name */}
                <Typography
                  variant="caption"
                  sx={{
                    color: 'var(--md-sys-color-on-surface)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    alignSelf: 'center',
                    fontWeight: 'var(--md-sys-typescale-weight-medium)',
                  }}
                >
                  {student.cognome} {student.nome.charAt(0)}.
                </Typography>

                {/* Grade cells */}
                {subjects.map((subj) => {
                  const cell = row?.get(subj) ?? { avg: null, count: 0, bucket: NO_DATA_BUCKET };
                  const tipText =
                    cell.avg !== null
                      ? `${student.cognome} — ${subj}: media ${cell.avg} (${cell.count} val.) — ${cell.bucket.label}`
                      : `${student.cognome} — ${subj}: nessuna valutazione`;

                  return (
                    <Tooltip key={subj} title={tipText} arrow>
                      <Box
                        sx={{
                          backgroundColor: cell.bucket.bg,
                          color: cell.bucket.fg,
                          borderRadius: 'var(--md-sys-shape-corner-extra-small)',
                          height: 32,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'default',
                          transition: 'opacity 0.15s',
                          '&:hover': { opacity: 0.8 },
                        }}
                        aria-label={tipText}
                      >
                        <Typography variant="caption" sx={{ fontWeight: 'var(--md-sys-typescale-weight-medium)', fontSize: 11 }}>
                          {cell.avg !== null ? cell.avg : '—'}
                        </Typography>
                      </Box>
                    </Tooltip>
                  );
                })}
              </React.Fragment>
            );
          })}
        </Box>
      </Box>

      {/* Legend */}
      <Box sx={{ display: 'flex', gap: 'var(--md-sys-spacing-3)', flexWrap: 'wrap', mt: 'var(--md-sys-spacing-1)' }}>
        {(
          [
            { bg: 'var(--md-sys-color-tertiary-container)', fg: 'var(--md-sys-color-on-tertiary-container)', text: '≥ 8 Eccellenza' },
            { bg: 'var(--md-sys-color-secondary-container)', fg: 'var(--md-sys-color-on-secondary-container)', text: '6.5–7.9 Buono' },
            { bg: 'var(--md-sys-color-surface-container-high)', fg: 'var(--md-sys-color-on-surface-variant)', text: '6–6.4 Borderline' },
            { bg: 'var(--md-sys-color-error-container)', fg: 'var(--md-sys-color-on-error-container)', text: '< 6 Rischio' },
          ] as { bg: string; fg: string; text: string }[]
        ).map((b) => (
          <Box key={b.text} sx={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-1)' }}>
            <Box sx={{ width: 14, height: 14, borderRadius: 'var(--md-sys-shape-corner-extra-small)', backgroundColor: b.bg, flexShrink: 0 }} />
            <Typography variant="caption" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>{b.text}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default PerformanceHeatmap;
