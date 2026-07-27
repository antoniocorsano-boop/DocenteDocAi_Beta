/**
 * SmartChat.tsx — P37 Unified Interaction Layer
 *
 * Full-page chat interface with ChatGPT + Notion-style layout:
 *   - Collapsible sidebar (240 px) listing all conversation threads
 *   - Main area: header + scrollable message feed + InputBar
 *   - Mobile: sidebar becomes a temporary Drawer
 *
 * MD3 / MUI v7 compliance:
 *   - NO custom styled() with hardcoded colours
 *   - Only Box / Paper / Stack / Typography / Chip / IconButton / Drawer from MUI
 *   - All interactive elements carry aria-label
 *   - Spacing via sx tokens only
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Drawer,
  Fab,
  IconButton,
  LinearProgress,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Paper,
  Snackbar,
  Stack,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import ThumbUpOutlinedIcon   from '@mui/icons-material/ThumbUpOutlined';
import ThumbDownOutlinedIcon from '@mui/icons-material/ThumbDownOutlined';
import AutoAwesomeIcon       from '@mui/icons-material/AutoAwesome';
import ChatIcon               from '@mui/icons-material/Chat';
import AddCommentIcon         from '@mui/icons-material/AddComment';
import DeleteOutlineIcon      from '@mui/icons-material/DeleteOutline';
import MenuIcon               from '@mui/icons-material/Menu';
import ChevronLeftIcon        from '@mui/icons-material/ChevronLeft';
import SettingsIcon           from '@mui/icons-material/Settings';
import ExpandMoreIcon         from '@mui/icons-material/ExpandMore';

import { ChatSettingsPanel }    from './ChatSettingsPanel';
import { SmartLandingView }     from './SmartLandingView';
import { CognitiveDebugPanel }  from './CognitiveDebugPanel';

import { useSmartChat }           from '@/hooks/useSmartChat';
import { useConversationStore }   from '@/stores/useConversationStore';
import { useChatPrefsStore }      from '@/stores/useChatPrefsStore';
import { InputBar }               from './InputBar';
import { MessageBlockRenderer }   from './MessageBlockRenderer';
import type { ChatMessage, AdaptedBlock } from '@/types/uiBlocks';
import type { EmotionalState }            from '@/modules/orchestration/EmotionalEngine';
import { observe }                        from '@/utils/observability';

// Migration Step A: Route through the single AIBrain
import { AIBrain } from '@/ai/brain/AIBrain';

// ── Constants ─────────────────────────────────────────────────────────────────

const SIDEBAR_WIDTH = 240;

// ── Props ─────────────────────────────────────────────────────────────────────

export interface SmartChatProps {
  /** Called when the user clears the conversation (optional) */
  onClear?:     () => void;
  /**
   * 'pro' unlocks deep / manual modes.
   * Defaults to 'free'.
   */
  userPlan?:    'free' | 'pro';
  /** Optional CSS height for the chat container. Defaults to '100%'. */
  height?:      string | number;
  /** Override the starting mode (e.g. auto-set by OrbitChatFAB based on device) */
  initialMode?: import('@/modules/orchestration/ModeEngine').Mode;
  /**
   * When true, the conversation sidebar is always in Drawer/hamburger mode
   * regardless of viewport width (useful when embedded inside a narrow panel).
   */
  forceCompact?: boolean;
}

// ── User message bubble ───────────────────────────────────────────────────────

function UserBubble({ msg }: { msg: ChatMessage }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1.5 }}>
      <Paper
        elevation={1}
        sx={{
          maxWidth:        '75%',
          px:              2,
          py:              1.25,
          borderRadius:    '16px 16px 4px 16px',
          backgroundColor: 'primary.main',
          color:           'primary.contrastText',
        }}
        role="article"
        aria-label="Messaggio utente"
      >
        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {msg.content}
        </Typography>
      </Paper>
    </Box>
  );
}

// ── Emotional micro-copy map ─────────────────────────────────────────────────

const REVEAL_LABEL: Record<EmotionalState, string> = {
  focused:       'Mostra analisi completa',
  exploring:     'Vedi altre opzioni',
  overloaded:    'Mostra passo successivo',
  blocked:       'Approfondisci',
  goal_oriented: 'Dettagli',
};
// ── Block type labels — mini-navbar for structure=high (Fase 2, Task 3) ─────────

