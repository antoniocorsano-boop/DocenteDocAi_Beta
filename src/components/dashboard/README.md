# Dashboard Operativa - DocenteDoc AI

Dashboard interattiva per il monitoraggio real-time delle performance di DocenteDoc AI, integrata con il sistema di monitoraggio Phase 6.

## 📊 Funzionalità

### Metriche Monitorate
- **Performance FPS**: Frame rate dell'applicazione
- **Utilizzo Memoria**: RAM utilizzata con percentuali
- **Bundle Size**: Dimensioni del bundle JavaScript
- **AI Response Time**: Tempi di risposta dei modelli AI
- **Lazy Loading**: Efficienza caricamento componenti
- **Errori AI**: Distribuzione errori per categoria

### Visualizzazioni
- **Grafici di trend**: 7 giorni di dati storici
- **Grafici real-time**: Aggiornamenti automatici ogni 30 secondi
- **Alert system**: Notifiche per problemi critici
- **Confronto baseline**: Differenze rispetto ai valori di riferimento

## 🏗️ Architettura

### Componenti Principali
```
src/components/dashboard/
├── Dashboard.tsx          # Componente principale
├── MetricCard.tsx         # Card metriche individuali
├── Charts.tsx            # Componenti grafici (Recharts)
└── index.ts              # Esportazioni
```

### Store e State Management
```
src/stores/DashboardStore.ts  # Zustand store per stato dashboard
```

### Utilities
```
src/utils/metricsParser.ts   # Parser dati da log JSON
```

## 🚀 Utilizzo

### Installazione Dipendenze
```bash
npm install recharts zustand
```

### Import e Utilizzo
```tsx
import { Dashboard } from '@/components/dashboard';

// Nel tuo componente App
function App() {
  return (
    <div>
      <Dashboard />
    </div>
  );
}
```

### Configurazione Auto-Refresh
Il dashboard si aggiorna automaticamente ogni 30 secondi. Puoi:
- Attivare/disattivare l'auto-refresh
- Cambiare l'intervallo di refresh
- Aggiornare manualmente i dati

## 📈 Metriche Disponibili

### Performance Metrics
- FPS (Frames Per Second)
- Memory Usage (% e MB)
- Bundle Size (MB e numero chunks)
- AI Response Time (ms)
- Lazy Loading Times (ms per componente)

### Alert Types
- **Critical**: Problemi bloccanti (FPS < 30, memoria > 90%)
- **Warning**: Problemi da monitorare (FPS 30-50, memoria 80-90%)
- **Info**: Informazioni utili

### Trend Analysis
- Confronto con baseline
- Variazioni percentuali
- Grafici storici 7 giorni
- Previsioni di tendenza

## 🎨 Design System

### Material Design 3 Compliance
- Utilizzo esclusivo di token MD3 (`--md-sys-color-*`)
- Nessun valore hardcoded (px, rem, hex)
- Componenti accessibili (WCAG 2.1 AA)
- Tema responsive

### Color Coding
- **Verde**: Metriche ottimali
- **Giallo**: Avvertenze
- **Rosso**: Problemi critici
- **Grigio**: Metriche neutrali

## 🔧 Configurazione

### Environment Variables
```env
# Directory log monitoraggio
MAINTENANCE_LOGS_DIR=./maintenance/logs
MAINTENANCE_REPORTS_DIR=./maintenance/reports
```

### Personalizzazione
```tsx
// Modifica intervallo auto-refresh
useDashboardStore.setState({ refreshInterval: 60000 }); // 1 minuto

// Cambia range temporale
useDashboardStore.setState({ selectedTimeRange: '7d' });
```

## 📊 Integrazione con Phase 6

Il dashboard si integra automaticamente con:
- `maintenance/scripts/monitoring.ts`
- Log JSON in `maintenance/logs/`
- Report giornalieri in `maintenance/reports/`
- Sistema alert in `maintenance/logs/alerts/`

### Formato Dati
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "fps": 58,
  "memoryUsage": {
    "used": 45000000,
    "total": 100000000,
    "percentage": 45
  },
  "bundleSize": {
    "total": 600000,
    "chunks": 15
  },
  "aiMetrics": {
    "averageResponseTime": 2500,
    "timeoutCount": 0,
    "errorCount": 0,
    "quotaExceededCount": 0
  }
}
```

## 🐛 Troubleshooting

### Problemi Comuni
1. **Dati non caricati**: Verifica che il monitoring sia attivo
2. **Grafici vuoti**: Controlla presenza file baseline.json
3. **Auto-refresh non funziona**: Verifica connessione rete

### Debug
```tsx
// Visualizza stato store
const state = useDashboardStore.getState();
console.log('Dashboard State:', state);

// Forza refresh
useDashboardStore.getState().refresh();
```

## 📈 Estensioni Future

- [ ] Notifiche push per alert critici
- [ ] Export dati in CSV/PDF
- [ ] Dashboard personalizzabile
- [ ] Integrazione con sistemi esterni (Datadog, New Relic)
- [ ] Metriche custom configurabili
- [ ] Alert rules configurabili

## 🤝 Contributi

Per contribuire al dashboard:
1. Segui le regole MD3 Governance Contract
2. Mantieni compatibilità con TypeScript strict
3. Aggiungi test per nuove funzionalità
4. Documenta API e props dei componenti

## 📄 Licenza

Parte del progetto DocenteDoc AI - Monitoraggio Phase 6.