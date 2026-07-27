# 🚀 DocenteDoc AI - Quick Reference

> **Guida rapida per sviluppatori e manutentori**

---

## 📦 COSA È

**DocenteDoc AI** = Registro Elettronico + AI Assistant + Knowledge Base + Analytics

- **PWA React/TypeScript** con Google Gemini integrato
- **Privacy-first:** LocalStorage + IndexedDB + Google Drive personale
- **M3 Expressive Design System**
- **130+ componenti React**, 10 servizi, 4 custom hooks

---

## 🏗️ ARCHITETTURA RAPIDA

```
src/
├── components/          # 130+ componenti UI
│   ├── App.tsx         # Root component
│   ├── ViewManager.tsx # Router interno
│   ├── Home.tsx        # Dashboard principale
│   ├── M3Components.tsx # Libreria componenti atomici
│   └── ...
├── services/           # Business logic
│   ├── aiService.ts    # Integrazione Gemini
│   ├── googleDriveService.ts
│   ├── kbIndexedDbService.ts
│   └── ...
├── hooks/              # Custom hooks
│   └── useAppEngine.ts # Hook principale app
├── stores/             # State management
├── utils/              # Helper functions
├── design-system/      # Token CSS M3
├── types.ts            # TypeScript interfaces (30k+ linee)
└── constants.ts        # Configurazioni globali
```

---

## 🎯 COMPONENTI CHIAVE

### Core App
- `App.tsx` → Shell principale
- `ViewManager.tsx` → Router viste (home, orario, progetta, aula, valutazione, analytics, settings)
- `useAppEngine.ts` → Hook centrale stato + azioni

### Navigazione
- `Header.tsx` → Barra superiore + notifiche
- `Menu.tsx` → Bottom navigation bar
- `OperationsCenter.tsx` → Hub operazioni complesse

### AI Features
- `AiAdvisor.tsx` → Consulente AI contestuale
- `LiveAssistant.tsx` → Assistente vocale live
- `Studio.tsx` → Generazione contenuti AI
- `KnowledgeBase.tsx` → RAG system

### Didattica
- `Timetable.tsx` → Orario settimanale
- `ClassroomView.tsx` → Modalità aula
- `LessonView.tsx` → Dettaglio lezione
- `UdaPlanner.tsx` → Pianificatore UDA

### Valutazione
- `EvaluationModule.tsx` → Gestione voti
- `UnifiedEvaluationModal.tsx` → Voto + competenza
- `StudentProfile.tsx` → Profilo studente

### Analytics
- `AnalyticsHub.tsx` → Dashboard grafici
- `ClassDashboard.tsx` → Analytics classe
- `ReportisticaHub.tsx` → Export report

---

## 🔧 COMANDI PRINCIPALI

```bash
# Sviluppo
npm run dev              # Avvia dev server (Vite)

# Build
npm run build            # Build produzione
npm run preview          # Preview build

# Testing
npm run test             # Vitest
npm run lint             # ESLint
npm run format           # Prettier

# Deployment
# L'app è deployabile su qualsiasi hosting statico
# (Vercel, Netlify, GitHub Pages, ecc.)
```

---

## 🎨 DESIGN SYSTEM

### CSS Architecture

```
index.tsx
  ↓
├── theme.css          # Token M3 (colori, elevazioni)
├── layout.css         # Layout utilities (flex, grid)
├── components.css     # Stili componenti base
├── logo.css           # Logo animato
└── modules.css        # Stili moduli specifici
```

### Token Principali

```css
/* Colori */
--sys-primary
--sys-secondary
--sys-tertiary
--sys-error
--sys-surface
--sys-on-surface

/* Elevazioni */
--elevation-1 (2dp)
--elevation-2 (4dp)
--elevation-3 (8dp)

/* Spaziature */
--spacing-xs (4px)
--spacing-sm (8px)
--spacing-md (16px)
--spacing-lg (24px)
--spacing-xl (32px)
```

---

## 🗄️ GESTIONE DATI

### LocalStorage (Sync)
```typescript
// Chiavi principali
'app_state'              // Stato completo app
'timetable_settings'     // Configurazione orario
'user_profile'           // Profilo utente
'theme_state'            // Tema attivo
```

### IndexedDB (Async)
```typescript
// Database: 'OrarioDocDB'
// Store: 'knowledgeBase'
// Documenti pesanti (PDF, DOCX) + embeddings RAG
```

### Google Drive
```typescript
// File backup: 'OrarioDoc_Backup_YYYY-MM-DD.json'
// Cartella: configurabile dall'utente
// Sync: manuale o automatico (intervallo configurabile)
```

---

## 🤖 AI INTEGRATION

### Modelli Disponibili

```typescript
AI_PROFILES = {
  rapido: {
    model: 'gemini-2.5-flash',
    use: 'Chat, note brevi, task quotidiani'
  },
  esperto: {
    model: 'gemini-3-pro-preview',
    use: 'UDA, report, ragionamento complesso'
  }
}
```

### Funzioni AI Principali

```typescript
// services/aiService.ts

generateLessonContent()      // Genera bozza lezione
generateTestQuestions()      // Genera verifica
analyzeImage()               // OCR + interpretazione
analyzeVideo()               // Trascrizione + riassunto
generateUdaPhases()          // Genera fasi UDA
suggestGrades()              // Suggerisce voti
generateJudgment()           // Genera giudizio sintetico
```

---

## 📊 TYPES PRINCIPALI

