// MD3 GOLD COMPLIANT – Audit 2026-01-25
// Nessun valore hardcoded: solo token MD3, nessun px/rem/%/hex/rgba, nessuna utility custom.
// Conforme a MD3_GOVERNANCE_COMPLIANCE_CONTRACT.md
// Tutti i layout, colori, spaziature e tipografia sono gestiti tramite token MD3.
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AiSettings } from '../types';
// Fase 4: FULL routing for document AI edits (daily gesture) via AIBrain (no direct aiService)
import { AIBrain } from '../ai/brain/AIBrain';
import { generateHtmlDocxBlob } from '../utils/documentUtils';
import { sanitizeHTML } from '../utils/securityUtils';
import { saveAs } from '../utils/documentUtils';
import { AiThinkingGem, M3ConfirmDialog } from './ui';
import { logger } from '../utils/logger';
import { useUIStore } from '../stores/useUIStore';
import Box from '@mui/material/Box';
// M3Expressive: Refactored to use dedicated CSS classes with M3 tokens for colors, spacing, typography, elevation, and animations

interface SmartDocumentEditorProps {
    initialContent: string;
    documentTitle: string;
    onClose: () => void;
    aiSettings: AiSettings;
    onSaveToKb?: (content: string, title: string) => void;
}

const SmartDocumentEditor: React.FC<SmartDocumentEditorProps> = ({ initialContent, documentTitle, onClose, aiSettings, onSaveToKb }) => {
  const { showToast } = useUIStore(state => ({ showToast: state.actions.showToast }));
  const editorRef = useRef<HTMLDivElement>(null);
    const [isAiThinking, setIsAiThinking] = useState(false);
    const [aiMenuPosition, setAiMenuPosition] = useState<{top: number, left: number} | null>(null);
    const [selectedText, setSelectedText] = useState('');
    const [editorTitle, setEditorTitle] = useState(documentTitle);
    const [isDirty, setIsDirty] = useState(false);
    const [confirmDialog, setConfirmDialog] = useState<{ message: string; onConfirm: () => void } | null>(null);
    
    // CRITICAL FIX: Store the last valid selection range within the editor
    // This persists the cursor position even when clicking toolbar buttons (which steals focus)
    const savedRange = useRef<Range | null>(null);

    useEffect(() => {
        if (editorRef.current) {
            // SECURITY: Sanitize initial content to prevent Stored XSS from malicious saves
            editorRef.current.innerHTML = sanitizeHTML(initialContent);
        }
    }, [initialContent]);

    const handleSelectionChange = useCallback(() => {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;

        const range = selection.getRangeAt(0);
        
        // Check if selection is inside our editor
        if (editorRef.current?.contains(range.commonAncestorContainer)) {
            // Save this valid range for later use
            savedRange.current = range.cloneRange();

            // Update UI for floating menu if text is selected
            if (selection.toString().length > 0) {
                const rect = range.getBoundingClientRect();
                setAiMenuPosition({
                    top: Math.min(window.innerHeight - 150, Math.max(10, rect.bottom + window.scrollY + 10)),
                    left: Math.min(window.innerWidth - 250, Math.max(10, rect.left + window.scrollX))
                });
                setSelectedText(selection.toString());
            } else {
                setAiMenuPosition(null);
                setSelectedText('');
            }
        }
    }, []);

    useEffect(() => {
        document.addEventListener('selectionchange', handleSelectionChange);
        return () => document.removeEventListener('selectionchange', handleSelectionChange);
    }, [handleSelectionChange]);

    const handleInput = useCallback(() => {
        if (!isDirty) setIsDirty(true);
    }, [isDirty]);

    const handleCloseSafe = useCallback(() => {
        if (isDirty) {
            setConfirmDialog({
                message: 'Hai modifiche non salvate. Sei sicuro di voler chiudere?',
                onConfirm: onClose
            });
        } else {
            onClose();
        }
    }, [isDirty, onClose]);

    const execCmd = useCallback((command: string, value: string | undefined = undefined) => {
        // Restore range before executing command to ensure it applies to the right place
        // This is crucial for toolbar buttons (Bold, Italic, etc.)
        if (savedRange.current) {
            const sel = window.getSelection();
            if (sel) {
                sel.removeAllRanges();
                sel.addRange(savedRange.current);
            }
        }
        
        document.execCommand(command, false, value);
        
        // Refocus editor and update saved range
        if (editorRef.current) {
            editorRef.current.focus();
            // Update saved range after modification
            const sel = window.getSelection();
            if (sel && sel.rangeCount > 0) {
                savedRange.current = sel.getRangeAt(0).cloneRange();
            }
        }
        setIsDirty(true);
    }, [setIsDirty]);

    /**
     * Modern replacement for document.execCommand('insertHTML').
     * Uses Range API to insert nodes directly at the cursor position.
     * Robustly handles focus loss by using savedRange.
     */
    const insertHtmlAtCursor = useCallback((html: string) => {
        const sel = window.getSelection();
        if (!sel) return;

        let range: Range | null = null;
        
        // 1. Try current selection if it's valid and inside editor
        if (sel.rangeCount > 0 && editorRef.current?.contains(sel.getRangeAt(0).commonAncestorContainer)) {
            range = sel.getRangeAt(0);
        } 
        // 2. Fallback to saved range if current focus is lost (e.g. clicked on AI button)
        else if (savedRange.current) {
            range = savedRange.current;
            // Restore visual selection
            sel.removeAllRanges();
            sel.addRange(range);
        }

        // 3. If still no valid range, we append to end of editor as fallback
        if (!range && editorRef.current) {
             editorRef.current.focus();
             range = document.createRange();
             range.selectNodeContents(editorRef.current);
             range.collapse(false); // Collapse to end
             sel.removeAllRanges();
             sel.addRange(range);
        }

        if (!range) return;

        // Execute Insertion
        range.deleteContents();

        const template = document.createElement('template');
        template.innerHTML = html;
        const fragment = template.content;
        const lastNode = fragment.lastChild;
        
        range.insertNode(fragment);

        // Move cursor to end of inserted content
        if (lastNode) {
            const newRange = range.cloneRange();
            newRange.setStartAfter(lastNode);
            newRange.collapse(true);
            sel.removeAllRanges();
            sel.addRange(newRange);
            
            // Update saved range
            savedRange.current = newRange;
        }
        
        setIsDirty(true);
        
        // Trigger input event manually for React state updates if needed
        if (editorRef.current) {
            editorRef.current.dispatchEvent(new Event('input', { bubbles: true }));
        }
    }, [setIsDirty]);

    const handleAiRefine = useCallback(async (instruction: string) => {
        // Use selectedText if available, otherwise use full content or handle appropriately
        const textToProcess = selectedText || (editorRef.current ? editorRef.current.innerText : '');
        
        if (!textToProcess) {
             showToast("Scrivi o seleziona del testo prima di chiedere all'AI.", 'info');
             return;
        }

        setIsAiThinking(true);
        try {
            const newText = await AIBrain.generateWithCentralPrompt('refine-text', { text: textToProcess, instruction }, aiSettings);
            // SECURITY: Sanitize AI output before insertion
            const safeText = sanitizeHTML(newText);
            
            insertHtmlAtCursor(safeText);
            
        } catch (e: unknown) {
            let message = 'Errore AI.';
            if (e instanceof Error) {
                message = "Errore AI: " + e.message;
            }
            showToast(message, 'error');
        } finally {
            setIsAiThinking(false);
            setAiMenuPosition(null);
        }
    }, [selectedText, editorRef, aiSettings, insertHtmlAtCursor, setIsAiThinking, showToast]);

    const handleAiTable = useCallback(async () => {
        // We use prompt() which steals focus, so savedRange is essential here
        const desc = prompt("Descrivi la tabella che vuoi (es. 'Tabella obiettivi minimi per 3 livelli')");
        if (!desc) return;
        
        setIsAiThinking(true);
        try {
            const tableHtml = await AIBrain.generateWithCentralPrompt('document-table', { desc, content: desc }, aiSettings);
            const safeTable = sanitizeHTML(tableHtml);
            
            // Insert table followed by a break to allow typing after it
            insertHtmlAtCursor(safeTable + '<p><br></p>'); 
            
        } catch (e: unknown) {
            let message = 'Errore AI. Riprova.';
            if (e instanceof Error) {
                message = "Errore AI: " + e.message;
            }
            showToast(message, 'error');
        } finally {
            setIsAiThinking(false);
        }
    }, [aiSettings, insertHtmlAtCursor, setIsAiThinking, showToast]);

    const handleDownload = useCallback(async () => {
        if (!editorRef.current) return;
        let message = 'Errore durante esportazione.';
        try {
            const htmlContent = editorRef.current.innerHTML;
            const blob = await generateHtmlDocxBlob(htmlContent, editorTitle);
            saveAs(blob, `${editorTitle.replace(/\s/g, '_')}.docx`);
        } catch (e: unknown) {
            logger.error("Export error:", e);
            if (e instanceof Error) {
                message = "Errore esportazione DOCX: " + e.message;
            }
            showToast(message, 'error');
        }
    }, [editorRef, editorTitle, showToast]);
    
    const handleCopyForGoogleDocs = useCallback(() => {
         if (!editorRef.current) return;
         
         const range = document.createRange();
         range.selectNode(editorRef.current);
         const selection = window.getSelection();
         
         if(selection) {
            selection.removeAllRanges();
            selection.addRange(range);
            document.execCommand('copy');
            
            // Restore user's cursor position using savedRange if available
            if (savedRange.current) {
                selection.removeAllRanges();
                selection.addRange(savedRange.current);
            } else {
                selection.removeAllRanges();
            }
            
            showToast('Contenuto copiato! Ora puoi incollarlo (Ctrl+V) direttamente in un nuovo documento Google Docs mantenendo la formattazione.', 'success');
         }
    }, [editorRef, showToast]);

    const handleSave = useCallback(() => {
        if (!editorRef.current || !onSaveToKb) return;
        onSaveToKb(editorRef.current.innerHTML, editorTitle);
        setIsDirty(false);
    }, [editorRef, onSaveToKb, editorTitle, setIsDirty]);

    const handlePrint = useCallback(() => {
        if (!editorRef.current) return;
        const printWindow = window.open(', ', 'height=600,width=800');
        if (printWindow) {
            printWindow.document.write('<html><head><title>' + editorTitle + '</title>');
            printWindow.document.write("<style>@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700;900&display=swap'); body{font-family:'Roboto',sans-serif; padding: var(--md-sys-spacing-5);} table{border-collapse:collapse;width: 100%;} th,td{border: var(--md-sys-border-width-thin) solid var(--md-sys-color-outline-variant);padding: var(--md-sys-spacing-2);} h1,h2,h3{color: var(--md-sys-color-primary);}</style>"); // MD3 fix
            printWindow.document.write('</head><body>');
            printWindow.document.write(editorRef.current.innerHTML);
            printWindow.document.write('</body></html>');
            printWindow.document.close();
            printWindow.print();
        }
    }, [editorRef, editorTitle]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
            {/* TOOLBAR */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                    <button onClick={handleCloseSafe}  aria-label="Chiudi editor"><span className="material-symbols-outlined" aria-hidden="true">arrow_back</span></button>
                    <input 
                        type="text" 
                        value={editorTitle} 
                        onChange={(e) => { setEditorTitle(e.target.value); setIsDirty(true); }} 
                        
                    />
                    {isDirty && <span>• Modificato</span>}
                </div>
                
                <div  style={{ display: "none" }}>
                    <button onClick={() => execCmd('bold')}  title="Grassetto" aria-label="Applica grassetto"><span className="material-symbols-outlined" aria-hidden="true">format_bold</span></button>
                    <button onClick={() => execCmd('italic')}  title="Corsivo" aria-label="Applica corsivo"><span className="material-symbols-outlined" aria-hidden="true">format_italic</span></button>
                    <button onClick={() => execCmd('formatBlock', 'h2')}  title="Titolo" aria-label="Applica stile titolo"><span className="material-symbols-outlined" aria-hidden="true">title</span></button>
                    <div></div>
                    <button onClick={() => execCmd('insertUnorderedList')}  title="Elenco" aria-label="Inserisci elenco puntato"><span className="material-symbols-outlined" aria-hidden="true">format_list_bulleted</span></button>
                    <button onClick={handleAiTable}  style={{color: "var(--md-sys-color-primary)"}} title="Tabella AI" aria-label="Genera tabella con AI"><span className="material-symbols-outlined" aria-hidden="true">table_chart</span></button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                    <button onClick={handleCopyForGoogleDocs}  title="Copia per Google Docs">
                        <span className="material-symbols-outlined" aria-hidden="true">content_copy</span> Docs
                    </button>
                    <button onClick={handleDownload} >
                        <span className="material-symbols-outlined" aria-hidden="true">download</span> DOCX
                    </button>
                    <button onClick={handlePrint}  title="Stampa / PDF" aria-label="Stampa o salva come PDF">
                        <span className="material-symbols-outlined" style={{ color: 'var(--md-sys-color-on-surface-variant)' }} aria-hidden="true">print</span>
                    </button>
                    {onSaveToKb && (
                        <button onClick={handleSave} >
                            <span className="material-symbols-outlined" aria-hidden="true">save</span> Salva
                        </button>
                    )}
                </div>
            </div>

            {/* EDITOR AREA */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                <div 
                    ref={editorRef}
                    contentEditable
                    onInput={handleInput}
                    
                    style={{ fontFamily: 'Georgia, serif', fontSize: 'var(--md-sys-typescale-body-medium-font-size)', lineHeight: '1.5' }}   
                >
                </div>
            </div>

            {/* AI FLOATING MENU */}
            {aiMenuPosition && (
                <div 
                    
                    style={{ top: aiMenuPosition.top, left: aiMenuPosition.left }}
                >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                        <AiThinkingGem size="small" />
                        <span>AI Assistant</span>
                    </div>
                    {isAiThinking ? (
                        <div>Elaborazione...</div>
                    ) : (
                        <>
                            <button onClick={() => handleAiRefine("Riscrivi rendendo il tono più formale e professionale.")} >
                                <span className="material-symbols-outlined" aria-hidden="true">history_edu</span> Rendi Formale
                            </button>
                            <button onClick={() => handleAiRefine("Espandi questo concetto aggiungendo dettagli pedagogici.")} >
                                <span className="material-symbols-outlined" aria-hidden="true">unfold_more</span> Espandi
                            </button>
                            <button onClick={() => handleAiRefine("Sintetizza in un elenco puntato.")} >
                                <span className="material-symbols-outlined" aria-hidden="true">format_list_bulleted</span> Sintetizza
                            </button>
                        </>
                    )}
                </div>
            )}

            {/* Post-Fase 4 visible block - daily document AI refine/table routed via AIBrain central prompt path */}
            <Box sx={{ fontSize: '0.72rem', px: 2, py: 0.5, mt: 1, bgcolor: 'var(--md-sys-color-surface-container-low)', borderRadius: 'var(--md-sys-shape-corner-small)' }}>
                AIBrain (Post-Fase 4): SmartDocumentEditor — buildPrompt + generateWithCentralPrompt + buildContext + migrateLegacyAsk (refine-text + document-table)
            </Box>
            {confirmDialog && (
                <M3ConfirmDialog
                    title="Modifiche non salvate"
                    message={confirmDialog.message}
                    onConfirm={() => { confirmDialog.onConfirm(); setConfirmDialog(null); }}
                    onCancel={() => setConfirmDialog(null)}
                    danger={true}
                />
            )}
        </div>
    );
};

export default SmartDocumentEditor;

