// MD3 Compliant
import React from 'react';
import { DndContext, useDraggable, useDroppable, DragEndEvent } from '@dnd-kit/core';
import Box from '@mui/material/Box';

// M3Expressive: Refactored to use dedicated CSS classes with M3 tokens for drag-and-drop interactions, colors, spacing, and transitions
interface GanttBarProps {
  id: string;
  title: string;
  onMove: (id: string, newCol: number) => void;
  col: number;
  maxCols?: number;
  announce?: (msg: string) => void;
} 

const GanttBar: React.FC<GanttBarProps> = ({ id, title, onMove, col, maxCols = 4, announce }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });
  const [keyboardDrag, setKeyboardDrag] = React.useState(false);
  const [targetCol, setTargetCol] = React.useState(col);

  React.useEffect(() => setTargetCol(col), [col]);

  const commitMove = (newCol: number) => {
    if (newCol !== col) {
      onMove(id, newCol);
      announce?.(`${title} spostata nella colonna ${newCol + 1}`);
    } else {
      announce?.(`Posizione invariata`);
    }
    setKeyboardDrag(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (!keyboardDrag) {
        setKeyboardDrag(true);
        setTargetCol(col);
        announce?.(`Inizio spostamento ${title}. Usa frecce per spostare, Invio/Spazio per confermare, Esc per annullare.`);
      } else {
        commitMove(targetCol);
      }
    } else if (keyboardDrag && e.key === 'ArrowRight') {
      e.preventDefault();
      setTargetCol((c) => Math.min(c + 1, maxCols - 1));
      announce?.(`Selezionata colonna ${Math.min(targetCol + 1, maxCols)}`);
    } else if (keyboardDrag && e.key === 'ArrowLeft') {
      e.preventDefault();
      setTargetCol((c) => Math.max(c - 1, 0));
      announce?.(`Selezionata colonna ${Math.max(targetCol + 1, 1)}`);
    } else if (keyboardDrag && e.key === 'Escape') {
      e.preventDefault();
      setKeyboardDrag(false);
      setTargetCol(col);
      announce?.('Spostamento annullato');
    }
  };

  const visualTransform = transform ? `translateX(${transform.x}px)` : undefined;

  return (
    <Box
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      aria-label={`Sposta UDA ${title}`}
      aria-pressed={keyboardDrag}
      onKeyDown={handleKeyDown}
      sx={{
        '--gantt-bar-transform': visualTransform,
        backgroundColor: isDragging ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-surface)',
        boxShadow: isDragging ? 'var(--md-sys-elevation-level2)' : 'var(--md-sys-elevation-level1)',
        borderRadius: 'var(--md-sys-shape-corner-medium)',
        border: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline)',
        cursor: isDragging ? 'grabbing' : 'grab',
        position: 'relative',
        overflow: 'hidden',
        '&:hover::after': {
          content: '""',
          position: 'absolute',
          inset: 0,
          borderRadius: 'inherit',
          backgroundColor: 'var(--md-sys-color-on-surface)',
          opacity: 0.08,
          pointerEvents: 'none',
        },
        '&:focus-visible': {
          outline: '2px solid var(--md-sys-color-primary)',
          outlineOffset: 2,
        },
      }}
    >
      <div>{title}{keyboardDrag ? ` — col ${targetCol + 1}` : null}</div>
    </Box>
  );
};

interface GanttColumnProps {
  col: number;
  children: React.ReactNode;
}

const GanttColumn: React.FC<GanttColumnProps> = ({ col, children }) => {
  const { setNodeRef, isOver } = useDroppable({ id: `col-${col}` });
  return (
    <div
      ref={setNodeRef}
      className={`gantt-col ${isOver ? 'gantt-col-over' : ''}`}
      style={{
        backgroundColor: isOver ? 'var(--md-sys-color-primary-container)' : 'var(--md-sys-color-surface-container)',
        borderRadius: 'var(--md-sys-shape-corner-medium)',
        padding: 'var(--md-sys-spacing-2)',
        minHeight: 'var(--md-sys-layout-card-min-height)',
      }}
    >
      {children}
    </div>
  );
};

interface DemoGanttState {
  bars: { id: string; title: string; col: number }[];
}

export const DemoGantt: React.FC = () => {
  const NUM_COLS = 4;
  const [state, setState] = React.useState<DemoGanttState>({
    bars: [
      { id: 'uda1', title: 'UDA 1', col: 0 },
      { id: 'uda2', title: 'UDA 2', col: 2 },
    ],
  });

  const [liveMessage, setLiveMessage] = React.useState('');

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && String(over.id).startsWith('col-')) {
      const newCol = parseInt(String(over.id).replace('col-', ''));
      setState((prev) => ({
        bars: prev.bars.map((b) =>
          b.id === active.id ? { ...b, col: newCol } : b
        ),
      }));
      setLiveMessage(`UDA spostata in colonna ${newCol + 1}`);
    }
  };

  const handleMove = (id: string, newCol: number) => {
    setState((prev) => ({
      bars: prev.bars.map((b) => (b.id === id ? { ...b, col: newCol } : b)),
    }));
    setLiveMessage(`UDA spostata in colonna ${newCol + 1}`);
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
        {/* ARIA live region for screen reader announcements */}
        <div role="status" aria-live="polite" aria-atomic="true" >{liveMessage}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
          {[...Array(NUM_COLS)].map((_, col) => (
            <GanttColumn key={col} col={col}>
              {state.bars.filter((b) => b.col === col).map((b) => (
                <GanttBar key={b.id} {...b} onMove={handleMove} maxCols={NUM_COLS} announce={setLiveMessage} />
              ))}
            </GanttColumn>
          ))}
        </div>
      </div>
    </DndContext>
  );
};

export default DemoGantt;

