# Guia Completo de Design Responsivo com MUI V7

## Ferramentas Essenciais

### 1. Grid System (Nova Grid V2)

O sistema de grid do MUI V7 é baseado em CSS Grid e Flexbox.

```typescript
import Grid from '@mui/material/Grid';

// Layout responsivo básico
<Grid container spacing={2}>
  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
    <Card>Conteúdo 1</Card>
  </Grid>
  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
    <Card>Conteúdo 2</Card>
  </Grid>
  <Grid size={{ xs: 12, sm: 12, md: 4 }}>
    <Card>Conteúdo 3</Card>
  </Grid>
</Grid>

// Grid com offset
<Grid container>
  <Grid size={{ xs: 12, md: 6 }} offset={{ md: 3 }}>
    <Card>Centralizado no desktop</Card>
  </Grid>
</Grid>

// Grid aninhado
<Grid container spacing={2}>
  <Grid size={12}>
    <Grid container spacing={1}>
      <Grid size={6}><Card>Aninhado 1</Card></Grid>
      <Grid size={6}><Card>Aninhado 2</Card></Grid>
    </Grid>
  </Grid>
</Grid>
```

### 2. Container

Centraliza conteúdo horizontalmente com max-width responsivo.

```typescript
import Container from '@mui/material/Container';

// Container com max-width
<Container maxWidth="lg">
  <Typography>Conteúdo centralizado</Typography>
</Container>

// Breakpoints disponíveis: xs, sm, md, lg, xl
<Container maxWidth="sm">  {/* ~600px */}
<Container maxWidth="md">  {/* ~900px */}
<Container maxWidth="lg">  {/* ~1200px */}
<Container maxWidth="xl">  {/* ~1536px */}

// Container fluido (sem max-width)
<Container maxWidth={false} disableGutters>
  <Box>Largura total</Box>
</Container>
```

### 3. Breakpoints

Sistema de breakpoints do MUI:

```typescript
// Valores padrão
const breakpoints = {
  xs: 0,      // mobile
  sm: 600,    // tablet
  md: 900,    // tablet landscape / desktop pequeno
  lg: 1200,   // desktop
  xl: 1536    // desktop grande
};

// Uso em styled components
const ResponsiveBox = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),

  [theme.breakpoints.up('sm')]: {
    padding: theme.spacing(3),
  },

  [theme.breakpoints.up('md')]: {
    padding: theme.spacing(4),
  },

  [theme.breakpoints.between('sm', 'lg')]: {
    backgroundColor: theme.palette.primary.light,
  },

  [theme.breakpoints.down('sm')]: {
    fontSize: '0.875rem',
  },
}));

// Uso com sx prop
<Box
  sx={{
    width: {
      xs: '100%',    // 0-600px
      sm: '80%',     // 600-900px
      md: '60%',     // 900-1200px
      lg: '50%',     // 1200-1536px
      xl: '40%',     // 1536px+
    },
    margin: 'auto',
  }}
/>
```

### 4. useMediaQuery Hook

Hook poderoso para queries CSS media responsivas.

```typescript
import { useMediaQuery, useTheme } from '@mui/material';

function ResponsiveComponent() {
  const theme = useTheme();

  // Queries baseadas no tema
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  // Query customizada
  const isLandscape = useMediaQuery('(orientation: landscape)');
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

  // Renderização condicional
  if (isMobile) {
    return <MobileNav />;
  }

  return <DesktopNav />;
}

// Com opções SSR
function Component() {
  const matches = useMediaQuery('(min-width:600px)', {
    noSsr: false, // Previne hydration mismatch
    defaultMatches: false, // Valor padrão para SSR
  });

  return <div>{matches ? 'Desktop' : 'Mobile'}</div>;
}
```

## Padrões de Design Responsivo

### 1. Tipografia Responsiva

```typescript
// Typography com variantes responsivas
<Typography
  variant="h1"
  sx={{
    fontSize: {
      xs: '2rem',      // mobile
      sm: '2.5rem',    // tablet
      md: '3rem',      // desktop
      lg: '3.5rem',    // desktop grande
    },
    lineHeight: {
      xs: 1.2,
      md: 1.3,
    },
  }}
>
  Título Responsivo
</Typography>

// Typography responsiva no tema
const theme = createTheme({
  typography: {
    h1: {
      fontSize: '2rem',
      '@media (min-width:600px)': {
        fontSize: '2.5rem',
      },
      '@media (min-width:900px)': {
        fontSize: '3rem',
      },
    },
  },
});

// Função helper para responsiveFontSizes
import { createTheme, responsiveFontSizes } from '@mui/material/styles';

let theme = createTheme({
  typography: {
    h1: { fontSize: '3rem' },
    h2: { fontSize: '2.5rem' },
  },
});

theme = responsiveFontSizes(theme, {
  breakpoints: ['sm', 'md', 'lg'],
  factor: 2,
});
```

### 2. Espaçamento Responsivo

```typescript
// Padding/margin responsivo
<Box
  sx={{
    p: { xs: 2, sm: 3, md: 4 },
    m: { xs: 1, sm: 2, md: 3 },
  }}
>
  Conteúdo
</Box>

// Spacing entre elementos
<Stack
  spacing={{ xs: 1, sm: 2, md: 3 }}
  direction={{ xs: 'column', sm: 'row' }}
>
  <Button>Botão 1</Button>
  <Button>Botão 2</Button>
  <Button>Botão 3</Button>
</Stack>
```

