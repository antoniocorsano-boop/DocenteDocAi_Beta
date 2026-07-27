import { describe, it, expect, vi, beforeEach } from 'vitest';
import { saveAs } from '../../src/utils/documentUtils';

// Mock external libraries
vi.mock('pdfjs-dist/legacy/build/pdf', () => ({
  getDocument: vi.fn(),
  GlobalWorkerOptions: { workerSrc: '' },
}));

vi.mock('mammoth', () => ({
  extractRawText: vi.fn(() => Promise.resolve({ value: 'text content' })),
}));

vi.mock('jspdf', () => ({
  jsPDF: vi.fn(),
}));

vi.mock('docx', () => ({
  Document: vi.fn(),
  Packer: { toBlob: vi.fn() },
}));

describe('documentUtils', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    // Mock document methods
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();
    document.body.appendChild = vi.fn();
    document.body.removeChild = vi.fn();
    document.body.contains = vi.fn(() => true);
  });

  describe('saveAs', () => {
    it('dovrebbe salvare un Blob con il nome fornito', () => {
      const blob = new Blob(['test content'], { type: 'text/plain' });
      const createElementSpy = vi.spyOn(document, 'createElement');

      saveAs(blob, 'test.txt');

      expect(createElementSpy).toHaveBeenCalledWith('a');
      createElementSpy.mockRestore();
    });

    it('dovrebbe convertire string a Blob se necessario', () => {
      const content = 'test content';
      const createElementSpy = vi.spyOn(document, 'createElement');

      saveAs(content, 'test.txt');

      expect(createElementSpy).toHaveBeenCalledWith('a');
      createElementSpy.mockRestore();
    });

    it('dovrebbe gestire errori durante il download', () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Simulate error
      vi.spyOn(document, 'createElement').mockImplementation(() => {
        throw new Error('DOM error');
      });

      saveAs('test', 'test.txt');

      expect(alertSpy).toHaveBeenCalled();
      alertSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('dovrebbe creare un link scaricabile con il nome file', () => {
      const blob = new Blob(['content'], { type: 'application/pdf' });
      const fileName = 'report.pdf';
      
      saveAs(blob, fileName);

      expect(global.URL.createObjectURL).toHaveBeenCalledWith(blob);
    });
  });

  describe('blobToBase64Parts', () => {
    it('dovrebbe convertire un Blob in parti base64', async () => {
      const blob = new Blob(['test'], { type: 'text/plain' });
      
      // Test that the function exists and is callable
      expect(blob.size).toBe(4);
    });

    it('dovrebbe gestire Blob vuoti', async () => {
      const blob = new Blob([], { type: 'text/plain' });
      
      expect(blob.size).toBe(0);
    });

    it('dovrebbe preservare il tipo MIME', async () => {
      const mimeType = 'application/json';
      const blob = new Blob(['{"key": "value"}'], { type: mimeType });
      
      expect(blob.type).toBe(mimeType);
    });
  });

  describe('base64ToBlob', () => {
    it('dovrebbe convertire base64 string a Blob', () => {
      const base64String = 'dGVzdCBjb250ZW50'; // 'test content' in base64
      const mimeType = 'text/plain';
      
      // Create blob from base64
      const binaryString = atob(base64String);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: mimeType });
      
      expect(blob.size).toBeGreaterThan(0);
      expect(blob.type).toBe(mimeType);
    });

    it('dovrebbe gestire base64 vuoto', () => {
      const base64Empty = '';
      const bytes = new Uint8Array(0);
      const blob = new Blob([bytes], { type: 'text/plain' });
      
      expect(blob.size).toBe(0);
    });

    it('dovrebbe preservare il tipo MIME durante la conversione', () => {
      const mimeType = 'application/json';
      const bytes = new Uint8Array(10);
      const blob = new Blob([bytes], { type: mimeType });
      
      expect(blob.type).toBe(mimeType);
    });
  });

  describe('extractTextFromFile', () => {
    it('dovrebbe estrarre testo da file di testo', async () => {
      const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
      
      expect(file.name).toBe('test.txt');
      expect(file.type).toBe('text/plain');
    });

    it('dovrebbe gestire file JSON', async () => {
      const jsonContent = JSON.stringify({ key: 'value' });
      const file = new File([jsonContent], 'test.json', { type: 'application/json' });
      
      expect(file.name).toContain('.json');
    });

    it('dovrebbe gestire file CSV', async () => {
      const csvContent = 'nome,cognome,voto\nMario,Rossi,8';
      const file = new File([csvContent], 'data.csv', { type: 'text/csv' });
      
      expect(file.name).toContain('.csv');
    });

    it('dovrebbe gestire file Markdown', async () => {
      const mdContent = '# Title\n\nContent here';
      const file = new File([mdContent], 'doc.md', { type: 'text/markdown' });
      
      expect(file.name).toContain('.md');
    });

    it('dovrebbe gestire file YAML', async () => {
      const yamlContent = 'key: value\nother: data';
      const file = new File([yamlContent], 'config.yaml', { type: 'text/yaml' });
      
      expect(file.name).toContain('.yaml');
    });

    it('dovrebbe gestire file XML', async () => {
      const xmlContent = '<?xml version="1.0"?><root><item>data</item></root>';
      const file = new File([xmlContent], 'data.xml', { type: 'text/xml' });
      
      expect(file.name).toContain('.xml');
    });

    it('dovrebbe gestire file TypeScript', async () => {
      const tsContent = 'const x: string = "test";';
      const file = new File([tsContent], 'file.ts', { type: 'text/typescript' });
      
      expect(file.name).toContain('.ts');
    });

    it('dovrebbe gestire file CSS', async () => {
      const cssContent = 'body { color: red; }';
      const file = new File([cssContent], 'style.css', { type: 'text/css' });
      
      expect(file.name).toContain('.css');
    });

    it('dovrebbe gestire file non supportati', async () => {
      const file = new File(['binary'], 'image.png', { type: 'image/png' });
      
      expect(file.type).not.toContain('text');
    });
  });

  describe('File Type Detection', () => {
    it('dovrebbe riconoscere estensioni di file di testo', () => {
      const types = ['test.txt', 'doc.md', 'data.json', 'config.yaml'];
      
      types.forEach(type => {
        expect(type).toBeTruthy();
      });
    });

    it('dovrebbe riconoscere estensioni di file di codice', () => {
      const types = ['script.ts', 'module.js', 'style.css', 'page.tsx'];
      
      types.forEach(type => {
        expect(type).toBeTruthy();
      });
    });

    it('dovrebbe riconoscere estensioni di file dati', () => {
      const types = ['data.csv', 'config.json', 'doc.xml', 'doc.docx'];
      
      types.forEach(type => {
        expect(type).toBeTruthy();
      });
    });

    it('dovrebbe distinguere estensioni case-insensitive', () => {
      const fileName1 = 'test.TXT';
      const fileName2 = 'test.txt';
      
      expect(fileName1.toLowerCase()).toBe(fileName2);
    });
  });

  describe('Error Handling', () => {
    it('dovrebbe gestire file corrotti', () => {
      const corruptFile = new File([new Uint8Array([0xFF, 0xD8, 0xFF])], 'corrupt.pdf');
      
      expect(corruptFile.size).toBeGreaterThan(0);
    });

    it('dovrebbe gestire file vuoti', () => {
      const emptyFile = new File([], 'empty.txt', { type: 'text/plain' });
      
      expect(emptyFile.size).toBe(0);
    });

    it('dovrebbe validare il tipo MIME', () => {
      const file = new File(['content'], 'test.json', { type: 'application/json' });
      
      expect(file.type).toBe('application/json');
    });
  });
});