const BLOCK_TYPE_LABELS: Record<string, string> = {
  text:       '📝 Testo',
  plan:       '📋 Piano',
  orbit_plan: '🎯 Piano Orbit',
  insight:    '🔍 Trasparenza',
  actions:    '⚡ Azioni',
  status:     '⚠️ Stato',
  table:      '📊 Tabella',
  chart:      '📈 Grafico',
  form:       '📝 Modulo',
  sandbox:    '🧪 Sandbox',
  timeline:   '📅 Timeline',
};
// ── Assistant message ─────────────────────────────────────────────────────────

interface AssistantMessageProps {
  msg:                 ChatMessage;
  onFeedback:          (id: string, rating: 1 | 5) => void;
  triggerAction:       (agentId: string) => void;
  emotionalState:      EmotionalState;
  onPlanExecute:       (executionPrompt: string) => void;
  /** When true, `orbit_plan` blocks are shown in the floating sidebar — omit from inline stream */
  floatingPlanActive?: boolean;
}

function AssistantMessage({ msg, onFeedback, triggerAction, emotionalState, onPlanExecute, floatingPlanActive = false }: AssistantMessageProps) {
  // Compute adapted blocks and hidden count before hooks so the useState
  // lazy initializer can use them (exploration=high auto-reveal, Task 2)
  const allAdapted  = (msg.blocks ?? [{ type: 'text' as const, content: msg.content }]) as AdaptedBlock[];
  // When orbit_plan is shown in the floating sidebar, omit it from the inline stream
  const adapted     = floatingPlanActive
    ? allAdapted.filter(b => b.type !== 'orbit_plan')
    : allAdapted;
  const hiddenCount = adapted.filter(b => b.hidden).length;

  const cognitiveStyle = useChatPrefsStore(s => s.cognitiveStyle);

  // Auto-reveal when exploration=high and few blocks are hidden (Task 2)
  const [showAll, setShowAll] = useState(() =>
    cognitiveStyle.exploration === 'high' && hiddenCount > 0 && hiddenCount <= 2
  );
  // Per-message feedback chip state (Fase 3, Task 2)
  const [feedbackChip, setFeedbackChip] = useState<string | null>(null);

  const visibleBlocks     = showAll ? adapted : adapted.filter(b => !b.hidden);
  const revealLabel       = REVEAL_LABEL[emotionalState];
  // Unique block types in appearance order — used for mini-navbar (Task 3)
  const uniqueBlockTypes  = Array.from(new Set(visibleBlocks.map(b => b.type)));

  return (
    <Box sx={{ mb: 2 }} role="article" aria-label="Risposta assistente">
      {/* Header: icon + deep badge */}
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.75 }}>
        <AutoAwesomeIcon fontSize="small" color="primary" aria-hidden="true" />
        <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
          Assistente IA
        </Typography>
        {msg.isDeep && (
          <Chip label="Analisi approfondita" size="small" color="secondary" variant="outlined" />
        )}
      </Stack>

      {/* Blocks with progressive reveal */}
      <Stack spacing={1.25}>
        {/* Mini-navbar block index — shown when structure=high and >3 blocks (Task 3) */}
        {cognitiveStyle.structure === 'high' && visibleBlocks.length > 3 && (
          <Stack
            direction="row"
            spacing={0.5}
            flexWrap="wrap"
            useFlexGap
            sx={{ mb: 0.5 }}
            role="navigation"
            aria-label="Indice blocchi risposta"
          >
            {uniqueBlockTypes.map(type => (
              <Chip
                key={type}
                label={BLOCK_TYPE_LABELS[type] ?? type}
                size="small"
                variant="outlined"
                sx={{ opacity: 0.7 }}
                aria-label={`Sezione: ${BLOCK_TYPE_LABELS[type] ?? type}`}
              />
            ))}
          </Stack>
        )}

        {visibleBlocks.map((block, idx) => (
          <MessageBlockRenderer
            key={idx}
            block={block}
            onAction={triggerAction}
            onPlanExecute={onPlanExecute}
            insightExpanded={msg.isDeep}
            emotionalState={emotionalState}
          />
        ))}
        {!showAll && hiddenCount > 0 && (
          <Button
            size="small"
            variant="text"
            aria-label={`${revealLabel} (${hiddenCount} elementi nascosti)`}
            startIcon={<ExpandMoreIcon />}
            onClick={() => {
              setShowAll(true);
              useChatPrefsStore.getState().recordRevealClick();
            }}
            sx={{ alignSelf: 'flex-start', mt: 0.5, color: 'text.secondary' }}
          >
            {revealLabel}
          </Button>
        )}
      </Stack>

      {/* Feedback row */}
      <Stack direction="row" spacing={0.5} sx={{ mt: 1 }} alignItems="center">
        <Typography variant="caption" color="text.secondary">
          Questa risposta è stata utile?
        </Typography>
        <Tooltip title="Sì, utile" placement="top">
          <IconButton
            size="small"
            aria-label="Valuta risposta positivamente"
            onClick={() => onFeedback(msg.id, 5)}
          >
            <ThumbUpOutlinedIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
        <Tooltip title="No, non utile" placement="top">
          <IconButton
            size="small"
            aria-label="Valuta risposta negativamente"
            onClick={() => onFeedback(msg.id, 1)}
          >
            <ThumbDownOutlinedIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
      </Stack>

      {/* Feedback inline su strategia (Fase 3, Task 2) */}
      {feedbackChip === null ? (
        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mt: 0.5 }}>
          <Chip
            label="Troppo lungo"
            size="small"
            variant="outlined"
            clickable
            aria-label="La risposta era troppo lunga"
            onClick={() => {
              setFeedbackChip('lungo');
              useChatPrefsStore.getState().recordSuggestionRejected();
            }}
          />
          <Chip
            label="Troppo breve"
            size="small"
            variant="outlined"
            clickable
            aria-label="La risposta era troppo breve"
            onClick={() => {
              setFeedbackChip('breve');
              useChatPrefsStore.getState().recordSuggestionRejected();
            }}
          />
          <Chip
            label="Giusto così"
            size="small"
            variant="outlined"
            color="success"
            clickable
            aria-label="La risposta era della lunghezza giusta"
            onClick={() => {
              setFeedbackChip('giusto');
              useChatPrefsStore.getState().recordSuggestionAccepted();
            }}
          />
        </Stack>
      ) : (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
          Grazie per il feedback!
        </Typography>
      )}

      {/* CTA autonomia — shown when autonomy=high outside blocked/overloaded state (Task 4) */}
      {cognitiveStyle.autonomy === 'high' &&
       emotionalState !== 'blocked' &&
       emotionalState !== 'overloaded' && (
        <Stack
          direction="row"
          spacing={0.75}
          flexWrap="wrap"
          useFlexGap
          sx={{ mt: 0.75 }}
          aria-label="Azioni di autonomia"
        >
          <Chip
            label="Applicalo tu"
            size="small"
            variant="outlined"
            clickable
            aria-label="Applica questo direttamente"
          />
          <Chip
            label="Fammi vedere come"
            size="small"
            variant="outlined"
            clickable
            aria-label="Mostrami come applicarlo passo per passo"
          />
        </Stack>
      )}
    </Box>
  );
}

