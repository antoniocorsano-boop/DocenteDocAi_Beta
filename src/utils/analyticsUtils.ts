import { Studente, Valutazione, ValutazioneCompetenza, Competenza } from '../types'; // FIX: Updated import path for types
import { RATING_TO_VALUE } from '../constants';

/**
 * Parses a grade string into a number handling Italian school conventions.
 * Supported formats:
 * - Integers: "7" -> 7
 * - Decimals (comma/dot): "7,5", "7.5" -> 7.5
 * - Suffixes: "7+" -> 7.25, "7-" -> 6.75, "7½" -> 7.5
 * - Ranges/Splits: "7/8", "7-8" -> 7.5
 * - Judgments: "Ottimo" -> 10 (via constants)
 */
export const parseGrade = (voto: string | undefined): number | undefined => {
    if (!voto) return undefined;
    
    const vStr = String(voto).trim();
    
    // 1. Check predefined constants (integers and judgments like "Ottimo")
    if (RATING_TO_VALUE[vStr] !== undefined) return RATING_TO_VALUE[vStr];
    
    // 2. Handle "Split" grades (e.g., "7/8" or "7-8")
    // Regex looks for Number [separator] Number
    const rangeMatch = vStr.match(/^(\d+(?:[.,]\d+)?)\s*[-/]\s*(\d+(?:[.,]\d+)?)$/);
    if (rangeMatch) {
        const n1 = parseFloat(rangeMatch[1].replace(',', '.'));
        const n2 = parseFloat(rangeMatch[2].replace(',', '.'));
        return (n1 + n2) / 2;
    }

    // 3. Handle Suffixes (+, -, ½) on single numbers
    let modifier = 0;
    let cleanStr = vStr;

    if (vStr.endsWith('+')) {
        modifier = 0.25;
        cleanStr = vStr.slice(0, -1);
    } else if (vStr.endsWith('-')) {
        modifier = -0.25;
        cleanStr = vStr.slice(0, -1);
    } else if (vStr.endsWith('½')) {
        modifier = 0.5;
        cleanStr = vStr.slice(0, -1);
    }

    // 4. Normalize decimal separator and parse
    cleanStr = cleanStr.replace(',', '.');
    const val = parseFloat(cleanStr);
    
    if (!isNaN(val)) {
        // Clamp between 1 and 10 to ensure data integrity
        return Math.min(10, Math.max(1, val + modifier));
    }
    
    return undefined;
};

// --- LINE CHART (Trend Temporale) ---
export interface TimeSeriesPoint {
    date: string; // YYYY-MM-DD
    value: number;
    label: string; // GG/MM
}

export const calculateClassTrend = (
    evaluations: Valutazione[],
    _students: Studente[],
    subject?: string
): TimeSeriesPoint[] => {
    // 1. Filter by subject if provided
    const relevantEvals = subject 
        ? evaluations.filter(e => e.materia === subject)
        : evaluations;

    // 2. Sort by date
    const sortedEvals = relevantEvals.sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());

    // 3. Group by date (bucket per day)
    const groups: Record<string, number[]> = {};
    sortedEvals.forEach(ev => {
        const dateKey = ev.data.split('T')[0];
        const val = parseGrade(ev.voto); // Use robust parser
        if (val !== undefined) {
            if (!groups[dateKey]) groups[dateKey] = [];
            groups[dateKey].push(val);
        }
    });

    // 4. Calculate averages
    const series: TimeSeriesPoint[] = Object.keys(groups).map(date => {
        const avg = groups[date].reduce((a, b) => a + b, 0) / groups[date].length;
        return {
            date,
            value: parseFloat(avg.toFixed(2)),
            label: new Date(date).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' })
        };
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return series;
};

// --- RADAR CHART (Competenze) ---
export interface RadarDataPoint {
    axis: string; // Competency Name
    value: number; // 1-4 (normalized from levels)
}

export const calculateCompetencyRadar = (
    compEvals: ValutazioneCompetenza[],
    competenze: Competenza[],
    studentId?: string
): RadarDataPoint[] => {
    // If studentId is provided, filter for that student. Else, average of class.
    const targetEvals = studentId 
        ? compEvals.filter(e => e.studenteId === studentId)
        : compEvals;

    const data: RadarDataPoint[] = [];

    competenze.forEach(comp => {
        const evalsForComp = targetEvals.filter(e => e.competenzaId === comp.id);
        const scores: number[] = [];
        
        if (studentId) {
             evalsForComp.forEach(ev => {
                const level = comp.livelli.find(l => l.id === ev.livelloId);
                if (level) scores.push(parseInt(level.punteggio, 10));
            });
        } else {
            // Class Average logic
            const studentLatest: Record<string, number> = {};
            evalsForComp.forEach(ev => {
                const level = comp.livelli.find(l => l.id === ev.livelloId);
                if (level) {
                    const score = parseInt(level.punteggio, 10);
                    studentLatest[ev.studenteId] = score; 
                }
            });
            Object.values(studentLatest).forEach(s => scores.push(s));
        }

        const avgScore = scores.length > 0 
            ? scores.reduce((a, b) => a + b, 0) / scores.length 
            : 0;

        data.push({
            axis: comp.nome.length > 12 ? comp.nome.substring(0, 12) + '...' : comp.nome, 
            value: parseFloat(avgScore.toFixed(2))
        });
    });

    return data;
};

// --- DISTRIBUTION (Bar Chart) ---
export const calculateGradeDistribution = (
    evaluations: Valutazione[],
    subject?: string
): { label: string; value: number }[] => {
    const relevant = subject ? evaluations.filter(e => e.materia === subject) : evaluations;
    
    const distribution: Record<string, number> = {
        'Insuff. (<6)': 0,
        'Suff. (6)': 0,
        'Discreto (7)': 0,
        'Buono (8)': 0,
        'Ottimo (9-10)': 0
    };

    relevant.forEach(ev => {
        const val = parseGrade(ev.voto); // Use robust parser
        if (val !== undefined) {
            if (val < 6) distribution['Insuff. (<6)']++;
            else if (val < 7) distribution['Suff. (6)']++;
            else if (val < 8) distribution['Discreto (7)']++;
            else if (val < 9) distribution['Buono (8)']++;
            else distribution['Ottimo (9-10)']++;
        }
    });

    return Object.entries(distribution).map(([label, value]) => ({ label, value }));
};

