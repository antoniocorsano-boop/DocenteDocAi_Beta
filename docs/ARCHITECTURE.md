# DocenteDoc AI — Architettura Sistema

**Aggiornato:** 2026-03-08 (post-migrazione MUI v7 completa)

---

## Stack Tecnologico

| Layer         | Tecnologia                                      | Note                                       |
| ------------- | ----------------------------------------------- | ------------------------------------------ |
| UI Framework  | React 18 + TypeScript                           | Strict mode attivo                         |
| Design System | MUI v7 (`@mui/material ^7.3.9`)                 | Tema centralizzato con bridge token MD3    |
| Tema          | `src/theme/muiTheme.ts` + `M3ThemeProvider.tsx` | CSS custom properties `var(--md-sys-*)`    |
| State         | Zustand (store separati per dominio)            | Nessun Context-per-stato globale           |
| Build         | Vite + Rollup                                   | Chunk splitting manuale per vendor pesanti |
| Testing       | Vitest + React Testing Library + Playwright     | 99 test file, 1214+ test                   |
| PWA           | vite-plugin-pwa (injectManifest)                | Service worker in `src/sw.ts`              |
| Deploy        | Vercel                                          | Config in `vercel.json`                    |

---

## Struttura Directory `src/`

```
src/
├── components/          # Componenti UI applicativi
│   ├── ui/              # Componenti UI riutilizzabili (design system layer)
│   ├── settings/        # Pannelli impostazioni
│   ├── App.tsx          # Root applicativo, routing a view
│   └── AppLayout.tsx    # Shell: Header + NavRail/BottomNav + SecondaryDrawer
├── context/             # React Context (solo ModalContext)
├── contexts/            # ThemeContext, ModalContext (legacy unificazione in corso)
├── hooks/               # Custom hooks (useAppEngine, usePersistence, ecc.)
├── nka/                 # Modulo NKA Knowledge Assessment (gamification)
├── services/            # Servizi applicativi (AI, backup, storage, register)
├── stores/              # Zustand stores per dominio
├── theme/               # Tema MUI + token MD3
│   ├── muiTheme.ts      # Tema MUI v7 centralizzato
│   ├── M3ThemeProvider.tsx  # Provider che monta ThemeProvider MUI
│   ├── tokens.ts        # Token MD3 (CSS custom properties)
│   └── md3ZIndex.ts     # Z-index centralizzati
├── types/               # Tipi TypeScript condivisi
└── utils/               # Utility pure
```

---

## Design System

### Regola Fondamentale

Tutti i componenti UI producono markup MUI v7. Non esistono più wrapper `M3*` attivi eccetto:

| Componente               | Motivo di mantenimento                                           |
| ------------------------ | ---------------------------------------------------------------- |
| `M3Dialog.tsx`           | 64+ consumer; gestisce close/keyboard/backdrop in modo unificato |
| `M3Popover.tsx`          | Positioning viewport-aware custom                                |
| `TextField.tsx` (custom) | Smart wrapper con `leadingIcon` / `InputAdornment`               |

### Tema

`src/theme/muiTheme.ts` mappa i token MD3 (`var(--md-sys-color-*)`, `var(--md-sys-typescale-*)`) sui slot del tema MUI. Il file `src/styles/` contiene CSS globali; `src/components/ui/ui-components.css` contiene classi utility ancora in uso.

### Chunk Vendor (Rollup)

| Chunk          | Contenuto                                     |
| -------------- | --------------------------------------------- |
| `react-vendor` | `react`, `react-dom`, `scheduler`, `react-is` |
| `mui-vendor`   | `@mui/material`, `@emotion/*`                 |
| `ai-vendor`    | `@google/genai`                               |
| `pdf-vendor`   | `jspdf`, `pdf-lib`, `mammoth`, `docx` (lazy)  |
| `xlsx-vendor`  | `xlsx` (lazy)                                 |
| `dnd-vendor`   | `@dnd-kit/*` (lazy)                           |
| `chart-vendor` | `recharts`, `d3`, `chart.js`                  |
| `vendor`       | tutti gli altri `node_modules`                |

