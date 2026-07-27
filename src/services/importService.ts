import Papa from 'papaparse';
import { Studente, Valutazione } from '../types';

// exceljs is loaded on-demand (user uploads a .xlsx/.xls file) to keep the initial bundle lean
const loadExcelJS = () => import('exceljs');

function _unwrapCellValue(v: unknown): unknown {
    if (v === null || v === undefined) return v;
    if (typeof v === 'object') {
        const o = v as Record<string, unknown>;
        if ('text' in o) return o.text;
        if ('result' in o) return o.result;
        if ('hyperlink' in o) return o.text ?? o.hyperlink;
    }
    return v;
}

async function _readExcelFile(file: File): Promise<Record<string, unknown>[]> {
    const mod = await loadExcelJS();
    const WorkbookCtor: new () => import('exceljs').Workbook =
        (mod as unknown as { default: { Workbook: new () => import('exceljs').Workbook } }).default?.Workbook ??
        (mod as unknown as { Workbook: new () => import('exceljs').Workbook }).Workbook;
    const workbook = new WorkbookCtor();
    const buffer = await file.arrayBuffer();
    await workbook.xlsx.load(buffer);
    const ws = workbook.worksheets[0];
    if (!ws) return [];
    const headers: string[] = [];
    const rows: Record<string, unknown>[] = [];
    ws.eachRow((row, rowNum) => {
        const vals = row.values as unknown[];
        if (rowNum === 1) {
            for (let i = 1; i < vals.length; i++) headers.push(String(vals[i] ?? ''));
        } else {
            const obj: Record<string, unknown> = {};
            for (let i = 1; i < vals.length; i++) {
                const key = headers[i - 1];
                if (key) obj[key] = _unwrapCellValue(vals[i]);
            }
            if (Object.keys(obj).length) rows.push(obj);
        }
    });
    return rows;
}

export interface ImportResult {
    students: Studente[];
    evaluations: Valutazione[];
    errors: string[];
}

/**
 * Service to handle data import from external sources (Argo, Spaggiari, Axios, etc.)
 */
