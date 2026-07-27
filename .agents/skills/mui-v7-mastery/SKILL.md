---
name: mui-v7-mastery
description: Guia completo de MUI V7 para React + TypeScript. Ensina migração V6→V7, design responsivo avançado, theming profissional, padrões de componentes e detecção automática de sintaxe antiga. Use quando criar dashboards, interfaces modernas, ou trabalhar com Material-UI/MUI.
---

# MUI V7 Mastery

Skill especializada em Material-UI V7 para criar interfaces profissionais e responsivas com React + TypeScript. Fornece conhecimento sobre migração, melhores práticas, e padrões avançados.

## Quando Usar Esta Skill

Use esta skill quando:

- Criar dashboards ou interfaces administrativas
- Desenvolver aplicações React com Material Design
- Migrar de MUI V6 para V7
- Precisar de padrões responsivos mobile-first
- Configurar temas profissionais com dark mode
- Implementar componentes complexos (tabelas, formulários, etc)
- Quiser garantir uso correto da API do MUI V7

## Filosofia de Uso do MUI V7

**🎨 O MUI não é apenas para botões e barras!**

O verdadeiro poder do MUI V7 está em:

1. **Sistema de Grid responsivo** - Layouts profissionais que se adaptam
2. **Theming avançado** - Personalização completa da marca
3. **Componentes compostos** - Criar experiências ricas
4. **CSS Variables** - Temas dinâmicos performáticos
5. **Design System** - Consistência em toda aplicação
6. **Mobile-First by Default** - Interfaces que funcionam perfeitamente em qualquer dispositivo

## 📱 Mobile-First Essentials

**SEMPRE projete para mobile primeiro, depois expanda para desktop!**

### Princípios Fundamentais

1. **Comece em xs (0px)** - Base styles funcionam em mobile
2. **Use `up()` para expandir** - `theme.breakpoints.up('md')` para desktop
3. **Grid para layouts 2D** - Cards, galerias, dashboards
4. **Stack para layouts 1D** - Listas verticais/horizontais
5. **Touch targets ≥44px** - Botões e ícones clicáveis (WCAG 2.2 AAA)

### Breakpoints MUI V7

| Nome | Pixels | Dispositivo                        |
| ---- | ------ | ---------------------------------- |
| xs   | 0px    | Mobile portrait                    |
| sm   | 600px  | Mobile landscape / Tablet portrait |
| md   | 900px  | Tablet landscape / Desktop small   |
| lg   | 1200px | Desktop                            |
| xl   | 1536px | Desktop large                      |

### Quando Usar Grid vs Stack

```
Precisa de layout?
│
├─ Itens em LINHAS E COLUNAS? → Grid
│   └─ Exemplo: Cards de produtos, dashboard tiles
│
└─ Itens em UMA DIREÇÃO? → Stack
    ├─ Vertical? → Stack (default)
    └─ Horizontal? → Stack direction="row"
```

### Quando Usar sx vs useMediaQuery

```
Precisa de responsividade?
│
├─ Apenas ESTILOS mudam? → sx prop
│   └─ fontSize, padding, display, width, etc
│
└─ LÓGICA/COMPORTAMENTO muda? → useMediaQuery
    └─ Componentes diferentes, render condicional
```

## Quick Start

### 1. Para Criar Nova Interface (Mobile-First)

```typescript
// PASSO 1: Comece lendo as referências relevantes
// - Read references/responsive-design.md
// - Read references/advanced-theming.md
// - Read references/advanced-components.md

import { Container, Grid, Card, Stack, IconButton, useTheme, useMediaQuery } from '@mui/material';

function Dashboard() {
  const theme = useTheme();

  // PASSO 2: Defina breakpoint APENAS se lógica/comportamento mudar
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Container maxWidth="lg">
      {/* PASSO 3: Mobile-first Grid (xs → md → lg) */}
      <Grid container spacing={{ xs: 2, md: 3 }}>
        {/* Mobile: 100% largura, Tablet: 50%, Desktop: 33% */}
        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
          <Card sx={{
            p: { xs: 2, md: 3 },  // Padding responsivo
            minHeight: 200
          }}>
            {/* PASSO 4: Touch targets ≥44px em mobile */}
            <Stack direction="row" spacing={1}>
              <IconButton sx={{ minHeight: 44, minWidth: 44 }}>
                <EditIcon />
              </IconButton>
            </Stack>

            {/* PASSO 5: Componentes diferentes se necessário */}
            {isMobile ? <MobileView /> : <DesktopView />}
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}
```

