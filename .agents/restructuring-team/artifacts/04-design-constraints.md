# 04 — Design Constraints & MD3 Compliance (MD3 Keeper)

**Agente:** MD3 & Design System Keeper  
**Data:** 2026-07-25

---

## Componenti MD3 da Usare

### Core da Riutilizzare Obbligatoriamente

| Componente / Pattern          | Uso nella Nuova Navigazione                  | Note |
|-------------------------------|----------------------------------------------|------|
| `M3Surface`                   | Tutte le card, rail items, drawer, overlay   | Obbligatorio |
| `M3Typography`                | Tutti i testi (niente fontSize inline)       | Obbligatorio |
| Navigation Rail (MUI + tokens)| Desktop principale                           | Usare Box + M3Surface |
| Bottom Navigation (esistente) | Mobile (estendere a 5 voci)                  | Già MD3-compliant |
| `M3Dialog` / BottomSheet      | Overlay AI, dettagli, modali                 | Preferire BottomSheet su mobile |
| FAB + `material-symbols-outlined` | SatelliteCopilot e azioni rapide          | Già in uso |
| `SectionHeader`, `ActionTile` | Sezioni e azioni rapide                      | Riutilizzare |

### Nuovi Pattern da Definire

- **Navigation Rail Item**: M3Surface + icon + label, active state con secondary-container.
- **Contextual AI Trigger**: Chip o Button outlined con icona `auto_awesome`.
- **Macro Area Container**: `M3Surface elevation={1}` con padding tokenizzato.

---

## Vincoli di Layout e Navigazione

### Obbligatori

1. **Zero `<div>` generici** per contenitori visivi principali.
2. **Tutti gli spacing** devono usare `--md-sys-spacing-*`.
3. **Elevation** solo semantica (0-5).
4. **Icone** esclusivamente tramite `className="material-symbols-outlined"` + `var(--md-sys-icon-size-*)`.
5. **Active states** → `secondary-container` + `on-secondary-container`.
6. **Responsive**:
   - Mobile: BottomNav + FAB
   - Desktop: Navigation Rail (persistente, ~72-80px)

### Vietato

- Hardcoded `px`, `rem`, `gap: 16px`, `padding: 24px`
- Box-shadow custom
- Layout basati su Tailwind o utility non tracciate
- Icone con `fontSize: 24` (usare token)

---

## Pattern per Unificazione Visiva

### Macro Aree

Ogni macro-area (Oggi, Aula, Pianificazione, Analisi, Assistente) deve avere:
- Header con `M3Typography` + icona
- Contenuto dentro `M3Surface elevation={1 or 2}`
- Pulsante contestuale "Chiedi all'AI" come `Button variant="outlined"` con icona `auto_awesome`

### AI Surfaces

- Chat principale → `M3Surface elevation={1}` con bordo arrotondato extra-large
- Orbit suggestions → `M3Surface elevation={2}` come chip/card
- Decision Card → Trattare come componente MD3 dedicato (già esistente)

### Coerenza tra mobile e desktop

Usare gli stessi token di elevation, corner, e motion per mantenere il "feel" identico.

---

## Cose Vietate nella Ristrutturazione

- Creare nuovi wrapper tipo `<div class="nav-item">`
- Usare `style={{}}` per layout critici
- Introdurre nuovi colori non presenti nei token MD3
- Rompere il pattern "icona + label" nei menu (già molto MD3)
- Aggiungere animazioni custom non basate su `--md-sys-motion-*`

---

## Raccomandazioni per Coerenza

1. **Estendere il BottomNav esistente** a 5 voci invece di crearne uno nuovo.
2. **Creare un componente `AppNavigationRail`** che riutilizzi lo stesso markup degli item del drawer attuale.
3. **Usare `VIEW_LABELS`** come fonte di verità per i testi.
4. Mantenere il logo e il comportamento "logo apre menu secondario".
5. Per l'AI contestuale: usare lo stesso pattern di `ActionTile` già presente in OperationsCenter.

---

**Conclusione MD3 Keeper:**

La proposta di navigazione a 5 voci è **fortemente compatibile** con MD3 attuale.

Il rischio principale è la creazione di nuovi componenti di navigazione senza usare `M3Surface` e token. Si raccomanda di estendere i componenti esistenti (`BottomNav`, drawer items) invece di riscriverli.

**Verdetto:** Approvato con raccomandazione di estensione, non di riscrittura.