// @ts-nocheck
import { describe, it, expect, beforeEach } from "vitest";
import { useStudentStore } from "../../src/stores/useStudentStore";
import { Studente, Valutazione, ValutazioneCompetenza } from "../../src/types";

describe("useStudentStore", () => {
  beforeEach(() => {
    useStudentStore.getState().actions.resetStudentData();
  });

  // Students Tests
  describe("Students", () => {
    it("dovrebbe inizializzare con array vuoto di studenti", () => {
      expect(useStudentStore.getState().students).toEqual([]);
    });

    it("dovrebbe aggiungere studenti", () => {
      const students: Studente[] = [
        { id: "s1", nome: "Marco", cognome: "Verdi", classe: "III-A" },
        { id: "s2", nome: "Luca", cognome: "Bianchi", classe: "III-A" },
      ];

      useStudentStore.getState().actions.setStudents(students);
      expect(useStudentStore.getState().students).toEqual(students);
      expect(useStudentStore.getState().students.length).toBe(2);
    });

    it("dovrebbe aggiornare studenti tramite funzione", () => {
      const initialStudents: Studente[] = [
        { id: "s1", nome: "Marco", cognome: "Verdi", classe: "III-A" },
      ];

      useStudentStore.getState().actions.setStudents(initialStudents);
      
      // Aggiungi uno studente tramite funzione
      useStudentStore.getState().actions.setStudents((prev: Studente[]) => [
        ...prev,
        { id: "s2", nome: "Luca", cognome: "Bianchi", classe: "III-A" },
      ]);

      expect(useStudentStore.getState().students.length).toBe(2);
    });
  });

  // Evaluations Tests
  describe("Evaluations", () => {
    it("dovrebbe inizializzare con array vuoto di valutazioni", () => {
      expect(useStudentStore.getState().evaluations).toEqual([]);
    });

    it("dovrebbe impostare valutazioni", () => {
      const evaluations: Valutazione[] = [
        {
          id: "v1",
          studenteId: "s1",
          materia: "Italiano",
          tipo: "Scritto",
          voto: "8",
          data: "2024-12-20",
        },
        {
          id: "v2",
          studenteId: "s1",
          materia: "Matematica",
          tipo: "Orale",
          voto: "7",
          data: "2024-12-19",
        },
      ];

      useStudentStore.getState().actions.setEvaluations(evaluations);
      expect(useStudentStore.getState().evaluations).toEqual(evaluations);
      expect(useStudentStore.getState().evaluations.length).toBe(2);
    });

    it("dovrebbe aggiungere valutazioni tramite funzione", () => {
      const firstEval: Valutazione = {
        id: "v1",
        studenteId: "s1",
        materia: "Italiano",
        tipo: "Scritto",
        voto: "8",
        data: "2024-12-20",
      };

      useStudentStore.getState().actions.setEvaluations([firstEval]);
      
      useStudentStore.getState().actions.setEvaluations((prev: Valutazione[]) => [
        ...prev,
        {
          id: "v2",
          studenteId: "s1",
          materia: "Matematica",
          tipo: "Orale",
          voto: "7",
          data: "2024-12-19",
        },
      ]);

      expect(useStudentStore.getState().evaluations.length).toBe(2);
    });
  });

  describe("Competency Evaluations", () => {
    it("dovrebbe inizializzare con array vuoto di competency evals", () => {
      expect(useStudentStore.getState().competencyEvals).toEqual([]);
    });

    it("dovrebbe impostare valutazioni competenza", () => {
      const competencyEvals: ValutazioneCompetenza[] = [
        {
          id: "c1",
          studenteId: "s1",
          competenzaId: "comp1",
          livelloId: "lvl_a",
          data: "2024-12-20",
          materia: "Italiano",
        },
      ];

      useStudentStore.getState().actions.setCompetencyEvals(competencyEvals);
      expect(useStudentStore.getState().competencyEvals).toEqual(competencyEvals);
    });

    it("dovrebbe impostare valutazioni competenza anche tramite funzione", () => {
      const competencyEvals: ValutazioneCompetenza[] = [
        { id: "c1", studenteId: "s1", competenzaId: "comp1", livelloId: "lvl_a", data: "2024-12-20", materia: "Italiano" }
      ];
      useStudentStore.getState().actions.setCompetencyEvals(competencyEvals);
      useStudentStore.getState().actions.setCompetencyEvals((prev) => [...prev, { id: "c2", studenteId: "s2", competenzaId: "comp2", livelloId: "lvl_b", data: "2024-12-21", materia: "Storia" }]);
      expect(useStudentStore.getState().competencyEvals).toHaveLength(2);
    });
  });

  describe("Other Setters with Function Updater", () => {
    it("dovrebbe impostare piani inclusione anche tramite funzione", () => {
      const piani = { "p1": { id: "p1", studenteId: "s1", tipo: "PDP" } };
      useStudentStore.getState().actions.setPianiInclusione(piani);
      useStudentStore.getState().actions.setPianiInclusione((prev) => ({ ...prev, "p2": { id: "p2", studenteId: "s2", tipo: "PEI" } }));
      expect(Object.keys(useStudentStore.getState().pianiInclusione)).toHaveLength(2);
    });

    it("dovrebbe impostare attivit� orientamento anche tramite funzione", () => {
      const activities = [{ id: "a1", title: "A1" }];
      useStudentStore.getState().actions.setOrientamentoActivities(activities);
      useStudentStore.getState().actions.setOrientamentoActivities((prev) => [...prev, { id: "a2", title: "A2" }]);
      expect(useStudentStore.getState().orientamentoActivities).toHaveLength(2);
    });

    it("dovrebbe impostare voci e-portfolio anche tramite funzione", () => {
      const entries = [{ id: "e1", title: "E1" }];
      useStudentStore.getState().actions.setEPortfolioEntries(entries);
      useStudentStore.getState().actions.setEPortfolioEntries((prev) => [...prev, { id: "e2", title: "E2" }]);
      expect(useStudentStore.getState().ePortfolioEntries).toHaveLength(2);
    });

    it("dovrebbe impostare stati orientamento studente anche tramite funzione", () => {
      const states = { "s1": { studentId: "s1", completed: true } };
      useStudentStore.getState().actions.setStudentOrientamentoStates(states);
      useStudentStore.getState().actions.setStudentOrientamentoStates((prev) => ({ ...prev, "s2": { studentId: "s2", completed: false } }));
      expect(Object.keys(useStudentStore.getState().studentOrientamentoStates)).toHaveLength(2);
    });
  });

  // Student Profile Context
  describe("Student Profile Context", () => {
    it("dovrebbe inizializzare senza student context", () => {
      expect(useStudentStore.getState().studentProfileContext).toBeNull();
    });

    it("dovrebbe impostare student context", () => {
      const student: Studente = {
        id: "s1",
        nome: "Marco",
        cognome: "Verdi",
        classe: "III-A",
      };

      useStudentStore.getState().actions.setStudentProfileContext(student);
      expect(useStudentStore.getState().studentProfileContext).toEqual(student);
    });
  });

  // Class Selection
  describe("Class Selection for Dashboard", () => {
    it("dovrebbe inizializzare senza classe selezionata", () => {
      expect(useStudentStore.getState().selectedClassForDashboard).toBeNull();
    });

    it("dovrebbe impostare classe selezionata", () => {
      useStudentStore.getState().actions.setSelectedClassForDashboard("III-A");
      expect(useStudentStore.getState().selectedClassForDashboard).toBe("III-A");
    });

    it("dovrebbe permettere di deselezionare la classe", () => {
      useStudentStore.getState().actions.setSelectedClassForDashboard("III-A");
      useStudentStore.getState().actions.setSelectedClassForDashboard(null);
      expect(useStudentStore.getState().selectedClassForDashboard).toBeNull();
    });
  });

  describe("Evaluation Helpers", () => {
    it("dovrebbe aggiungere, aggiornare e eliminare una valutazione", () => {
      const { addEvaluation, updateEvaluation, deleteEvaluation } = useStudentStore.getState().actions;
      addEvaluation({ studenteId: "s1", materia: "Italiano", tipo: "Scritto", voto: "8", data: "2024-12-20" });
      const evals = useStudentStore.getState().evaluations;
      expect(evals).toHaveLength(1);
      const id = evals[0].id;
      
      updateEvaluation(id, { voto: "9" });
      expect(useStudentStore.getState().evaluations[0].voto).toBe("9");
      // Test update with non-existent id
      updateEvaluation('non-existent', { voto: '10' });
      expect(useStudentStore.getState().evaluations[0].voto).toBe('9');      
      deleteEvaluation(id);
      expect(useStudentStore.getState().evaluations).toHaveLength(0);
    });
  });

  describe("Orientamento and E-Portfolio", () => {
    it("dovrebbe impostare attivit� orientamento", () => {
      const activities = [{ id: "a1", title: "Test Activity" }];
      useStudentStore.getState().actions.setOrientamentoActivities(activities);
      expect(useStudentStore.getState().orientamentoActivities).toEqual(activities);
    });

    it("dovrebbe impostare voci e-portfolio", () => {
      const entries = [{ id: "e1", title: "Test Entry" }];
      useStudentStore.getState().actions.setEPortfolioEntries(entries);
      expect(useStudentStore.getState().ePortfolioEntries).toEqual(entries);
    });

    it("dovrebbe impostare stati orientamento studente", () => {
      const states = { "s1": { studentId: "s1", completed: true } };
      useStudentStore.getState().actions.setStudentOrientamentoStates(states);
      expect(useStudentStore.getState().studentOrientamentoStates).toEqual(states);
    });
  });

  describe("Student Management", () => {
    it("dovrebbe salvare e eliminare uno studente", () => {
      const student: Studente = { id: "s1", nome: "Marco", cognome: "Verdi", classe: "III-A" };
      useStudentStore.getState().actions.saveStudent(student);
      expect(useStudentStore.getState().students).toContain(student);
      
      const updatedStudent = { ...student, nome: "Marco Updated" };
      useStudentStore.getState().actions.saveStudent(updatedStudent);
      expect(useStudentStore.getState().students[0].nome).toBe("Marco Updated");
      
      useStudentStore.getState().actions.deleteStudent("s1");
      expect(useStudentStore.getState().students).toHaveLength(0);
    });

    it("dovrebbe importare studenti e valutazioni", () => {
      const students = [{ id: "s1", nome: "Marco", cognome: "Verdi", classe: "III-A" }];
      useStudentStore.getState().actions.importStudents(students);
      expect(useStudentStore.getState().students).toHaveLength(1);
      
      // Import same student should not duplicate
      useStudentStore.getState().actions.importStudents(students);
      expect(useStudentStore.getState().students).toHaveLength(1);
      
      const evaluations = [{ id: "v1", studenteId: "s1", materia: "Italiano", tipo: "Scritto", voto: "8", data: "2024-12-20" }];
      useStudentStore.getState().actions.importEvaluations(evaluations);
      expect(useStudentStore.getState().evaluations).toHaveLength(1);
    });
  });

  describe("Inclusion Management", () => {
    it("dovrebbe salvare e eliminare un piano inclusione", () => {
      const piano = { id: "p1", studenteId: "s1", tipo: "PDP" };
      useStudentStore.getState().actions.savePianoInclusione(piano);
      expect(useStudentStore.getState().pianiInclusione["p1"]).toEqual(piano);
      
      useStudentStore.getState().actions.deletePianoInclusione("p1");
      expect(useStudentStore.getState().pianiInclusione["p1"]).toBeUndefined();
    });
  });

  describe("Backup and Reset", () => {
    it("dovrebbe caricare dal backup", () => {
      const backup = { students: [{ id: "s-b", nome: "Backup", cognome: "User", classe: "I-A" }] };
      useStudentStore.getState().actions.loadFromBackup(backup);
      expect(useStudentStore.getState().students).toEqual(backup.students);
    });
  });
});

