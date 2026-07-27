# DocenteDoc AI - Guida Deployment

> **Documento Deployment** - Procedure, configurazione e CI/CD per il deployment

## 📋 Panoramica

Questa guida copre tutte le procedure di deployment per **DocenteDoc AI**, dalla configurazione degli ambienti alla pubblicazione in produzione, con enfasi su automazione e sicurezza.

### 🎯 Strategia Deployment

- **CI/CD Automatizzato**: Deployment automatico da Git
- **Multi-Environment**: Development, Staging, Production
- **Zero-Downtime**: Deploy senza interruzioni del servizio
- **Rollback Sicuro**: Possibilità di rollback immediato

---

## 🏗️ Architettura Deployment

### Stack Deployment
```
Source: GitHub Repository
CI/CD: GitHub Actions
Hosting: Vercel (Frontend)
Storage: Google Drive API (User Data)
Analytics: Nessuno (Privacy-First)
```

### Environment Strategy
```
Production: https://docentedoc-ai.vercel.app
Staging: https://docentedoc-ai-staging.vercel.app
Development: http://localhost:3000
```

---

## ⚙️ Configurazione Ambiente

### Variabili d'Ambiente

#### Environment Variables Template
```bash
# .env.example
# Google Drive API Configuration
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_GOOGLE_API_KEY=your_google_api_key

# App Configuration
VITE_APP_VERSION=1.0.0
VITE_APP_ENV=development

# Analytics (Optional - disabled for privacy)
# VITE_ANALYTICS_ID=
```

#### Environment-Specific Configs
```bash
# .env.development
VITE_APP_ENV=development
VITE_API_BASE_URL=http://localhost:3000

# .env.staging
VITE_APP_ENV=staging
VITE_API_BASE_URL=https://api-staging.docentedoc.ai

# .env.production
VITE_APP_ENV=production
VITE_API_BASE_URL=https://api.docentedoc.ai
```

### Vercel Configuration
```json
// vercel.json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        }
      ]
    }
  ]
}
```

---

## 🚀 CI/CD Pipeline

### GitHub Actions Workflow
```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linting
        run: npm run lint

      - name: Run tests
        run: npm test -- --coverage --watchAll=false

      - name: Build
        run: npm run build

  deploy-staging:
    needs: test
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Deploy to Vercel (Staging)
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID_STAGING }}
          working-directory: ./

  deploy-production:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Deploy to Vercel (Production)
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID_PRODUCTION }}
          working-directory: ./
```

### Quality Gates
```yaml
# Quality checks before deployment
- ✅ Linting passes (npm run lint)
- ✅ Tests pass with ≥80% coverage
- ✅ Build succeeds
- ✅ Bundle size within limits
- ✅ Lighthouse PWA audit passes
```

---

## 📦 Build Process

### Vite Build Configuration
```javascript
// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    mode === 'production' && visualizer({
      filename: 'dist/bundle-analysis.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
    })
  ],
  build: {
    outDir: 'dist',
    sourcemap: mode === 'development',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@mui/material', '@emotion/react'],
          utils: ['zustand', 'date-fns']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  server: {
    port: 3000,
    host: true
  }
}))
```

### Bundle Optimization
```javascript
// Bundle analysis script
import { execSync } from 'child_process'

console.log('📊 Bundle Analysis')
console.log('==================')

const output = execSync('npm run build -- --mode production', {
  encoding: 'utf8'
})

console.log('Build completed successfully!')
console.log('Check dist/bundle-analysis.html for detailed analysis')
```

### Performance Budget
```javascript
// performance-budget.json
{
  "budgets": [
    {
      "type": "bundle",
      "path": "dist",
      "maximumWarning": "500kB",
      "maximumError": "1MB"
    },
    {
      "type": "lighthouse",
      "path": "dist/index.html",
      "options": {
        "firstContentfulPaint": 2000,
        "largestContentfulPaint": 4000,
        "cumulativeLayoutShift": 0.1,
        "totalBlockingTime": 500
      }
    }
  ]
}
```

---

## 🔒 Sicurezza Deployment

### Content Security Policy
```html
<!-- public/index.html -->
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://www.googletagmanager.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  connect-src 'self' https://*.googleapis.com https://*.vercel.app;
  font-src 'self' https://fonts.gstatic.com;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
">
```

### Environment Secrets Management
```bash
# GitHub Secrets (Settings > Secrets and variables > Actions)
VERCEL_TOKEN=vercel_deployment_token
VERCEL_ORG_ID=vercel_organization_id
VERCEL_PROJECT_ID_PRODUCTION=vercel_production_project_id
VERCEL_PROJECT_ID_STAGING=vercel_staging_project_id

# Google API Keys
GOOGLE_CLIENT_ID=google_oauth_client_id
GOOGLE_API_KEY=google_api_key
```

