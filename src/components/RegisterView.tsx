import React, { useState, useMemo } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import DialogTitle from '@mui/material/DialogTitle';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { RegisterEntry, RegisterViewProps, View } from '../types';
import InfoCard from './ui/InfoCard';
import ContextualAskAI from './ui/ContextualAskAI';

// Fase 3 continuation: Route daily register gestures through AIBrain
import { AIBrain } from '../ai/brain/AIBrain';

const RegisterView: React.FC<RegisterViewProps> = ({ entries, lessons, students, isModalMode = false, initialClass, onNavigate }) => {
  const [selectedEntry, setSelectedEntry] = useState<RegisterEntry | null>(null);

  // Fase 3 continuation (user-centric daily gesture): Real AIBrain consumption in RegisterView
  const registerContext = useMemo(() => AIBrain.buildContext({
    source: 'register-view',
    extra: { entriesCount: entries.length, initialClass }
  }), [entries.length, initialClass]);

  const registerRecs = useMemo(() => {
    try {
      return AIBrain.getUnifiedRecommendations(registerContext);
    } catch {
      return null;
    }
  }, [registerContext]);

  const [registerAiTip, setRegisterAiTip] = React.useState<string | null>(null);
  const [registerAiLoading, setRegisterAiLoading] = React.useState(false);

  const fetchRegisterAiTip = React.useCallback(async () => {
    setRegisterAiLoading(true);
    try {
      const res = await AIBrain.ask({
        prompt: `Suggerisci un insight rapido per il registro di classe ${initialClass || 'corrente'}.`,
        context: registerContext,
        mode: 'balanced'
      });
      setRegisterAiTip(res.content);
      if (import.meta.env.DEV) {
        AIBrain.migrateLegacyAsk('legacy-register', registerContext).catch(() => {});
      }
    } catch {
      setRegisterAiTip('Impossibile ottenere suggerimento AIBrain.');
    } finally {
      setRegisterAiLoading(false);
    }
  }, [initialClass, registerContext]);

  const filteredEntries = useMemo(() => {
    if (!initialClass) {
        return entries;
    }
    return entries.filter(entry => entry.classe === initialClass);
  }, [entries, initialClass]);

  const getStudentName = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    return student ? `${student.cognome} ${student.nome}` : 'Studente non trovato';
  };

  const renderEntryDetails = (entry: RegisterEntry) => {
    const lesson = lessons[entry.lessonId];
    const presentStudents = Object.entries(entry.studentAttendance)
        .filter(([, status]) => status === 'presente')
        .map(([studentId]) => getStudentName(studentId));
    
    const absentStudents = Object.entries(entry.studentAttendance)
        .filter(([, status]) => status === 'assente')
        .map(([studentId]) => getStudentName(studentId));

    return (
      <Dialog
        open
        onClose={() => setSelectedEntry(null)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Dettaglio Lezione Svolta
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="h6">
                  {new Date(entry.date).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </Typography>
              <Typography variant="body1">Registro di Classe</Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <InfoCard title="Informazioni Lezione" icon="info">
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Typography variant="body2"><strong>Classe:</strong> {entry.classe}</Typography>
                      <Typography variant="body2"><strong>Materia:</strong> {entry.materia}</Typography>
                      <Typography variant="body2"><strong>Argomento:</strong> {lesson?.contenuto || 'N/A'}</Typography>
                  </Box>
              </InfoCard>

              <InfoCard title="Appello" icon="group">
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Typography variant="body2"><strong>Presenti:</strong> {presentStudents.length}/{Object.keys(entry.studentAttendance).length}</Typography>
                      <Typography variant="body2"><strong>Assenti:</strong> {absentStudents.length > 0 ? absentStudents.join(', ') : 'Nessuno'}</Typography>
                  </Box>
              </InfoCard>
            </Box>

            <InfoCard title="Note e Osservazioni" icon="notes">
              <Typography variant="body2">
                  {entry.notes || 'Nessuna nota registrata per questa lezione.'}
              </Typography>
            </InfoCard>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button variant="text" onClick={() => setSelectedEntry(null)}>Chiudi</Button>
        </DialogActions>
      </Dialog>
    );
  };
  
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {!isModalMode && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="h4">Diario di Bordo {initialClass && ` - ${initialClass}`}</Typography>
            <Typography variant="body1">Registro sintetico delle lezioni.</Typography>
          </Box>

          {/* Contextual AI entry (Fase 2) */}
          {onNavigate && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-start', mt: 1 }}>
              <ContextualAskAI
                onNavigate={onNavigate}
                context={{ source: 'register', classe: initialClass }}
              />
            </Box>
          )}

          {/* Fase 3 continuation: Real AIBrain consumption + visible block (daily register gesture) */}
          {registerRecs?.primary && (
            <Box sx={{ mt: 1, p: 1.5, borderRadius: 'var(--md-sys-shape-corner-medium)', bgcolor: 'var(--md-sys-color-primary-container)' }}>
              <Typography variant="caption" sx={{ color: 'var(--md-sys-color-on-primary-container)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box component="span" className="material-symbols-outlined" sx={{ fontSize: '1rem' }}>auto_awesome</Box>
                AIBrain (Fase 3): {registerRecs.primary.label || registerRecs.primary.title}
              </Typography>
            </Box>
          )}

          <Box sx={{ mt: 1, mb: 2, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Button
              size="small"
              variant="outlined"
              onClick={fetchRegisterAiTip}
              disabled={registerAiLoading}
              startIcon={<Box component="span" className="material-symbols-outlined" sx={{ fontSize: '1rem' }}>auto_awesome</Box>}
            >
              {registerAiLoading ? 'AIBrain…' : 'Insight AIBrain (Registro)'}
            </Button>
            {registerAiTip && (
              <Box sx={{ p: 1, borderRadius: 'var(--md-sys-shape-corner-small)', bgcolor: 'var(--md-sys-color-tertiary-container)', flex: 1, minWidth: 180 }}>
                <Typography variant="caption" sx={{ color: 'var(--md-sys-color-on-tertiary-container)', fontWeight: 500 }}>
                  AIBrain (Fase 3): {registerAiTip}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      )}
      <Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Classe</th>
                <th>Materia</th>
                <th>Argomento</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(entry => {
                const lesson = lessons[entry.lessonId];
                return (
                  <tr key={entry.id} onClick={() => setSelectedEntry(entry)}>
                    <td>{new Date(entry.date).toLocaleDateString('it-IT')}</td>
                    <td>{entry.classe}</td>
                    <td>{entry.materia}</td>
                    <td>{lesson?.contenuto || 'Lezione improvvisata'}</td>
                    <td>
                      <Box component="span" className="material-symbols-outlined" aria-hidden="true">chevron_right</Box>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Box>
        {filteredEntries.length === 0 && <Typography variant="body2">Nessuna lezione registrata per questa classe.</Typography>}
      </Box>
      {selectedEntry && renderEntryDetails(selectedEntry)}
    </Box>
  );
};

export default RegisterView;

