import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateSimulatedClasses,
  generateSingleClass,
  type GeneratorOptions,
  type SimulatedClassContext,
} from '../classGenerator';

// ── generateSimulatedClasses ──────────────────────────────────────────────────

describe('generateSimulatedClasses', () => {
  it('returns the requested number of classes', () => {
    const result = generateSimulatedClasses({ classes: 5 });
    expect(result).toHaveLength(5);
  });

  it('defaults to 10 classes', () => {
    const result = generateSimulatedClasses();
    expect(result).toHaveLength(10);
  });

  it('each class has the correct student count', () => {
    const opts: GeneratorOptions = { classes: 3, studentsPerClass: 15 };
    const result = generateSimulatedClasses(opts);
    for (const cls of result) {
      expect(cls.students).toHaveLength(15);
    }
  });

  it('each class has a name string', () => {
    const result = generateSimulatedClasses({ classes: 4 });
    for (const cls of result) {
      expect(typeof cls.className).toBe('string');
      expect(cls.className.length).toBeGreaterThan(0);
    }
  });

  it('class names are unique', () => {
    const result = generateSimulatedClasses({ classes: 10 });
    const names = result.map((c) => c.className);
    expect(new Set(names).size).toBe(names.length);
  });

  it('generates evaluations for every student', () => {
    const opts: GeneratorOptions = { classes: 2, studentsPerClass: 10 };
    const result = generateSimulatedClasses(opts);
    for (const cls of result) {
      expect(cls.evaluations.length).toBeGreaterThan(0);
    }
  });

  it('context.students matches cls.students', () => {
    const result = generateSimulatedClasses({ classes: 2 });
    for (const cls of result) {
      expect(cls.context.students).toHaveLength(cls.students.length);
    }
  });

  it('context.evaluations matches cls.evaluations', () => {
    const result = generateSimulatedClasses({ classes: 2 });
    for (const cls of result) {
      expect(cls.context.evaluations).toHaveLength(cls.evaluations.length);
    }
  });
});

// ── at-risk + excellence ratios ───────────────────────────────────────────────

describe('generateSimulatedClasses — profile ratios', () => {
  it('atRiskCount is approximately atRiskRatio × studentsPerClass', () => {
    const opts: GeneratorOptions = {
      classes: 10,
      studentsPerClass: 20,
      atRiskRatio: 0.2,
      excellenceRatio: 0.2,
    };
    const result = generateSimulatedClasses(opts);
    for (const cls of result) {
      // Allow ±1 student due to rounding
      expect(cls.meta.atRiskCount).toBeGreaterThanOrEqual(3);
      expect(cls.meta.atRiskCount).toBeLessThanOrEqual(5);
    }
  });

  it('excellenceCount is approximately excellenceRatio × studentsPerClass', () => {
    const opts: GeneratorOptions = {
      classes: 5,
      studentsPerClass: 20,
      atRiskRatio: 0.1,
      excellenceRatio: 0.3,
    };
    const result = generateSimulatedClasses(opts);
    for (const cls of result) {
      expect(cls.meta.excellenceCount).toBeGreaterThanOrEqual(5);
      expect(cls.meta.excellenceCount).toBeLessThanOrEqual(7);
    }
  });

  it('atRiskCount + excellenceCount + averageCount equals studentsPerClass', () => {
    const result = generateSimulatedClasses({ classes: 5, studentsPerClass: 20 });
    for (const cls of result) {
      const sum = cls.meta.atRiskCount + cls.meta.excellenceCount + cls.meta.averageCount;
      expect(sum).toBe(cls.students.length);
    }
  });
});

// ── SimulatedClassContext shape ───────────────────────────────────────────────

describe('SimulatedClassContext structure', () => {
  let cls: SimulatedClassContext;

  beforeEach(() => {
    [cls] = generateSimulatedClasses({ classes: 1, studentsPerClass: 10 });
  });

  it('has all required fields', () => {
    expect(cls).toHaveProperty('className');
    expect(cls).toHaveProperty('students');
    expect(cls).toHaveProperty('evaluations');
    expect(cls).toHaveProperty('context');
    expect(cls).toHaveProperty('meta');
  });

  it('meta has all required fields', () => {
    expect(cls.meta).toHaveProperty('atRiskCount');
    expect(cls.meta).toHaveProperty('excellenceCount');
    expect(cls.meta).toHaveProperty('averageCount');
    expect(cls.meta).toHaveProperty('averageGrade');
  });

  it('averageGrade is within a realistic range', () => {
    expect(cls.meta.averageGrade).toBeGreaterThanOrEqual(3);
    expect(cls.meta.averageGrade).toBeLessThanOrEqual(10);
  });

  it('each student has required Studente fields', () => {
    for (const s of cls.students) {
      expect(typeof s.id).toBe('string');
      expect(typeof s.nome).toBe('string');
      expect(typeof s.cognome).toBe('string');
      expect(typeof s.classe).toBe('string');
    }
  });

  it('each valutazione has required fields', () => {
    for (const v of cls.evaluations) {
      expect(typeof v.id).toBe('string');
      expect(typeof v.studenteId).toBe('string');
      expect(typeof v.materia).toBe('string');
      expect(typeof v.data).toBe('string');
      expect(typeof v.voto).toBe('string');
      const validTypes = ['Scritto', 'Orale', 'Pratico', 'Test', 'Verifica', 'Ricevimento'];
      expect(validTypes).toContain(v.tipo);
    }
  });

  it('all evaluazioni belong to students in the class', () => {
    const studentIds = new Set(cls.students.map((s) => s.id));
    for (const v of cls.evaluations) {
      expect(studentIds.has(v.studenteId)).toBe(true);
    }
  });
});

// ── generateSingleClass ───────────────────────────────────────────────────────

describe('generateSingleClass', () => {
  it('returns a single SimulatedClassContext', () => {
    const cls = generateSingleClass(0);
    expect(cls).toHaveProperty('className');
    expect(cls).toHaveProperty('students');
  });

  it('different classIndex produces different className', () => {
    const a = generateSingleClass(0);
    const b = generateSingleClass(1);
    expect(a.className).not.toBe(b.className);
  });

  it('respects options passed through', () => {
    const cls = generateSingleClass(0, { studentsPerClass: 8 });
    expect(cls.students).toHaveLength(8);
  });
});
