# MD3 Visual Regression Testing

Questa directory contiene la strategia completa di test di regressione visiva per il sistema di design MD3, progettata per essere compatibile con la governance MD3 Gold e il layer semantico Platinum.

## 📋 Panoramica

La strategia MD3-aware visual regression testing fornisce:

- **Test deterministici** per componenti e schermi critici
- **Classificazione intelligente** dei diff (accettabili vs bloccanti)
- **Integrazione CI/CD** non bloccante per cambiamenti token-driven
- **Report HTML** per revisione manuale
- **Conformità MD3** automatica validation

## 🏗️ Architettura

```
__tests__/visual-regression/
├── config/
│   └── md3-visual-config.ts      # Configurazione MD3-aware
├── md3-components.spec.ts        # Test componenti MD3
├── md3-screens.spec.ts          # Test schermi critici
└── md3-visual-regression.spec.ts-snapshots/  # Baseline screenshots

scripts/
├── analyze-md3-visual-diffs.cjs  # Analisi intelligente diff
└── generate-md3-visual-report.cjs # Generatore report HTML

public/
└── md3-test-harness.html        # Test harness isolato

.github/workflows/
└── md3-visual-gate.yml          # CI/CD gate
```

## 🚀 Utilizzo

### Eseguire i Test

```bash
# Tutti i test MD3
npm run test:visual:md3

# Solo componenti
npm run test:visual:md3:components

# Solo schermi critici
npm run test:visual:md3:screens

# Aggiornare baseline
npm run test:visual:md3:update
```

### Analisi Diff

```bash
# Analizzare risultati test
npm run analyze:visual:md3

# Generare report HTML
npm run report:visual:md3
```

### Debug

```bash
# Test con debug mode
npm run test:visual:md3:debug

# Test specifici
npx playwright test md3-components.spec.ts --grep "M3Button"
```

## ⚙️ Configurazione

### Soglie Diff

```typescript
thresholds: {
  component: 0.001,  // 0.1% - componenti individuali
  semantic: 0.005,   // 0.5% - cambiamenti token semantici
  page: 0.01,        // 1.0% - pagine complete
  typography: 0.003  // 0.3% - cambiamenti tipografici
}
```

### Classificazione MD3-Aware

- **✅ Accettabile**: Cambiamenti token-driven (< 1%)
- **⚠️ Review**: Diff moderati (1-5%) - revisione manuale
- **❌ Bloccante**: Diff grandi (> 10%) - probabili hardcoded

## 🔍 Test Harness

Il test harness (`/md3-test-harness.html`) fornisce:

- Ambiente isolato per componenti MD3
- Rendering deterministico
- Validazione conformità MD3 automatica
- Supporto per varianti semantiche

### URL Parameters

```
?component=M3Button&variant=default
?component=all&variant=semantic-demo
```

## 📊 Report e Analisi

### Risultati Analisi

```json
{
  "overall_status": "pass|review|fail",
  "summary": {
    "total_diffs": 42,
    "acceptable_diffs": 38,
    "review_diffs": 3,
    "blocking_diffs": 1
  },
  "details": [...]
}
```

### Report HTML

- Panoramica status con colori
- Dettagli diff per componente
- Confidence score per classificazione
- Link a screenshot diff

## 🔄 Integrazione CI/CD

### GitHub Actions

Il workflow `md3-visual-gate.yml` fornisce:

- **Non-blocking** per cambiamenti accettabili
- **Review-required** per diff moderati
- **Blocking** per hardcoded regressions
- Commenti PR automatici
- Artifact upload per debug

### Stati CI

- 🟢 **Pass**: Tutti diff accettabili
- 🟡 **Review**: Richiesta revisione manuale
- 🔴 **Fail**: Regression bloccanti rilevate

## 🎯 Componenti Testati

### MD3 Components
- M3Button, M3Card, M3TextField
- M3Chip, M3Dialog, M3Drawer
- M3Fab, M3List, M3Menu
- M3NavigationBar, M3Sheet
- M3Snackbar, M3Switch, M3Tab, M3TopAppBar

### Schermi Critici
- Landing page, Dashboard
- Profile settings, Document editor
- Search results, Onboarding flow

## 🛡️ Conformità MD3

### Validazione Automatica

- **Zero hardcoded values**: `px`, `rem`, `em`, `vh`, `vw`, colori hardcoded
- **Token MD3 usage**: Verifica utilizzo `--md-sys-*`
- **Semantic layer**: Validazione token `--app-*`

### Governance Rules

- **Token-driven changes**: Sempre accettabili
- **Layout shifts**: Monitorati per stabilità
- **Typography changes**: Soglia specifica (0.3%)
- **Color updates**: Validazione gamut MD3

## 🔧 Troubleshooting

### Test Falliti

1. **Screenshot mismatch**: Verificare se cambiamento è token-driven
2. **MD3 compliance fail**: Rimuovere valori hardcoded
3. **Timeout**: Aumentare `stabilization.delay`

### Debug Steps

1. Eseguire test in headed mode
2. Controllare `md3-visual-analysis.json`
3. Revisione manuale diff in report HTML
4. Validare token MD3 in DevTools

### Baseline Updates

```bash
# Aggiornare tutti baseline
npm run test:visual:md3:update

# Aggiornare componente specifico
npx playwright test --grep "M3Button" --update-snapshots
```

## 📈 Metriche e KPI

- **Coverage**: % componenti/schermi testati
- **Stability**: % test passanti
- **False positives**: Diff classificati erroneamente
- **Review time**: Tempo medio per revisione manuale

## 🔗 Riferimenti

- [MD3 Gold Manifesto](../../MD3_GOLD_MANIFESTO.md)
- [MD3 Platinum Semantic Layer](../../MD3_PLATINUM_SEMANTIC_LAYER.md)
- [MD3 Visual Regression Strategy](../../MD3_VISUAL_REGRESSION_STRATEGY.md)
- [Playwright Visual Testing](https://playwright.dev/docs/test-screenshots)