export const ImportService = {
    /**
     * Detects the source and format of the file and parses it
     */
    async parseFile(file: File): Promise<ImportResult> {
        const extension = file.name.split('.').pop()?.toLowerCase();

        if (extension === 'csv') {
            return ImportService.parseCSV(file);
        } else if (extension === 'xlsx' || extension === 'xls') {
            return ImportService.parseExcel(file);
        } else if (extension === 'json') {
            return ImportService.parseJSON(file);
        }

        return { students: [], evaluations: [], errors: [`Formato file .${extension} non supportato.`] };
    },

    /**
     * Returns raw headers and data for manual mapping
     */
    async getRawData(file: File): Promise<{ headers: string[], data: Record<string, unknown>[], errors: string[] }> {
        const extension = file.name.split('.').pop()?.toLowerCase();

        if (extension === 'csv') {
            return new Promise((resolve) => {
                Papa.parse(file, {
                    header: true,
                    skipEmptyLines: true,
                    complete: (results) => {
                        resolve({ 
                            headers: results.meta.fields || [], 
                            data: results.data as Record<string, unknown>[], 
                            errors: [] 
                        });
                    },
                    error: (error) => {
                        resolve({ headers: [], data: [], errors: [error.message] });
                    }
                });
            });
        } else if (extension === 'xlsx' || extension === 'xls') {
            try {
                const jsonData = await _readExcelFile(file);
                const headers = jsonData.length > 0 ? Object.keys(jsonData[0]) : [];
                return { headers, data: jsonData, errors: [] };
            } catch (error) {
                return { headers: [], data: [], errors: [error instanceof Error ? error.message : 'Errore Excel'] };
            }
        }

        return { headers: [], data: [], errors: ['Formato non supportato per mapping manuale.'] };
    },

    /**
     * Maps raw data using provided column mapping
     */
    mapRawData(data: Record<string, unknown>[], mapping: Record<string, string>): ImportResult {
        const students: Studente[] = [];
        const evaluations: Valutazione[] = [];
        const errors: string[] = [];

        data.forEach((row, index) => {
            try {
                // Extract student info
                const cognome = (row[mapping['cognome']] as string) || '';
                const nome = (row[mapping['nome']] as string) || '';
                const classe = (row[mapping['classe']] as string) || '';

                if (!cognome && !nome) return;

                const studentId = `import-${cognome}-${nome}-${classe}`.replace(/\s+/g, '-').toLowerCase();
                
                if (!students.find(s => s.id === studentId)) {
                    students.push({
                        id: studentId,
                        cognome: String(cognome).trim(),
                        nome: String(nome).trim(),
                        classe: String(classe).trim()
                    });
                }

                // Extract evaluation info if mapping exists
                if (mapping['voto'] && row[mapping['voto']]) {
                    evaluations.push({
                        id: `eval-${Date.now()}-${index}`,
                        studenteId: studentId,
                        voto: String(row[mapping['voto']]).trim(),
                        data: row[mapping['data']] ? new Date(row[mapping['data']] as string).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                        materia: (row[mapping['materia']] as string) || 'Importata',
                        tipo: 'Test',
                        argomento: (row[mapping['argomento']] as string) || ''
                    });
                }
            } catch (err) {
                errors.push(`Errore alla riga ${index + 1}: ${err instanceof Error ? err.message : 'Dati non validi'}`);
            }
        });

        return { students, evaluations, errors };
    },

    /**
     * Parses a CSV file
     */
    async parseCSV(file: File): Promise<ImportResult> {
        return new Promise((resolve) => {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    const data = results.data as Record<string, unknown>[];
                    resolve(ImportService.mapDataToInternal(data));
                },
                error: (error) => {
                    resolve({ students: [], evaluations: [], errors: [`Errore durante il parsing CSV: ${error.message}`] });
                }
            });
        });
    },

    /**
     * Parses an Excel file
     */
    async parseExcel(file: File): Promise<ImportResult> {
        try {
            const jsonData = await _readExcelFile(file);
            return ImportService.mapDataToInternal(jsonData);
        } catch (error) {
            return { students: [], evaluations: [], errors: [`Errore durante il parsing Excel: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`] };
        }
    },

    /**
     * Parses a JSON file (for generic imports or our own format)
     */
    async parseJSON(file: File): Promise<ImportResult> {
        try {
            const text = await file.text();
            const data = JSON.parse(text);
            
            // If it's our backup format, it will be handled by the store directly, 
            // but we can also support a simpler JSON list of students/evals
            if (Array.isArray(data)) {
                return ImportService.mapDataToInternal(data as Record<string, unknown>[]);
            }
            
            return { students: [], evaluations: [], errors: ['Formato JSON non riconosciuto come lista di dati.'] };
        } catch (error) {
            return { students: [], evaluations: [], errors: [`Errore durante il parsing JSON: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`] };
        }
    },

    /**
     * Maps raw data from registers to internal DocenteDoc AI types
     */
    mapDataToInternal(rawData: Record<string, unknown>[]): ImportResult {
        const students: Studente[] = [];
        const evaluations: Valutazione[] = [];
        const errors: string[] = [];

        // Heuristic mapping based on common headers in Italian school registers
        // Argo: "Cognome", "Nome", "Classe", "Data di nascita"
        // Spaggiari: "Studente", "Classe", "Voto", "Data"
        
        rawData.forEach((row, index) => {
            try {
                // 1. Try to identify a student
                let cognome = (row.Cognome || row.cognome || row.COGNOME || '') as string;
                let nome = (row.Nome || row.nome || row.NOME || '') as string;
                const classe = (row.Classe || row.classe || row.CLASSE || row.Sezione || row.SEZIONE || '') as string;

                // Handle "Studente" or "STUDENTE" column (Cognome Nome)
                const fullStudente = (row.Studente || row.STUDENTE || row.Alunno || row.ALUNNO) as string;
                if (!cognome && fullStudente) {
                    const parts = fullStudente.trim().split(/\s+/);
                    if (parts.length >= 2) {
                        cognome = parts[0];
                        nome = parts.slice(1).join(' ');
                    } else {
                        cognome = fullStudente;
                        nome = 'N.D.';
                    }
                }

                if (cognome && nome) {
                    const studentId = `${cognome}-${nome}-${classe || 'generica'}`.replace(/\s+/g, '').toLowerCase();
                    
                    // Check if student already added in this batch
                    if (!students.find(s => s.id === studentId)) {
                        students.push({
                            id: studentId,
                            nome: nome.trim(),
                            cognome: cognome.trim(),
                            classe: (classe || 'Generica').toString().trim(),
                            isArchived: false
                        });
                    }

                    // 2. Try to identify an evaluation if present in the same row
                    const voto = row.Voto || row.voto || row.Valutazione || row.Esito || row.VOTO;
                    const dataRaw = row.Data || row.data || row.DATA || row.Giorno || new Date().toISOString().split('T')[0];
                    const materia = row.Materia || row.materia || row.MATERIA || row.Disciplina || 'Generale';
                    const tipo = row.Tipo || row.tipo || row.TIPO || row.Prova || 'Scritto';

                    if (voto) {
                        // Normalize date if it's in DD/MM/YYYY format
                        let data = dataRaw.toString();
                        if (data.includes('/')) {
                            const parts = data.split('/');
                            if (parts.length === 3) {
                                if (parts[2].length === 4) { // DD/MM/YYYY
                                    data = `${parts[2]}-${parts[1]}-${parts[0]}`;
                                } else if (parts[0].length === 4) { // YYYY/MM/DD
                                    data = `${parts[0]}-${parts[1]}-${parts[2]}`;
                                }
                            }
                        }

                        evaluations.push({
                            id: crypto.randomUUID(),
                            studenteId: studentId,
                            materia: materia.toString().trim(),
                            data: data,
                            tipo: tipo.toString() as Valutazione['tipo'],
                            voto: voto.toString().trim(),
                            argomento: (row.Argomento || row.argomento || row.ARGOMENTO || row.Descrizione || '') as string
                        });
                    }
                }
            } catch (err) {
                errors.push(`Errore alla riga ${index + 1}: ${err instanceof Error ? err.message : 'Dati non validi'}`);
            }
        });

        return { students, evaluations, errors };
    }
};