### SSL/TLS Configuration
- **Vercel Automatic**: SSL gratuito e automatico
- **HSTS**: Strict Transport Security abilitato
- **Certificate Transparency**: Monitoraggio certificati

---

## 📊 Monitoring e Analytics

### Performance Monitoring
```typescript
// utils/performance.ts
export const reportWebVitals = (metric: any) => {
  // Send to analytics service (if enabled)
  console.log('Web Vitals:', metric)

  // Example: Send to Vercel Analytics
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', metric.name, {
      value: Math.round(metric.value),
      event_category: 'Web Vitals',
      event_label: metric.id,
      non_interaction: true,
    })
  }
}
```

### Error Tracking
```typescript
// utils/errorReporting.ts
export const reportError = (error: Error, context?: any) => {
  console.error('Application Error:', error, context)

  // In production, send to error reporting service
  if (process.env.NODE_ENV === 'production') {
    // Example: Send to Sentry, LogRocket, etc.
    // errorReportingService.captureException(error, { context })
  }
}
```

### Uptime Monitoring
- **Vercel Analytics**: Monitoraggio automatico uptime
- **Health Check Endpoint**: `/api/health` per monitoring esterno
- **Alert Configuration**: Notifiche per downtime

---

## 🔄 Rollback Procedures

### Emergency Rollback
```bash
# Rollback to previous deployment
vercel rollback

# Or specify deployment URL
vercel rollback https://docentedoc-ai-git-main-user.vercel.app
```

### Gradual Rollback Strategy
1. **Monitor Metrics**: Dopo deploy, monitorare errori e performance
2. **A/B Testing**: Se possibile, testare con sottoinsieme di utenti
3. **Feature Flags**: Usare feature flags per disabilitare funzionalità problematiche
4. **Database Rollback**: Se necessario, ripristinare backup dati

### Rollback Checklist
- [ ] Identificare causa del problema
- [ ] Notificare team e utenti
- [ ] Eseguire rollback deployment
- [ ] Verificare ripristino funzionalità
- [ ] Analizzare causa root e fixare
- [ ] Testare fix prima di redeploy

---

## 🌍 Deployment Internazionale

### Localization Strategy
```typescript
// i18n configuration
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

i18n
  .use(initReactI18next)
  .init({
    lng: 'it', // Default Italian
    fallbackLng: 'en',
    resources: {
      it: { translation: require('./locales/it.json') },
      en: { translation: require('./locales/en.json') }
    }
  })
```

### CDN Configuration
- **Vercel Edge Network**: Distribuzione globale automatica
- **Asset Optimization**: Immagini e font ottimizzati automaticamente
- **Caching Strategy**: Cache intelligente basato su content-type

---

## 📋 Checklist Pre-Deployment

### Pre-Deployment
- [ ] Tutti i test passano (coverage ≥80%)
- [ ] Linting senza errori
- [ ] Build di produzione riuscito
- [ ] Bundle size entro limiti
- [ ] Lighthouse PWA audit superato
- [ ] Variabili d'ambiente configurate
- [ ] Database migrations applicate (se applicabile)

### Deployment
- [ ] Deploy su staging prima
- [ ] Test manuale su staging
- [ ] Verifica funzionalità critiche
- [ ] Monitoraggio errori post-deploy
- [ ] Deploy su production

### Post-Deployment
- [ ] Verifica uptime
- [ ] Monitora performance metrics
- [ ] Controlla logs per errori
- [ ] Notifica team del deploy riuscito

---

## 📞 Troubleshooting Deployment

### Problemi Comuni

#### Build Fallisce
```bash
# Check build logs
npm run build

# Clear cache and retry
rm -rf node_modules/.vite
npm run build
```

#### Deploy Fallisce
```bash
# Check Vercel logs
vercel logs

# Redeploy manually
vercel --prod
```

#### Performance Issues
- Controllare bundle analysis (`npm run analyze`)
- Verificare lazy loading implementation
- Audit Lighthouse scores

---

## 📚 Riferimenti

### Documenti Correlati
- [**DEVELOPMENT.md**](./DEVELOPMENT.md) - Workflow sviluppo
- [**TESTING.md**](./TESTING.md) - Strategia testing
- [**ARCHITECTURE.md**](./ARCHITECTURE.md) - Architettura sistema

### Deployment Resources
- [Vercel Documentation](https://vercel.com/docs)
- [GitHub Actions Guide](https://docs.github.com/en/actions)
- [Web Performance](https://web.dev/performance)

---

*Procedure di deployment aggiornate con l'evoluzione dell'infrastruttura. Modifiche significative richiedono review del team.*