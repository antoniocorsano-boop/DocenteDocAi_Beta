// MD3 Gold Compliant — MUI v7 full compliance rewrite
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';
import Divider from '@mui/material/Divider';
import CircularProgress from '@mui/material/CircularProgress';
import React, { useState, useMemo, useEffect, useRef, Suspense, lazy } from 'react';
import '../modules.css';
import { EventoCalendario, AiSettings, View, NavigationParams } from '../types';
import ContextualAskAI from './ui/ContextualAskAI';
const EventModal = lazy(() => import('./EventModal'));
const AiEventParserModal = lazy(() => import('./AiEventParserModal'));
import EventActionPopover from './EventActionPopover';

interface CalendarProps {
    eventi: EventoCalendario[];
    setEventi: React.Dispatch<React.SetStateAction<EventoCalendario[]>>;
    aiSettings: AiSettings;
    activeSuggestion?: unknown;
    onNavigate?: (view: View, context?: NavigationParams) => void;
}

type CalendarView = 'month' | 'week' | 'day' | 'agenda';

const DAYS_SHORT = ['LUN', 'MAR', 'MER', 'GIO', 'VEN', 'SAB', 'DOM'];
const MONTHS_LONG = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];

const Calendar: React.FC<CalendarProps> = ({ eventi, setEventi, aiSettings, onNavigate }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<CalendarView>('month');
    const [editingEvent, setEditingEvent] = useState<Partial<EventoCalendario> | null>(null);
    const [isAiParserOpen, setIsAiParserOpen] = useState(false);
    const [popoverState, setPopoverState] = useState<{ event: EventoCalendario; anchorEl: HTMLElement } | null>(null);
    const [focusedDateIndex, setFocusedDateIndex] = useState<number>(0);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const calendarGridRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if ((viewMode === 'week' || viewMode === 'day') && scrollContainerRef.current) {
            const now = new Date();
            const hour = now.getHours();
            const scrollPos = Math.max(0, (hour - 1) * 60);
            scrollContainerRef.current.scrollTop = scrollPos;
        }
        // Reset focus when view changes
        setFocusedDateIndex(0);
    }, [viewMode]);

    const handleCalendarKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        // Arrow key navigation for calendar grid (month view)
        if (viewMode !== 'month') return;

        const keysToHandle = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
        if (!keysToHandle.includes(e.key)) return;

        e.preventDefault();
        const totalDays = monthDates.length;
        const daysPerWeek = 7;
        let newIndex = focusedDateIndex;

        switch (e.key) {
            case 'ArrowLeft':
                newIndex = focusedDateIndex > 0 ? focusedDateIndex - 1 : 0;
                break;
            case 'ArrowRight':
                newIndex = focusedDateIndex < totalDays - 1 ? focusedDateIndex + 1 : totalDays - 1;
                break;
            case 'ArrowUp':
                newIndex = Math.max(0, focusedDateIndex - daysPerWeek);
                break;
            case 'ArrowDown':
                newIndex = Math.min(totalDays - 1, focusedDateIndex + daysPerWeek);
                break;
            case 'Home':
                newIndex = 0;
                break;
            case 'End':
                newIndex = totalDays - 1;
                break;
        }

        setFocusedDateIndex(newIndex);
    };

    const handleNavigate = (direction: 'prev' | 'next' | 'today') => {
        const newDate = new Date(currentDate);
        if (direction === 'today') {
            setCurrentDate(new Date());
            return;
        }

        const modifier = direction === 'next' ? 1 : -1;

        switch (viewMode) {
            case 'month':
                newDate.setMonth(currentDate.getMonth() + modifier);
                break;
            case 'week':
                newDate.setDate(currentDate.getDate() + (modifier * 7));
                break;
            case 'day':
                newDate.setDate(currentDate.getDate() + modifier);
                break;
            case 'agenda':
                newDate.setMonth(currentDate.getMonth() + modifier);
                break;
        }
        setCurrentDate(newDate);
    };

    const monthDates = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1);
        const startDayOfWeek = firstDayOfMonth.getDay();
        const daysFromPrevMonth = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;
        const startDate = new Date(firstDayOfMonth);
        startDate.setDate(startDate.getDate() - daysFromPrevMonth);
        const dates: Date[] = [];
        for (let i = 0; i < 42; i++) {
            const d = new Date(startDate);
            d.setDate(startDate.getDate() + i);
            dates.push(d);
        }
        return dates;
    }, [currentDate]);

    const weekDates = useMemo(() => {
        const startOfWeek = new Date(currentDate);
        const day = startOfWeek.getDay();
        const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
        startOfWeek.setDate(diff);
        startOfWeek.setHours(0, 0, 0, 0);
        
        const dates: Date[] = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(startOfWeek);
            d.setDate(startOfWeek.getDate() + i);
            dates.push(d);
        }
        return dates;
    }, [currentDate]);

    const dayEvents = useMemo(() => {
        return eventi.filter(e => e.data === currentDate.toISOString().split('T')[0]);
    }, [eventi, currentDate]);

    const agendaGroups = useMemo(() => {
        const sorted = [...eventi].sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
        const groups: Record<string, EventoCalendario[]> = {};
        sorted.forEach(ev => {
            const evDate = new Date(ev.data);
            if (viewMode === 'agenda') {
                const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
                const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
                if (evDate >= start && evDate <= end) {
                    const key = ev.data;
                    if (!groups[key]) groups[key] = [];
                    groups[key].push(ev);
                }
            }
        });
        return groups;
    }, [eventi, currentDate, viewMode]);

