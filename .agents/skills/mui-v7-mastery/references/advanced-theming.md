# Guia Avançado de Theming MUI V7

## Criação de Tema Profissional

### 1. Tema Base com TypeScript

```typescript
import { createTheme, ThemeOptions } from "@mui/material/styles";

// Definir paleta customizada
const paletteOptions = {
  primary: {
    main: "#1976d2",
    light: "#42a5f5",
    dark: "#1565c0",
    contrastText: "#fff",
  },
  secondary: {
    main: "#dc004e",
    light: "#f33a6a",
    dark: "#9a0036",
    contrastText: "#fff",
  },
  error: {
    main: "#d32f2f",
  },
  warning: {
    main: "#ed6c02",
  },
  info: {
    main: "#0288d1",
  },
  success: {
    main: "#2e7d32",
  },
  background: {
    default: "#fafafa",
    paper: "#fff",
  },
  text: {
    primary: "rgba(0, 0, 0, 0.87)",
    secondary: "rgba(0, 0, 0, 0.6)",
    disabled: "rgba(0, 0, 0, 0.38)",
  },
};

// Tema com configuração completa
const theme = createTheme({
  palette: paletteOptions,

  typography: {
    fontFamily: [
      "Inter",
      "-apple-system",
      "BlinkMacSystemFont",
      '"Segoe UI"',
      "Roboto",
      "Arial",
      "sans-serif",
    ].join(","),
    h1: {
      fontSize: "2.5rem",
      fontWeight: 700,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: "2rem",
      fontWeight: 600,
      lineHeight: 1.3,
    },
    body1: {
      fontSize: "1rem",
      lineHeight: 1.5,
    },
  },

  spacing: 8, // Base spacing unit

  shape: {
    borderRadius: 8,
  },

  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          borderRadius: 8,
          fontWeight: 500,
        },
      },
    },
  },
});
```

### 2. Tema com CSS Variables (Recomendado V7)

```typescript
import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  cssVariables: true, // Ativa CSS variables

  colorSchemes: {
    light: {
      palette: {
        primary: {
          main: "#1976d2",
        },
        background: {
          default: "#fafafa",
          paper: "#fff",
        },
      },
    },
    dark: {
      palette: {
        primary: {
          main: "#90caf9",
        },
        background: {
          default: "#121212",
          paper: "#1e1e1e",
        },
      },
    },
  },
});

// Uso nos componentes
const StyledBox = styled(Box)(({ theme }) => ({
  // ✅ USA CSS variables - muda automaticamente com tema
  color: theme.vars.palette.text.primary,
  backgroundColor: theme.vars.palette.background.paper,

  // ✅ Manipulação de cor com CSS
  borderColor: `color-mix(in srgb, ${theme.vars.palette.primary.main}, transparent 50%)`,
}));
```

### 3. Toggle Dark/Light Mode

```typescript
import {
  ThemeProvider,
  createTheme,
  useColorScheme
} from '@mui/material/styles';
import { IconButton } from '@mui/material';
import { Brightness4, Brightness7 } from '@mui/icons-material';

function ColorModeToggle() {
  const { mode, setMode } = useColorScheme();

  return (
    <IconButton
      onClick={() => setMode(mode === 'light' ? 'dark' : 'light')}
      color="inherit"
    >
      {mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
    </IconButton>
  );
}

function App() {
  const theme = createTheme({
    cssVariables: {
      colorSchemeSelector: 'class', // ou 'data'
    },
    colorSchemes: {
      light: true,
      dark: true,
    },
  });

  return (
    <ThemeProvider theme={theme}>
      <ColorModeToggle />
      {/* resto da app */}
    </ThemeProvider>
  );
}
```

### 4. Customização Avançada de Componentes

