import { Valutazione } from '../types'; // FIX: Updated import path to types
import { parseGrade } from './analyticsUtils.ts';

const GRADE_AVERAGE_LIMIT = 5;
const TREND_HISTORY_LIMIT = 10;

export const calculatePerformance = (
  studentId: string,
  type: Valutazione['tipo'] | 'Complessivo',
  allEvaluations: Valutazione[]
): { grade: string | null; trend: 'up' | 'stable' | 'down' | null } => {
  
  const studentHistory = allEvaluations.filter(
    ev =>
      ev.studenteId === studentId &&
      (type === 'Complessivo' || ev.tipo === type)
  );

  // Use centralized robust parser
  // This handles "7+", "7/8", "Ottimo", etc. consistently across the app
  const numericHistory = studentHistory
    .map(ev => parseGrade(ev.voto))
    .filter((v): v is number => v !== undefined);

  let grade: string | null = null;
  const recentRatingsForGrade = numericHistory.slice(-GRADE_AVERAGE_LIMIT);
  
  if (recentRatingsForGrade.length > 0) {
    const sum = recentRatingsForGrade.reduce((acc, v) => acc + v, 0);
    const avg = sum / recentRatingsForGrade.length;
    grade = avg.toFixed(1);
  }

  let trend: 'up' | 'stable' | 'down' | null = null;
  const recentRatingsForTrend = numericHistory.slice(-TREND_HISTORY_LIMIT);
  
  if (recentRatingsForTrend.length >= 4) { // Need at least 2 points in each half
    const midpoint = Math.ceil(recentRatingsForTrend.length / 2);
    const olderHalf = recentRatingsForTrend.slice(0, midpoint);
    const newerHalf = recentRatingsForTrend.slice(-midpoint);

    const olderSum = olderHalf.reduce((acc, v) => acc + v, 0);
    const olderAvg = olderSum / olderHalf.length;

    const newerSum = newerHalf.reduce((acc, v) => acc + v, 0);
    const newerAvg = newerSum / newerHalf.length;

    const diff = newerAvg - olderAvg;

    if (diff > 0.5) {
      trend = 'up';
    } else if (diff < -0.5) {
      trend = 'down';
    } else {
      trend = 'stable';
    }
  } else if (recentRatingsForTrend.length > 0) {
      trend = 'stable';
  }

  return { grade, trend };
};

