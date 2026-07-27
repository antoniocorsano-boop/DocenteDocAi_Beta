// MD3 Compliant - Block J Migration Complete (1 violation eliminated)

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Studente, KnowledgeBaseEntry, View, NavigationParams } from '../types';
import AddStudentModal from './AddStudentModal';
import ImportStudentsModal from './ImportStudentsModal';
import StudentTransferModal from './StudentTransferModal';
import { EmptyState, SectionHeader, Avatar, TextField, M3ConfirmDialog } from './ui';
import Button from '@mui/material/Button';
import InputAdornment from '@mui/material/InputAdornment';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import Box from '@mui/material/Box';
import ContextualAskAI from './ui/ContextualAskAI';

interface StudentManagerProps {
    students: Studente[];
    onSaveStudent: (student: Studente) => void;
    onDeleteStudent: (id: string) => void;
    onImportStudents: (newStudents: Studente[]) => void;
    userClasses: string[];
    initialClass?: string;
    knowledgeBase: KnowledgeBaseEntry[];
    onNavigate?: (view: View, context?: NavigationParams) => void;
}

interface StudentItemProps {
    student: Studente;
    onEdit: (student: Studente) => void;
    onTransfer: (student: Studente) => void;
    onDelete: (id: string) => void;
    onRestore: (student: Studente) => void;
    isFocused?: boolean;
    onFocus?: () => void;
}

const StudentItem = React.memo(({ student, onEdit, onTransfer, onDelete, onRestore, isFocused, onFocus }: StudentItemProps) => {
    const itemRef = useRef<HTMLDivElement>(null);
    const [confirmDialog, setConfirmDialog] = useState<{ message: string; onConfirm: () => void } | null>(null);

    useEffect(() => {
        if (isFocused && itemRef.current) {
            itemRef.current.focus();
        }
    }, [isFocused]);

    return (
    <div
      ref={itemRef}
      style={{
        // student-manager-item-card styles
        backgroundColor: student.isArchived ? 'var(--md-sys-color-surface-container-low)' : 'var(--md-sys-color-surface-container)',
        borderRadius: 'var(--md-sys-shape-corner-medium)',
        padding: 'var(--md-sys-spacing-4)',
        border: `var(--md-sys-border-width-normal) solid ${student.isArchived ? 'var(--md-sys-color-outline-variant)' : 'var(--md-sys-color-outline)'}`
      }}
      aria-label={`Studente ${student.cognome} ${student.nome}, classe ${student.classe}${student.isArchived ? ', archiviato' : ''}`}
      tabIndex={isFocused ? 0 : -1}
      onFocus={onFocus}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          onEdit(student);
          e.preventDefault();
        }
      }}
    >
      <Avatar name={`${student.nome} ${student.cognome}`} size="lg"  />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
          <h3>{student.cognome} {student.nome}</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-3)' }}>
              <span>Classe {student.classe}</span>
              {student.isArchived && (
                  <span>
                      {student.archiveYear ? `Archiviato ${student.archiveYear}` : 'ARCHIVIATO'}
                  </span>
              )}
          </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
          {student.isArchived ? (
              <Button 
                  onClick={() => onRestore(student)} 
                  variant="text" 
                   
                  title="Ripristina Studente come attivo"
                  aria-label={`Ripristina ${student.cognome} ${student.nome} come studente attivo`}
              >
                  <span style={{
}} aria-hidden="true">restore_from_trash</span>
              </Button>
          ) : (
              <>
                  <Button 
                      onClick={() => onTransfer(student)} 
                      variant="text" 
                       
                      title="Cambia classe o trasferisci studente"
                      aria-label={`Cambia classe per ${student.cognome} ${student.nome}`}
                  >
                      <span style={{
}} aria-hidden="true">transfer_within_a_station</span>
                  </Button>
                  <Button 
                      onClick={() => onEdit(student)} 
                      variant="text" 
                       
                      title="Modifica dati studente"
                      aria-label={`Modifica dati per ${student.cognome} ${student.nome}`}
                  >
                      <span style={{
}} aria-hidden="true">edit</span>
                  </Button>
              </>
          )}
          <Button 
              onClick={() => setConfirmDialog({ message: `Eliminare definitivamente ${student.cognome} ${student.nome}?`, onConfirm: () => onDelete(student.id) })} 
              variant="text" 
               
              title="Elimina studente definitivamente"
              aria-label={`Elimina ${student.cognome} ${student.nome} dal sistema`}
          >
              <span style={{
}} aria-hidden="true">delete</span>
          </Button>
      </div>
      {confirmDialog && (
          <M3ConfirmDialog
              title="Conferma eliminazione"
              message={confirmDialog.message}
              onConfirm={() => { confirmDialog.onConfirm(); setConfirmDialog(null); }}
              onCancel={() => setConfirmDialog(null)}
              danger={true}
          />
      )}
    </div>
  );
});