```typescript
const theme = createTheme({
  components: {
    MuiButton: {
      // Props padrão
      defaultProps: {
        disableElevation: true,
      },

      // Estilos base
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: "none",
          fontWeight: 600,
        },

        // Slots específicos
        startIcon: {
          marginRight: 8,
        },
        endIcon: {
          marginLeft: 8,
        },
      },

      // Variantes customizadas
      variants: [
        {
          props: { variant: "dashed" },
          style: ({ theme }) => ({
            border: `2px dashed ${theme.palette.primary.main}`,
            backgroundColor: "transparent",
            "&:hover": {
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
            },
          }),
        },
        {
          props: { variant: "contained", color: "primary" },
          style: {
            boxShadow: "0 4px 12px rgba(25, 118, 210, 0.3)",
            "&:hover": {
              boxShadow: "0 6px 16px rgba(25, 118, 210, 0.4)",
            },
          },
        },
      ],
    },

    MuiCard: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: 12,
          boxShadow: theme.shadows[3],
          transition: "transform 0.2s, box-shadow 0.2s",
          "&:hover": {
            transform: "translateY(-4px)",
            boxShadow: theme.shadows[8],
          },
        }),
      },
    },

    MuiTextField: {
      defaultProps: {
        variant: "outlined",
      },
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 8,
          },
        },
      },
    },
  },
});
```

### 5. TypeScript - Augmentação de Módulos

```typescript
// theme.d.ts
declare module "@mui/material/styles" {
  // Adicionar variantes customizadas
  interface ButtonPropsVariantOverrides {
    dashed: true;
  }

  // Adicionar cores customizadas
  interface Palette {
    neutral: Palette["primary"];
  }

  interface PaletteOptions {
    neutral?: PaletteOptions["primary"];
  }

  // Adicionar propriedades customizadas ao tema
  interface Theme {
    status: {
      danger: string;
    };
  }

  interface ThemeOptions {
    status?: {
      danger?: string;
    };
  }

  // Tipografia customizada
  interface TypographyVariants {
    code: React.CSSProperties;
  }

  interface TypographyVariantsOptions {
    code?: React.CSSProperties;
  }
}

// Adicionar props de Typography
declare module "@mui/material/Typography" {
  interface TypographyPropsVariantOverrides {
    code: true;
  }
}

// Implementação
const theme = createTheme({
  palette: {
    neutral: {
      main: "#64748B",
      light: "#94A3B8",
      dark: "#475569",
      contrastText: "#fff",
    },
  },
  status: {
    danger: "#e53e3e",
  },
  typography: {
    code: {
      fontFamily: "Fira Code, monospace",
      fontSize: "0.875rem",
      backgroundColor: "#f5f5f5",
      padding: "2px 6px",
      borderRadius: 4,
    },
  },
});
```

## Estratégias de Customização

### 1. Customização com sx Prop (One-off)

```typescript
// ✅ Melhor para estilos únicos
<Button
  sx={{
    bgcolor: 'primary.main',
    color: 'white',
    '&:hover': {
      bgcolor: 'primary.dark',
    },
    px: 4,
    py: 1.5,
    borderRadius: 2,
  }}
>
  Botão Customizado
</Button>

// Acesso ao tema dentro do sx
<Box
  sx={(theme) => ({
    p: 2,
    borderRadius: theme.shape.borderRadius,
    backgroundColor: alpha(theme.palette.primary.main, 0.1),
    [theme.breakpoints.down('sm')]: {
      p: 1,
    },
  })}
/>
```

### 2. Styled Components (Reutilizável)

```typescript
import { styled } from '@mui/material/styles';
import { Button } from '@mui/material';

// Componente base
const GradientButton = styled(Button)(({ theme }) => ({
  background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`,
  border: 0,
  borderRadius: 8,
  boxShadow: '0 3px 5px 2px rgba(25, 118, 210, .3)',
  color: 'white',
  height: 48,
  padding: '0 30px',
  transition: 'transform 0.2s',

  '&:hover': {
    transform: 'scale(1.05)',
  },
}));