const renderHeader = () => {
        const title = viewMode === 'day'
            ? currentDate.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })
            : `${MONTHS_LONG[currentDate.getMonth()]} ${currentDate.getFullYear()}`;

        return (
            <Box
                component="header"
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 2,
                    px: 3,
                    py: 2,
                    bgcolor: 'var(--md-sys-color-surface-container-low)',
                    borderBottom: '1px solid var(--md-sys-color-outline-variant)',
                }}
            >
                {/* Left: nav controls + title */}
                <Stack direction="row" alignItems="center" gap={2}>
                    <Paper
                        variant="outlined"
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            px: 0.5,
                            py: 0.5,
                            borderRadius: 'var(--md-sys-shape-corner-full)',
                        }}
                    >
                        <IconButton
                            size="small"
                            onClick={() => handleNavigate('prev')}
                            aria-label="Vai al periodo precedente"
                        >
                            <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 20 }}>chevron_left</Box>
                        </IconButton>
                        <Button
                            variant="outlined"
                            size="small"
                            onClick={() => handleNavigate('today')}
                            sx={{ borderRadius: 'var(--md-sys-shape-corner-full)', minWidth: 64 }}
                        >
                            Oggi
                        </Button>
                        <IconButton
                            size="small"
                            onClick={() => handleNavigate('next')}
                            aria-label="Vai al periodo successivo"
                        >
                            <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 20 }}>chevron_right</Box>
                        </IconButton>
                    </Paper>
                    <Typography variant="h5" sx={{ color: 'var(--md-sys-color-on-surface)' }}>
                        {title}
                    </Typography>
                </Stack>

                {/* Right: view tabs + actions */}
                <Stack direction="row" alignItems="center" gap={1.5}>
                    <Tabs
                        value={viewMode}
                        onChange={(_, v: string) => setViewMode(v as CalendarView)}
                        indicatorColor="primary"
                        textColor="primary"
                        aria-label="Modalità di visualizzazione calendario"
                        sx={{
                            bgcolor: 'var(--md-sys-color-surface)',
                            borderRadius: 'var(--md-sys-shape-corner-full)',
                            border: '1px solid var(--md-sys-color-outline-variant)',
                            minHeight: 40,
                            p: 0.5,
                            '& .MuiTabs-indicator': { display: 'none' },
                            '& .Mui-selected': {
                                bgcolor: 'var(--md-sys-color-secondary-container)',
                                borderRadius: 'var(--md-sys-shape-corner-full)',
                                color: 'var(--md-sys-color-on-secondary-container) !important',
                            },
                        }}
                    >
                        {([
                            { id: 'month', label: 'Mese' },
                            { id: 'week', label: 'Settimana' },
                            { id: 'day', label: 'Giorno' },
                            { id: 'agenda', label: 'Agenda' },
                        ] as { id: string; label: string; badge?: number }[]).map(tab => (
                            <Tab
                                key={tab.id}
                                value={tab.id}
                                id={`tab-${tab.id}`}
                                aria-controls={`panel-${tab.id}`}
                                data-testid={`tab-${tab.id}`}
                                label={
                                    <Badge badgeContent={tab.badge} color="error">
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            {tab.label}
                                        </Box>
                                    </Badge>
                                }
                                sx={{
                                    borderRadius: 'var(--md-sys-shape-corner-full)',
                                    minHeight: 32,
                                    py: 0.5,
                                    px: 2,
                                    textTransform: 'uppercase',
                                    fontSize: 'var(--md-sys-typescale-body-small-font-size)',
                                    fontWeight: 'var(--md-sys-typescale-weight-medium)',
                                }}
                            />
                        ))}
                    </Tabs>

                    <IconButton
                        onClick={() => setIsAiParserOpen(true)}
                        aria-label="Analizza circolare con AI"
                        color="primary"
                        size="medium"
                    >
                        <Box component="span" className="material-symbols-outlined" aria-hidden="true">auto_awesome</Box>
                    </IconButton>

                    <Button
                        variant="contained"
                        onClick={() => setEditingEvent({})}
                        startIcon={<Box component="span" className="material-symbols-outlined" aria-hidden="true">add</Box>}
                        aria-label="Crea nuovo evento"
                    >
                        Nuovo Evento
                    </Button>
                </Stack>
            </Box>
        );
    };

    const renderMonthView = () => (
        <Box role="grid" aria-label="Calendario mensile" ref={calendarGridRef} onKeyDown={handleCalendarKeyDown}>
            {/* Day-of-week header row */}
            <Box
                role="row"
                sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(7, var(--md-sys-grid-fr-1))',
                    bgcolor: 'var(--md-sys-color-surface-container-low)',
                    borderBottom: '1px solid var(--md-sys-color-outline-variant)',
                }}
            >
                {DAYS_SHORT.map(d => (
                    <Box
                        key={d}
                        role="columnheader"
                        aria-label={d}
                        sx={{ py: 1, textAlign: 'center' }}
                    >
                        <Typography
                            variant="caption"
                            sx={{
                                fontWeight: 'var(--md-sys-typescale-weight-bold)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.08em',
                                color: 'var(--md-sys-color-on-surface-variant)',
                            }}
                        >
                            {d}
                        </Typography>
                    </Box>
                ))}
            </Box>

            {/* Day cells grid */}
            <Box
                role="rowgroup"
                sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(7, var(--md-sys-grid-fr-1))',
                    borderLeft: '1px solid var(--md-sys-color-outline-variant)',
                    borderTop: '1px solid var(--md-sys-color-outline-variant)',
                }}
            >
                {monthDates.map((date, i) => {
                    const isCurrentMonth = date.getMonth() === currentDate.getMonth();
                    const isToday = date.toDateString() === new Date().toDateString();
                    const isFocused = i === focusedDateIndex && viewMode === 'month';
                    const cellEvents = eventi.filter(e => e.data === date.toISOString().split('T')[0]);

                    return (
                        <Box
                            key={i}
                            sx={{
                                minHeight: 100,
                                p: 1,
                                borderRight: '1px solid var(--md-sys-color-outline-variant)',
                                borderBottom: '1px solid var(--md-sys-color-outline-variant)',
                                bgcolor: !isCurrentMonth
                                    ? 'var(--md-sys-color-surface-container-lowest)'
                                    : 'var(--md-sys-color-surface)',
                                opacity: !isCurrentMonth ? 0.6 : 1,
                                cursor: 'pointer',
                                transition: 'background-color 150ms',
                                '&:hover': {
                                    bgcolor: !isCurrentMonth
                                        ? 'var(--md-sys-color-surface-container-low)'
                                        : 'var(--md-sys-color-surface-container)',
                                },
                                ...(isFocused ? {
                                    outline: '2px solid var(--md-sys-color-primary)',
                                    outlineOffset: '-2px',
                                } : {}),
                            }}
                            role="gridcell"
                            tabIndex={isFocused ? 0 : -1}
                            aria-label={`${date.toLocaleDateString('it-IT')}${cellEvents.length > 0 ? `, ${cellEvents.length} eventi` : ''}`}
                            onFocus={() => setFocusedDateIndex(i)}
                            onClick={() => { setCurrentDate(date); setViewMode('day'); }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    setCurrentDate(date);
                                    setViewMode('day');
                                }
                            }}
                        >
                            {/* Date number badge */}
                            <Box
                                component="span"
                                sx={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: 28,
                                    height: 28,
                                    mb: 0.5,
                                    typography: 'body2',
                                    fontWeight: isToday ? 'var(--md-sys-typescale-weight-bold)' : 'var(--md-sys-typescale-weight-regular)',
                                    color: isToday ? 'var(--md-sys-color-on-primary)' : 'var(--md-sys-color-on-surface)',
                                    bgcolor: isToday ? 'var(--md-sys-color-primary)' : 'transparent',
                                    borderRadius: '50%',
                                }}
                            >
                                {date.getDate()}
                            </Box>

                            {/* Event chips */}
                            <Stack direction="column" gap={0.5}>
                                {cellEvents.slice(0, 3).map((ev, idx) => (
                                    <Chip
                                        key={ev.id || idx}
                                        size="small"
                                        onClick={(e) => { e.stopPropagation(); setEditingEvent(ev); }}
                                        aria-label={ev.titolo}
                                        sx={{
                                            height: 20,
                                            width: '100%',
                                            justifyContent: 'flex-start',
                                            fontSize: 'var(--md-sys-typescale-label-small-font-size)',
                                            fontWeight: 'var(--md-sys-typescale-weight-medium)',
                                            borderRadius: '4px',
                                            bgcolor: ev.tipo === 'urgente' ? 'var(--md-sys-color-error-container)' :
                                                     ev.tipo === 'scadenza' ? 'var(--md-sys-color-tertiary-container)' :
                                                     ev.tipo === 'riunione' ? 'var(--md-sys-color-primary-container)' :
                                                     'var(--md-sys-color-secondary-container)',
                                            color: ev.tipo === 'urgente' ? 'var(--md-sys-color-on-error-container)' :
                                                   ev.tipo === 'scadenza' ? 'var(--md-sys-color-on-tertiary-container)' :
                                                   ev.tipo === 'riunione' ? 'var(--md-sys-color-on-primary-container)' :
                                                   'var(--md-sys-color-on-secondary-container)',
                                            '& .MuiChip-label': {
                                                px: 1,
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                                display: 'block',
                                            },
                                        }}
                                    />
                                ))}
                                {cellEvents.length > 3 && (
                                    <Typography variant="caption" sx={{ color: 'var(--md-sys-color-on-surface-variant)', pl: 0.5 }}>
                                        +{cellEvents.length - 3} altri
                                    </Typography>
                                )}
                            </Stack>
                        </Box>
                    );
                })}
            </Box>
        </Box>
    );

    const renderWeekView = () => (
        <Stack direction="column">
            {/* Day-of-week header row */}
            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: '56px repeat(7, var(--md-sys-grid-fr-1))',
                    bgcolor: 'var(--md-sys-color-surface-container-low)',
                    borderBottom: '1px solid var(--md-sys-color-outline-variant)',
                    position: 'sticky',
                    top: 0,
                    zIndex: 1,
                }}
            >
                <Box /> {/* offset for time column */}
                {weekDates.map((date, i) => {
                    const isToday = date.toDateString() === new Date().toDateString();
                    return (
                        <Box
                            key={i}
                            sx={{ py: 1, textAlign: 'center', borderLeft: '1px solid var(--md-sys-color-outline-variant)' }}
                        >
                            <Typography
                                variant="caption"
                                sx={{
                                    display: 'block',
                                    fontWeight: 'var(--md-sys-typescale-weight-bold)',
                                    textTransform: 'uppercase',
                                    color: 'var(--md-sys-color-on-surface-variant)',
                                }}
                            >
                                {DAYS_SHORT[i]}
                            </Typography>
                            <Box
                                sx={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: 28,
                                    height: 28,
                                    mt: 0.25,
                                    typography: 'body2',
                                    fontWeight: isToday ? 'var(--md-sys-typescale-weight-bold)' : 'var(--md-sys-typescale-weight-regular)',
                                    color: isToday ? 'var(--md-sys-color-on-primary)' : 'var(--md-sys-color-on-surface)',
                                    bgcolor: isToday ? 'var(--md-sys-color-primary)' : 'transparent',
                                    borderRadius: '50%',
                                }}
                            >
                                {date.getDate()}
                            </Box>
                        </Box>
                    );
                })}
            </Box>

            {/* Time grid */}
            <Box
                ref={scrollContainerRef}
                sx={{ overflowY: 'auto', maxHeight: 'calc(var(--md-sys-viewport-height-dvh) - 200px)' }}
            >
                {Array.from({ length: 24 }, (_, hour) => (
                    <Box
                        key={hour}
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: '56px repeat(7, var(--md-sys-grid-fr-1))',
                            minHeight: 60,
                            borderBottom: '1px solid var(--md-sys-color-outline-variant)',
                        }}
                    >
                        {/* Time label */}
                        <Box sx={{ px: 1, pt: 0.5 }}>
                            <Typography variant="caption" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                                {hour.toString().padStart(2, '0')}:00
                            </Typography>
                        </Box>

                        {/* Day columns */}
                        {weekDates.map((date, dayIndex) => {
                            const slotEvents = eventi.filter(e => {
                                const eventDate = new Date(e.data);
                                return (
                                    eventDate.toDateString() === date.toDateString() &&
                                    e.oraInizio &&
                                    parseInt(e.oraInizio.split(':')[0]) === hour
                                );
                            });

                            return (
                                <Box
                                    key={dayIndex}
                                    sx={{
                                        borderLeft: '1px solid var(--md-sys-color-outline-variant)',
                                        p: 0.25,
                                    }}
                                >
                                    {slotEvents.map((ev) => (
                                        <Chip
                                            key={ev.id}
                                           
                                            size="small"
                                            onClick={() => setEditingEvent(ev)}
                                            aria-label={ev.titolo}
                                            sx={{
                                                width: '100%',
                                                height: 'auto',
                                                justifyContent: 'flex-start',
                                                fontSize: 'var(--md-sys-typescale-label-small-font-size)',
                                                fontWeight: 'var(--md-sys-typescale-weight-medium)',
                                                borderRadius: '4px',
                                                mb: 0.25,
                                                bgcolor: ev.tipo === 'urgente' ? 'var(--md-sys-color-error-container)' :
                                                         ev.tipo === 'scadenza' ? 'var(--md-sys-color-tertiary-container)' :
                                                         ev.tipo === 'riunione' ? 'var(--md-sys-color-primary-container)' :
                                                         'var(--md-sys-color-secondary-container)',
                                                color: ev.tipo === 'urgente' ? 'var(--md-sys-color-on-error-container)' :
                                                       ev.tipo === 'scadenza' ? 'var(--md-sys-color-on-tertiary-container)' :
                                                       ev.tipo === 'riunione' ? 'var(--md-sys-color-on-primary-container)' :
                                                       'var(--md-sys-color-on-secondary-container)',
                                                '& .MuiChip-label': {
                                                    px: 1,
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                    display: 'block',
                                                },
                                            }}
                                        />
                                    ))}
                                </Box>
                            );
                        })}
                    </Box>
                ))}
            </Box>
        </Stack>
    );

    const renderDayView = () => (
        <Stack direction="column">
            <Box sx={{ px: 3, py: 2, borderBottom: '1px solid var(--md-sys-color-outline-variant)' }}>
                <Typography variant="h6" sx={{ color: 'var(--md-sys-color-primary)', textTransform: 'capitalize' }}>
                    {currentDate.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </Typography>
            </Box>

            <Box ref={scrollContainerRef} sx={{ overflowY: 'auto', maxHeight: 'calc(var(--md-sys-viewport-height-dvh) - 200px)' }}>
                {dayEvents.length === 0 ? (
                    <Stack alignItems="center" justifyContent="center" sx={{ py: 6, textAlign: 'center' }}>
                        <Box
                            component="span"
                            className="material-symbols-outlined"
                            aria-hidden="true"
                            sx={{ fontSize: 48, color: 'var(--md-sys-color-on-surface-variant)', mb: 2 }}
                        >
                            event_busy
                        </Box>
                        <Typography variant="body2" sx={{ color: 'var(--md-sys-color-on-surface-variant)', mb: 2 }}>
                            Nessun evento per questo giorno
                        </Typography>
                        <Button variant="text" onClick={() => setEditingEvent({})}>
                            Aggiungi Evento
                        </Button>
                    </Stack>
                ) : (
                    <List disablePadding>
                        {dayEvents.map(ev => (
                            <React.Fragment key={ev.id}>
                                <ListItemButton
                                    onClick={() => setEditingEvent(ev)}
                                    aria-label={ev.titolo}
                                    sx={{
                                        px: 3,
                                        py: 1.5,
                                        gap: 2,
                                        borderLeft: `4px solid`,
                                        borderLeftColor: ev.tipo === 'urgente' ? 'var(--md-sys-color-error)' :
                                                         ev.tipo === 'scadenza' ? 'var(--md-sys-color-tertiary)' :
                                                         ev.tipo === 'riunione' ? 'var(--md-sys-color-primary)' :
                                                         'var(--md-sys-color-secondary)',
                                        bgcolor: ev.tipo === 'urgente' ? 'var(--md-sys-color-error-container)' :
                                                 ev.tipo === 'scadenza' ? 'var(--md-sys-color-tertiary-container)' :
                                                 ev.tipo === 'riunione' ? 'var(--md-sys-color-primary-container)' :
                                                 'var(--md-sys-color-secondary-container)',
                                        color: ev.tipo === 'urgente' ? 'var(--md-sys-color-on-error-container)' :
                                               ev.tipo === 'scadenza' ? 'var(--md-sys-color-on-tertiary-container)' :
                                               ev.tipo === 'riunione' ? 'var(--md-sys-color-on-primary-container)' :
                                               'var(--md-sys-color-on-secondary-container)',
                                        '&:hover': { filter: 'brightness(0.95)' },
                                    }}
                                >
                                    <Typography variant="caption" sx={{ fontWeight: 'var(--md-sys-typescale-weight-bold)', minWidth: 48, flexShrink: 0 }}>
                                        {ev.oraInizio || 'Tutto il giorno'}
                                    </Typography>
                                    <ListItemText
                                        primary={ev.titolo}
                                        secondary={ev.location ? `📍 ${ev.location}` : ev.descrizione}
                                        slotProps={{
                                            primary: { variant: 'body2', sx: { fontWeight: 'var(--md-sys-typescale-weight-semibold)' } },
                                            secondary: { variant: 'caption', sx: { color: 'inherit', opacity: 0.75 } },
                                        }}
                                    />
                                </ListItemButton>
                                <Divider />
                            </React.Fragment>
                        ))}
                    </List>
                )}
            </Box>
        </Stack>
    );

    const renderAgendaView = () => (
        <Box sx={{ p: 2 }}>
            {Object.keys(agendaGroups).length === 0 ? (
                <Stack alignItems="center" justifyContent="center" sx={{ py: 6, textAlign: 'center' }}>
                    <Box
                        component="span"
                        className="material-symbols-outlined"
                        aria-hidden="true"
                        sx={{ fontSize: 48, color: 'var(--md-sys-color-on-surface-variant)', mb: 2 }}
                    >
                        event_busy
                    </Box>
                    <Typography variant="body2" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                        Nessun evento questo mese
                    </Typography>
                </Stack>
            ) : (
                <Stack direction="column" gap={2}>
                    {Object.entries(agendaGroups).map(([date, evts]) => (
                        <Paper
                            key={date}
                            variant="outlined"
                            sx={{ borderRadius: 'var(--md-sys-shape-corner-large)', overflow: 'hidden' }}
                        >
                            <List
                                disablePadding
                                subheader={
                                    <ListSubheader
                                        sx={{
                                            bgcolor: 'var(--md-sys-color-surface-container)',
                                            color: 'var(--md-sys-color-primary)',
                                            fontWeight: 'var(--md-sys-typescale-weight-semibold)',
                                            lineHeight: '40px',
                                            borderBottom: '1px solid var(--md-sys-color-outline-variant)',
                                            textTransform: 'capitalize',
                                        }}
                                    >
                                        {new Date(date).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}
                                    </ListSubheader>
                                }
                            >
                                {evts.map((ev, idx) => (
                                    <React.Fragment key={ev.id}>
                                        <ListItemButton
                                            onClick={() => setEditingEvent(ev)}
                                            aria-label={ev.titolo}
                                            sx={{
                                                px: 2,
                                                py: 1.25,
                                                gap: 2,
                                                borderLeft: `4px solid`,
                                                borderLeftColor: ev.tipo === 'urgente' ? 'var(--md-sys-color-error)' :
                                                                 ev.tipo === 'scadenza' ? 'var(--md-sys-color-tertiary)' :
                                                                 ev.tipo === 'riunione' ? 'var(--md-sys-color-primary)' :
                                                                 'var(--md-sys-color-secondary)',
                                                '&:hover': { bgcolor: 'var(--md-sys-color-surface-container-high)' },
                                            }}
                                        >
                                            <Chip
                                                size="small"
                                                sx={{
                                                    height: 24,
                                                    fontSize: 'var(--md-sys-typescale-label-small-font-size)',
                                                    fontWeight: 'var(--md-sys-typescale-weight-semibold)',
                                                    flexShrink: 0,
                                                    bgcolor: ev.tipo === 'urgente' ? 'var(--md-sys-color-error-container)' :
                                                             ev.tipo === 'scadenza' ? 'var(--md-sys-color-tertiary-container)' :
                                                             ev.tipo === 'riunione' ? 'var(--md-sys-color-primary-container)' :
                                                             'var(--md-sys-color-secondary-container)',
                                                    color: ev.tipo === 'urgente' ? 'var(--md-sys-color-on-error-container)' :
                                                           ev.tipo === 'scadenza' ? 'var(--md-sys-color-on-tertiary-container)' :
                                                           ev.tipo === 'riunione' ? 'var(--md-sys-color-on-primary-container)' :
                                                           'var(--md-sys-color-on-secondary-container)',
                                                }}
                                            />
                                            <ListItemText
                                                primary={ev.titolo}
                                                secondary={ev.descrizione}
                                                slotProps={{
                                                    primary: { variant: 'body2', sx: { fontWeight: 'var(--md-sys-typescale-weight-semibold)' } },
                                                    secondary: { variant: 'caption' },
                                                }}
                                            />
                                        </ListItemButton>
                                        {idx < evts.length - 1 && <Divider component="li" />}
                                    </React.Fragment>
                                ))}
                            </List>
                        </Paper>
                    ))}
                </Stack>
            )}
        </Box>
    );

    return (
        <Box
            ref={calendarGridRef}
            onKeyDown={handleCalendarKeyDown}
        >
            {renderHeader()}

            <Stack direction="column" sx={{ gap: 'var(--md-sys-spacing-4)' }}>
                {/* Contextual AI entry (Fase 2) */}
                {onNavigate && (
                  <Box sx={{ display: 'flex', justifyContent: 'flex-start', px: 2 }}>
                    <ContextualAskAI
                      onNavigate={onNavigate}
                      context={{ source: 'calendario' }}
                    />
                  </Box>
                )}

                {viewMode === 'month' && renderMonthView()}
                {viewMode === 'week' && renderWeekView()}
                {viewMode === 'day' && renderDayView()}
                {viewMode === 'agenda' && renderAgendaView()}
            </Stack>

            {editingEvent && (
                <Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}><CircularProgress size={20} /></Box>}>
                    <EventModal
                        eventToEdit={editingEvent}
                        onClose={() => setEditingEvent(null)}
                        onSave={(ev) => {
                            if (ev.id) {
                                setEventi(prev => prev.map(e => e.id === ev.id ? ev : e));
                            } else {
                                setEventi(prev => [...prev, { ...ev, id: `evt-${Date.now()}` }]);
                            }
                            setEditingEvent(null);
                        }}
                        onDelete={(id) => {
                            setEventi(prev => prev.filter(e => e.id !== id));
                            setEditingEvent(null);
                        }}
                    />
                </Suspense>
            )}

            {isAiParserOpen && (
                <Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}><CircularProgress size={20} /></Box>}>
                    <AiEventParserModal
                        aiSettings={aiSettings}
                        onClose={() => setIsAiParserOpen(false)}
                        onEventParsed={(eventData: Partial<EventoCalendario>) => {
                            setEventi(prev => [...prev, { ...eventData, id: `evt-${Date.now()}` } as EventoCalendario]);
                            setIsAiParserOpen(false);
                        }}
                    />
                </Suspense>
            )}

            {popoverState && (
                <EventActionPopover
                    event={popoverState.event}
                    anchorEl={popoverState.anchorEl}
                    onClose={() => setPopoverState(null)}
                    onEdit={() => {
                        setEditingEvent(popoverState.event);
                        setPopoverState(null);
                    }}
                    onDelete={() => {
                        setEventi(prev => prev.filter(e => e.id !== popoverState.event.id));
                        setPopoverState(null);
                    }}
                />
            )}
        </Box>
    );
};

export default Calendar;

