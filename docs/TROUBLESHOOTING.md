# Troubleshooting & Critical Fixes

Questo documento raccoglie le problematiche tecniche critiche riscontrate durante lo sviluppo e le relative soluzioni implementate per garantire la stabilità dell'applicazione.

---

## 1. Errore React Scheduler (unstable_now)

### Sintomo
`Uncaught TypeError: Cannot set properties of undefined (setting 'unstable_now')`

### Causa
Il modulo `scheduler` di React tenta di inizializzare le funzioni di timing (`unstable_now`) molto presto durante il caricamento dei moduli. In alcuni ambienti (come Vercel o browser specifici), l'oggetto `performance` o l'ambiente globale non sono pronti nel modo in cui React si aspetta, causando un crash prima ancora che l'app venga renderizzata.

### Soluzione
È stata implementata una protezione a tre livelli:
1.  **Polyfill Bloccante**: Creato `public/scheduler-polyfill.js` caricato come script classico (non modulo) in `index.html` prima di ogni altro script. Questo garantisce che `window.scheduler` e `performance.now` esistano prima che React inizi a caricarsi.
2.  **Bundling Unificato**: In `vite.config.ts`, il pacchetto `scheduler` è stato forzato nello stesso chunk di React (`react-vendor`) per evitare problemi di ordine di caricamento tra chunk asincroni.
3.  **Build-time Shim**: Creato `src/build-polyfill.js` per simulare l'ambiente DOM durante la fase di build di Vite/Rollup.

---

## 2. Errore Mammoth / Underscore (indexBy)

### Sintomo
`Uncaught TypeError: r.indexBy is not a function` nel file `vendor.js`.

### Causa
Era presente un alias in `vite.config.ts` che mappava `underscore` su `lodash`. Sebbene `lodash` sia spesso un sostituto compatibile, la libreria `mammoth` (usata per il parsing dei file Word) utilizza il metodo `.indexBy()`, che è presente in Underscore ma non in Lodash (dove si chiama `.keyBy()`).

### Soluzione
Rimosso l'alias `underscore: 'lodash'` da `vite.config.ts`. Ora Vite carica correttamente la libreria `underscore` originale richiesta da Mammoth, risolvendo il conflitto di API.

---

## 3. Errore Service Worker (Failed to fetch)

### Sintomo
`Uncaught (in promise) TypeError: Failed to fetch` nel file `sw.js`.

### Causa
Il file `src/sw.ts` conteneva una logica di filtraggio manuale del manifest che escludeva i file JavaScript dalla cache. Questo causava il fallimento dell'installazione del Service Worker quando cercava di recuperare risorse non presenti nel manifest di precache o quando la dimensione dei file superava i limiti di default di Workbox.

### Soluzione
1.  **Semplificazione Manifest**: Rimosso il filtro manuale in `src/sw.ts`, lasciando che Workbox gestisca l'intero manifest generato da Vite.
2.  **Aumento Limiti Cache**: In `vite.config.ts`, è stato aumentato `maximumFileSizeToCacheInBytes` a 5MB per permettere il caching dei chunk pesanti (come quelli contenenti le librerie PDF e AI).
3.  **Inclusione Asset**: Estesi i `globPatterns` per includere esplicitamente `.js`, `.webmanifest` e altri asset critici.

---

## Note per il Futuro
- **Non usare alias per librerie core** come `underscore` se ci sono dipendenze legacy che le richiedono.
- **Mantenere il polyfill dello scheduler** come script bloccante in `index.html` per evitare regressioni su ambienti cloud.
- **Monitorare la dimensione dei chunk** per assicurarsi che non superino i limiti del Service Worker.