### 3. Layout de Navegação Responsivo

```typescript
function ResponsiveAppBar() {
  const isMobile = useMediaQuery((theme: Theme) =>
    theme.breakpoints.down('md')
  );

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Logo
        </Typography>

        {isMobile ? (
          <>
            <IconButton color="inherit" onClick={handleMenuOpen}>
              <MenuIcon />
            </IconButton>
            <Drawer
              anchor="right"
              open={menuOpen}
              onClose={handleMenuClose}
            >
              <MobileMenu />
            </Drawer>
          </>
        ) : (
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button color="inherit">Home</Button>
            <Button color="inherit">About</Button>
            <Button color="inherit">Contact</Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
}
```

### 4. Cards Responsivos

```typescript
function ResponsiveCardGrid() {
  return (
    <Container maxWidth="lg">
      <Grid container spacing={{ xs: 2, md: 3 }}>
        {items.map((item) => (
          <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={item.id}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <CardMedia
                component="img"
                sx={{
                  height: { xs: 200, md: 250 },
                }}
                image={item.image}
                alt={item.title}
              />
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography
                  gutterBottom
                  variant="h5"
                  sx={{
                    fontSize: { xs: '1.25rem', md: '1.5rem' },
                  }}
                >
                  {item.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {item.description}
                </Typography>
              </CardContent>
              <CardActions>
                <Button size="small">Ver Mais</Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}
```

### 5. Dialog/Modal Responsivo

```typescript
function ResponsiveDialog() {
  const fullScreen = useMediaQuery((theme: Theme) =>
    theme.breakpoints.down('md')
  );

  return (
    <Dialog
      fullScreen={fullScreen}
      maxWidth="md"
      fullWidth
      open={open}
      onClose={handleClose}
      TransitionComponent={fullScreen ? Slide : Fade}
      TransitionProps={{ direction: 'up' }}
    >
      <DialogTitle>
        Título
        {fullScreen && (
          <IconButton
            onClick={handleClose}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        )}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ p: { xs: 1, md: 3 } }}>
          Conteúdo responsivo
        </Box>
      </DialogContent>
      {!fullScreen && (
        <DialogActions>
          <Button onClick={handleClose}>Cancelar</Button>
          <Button onClick={handleSubmit}>Confirmar</Button>
        </DialogActions>
      )}
    </Dialog>
  );
}
```

### 6. Formulários Responsivos

```typescript
function ResponsiveForm() {
  return (
    <Box
      component="form"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: { xs: 2, md: 3 },
        maxWidth: { xs: '100%', sm: 600, md: 800 },
        margin: 'auto',
        p: { xs: 2, md: 3 },
      }}
    >
      <Grid container spacing={{ xs: 2, md: 3 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField fullWidth label="Nome" />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField fullWidth label="Email" />
        </Grid>
        <Grid size={12}>
          <TextField fullWidth multiline rows={4} label="Mensagem" />
        </Grid>
      </Grid>

      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2,
          justifyContent: 'flex-end',
        }}
      >
        <Button variant="outlined" fullWidth={isMobile}>
          Cancelar
        </Button>
        <Button variant="contained" fullWidth={isMobile}>
          Enviar
        </Button>
      </Box>
    </Box>
  );
}
```

## Melhores Práticas

### 1. Mobile-First

Sempre comece com o design mobile e adicione breakpoints conforme necessário.

```typescript
// ✅ BOM - Mobile-first
<Box
  sx={{
    fontSize: '14px',           // mobile (padrão)
    [theme.breakpoints.up('sm')]: {
      fontSize: '16px',         // tablet+
    },
    [theme.breakpoints.up('md')]: {
      fontSize: '18px',         // desktop+
    },
  }}
/>

// ❌ RUIM - Desktop-first
<Box
  sx={{
    fontSize: '18px',
    [theme.breakpoints.down('md')]: {
      fontSize: '16px',
    },
    [theme.breakpoints.down('sm')]: {
      fontSize: '14px',
    },
  }}
/>
```

### 2. Touchable Areas

Garanta áreas de toque adequadas para mobile (mínimo 48x48px).

```typescript
<IconButton
  sx={{
    p: { xs: 1.5, md: 1 }, // Padding maior no mobile
  }}
>
  <MenuIcon />
</IconButton>
```

### 3. Performance

Use `display: none` com cuidado - componentes ainda são renderizados.

```typescript
// ✅ BOM - Renderização condicional
{isMobile ? <MobileComponent /> : <DesktopComponent />}

// ⚠️ CUIDADO - Ambos renderizam
<Box sx={{ display: { xs: 'block', md: 'none' } }}>
  <MobileComponent />
</Box>
<Box sx={{ display: { xs: 'none', md: 'block' } }}>
  <DesktopComponent />
</Box>
```

### 4. Imagens Responsivas

```typescript
<Box
  component="img"
  src={image}
  alt="descrição"
  sx={{
    width: '100%',
    height: 'auto',
    maxWidth: { xs: '100%', sm: 400, md: 600 },
    objectFit: 'cover',
  }}
/>
```

### 5. Teste em Dispositivos Reais

- Use Chrome DevTools para simular
- Teste em dispositivos físicos quando possível
- Considere diferentes DPIs e resoluções
- Teste orientações portrait e landscape
