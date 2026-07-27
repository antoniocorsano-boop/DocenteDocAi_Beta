export const mockStudents: Studente[] = [
  { id: '1', nome: 'Mario', cognome: 'Rossi', classe: '1A' },
  { id: '2', nome: 'Luca', cognome: 'Bianchi', classe: '1A' },
  { id: '3', nome: 'Anna', cognome: 'Verdi', classe: '1B' },
  // Add more for testing large lists if needed
];

export const mockLessons: Lezione[] = [
  { id: '1', materia: 'Math', contenuto: 'Algebra basics', classe: '1A', svolta: false },
  { id: '2', materia: 'Science', contenuto: 'Physics intro', classe: '1A', svolta: true },
  // Add more
];

export const mockSubmissions: HomeworkSubmission[] = [
  { id: '1', studentId: '1', lessonId: '1', content: 'Homework content', status: 'pending' },
  // Add more
];