### 2. Para Migrar de V6 para V7

```bash
# ANTES de qualquer código, leia:
# references/migration-v6-to-v7.md

# Depois execute os codemods:
npx @mui/codemod v7.0.0/grid-props src
npx @mui/codemod v7.0.0/lab-removed-components src
npx @mui/codemod v7.0.0/input-label-size-normal-medium src

# Configure ESLint para detectar código antigo:
node scripts/setup-mui-eslint.js
```

### 3. Para Configurar Tema Profissional

```typescript
// Leia references/advanced-theming.md primeiro

import { createTheme, ThemeProvider } from "@mui/material/styles";

const theme = createTheme({
  cssVariables: true, // ✅ Ativa CSS variables (recomendado V7)

  colorSchemes: {
    light: {
      palette: {
        primary: { main: "#1976d2" },
        background: { default: "#fafafa" },
      },
    },
    dark: {
      palette: {
        primary: { main: "#90caf9" },
        background: { default: "#121212" },
      },
    },
  },

  typography: {
    fontFamily: "Inter, system-ui, sans-serif",
  },

  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          borderRadius: 8,
        },
      },
    },
  },
});
```

## Fluxo de Trabalho Recomendado

### Para Qualquer Tarefa MUI

1. **Identifique o tipo de trabalho:**
   - Nova interface? → Leia responsive-design.md + advanced-components.md
   - Migração? → Leia migration-v6-to-v7.md primeiro
   - Tema? → Leia advanced-theming.md
   - Tudo junto? → Leia todos os references

2. **Leia as referências relevantes:**

   ```typescript
   // SEMPRE faça isso ANTES de escrever código
   view references/[arquivo-relevante].md
   ```

3. **Implemente seguindo os padrões:**
   - Use os exemplos das referências como base
   - Adapte ao caso específico
   - Siga as melhores práticas indicadas

4. **Valide com ESLint (opcional mas recomendado):**
   ```bash
   node scripts/setup-mui-eslint.js
   npm run lint:mui
   ```

## Recursos Disponíveis

### 📚 References (Leia conforme necessidade)

#### [migration-v6-to-v7.md](references/migration-v6-to-v7.md)

**Quando ler:** Ao migrar código existente ou corrigir erros de breaking changes.

Contém:

- ❌ Sintaxe antiga vs ✅ Nova sintaxe V7
- Mudanças de breaking changes (Grid, imports, props)
- Codemods automáticos
- Guia passo-a-passo de migração
- Novos recursos do V7 (ESM, CSS Layers)

**Situações de uso:**

- Erros de import após atualizar para V7
- Componentes Grid não funcionando
- Props depreciadas sendo usadas
- Problemas com Hidden, Dialog.onBackdropClick, etc

#### [responsive-design.md](references/responsive-design.md)

**Quando ler:** Ao criar qualquer interface que precisa funcionar em mobile.

Contém:

- Sistema Grid completo com exemplos
- Breakpoints e useMediaQuery
- Padrões de navegação responsiva
- Cards, formulários e dialogs responsivos
- Mobile-first best practices

**Situações de uso:**

- Criar dashboards responsivos
- Layouts que se adaptam a diferentes telas
- Navegação mobile vs desktop
- Formulários otimizados para mobile

#### [advanced-theming.md](references/advanced-theming.md)

**Quando ler:** Ao configurar tema personalizado ou dark mode.

Contém:

- Criação de tema com TypeScript
- CSS Variables (nova abordagem V7)
- Dark/Light mode toggle
- Customização avançada de componentes
- Variantes customizadas
- Module augmentation

**Situações de uso:**

- Aplicar identidade visual da marca
- Implementar dark mode
- Criar variantes customizadas de componentes
- Estilização global consistente

#### [advanced-components.md](references/advanced-components.md)

**Quando ler:** Ao implementar componentes complexos.

Contém:

- Dashboard layout completo
- Cards com skeleton loading
- Data tables avançadas (sort, search, pagination)
- Formulários com validação
- Sistema de toasts/snackbar
- Autocomplete assíncrono
- Performance (lazy loading, memoização, virtualização)

**Situações de uso:**

- Criar layouts profissionais
- Implementar tabelas de dados
- Formulários complexos com validação
- Loading states
- Listas grandes (virtualização)

### 🔧 Scripts

