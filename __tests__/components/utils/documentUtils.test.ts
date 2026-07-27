
// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  generateHtmlDocxBlob, 
  extractTextFromFile, 
  saveAs, 
  blobToBase64Parts, 
  base64ToBlob, 
  viewPdfInNewTab,
} from '../../../src/utils/documentUtils';
import {
  printHomeworkSheet, printLessonDocument, printStudentProfile,
  printCertificazioneCompetenze, printUdaDocument, printCouncilData,
  printCouncilTable, printPdfBrochure, printFullAppGuide,
} from '../../../src/utils/printUtils';
import * as docx from 'docx';
import mammoth from 'mammoth';

// Mock delle dipendenze esterne
vi.mock('docx', () => ({
  Document: vi.fn(),
  Packer: {
    toBlob: vi.fn(() => Promise.resolve(new Blob(['docx content'], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }))),
  },
  Paragraph: vi.fn(),
  TextRun: vi.fn(),
  HeadingLevel: { TITLE: 'title', HEADING_1: 'heading1', HEADING_2: 'heading2' },
  AlignmentType: { CENTER: 'center' },
}));

vi.mock('mammoth', () => ({
  default: {
    extractRawText: vi.fn(),
  }
}));

// Mock FileReader
class MockFileReader {
  onloadend: any;
  onerror: any;
  result: string = '';
  readAsDataURL(blob: Blob) {
    setTimeout(() => {
      if (this.onerror && blob.size === 0) {
        this.onerror(new Error('Read error'));
      } else if (this.onloadend) {
        this.result = 'data:text/plain;base64,dGVzdA==';
        this.onloadend();
      }
    }, 0);
  }
}
vi.stubGlobal('FileReader', MockFileReader);

// pdfjs-dist is now loaded from CDN; stub window.pdfjsLib + data-pdfjs-cdn script in beforeEach
const mockPdfJsLib = {
  getDocument: vi.fn(() => ({
    promise: Promise.resolve({
      numPages: 1,
      getPage: vi.fn(() => Promise.resolve({
        getTextContent: vi.fn(() => Promise.resolve({
          items: [{ str: 'testo pdf' }]
        }))
      }))
    })
  })),
  GlobalWorkerOptions: { workerSrc: '' },
};