// ── Conversation sidebar ──────────────────────────────────────────────────────

interface SidebarProps {
  onNewChat:  () => void;
  onClose?:   () => void;
}

function ConversationSidebar({ onNewChat, onClose }: SidebarProps) {
  const {
    conversations,
    activeId,
    switchConversation,
    deleteConversation,
  } = useConversationStore();

  return (
    <Box
      sx={{
        width:          SIDEBAR_WIDTH,
        height:         '100%',
        display:        'flex',
        flexDirection:  'column',
        borderRight:    '1px solid',
        borderColor:    'divider',
        backgroundColor: 'background.paper',
      }}
      aria-label="Sidebar conversazioni"
    >
      {/* Header row */}
      <Stack direction="row" alignItems="center" sx={{ px: 1.5, py: 1.25 }}>
        <Typography variant="subtitle2" sx={{ flex: 1 }}>
          Conversazioni
        </Typography>

        {/* New chat */}
        <Tooltip title="Nuova chat" placement="bottom">
          <IconButton size="small" onClick={onNewChat} aria-label="Nuova conversazione">
            <AddCommentIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        {/* Close sidebar — shown only when in Drawer (i.e., mobile) */}
        {onClose && (
          <Tooltip title="Chiudi" placement="bottom">
            <IconButton size="small" onClick={onClose} aria-label="Chiudi sidebar" sx={{ ml: 0.5 }}>
              <ChevronLeftIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Stack>

      <Divider />

      {/* Conversation list */}
      <List dense disablePadding sx={{ flex: 1, overflowY: 'auto' }}>
        {conversations.length === 0 && (
          <ListItem sx={{ py: 2, justifyContent: 'center' }}>
            <Typography variant="caption" color="text.disabled">
              Nessuna conversazione
            </Typography>
          </ListItem>
        )}

        {conversations.map(conv => (
          <ListItem
            key={conv.id}
            disablePadding
            secondaryAction={
              <Tooltip title="Elimina" placement="right">
                <IconButton
                  edge="end"
                  size="small"
                  aria-label={`Elimina conversazione: ${conv.title}`}
                  onClick={e => {
                    e.stopPropagation();
                    deleteConversation(conv.id);
                  }}
                  sx={{ opacity: 0, '.MuiListItem-root:hover &': { opacity: 1 } }}
                >
                  <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
            }
          >
            <ListItemButton
              selected={conv.id === activeId}
              onClick={() => switchConversation(conv.id)}
              aria-label={`Passa a: ${conv.title}`}
              sx={{ borderRadius: 1, mx: 0.5, my: 0.25 }}
            >
              <ListItemText
                primary={conv.title}
                slotProps={{
                  primary: {
                    sx: {
                      overflow:     'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace:   'nowrap',
                    },
                    variant: 'body2',
                  },
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );
}

// ── SmartChat ─────────────────────────────────────────────────────────────────

export function SmartChat({ onClear, userPlan = 'free', height = '100%', initialMode, forceCompact = false }: SmartChatProps): React.ReactElement {
  const {
    messages,
    loading,
    error,
    mode,
    setMode,
    sendMessage,
    triggerAction,
    submitFeedback,
    clearMessages,
    emotionalState,
  } = useSmartChat({ initialMode });

  // Migration Step A — use the single AIBrain for copilot decisions
  // Fase 3 (sequenza): real consumption of unified recommendations + example ask
  const copilotPrimary = React.useMemo(() => AIBrain.getCopilotPrimaryAction(), []);

  const unifiedChatRecs = React.useMemo(() => {
    try {
      return AIBrain.getUnifiedRecommendations({ source: 'smart-chat', mode: 'balanced' });
    } catch {
      return null;
    }
  }, []);

  // Fase 3 continuation: Real AIBrain.ask + buildContext consumption (user-centric daily chat gesture)
  const [smartChatAIBrainTip, setSmartChatAIBrainTip] = React.useState<string | null>(null);
  const [smartChatAiLoading, setSmartChatAiLoading] = React.useState(false);

  const fetchSmartChatAiTip = React.useCallback(async () => {
    setSmartChatAiLoading(true);
    try {
      const ctx = AIBrain.buildContext({ source: 'smart-chat', mode: 'fast' });
      const res = await AIBrain.ask({ 
        prompt: 'Suggerisci un\'azione rapida o insight per l\'insegnante in questo momento', 
        context: ctx, 
        mode: 'balanced' 
      });
      if (res?.content) setSmartChatAIBrainTip(res.content.slice(0, 120));
    } catch {
      setSmartChatAIBrainTip('Impossibile ottenere suggerimento AI.');
    } finally {
      setSmartChatAiLoading(false);
    }
  }, []);

  // Auto-fetch on mount (lightweight)
  React.useEffect(() => {
    fetchSmartChatAiTip();
  }, [fetchSmartChatAiTip]);

  const theme          = useTheme();
  const isMobile       = useMediaQuery(theme.breakpoints.down('md'));
  const isLargeDesktop = useMediaQuery(theme.breakpoints.up('lg'));
  // Sidebar collapses to a Drawer when on mobile OR when embedded in a narrow panel
  const isCompact = isMobile || forceCompact;
  const [drawerOpen,    setDrawerOpen]    = useState(false);
  const [settingsOpen,  setSettingsOpen]  = useState(false);
  const [autoSandbox,   setAutoSandbox]   = useState(true);

  const { showLanding } = useChatPrefsStore();
  // Show landing only when the pref is on AND there are no existing messages
  const [landingDismissed, setLandingDismissed] = useState(false);

  // ── Fase 4: devtools panel — visible at ?debug=cognitive in dev mode ─
  const [showDebugPanel] = useState(() =>
    import.meta.env.DEV &&
    new URLSearchParams(window.location.search).get('debug') === 'cognitive',
  );

  // ── Cognitive drift detection (Fase 3, Task 4) ─────────────────────
  const cognitiveStyle      = useChatPrefsStore(s => s.cognitiveStyle);
  const [driftToast, setDriftToast] = useState(false);
  const styleHistoryRef = useRef<Array<{ structure: string; exploration: string }>>([]);
  const driftMountRef   = useRef(false);

  useEffect(() => {
    const snap = { structure: cognitiveStyle.structure, exploration: cognitiveStyle.exploration };
    if (!driftMountRef.current) {
      driftMountRef.current = true;
      styleHistoryRef.current = [snap];
      return;
    }
    const h = [...styleHistoryRef.current, snap].slice(-4);
    styleHistoryRef.current = h;
    if (h.length < 4) return;
    for (const field of ['structure', 'exploration'] as const) {
      if (
        h[1][field] !== h[0][field] &&
        h[2][field] !== h[1][field] &&
        h[3][field] !== h[2][field]
      ) {
        observe('cognitive.style.drift', { field, from: h[0][field], to: h[3][field] }, 'info');
        setDriftToast(true);
        styleHistoryRef.current = [];
        break;
      }
    }
  }, [cognitiveStyle]);
  const showLandingView = showLanding && !landingDismissed && messages.length === 0;

  // ── Desktop ≥ lg: extract last visible orbit_plan block for floating sidebar
  const floatingPlanEntry = useMemo(() => {
    if (!isLargeDesktop) return null;
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m.role !== 'assistant') continue;
      const block = m.blocks?.find(b => b.type === 'orbit_plan');
      if (block) return { msgId: m.id, block };
    }
    return null;
  }, [messages, isLargeDesktop]);

  const handleLandingStart = useCallback((text?: string) => {
    setLandingDismissed(true);
    if (text) sendMessage(text);
  }, [sendMessage]);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to the latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, loading]);

  const handleClear = () => {
    clearMessages();
    onClear?.();
    if (isCompact) setDrawerOpen(false);
  };

  // Sidebar content shared between desktop panel and compact/mobile Drawer
  const sidebarNode = (
    <ConversationSidebar
      onNewChat={handleClear}
      onClose={isCompact ? () => setDrawerOpen(false) : undefined}
    />
  );

  return (
    <Box
      sx={{
        display:         'flex',
        height,
        overflow:        'hidden',
        backgroundColor: 'background.default',
      }}
      role="main"
      aria-label="Interfaccia chat AI"
    >
      {/* Desktop sidebar — hidden in compact/embedded mode */}
      {!isCompact && (
        <Box sx={{ flexShrink: 0 }}>
          {sidebarNode}
        </Box>
      )}

      {/* Compact + Mobile: sidebar in a temporary Drawer */}
      {isCompact && (
        <Drawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          variant="temporary"
          ModalProps={{ keepMounted: true }}
          PaperProps={{ sx: { width: SIDEBAR_WIDTH } }}
          aria-label="Menu conversazioni"
        >
          {sidebarNode}
        </Drawer>
      )}

      {/* ── Main chat area ──────────────────────────────────────────────── */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Top bar */}
        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
          sx={{ px: 2, py: 1, borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0 }}
        >
          {/* Hamburger — compact + mobile */}
          {isCompact && (
            <IconButton
              size="small"
              aria-label="Apri menu conversazioni"
              onClick={() => setDrawerOpen(true)}
            >
              <MenuIcon fontSize="small" />
            </IconButton>
          )}

          <AutoAwesomeIcon fontSize="small" color="primary" aria-hidden="true" />
          <Typography variant="subtitle2" sx={{ flex: 1 }}>
            Copilot Docente
          </Typography>

          {/* Fase 3 (sequenza) — AIBrain unified recommendation in chat header */}
          {unifiedChatRecs?.primary && (
            <Chip
              size="small"
              icon={<AutoAwesomeIcon fontSize="small" />}
              label={unifiedChatRecs.primary.label || unifiedChatRecs.primary.title || 'AIBrain suggestion'}
              color="primary"
              variant="outlined"
              sx={{ ml: 1, fontSize: '0.7rem' }}
            />
          )}

          {/* Fase 3 (sequenza) — Real AIBrain.ask tip visible */}
          {smartChatAIBrainTip && (
            <Chip
              size="small"
              label={`AIBrain: ${smartChatAIBrainTip}`}
              color="secondary"
              variant="outlined"
              sx={{ ml: 1, maxWidth: 220, fontSize: '0.65rem' }}
            />
          )}

          {/* Fase 3 continuation: manual refresh of AIBrain.ask tip */}
          <Button
            size="small"
            variant="text"
            onClick={fetchSmartChatAiTip}
            disabled={smartChatAiLoading}
            sx={{ ml: 0.5, minWidth: 'auto', px: 0.5 }}
          >
            {smartChatAiLoading ? '...' : '↻'}
          </Button>
          <Tooltip title="Impostazioni chat" placement="left">
            <IconButton
              size="small"
              aria-label="Impostazioni chat"
              onClick={() => setSettingsOpen(true)}
            >
              <SettingsIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>

        {/* Loading bar */}
        {loading && (
          <LinearProgress
            aria-label="Elaborazione in corso"
            sx={{ flexShrink: 0 }}
          />
        )}

        {/* Error banner */}
        {error && (
          <Box
            sx={{ px: 2, py: 1, backgroundColor: 'error.main', color: 'error.contrastText', flexShrink: 0 }}
            role="alert"
            aria-live="assertive"
          >
            <Typography variant="caption">{error}</Typography>
          </Box>
        )}

        {/* Messages area */}
        <Box
          sx={{ flex: 1, overflowY: 'auto', px: 2, py: 2 }}
          aria-live="polite"
          aria-atomic="false"
          aria-relevant="additions"
          role="log"
          aria-label="Storico conversazione"
        >
          {/* Smart landing overlay — shown on first open when no messages */}
          {showLandingView && (
            <SmartLandingView
              onStartChat={handleLandingStart}
              onOpenFullChat={() => setLandingDismissed(true)}
            />
          )}

          {!showLandingView && messages.length === 0 && !loading && (
            <Box
              sx={{
                height:         '100%',
                display:        'flex',
                flexDirection:  'column',
                alignItems:     'center',
                justifyContent: 'center',
                gap:            1,
                opacity:        0.55,
              }}
            >
              <AutoAwesomeIcon sx={{ fontSize: 48 }} color="disabled" aria-hidden="true" />
              <Typography variant="body2" color="text.disabled" align="center">
                Inizia una conversazione
              </Typography>
              <Typography variant="caption" color="text.disabled" align="center">
                Scegli una modalità e scrivi il tuo messaggio
              </Typography>
            </Box>
          )}

          {messages.map(msg =>
            msg.role === 'user'
              ? <UserBubble key={msg.id} msg={msg} />
              : (
                <AssistantMessage
                  key={msg.id}
                  msg={msg}
                  onFeedback={(id, rating) => submitFeedback(id, rating)}
                  triggerAction={agentId => triggerAction(agentId, msg.content)}
                  emotionalState={emotionalState}
                  onPlanExecute={ep => { sendMessage(ep); }}
                  floatingPlanActive={floatingPlanEntry?.msgId === msg.id}
                />
              )
          )}

          {loading && (
            <Stack direction="row" spacing={1} alignItems="center" sx={{ py: 1 }}>
              <CircularProgress size={16} aria-hidden="true" />
              <Typography variant="caption" color="text.secondary" aria-live="polite">
                Elaborazione in corso…
              </Typography>
            </Stack>
          )}

          <div ref={messagesEndRef} aria-hidden="true" />
        </Box>

        {/* P43 — WorkSession sticky CTA (mobile-first: always within reach) */}
        {!loading && (() => {
          const lastMsg   = messages.filter(m => m.role === 'assistant').at(-1);
          const lastBlock = lastMsg?.blocks?.find(b => b.type === 'work_session');
          if (!lastBlock) return null;
          return (
            <Box sx={{ px: 2, pt: 1 }}>
              <Button
                fullWidth
                variant="contained"
                disableElevation
                onClick={() => sendMessage(lastBlock.nextAction)}
                aria-label={`Azione rapida: ${lastBlock.nextAction}`}
                sx={{ borderRadius: 2 }}
              >
                ⚡ {lastBlock.nextAction}
              </Button>
            </Box>
          );
        })()}

        <Divider />

        {/* Input area */}
        <InputBar
          mode={mode}
          setMode={setMode}
          onSend={sendMessage}
          loading={loading}
          userPlan={userPlan}
          onClear={handleClear}
          emotionalState={emotionalState}
          compact={isCompact}
        />
      </Box>

      {/* ── PlanCard floating sidebar — desktop ≥ lg only ─────────────────── */}
      {isLargeDesktop && floatingPlanEntry && (
        <Box
          sx={{
            width:         360,
            flexShrink:    0,
            display:       'flex',
            flexDirection: 'column',
            borderLeft:    '1px solid',
            borderColor:   'var(--md-sys-color-outline-variant)',
            bgcolor:       'var(--md-sys-color-surface-container-low)',
            overflow:      'hidden',
          }}
          aria-label="Piano attivo — sidebar"
        >
          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            sx={{
              px:           2,
              py:           1.25,
              borderBottom: '1px solid',
              borderColor:  'var(--md-sys-color-outline-variant)',
              flexShrink:   0,
            }}
          >
            <AutoAwesomeIcon fontSize="small" color="primary" aria-hidden="true" />
            <Typography
              variant="titleSmall"
              sx={{ flex: 1, fontWeight: 'var(--md-sys-typescale-weight-semibold)', color: 'var(--md-sys-color-on-surface)' }}
            >
              Piano attivo
            </Typography>
          </Stack>
          <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
            <MessageBlockRenderer
              block={floatingPlanEntry.block}
              onAction={(agentId) => triggerAction(agentId, '')}
              onPlanExecute={(ep) => sendMessage(ep)}
              insightExpanded={false}
              emotionalState={emotionalState}
            />
          </Box>
        </Box>
      )}

      {/* Settings panel — opens as a right-side Drawer */}
      <ChatSettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        mode={mode}
        setMode={setMode}
        autoSandbox={autoSandbox}
        setAutoSandbox={setAutoSandbox}
      />

      {/* Drift alert toast (Fase 3, Task 4) */}
      <Snackbar
        open={driftToast}
        autoHideDuration={4000}
        onClose={() => setDriftToast(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity="info"
          variant="filled"
          onClose={() => setDriftToast(false)}
          sx={{ width: '100%' }}
        >
          Ho aggiornato il mio modello su di te
        </Alert>
      </Snackbar>

      {/* ── Fase 4: Cognitive Debug Panel (dev-only, ?debug=cognitive) */}
      {showDebugPanel && <CognitiveDebugPanel />}

      {/* P44.1 — Scroll-to-latest FAB (mobile only, always reachable) */}
      {isCompact && messages.length > 0 && (
        <Fab
          size="small"
          aria-label="Scorri all'ultimo messaggio"
          onClick={() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })}
          sx={{
            position:  'fixed',
            bottom:    'calc(var(--md-sys-spacing-6, 24px) + 56px + 8px)',
            right:     'var(--md-sys-spacing-8, 32px)',
            zIndex:    1200,
            bgcolor:   'var(--md-sys-color-primary-container)',
            color:     'var(--md-sys-color-on-primary-container)',
            boxShadow: 'var(--md-sys-elevation-level2)',
            '&:hover': {
              bgcolor: 'var(--md-sys-color-primary-container)',
            },
          }}
        >
          <ChatIcon sx={{ fontSize: 'var(--md-sys-icon-size-sm, 20px)' }} aria-hidden="true" />
        </Fab>
      )}
    </Box>
  );
}