---

## State Management

### Zustand Stores (`src/stores/`)

| Store              | Dominio                               |
| ------------------ | ------------------------------------- |
| `useAcademicStore` | Classi, UDA, pianificazione annuale   |
| `useStudentStore`  | Studenti, valutazioni, competenze     |
| `useSettingsStore` | Impostazioni docente e app            |
| `useUIStore`       | Stato UI (drawer, sidebar, notifiche) |
| `useSystemStore`   | Auth, profilo utente, onboarding      |
| `DashboardStore`   | Dati dashboard analitici              |
| `lazyStores`       | Entry point lazy per store pesanti    |

### React Context (limitato)

- `ModalContext` — gestione stack modale unico (open/close senza prop drilling)
- `ThemeContext` — light/dark/auto preference

---

## Architettura Dati

### Local-First

```
Write path:  UI → Store → LocalStorage (sync) → IndexedDB (async backup)
Read path:   Store ← LocalStorage (hydrate at mount)
Cloud path:  LocalStorage ↔ Google Drive (OAuth 2.0, opzionale)
```

### Servizi Chiave (`src/services/`)

| Servizio              | Ruolo                                     |
| --------------------- | ----------------------------------------- |
| `aiService.ts`        | Chiamate a Google Gemini API              |
| `backupService.ts`    | Export/import dati + sync Google Drive    |
| `indexedDbService.ts` | Persistenza offline per payload grandi    |
| `registerService.ts`  | Logica registro di classe                 |
| `errorLogger.ts`      | Logging errori locale con structured data |

---

## App Shell

`AppLayout.tsx` orchestra la shell:

```
<Box> (full viewport height, overflow:hidden)
  <Header />                         // AppBar MUI
  <Box> (flex row, overflow:hidden)
    [isDesktop] <aside> <NavigationRail /> </aside>
    <main overflowY:auto>            // scrollable content
      {children}
    </main>
  </Box>
  <BottomNav />                      // position:fixed, hidden on desktop
  <SecondaryNavDrawer />             // Drawer MUI per sezioni secondarie
</Box>
```

Routing implementato come state machine in `App.tsx` (`view: View` + `onNavigate`), non con React Router.

---

## Modulo NKA (`src/nka/`)

Sistema di Knowledge Assessment gamificato, escluso da ESLint (`eslint.config.mjs`). File principali:

- `NKAProvider.tsx` — context e stato NKA
- `NKAHeaderIntegration.tsx` — entry point dal Header
- `NKAForceMap.tsx` — visualizzazione grafo di competenze
- `GameMode.tsx` — modalità quiz

---

## Testing

| Layer              | Tool              | Config                        |
| ------------------ | ----------------- | ----------------------------- |
| Unit + Integration | Vitest + RTL      | `vitest.config.ts`            |
| E2E                | Playwright        | `playwright.config.ts`        |
| Visual regression  | Playwright visual | `playwright.visual.config.ts` |

Helper `src/components/ui/test-utils.tsx` esporta `renderWithM3Theme` per tutti i test UI.

```bash
npm run test:unit     # vitest run
npm run lint          # ESLint (0 errors, 0 warnings)
npm run build         # Vite production build
```

---

## Sicurezza

- Nessun server-side: tutto client-side, zero tracking esterno
- Google OAuth 2.0 per Google Drive (scope: `drive.appdata`)
- CSP configurata in `index.html`
- Input di testo sanitizzato prima di passare a prompt AI
- Token/chiavi API: solo tramite variabili d'ambiente (`.env`)

---

## Documenti Correlati

- [HANDOFF.md](./HANDOFF.md) — stato corrente, sessioni recenti, metriche
- [REFACTORING_MUI_V7_ROADMAP.md](./REFACTORING_MUI_V7_ROADMAP.md) — roadmap migrazione MUI v7 (completata)
- [DEVELOPMENT.md](./DEVELOPMENT.md) — workflow operativo
- [TESTING.md](./TESTING.md) — strategia testing
- [DEPLOYMENT.md](./DEPLOYMENT.md) — procedure deploy
