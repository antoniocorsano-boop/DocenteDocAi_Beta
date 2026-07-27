import { describe, it, expect } from 'vitest';
import { parseClassString, getNextClass, calculatePromotions, generateNextSchoolYear } from '../../src/utils/schoolUtils';
import { Studente } from '../../src/types';

describe('schoolUtils', () => {
  describe('parseClassString', () => {
    it('should parse standard class strings', () => {
      expect(parseClassString('1A')).toEqual({ grade: 1, section: 'A' });
      expect(parseClassString('3B')).toEqual({ grade: 3, section: 'B' });
      expect(parseClassString('5AS')).toEqual({ grade: 5, section: 'AS' });
    });

    it('should handle spaces', () => {
      expect(parseClassString('1 A')).toEqual({ grade: 1, section: 'A' });
    });

    it('should return null for invalid strings', () => {
      expect(parseClassString('A1')).toBeNull();
      expect(parseClassString('Classe')).toBeNull();
      expect(parseClassString('')).toBeNull();
    });
  });

  describe('getNextClass', () => {
    it('should increment grade for high school', () => {
      expect(getNextClass('1A', 'Liceo')).toEqual({ nextClass: '2A', isArchived: false });
      expect(getNextClass('4B', 'Istituto Tecnico')).toEqual({ nextClass: '5B', isArchived: false });
    });

    it('should archive for high school grade 5', () => {
      expect(getNextClass('5A', 'Liceo')).toEqual({ nextClass: 'Diplomato', isArchived: true });
    });

    it('should archive for middle school grade 3', () => {
      expect(getNextClass('3A', 'Scuola Secondaria di I Grado')).toEqual({ nextClass: 'Diplomato', isArchived: true });
      expect(getNextClass('3A', 'Media')).toEqual({ nextClass: 'Diplomato', isArchived: true });
    });

    it('should handle unparsable class strings', () => {
      expect(getNextClass('Gruppo Sportivo', 'Liceo')).toEqual({ nextClass: 'Gruppo Sportivo', isArchived: false });
    });
  });

  describe('calculatePromotions', () => {
    it('should process a list of students', () => {
      const students: Studente[] = [
        { id: '1', nome: 'Mario', cognome: 'Rossi', classe: '1A' },
        { id: '2', nome: 'Luca', cognome: 'Bianchi', classe: '5B' }
      ];
      const result = calculatePromotions(students, 'Liceo');
      expect(result).toHaveLength(2);
      expect(result[0].newClass).toBe('2A');
      expect(result[1].newClass).toBe('Diplomato');
      expect(result[1].isArchived).toBe(true);
    });
  });

  describe('generateNextSchoolYear', () => {
    it('should increment school year', () => {
      expect(generateNextSchoolYear('2023/2024')).toBe('2024/2025');
    });

    it('should fallback for invalid format', () => {
      const now = new Date();
      const y = now.getFullYear();
      const expected = `${y}/${y + 1}`;
      expect(generateNextSchoolYear('invalid')).toBe(expected);
      expect(generateNextSchoolYear('2023/invalid')).toBe(expected);
      expect(generateNextSchoolYear('invalid/2024')).toBe(expected);
    });
  });
});