// Com props dinâmicas
interface CustomButtonProps {
  success?: boolean;
}

const DynamicButton = styled(Button, {
  shouldForwardProp: (prop) => prop !== 'success',
})<CustomButtonProps>(({ theme, success }) => ({
  backgroundColor: success ? theme.palette.success.main : theme.palette.primary.main,
  color: theme.palette.common.white,

  '&:hover': {
    backgroundColor: success ? theme.palette.success.dark : theme.palette.primary.dark,
  },
}));

// Uso
<DynamicButton success>Sucesso</DynamicButton>
<DynamicButton>Padrão</DynamicButton>
```

### 3. Theme Composition

```typescript
// Criar temas em camadas
let baseTheme = createTheme({
  palette: {
    primary: {
      main: "#1976d2",
    },
  },
});

// Adicionar tipografia que depende da paleta
baseTheme = createTheme(baseTheme, {
  typography: {
    h1: {
      color: baseTheme.palette.primary.main,
    },
  },
});

// Adicionar componentes que dependem de ambos
const finalTheme = createTheme(baseTheme, {
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          color: baseTheme.palette.primary.main,
          fontSize: baseTheme.typography.h6.fontSize,
        },
      },
    },
  },
});
```

### 4. Global Styles

```typescript
import { GlobalStyles } from '@mui/material';

function App() {
  return (
    <>
      <GlobalStyles
        styles={(theme) => ({
          '*': {
            margin: 0,
            padding: 0,
            boxSizing: 'border-box',
          },
          body: {
            backgroundColor: theme.palette.background.default,
            color: theme.palette.text.primary,
          },
          'h1, h2, h3, h4, h5, h6': {
            margin: 0,
            fontWeight: 600,
          },
          a: {
            color: theme.palette.primary.main,
            textDecoration: 'none',
            '&:hover': {
              textDecoration: 'underline',
            },
          },
        })}
      />
      {/* resto da app */}
    </>
  );
}

// Alternativa: via CssBaseline
const theme = createTheme({
  components: {
    MuiCssBaseline: {
      styleOverrides: (theme) => ({
        body: {
          scrollbarColor: `${theme.palette.primary.main} ${theme.palette.background.default}`,
          '&::-webkit-scrollbar': {
            width: 8,
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: theme.palette.primary.main,
            borderRadius: 4,
          },
        },
      }),
    },
  },
});
```

## Acessando o Tema

### 1. useTheme Hook

```typescript
import { useTheme } from '@mui/material/styles';

function MyComponent() {
  const theme = useTheme();

  return (
    <div style={{
      padding: theme.spacing(2),
      color: theme.palette.primary.main
    }}>
      Conteúdo
    </div>
  );
}
```

### 2. Dentro de Styled Components

```typescript
const StyledDiv = styled("div")(({ theme }) => ({
  padding: theme.spacing(2),
  color: theme.palette.primary.main,

  [theme.breakpoints.up("md")]: {
    padding: theme.spacing(3),
  },
}));
```

### 3. Com sx Prop

```typescript
<Box
  sx={(theme) => ({
    p: theme.spacing(2),
    color: theme.palette.primary.main,
  })}
/>
```

## Melhores Práticas

### ✅ FAÇA

1. Use CSS variables para temas dinâmicos
2. Configure theme composition para valores interdependentes
3. Use `shouldForwardProp` para props customizadas
4. Defina variantes no tema, não inline
5. Use TypeScript com module augmentation
6. Configure responsive typography
7. Use alpha() para transparência
8. Teste acessibilidade de contraste

### ❌ NÃO FAÇA

1. Não use deep imports
2. Não crie temas inline em componentes
3. Não ignore tree-shaking (prefira sx/styled a theme overrides pesados)
4. Não use valores hard-coded de cores
5. Não esqueça do dark mode
6. Não ignore specificity CSS
7. Não use `!important` desnecessariamente
