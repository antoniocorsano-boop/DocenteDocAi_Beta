import { describe, it, expect } from 'vitest';
import { getDocumentTemplate } from '../../src/utils/templateUtils';

describe('templateUtils', () => {
  const context = {
    teacherName: 'Mario Rossi',
    className: '1A',
    subject: 'Matematica',
    year: '2023/2024',
    students: [{ id: '1', nome: 'Luca', cognome: 'Bianchi', classe: '1A' }],
    uda: [{ id: 'uda-1', title: 'UDA 1', introduction: 'Intro 1' } as any],
    lessons: []
  };

  it('should return planning_doc template', () => {
    const content = getDocumentTemplate('planning_doc', context);
    expect(content).toContain('Progettazione Disciplinare');
    expect(content).toContain('Mario Rossi');
    expect(content).toContain('1A');
    expect(content).toContain('Matematica');
    expect(content).toContain('UDA 1');
  });

  it('should handle planning_doc with missing context data', () => {
    const emptyContext = { teacherName: 'Mario Rossi' };
    const content = getDocumentTemplate('planning_doc', emptyContext as any);
    expect(content).toContain('___');
    expect(content).toContain('Da definire.');
  });

  it('should return council_report template', () => {
    const content = getDocumentTemplate('council_report', context);
    expect(content).toContain('Relazione Finale del Docente');
    expect(content).toContain('1A');
    expect(content).toContain('Matematica');
  });

  it('should return lesson_plan template', () => {
    const content = getDocumentTemplate('lesson_plan', context);
    expect(content).toContain('Piano di Lezione');
    expect(content).toContain(new Date().toLocaleDateString());
  });

  it('should return default template for unknown id', () => {
    const content = getDocumentTemplate('unknown', context);
    expect(content).toContain('Nuovo Documento');
  });
});
