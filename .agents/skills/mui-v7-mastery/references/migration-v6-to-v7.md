# MUI V6 para V7 - Guia de Migração

## Mudanças Críticas de Breaking Changes

### 1. Layout de Pacotes Atualizado

**❌ NUNCA MAIS USE:**

```typescript
// Deep imports com mais de um nível NÃO funcionam mais
import createTheme from "@mui/material/styles/createTheme"; // ❌ ERRO
```

**✅ USE SEMPRE:**

```typescript
// Importações devem ser do nível de módulo
import { createTheme } from "@mui/material/styles"; // ✅ CORRETO
```

### 2. Grid e Grid2 Renomeados

**Grid (Antigo) → GridLegacy**

```typescript
// ❌ ANTIGA SINTAXE (V6)
import Grid from "@mui/material/Grid";
import { gridClasses } from "@mui/material/Grid";

// ✅ NOVA SINTAXE (V7)
import Grid from "@mui/material/GridLegacy";
import { gridLegacyClasses } from "@mui/material/GridLegacy";
```

**Grid2 (Novo) → Grid**

```typescript
// ❌ ANTIGA SINTAXE (V6)
import Grid2 from "@mui/material/Grid2";
import { grid2Classes } from "@mui/material/Grid2";

// ✅ NOVA SINTAXE (V7)
import Grid from "@mui/material/Grid";
import { gridClasses } from "@mui/material/Grid";
```

**Tema - GridLegacy:**

```typescript
const theme = createTheme({
  components: {
    // ❌ V6
    MuiGrid: {
      /* ... */
    },

    // ✅ V7
    MuiGridLegacy: {
      /* ... */
    },
  },
});
```

**Tema - Novo Grid:**

```typescript
const theme = createTheme({
  components: {
    // ❌ V6
    MuiGrid2: {
      /* ... */
    },

    // ✅ V7
    MuiGrid: {
      /* ... */
    },
  },
});
```

### 3. InputLabel - Prop `size` Padronizada

```typescript
// ❌ V6
<InputLabel size="normal">Label</InputLabel>

// ✅ V7
<InputLabel size="medium">Label</InputLabel>
```

### 4. APIs Depreciadas Removidas

#### createMuiTheme

```typescript
// ❌ V6
import { createMuiTheme } from "@mui/material/styles";

// ✅ V7
import { createTheme } from "@mui/material/styles";
```

#### Dialog.onBackdropClick

```typescript
// ❌ V6
<Dialog onBackdropClick={handleBackdropClick} />

// ✅ V7
<Dialog
  onClose={(event, reason) => {
    if (reason === 'backdropClick') {
      // Lógica aqui
    }
  }}
/>
```

#### experimentalStyled

```typescript
// ❌ V6
import { experimentalStyled as styled } from "@mui/material/styles";

// ✅ V7
import { styled } from "@mui/material/styles";
```

#### Hidden Component

```typescript
// ❌ V6
<Hidden implementation="css" xlUp><Paper /></Hidden>

// ✅ V7 - Use sx prop
<Paper sx={{ display: { xl: 'none', xs: 'block' } }} />

// ✅ V7 - Ou useMediaQuery
const hidden = useMediaQuery(theme => theme.breakpoints.up('xl'));
return hidden ? null : <Paper />;
```

#### StyledEngineProvider

```typescript
// ❌ V6
import { StyledEngineProvider } from "@mui/material";

// ✅ V7
import { StyledEngineProvider } from "@mui/material/styles";
```

#### Componentes Movidos do @mui/lab

Estes componentes agora estão no pacote principal:

```typescript
// ❌ V6
import Alert from "@mui/lab/Alert";
import Autocomplete from "@mui/lab/Autocomplete";
import Pagination from "@mui/lab/Pagination";
import Rating from "@mui/lab/Rating";
import Skeleton from "@mui/lab/Skeleton";
import SpeedDial from "@mui/lab/SpeedDial";
import ToggleButton from "@mui/lab/ToggleButton";

// ✅ V7
import Alert from "@mui/material/Alert";
import Autocomplete from "@mui/material/Autocomplete";
import Pagination from "@mui/material/Pagination";
import Rating from "@mui/material/Rating";
import Skeleton from "@mui/material/Skeleton";
import SpeedDial from "@mui/material/SpeedDial";
import ToggleButton from "@mui/material/ToggleButton";
```

