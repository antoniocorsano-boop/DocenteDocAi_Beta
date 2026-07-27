/**
 * SmartLandingView — P38 Intelligent landing page for the chat.
 *
 * Shown on first open (when useChatPrefsStore.showLanding is true).
 * Greets the user contextually (time of day + role) and surfaces
 * the 3 most relevant next actions from the live data stores:
 *   - Draft / incomplete UDAs (useAcademicStore)
 *   - Recent conversations (useConversationStore)
 *   - Pending evaluations  (useStudentStore)
 *
 * A quick-input bar at the bottom lets the user start a fast chat
 * without navigating to the full SmartChat.
 *
 * MD3 Gold Compliant — no hardcoded colours or spacing values.
 */

import React, { useMemo, useState, useCallback, KeyboardEvent } from 'react';
import Box            from '@mui/material/Box';
import Button         from '@mui/material/Button';
import Chip           from '@mui/material/Chip';
import IconButton     from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Stack          from '@mui/material/Stack';
import TextField      from '@mui/material/TextField';
import Tooltip        from '@mui/material/Tooltip';
import Typography     from '@mui/material/Typography';
import AutoAwesomeIcon          from '@mui/icons-material/AutoAwesome';
import ChevronRightIcon         from '@mui/icons-material/ChevronRight';
import HistoryIcon              from '@mui/icons-material/History';
import PendingActionsIcon       from '@mui/icons-material/PendingActions';
import SchoolIcon               from '@mui/icons-material/School';
import SendIcon                 from '@mui/icons-material/Send';
import TuneIcon                 from '@mui/icons-material/Tune';

import { useAcademicStore }      from '@/stores/useAcademicStore';
import { useConversationStore }  from '@/stores/useConversationStore';
import { useStudentStore }       from '@/stores/useStudentStore';
import { useChatPrefsStore }     from '@/stores/useChatPrefsStore';
import { useSuggestedMode }      from '@/hooks/useSuggestedMode';import { TrustBadge }          from './TrustBadge';
// ── Time-of-day greeting ───────────────────────────────────────────────────────

function getGreeting(): string {
  const h = new Date().getHours();
  if (h >= 5  && h < 12) return 'Buongiorno';
  if (h >= 12 && h < 18) return 'Buon pomeriggio';
  if (h >= 18 && h < 22) return 'Buona sera';
  return 'Ciao';
}

function getSmartPlaceholder(): string {
  const h = new Date().getHours();
  if (h >= 5  && h < 9)  return 'Cosa preparo per oggi?';
  if (h >= 9  && h < 13) return 'Scrivi o incolla un contenuto…';
  if (h >= 13 && h < 16) return 'Vuoi correggere o pianificare qualcosa?';
  if (h >= 16 && h < 20) return 'Fine giornata: cosa organizzo per domani?';
  return 'Scrivi un messaggio rapido…';
}

const ROLE_DISPLAY: Record<string, string> = {
  teacher:     'docente',
  coordinator: 'coordinatore',
  principal:   'dirigente',
  student:     'studente',
  parent:      'genitore',
};

// ── Suggestion card ────────────────────────────────────────────────────────────

interface SuggestionCard {
  id:      string;
  icon:    React.ReactElement;
  label:   string;
  detail:  string;
  prompt:  string;
  color?:  'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  /** P40 — Trust signal: why this card is shown */
  reason?: string;
  /**
   * P41 — Direct execution action type.
   * Clicking the card immediately sends the prompt; this label shows the user
   * what kind of output to expect.
   */
  action?: 'Genera' | 'Analizza' | 'Pianifica' | 'Riprendi';
  /** P43 — Outcome: what the user gets (visible before clicking) */
  outcome?: string;
  /** P43 — Estimated time to complete (e.g. '2 min') */
  time?: string;
  /** P43 — Perceived difficulty */
  difficulty?: 'facile' | 'medio' | 'avanzato';
}

// ── Adaptation signal ──────────────────────────────────────────────────────────

