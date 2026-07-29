import React, { useState, useRef, useEffect, useCallback } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import ButtonBase from '@mui/material/ButtonBase'
import { InfoCard, AiMemoryChip, AiThinkingGem } from './ui'
import type { Studente, Valutazione } from '../types'
// Fase 3 final batch: consolidate to single AIBrain gateway (user-centric daily gesture)
import { AIBrain } from '../ai/brain/AIBrain'
import type { CopilotCommand } from '../ai/copilot/types'

interface TeacherCopilotPanelProps {
  students: Studente[]
  evaluations: Valutazione[]
  className?: string
}

// ── Preset commands ───────────────────────────────────────────────────────────
const PRESETS: { command: CopilotCommand; label: string; icon: string; hint: string }[] = [
  {
    command: 'class_summary',
    label: 'Riepilogo classe',
    icon: 'summarize',
    hint: 'Media, studenti a rischio, eccellenze',
  },
  {
    command: 'students_at_risk',
    label: 'A rischio',
    icon: 'warning',
    hint: 'Chi ha bisogno di supporto?',
  },
  {
    command: 'top_students',
    label: 'Eccellenze',
    icon: 'star',
    hint: 'Chi sta andando molto bene?',
  },
  {
    command: 'missing_assessments',
    label: 'Valutazioni mancanti',
    icon: 'assignment_late',
    hint: 'Chi non ha ancora una valutazione?',
  },
]

// ── Single chat bubble ────────────────────────────────────────────────────────
interface ChatMessage {
  role: 'user' | 'assistant'
  text: string
  command?: CopilotCommand
}



const ChatBubble: React.FC<{ msg: ChatMessage }> = ({ msg }) => {
  const isUser = msg.role === 'user'

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
      }}
    >
      <Box
        sx={{
          maxWidth: '85%',
          padding: 'var(--md-sys-spacing-3) var(--md-sys-spacing-4)',
          borderRadius: isUser
            ? 'var(--md-sys-shape-corner-large) var(--md-sys-shape-corner-medium) var(--md-sys-shape-corner-medium) var(--md-sys-shape-corner-large)'
            : 'var(--md-sys-shape-corner-medium) var(--md-sys-shape-corner-large) var(--md-sys-shape-corner-large) var(--md-sys-shape-corner-medium)',
          backgroundColor: isUser
            ? 'var(--md-sys-color-primary-container)'
            : 'var(--md-sys-color-surface-container-high)',
          color: isUser
            ? 'var(--md-sys-color-on-primary-container)'
            : 'var(--md-sys-color-on-surface)',
        }}
      >
        <Typography
          variant="body2"
          sx={{
            whiteSpace: 'pre-line',
            color: 'inherit',
          }}
        >
          {msg.text}
        </Typography>
      </Box>
    </Box>
  )
}

// ── Preset chip button ────────────────────────────────────────────────────────
const PresetChip: React.FC<{
  label: string
  icon: string
  hint: string
  disabled: boolean
  onClick: () => void
}> = ({ label, icon, hint, disabled, onClick }) => (
  <ButtonBase
    onClick={onClick}
    disabled={disabled}
    aria-label={label}
    title={hint}
    sx={{
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--md-sys-spacing-2)',
      padding: 'var(--md-sys-spacing-2) var(--md-sys-spacing-3)',
      borderRadius: 'var(--md-sys-shape-corner-full)',
      border: '1px solid var(--md-sys-color-outline-variant)',
      backgroundColor: 'var(--md-sys-color-surface-container)',
      color: 'var(--md-sys-color-on-surface-variant)',
      opacity: disabled ? 0.5 : 1,
      transition: 'background-color 0.15s ease, opacity 0.15s ease',
      '&:hover:not(:disabled)': {
        backgroundColor: 'var(--md-sys-color-surface-container-high)',
      },
    }}
  >
    <Box
      component="span"
      className="material-symbols-outlined"
      aria-hidden="true"
      sx={{ fontSize: 'var(--md-sys-typescale-label-large-font-size)' }}
    >
      {icon}
    </Box>
    <Typography variant="labelSmall" sx={{ color: 'inherit' }}>
      {label}
    </Typography>
  </ButtonBase>
)

