# Fase 1 — Nuova Navigazione Completata ✅

**Data:** 2026-07-25  
**Stato:** Strutturale completata

## Obiettivo
Implementare la navigazione a **5 voci** con:
- **Desktop (≥1024px)**: Navigation Rail persistente a sinistra
- **Mobile/Tablet**: Bottom Navigation (5 voci)
- **Drawer secondario**: "Altro" + tutte le sezioni mappate

## Cambiamenti chiave

### 1. Single Source of Truth
- **Nuovo file**: `src/components/navConfig.ts`
  ```ts
  export const FIVE_VOICE_NAV = [
    { id: 'home', label: 'Oggi', ... },
    { id: 'aula', label: 'Aula', ... },
    { id: 'progettazione-hub', label: 'Pianifica', ... },
    { id: 'analytics', label: 'Analisi', ... },
    { id: 'assistente', label: 'Assistente', ... },
  ];
  ```

### 2. AppLayout.tsx (riscritto)
- Layout flex row su desktop
- `NavigationRail` renderizzato solo su desktop
- `BottomNav` renderizzato solo su mobile (condizionale + CSS)
- `SecondaryNavDrawer` sempre presente come fallback "Altro"
- Responsive pb corretto

### 3. Componenti allineati
- `BottomNav.tsx` → importa `FIVE_VOICE_NAV`
- `NavigationRail.tsx` → forza l'uso del config canonico (ignora props esterne per coerenza Fase 1)
- `SecondaryNavDrawer.tsx` → PRIMARY_NAV_ITEMS da config + header "Principale"

### 4. Risultato UX
- 5 voci sempre visibili e prevedibili
- Drawer diventa puramente secondario ("Strumenti Classe", "Pianificazione", "Risorse & AI", "Altre Sezioni")
- `assistente` è ora una voce di primo livello (consolidamento AI)

## Vincoli rispettati
- MD3 (token, M3Surface, material-symbols, no raw px)
- P44.6 non toccato
- Backward compat con ViewManager (le viste vecchie restano sotto i gruppi)

## Prossimi passi raccomandati
**Fase 2** — AI Contestuale
- Pulsante "Chiedi all'AI" in ogni macro-area (con contesto)
- FAB contestuale per azioni rapide

**Fase 3** — Consolidamento Contenuti
- Mappatura completa di tutte le 35+ viste sotto le 5 voci
- Eventuale deprecazione di view obsolete

## Verifica rapida
- `navConfig.ts` presente
- AppLayout usa Rail su desktop
- Tutte e 5 le voci presenti in Rail + Bottom + Drawer Principale
- Nessuna duplicazione di definizione voci

**Fase 1 completata.**  
Pronto per Fase 2 (AI contestuale) o testing.