describe('documentUtils', () => {
  
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock browser APIs
    global.URL.createObjectURL = vi.fn(() => 'mock-url');
    global.URL.revokeObjectURL = vi.fn();
    const mockWin = { document: { write: vi.fn(), close: vi.fn() }, print: vi.fn(), close: vi.fn() };
    global.open = vi.fn(() => mockWin);
    global.Node = {
      ELEMENT_NODE: 1,
      TEXT_NODE: 3
    } as any;

    // Set up window.pdfjsLib so getPdfJs() CDN loader resolves immediately via early-return path
    (window as any).pdfjsLib = mockPdfJsLib;
    // Inject the sentinel script tag so getPdfJs() takes the early-return branch
    if (!document.querySelector('script[data-pdfjs-cdn]')) {
      const s = document.createElement('script');
      s.setAttribute('data-pdfjs-cdn', '');
      document.head.appendChild(s);
    }
  });

  describe('saveAs', () => {
    it('dovrebbe creare un elemento <a> e simulare il click', () => {
      vi.useFakeTimers();
      const mockAnchor = {
        style: {},
        href: '',
        download: '',
        click: vi.fn(),
      };
      vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor as any);
      vi.spyOn(document.body, 'appendChild').mockImplementation(() => {});
      vi.spyOn(document.body, 'removeChild').mockImplementation(() => {});
      vi.spyOn(document.body, 'contains').mockReturnValue(true);

      saveAs(new Blob(['test']), 'test.txt');

      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(mockAnchor.download).toBe('test.txt');
      expect(mockAnchor.click).toHaveBeenCalled();
      
      vi.advanceTimersByTime(100);
      expect(global.URL.revokeObjectURL).toHaveBeenCalled();
      vi.useRealTimers();
    });

    it('dovrebbe gestire errori e mostrare alert', () => {
      vi.spyOn(document, 'createElement').mockImplementation(() => { throw new Error('Fail'); });
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      
      saveAs('test', 'test.txt');
      expect(alertSpy).toHaveBeenCalled();
    });
  });

  describe('blobToBase64Parts', () => {
    it('dovrebbe convertire un blob in base64', async () => {
      const blob = new Blob(['test'], { type: 'text/plain' });
      const result = await blobToBase64Parts(blob);
      expect(result.mimeType).toBe('text/plain');
      expect(result.data).toBe('dGVzdA==');
    });

    it('dovrebbe gestire errori del FileReader', async () => {
      const blob = new Blob([], { type: 'text/plain' }); // Empty blob to trigger error in mock
      await expect(blobToBase64Parts(blob)).rejects.toThrow('Read error');
    });

    it('dovrebbe gestire risultati malformati', async () => {
      const blob = new Blob(['test']);
      // Temporarily override FileReader for this test
      const MalformedFileReader = class extends MockFileReader {
        readAsDataURL() {
          this.result = 'invalid';
          setTimeout(() => this.onloadend(), 0);
        }
      };
      vi.stubGlobal('FileReader', MalformedFileReader);
      
      await expect(blobToBase64Parts(blob)).rejects.toThrow('File error');
      vi.stubGlobal('FileReader', MockFileReader);
    });
  });

  describe('base64ToBlob', () => {
    it('dovrebbe convertire base64 in Blob', () => {
      const base64 = btoa('test content');
      const blob = base64ToBlob(base64, 'text/plain');
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('text/plain');
    });
  });

  describe('viewPdfInNewTab', () => {
    it('dovrebbe aprire il PDF in un nuovo tab', () => {
      vi.useFakeTimers();
      const blob = new Blob(['pdf'], { type: 'application/pdf' });
      viewPdfInNewTab(blob);
      expect(global.open).toHaveBeenCalledWith('mock-url', '_blank');
      vi.advanceTimersByTime(60000);
      expect(global.URL.revokeObjectURL).toHaveBeenCalled();
      vi.useRealTimers();
    });
  });

  describe('generateHtmlDocxBlob', () => {
    it('dovrebbe generare un Blob DOCX da HTML semplice', async () => {
      const htmlContent = '<h1>Titolo</h1><p>Paragrafo</p>';
      const title = 'Test Doc';
      
      const blob = await generateHtmlDocxBlob(htmlContent, title);
      
      expect(docx.Document).toHaveBeenCalled();
      expect(docx.Packer.toBlob).toHaveBeenCalled();
      expect(blob).toBeInstanceOf(Blob);
    });

    it('dovrebbe gestire tag strong e em', async () => {
      const htmlContent = '<p><strong>Bold</strong> <em>Italic</em></p>';
      await generateHtmlDocxBlob(htmlContent);
      expect(docx.TextRun).toHaveBeenCalledWith(expect.objectContaining({ bold: true }));
      expect(docx.TextRun).toHaveBeenCalledWith(expect.objectContaining({ italics: true }));
    });

    it('dovrebbe gestire tag b, i e br', async () => {
      const htmlContent = '<p><b>Bold</b> <i>Italic</i><br/></p>';
      await generateHtmlDocxBlob(htmlContent);
      expect(docx.TextRun).toHaveBeenCalledWith(expect.objectContaining({ bold: true }));
      expect(docx.TextRun).toHaveBeenCalledWith(expect.objectContaining({ italics: true }));
      expect(docx.TextRun).toHaveBeenCalledWith(expect.objectContaining({ text: "\n" }));
    });

    it('dovrebbe gestire vari tag HTML (h1, h2, h3, div, b, i, br)', async () => {
      const html = '<h1>H1</h1><h2>H2</h2><h3>H3</h3><div>Div</div><b>Bold</b><i>Italic</i><br/>';
      const blob = await generateHtmlDocxBlob(html);
      expect(blob).toBeInstanceOf(Blob);
    });

    it('dovrebbe gestire liste ul e ol', async () => {
      const htmlContent = '<ul><li>Item 1</li></ul><ol><li>Item A</li></ol>';
      await generateHtmlDocxBlob(htmlContent);
      expect(docx.Paragraph).toHaveBeenCalled();
    });

    it('dovrebbe gestire elementi annidati non supportati direttamente', async () => {
      const htmlContent = '<span><p>Nested</p></span>';
      await generateHtmlDocxBlob(htmlContent);
      expect(docx.Paragraph).toHaveBeenCalled();
    });

    it('dovrebbe gestire tag non supportati in extractTextRuns', async () => {
      const htmlContent = '<p><span>Unsupported</span></p>';
      await generateHtmlDocxBlob(htmlContent);
      expect(docx.TextRun).toHaveBeenCalled();
    });

    it('dovrebbe gestire errori nella generazione DOCX', async () => {
      vi.mocked(docx.Packer.toBlob).mockRejectedValue(new Error('Packer error'));
      const blob = await generateHtmlDocxBlob('<p>test</p>');
      expect(blob.type).toBe('text/plain');
    });

    it('dovrebbe lanciare errore se document non è definito', async () => {
      const originalDocument = global.document;
      // @ts-ignore
      delete global.document;
      const blob = await generateHtmlDocxBlob('<p>test</p>');
      expect(blob.type).toBe('text/plain');
      global.document = originalDocument;
    });
  });

  describe('extractTextFromFile', () => {
    it('dovrebbe estrarre testo da un file .txt', async () => {
      const mockFile = {
        name: 'test.txt',
        type: 'text/plain',
        text: vi.fn().mockResolvedValue('contenuto testo'),
      };
      const text = await extractTextFromFile(mockFile as any);
      expect(text).toBe('contenuto testo');
    });

    it('dovrebbe usare mammoth per file .docx', async () => {
      const mockFile = {
        name: 'test.docx',
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(10)),
      };
      (mammoth.extractRawText as vi.Mock).mockResolvedValue({ value: 'Testo estratto da DOCX' });
      
      const text = await extractTextFromFile(mockFile as any);
      expect(mammoth.extractRawText).toHaveBeenCalled();
      expect(text).toBe('Testo estratto da DOCX');
    });

    it('dovrebbe usare pdfjs per file .pdf', async () => {
      const mockFile = {
        name: 'test.pdf',
        type: 'application/pdf',
        arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(10)),
      };
      const text = await extractTextFromFile(mockFile as any);
      console.log('EXTRACTED TEXT:', JSON.stringify(text));
      expect(typeof text).toBe('string');
      expect(text).toMatch(/testo pdf/);
    });

    it('dovrebbe tentare lettura testo per file piccoli sconosciuti', async () => {
      const mockFile = {
        name: 'test.unknown',
        type: 'application/octet-stream',
        size: 100,
        text: vi.fn().mockResolvedValue('testo fallback'),
      };
      const text = await extractTextFromFile(mockFile as any);
      expect(text).toBe('testo fallback');
    });

    it('dovrebbe lanciare errore per tipi non supportati', async () => {
      const mockFile = {
        name: 'test.exe',
        type: 'application/x-msdownload',
        size: 3 * 1024 * 1024
      };
      await expect(extractTextFromFile(mockFile as any)).rejects.toThrow(/file non supportato/i);
    });
  });

  describe('printHomeworkSheet', () => {
    it('dovrebbe aprire una finestra di stampa per i compiti', () => {
      const lesson = {
        id: 'l1', classe: '1A', materia: 'Matematica',
        contenuto: 'Equazioni', compiti: 'Esercizi 1-10',
        obiettivi: 'Capire le equazioni',
        materialiDidattici: [{ id: 'm1', label: 'Libro', type: 'file' }]
      };
      const settings = { nomeIstituto: 'Scuola Test', nomeInsegnante: 'Prof. Rossi' };
      printHomeworkSheet(lesson as any, settings as any);
      expect(global.open).toHaveBeenCalledWith('', '_blank');
    });

    it('dovrebbe gestire compiti mancanti', () => {
      const lesson = { id: 'l2', classe: '1A', materia: 'Matematica', contenuto: 'Equazioni', compiti: '' };
      printHomeworkSheet(lesson as any, {} as any);
      expect(global.open).toHaveBeenCalled();
    });
  });

  describe('printCertificazioneCompetenze', () => {
    it('dovrebbe aprire una finestra di stampa per la certificazione competenze', () => {
      const student = { id: 's1', nome: 'Mario', cognome: 'Rossi', classe: '1A' };
      const competencyData = [{ competencyName: 'Comp 1', level: 'A' }];
      const settings = { annoScolasticoCorrente: '2023/24' };
      printCertificazioneCompetenze(student as any, competencyData, settings as any);
      expect(global.open).toHaveBeenCalledWith('', '_blank');
    });
  });

  describe('printUdaDocument', () => {
    it('dovrebbe aprire una finestra di stampa per UDA (docente)', () => {
      const uda = {
        id: 'u1', title: 'Test UDA', classe: '1A', materia: 'Italiano',
        introduction: 'Intro', finalProduct: 'Prodotto', competencyIds: ['c1'],
        phases: [{ id: 'p1', title: 'Fase 1', duration: '1h', description: 'Desc', activities: 'Att' }],
        evaluation: 'Val', tools: 'Strumenti', startPos: 0, width: 100, color: '', borderColor: '', textColor: ''
      };
      const competenze = [{ id: 'c1', nome: 'Comp 1', codice: 'C1', livelli: [] }];
      const settings = { nomeIstituto: 'Scuola', nomeInsegnante: 'Docente' };
      printUdaDocument(uda as any, competenze as any, settings as any, 'docente');
      expect(global.open).toHaveBeenCalledWith('', '_blank');
    });

    it('dovrebbe aprire una finestra di stampa per UDA (studente)', () => {
      const uda = {
        id: 'u2', title: 'Test UDA', classe: '1A', materia: 'Italiano',
        introduction: 'Intro', finalProduct: 'Prodotto', competencyIds: [],
        phases: [], evaluation: 'Val', tools: 'Strumenti',
        startPos: 0, width: 100, color: '', borderColor: '', textColor: ''
      };
      printUdaDocument(uda as any, [], {} as any, 'studente');
      expect(global.open).toHaveBeenCalled();
    });
  });

  describe('printLessonDocument', () => {
    it('dovrebbe aprire una finestra di stampa per la lezione', () => {
      const lesson = {
        id: 'l1', classe: '1A', materia: 'Italiano',
        contenuto: 'Argomento', obiettivi: 'Obiettivi',
        compiti: 'Compiti', nota: 'Nota'
      };
      printLessonDocument(lesson as any);
      expect(global.open).toHaveBeenCalledWith('', '_blank');
    });
  });

  describe('printStudentProfile', () => {
    it('dovrebbe aprire una finestra di stampa per il profilo studente', () => {
      const student = { id: 's1', nome: 'Mario', cognome: 'Rossi', classe: '1A' };
      const evaluations = [{ id: 'e1', studenteId: 's1', materia: 'Italiano', data: '2023-10-10', tipo: 'Scritto', voto: '8' }];
      const competencyEvaluations = [{ id: 'ce1', studenteId: 's1', competenzaId: 'c1', livelloId: 'A', materia: 'Italiano', data: '2023-10-10' }];
      printStudentProfile(student as any, evaluations as any, competencyEvaluations as any, {} as any);
      expect(global.open).toHaveBeenCalledWith('', '_blank');
    });
  });

  describe('printPdfBrochure', () => {
    it('dovrebbe aprire una finestra di stampa per la brochure', () => {
      const content = {
        brochureTitle: 'Brochure', introduction: 'Desc',
        useCases: [{ title: 'Sezione', benefits: ['Item 1'] }],
        technicalGuarantees: { title: 'Tech', content: 'Content' },
        roadmap: { title: 'Roadmap', items: [{ title: 'Step 1', description: 'Desc' }] },
        callToAction: 'CTA'
      };
      printPdfBrochure(content as any);
      expect(global.open).toHaveBeenCalledWith('', '_blank');
    });
  });

  describe('printCouncilData', () => {
    it('dovrebbe aprire una finestra di stampa per i dati del consiglio', () => {
      const students = [{ id: 's1', nome: 'Mario', cognome: 'Rossi', classe: '1A' }];
      const evaluations = [{ id: 'e1', studenteId: 's1', materia: 'Italiano', data: '2023-10-10', tipo: 'Scritto', voto: '8' }];
      printCouncilData('1A', 'Primo Trimestre' as any, students as any, evaluations as any, [], {} as any);
      expect(global.open).toHaveBeenCalledWith('', '_blank');
    });
  });

  describe('printCouncilTable', () => {
    it('dovrebbe aprire una finestra di stampa per il tabellone dello scrutinio', () => {
      const students = [
        { id: 's1', nome: 'Mario', cognome: 'Rossi', classe: '1A' },
        { id: 's2', nome: 'Luigi', cognome: 'Verdi', classe: '1A' }
      ];
      const evaluations = [
        { id: 'e1', studenteId: 's1', materia: 'Italiano', data: '2023-10-10', tipo: 'Scritto', voto: '8' },
        { id: 'e2', studenteId: 's2', materia: 'Matematica', data: '2023-10-10', tipo: 'Scritto', voto: '7' }
      ];
      printCouncilTable('1A', 'Primo Trimestre' as any, '2023/24', students as any, evaluations as any, {}, {} as any, true);
      expect(global.open).toHaveBeenCalledWith('', '_blank');
    });

    it('dovrebbe gestire studente senza valutazioni', () => {
      const students = [{ id: 's3', nome: 'Anna', cognome: 'Bianchi', classe: '1A' }];
      printCouncilTable('1A', 'Primo Trimestre' as any, '2023/24', students as any, [], {}, {} as any, true);
      expect(global.open).toHaveBeenCalledWith('', '_blank');
    });
  });

  describe('printFullAppGuide', () => {
    it('dovrebbe aprire una finestra di stampa per la guida completa', () => {
      const essay = { title: 'Titolo', content: 'Contenuto' };
      const faqs = [{ q: 'Q', a: 'A' }];
      const specs = { title: 'Specs', specs: ['I1'] };
      const vocal = { title: 'Vocal', sections: [{ title: 'S1', commands: ['C1'] }] };
      printFullAppGuide(essay as any, faqs as any, specs as any, {} as any, vocal as any);
      expect(global.open).toHaveBeenCalledWith('', '_blank');
    });

    it('dovrebbe gestire essayContent nullo', () => {
      const specs = { title: 'Specs', specs: [] };
      const vocal = { title: 'Vocal', sections: [] };
      printFullAppGuide(null as any, [], specs as any, {} as any, vocal as any);
      expect(global.open).toHaveBeenCalled();
    });
  });
});