function AdaptationSignal(): React.ReactElement | null {
  const {
    cognitiveStyle,
    cognitiveStyleSignals,
    revealClickCount,
    explainOpenedCount,
    acceptedSuggestions,
  } = useChatPrefsStore();

  const totalSignals =
    (cognitiveStyleSignals?.totalTurns     ?? 0) +
    (revealClickCount                       ?? 0) +
    (explainOpenedCount                     ?? 0) +
    (acceptedSuggestions                    ?? 0);

  if (totalSignals === 0) return null;

  if (totalSignals >= 5) {
    let learned = '';
    const speed = cognitiveStyle?.speedPreference;
    if (speed === 'fast') {
      learned = 'risposte rapide';
    } else if (speed === 'deliberate') {
      learned = 'risposte approfondite';
    } else if (cognitiveStyle?.structure === 'high') {
      learned = 'risposte strutturate';
    } else if (cognitiveStyle?.exploration === 'high') {
      learned = 'approfondire le risposte';
    } else {
      learned = 'un ritmo bilanciato';
    }
    return (
      <Typography variant="caption" color="primary.main" align="center" component="p">
        🧠 Ora preferisci {learned} ✔
      </Typography>
    );
  }

  return (
    <Typography variant="caption" color="text.secondary" align="center" component="p">
      🧠 Si sta adattando al tuo modo di lavorare
    </Typography>
  );
}

// ── Props ──────────────────────────────────────────────────────────────────────

export interface SmartLandingViewProps {
  /** Called when the user sends a quick message or clicks "Apri chat completa" */
  onStartChat:    (initialText?: string) => void;
  /** Called when the user wants to go directly to full SmartChat */
  onOpenFullChat: () => void;
}

// ── Component ──────────────────────────────────────────────────────────────────