#### [setup-mui-eslint.js](scripts/setup-mui-eslint.js)

**Propósito:** Configurar ESLint para detectar sintaxe antiga do MUI V6 automaticamente.

**Como usar:**

```bash
node scripts/setup-mui-eslint.js
```

**O que faz:**

- Adiciona regras ESLint customizadas
- Detecta imports depreciados
- Avisa sobre props removidas
- Mensagens amigáveis e educativas (emoji + explicação)
- Cria scripts npm para migração automática

**Mensagens exemplo:**

- ❌ Deep imports não são mais suportados no MUI V7
- ✨ Este componente foi movido para @mui/material
- ⚠️ Grid foi renomeado. Considere migrar para novo Grid
- 🔄 Use onClose em vez de onBackdropClick

## Mudanças Críticas V7 (Resumo Rápido)

### ❌ NÃO FUNCIONA MAIS:

```typescript
// Deep imports
import createTheme from '@mui/material/styles/createTheme'; // ❌

// Grid antigo
import Grid from '@mui/material/Grid'; // ❌ (agora é GridLegacy)

// Grid2
import Grid2 from '@mui/material/Grid2'; // ❌ (agora é Grid)

// Componentes do lab
import Alert from '@mui/lab/Alert'; // ❌

// Props depreciadas
<Dialog onBackdropClick={...} /> // ❌
<InputLabel size="normal" /> // ❌
<Hidden xlUp>...</Hidden> // ❌
```

### ✅ USE AGORA:

```typescript
// Imports corretos
import { createTheme } from '@mui/material/styles'; // ✅

// Novo Grid (era Grid2)
import Grid from '@mui/material/Grid'; // ✅

// Componentes movidos
import Alert from '@mui/material/Alert'; // ✅

// Props atualizadas
<Dialog onClose={(e, reason) => {...}} /> // ✅
<InputLabel size="medium" /> // ✅
<Box sx={{ display: { xl: 'none' } }} /> // ✅
```

## Padrão de Resposta para Dashboards

Quando solicitado "criar um dashboard bonito", siga este padrão:

1. **Leia as referências:**

   ```
   view references/responsive-design.md
   view references/advanced-components.md
   view references/advanced-theming.md
   ```

2. **Implemente com abordagem Mobile-First:**
   - **Comece em xs (mobile)** - Layout vertical, touch targets 44px
   - **Expanda para md (tablet)** - 2 colunas, espaçamento maior
   - **Finalize em lg (desktop)** - 3-4 colunas, densidade compacta
   - Layout responsivo usando novo Grid V7
   - Tema personalizado com dark mode
   - Componentes profissionais (não apenas Button básico)
   - Loading states (Skeleton)
   - TypeScript sem `any`

3. **Inclua SEMPRE (Mobile-First):**
   - Container para centralização
   - Grid com `size={{ xs: 12, md: 6, lg: 4 }}`
   - Cards com padding responsivo `p={{ xs: 2, md: 3 }}`
   - Touch targets ≥44px em IconButton/Button
   - Stack para layouts verticais (não Grid direction="column")
   - Skeleton para loading
   - useMediaQuery APENAS se lógica mudar
   - Theme com cssVariables
   - Testado em 375px, 768px, 1200px

## Dicas de Ouro 💡

### Mobile-First (Prioridade!)

- **Sempre comece em xs** - Base styles para mobile primeiro
- **Use `up()` para expandir** - `theme.breakpoints.up('md')`, nunca `down()`
- **Touch targets ≥44px** - Botões, ícones, links clicáveis
  ```tsx
  <IconButton sx={{ minHeight: 44, minWidth: 44 }}>
  ```
- **Spacing entre targets ≥10px** - Evita cliques errados
- **Grid para 2D, Stack para 1D** - Não use `Grid direction="column"`
- **sx para estilos, useMediaQuery para lógica**
- **Teste em 375px, 768px, 1200px** - Limites críticos

### Touch Targets (WCAG 2.2)

| Contexto         | Visual  | Touch Target | WCAG Level |
| ---------------- | ------- | ------------ | ---------- |
| Mobile primário  | 40-48px | 48px         | AAA        |
| Desktop compacto | 32-36px | 44px         | AAA        |
| Mínimo legal     | 24px    | 24px         | AA         |

**Padrão recomendado:**

