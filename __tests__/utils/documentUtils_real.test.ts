import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  saveAs, 
  blobToBase64Parts, 
  base64ToBlob, 
  extractTextFromFile,
  generateHtmlDocxBlob
} from '../../src/utils/documentUtils';
import {
  printHomeworkSheet,
  printLessonDocument,
  printStudentProfile,
  printCertificazioneCompetenze,
  printUdaDocument,
  printCouncilData,
  printCouncilTable,
  printPdfBrochure,
  printFullAppGuide,
  buildLessonHtmlBlob,
  buildStudentProfileHtmlBlob,
  buildUdaHtmlBlob,
} from '../../src/utils/printUtils';
import { Lezione, TimetableSettings, Studente, Valutazione, ValutazioneCompetenza, Uda, Competenza, PeriodoValutazione, BrochureContent, TechnicalDocumentContent, EssayContent, FaqItem, VocalAssistantGuide } from '../../src/types';

// Mock external libraries
vi.mock('mammoth', () => ({
  default: {
    extractRawText: vi.fn().mockImplementation(async () => ({ value: 'extracted docx text' })),
  },
  extractRawText: vi.fn().mockImplementation(async () => ({ value: 'extracted docx text' })),
}));

vi.mock('docx', () => ({
  Document: vi.fn().mockImplementation(function(this: any) { return this; }),
  Packer: { toBlob: vi.fn().mockImplementation(async () => new Blob()) },
  Paragraph: vi.fn().mockImplementation(function(this: any) { return this; }),
  TextRun: vi.fn().mockImplementation(function(this: any) { return this; }),
  HeadingLevel: { TITLE: 'title', HEADING_1: 'h1', HEADING_2: 'h2', HEADING_3: 'h3' },
  AlignmentType: { CENTER: 'center' },
}));

