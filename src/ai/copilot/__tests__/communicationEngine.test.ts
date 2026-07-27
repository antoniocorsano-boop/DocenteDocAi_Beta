import { describe, it, expect } from 'vitest';
import { generateCommunications } from '../communicationEngine';
import type { GeneratedMessage } from '../communicationEngine';
import type { AISuggestion } from '../../contextEngine/types';
import type { Studente, Valutazione } from '@/types';

// ── fixtures ──────────────────────────────────────────────────────────────────

function makeStudent(id: string, nome = 'Mario', cognome = 'Rossi'): Studente {
  return { id, nome, cognome, classe: '3A' };
}

function makeEval(
  studenteId: string,
  voto: string,
  materia = 'Matematica',
  data = '2026-02-01',
): Valutazione {
  return {
    id: `eval-${studenteId}-${data}`,
    studenteId,
    materia,
    data,
    tipo: 'Scritto',
    voto,
  };
}

function makeSuggestion(
  type: AISuggestion['type'],
  studentId: string,
  overrides: Partial<AISuggestion> = {},
): AISuggestion {
  return {
    id: `sug-${studentId}-${type}`,
    type,
    studentId,
    message: `Test: ${type} for ${studentId}`,
    confidence: 0.9,
    ...overrides,
  };
}

// ── empty input ───────────────────────────────────────────────────────────────

describe('generateCommunications — empty inputs', () => {
  it('returns empty array when no suggestions', () => {
    expect(generateCommunications([], [], [])).toEqual([]);
  });

  it('returns empty array when suggestions have no matching students', () => {
    const sug = makeSuggestion('student_at_risk', 'ghost-id');
    const result = generateCommunications([sug], [], []);
    expect(result).toEqual([]);
  });
});

// ── student_at_risk ───────────────────────────────────────────────────────────

