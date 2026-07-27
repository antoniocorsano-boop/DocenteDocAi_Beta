import { Studente } from '../types';

/**
 * Parses a class string (e.g., "1A", "3B", "5AS") into its components.
 * Returns grade (number) and section (string).
 */
export const parseClassString = (classStr: string): { grade: number; section: string } | null => {
    // Regex to match "1A", "1 A", "5AS"
    const match = classStr.match(/^(\d+)\s*([a-zA-Z]+)$/);
    if (match) {
        return {
            grade: parseInt(match[1], 10),
            section: match[2].toUpperCase()
        };
    }
    return null;
};

/**
 * Calculates the next class or archived state.
 * @param currentClass The current class string (e.g. "1A")
 * @param schoolType The school type to determine max grade
 */
export const getNextClass = (currentClass: string, schoolType: string): { nextClass: string; isArchived: boolean } => {
    // Determine max grade based on school type
    let maxGrade = 5; // Default High School
    if (schoolType.toLowerCase().includes('secondaria di i grado') || schoolType.toLowerCase().includes('media')) {
        maxGrade = 3;
    }

    const parsed = parseClassString(currentClass);
    
    if (!parsed) {
        // If we can't parse (e.g., "Gruppo Sportivo"), we keep it as is or mark for manual review
        return { nextClass: currentClass, isArchived: false };
    }

    if (parsed.grade < maxGrade) {
        return { nextClass: `${parsed.grade + 1}${parsed.section}`, isArchived: false };
    } else {
        return { nextClass: 'Diplomato', isArchived: true };
    }
};

/**
 * Process a list of students for promotion.
 */
export const calculatePromotions = (students: Studente[], schoolType: string): Array<{ student: Studente; newClass: string; isArchived: boolean }> => {
    return students.map(s => {
        const result = getNextClass(s.classe, schoolType);
        return {
            student: s,
            newClass: result.nextClass,
            isArchived: result.isArchived
        };
    });
};

/**
 * Generates the next school year string based on the current one.
 * e.g. "2023/2024" -> "2024/2025"
 */
export const generateNextSchoolYear = (currentYear: string): string => {
    const parts = currentYear.split('/');
    if (parts.length === 2) {
        const start = parseInt(parts[0]);
        const end = parseInt(parts[1]);
        if (!isNaN(start) && !isNaN(end)) {
            return `${start + 1}/${end + 1}`;
        }
    }
    // Fallback based on current date
    const now = new Date();
    const y = now.getFullYear();
    return `${y}/${y + 1}`;
};

