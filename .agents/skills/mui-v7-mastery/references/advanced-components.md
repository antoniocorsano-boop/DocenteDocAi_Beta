# Padrões Avançados de Componentes MUI V7

## Componentes de Layout Profissionais

### 1. Dashboard Layout Responsivo

```typescript
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  IconButton,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { Menu as MenuIcon } from '@mui/icons-material';

const drawerWidth = 240;

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const drawer = (
    <Box sx={{ overflow: 'auto' }}>
      <Toolbar />
      <List>
        {/* Navigation items */}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          {isMobile && (
            <IconButton
              color="inherit"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          <Typography variant="h6" noWrap component="div">
            Dashboard
          </Typography>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>

        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        <Toolbar /> {/* Spacer */}
        {children}
      </Box>
    </Box>
  );
}
```

### 2. Card com Skeleton Loading

```typescript
import {
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Button,
  Typography,
  Skeleton,
} from '@mui/material';

interface ProductCardProps {
  loading?: boolean;
  title?: string;
  description?: string;
  image?: string;
  price?: number;
}

export function ProductCard({
  loading = false,
  title,
  description,
  image,
  price,
}: ProductCardProps) {
  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: (theme) => theme.shadows[8],
        },
      }}
    >
      {loading ? (
        <Skeleton variant="rectangular" height={200} />
      ) : (
        <CardMedia
          component="img"
          height="200"
          image={image}
          alt={title}
          sx={{ objectFit: 'cover' }}
        />
      )}

      <CardContent sx={{ flexGrow: 1 }}>
        {loading ? (
          <>
            <Skeleton width="80%" height={32} />
            <Skeleton width="100%" />
            <Skeleton width="100%" />
          </>
        ) : (
          <>
            <Typography gutterBottom variant="h5" component="h2">
              {title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {description}
            </Typography>
            <Typography
              variant="h6"
              color="primary"
              sx={{ mt: 2, fontWeight: 'bold' }}
            >
              R$ {price?.toFixed(2)}
            </Typography>
          </>
        )}
      </CardContent>

      <CardActions sx={{ p: 2 }}>
        {loading ? (
          <Skeleton width={100} height={40} />
        ) : (
          <Button variant="contained" fullWidth>
            Comprar
          </Button>
        )}
      </CardActions>
    </Card>
  );
}
```

### 3. Data Table Avançada

```typescript
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Paper,
  TextField,
  Box,
  Chip,
} from '@mui/material';

interface Column<T> {
  id: keyof T;
  label: string;
  minWidth?: number;
  align?: 'left' | 'right' | 'center';
  format?: (value: any) => string | React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  searchable?: boolean;
  sortable?: boolean;
}

export function DataTable<T extends { id: string | number }>({
  columns,
  data,
  searchable = true,
  sortable = true,
}: DataTableProps<T>) {
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const [orderBy, setOrderBy] = React.useState<keyof T | ''>('');
  const [order, setOrder] = React.useState<'asc' | 'desc'>('asc');
  const [searchTerm, setSearchTerm] = React.useState('');

  const handleSort = (property: keyof T) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const filteredData = React.useMemo(() => {
    if (!searchTerm) return data;

    return data.filter((row) =>
      Object.values(row).some((value) =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [data, searchTerm]);

  const sortedData = React.useMemo(() => {
    if (!orderBy) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aVal = a[orderBy];
      const bVal = b[orderBy];

      if (order === 'asc') {
        return aVal < bVal ? -1 : 1;
      }
      return aVal > bVal ? -1 : 1;
    });
  }, [filteredData, order, orderBy]);

  const paginatedData = sortedData.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden' }}>
      {searchable && (
        <Box sx={{ p: 2 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Pesquisar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </Box>
      )}

      <TableContainer sx={{ maxHeight: 600 }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={String(column.id)}
                  align={column.align}
                  style={{ minWidth: column.minWidth }}
                >
                  {sortable ? (
                    <TableSortLabel
                      active={orderBy === column.id}
                      direction={orderBy === column.id ? order : 'asc'}
                      onClick={() => handleSort(column.id)}
                    >
                      {column.label}
                    </TableSortLabel>
                  ) : (
                    column.label
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {paginatedData.map((row) => (
              <TableRow hover key={row.id}>
                {columns.map((column) => {
                  const value = row[column.id];
                  return (
                    <TableCell key={String(column.id)} align={column.align}>
                      {column.format ? column.format(value) : String(value)}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[5, 10, 25, 50]}
        component="div"
        count={sortedData.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={(_, newPage) => setPage(newPage)}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
        labelRowsPerPage="Linhas por página:"
        labelDisplayedRows={({ from, to, count }) =>
          `${from}–${to} de ${count}`
        }
      />
    </Paper>
  );
}
```

### 4. Form com Validação