### 5. Comportamento do Tema com CSS Variables

**Mudança Importante:** Quando `cssVariables: true`, o tema não muda mais entre modos.

```typescript
// ❌ NÃO RECOMENDADO - Código que depende de theme.palette.mode mudando
const Custom = styled("div")(({ theme }) => ({
  color: theme.palette.text.primary, // Não muda com dark mode
}));

// ✅ RECOMENDADO - Use theme.vars para CSS variables
const Custom = styled("div")(({ theme }) => ({
  color: theme.vars.palette.text.primary, // Muda automaticamente
}));

// ✅ ALTERNATIVA - Manipulação de cor com CSS
const Custom = styled("div")(({ theme }) => ({
  color: `color-mix(in srgb, ${theme.vars.palette.text.primary}, transparent 50%)`,
}));

// ✅ ÚLTIMO RECURSO - Acesso direto aos colorSchemes
const Custom = styled("div")(({ theme }) => ({
  color: alpha(theme.colorSchemes.light.palette.text.primary, 0.5),
  ...theme.applyStyles("dark", {
    color: alpha(theme.colorSchemes.dark.palette.text.primary, 0.5),
  }),
}));
```

**Opt-out do comportamento padrão:**

```typescript
<ThemeProvider forceThemeRerender />
```

### 6. SvgIcon data-testid Removido

O `data-testid` padrão foi removido dos ícones em builds de produção.

### 7. TablePaginationActions - Mudança no Path de Import

```typescript
// ❌ V6
import type { TablePaginationActionsProps } from "@mui/material/TablePagination/TablePaginationActions";

// ✅ V7
import type { TablePaginationActionsProps } from "@mui/material/TablePaginationActions";
```

### 8. Rating - CSS Class Mudou

```typescript
// ❌ V6
.MuiRating-readOnly

// ✅ V7
.Mui-readOnly
```

## Requisitos de Versão

### TypeScript

- **Mínimo:** TypeScript 4.9+
- **Recomendado:** TypeScript 5.0+

### React Types

```bash
# Instale os types na mesma versão do React
npm install @types/react@18 @types/react-dom@18
```

### React 18 e Abaixo - Resolução Necessária

```json
{
  "overrides": {
    "react-is": "^18.3.1"
  }
}
```

## Codemods Automáticos

Execute estes comandos para migração automática:

```bash
# Grid props migration
npx @mui/codemod v7.0.0/grid-props <path>

# InputLabel size migration
npx @mui/codemod v7.0.0/input-label-size-normal-medium <path>

# Lab components migration
npx @mui/codemod v7.0.0/lab-removed-components <path>
```

## Benefícios do V7

### 1. Suporte ESM Melhorado

- Funciona perfeitamente com Vite e webpack
- Suporte completo a ES modules no Node.js

### 2. Padrão de Slots Padronizado

- Todos os componentes agora seguem o mesmo padrão de slots

### 3. Suporte a CSS Layers

```typescript
// Client-side
<StyledEngineProvider enableCssLayer>
  <App />
</StyledEngineProvider>

// Next.js App Router
<AppRouterCacheProvider enableCssLayer>
  <App />
</AppRouterCacheProvider>
```

## Checklist de Migração

- [ ] Atualizar todas as dependências @mui/\* para versão 7.0.0
- [ ] Atualizar TypeScript para 4.9+
- [ ] Remover deep imports de mais de um nível
- [ ] Migrar Grid/Grid2 conforme necessário
- [ ] Atualizar InputLabel size="normal" para size="medium"
- [ ] Substituir APIs depreciadas
- [ ] Migrar componentes do @mui/lab
- [ ] Atualizar estilos para usar theme.vars quando usando cssVariables
- [ ] Executar codemods automáticos
- [ ] Testar aplicação completamente
