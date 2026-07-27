/**
 * StudentTrendChart — Sprint 1 Performance Insights
 *
 * Renders a grade moving-average line chart for the selected student or
 * the whole class.  Recharts AreaChart with MD3 color tokens.
 */
import React, { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { Studente, Valutazione } from '../../types';

// ── helpers ──────────────────────────────────────────────────────────────────

function parseVoto(v: string): number {
  const n = parseFloat(v.replace(',', '.'));
  return isNaN(n) ? -1 : n;
}

/** ISO-ish date string → "DD/MM" label */
function toShortDate(d: string): string {
  const parts = d.slice(0, 10).split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}`;
  return d;
}

/** 3-point centred moving average (handles edges with partial windows) */
function movingAverage(values: number[], window = 3): number[] {
  return values.map((_, i) => {
    const half = Math.floor(window / 2);
    const start = Math.max(0, i - half);
    const end = Math.min(values.length - 1, i + half);
    const slice = values.slice(start, end + 1);
    return parseFloat((slice.reduce((a, b) => a + b, 0) / slice.length).toFixed(2));
  });
}

interface TrendPoint {
  label: string;
  raw: number;
  ma: number;
}

// ── main computation ─────────────────────────────────────────────────────────

function buildTrendData(
  students: Studente[],
  evaluations: Valutazione[],
  studentId: string,
  daysBack = 90,
): TrendPoint[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysBack);

  const relevant = evaluations.filter((e) => {
    if (studentId !== 'all' && e.studenteId !== studentId) return false;
    if (studentId === 'all') {
      const belongs = students.some((s) => s.id === e.studenteId);
      if (!belongs) return false;
    }
    const d = new Date(e.data);
    return !isNaN(d.getTime()) && d >= cutoff;
  });

  if (!relevant.length) return [];

  // Group by date → average grade that day
  const byDate = new Map<string, number[]>();
  for (const e of relevant) {
    const day = e.data.slice(0, 10); // "YYYY-MM-DD"
    const v = parseVoto(e.voto);
    if (v < 0) continue;
    const arr = byDate.get(day) ?? [];
    arr.push(v);
    byDate.set(day, arr);
  }

  const sorted = [...byDate.entries()].sort(([a], [b]) => a.localeCompare(b));

  if (sorted.length < 2) return [];

  const rawValues = sorted.map(([, vals]) => parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2)));
  const maValues = movingAverage(rawValues, 3);

  return sorted.map(([date, vals], i) => ({
    label: toShortDate(date),
    raw: parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2)),
    ma: maValues[i],
  }));
}

// ── custom tooltip ────────────────────────────────────────────────────────────

interface PayloadItem {
  value: number;
  name: string;
  color: string;
}

interface TooltipProps {
  active?: boolean;
  payload?: PayloadItem[];
  label?: string;
}

const CustomTooltip: React.FC<TooltipProps> = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <Box
      sx={{
        backgroundColor: 'var(--md-sys-color-surface-container-high)',
        border: '1px solid var(--md-sys-color-outline-variant)',
        borderRadius: 'var(--md-sys-shape-corner-small)',
        padding: 'var(--md-sys-spacing-3)',
        minWidth: 120,
      }}
    >
      <Typography variant="caption" sx={{ color: 'var(--md-sys-color-on-surface-variant)', display: 'block', mb: 0.5 }}>
        {label}
      </Typography>
      {payload.map((p) => (
        <Typography key={p.name} variant="body2" sx={{ color: p.color }}>
          {p.name === 'ma' ? 'Media mobile' : 'Giornaliera'}: <strong>{p.value}</strong>
        </Typography>
      ))}
    </Box>
  );
};

// ── component ─────────────────────────────────────────────────────────────────

interface StudentTrendChartProps {
  students: Studente[];
  evaluations: Valutazione[];
  studentId: string;
  className: string;
}

const StudentTrendChart: React.FC<StudentTrendChartProps> = ({ students, evaluations, studentId, className }) => {
  const data = useMemo(
    () => buildTrendData(students, evaluations, studentId),
    [students, evaluations, studentId],
  );

  const label =
    studentId === 'all'
      ? `Trend voti — classe ${className}`
      : (() => {
          const s = students.find((x) => x.id === studentId);
          return s ? `Trend voti — ${s.cognome} ${s.nome}` : `Trend voti`;
        })();

  if (!data.length) {
    return (
      <Box sx={{ py: 3, textAlign: 'center' }}>
        <Typography variant="body2" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
          Dati insufficienti per visualizzare il trend (serve almeno 2 date di valutazione negli ultimi 90 giorni).
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-2)' }}>
      <Typography
        variant="titleSmall"
        sx={{ color: 'var(--md-sys-color-on-surface-variant)', mb: 'var(--md-sys-spacing-2)' }}
      >
        {label}
      </Typography>

      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
          <defs>
            <linearGradient id="gradTrendMA" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--md-sys-color-primary)" stopOpacity={0.25} />
              <stop offset="95%" stopColor="var(--md-sys-color-primary)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--md-sys-color-outline-variant)"
            strokeOpacity={0.5}
          />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: 'var(--md-sys-color-on-surface-variant)' }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            domain={[1, 10]}
            ticks={[4, 5, 6, 7, 8, 9, 10]}
            tick={{ fontSize: 11, fill: 'var(--md-sys-color-on-surface-variant)' }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          {/* Raw daily average — faint */}
          <Area
            type="monotone"
            dataKey="raw"
            name="raw"
            stroke="var(--md-sys-color-outline-variant)"
            strokeWidth={1}
            fill="none"
            dot={false}
          />
          {/* Moving average — prominent */}
          <Area
            type="monotone"
            dataKey="ma"
            name="ma"
            stroke="var(--md-sys-color-primary)"
            strokeWidth={2}
            fill="url(#gradTrendMA)"
            dot={{ r: 3, fill: 'var(--md-sys-color-primary)', strokeWidth: 0 }}
            activeDot={{ r: 5 }}
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Legend */}
      <Box sx={{ display: 'flex', gap: 'var(--md-sys-spacing-4)', justifyContent: 'flex-end' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-1)' }}>
          <Box sx={{ width: 24, height: 2, backgroundColor: 'var(--md-sys-color-outline-variant)', borderRadius: 1 }} />
          <Typography variant="caption" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Giornaliera</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-1)' }}>
          <Box sx={{ width: 24, height: 2, backgroundColor: 'var(--md-sys-color-primary)', borderRadius: 1 }} />
          <Typography variant="caption" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Media mobile</Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default StudentTrendChart;
