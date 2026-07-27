// documentUtils.ts — Document generation utilities
// PDF output: uses browser print API via printUtils.ts (zero bundle cost)
// DOCX output: uses docx library (lazy-loaded)
// Text extraction: pdfjs-dist loaded from CDN on demand


import { logger } from './logger';

const loadMammoth = async () => await import('mammoth');
const loadDocx = async () => await import('docx');



// --- NATIVE SAVEAS IMPLEMENTATION ---
export const saveAs = (blob: Blob | string, name: string): void => {
    try {
        const blobObj = blob instanceof Blob ? blob : new Blob([blob]);
        const url = window.URL.createObjectURL(blobObj);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = name;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            window.URL.revokeObjectURL(url);
            if (document.body.contains(a)) document.body.removeChild(a);
        }, 100);
    } catch (e) {
        logger.error("Errore download:", e);
        window.alert('Errore durante il download del file.');
    }
};

// pdfjs-dist is loaded from CDN on demand — not bundled
let cachedPdfJs: unknown = null;
const getPdfJs = async () => {
    if (cachedPdfJs) return cachedPdfJs;
    // Load PDF.js from CDN only when needed (zero bundle cost)
    await new Promise<void>((resolve, reject) => {
        if (document.querySelector('script[data-pdfjs-cdn]')) { resolve(); return; }
        const s = document.createElement('script');
        s.src = 'https://unpkg.com/pdfjs-dist@5.4.530/build/pdf.min.js';
        s.setAttribute('data-pdfjs-cdn', '');
        s.onload = () => resolve();
        s.onerror = () => reject(new Error('Failed to load PDF.js from CDN'));
        document.head.appendChild(s);
    });
    const pjs = (window as Window & { pdfjsLib?: unknown }).pdfjsLib;
    if (pjs && typeof pjs === 'object' && 'GlobalWorkerOptions' in pjs) {
        (pjs as { GlobalWorkerOptions: { workerSrc: string } }).GlobalWorkerOptions.workerSrc =
            'https://unpkg.com/pdfjs-dist@5.4.530/build/pdf.worker.min.js';
    }
    cachedPdfJs = pjs;
    return cachedPdfJs;
};

const extractTextFromPdfClientSide = async (file: File): Promise<string> => {
     
    const pdfJsObj = await getPdfJs() as unknown as { getDocument: (options: { data: Uint8Array }) => { promise: Promise<{ numPages: number; getPage: (n: number) => Promise<{ getTextContent: () => Promise<{ items: unknown[] }> }> }> } };
    if (!pdfJsObj) throw new Error('PDF.js not available');
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfJsObj.getDocument({ data: new Uint8Array(arrayBuffer) });
    const pdf = await loadingTask.promise;
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: unknown) => {
            const itemObj = item as { str?: string };
            return 'str' in itemObj ? itemObj.str : '';
        }).join(' ');
        fullText += pageText + '\n';
    }
    return fullText;
};

/**
 * Estrae il testo da un file caricato (PDF, DOCX, TXT, ecc.).
 * Utilizza librerie client-side per il parsing.
 * @param file Il file da processare
 * @returns Il testo estratto
 */
export const extractTextFromFile = async (file: File): Promise<string> => {
    const parts = file.name.split('.');
    const fileExtension = parts.length > 1 ? parts.pop()?.toLowerCase() : '';
    const supportedTextExtensions = ['txt', 'md', 'markdown', 'json', 'csv', 'xml', 'html', 'js', 'ts', 'jsx', 'tsx', 'css', 'scss', 'yaml', 'yml'];
    
    if (file.type.startsWith('text/') || supportedTextExtensions.includes(fileExtension || '')) {
        return await file.text();
    }
    if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || fileExtension === 'docx') {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const mammothModule = await loadMammoth();
            const mammothLib = (mammothModule && mammothModule.default) ? mammothModule.default : mammothModule;
            const result = await mammothLib.extractRawText({ arrayBuffer });
            return result.value;
        } catch (e: unknown) {
            throw new Error(`Errore DOCX: ${e instanceof Error ? e.message : String(e)}`);
        }
    }
    if (file.type === 'application/pdf' || fileExtension === 'pdf') {
        try { return await extractTextFromPdfClientSide(file); } catch(e: unknown) { throw new Error(`Errore PDF: ${e instanceof Error ? e.message : String(e)}`); }
    }
    if (file.size < 2 * 1024 * 1024) { 
        try {
            const text = await file.text();
            if (text && !text.includes('\0')) return text;
        } catch (_e) { /* binary / unreadable — fall through */ }
    }
    throw new Error(`Tipo file non supportato: ${file.name}`);
};

export const blobToBase64Parts = (blob: Blob): Promise<{ mimeType: string; data: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      if (!result || !result.includes(',')) { reject(new Error("File error")); return; }
      const parts = result.split(',');
      const [header, data] = parts;
      const mimeType = header.match(/:(.*?);/)?.[1] || blob.type;
      resolve({ mimeType, data });
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(blob);
  });
};