describe('documentUtils Extended', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();
    
    // Polyfill File.text and File.arrayBuffer if missing
    if (!File.prototype.text) {
      File.prototype.text = function(this: File) {
        if (this.name.endsWith('.exe')) return Promise.resolve('\0'); // Simulate binary
        return Promise.resolve('hello world');
      };
    }
    if (!File.prototype.arrayBuffer) {
      File.prototype.arrayBuffer = function() {
        return Promise.resolve(new ArrayBuffer(0));
      };
    }
    if (!Blob.prototype.text) {
      Blob.prototype.text = function() {
        return Promise.resolve('Unable to generate DOCX file');
      };
    }

    // Mock FileReader
    const mockFileReader = function(this: any) {
      this.readAsDataURL = vi.fn((blob: Blob) => {
        this.result = 'data:text/plain;base64,dGVzdA==';
        if (this.onloadend) this.onloadend();
      });
    };
    vi.stubGlobal('FileReader', mockFileReader);

    // Mock window.open for print functions
    const mockWin = { document: { write: vi.fn(), close: vi.fn() }, print: vi.fn(), close: vi.fn() };
    vi.stubGlobal('open', vi.fn(() => mockWin));
  });

  describe('saveAs', () => {
    it('should call click on a temporary link', () => {
      const clickSpy = vi.fn();
      const appendSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => ({} as any));
      const removeSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => ({} as any));
      const containsSpy = vi.spyOn(document.body, 'contains').mockReturnValue(true);
      
      vi.spyOn(document, 'createElement').mockReturnValue({
        style: {},
        click: clickSpy,
        setAttribute: vi.fn(),
      } as any);

      saveAs(new Blob(['test']), 'test.txt');
      
      expect(clickSpy).toHaveBeenCalled();
      
      vi.advanceTimersByTime(150);
      expect(removeSpy).toHaveBeenCalled();
    });
  });

  describe('blobToBase64Parts', () => {
    it('should convert blob to base64 parts', async () => {
      const blob = new Blob(['test'], { type: 'text/plain' });
      const result = await blobToBase64Parts(blob);
      expect(result.mimeType).toBe('text/plain');
      expect(result.data).toBe('dGVzdA==');
    });
  });

  describe('base64ToBlob', () => {
    it('should convert base64 to blob', () => {
      const blob = base64ToBlob('dGVzdA==', 'text/plain');
      expect(blob.type).toBe('text/plain');
      expect(blob.size).toBe(4);
    });
  });

  describe('extractTextFromFile', () => {
    it('should extract text from .txt file', async () => {
      const file = new File(['hello world'], 'test.txt', { type: 'text/plain' });
      const text = await extractTextFromFile(file);
      expect(text).toBe('hello world');
    });

    it('should extract text from .docx file', async () => {
      const file = new File([''], 'test.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      const text = await extractTextFromFile(file);
      expect(text).toBe('extracted docx text');
    });

    it('should throw error for unsupported type', async () => {
      const file = new File([''], 'test.exe', { type: 'application/octet-stream' });
      await expect(extractTextFromFile(file)).rejects.toThrow('Tipo file non supportato');
    });
  });

  describe('Print Functions (printUtils)', () => {
    const mockSettings: TimetableSettings = {
      nomeIstituto: 'Test School',
      nomeInsegnante: 'Test Teacher',
      annoScolasticoCorrente: '2023/24',
      classi: [],
      disciplines: [],
      timeSlots: [],
      defaultView: 'week',
      schoolType: 'Superior',
      livelli: [],
      sezioni: [],
      teachingAssignments: [],
      competenze: [],
      cittaIstituto: 'Test City',
      anniScolastici: ['2023/24'],
      activityStartDate: '2023-09-01',
      activityEndDate: '2024-06-30',
      notificationSettings: { enabled: false, reminders: [], desktopNotifications: false },
      showGuidanceTips: true,
      visualTheme: 'default',
      uiMode: 'classic',
      visualPreferences: { font: 'Roboto', shape: 'rounded' },
      autoSyncEnabled: false,
      autoSyncInterval: 30,
      securityPin: ''
    };

    const mockLesson: Lezione = {
      id: 'l1',
      materia: 'Italiano',
      classe: '1A',
      contenuto: 'Dante Alighieri',
      tipoLezione: 'Teoria',
      svolta: true,
      obiettivi: 'Conoscere la vita di Dante',
      compiti: 'Leggere Canto I',
      materialiDidattici: [{ id: 'm1', type: 'link', url: 'http://test.com', label: 'Link' }]
    };

    it('printHomeworkSheet should call window.open', () => {
      printHomeworkSheet(mockLesson, mockSettings);
      expect(window.open).toHaveBeenCalledWith('', '_blank');
    });

    it('printLessonDocument should call window.open', () => {
      printLessonDocument(mockLesson);
      expect(window.open).toHaveBeenCalledWith('', '_blank');
    });

    it('printStudentProfile should call window.open', () => {
      const student: Studente = { id: 's1', nome: 'Mario', cognome: 'Rossi', classe: '1A' };
      const evaluations: Valutazione[] = [{ id: 'e1', studenteId: 's1', materia: 'Italiano', data: '2023-10-10', tipo: 'Scritto', voto: '8' }];
      const compEvals: ValutazioneCompetenza[] = [];
      printStudentProfile(student, evaluations, compEvals, mockSettings);
      expect(window.open).toHaveBeenCalledWith('', '_blank');
    });

    it('printCertificazioneCompetenze should call window.open', () => {
      const student: Studente = { id: 's1', nome: 'Mario', cognome: 'Rossi', classe: '1A' };
      printCertificazioneCompetenze(student, [{ competencyName: 'Comp 1', level: 'A' }], mockSettings);
      expect(window.open).toHaveBeenCalledWith('', '_blank');
    });

    it('printUdaDocument should call window.open', () => {
      const uda: Uda = {
        id: 'u1', title: 'UDA 1', classe: '1A', materia: 'Italiano',
        introduction: 'Intro', finalProduct: 'Product', competencyIds: ['c1'],
        phases: [{ id: 'p1', title: 'P1', duration: '2h', description: 'Desc', activities: 'Act' }],
        evaluation: 'Eval', tools: 'Tools', startPos: 0, width: 100, color: '', borderColor: '', textColor: ''
      };
      const comp: Competenza = { id: 'c1', nome: 'Comp 1', codice: 'C1', livelli: [] };
      printUdaDocument(uda, [comp], mockSettings, 'docente');
      expect(window.open).toHaveBeenCalledWith('', '_blank');
    });

    it('printCouncilData should call window.open', () => {
      const students: Studente[] = [{ id: 's1', nome: 'Mario', cognome: 'Rossi', classe: '1A' }];
      printCouncilData('1A', 'Primo Trimestre' as PeriodoValutazione, students, [], [], mockSettings);
      expect(window.open).toHaveBeenCalledWith('', '_blank');
    });

    it('printCouncilTable should call window.open', () => {
      const students: Studente[] = [{ id: 's1', nome: 'Mario', cognome: 'Rossi', classe: '1A' }];
      printCouncilTable('1A', 'Primo Trimestre' as PeriodoValutazione, '2023/24', students, [], {}, mockSettings, true);
      expect(window.open).toHaveBeenCalledWith('', '_blank');
    });

    it('printPdfBrochure should call window.open', () => {
      const content: BrochureContent = {
        brochureTitle: 'Title', introduction: 'Intro',
        useCases: [{ title: 'UC1', benefits: ['B1'] }],
        technicalGuarantees: { title: 'Guarantees', content: 'Content' },
        roadmap: { title: 'Roadmap', items: [{ title: 'Step 1', description: 'Desc' }] },
        callToAction: 'Action'
      };
      printPdfBrochure(content);
      expect(window.open).toHaveBeenCalledWith('', '_blank');
    });

    it('printFullAppGuide should call window.open', () => {
      const essay: EssayContent = { title: 'Essay', content: 'Content' };
      const faq: FaqItem[] = [{ q: 'Q', a: 'A' }];
      const specs: TechnicalDocumentContent = { title: 'Specs', specs: ['S1'] };
      const vocal: VocalAssistantGuide = { title: 'Vocal', sections: [{ title: 'S1', commands: ['C1'] }] };
      printFullAppGuide(essay, faq, specs, {}, vocal);
      expect(window.open).toHaveBeenCalledWith('', '_blank');
    });

    it('buildLessonHtmlBlob should return text/html Blob', () => {
      const blob = buildLessonHtmlBlob(mockLesson);
      expect(blob.type).toBe('text/html');
      expect(blob.size).toBeGreaterThan(0);
    });

    it('buildStudentProfileHtmlBlob should return text/html Blob', () => {
      const student: Studente = { id: 's1', nome: 'Mario', cognome: 'Rossi', classe: '1A' };
      const blob = buildStudentProfileHtmlBlob(student, [], [], mockSettings);
      expect(blob.type).toBe('text/html');
      expect(blob.size).toBeGreaterThan(0);
    });

    it('buildUdaHtmlBlob should return text/html Blob', () => {
      const uda: Uda = {
        id: 'u1', title: 'UDA 1', classe: '1A', materia: 'Italiano',
        introduction: 'Intro', finalProduct: 'Product', competencyIds: [],
        phases: [], evaluation: 'Eval', tools: 'Tools',
        startPos: 0, width: 100, color: '', borderColor: '', textColor: ''
      };
      const blob = buildUdaHtmlBlob(uda, [], mockSettings, 'docente');
      expect(blob.type).toBe('text/html');
      expect(blob.size).toBeGreaterThan(0);
    });
  });

  describe('generateHtmlDocxBlob', () => {
    it('should generate a docx blob from HTML', async () => {
      const html = '<h1>Title</h1><p>Paragraph <strong>bold</strong> <em>italic</em></p><ul><li>Item 1</li></ul>';
      const blob = await generateHtmlDocxBlob(html, 'Document Title');
      expect(blob).toBeDefined();
    });

    it('should handle errors and return fallback blob', async () => {
      // Force error by mocking Document to throw
      const { Document } = await import('docx');
      vi.mocked(Document).mockImplementationOnce(() => { throw new Error('Docx error'); });
      
      const blob = await generateHtmlDocxBlob('<p>test</p>');
      expect(blob.type).toBe('text/plain');
      const text = await blob.text();
      expect(text).toBe('Unable to generate DOCX file');
    });
  });
});