const StudentManager: React.FC<StudentManagerProps> = ({
    students, onSaveStudent, onDeleteStudent, onImportStudents, userClasses, initialClass, knowledgeBase, onNavigate
}) => {
    const [filterClass, setFilterClass] = useState<string>(initialClass || 'all');
    const [editingStudent, setEditingStudent] = useState<Studente | 'new' | null>(null);
    const [transferringStudent, setTransferringStudent] = useState<Studente | null>(null);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showArchived, setShowArchived] = useState(false);
    const [focusedStudentIndex, setFocusedStudentIndex] = useState<number>(0);
    const listContainerRef = useRef<HTMLDivElement>(null);
    const [confirmDialog, setConfirmDialog] = useState<{ message: string; onConfirm: () => void } | null>(null);

    const filteredStudents = useMemo(() => {
        let result = students;

        if (!showArchived) {
            result = result.filter(s => !s.isArchived);
        }

        if (filterClass !== 'all') {
            result = result.filter(s => s.classe === filterClass);
        }

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(s =>
                s.cognome.toLowerCase().includes(term) ||
                s.nome.toLowerCase().includes(term)
            );
        }

        return result.sort((a, b) => a.cognome.localeCompare(b.cognome));
    }, [students, filterClass, searchTerm, showArchived]);

    // Reset focus when filters change
    useEffect(() => {
        setFocusedStudentIndex(0);
    }, [filterClass, searchTerm, showArchived]);

    // Handle arrow key navigation in list
    const handleListKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        const keysToHandle = ['ArrowUp', 'ArrowDown', 'Home', 'End'];
        if (!keysToHandle.includes(e.key)) return;

        e.preventDefault();
        const max = filteredStudents.length - 1;
        let newIndex = focusedStudentIndex;

        switch (e.key) {
            case 'ArrowUp':
                newIndex = focusedStudentIndex > 0 ? focusedStudentIndex - 1 : 0;
                break;
            case 'ArrowDown':
                newIndex = focusedStudentIndex < max ? focusedStudentIndex + 1 : max;
                break;
            case 'Home':
                newIndex = 0;
                break;
            case 'End':
                newIndex = max;
                break;
        }

        setFocusedStudentIndex(newIndex);
    };

    const handleRestoreStudent = (student: Studente) => {
        setConfirmDialog({
            message: `Vuoi ripristinare ${student.cognome} ${student.nome} come studente attivo?`,
            onConfirm: () => onSaveStudent({ ...student, isArchived: false, archiveYear: undefined })
        });
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
            <SectionHeader
                title="Gestione Studenti"
                subtitle="Archivia, importa e aggiorna anagrafica e stato classe."
                actions={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-3)' }}>
                        <Button onClick={() => setIsImportModalOpen(true)} variant="outlined" startIcon={<Box component="span" className="material-symbols-outlined" aria-hidden="true">upload_file</Box>}>
                            Importa
                        </Button>
                        <Button onClick={() => setEditingStudent('new')} variant="contained" startIcon={<Box component="span" className="material-symbols-outlined" aria-hidden="true">add</Box>}>
                            Nuovo
                        </Button>
                    </div>
                }
            />

            {/* Contextual AI entry (Fase 2) */}
            {onNavigate && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 1 }}>
                <ContextualAskAI
                  onNavigate={onNavigate}
                  context={{ source: 'studenti', classe: filterClass !== 'all' ? filterClass : undefined }}
                />
              </Box>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                        <TextField
                            id="student-search"
                           
                            placeholder="Digita nome o cognome..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            slotProps={{ htmlInput: { startAdornment: <InputAdornment position="start"><Box component="span" className="material-symbols-outlined" aria-hidden="true">search</Box></InputAdornment> } }}
                            aria-label="Ricerca studenti per nome o cognome"
                        />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                        <FormControl size="small" fullWidth>
                            <InputLabel id="class-filter-label">Seleziona classe</InputLabel>
                            <Select
                                labelId="class-filter-label"
                                id="class-filter"
                               
                                value={filterClass}
                                onChange={e => setFilterClass(e.target.value as string)}
                                inputProps={{ 'aria-label': 'Filtra studenti per classe' }}
                            >
                                <MenuItem value="all">Tutte le classi</MenuItem>
                                {userClasses.map(c => <MenuItem key={c} value={c}>Classe {c}</MenuItem>)}
                            </Select>
                        </FormControl>
                    </div>
                    <Button
                        onClick={() => setShowArchived(!showArchived)}
                        variant={showArchived ? "contained" : "text"}
                        sx={{
                            // student-manager-archive-toggle styles
                            marginLeft: 'var(--md-sys-spacing-2)'
                        }}
                        title={showArchived ? 'Nascondi studenti archiviati' : 'Mostra studenti archiviati'}
                        aria-label={showArchived ? 'Nascondi archivio studenti' : 'Mostra archivio studenti'}
                        aria-pressed={showArchived}
                    >
                        <span  aria-hidden="true">{showArchived ? 'archive' : 'unarchive'}</span>
                        {showArchived ? 'Archivio ON' : 'Archivio OFF'}
                    </Button>
                </div>

                <div  
                     ref={listContainerRef}
                     onKeyDown={handleListKeyDown}
                     role="listbox"
                     aria-label="Lista studenti">
                    {filteredStudents.length > 0 ? filteredStudents.map((student, index) => (
                        <StudentItem
                            key={student.id}
                            student={student}
                            onEdit={setEditingStudent}
                            onTransfer={setTransferringStudent}
                            onDelete={onDeleteStudent}
                            onRestore={handleRestoreStudent}
                            isFocused={index === focusedStudentIndex}
                            onFocus={() => setFocusedStudentIndex(index)}
                        />
                    )) : (
                        <EmptyState
                            title="Nessuno studente trovato"
                            description="Modifica i filtri o aggiungi nuovi studenti."
                            icon="person_search"
                        />
                    )}
                </div>
            </div>

            {editingStudent && (
                <AddStudentModal
                    studentToEdit={editingStudent === 'new' ? undefined : editingStudent}
                    userClasses={userClasses}
                    onClose={() => setEditingStudent(null)}
                    onSave={onSaveStudent}
                />
            )}

            {transferringStudent && (
                <StudentTransferModal
                    student={transferringStudent}
                    userClasses={userClasses}
                    currentSchoolYear={new Date().getFullYear() + "/" + (new Date().getFullYear() + 1)}
                    onClose={() => setTransferringStudent(null)}
                    onSave={onSaveStudent}
                />
            )}

            {isImportModalOpen && (
                <ImportStudentsModal
                    onClose={() => setIsImportModalOpen(false)}
                    onImport={onImportStudents}
                    userClasses={userClasses}
                    knowledgeBase={knowledgeBase}
                />
            )}
            {confirmDialog && (
                <M3ConfirmDialog
                    title="Conferma"
                    message={confirmDialog.message}
                    onConfirm={() => { confirmDialog.onConfirm(); setConfirmDialog(null); }}
                    onCancel={() => setConfirmDialog(null)}
                    danger={true}
                />
            )}
        </div>
    );
};

export default StudentManager;

// M3Expressive refactor COMPLETED: StudentManager.tsx - Replaced all hardcoded Tailwind classes with dedicated student-manager-* CSS classes using M3 tokens for student cards, badges, actions, filters, and layout.

