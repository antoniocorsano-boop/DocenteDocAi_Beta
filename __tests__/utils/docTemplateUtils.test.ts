import { describe, it, expect } from 'vitest';
import { markdownToHtml, getDocumentTemplate } from '../../src/utils/docTemplateUtils';

describe('docTemplateUtils', () => {
  describe('markdownToHtml', () => {
    it('should return empty string for empty input', () => {
      expect(markdownToHtml('')).toBe('');
    });

    it('should convert headers', () => {
      expect(markdownToHtml('## Header')).toContain('<h2>Header</h2>');
    });

    it('should convert bold text', () => {
      expect(markdownToHtml('**bold**')).toContain('<strong>bold</strong>');
    });

    it('should convert list items', () => {
      const result = markdownToHtml('* item 1\n- item 2');
      expect(result).toContain('<ul><li>item 1</li><li>item 2</li></ul>');
    });

    it('should wrap plain text in p tags', () => {
      expect(markdownToHtml('plain text')).toBe('<p>plain text</p>');
    });

    it('should handle mixed content', () => {
      const md = '## Title\n**bold**\n* list';
      const html = markdownToHtml(md);
      expect(html).toContain('<h2>Title</h2>');
      expect(html).toContain('<strong>bold</strong>');
      expect(html).toContain('<ul><li>list</li></ul>');
    });
  });

  describe('getDocumentTemplate', () => {
    const context = {
      teacherName: 'Prof. Rossi',
      className: '1A',
      subject: 'Matematica',
      students: [{ id: '1', nome: 'Mario', cognome: 'Rossi', classe: '1A' }] as any,
      uda: [{ title: 'UDA 1', introduction: 'Intro 1' }] as any
    };

    it('should return planning_doc template', () => {
      const html = getDocumentTemplate('planning_doc', context);
      expect(html).toContain('Progettazione Disciplinare');
      expect(html).toContain('Prof. Rossi');
      expect(html).toContain('1A');
      expect(html).toContain('Matematica');
      expect(html).toContain('UDA 1');
    });

    it('should return planning_doc template with default values if context is missing data', () => {
      const html = getDocumentTemplate('planning_doc', { teacherName: 'Prof. Rossi' });
      expect(html).toContain('___');
      expect(html).toContain('Da definire.');
    });

    it('should return council_report template', () => {
      const html = getDocumentTemplate('council_report', context);
      expect(html).toContain('Relazione Finale del Docente');
      expect(html).toContain('1A');
    });

    it('should return lesson_plan template', () => {
      const html = getDocumentTemplate('lesson_plan', context);
      expect(html).toContain('Piano di Lezione');
    });

    it('should return default template for unknown id', () => {
      const html = getDocumentTemplate('unknown', context);
      expect(html).toContain('Nuovo Documento');
    });
  });
});