```tsx
// Visual: 36px (compacto), Touch: 48px (seguro)
<Button
  sx={{
    height: { xs: 40, md: 36 }, // Visual height
    minHeight: { xs: 48, md: 44 }, // Touch target
  }}
>
  Action
</Button>
```

### Performance

- Use `cssVariables: true` para temas dinâmicos
- Implemente Skeleton para loading states
- Use lazy loading para componentes pesados
- Virtualize listas grandes (react-window)
- **Compartilhe useMediaQuery** - Evite duplicar em children

### Responsividade

- **Mobile-first SEMPRE** - xs → sm → md → lg → xl
- Use `size={{ xs: 12, md: 6 }}` no Grid
- `sx` prop para estilos responsivos:
  ```tsx
  sx={{
    fontSize: { xs: '14px', md: '16px' },
    p: { xs: 2, md: 3 }
  }}
  ```
- useMediaQuery APENAS para lógica condicional
- Teste em dispositivos reais, não só emulador

### Theming

- Configure dark mode desde o início
- Use `theme.vars.*` para CSS variables
- Crie variantes no tema, não inline
- TypeScript com module augmentation

### Componentes

- Leia advanced-components.md para padrões
- Use composition em vez de prop drilling
- Memoize componentes caros
- Skeleton > Loading spinner

## Comandos Úteis

```bash
# Migração automática
npx @mui/codemod v7.0.0/lab-removed-components src
npx @mui/codemod v7.0.0/grid-props src
npx @mui/codemod v7.0.0/input-label-size-normal-medium src

# Setup ESLint (detecção de código antigo)
node scripts/setup-mui-eslint.js

# Lint MUI
npm run lint:mui

# Migração completa (após configurar ESLint)
npm run mui-migrate
```

## Checklist de Qualidade Mobile-First

Antes de considerar uma interface MUI V7 completa:

### Design Mobile-First

- [ ] **Base styles em xs (0px)** - Funciona em mobile primeiro
- [ ] **Progressive enhancement com `up()`** - `theme.breakpoints.up('md')` e `up('lg')`
- [ ] **Touch targets ≥44px** - Botões, ícones, links (WCAG 2.2 AAA)
- [ ] **Visual height pode ser 32-36px SE touch target ≥44px**
- [ ] **Spacing entre elementos interativos ≥10px**
- [ ] **Grid para layouts 2D** - Cards, dashboards, galerias
- [ ] **Stack para layouts 1D** - Listas verticais/horizontais
- [ ] **Sem `Grid direction="column"`** - Use Stack

### Responsividade

- [ ] Layout testado em **375px (mobile pequeno)**
- [ ] Layout testado em **599px (edge sm breakpoint)**
- [ ] Layout testado em **768px (tablet)**
- [ ] Layout testado em **899px (edge md breakpoint)**
- [ ] Layout testado em **1199px (edge lg breakpoint)**
- [ ] Layout testado em **1920px (desktop grande)**
- [ ] **sx prop usado para estilos** - fontSize, padding, display
- [ ] **useMediaQuery usado APENAS para lógica** - Componentes diferentes, render condicional
- [ ] **useMediaQuery compartilhado** - Não duplicado em children
- [ ] Sem valores hardcoded de pixels em breakpoints

### Tema e Estilo

- [ ] Tema configurado com dark mode
- [ ] `cssVariables: true` ativado
- [ ] Sem erros de imports depreciados

### Performance

- [ ] Loading states implementados (Skeleton)
- [ ] Componentes pesados com lazy loading
- [ ] Listas grandes virtualizadas (react-window)
- [ ] Componentes memoizados onde necessário

### Code Quality

- [ ] TypeScript sem erros
- [ ] Nenhum uso de `any`
- [ ] Componentes seguem Atomic Design (quando aplicável)

### Acessibilidade

- [ ] Contraste de cores adequado (WCAG AA mínimo)
- [ ] ARIA labels em elementos interativos
- [ ] Touch targets WCAG 2.2 compliant
- [ ] Testado com leitor de tela (quando crítico)

## Recursos Externos

- [Documentação oficial MUI V7](https://mui.com/material-ui/)
- [Guia de migração](https://mui.com/material-ui/migration/upgrade-to-v7/)
- [Theme creator](https://zenoo.github.io/mui-theme-creator/)
- [Material Design Guidelines](https://m2.material.io/design)

---

**Lembre-se:** O MUI V7 é poderoso quando usado completamente. Não se limite a botões - explore Grid, theming, composição e padrões avançados! 🚀