export function SmartLandingView({
  onStartChat,
  onOpenFullChat,
}: SmartLandingViewProps): React.ReactElement {
  const [input, setInput] = useState('');

  const { uda }            = useAcademicStore();
  const { conversations }  = useConversationStore();
  const { students, evaluations } = useStudentStore();
  const { role }           = useChatPrefsStore();
  const { suggested, reason } = useSuggestedMode();

  // ── Build action cards from live data ────────────────────────────────────────

  const cards = useMemo<SuggestionCard[]>(() => {
    const result: SuggestionCard[] = [];

    // 1. Draft UDAs
    const draftUDAs = uda.filter(u => {
      const s = (u as { status?: string }).status;
      return !s || s === 'draft' || s === 'bozza';
    }).slice(0, 2);

    if (draftUDAs.length > 0) {
      result.push({
        id:      'uda-draft',
        icon:    <SchoolIcon />,
        label:   draftUDAs.length === 1
          ? `UDA in bozza: "${draftUDAs[0].title}"`
          : `${draftUDAs.length} UDA in bozza`,
        detail:  'Continua la pianificazione',
        outcome: draftUDAs.length === 1
          ? 'Bozza completata + sequenza attività'
          : 'Priorità definite + piano di completamento',
        time:       '5 min',
        difficulty: 'facile',
        prompt: draftUDAs.length === 1
          ? `Aiutami a completare la UDA "${draftUDAs[0].title}". Suggerisci obiettivi e attività.`
          : `Ho ${draftUDAs.length} UDA in bozza. Aiutami a prioritizzarle e completarle.`,
        color:  'warning',
        action: 'Pianifica',
        reason: draftUDAs.length === 1
          ? `Hai lasciato "${draftUDAs[0].title}" in bozza — il momento migliore per completarla`
          : `Hai ${draftUDAs.length} UDA incomplete che potrebbero bloccare la pianificazione`,
      });
    }

    // 2. Pending evaluations (no grade entered yet — voto is empty string)
    const pendingEvals = evaluations.filter(e => !e.voto || e.voto.trim() === '').slice(0, 3);
    if (pendingEvals.length > 0) {
      result.push({
        id:         'eval-pending',
        icon:       <PendingActionsIcon />,
        label:      `${pendingEvals.length} ${pendingEvals.length === 1 ? 'valutazione' : 'valutazioni'} da completare`,
        detail:     `${students.length} alunni in registro`,
        outcome:    'Registro aggiornato + note per ogni alunno',
        time:       '3 min',
        difficulty: 'facile',
        prompt:     `Ho ${pendingEvals.length} valutazioni da completare. Come posso organizzarle e compilarle in modo rapido?`,
        color:      'info',
        action:     'Analizza',
        reason:     'Valutazioni senza voto rilevate nel registro',
      });
    }

    // 3. Recent conversation to continue
    const lastConv = conversations[0];
    if (lastConv && lastConv.messages.length > 0) {
      const snippet = lastConv.messages[lastConv.messages.length - 1].content.slice(0, 60);
      result.push({
        id:         'conv-last',
        icon:       <HistoryIcon />,
        label:      `Riprendi: "${lastConv.title}"`,
        detail:     `…${snippet}`,
        outcome:    'Conversazione ripristinata dal punto in cui eri',
        time:       '< 1 min',
        difficulty: 'facile',
        prompt:     `Continua la conversazione: ${snippet}`,
        color:      'secondary',
        action:     'Riprendi',
        reason:     'L’ultima conversazione si era interrotta qui — riprendi dal punto in cui eri',
      });
    }

    // Fallback: generic prompts when no context available
    if (result.length === 0) {
      result.push({
        id:         'generic-plan',
        icon:       <SchoolIcon />,
        label:      'Crea una verifica di storia medievale',
        detail:     'Esercizi + domande aperte per liceo',
        outcome:    'PDF pronto + griglia di valutazione',
        time:       '2 min',
        difficulty: 'facile',
        prompt:     'Crea una verifica di storia medievale per una classe di liceo: include 5 domande a risposta multipla, 3 domande aperte e una traccia di saggio breve.',
        color:      'primary',
        action:     'Genera',
      });
      result.push({
        id:         'generic-eval',
        icon:       <PendingActionsIcon />,
        label:      'Suggerisci rubrica di valutazione',
        detail:     'Per qualsiasi disciplina o competenza',
        outcome:    'Rubrica pronta in 4 livelli',
        time:       '1 min',
        difficulty: 'facile',
        prompt:     'Crea una rubrica di valutazione con 4 livelli di competenza per la produzione scritta in italiano, adatta a una classe seconda media.',
        color:      'success',
        action:     'Genera',
      });
    }

    return result.slice(0, 3);
  }, [uda, evaluations, conversations, students.length]);

  // ── Quick send ────────────────────────────────────────────────────────────────

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed) return;
    setInput('');
    onStartChat(trimmed);
  }, [input, onStartChat]);

  const handleKey = useCallback((e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const greeting = getGreeting();
  const roleLabel = ROLE_DISPLAY[role] ?? role;
  const placeholder = getSmartPlaceholder();

  return (
    <Box
      sx={{
        flex:           1,
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'flex-start',
        px:             2,
        py:             2.5,
        gap:            2,
        overflowY:      'auto',
      }}
      role="main"
      aria-label="Schermata iniziale assistente"
    >
      {/* ── Greeting ───────────────────────────────────────────────────────── */}
      <Stack alignItems="center" spacing={0.5}>
        <AutoAwesomeIcon
          sx={{ fontSize: 'var(--md-sys-icon-size-xl, 36px)', color: 'primary.main' }}
          aria-hidden="true"
        />
        <Typography variant="h6" align="center">
          {greeting}, {roleLabel}!
        </Typography>
        <Typography variant="body2" color="text.secondary" align="center">
          Cosa vuoi fare oggi?
        </Typography>
      </Stack>

      {/* ── Suggested mode badge ───────────────────────────────────────────── */}
      <Tooltip title={reason} placement="top">
        <Chip
          icon={<TuneIcon />}
          label={`Modalità suggerita: ${suggested}`}
          size="small"
          variant="outlined"
          color="primary"
          aria-label={`Modalità AI suggerita: ${suggested}. ${reason}`}
        />
      </Tooltip>

      {/* ── Contextual action cards ───────────────────────────────────────── */}
      <Stack
        spacing={1}
        sx={{ width: '100%', maxWidth: 480 }}
        role="list"
        aria-label="Azioni suggerite"
      >
        {cards.map(card => (
          <Box
            key={card.id}
            role="listitem"
            component="button"
            onClick={() => onStartChat(card.prompt)}
            aria-label={`${card.label}: ${card.detail}`}
            sx={{
              display:         'flex',
              alignItems:      'center',
              gap:             1.5,
              p:               1.5,
              borderRadius:    2,
              border:          '1px solid',
              borderColor:     `${card.color ?? 'primary'}.light`,
              backgroundColor: 'background.paper',
              cursor:          'pointer',
              textAlign:       'left',
              width:           '100%',
              transition:      'background-color 0.15s',
              '&:hover': {
                backgroundColor: `${card.color ?? 'primary'}.50`,
              },
              '&:focus-visible': {
                outline:       '2px solid',
                outlineColor:  'primary.main',
                outlineOffset: 2,
              },
            }}
          >
            <Box
              sx={{
                color:      `${card.color ?? 'primary'}.main`,
                flexShrink: 0,
                display:    'flex',
                '& svg': { fontSize: 'var(--md-sys-icon-size-md, 24px)' },
              }}
              aria-hidden="true"
            >
              {card.icon}
            </Box>

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mb: 0.25 }}>
                <Typography
                  variant="body2"
                  sx={{
                    flex:         1,
                    overflow:     'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace:   'nowrap',
                    fontWeight: card.action === 'Genera' || card.action === 'Pianifica'
                      ? 'var(--md-sys-typescale-weight-semibold)'
                      : undefined,
                  }}
                >
                  {(card.action === 'Genera' || card.action === 'Pianifica') ? '⚡ ' : ''}{card.label}
                </Typography>
                {card.action && (
                  <Chip
                    label={card.action}
                    size="small"
                    color={card.color ?? 'primary'}
                    variant="filled"
                    sx={{ height: 18, fontSize: 'var(--md-sys-icon-size-xs, 0.65rem)', px: 0.25, flexShrink: 0 }}
                    aria-label={`Azione: ${card.action}`}
                  />
                )}
              </Stack>

              {/* Outcome — what the user gets */}
              {card.outcome ? (
                <Typography
                  variant="caption"
                  sx={{ display: 'block', fontWeight: 'var(--md-sys-typescale-weight-medium)', color: 'text.primary' }}
                >
                  📄 {card.outcome}
                </Typography>
              ) : (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}
                >
                  {card.detail}
                </Typography>
              )}

              {/* Time + difficulty meta */}
              {(card.time ?? card.difficulty) && (
                <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.4 }} useFlexGap>
                  {card.time && (
                    <Typography variant="caption" color="text.secondary">
                      ⏱ {card.time}
                    </Typography>
                  )}
                  {card.time && card.difficulty && (
                    <Typography variant="caption" color="text.disabled">•</Typography>
                  )}
                  {card.difficulty && (
                    <Typography
                      variant="caption"
                      color={
                        card.difficulty === 'facile' ? 'success.main'
                        : card.difficulty === 'medio' ? 'warning.main'
                        : 'primary.main'
                      }
                    >
                      {card.difficulty}
                    </Typography>
                  )}
                </Stack>
              )}

              {card.reason && (
                <Typography
                  variant="caption"
                  color={`${card.color ?? 'primary'}.main`}
                  sx={{ display: 'block', mt: 0.25, opacity: 0.8 }}
                >
                  💡 {card.reason}
                </Typography>
              )}
            </Box>

            <ChevronRightIcon
              sx={{ color: 'text.disabled', flexShrink: 0, fontSize: 'var(--md-sys-icon-size-sm, 20px)' }}
              aria-hidden="true"
            />
          </Box>
        ))}
      </Stack>

      {/* ── Quick-input bar ──────────────────────────────────────────────── */}
      <Box sx={{ width: '100%', maxWidth: 480 }}>
        <TextField
          fullWidth
          size="small"
          placeholder={placeholder}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          aria-label="Campo messaggio rapido"
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <Tooltip title="Invia" placement="top">
                    <span>
                      <IconButton
                        size="small"
                        onClick={handleSend}
                        disabled={!input.trim()}
                        aria-label="Invia messaggio rapido"
                        edge="end"
                      >
                        <SendIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                </InputAdornment>
              ),
            },
          }}
        />
      </Box>
      {/* ── Adaptation signal (P43) ──────────────────────────────────────── */}
      <AdaptationSignal />

      {/* ── Trust Layer (P40) ──────────────────────────────────────────────── */}
      <TrustBadge suggestionContext={`Suggerimenti dal tuo registro e dalle conversazioni recenti`} />
      {/* ── Open full chat ──────────────────────────────────────────────── */}
      <Button
        variant="text"
        size="small"
        endIcon={<ChevronRightIcon />}
        onClick={onOpenFullChat}
        aria-label="Apri chat completa"
        sx={{ color: 'text.secondary' }}
      >
        Apri chat completa
      </Button>
    </Box>
  );
}

export default SmartLandingView;
