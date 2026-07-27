# Copilot Instructions — DocenteDoc AI

## Contesto del Progetto

App React PWA per docenti italiani. Stack: React 18, TypeScript, Vite, **MUI v7**.
Il design system è **Material Design 3** implementato tramite **MUI v7** (NON componenti custom).

---

## Regola Fondamentale

**NON usare mai i vecchi componenti custom MD3.** Ogni componente custom va sostituito con il suo equivalente MUI v7.
Il tema centralizzato è in `src/theme/muiTheme.ts` — non sovrascrivere mai stili inline.
I CSS variable `var(--md-sys-*)` sono mantenuti come bridge nel tema MUI — non rimuoverli.

---

## Mappa Componenti: Custom → MUI v7

| Vecchio (DA RIMUOVERE) | Nuovo MUI v7 (DA USARE)                   |
| ---------------------- | ----------------------------------------- |
| `M3Typography`         | `Typography` da `@mui/material`           |
| `M3Card`               | `Card` + `CardContent` da `@mui/material` |
| `M3Chip`               | `Chip` da `@mui/material`                 |
| `M3ChipGroup`          | `Stack` di `Chip` da `@mui/material`      |
| `M3ButtonGroup`        | `ButtonGroup` da `@mui/material`          |
| `M3ProgressBar`        | `LinearProgress` da `@mui/material`       |
| `M3Surface`            | `Paper` da `@mui/material`                |
| `AppLayout`            | `Box` + `Container` da `@mui/material`    |
| `<div>` visivi         | `Box` da `@mui/material`                  |

### Icone

Usa **sempre** `@mui/icons-material`. Esempio:

```tsx
import HomeIcon from "@mui/icons-material/Home";
```

NON usare icone custom, emoji o testo come icone.

---

## Regole di Migrazione per Copilot

### Quando modifichi un file:

1. Sostituisci ogni componente custom con il suo equivalente MUI
2. Rimuovi tutti gli import dei vecchi componenti custom
3. Aggiungi gli import MUI corretti
4. NON usare `sx` con valori hardcoded — usa i token del tema:
   - ✅ `sx={{ p: 4 }}` → 4×4px = 16px
   - ❌ `sx={{ padding: "16px" }}` → hardcoded vietato
   - ✅ `sx={{ color: "text.primary" }}` → token tema
   - ❌ `sx={{ color: "#1C1B1F" }}` → hardcoded vietato
5. NON usare `style={{}}` inline per niente
6. Mantieni invariata tutta la logica applicativa

### Per la PWA:

- Touch target ≥ 48px (già configurato nel tema)
- Usa `BottomNavigation` MUI per la nav mobile
- FAB con `position: fixed` rispettando safe area

### Accessibilità (obbligatoria):

- Ogni `IconButton` deve avere `aria-label`
- Icone decorative dentro button: `aria-hidden`

---

## Prompt da usare per la migrazione

```
#file:NomeFile.tsx
Migra questo file da componenti MD3 custom a MUI v7 seguendo le istruzioni in copilot-instructions.md.
Sostituisci tutti i componenti custom (M3Typography, M3Card, M3Chip, M3ChipGroup, M3ButtonGroup,
M3ProgressBar, M3Surface, AppLayout) con i loro equivalenti MUI v7.
Aggiungi aria-label su tutti gli elementi interattivi icon-only.
Mantieni invariata tutta la logica applicativa.
Non usare valori hardcoded in sx — usa solo token del tema.
```

---

## Import Corretti

```tsx
// ✅ CORRETTO
import {
  Box,
  Stack,
  Typography,
  Button,
  IconButton,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Paper,
  Container,
  Divider,
  Fab,
} from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";

// ❌ SBAGLIATO
import { M3Typography } from "@/components/ui/M3Typography";
import { M3Card } from "@/components/ui/M3Card";
// ❌ SBAGLIATO — non usare @mui/lab per componenti già in @mui/material
```

---

## Ordine di Migrazione Consigliato

1. `src/components/ui/` — wrapper MUI sui custom
2. Layout shell — AppBar, BottomNavigation, Drawer
3. Viste principali — home, calendario, uda
4. Viste secondarie — una alla volta
