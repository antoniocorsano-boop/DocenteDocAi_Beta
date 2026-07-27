import { describe, it, expect, vi, beforeEach } from "vitest";
import { ImportService } from "../../src/services/importService";
import Papa from "papaparse";

const xlsxMock = vi.hoisted(() => ({
    rows: [] as Array<{ values: unknown[] }>,
    error: null as Error | null,
}));

// Mock exceljs
vi.mock("exceljs", () => {
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

describe("ImportService Coverage", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        xlsxMock.rows = [];
        xlsxMock.error = null;
    });

    describe("parseCSV", () => {
        it("should parse a valid CSV file", async () => {
            const csvContent = "Cognome,Nome,Classe\nRossi,Mario,1A\nBianchi,Luigi,1A";
            const file = new File([csvContent], "students.csv", { type: "text/csv" });
            
            const result = await ImportService.parseCSV(file);
            
            expect(result.students).toHaveLength(2);
            expect(result.students[0].cognome).toBe("Rossi");
            expect(result.students[0].nome).toBe("Mario");
            expect(result.students[1].cognome).toBe("Bianchi");
            expect(result.errors).toHaveLength(0);
        });

        it("should handle CSV parsing errors", async () => {
            const spy = vi.spyOn(Papa, "parse").mockImplementation(((file: any, config?: any) => {
                if (config?.error) {
                    config.error(new Error("Mock error") as any, file as any);
                }
            }) as any);

            const file = new File([""], "error.csv", { type: "text/csv" });
            const result = await ImportService.parseCSV(file);
            
            expect(result.errors[0]).toContain("Errore durante il parsing CSV: Mock error");
            spy.mockRestore();
        });
    });

    describe("parseExcel", () => {
        it("should parse a valid Excel file", async () => {
            const mockData = [{ Cognome: "Rossi", Nome: "Mario", Classe: "1A" }];
            xlsxMock.rows = [
                { values: [undefined, "Cognome", "Nome", "Classe"] },
                { values: [undefined, mockData[0].Cognome, mockData[0].Nome, mockData[0].Classe] },
            ];

            const file = new File([""], "students.xlsx");
            file.arrayBuffer = vi.fn().mockResolvedValue(new ArrayBuffer(0));

            const result = await ImportService.parseExcel(file);

            expect(result.students).toHaveLength(1);
            expect(result.students[0].cognome).toBe("Rossi");
        });

        it("should handle Excel parsing errors", async () => {
            xlsxMock.error = new Error("XLSX read error");
            const file = new File([""], "error.xlsx");
            file.arrayBuffer = vi.fn().mockResolvedValue(new ArrayBuffer(0));

            const result = await ImportService.parseExcel(file);

            expect(result.errors).toHaveLength(1);
            expect(result.errors[0]).toContain("Errore durante il parsing Excel: XLSX read error");
        });
    });

    describe("parseJSON", () => {
        it("should parse a valid JSON array", async () => {
            const data = [
                { Cognome: "Rossi", Nome: "Mario", Classe: "1A" }
            ];
            const jsonString = JSON.stringify(data);
            const file = new File([jsonString], "students.json", { type: "application/json" });
            
            file.text = vi.fn().mockResolvedValue(jsonString);
            
            const result = await ImportService.parseJSON(file);
            
            expect(result.students).toHaveLength(1);
            expect(result.students[0].cognome).toBe("Rossi");
        });

        it("should reject non-array JSON", async () => {
            const jsonString = JSON.stringify({ key: "value" });
            const file = new File([jsonString], "invalid.json");
            
            file.text = vi.fn().mockResolvedValue(jsonString);
            
            const result = await ImportService.parseJSON(file);
            
            expect(result.errors[0]).toBe("Formato JSON non riconosciuto come lista di dati.");
        });

        it("should handle JSON syntax errors", async () => {
            const jsonString = "{ invalid json }";
            const file = new File([jsonString], "error.json");
            
            file.text = vi.fn().mockResolvedValue(jsonString);
            
            const result = await ImportService.parseJSON(file);
            
            expect(result.errors[0]).toContain("Errore durante il parsing JSON");
        });
    });

    describe("mapDataToInternal - Heuristics", () => {
        it("should handle Spaggiari format (Studente column)", () => {
            const rawData = [
                { Studente: "Rossi Mario", Classe: "1A", Voto: "8", Data: "2023-10-01" }
            ];
            const result = ImportService.mapDataToInternal(rawData);
            
            expect(result.students[0].cognome).toBe("Rossi");
            expect(result.students[0].nome).toBe("Mario");
            expect(result.evaluations).toHaveLength(1);
            expect(result.evaluations[0].voto).toBe("8");
        });

        it("should handle Argo format (Cognome, Nome columns)", () => {
            const rawData = [
                { Cognome: "Bianchi", Nome: "Luigi", Classe: "2B" }
            ];
            const result = ImportService.mapDataToInternal(rawData);
            
            expect(result.students[0].cognome).toBe("Bianchi");
            expect(result.students[0].nome).toBe("Luigi");
        });

        it("should handle missing data gracefully", () => {
            const rawData = [
                { Qualcosa: "Inutile" }
            ];
            const result = ImportService.mapDataToInternal(rawData);
            
            expect(result.errors).toHaveLength(0);
        });
    });

    describe("mapDataToInternal - Advanced", () => {
        it("should normalize dates in DD/MM/YYYY format", () => {
            const rawData = [
                { Cognome: "Rossi", Nome: "Mario", Voto: "7", Data: "15/10/2023" }
            ];
            const result = ImportService.mapDataToInternal(rawData);
            expect(result.evaluations[0].data).toBe("2023-10-15");
        });

        it("should normalize dates in YYYY/MM/DD format", () => {
            const rawData = [
                { Cognome: "Rossi", Nome: "Mario", Voto: "7", Data: "2023/10/15" }
            ];
            const result = ImportService.mapDataToInternal(rawData);
            expect(result.evaluations[0].data).toBe("2023-10-15");
        });

        it("should handle single-part student names", () => {
            const rawData = [
                { Studente: "Rossi", Classe: "1A" }
            ];
            const result = ImportService.mapDataToInternal(rawData);
            expect(result.students[0].cognome).toBe("Rossi");
            expect(result.students[0].nome).toBe("N.D.");
        });

        it("should deduplicate students in the same batch", () => {
            const rawData = [
                { Cognome: "Rossi", Nome: "Mario", Classe: "1A", Voto: "7" },
                { Cognome: "Rossi", Nome: "Mario", Classe: "1A", Voto: "8" }
            ];
            const result = ImportService.mapDataToInternal(rawData);
            expect(result.students).toHaveLength(1);
            expect(result.evaluations).toHaveLength(2);
        });

        it("should handle various evaluation column names", () => {
            const rawData = [
                { Cognome: "A", Nome: "B", Valutazione: "Ottimo", Disciplina: "Matematica", Prova: "Orale" }
            ];
            const result = ImportService.mapDataToInternal(rawData);
            expect(result.evaluations[0].voto).toBe("Ottimo");
            expect(result.evaluations[0].materia).toBe("Matematica");
            expect(result.evaluations[0].tipo).toBe("Orale");
        });

        it("should catch errors in row processing", () => {
            const spy = vi.spyOn(crypto, "randomUUID").mockImplementation(() => {
                throw new Error("UUID error");
            });
            
            const rawData = [
                { Cognome: "Rossi", Nome: "Mario", Voto: "7" }
            ];
            const result = ImportService.mapDataToInternal(rawData);
            expect(result.errors).toHaveLength(1);
            expect(result.errors[0]).toContain("UUID error");
            
            spy.mockRestore();
        });
    });

    describe("parseFile", () => {
        it("should route to parseCSV for .csv files", async () => {
            const spy = vi.spyOn(ImportService, "parseCSV").mockResolvedValue({ students: [], evaluations: [], errors: [] });
            const file = new File([""], "test.csv");
            await ImportService.parseFile(file);
            expect(spy).toHaveBeenCalled();
            spy.mockRestore();
        });

        it("should route to parseExcel for .xlsx files", async () => {
            const spy = vi.spyOn(ImportService, "parseExcel").mockResolvedValue({ students: [], evaluations: [], errors: [] });
            const file = new File([""], "test.xlsx");
            await ImportService.parseFile(file);
            expect(spy).toHaveBeenCalled();
            spy.mockRestore();
        });

        it("should route to parseJSON for .json files", async () => {
            const spy = vi.spyOn(ImportService, "parseJSON").mockResolvedValue({ students: [], evaluations: [], errors: [] });
            const file = new File([""], "test.json");
            await ImportService.parseFile(file);
            expect(spy).toHaveBeenCalled();
            spy.mockRestore();
        });

        it("should return error for unsupported extensions", async () => {
            const file = new File([""], "test.txt");
            const result = await ImportService.parseFile(file);
            expect(result.errors[0]).toContain("non supportato");
        });
    });

    describe("getRawData", () => {
        it("should get raw data from CSV", async () => {
            const csvContent = "Col1,Col2\nVal1,Val2";
            const file = new File([csvContent], "test.csv");
            const result = await ImportService.getRawData(file);
            expect(result.headers).toContain("Col1");
            expect(result.data[0].Col1).toBe("Val1");
        });

        it("should get raw data from Excel", async () => {
            xlsxMock.rows = [
                { values: [undefined, "Col1"] },
                { values: [undefined, "Val1"] },
            ];

            const file = new File([""], "test.xlsx");
            file.arrayBuffer = vi.fn().mockResolvedValue(new ArrayBuffer(0));

            const result = await ImportService.getRawData(file);
            expect(result.headers).toContain("Col1");
            expect(result.data[0].Col1).toBe("Val1");
        });

        it("should handle Excel errors in getRawData", async () => {
            xlsxMock.error = new Error("Excel error");
            const file = new File([""], "test.xlsx");
            file.arrayBuffer = vi.fn().mockResolvedValue(new ArrayBuffer(0));
            const result = await ImportService.getRawData(file);
            expect(result.errors[0]).toBe("Excel error");
        });

        it("should return error for unsupported extensions in getRawData", async () => {
            const file = new File([""], "test.txt");
            const result = await ImportService.getRawData(file);
            expect(result.errors[0]).toContain("non supportato");
        });
    });

    describe("mapRawData", () => {
        it("should map data using provided mapping", () => {
            const data = [
                { "Colonna Cognome": "Rossi", "Colonna Nome": "Mario", "Colonna Voto": "8" }
            ];
            const mapping = {
                cognome: "Colonna Cognome",
                nome: "Colonna Nome",
                voto: "Colonna Voto",
                data: "Colonna Data"
            };
            const result = ImportService.mapRawData(data, mapping);
            expect(result.students[0].cognome).toBe("Rossi");
            expect(result.evaluations[0].voto).toBe("8");
        });

        it("should skip rows with missing cognome and nome", () => {
            const data = [{ "Other": "Value" }];
            const mapping = { cognome: "Cognome", nome: "Nome" };
            const result = ImportService.mapRawData(data, mapping);
            expect(result.students).toHaveLength(0);
        });
    });
});