// ── Main panel ────────────────────────────────────────────────────────────────
const TeacherCopilotPanel: React.FC<TeacherCopilotPanelProps> = ({
  students,
  evaluations,
  className,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      text: 'Ciao! Sono il tuo Copilot didattico. Puoi chiedermi un riepilogo della classe, chi è a rischio o chi sta eccellendo. Usa i pulsanti qui sotto per iniziare.',
    },
  ])
  const [isLoading, setIsLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const handleCommand = useCallback(async (command: CopilotCommand) => {
    const preset = PRESETS.find((p) => p.command === command)
    const userText = preset?.label ?? command

    setMessages((prev) => [...prev, { role: 'user', text: userText, command }])
    setIsLoading(true)

    try {
      // Fase 3 final: real AIBrain consumption (user-centric + inside callback)
      const ctx = AIBrain.buildContext({
        class: 'teacher-copilot',
        students,
        evaluations,
        source: 'teacher-copilot-panel',
        extra: { command }
      })

      // Use AIBrain.ask as unified gateway (keeps legacy fallback inside brain)
      const res = await AIBrain.ask({
        prompt: `Esegui comando copilot: ${command}. Fornisci risposta utile per un insegnante.`,
        context: ctx,
        mode: 'balanced'
      })

      // Also leverage unified recs if useful
      const recs = AIBrain.getUnifiedRecommendations(ctx)

      const responseText = res.content + (recs?.primary ? ` | Suggerimento: ${recs.primary.label || recs.primary.title}` : '')

      setMessages((prev) => [...prev, { 
        role: 'assistant', 
        text: responseText, 
        command 
      }])
    } catch {
      setMessages((prev) => [...prev, { 
        role: 'assistant', 
        text: 'Si è verificato un errore durante l\'elaborazione. Riprova.', 
        command 
      }])
    } finally {
      setIsLoading(false)
    }
  }, [students, evaluations])

  return (
    <InfoCard
      elevation={1}
      className={className}
      sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-3)' }}>
        <Box
          component="span"
          className="material-symbols-outlined"
          aria-hidden="true"
          sx={{ color: 'var(--md-sys-color-primary)' }}
        >
          smart_toy
        </Box>
        <Typography variant="h6" sx={{ color: 'var(--md-sys-color-on-surface)', flex: 1 }}>
          Copilot Didattico
        </Typography>
        <AiMemoryChip label="AI Local" />
      </Box>

      {/* Fase 3 final batch: Visible AIBrain (Fase 3) block + real consumption */}
      <Box sx={{
        mb: 1,
        p: 1,
        borderRadius: 'var(--md-sys-shape-corner-small)',
        bgcolor: 'var(--md-sys-color-secondary-container)',
        fontSize: '0.75rem'
      }}>
        <Typography variant="caption" sx={{ color: 'var(--md-sys-color-on-secondary-container)' }}>
          AIBrain (Fase 3): TeacherCopilotPanel — unified gateway (ask + buildContext + unifiedRecs)
        </Typography>
      </Box>

      {/* Chat area */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--md-sys-spacing-3)',
          maxHeight: 'var(--md-sys-spacing-64)',
          overflowY: 'auto',
          padding: 'var(--md-sys-spacing-2)',
          borderRadius: 'var(--md-sys-shape-corner-medium)',
          backgroundColor: 'var(--md-sys-color-surface)',
        }}
        role="log"
        aria-live="polite"
        aria-label="Conversazione copilot"
      >
        {messages.map((msg, i) => (
          <ChatBubble key={i} msg={msg} />
        ))}
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
            <Box
              sx={{
                padding: 'var(--md-sys-spacing-3) var(--md-sys-spacing-4)',
                borderRadius: 'var(--md-sys-shape-corner-medium) var(--md-sys-shape-corner-large) var(--md-sys-shape-corner-large) var(--md-sys-shape-corner-medium)',
                backgroundColor: 'var(--md-sys-color-surface-container-high)',
              }}
            >
              <AiThinkingGem size="small" inline />
            </Box>
          </Box>
        )}
        <div ref={bottomRef} />
      </Box>

      {/* Preset chips */}
      <Box
        sx={{
          display: 'flex',
          gap: 'var(--md-sys-spacing-2)',
          flexWrap: 'wrap',
        }}
      >
        {PRESETS.map((p) => (
          <PresetChip
            key={p.command}
            label={p.label}
            icon={p.icon}
            hint={p.hint}
            disabled={isLoading}
            onClick={() => handleCommand(p.command)}
          />
        ))}

        {/* Clear chat */}
        {messages.length > 1 && (
          <ButtonBase
            onClick={() =>
              setMessages([
                {
                  role: 'assistant',
                  text: 'Ciao! Sono il tuo Copilot didattico. Usa i pulsanti qui sotto per iniziare.',
                },
              ])
            }
            disabled={isLoading}
            aria-label="Cancella conversazione"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--md-sys-spacing-1)',
              padding: 'var(--md-sys-spacing-2) var(--md-sys-spacing-3)',
              borderRadius: 'var(--md-sys-shape-corner-full)',
              color: 'var(--md-sys-color-on-surface-variant)',
              opacity: isLoading ? 0.5 : 0.7,
            }}
          >
            <Box
              component="span"
              className="material-symbols-outlined"
              aria-hidden="true"
              sx={{ fontSize: 'var(--md-sys-typescale-label-large-font-size)' }}
            >
              delete_sweep
            </Box>
            <Typography variant="labelSmall" sx={{ color: 'inherit' }}>
              Cancella
            </Typography>
          </ButtonBase>
        )}
      </Box>
    </InfoCard>
  )
}

export default TeacherCopilotPanel
