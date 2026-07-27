# ⚠️ ARCHIVED MIGRATION DOCUMENT

This document was used during a document-driven migration to Material Design 3.

Status:
- NOT executable code
- NOT a runtime source of truth
- NOT enforced by lint or tests

Current sources of truth:
- global.css (MD3 CSS custom properties)
- tokens.ts
- React components in /src

This file is kept for historical referenc

# CONTESTO:
Abbiamo un progetto React migrato a Material Design 3 (M3). 
Obiettivo: creare un sistema centralizzato di stile avanzato e aggiornare automaticamente tutti i componenti React esistenti.

# FILE DA GENERARE:
1. /src/theme/tokens.ts
2. /src/theme/theme.tsx
3. /src/global.css
4. /scripts/updateM3Tokens.ts
5. /src/components/M3Button.tsx (esempio componente aggiornato)

# SPECIFICHE:

## 1. tokens.ts
- Palette colori: primary, onPrimary, secondary, onSecondary, background, surface, error, success, warning
- Tipografia: body1, body2, heading1, heading2, caption
- Spaziature: 1,2,3,4,5,6
- Motion: duration, easing per hover e transizioni
- Breakpoints: mobile, tablet, desktop, large
- Variabili per dark mode e light mode
- Pronto da importare in React

## 2. theme.tsx
- ThemeProvider React chiamato M3ThemeProvider
- Context che distribuisce tutti i token (colori, tipografia, spacing, motion, breakpoints)
- Hook useTheme per accedere ai token
- Supporto dark mode toggle
- Esempio di wrapping dell’app con ThemeProvider
- Token accessibili in CSS-in-JS o inline style

## 3. global.css
- Definisce le variabili CSS M3 per dark/light mode
- Colori, spacing e tipografia collegati ai token TypeScript
- Pronto per import in index.tsx

## 4. updateM3Tokens.ts
- Scansiona tutti i file `.tsx` e `.css` in /src
- Sostituisce colori, font-size, padding, margin hardcoded con token di tokens.ts
- Aggiorna inline style React
- Supporto dark mode e responsive
- Mostra in console quali file sono stati aggiornati
- Pronto da eseguire con ts-node senza istruzioni extra

## 5. Esempio M3Button.tsx
- Usa ThemeProvider e token per colori, tipografia, spacing e motion
- Supporta dark mode
- Responsive ai breakpoints (mobile/tablet/desktop)
- Pulsante React completo, pronto all’uso

# OUTPUT RICHIESTO:
- Tutti i file completi separati chiaramente con commento sul nome file
- Codice funzionante senza errori
- Commenti chiari nel codice
- Tutto pronto da salvare e usare, senza copiare manualmente
- Aggiornamento automatico dei componenti React esistenti tramite updateM3Tokens.ts
