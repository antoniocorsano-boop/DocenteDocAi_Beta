# Pull Request Template – DocenteDoc AI

## 📋 Checklist MD3 Compliance (VINCOLANTE)

**⚠️ IMPORTANTE**: Questa checklist è tecnica e vincolante. Una PR non conforme verrà bloccata automaticamente.

### 🚫 Controlli di Blocco (Failure = PR bloccata)

- [ ] **NO className introdotti**
  - [ ] Nessun nuovo `className` aggiunto nel codice
  - [ ] Nessun `className` reintrodotto in componenti esistenti
  - [ ] Verificato con grep: `grep -r "className" src/ --exclude-dir=node_modules`

- [ ] **NO utility CSS/Tailwind**
  - [ ] Nessun Tailwind per colori (`bg-`, `text-`, `border-`)
  - [ ] Nessun Tailwind per tipografia (`font-`, `text-`)
  - [ ] Nessun Tailwind per spacing (`p-`, `m-`, `gap-`)
  - [ ] Nessun Tailwind per shadow/elevation

- [ ] **NO valori hardcoded**
  - [ ] Nessun `px`, `rem`, `%` hardcoded
  - [ ] Nessun colore hex (`#fff`, `#000000`)
  - [ ] Nessun rgba hardcoded
  - [ ] Tutto usa token MD3 (`var(--md-sys-*)`)

- [ ] **CI obbligatorio**
  - [ ] `npm run build` passa ✅
  - [ ] `pnpm vitest run` passa (1297/1297 test) ✅
  - [ ] `npx playwright test e2e/` passa ✅
  - [ ] Nessuna regressione visiva nei test MD3

### ✅ Verifiche MD3 Compliance

- [ ] **Typography obbligatoria**
  - [ ] Tutto il testo visibile usa `M3Typography`
  - [ ] Variants MD3 corretti (`body-large`, `headline-small`, etc.)
  - [ ] Gerarchia tipografica rispettata

- [ ] **Token MD3 esclusivi**
  - [ ] Solo `var(--md-sys-color-*)` per colori
  - [ ] Solo `var(--md-sys-spacing-*)` per spacing
  - [ ] Solo `var(--md-sys-shape-*)` per corner radius
  - [ ] Solo `var(--md-sys-elevation-*)` per shadow

- [ ] **Componenti M3**
  - [ ] Usa componenti M3 esistenti quando disponibili
  - [ ] Nuovi componenti seguono pattern M3
  - [ ] API compatibile mantenuta

- [ ] **Stati interattivi**
  - [ ] Hover, focus, active usano token MD3
  - [ ] Transizioni con motion tokens MD3
  - [ ] Feedback visivo consistente

### ♿ Accessibilità (Obbligatoria)

- [ ] **ARIA obbligatorio**
  - [ ] Tutti i controlli hanno `aria-label` o `aria-labelledby`
  - [ ] `aria-expanded`, `aria-selected` dove appropriato
  - [ ] Nessun ARIA ridondante o improprio

- [ ] **Focus management**
  - [ ] Focus indicator visibile con token MD3
  - [ ] Keyboard navigation completa
  - [ ] Focus trap in modal/dialog

- [ ] **Touch targets**
  - [ ] Tutti i controlli ≥ 44px
  - [ ] Spaziatura adeguata tra elementi

### 🧪 Testing

- [ ] **Test coverage**
  - [ ] Componenti testati con `M3ThemeProvider`
  - [ ] Stati interattivi testati
  - [ ] Accessibilità testata
  - [ ] Snapshot aggiornati se necessario

- [ ] **Regression test**
  - [ ] Nessuna regressione visiva MD3
  - [ ] Test di accessibilità passano
  - [ ] Performance non degradata

### 📚 Documentazione

- [ ] **Breaking changes**
  - [ ] Documentati se presenti
  - [ ] API migration guide se necessario
  - [ ] Aggiornato CHANGELOG.md

- [ ] **Code comments**
  - [ ] Decisioni MD3 documentate
  - [ ] Token usage spiegato
  - [ ] Accessibility rationale

---

## 🔍 Review Process

**Reviewer deve verificare:**

1. ✅ Checklist completa (nessun NO)
2. ✅ CI passa completamente
3. ✅ Nessuna regressione MD3
4. ✅ Accessibilità verificata

**Se checklist incompleta → PR bloccata**
**Se CI fallisce → PR bloccata**
**Se regressione MD3 → PR bloccata**

---

## 📝 Descrizione della PR

**Tipo di cambiamento:**

- [ ] 🐛 Bug fix
- [ ] ✨ New feature
- [ ] 🔄 Refactoring
- [ ] 📚 Documentation
- [ ] 🧪 Testing
- [ ] 🔧 Build/CI

**Componenti interessati:**

- [ ] UI Components
- [ ] Business Logic
- [ ] State Management
- [ ] Testing
- [ ] Build/Deploy

**Descrizione tecnica:**
[Descrivi cosa è stato cambiato e perché]

**Testing effettuato:**
[Descrivi i test eseguiti e risultati]