describe('generateCommunications — student_at_risk', () => {
  const student = makeStudent('s1', 'Marco', 'Bianchi');
  const evals: Valutazione[] = [
    makeEval('s1', '4', 'Matematica'),
    makeEval('s1', '4.5', 'Italiano'),
  ];
  const suggestions = [makeSuggestion('student_at_risk', 's1')];

  let msgs: GeneratedMessage[];
  beforeEach(() => {
    msgs = generateCommunications(suggestions, [student], evals);
  });

  it('generates exactly 2 messages (parent + student)', () => {
    expect(msgs).toHaveLength(2);
  });

  it('one message targets parent, one targets student', () => {
    const targets = msgs.map((m) => m.target).sort();
    expect(targets).toEqual(['parent', 'student']);
  });

  it('parent message uses recovery_parent template', () => {
    const parentMsg = msgs.find((m) => m.target === 'parent')!;
    expect(parentMsg.template).toBe('recovery_parent');
  });

  it('student message uses recovery_student template', () => {
    const studentMsg = msgs.find((m) => m.target === 'student')!;
    expect(studentMsg.template).toBe('recovery_student');
  });

  it('messages carry correct studentId and studentName', () => {
    for (const msg of msgs) {
      expect(msg.studentId).toBe('s1');
      expect(msg.studentName).toContain('Bianchi');
    }
  });

  it('parent message subject contains student name', () => {
    const parentMsg = msgs.find((m) => m.target === 'parent')!;
    expect(parentMsg.subject).toContain('Bianchi');
  });

  it('parent message body mentions at least one subject', () => {
    const parentMsg = msgs.find((m) => m.target === 'parent')!;
    // body should mention Matematica or Italiano
    expect(parentMsg.body).toMatch(/Matematica|Italiano/);
  });

  it('messages have unique ids within the same collection', () => {
    const ids = msgs.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

// ── student_excellence ────────────────────────────────────────────────────────

describe('generateCommunications — student_excellence', () => {
  const student = makeStudent('s2', 'Anna', 'Ferrari');
  const evals: Valutazione[] = [
    makeEval('s2', '9', 'Matematica'),
    makeEval('s2', '9.5', 'Fisica'),
  ];
  const suggestions = [makeSuggestion('student_excellence', 's2')];

  let msgs: GeneratedMessage[];
  beforeEach(() => {
    msgs = generateCommunications(suggestions, [student], evals);
  });

  it('generates 2 messages for excellence', () => {
    expect(msgs).toHaveLength(2);
  });

  it('parent message template is excellence_parent', () => {
    const m = msgs.find((m) => m.target === 'parent')!;
    expect(m.template).toBe('excellence_parent');
    expect(m.templateLabel).toContain('Eccellenza');
  });

  it('student message template is excellence_student', () => {
    const m = msgs.find((m) => m.target === 'student')!;
    expect(m.template).toBe('excellence_student');
  });

  it('body of excellence parent message has positive tone', () => {
    const m = msgs.find((m) => m.target === 'parent')!;
    // Should mention excellent performance
    expect(m.body.toLowerCase()).toMatch(/eccel|ottim|risultat/);
  });
});

// ── missing_assessment ────────────────────────────────────────────────────────

describe('generateCommunications — missing_assessment', () => {
  const student = makeStudent('s3', 'Luca', 'Verdi');
  const suggestions = [makeSuggestion('missing_assessment', 's3')];

  let msgs: GeneratedMessage[];
  beforeEach(() => {
    msgs = generateCommunications(suggestions, [student], []);
  });

  it('generates exactly 1 message (parent only)', () => {
    expect(msgs).toHaveLength(1);
  });

  it('targets parent', () => {
    expect(msgs[0].target).toBe('parent');
  });

  it('uses missing_assessment_parent template', () => {
    expect(msgs[0].template).toBe('missing_assessment_parent');
  });

  it('subject mentions assessment', () => {
    // "valutazion" matches both singular (valutazione) and plural (valutazioni)
    expect(msgs[0].subject.toLowerCase()).toMatch(/valutazion|verifica|voto/);
  });
});

// ── learning_gap ──────────────────────────────────────────────────────────────

describe('generateCommunications — learning_gap (no messages)', () => {
  it('does not generate messages for learning_gap suggestions', () => {
    const student = makeStudent('s4');
    const sug = makeSuggestion('learning_gap', 's4');
    const result = generateCommunications([sug], [student], []);
    expect(result).toHaveLength(0);
  });
});

// ── multiple students ─────────────────────────────────────────────────────────

describe('generateCommunications — multiple students', () => {
  it('generates messages for all qualifying students', () => {
    const s1 = makeStudent('a1', 'Alice', 'A');
    const s2 = makeStudent('a2', 'Bob', 'B');
    const s3 = makeStudent('a3', 'Carol', 'C');

    const suggestions: AISuggestion[] = [
      makeSuggestion('student_at_risk', 'a1'),
      makeSuggestion('student_excellence', 'a2'),
      makeSuggestion('missing_assessment', 'a3'),
    ];
    const evals: Valutazione[] = [
      makeEval('a1', '4', 'Mat'),
      makeEval('a2', '9', 'Fis'),
    ];

    const msgs = generateCommunications(suggestions, [s1, s2, s3], evals);
    // a1: 2 (parent+student), a2: 2 (parent+student), a3: 1 (parent)
    expect(msgs).toHaveLength(5);

    const studentIds = [...new Set(msgs.map((m) => m.studentId))];
    expect(studentIds).toHaveLength(3);
  });

  it('all generated message ids are unique across all students', () => {
    const students = [makeStudent('x1'), makeStudent('x2')];
    const suggestions: AISuggestion[] = [
      makeSuggestion('student_at_risk', 'x1'),
      makeSuggestion('student_excellence', 'x2'),
    ];
    const msgs = generateCommunications(suggestions, students, []);
    const ids = msgs.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

// ── message structure invariants ─────────────────────────────────────────────

describe('generateCommunications — structural invariants', () => {
  it('every message has non-empty subject and body', () => {
    const student = makeStudent('inv1');
    const sug = makeSuggestion('student_at_risk', 'inv1');
    const msgs = generateCommunications([sug], [student], []);
    for (const msg of msgs) {
      expect(msg.subject.length).toBeGreaterThan(0);
      expect(msg.body.length).toBeGreaterThan(10);
      expect(msg.templateLabel.length).toBeGreaterThan(0);
    }
  });

  it('body always includes a salutation or greeting', () => {
    const student = makeStudent('inv2', 'Sara', 'Neri');
    const sug = makeSuggestion('student_at_risk', 'inv2');
    const msgs = generateCommunications([sug], [student], []);
    for (const msg of msgs) {
      // Italian: "Gentile" for parents, direct address for students
      expect(msg.body).toMatch(/Gentile|Ciao|Salve|cara|caro/i);
    }
  });
});
