import { Studente, Lezione, Uda } from '../types';

interface TemplateContext {
    teacherName: string;
    className?: string;
    subject?: string;
    year?: string;
    students?: Studente[];
    uda?: Uda[];
    lessons?: Lezione[];
}

export const getDocumentTemplate = (templateId: string, context: TemplateContext): string => {
    let content = "";

    switch (templateId) {
        case 'planning_doc':
            content = `
                <h1 style="text-align: center;">Progettazione Disciplinare</h1>
                <p style="text-align: center;"><strong>Docente:</strong> ${context.teacherName} | <strong>Classe:</strong> ${context.className || '___'} | <strong>Materia:</strong> ${context.subject || '___'}</p>
                <hr />
                <h2>1. Analisi della Situazione di Partenza</h2>
                <p>La classe è composta da ${context.students ? context.students.length : '___'} studenti. Il livello generale osservato nelle prime fasi è...</p>
                
                <h2>2. Obiettivi di Apprendimento</h2>
                <ul>
                    <li>Acquisire le conoscenze fondamentali della disciplina.</li>
                    <li>Sviluppare competenze di analisi e sintesi.</li>
                </ul>

                <h2>3. Unità di Apprendimento (UDA)</h2>
                <p>Durante l'anno verranno svolte le seguenti UDA:</p>
                ${context.uda ? `<ul>${context.uda.map(u => `<li><strong>${u.title}</strong>: ${u.introduction}</li>`).join('')}</ul>` : '<p>Da definire.</p>'}

                <h2>4. Metodologie e Valutazione</h2>
                <p>Si utilizzeranno lezioni frontali, lavori di gruppo e laboratori. La valutazione sarà formativa e sommativa.</p>
            `;
            break;

        case 'council_report':
            content = `
                <h1 style="text-align: center;">Relazione Finale del Docente</h1>
                <p><strong>Classe:</strong> ${context.className} | <strong>Materia:</strong> ${context.subject}</p>
                
                <h2>1. Svolgimento del Programma</h2>
                <p>Il programma preventivato è stato svolto regolarmente. Gli argomenti principali trattati sono stati...</p>

                <h2>2. Risultati Raggiunti</h2>
                <p>La classe ha mostrato un interesse <span style="background-color: yellow;">[buono/sufficiente/scarso]</span>. I risultati complessivi sono...</p>

                <h2>3. Criteri di Valutazione</h2>
                <p>Le valutazioni hanno tenuto conto dei progressi rispetto ai livelli di partenza.</p>
            `;
            break;
            
        case 'lesson_plan':
            content = `
                <h1>Piano di Lezione</h1>
                <p><strong>Data:</strong> ${new Date().toLocaleDateString()}</p>
                <h2>Obiettivi</h2>
                <ul><li>...</li></ul>
                <h2>Attività</h2>
                <p>Descrizione delle attività...</p>
            `;
            break;

        default:
            content = "<h1>Nuovo Documento</h1><p>Inizia a scrivere qui...</p>";
    }

    return content;
};