```typescript
import {
  Box,
  TextField,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const formSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
});

type FormData = z.infer<typeof formSchema>;

export function RegistrationForm() {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError(null);

    try {
      // Simulação de API call
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setSuccess(true);
    } catch (err) {
      setError('Erro ao criar conta. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Alert severity="success">
        Conta criada com sucesso!
      </Alert>
    );
  }

  return (
    <Box
      component="form"
      onSubmit={handleSubmit(onSubmit)}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        maxWidth: 500,
        mx: 'auto',
        p: 3,
      }}
    >
      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Controller
        name="name"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label="Nome"
            error={!!errors.name}
            helperText={errors.name?.message}
            fullWidth
          />
        )}
      />

      <Controller
        name="email"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label="Email"
            type="email"
            error={!!errors.email}
            helperText={errors.email?.message}
            fullWidth
          />
        )}
      />

      <Controller
        name="password"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label="Senha"
            type="password"
            error={!!errors.password}
            helperText={errors.password?.message}
            fullWidth
          />
        )}
      />

      <Controller
        name="confirmPassword"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label="Confirmar Senha"
            type="password"
            error={!!errors.confirmPassword}
            helperText={errors.confirmPassword?.message}
            fullWidth
          />
        )}
      />

      <Button
        type="submit"
        variant="contained"
        size="large"
        disabled={loading}
        sx={{ mt: 2 }}
      >
        {loading ? <CircularProgress size={24} /> : 'Criar Conta'}
      </Button>
    </Box>
  );
}
```

### 5. Snackbar/Toast System

```typescript
import {
  Snackbar,
  Alert,
  AlertColor,
  IconButton,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

interface ToastMessage {
  id: string;
  message: string;
  severity: AlertColor;
}

// Context
const ToastContext = React.createContext<{
  showToast: (message: string, severity?: AlertColor) => void;
} | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastMessage[]>([]);

  const showToast = (message: string, severity: AlertColor = 'info') => {
    const id = Math.random().toString(36);
    setToasts((prev) => [...prev, { id, message, severity }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toasts.map((toast) => (
        <Snackbar
          key={toast.id}
          open
          autoHideDuration={6000}
          onClose={() => removeToast(toast.id)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            onClose={() => removeToast(toast.id)}
            severity={toast.severity}
            sx={{ width: '100%' }}
            action={
              <IconButton
                size="small"
                color="inherit"
                onClick={() => removeToast(toast.id)}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            }
          >
            {toast.message}
          </Alert>
        </Snackbar>
      ))}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

// Uso
function MyComponent() {
  const { showToast } = useToast();

  return (
    <Button
      onClick={() => showToast('Operação bem-sucedida!', 'success')}
    >
      Mostrar Toast
    </Button>
  );
}
```

### 6. Autocomplete Avançado

```typescript
import {
  Autocomplete,
  TextField,
  CircularProgress,
  Avatar,
  Box,
  Typography,
} from '@mui/material';

interface Option {
  id: number;
  name: string;
  avatar?: string;
  email?: string;
}

interface AsyncAutocompleteProps {
  label: string;
  onSelect: (option: Option | null) => void;
  fetchOptions: (query: string) => Promise<Option[]>;
}

export function AsyncAutocomplete({
  label,
  onSelect,
  fetchOptions,
}: AsyncAutocompleteProps) {
  const [open, setOpen] = React.useState(false);
  const [options, setOptions] = React.useState<Option[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [inputValue, setInputValue] = React.useState('');

  React.useEffect(() => {
    if (!open) {
      setOptions([]);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const results = await fetchOptions(inputValue);
        setOptions(results);
      } catch (error) {
        console.error('Error fetching options:', error);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchData, 300);
    return () => clearTimeout(debounceTimer);
  }, [inputValue, open]);

  return (
    <Autocomplete
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      options={options}
      loading={loading}
      getOptionLabel={(option) => option.name}
      isOptionEqualToValue={(option, value) => option.id === value.id}
      onInputChange={(_, value) => setInputValue(value)}
      onChange={(_, value) => onSelect(value)}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading && <CircularProgress color="inherit" size={20} />}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
      renderOption={(props, option) => (
        <Box component="li" {...props}>
          {option.avatar && (
            <Avatar
              src={option.avatar}
              alt={option.name}
              sx={{ mr: 2, width: 32, height: 32 }}
            />
          )}
          <Box>
            <Typography variant="body1">{option.name}</Typography>
            {option.email && (
              <Typography variant="caption" color="text.secondary">
                {option.email}
              </Typography>
            )}
          </Box>
        </Box>
      )}
    />
  );
}
```

## Melhores Práticas de Performance

### 1. Lazy Loading de Componentes

```typescript
import { lazy, Suspense } from 'react';
import { CircularProgress, Box } from '@mui/material';

const HeavyComponent = lazy(() => import('./HeavyComponent'));

function App() {
  return (
    <Suspense
      fallback={
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
          }}
        >
          <CircularProgress />
        </Box>
      }
    >
      <HeavyComponent />
    </Suspense>
  );
}
```

### 2. Memoização

```typescript
import { memo } from 'react';

interface ExpensiveCardProps {
  data: ComplexData;
  onAction: () => void;
}

export const ExpensiveCard = memo(function ExpensiveCard({
  data,
  onAction,
}: ExpensiveCardProps) {
  // Renderização pesada
  return <Card>...</Card>;
}, (prevProps, nextProps) => {
  // Custom comparison
  return prevProps.data.id === nextProps.data.id;
});
```

### 3. Virtualização para Listas Grandes

```typescript
import { FixedSizeList } from 'react-window';
import { ListItem, ListItemText, Paper } from '@mui/material';

interface VirtualizedListProps {
  items: string[];
}

export function VirtualizedList({ items }: VirtualizedListProps) {
  return (
    <Paper sx={{ height: 400, overflow: 'hidden' }}>
      <FixedSizeList
        height={400}
        width="100%"
        itemSize={46}
        itemCount={items.length}
        overscanCount={5}
      >
        {({ index, style }) => (
          <ListItem style={style} key={index}>
            <ListItemText primary={items[index]} />
          </ListItem>
        )}
      </FixedSizeList>
    </Paper>
  );
}
```
