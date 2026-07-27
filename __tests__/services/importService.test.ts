import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ImportService } from '../../src/services/importService';
import Papa from 'papaparse';

const xlsxMock = vi.hoisted(() => ({
  rows: [] as Array<{ values: unknown[] }>,
  error: null as Error | null,
}));

vi.mock('exceljs', () => {
  function WorkbookMock(this: any) {
    this.worksheets = [{
      eachRow(cb: (row: { values: unknown[] }, n: number) => void) {
        xlsxMock.rows.forEach((row, i) => cb(row, i + 1));
      }
    }];
    this.xlsx = {
      load: () => (xlsxMock.error ? Promise.reject(xlsxMock.error) : Promise.resolve()),
    };
  }
  return { default: { Workbook: WorkbookMock }, Workbook: WorkbookMock };
});

vi.mock('papaparse', () => ({
  default: {
    parse: vi.fn()
  }
}));

describe('ImportService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    xlsxMock.rows = [];
    xlsxMock.error = null;
    
    // Polyfill File methods if missing
    if (!File.prototype.arrayBuffer) {
      File.prototype.arrayBuffer = function() {
        return Promise.resolve(new ArrayBuffer(0));
      };
    }
    if (!File.prototype.text) {
      File.prototype.text = function() {
        return Promise.resolve('');
      };
    }
    
    // Mock crypto.randomUUID
    vi.stubGlobal('crypto', {
      randomUUID: () => 'test-uuid-' + Math.random().toString(36).substring(2, 9)
    });
  });

  describe('parseFile', () => {
    it('should call parseCSV for .csv files', async () => {
      const file = new File([''], 'test.csv', { type: 'text/csv' });
      const spy = vi.spyOn(ImportService, 'parseCSV').mockResolvedValue({ students: [], evaluations: [], errors: [] });
      await ImportService.parseFile(file);
      expect(spy).toHaveBeenCalledWith(file);
    });

    it('should call parseExcel for .xlsx files', async () => {
      const file = new File([''], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const spy = vi.spyOn(ImportService, 'parseExcel').mockResolvedValue({ students: [], evaluations: [], errors: [] });
      await ImportService.parseFile(file);
      expect(spy).toHaveBeenCalledWith(file);
    });

    it('should call parseJSON for .json files', async () => {
      const file = new File(['{}'], 'test.json', { type: 'application/json' });
      const spy = vi.spyOn(ImportService, 'parseJSON').mockResolvedValue({ students: [], evaluations: [], errors: [] });
      await ImportService.parseFile(file);
      expect(spy).toHaveBeenCalledWith(file);
    });

    it('should return error for unsupported formats', async () => {
      const file = new File([''], 'test.txt', { type: 'text/plain' });
      const result = await ImportService.parseFile(file);
      expect(result.errors[0]).toContain('Formato file .txt non supportato');
    });
  });

  describe('getRawData', () => {
    it('should parse CSV raw data', async () => {
      const file = new File(['cognome,nome\nRossi,Mario'], 'test.csv');
      (Papa.parse as any).mockImplementation((f: any, config: any) => {
        config.complete({
          meta: { fields: ['cognome', 'nome'] },
          data: [{ cognome: 'Rossi', nome: 'Mario' }]
        });
      });

      const result = await ImportService.getRawData(file);
      expect(result.headers).toEqual(['cognome', 'nome']);
      expect(result.data).toHaveLength(1);
    });

    it('should handle CSV parse errors', async () => {
      const file = new File([''], 'test.csv');
      (Papa.parse as any).mockImplementation((f: any, config: any) => {
        config.error(new Error('CSV Error'));
      });

      const result = await ImportService.getRawData(file);
      expect(result.errors).toEqual(['CSV Error']);
    });

    it('should parse Excel raw data', async () => {
      const file = new File([''], 'test.xlsx');
      vi.spyOn(File.prototype, 'arrayBuffer').mockResolvedValue(new ArrayBuffer(0));
      xlsxMock.rows = [
        { values: [undefined, 'cognome', 'nome'] },
        { values: [undefined, 'Rossi', 'Mario'] },
      ];

      const result = await ImportService.getRawData(file);
      expect(result.headers).toEqual(['cognome', 'nome']);
      expect(result.data).toHaveLength(1);
    });

    it('should handle Excel parse errors', async () => {
      const file = new File([''], 'test.xlsx');
      vi.spyOn(File.prototype, 'arrayBuffer').mockRejectedValue(new Error('Excel Error'));

      const result = await ImportService.getRawData(file);
      expect(result.errors).toEqual(['Excel Error']);
    });

    it('should return error for unsupported formats in getRawData', async () => {
      const file = new File([''], 'test.txt');
      const result = await ImportService.getRawData(file);
      expect(result.errors[0]).toContain('Formato non supportato');
    });
  });

  describe('mapRawData', () => {
    it('should map raw data to students', () => {
      const data = [
        { 'Last Name': 'Rossi', 'First Name': 'Mario', 'Class': '1A' },
        { 'Last Name': 'Bianchi', 'First Name': 'Luigi', 'Class': '1A' }
      ];
      const mapping = {
        'cognome': 'Last Name',
        'nome': 'First Name',
        'classe': 'Class'
      };

      const result = ImportService.mapRawData(data, mapping);
      expect(result.students).toHaveLength(2);
      expect(result.students[0].cognome).toBe('Rossi');
      expect(result.students[1].nome).toBe('Luigi');
    });

    it('should skip rows with missing name and surname', () => {
      const data = [{ 'Last Name': '', 'First Name': '', 'Class': '1A' }];
      const mapping = { 'cognome': 'Last Name', 'nome': 'First Name', 'classe': 'Class' };
      const result = ImportService.mapRawData(data, mapping);
      expect(result.students).toHaveLength(0);
    });

    it('should handle missing optional mapping fields in mapRawData', () => {
      const data = [{ 'Last Name': 'Rossi', 'First Name': 'Mario', 'Grade': '8' }];
      const mapping = { 'cognome': 'Last Name', 'nome': 'First Name', 'voto': 'Grade' };
      // mapping['data'] is missing
      const result = ImportService.mapRawData(data, mapping);
      expect(result.evaluations).toHaveLength(1);
      expect(result.evaluations[0].data).toBe(new Date().toISOString().split('T')[0]);
    });

    it('should skip evaluation if voto is missing in mapRawData', () => {
      const data = [{ 'Last Name': 'Rossi', 'First Name': 'Mario' }];
      const mapping = { 'cognome': 'Last Name', 'nome': 'First Name', 'voto': 'Grade' };
      const result = ImportService.mapRawData(data, mapping);
      expect(result.evaluations).toHaveLength(0);
    });

    it('should handle duplicate students during mapping', () => {
      const data = [
        { 'Last Name': 'Rossi', 'First Name': 'Mario', 'Class': '1A' },
        { 'Last Name': 'Rossi', 'First Name': 'Mario', 'Class': '1A' }
      ];
      const mapping = { 'cognome': 'Last Name', 'nome': 'First Name', 'classe': 'Class' };
      const result = ImportService.mapRawData(data, mapping);
      expect(result.students).toHaveLength(1);
    });

    it('should map evaluations if mapping exists', () => {
      const data = [{ 'Last Name': 'Rossi', 'First Name': 'Mario', 'Grade': '8', 'Date': '2023-10-01' }];
      const mapping = { 'cognome': 'Last Name', 'nome': 'First Name', 'voto': 'Grade', 'data': 'Date' };
      const result = ImportService.mapRawData(data, mapping);
      expect(result.evaluations).toHaveLength(1);
      expect(result.evaluations[0].voto).toBe('8');
      expect(result.evaluations[0].data).toBe('2023-10-01');
    });

    it('should handle errors during mapping', () => {
      const data = [{ 'Last Name': 'Rossi', 'First Name': 'Mario', 'Grade': '8', 'Date': 'invalid' }];
      const mapping = { 'cognome': 'Last Name', 'nome': 'First Name', 'voto': 'Grade', 'data': 'Date' };
      const result = ImportService.mapRawData(data, mapping);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Errore alla riga 1');
    });
  });

  describe('parseCSV', () => {
    it('should parse CSV and map to internal', async () => {
      const file = new File([''], 'test.csv');
      (Papa.parse as any).mockImplementation((f: any, config: any) => {
        config.complete({ data: [{ Cognome: 'Rossi', Nome: 'Mario' }] });
      });
      const result = await ImportService.parseCSV(file);
      expect(result.students).toHaveLength(1);
      expect(result.students[0].cognome).toBe('Rossi');
    });

    it('should handle CSV parse errors in parseCSV', async () => {
      const file = new File([''], 'test.csv');
      (Papa.parse as any).mockImplementation((f: any, config: any) => {
        config.error(new Error('CSV Error'));
      });
      const result = await ImportService.parseCSV(file);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('CSV Error');
    });
  });

  describe('parseExcel', () => {
    it('should parse Excel and map to internal', async () => {
      const file = new File([''], 'test.xlsx');
      vi.spyOn(File.prototype, 'arrayBuffer').mockResolvedValue(new ArrayBuffer(0));
      xlsxMock.rows = [
        { values: [undefined, 'Cognome', 'Nome'] },
        { values: [undefined, 'Rossi', 'Mario'] },
      ];
      const result = await ImportService.parseExcel(file);
      expect(result.students.length).toBeGreaterThan(0);
    });

    it('should handle Excel parse errors in parseExcel', async () => {
      const file = new File([''], 'test.xlsx');
      vi.spyOn(File.prototype, 'arrayBuffer').mockRejectedValue(new Error('Excel Error'));
      const result = await ImportService.parseExcel(file);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Excel Error');
    });

    it('should handle non-Error exceptions in parseExcel', async () => {
      const file = new File([''], 'test.xlsx');
      vi.spyOn(File.prototype, 'arrayBuffer').mockRejectedValue('String error');
      const result = await ImportService.parseExcel(file);
      expect(result.errors[0]).toContain('Errore sconosciuto');
    });
  });

  describe('parseJSON', () => {
    it('should parse JSON array and map to internal', async () => {
      const file = new File([''], 'test.json');
      vi.spyOn(File.prototype, 'text').mockResolvedValue('[{"Cognome": "Rossi", "Nome": "Mario"}]');
      const result = await ImportService.parseJSON(file);
      expect(result.students.length).toBeGreaterThan(0);
    });

    it('should return error for non-array JSON', async () => {
      const file = new File([''], 'test.json');
      vi.spyOn(File.prototype, 'text').mockResolvedValue('{}');
      const result = await ImportService.parseJSON(file);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Formato JSON non riconosciuto');
    });

    it('should handle JSON parse errors', async () => {
      const file = new File([''], 'test.json');
      vi.spyOn(File.prototype, 'text').mockResolvedValue('invalid');
      const result = await ImportService.parseJSON(file);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Errore durante il parsing JSON');
    });

    it('should handle non-Error exceptions in parseJSON', async () => {
      const file = new File([''], 'test.json');
      vi.spyOn(File.prototype, 'text').mockRejectedValue('String error');
      const result = await ImportService.parseJSON(file);
      expect(result.errors[0]).toContain('Errore sconosciuto');
    });
  });

  describe('mapDataToInternal', () => {
    it('should handle "Studente" column (Cognome Nome)', () => {
      const data = [{ Studente: 'Rossi Mario', Classe: '1A' }];
      const result = ImportService.mapDataToInternal(data);
      expect(result.students[0].cognome).toBe('Rossi');
      expect(result.students[0].nome).toBe('Mario');
    });

    it('should handle "Studente" column with single name', () => {
      const data = [{ Studente: 'Rossi', Classe: '1A' }];
      const result = ImportService.mapDataToInternal(data);
      expect(result.students[0].cognome).toBe('Rossi');
      expect(result.students[0].nome).toBe('N.D.');
    });

    it('should handle evaluations in mapDataToInternal', () => {
      const data = [{ Cognome: 'Rossi', Nome: 'Mario', Voto: '8', Data: '01/10/2023' }];
      const result = ImportService.mapDataToInternal(data);
      expect(result.evaluations).toHaveLength(1);
      expect(result.evaluations[0].voto).toBe('8');
      expect(result.evaluations[0].data).toBe('2023-10-01');
    });

    it('should handle YYYY/MM/DD date format', () => {
      const data = [{ Cognome: 'Rossi', Nome: 'Mario', Voto: '8', Data: '2023/10/01' }];
      const result = ImportService.mapDataToInternal(data);
      expect(result.evaluations[0].data).toBe('2023-10-01');
    });

    it('should handle errors in mapDataToInternal loop', () => {
      const data = [{ Cognome: 'Rossi', Nome: 'Mario', Voto: '8' }];
      // Mock crypto.randomUUID to throw
      const cryptoSpy = vi.spyOn(crypto, 'randomUUID').mockImplementation(() => { throw new Error('Crypto error'); });
      const result = ImportService.mapDataToInternal(data);
      expect(result.errors).toHaveLength(1);
      cryptoSpy.mockRestore();
    });

    it('should handle non-Error exceptions in mapDataToInternal', () => {
      const data = [{ Cognome: 'Rossi', Nome: 'Mario', Voto: '8' }];
      const cryptoSpy = vi.spyOn(crypto, 'randomUUID').mockImplementation(() => { throw 'String error'; });
      const result = ImportService.mapDataToInternal(data);
      expect(result.errors[0]).toContain('Dati non validi');
      cryptoSpy.mockRestore();
    });

    it('should handle invalid date formats in mapDataToInternal', () => {
      const data = [
        { Cognome: 'Rossi', Nome: 'Mario', Voto: '8', Data: '01/10' }, // Not 3 parts
        { Cognome: 'Bianchi', Nome: 'Luigi', Voto: '7', Data: '01/10/23' } // Not 4 digits year
      ];
      const result = ImportService.mapDataToInternal(data);
      expect(result.evaluations[0].data).toBe('01/10');
      expect(result.evaluations[1].data).toBe('01/10/23');
    });

    it('should use current date if no date is provided', () => {
      const data = [{ Cognome: 'Rossi', Nome: 'Mario', Voto: '8' }];
      const result = ImportService.mapDataToInternal(data);
      expect(result.evaluations[0].data).toBe(new Date().toISOString().split('T')[0]);
    });
  });

  describe('Additional Coverage', () => {
    it('should handle .xls files in parseFile', async () => {
      const file = new File([''], 'test.xls', { type: 'application/vnd.ms-excel' });
      const spy = vi.spyOn(ImportService, 'parseExcel').mockResolvedValue({ students: [], evaluations: [], errors: [] });
      await ImportService.parseFile(file);
      expect(spy).toHaveBeenCalled();
    });

    it('should handle .xls files in getRawData', async () => {
      const file = new File([''], 'test.xls');
      vi.spyOn(File.prototype, 'arrayBuffer').mockResolvedValue(new ArrayBuffer(0));
      xlsxMock.rows = []; // empty sheet
      const result = await ImportService.getRawData(file);
      expect(result.headers).toEqual([]);
    });

    it('should handle non-Error exceptions in getRawData Excel', async () => {
      const file = new File([''], 'test.xlsx');
      vi.spyOn(File.prototype, 'arrayBuffer').mockRejectedValue('String error');
      const result = await ImportService.getRawData(file);
      expect(result.errors[0]).toContain('Errore Excel');
    });

    it('should handle unsupported format in getRawData', async () => {
      const file = new File([''], 'test.txt');
      const result = await ImportService.getRawData(file);
      expect(result.errors[0]).toContain('Formato non supportato');
    });

    it('should skip student if nome is missing in mapDataToInternal', () => {
      const data = [{ Cognome: 'Rossi' }]; // Nome is missing
      const result = ImportService.mapDataToInternal(data);
      expect(result.students).toHaveLength(0);
    });

    it('should handle empty row in mapDataToInternal', () => {
      const data = [{}];
      const result = ImportService.mapDataToInternal(data);
      expect(result.students).toHaveLength(0);
    });
  });
});