```typescript
// types.ts

interface Lezione {
  id: string;
  classe: string;
  materia: string;
  contenuto: string;
  svolta: boolean;
  tipoLezione?: 'Teoria' | 'Disegno' | 'Laboratorio' | ...;
  obiettivi?: string;
  compiti?: string;
  materialiDidattici?: MaterialeDidattico[];
}

interface Studente {
  id: string;
  nome: string;
  cognome: string;
  classe: string;
  dataNascita?: string;
  history?: StudentHistoryRecord[];
}

interface Valutazione {
  id: string;
  studenteId: string;
  materia: string;
  data: string;
  tipo: 'Scritto' | 'Orale' | 'Pratico' | ...;
  voto: string;
  argomento?: string;
}

interface Uda {
  id: string;
  title: string;
  classe: string;
  materia: string;
  introduction: string;
  finalProduct: string;
  competencyIds: string[];
  phases: UdaPhase[];
}

interface AppState {
  user: UserProfile | null;
  students: Studente[];
  lessons: Record<string, Lezione>;
  slots: Record<string, Slot>;
  evaluations: Valutazione[];
  udas: Uda[];
  // ... molti altri
}
```

---

## 🔐 CONFIGURAZIONE

### .env.local

```bash
# Obbligatorio
GEMINI_API_KEY=your_gemini_api_key_here

# Opzionali (già configurati in constants.ts)
# GOOGLE_CLIENT_ID=...
# GOOGLE_API_KEY=...
```

### constants.ts

```typescript
// Configurazioni globali
DEFAULT_TIMETABLE_SETTINGS
DEFAULT_COMPETENZE
SCHOOL_TYPES_DISCIPLINES
THEME_CUSTOMIZATIONS
AI_PROFILES
KB_CATEGORIES
```

---

## 🎓 WORKFLOW SVILUPPO

### 1. Setup Iniziale
```bash
git clone <repo>
cd docentedoc-ai
npm install
# Crea .env.local con GEMINI_API_KEY
npm run dev
```

### 2. Aggiungere Nuova Funzionalità

**Pattern consigliato:**

1. **Definire Type** in `types.ts`
2. **Creare Service** in `services/` (se logica business)
3. **Creare Component** in `components/`
4. **Aggiungere a ViewManager** (se nuova vista)
5. **Aggiornare useAppEngine** (se nuovo stato/azione)
6. **Testare** con Vitest

### 3. Modificare Design

1. **Token:** Editare `src/theme.css`
2. **Layout:** Editare `src/layout.css`
3. **Componenti:** Editare `src/components.css` o `src/modules.css`

---

## 🐛 DEBUG TIPS

### LocalStorage Inspector

```javascript
// Console browser
localStorage.getItem('app_state')
localStorage.getItem('timetable_settings')

// Clear tutto
localStorage.clear()
```

### IndexedDB Inspector

```javascript
// Chrome DevTools → Application → IndexedDB → OrarioDocDB
```

### AI Debugging

```typescript
// services/aiService.ts
// Aggiungere console.log nei prompt per vedere cosa viene inviato
console.log('Prompt:', prompt);
console.log('Response:', response);
```

---

## 📱 PWA TESTING

### Desktop
```bash
npm run build
npm run preview
# Apri Chrome → DevTools → Application → Manifest
# Verifica Service Worker
```

### Mobile
```bash
# Usa ngrok o simili per HTTPS
npx ngrok http 5173
# Apri URL su mobile
# Testa "Aggiungi a Home"
```

---

## 🚀 DEPLOYMENT

### Build Produzione

```bash
npm run build
# Output in dist/
```

### Hosting Consigliati

- **Vercel:** `vercel deploy`
- **Netlify:** Drag & drop `dist/`
- **GitHub Pages:** `npm run build` + push `dist/`
- **Firebase Hosting:** `firebase deploy`

### Configurazione HTTPS

⚠️ **IMPORTANTE:** PWA richiede HTTPS in produzione!

---

## 📚 RISORSE UTILI

### Documentazione Interna
- `docs/README.md` → Overview filosofia
- `docs/USE_CASES.md` → Casi d'uso dettagliati
- `docs/ARCHITECTURE.md` → Architettura tecnica
- `docs/ROADMAP.md` → Sviluppi futuri
- `ANALISI_APPLICAZIONE.md` → Analisi completa (questo documento)

### Link Esterni
- [React Docs](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Guide](https://vitejs.dev/guide/)
- [Google GenAI SDK](https://ai.google.dev/docs)
- [Material Design 3](https://m3.material.io)

---

## 🎯 CHECKLIST MANUTENZIONE

### Mensile
- [ ] Aggiornare dipendenze (`npm outdated`)
- [ ] Verificare API Gemini (rate limits, nuovi modelli)
- [ ] Testare backup Google Drive

### Trimestrale
- [ ] Review codice componenti più usati
- [ ] Ottimizzazione bundle size
- [ ] Audit accessibilità (WCAG)
- [ ] Test cross-browser

### Annuale
- [ ] Aggiornamento major dependencies
- [ ] Revisione design system
- [ ] Analisi feedback utenti
- [ ] Pianificazione nuove features

---

## 🏆 BEST PRACTICES

### Code Style
- ✅ TypeScript strict mode
- ✅ ESLint + Prettier configurati
- ✅ Naming: PascalCase (componenti), camelCase (funzioni/variabili)
- ✅ File: `ComponentName.tsx` per componenti

### Performance
- ✅ Lazy loading componenti pesanti
- ✅ Memoization con `useMemo`/`useCallback`
- ✅ Debounce input utente
- ✅ Virtual scrolling per liste lunghe

### Accessibilità
- ✅ Semantic HTML
- ✅ ARIA labels
- ✅ Keyboard navigation
- ✅ Focus management

### Security
- ✅ Sanitize user input
- ✅ CSP headers
- ✅ No eval()
- ✅ Secure localStorage (no dati sensibili in chiaro)

---

**Ultimo aggiornamento:** 21 Dicembre 2025  
**Versione App:** 4.0.0 RC1