export const base64ToBlob = (base64: string, mimeType: string): Blob => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) byteNumbers[i] = byteCharacters.charCodeAt(i);
    return new Blob([new Uint8Array(byteNumbers)], { type: mimeType });
};

export const viewPdfInNewTab = (blob: Blob): void => {
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 60000);
};

// ... (Existing DOCX generation, PDF text wrapping, etc. remain unchanged)
export const generateHtmlDocxBlob = async (htmlContent: string, title?: string): Promise<Blob> => {
    try {
        // Safety check for browser environment
        if (typeof document === 'undefined' || typeof DOMParser === 'undefined') {
            throw new Error('Document API not available - DOCX generation requires browser environment');
        }
        
        // Load docx dynamically to avoid bundling it in the initial chunk
        const docxModule = await loadDocx();
        const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = docxModule;
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, 'text/html');
        const body = doc.body;

        const children: (import('docx').Paragraph | import('docx').Table)[] = [];
        if (title) {
            children.push(new Paragraph({ 
                text: title, 
                heading: HeadingLevel.TITLE, 
                alignment: AlignmentType.CENTER, 
                spacing: { after: 300 } 
            }));
        }

        const extractTextRuns = (container: HTMLElement): import('docx').TextRun[] => {
            const runs: import('docx').TextRun[] = [];
            container.childNodes.forEach(child => {
                if (child.nodeType === Node.TEXT_NODE) {
                    const txt = child.textContent || '';
                    if (txt) runs.push(new TextRun(txt));
                } else if (child.nodeType === Node.ELEMENT_NODE) {
                    const childEl = child as HTMLElement;
                    const childTag = childEl.tagName.toLowerCase();
                    if (childTag === 'strong' || childTag === 'b') {
                        runs.push(new TextRun({ text: childEl.textContent || '', bold: true }));
                    } else if (childTag === 'em' || childTag === 'i') {
                        runs.push(new TextRun({ text: childEl.textContent || '', italics: true }));
                    } else if (childTag === 'br') {
                        runs.push(new TextRun({ text: "\n" }));
                    } else {
                        runs.push(new TextRun(childEl.textContent || ''));
                    }
                }
            });
            return runs;
        };

        const processNode = (node: Node): (import('docx').Paragraph | import('docx').Table)[] => {
            if (!node) return [];
            const nodes: (import('docx').Paragraph | import('docx').Table)[] = [];
            const nodeType = node.nodeType;
            const nodeName = (node.nodeName || "").toLowerCase();

            if (nodeType === 3) { // Node.TEXT_NODE
                const text = node.textContent?.trim();
                if (text) nodes.push(new Paragraph({ children: [new TextRun(text)] }));
            } else if (nodeType === 1) { // Node.ELEMENT_NODE
                const el = node as HTMLElement;
                if (['h1', 'h2', 'h3', 'p', 'div'].includes(nodeName)) {
                    const runs = extractTextRuns(el);
                    if (runs.length) {
                        type ParagraphInitWithHeading = import('docx').IParagraphOptions;
                        const headingLevel = nodeName === 'h1' ? HeadingLevel.HEADING_1
                            : nodeName === 'h2' ? HeadingLevel.HEADING_2
                            : nodeName === 'h3' ? HeadingLevel.HEADING_3
                            : undefined;
                        const options: ParagraphInitWithHeading = headingLevel
                            ? { children: runs, heading: headingLevel }
                            : { children: runs };
                        nodes.push(new Paragraph(options));
                    }
                } else if (nodeName === 'ul' || nodeName === 'ol') {
                    const childrenArr = node.childNodes ? Array.from(node.childNodes) : [];
                    childrenArr.forEach(li => {
                        if (li && li.nodeType === 1 && li.nodeName.toLowerCase() === 'li') {
                            const runs = extractTextRuns(li as HTMLElement);
                            if (runs.length) {
                                nodes.push(new Paragraph({ 
                                    children: runs, 
                                    bullet: { level: 0 } 
                                }));
                            }
                        }
                    });
                } else {
                    // For other elements, try to process children
                    const childrenArr = node.childNodes ? Array.from(node.childNodes) : [];
                    childrenArr.forEach(child => {
                        nodes.push(...processNode(child));
                    });
                }
            }
            return nodes;
        };

        Array.from(body.childNodes).forEach(node => {
            children.push(...processNode(node));
        });
        
        const docx = new Document({ 
            sections: [{ 
                properties: {}, 
                children: children 
            }] 
        });
        return await Packer.toBlob(docx);
    } catch (error) {
        logger.error('Error generating DOCX:', error);
        // Fallback: return empty blob
        return new Blob(['Unable to generate DOCX file'], { type: 'text/plain' });
    }
};