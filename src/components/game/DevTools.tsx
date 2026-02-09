import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bug, Grid3X3, Maximize2, Move, RotateCcw, GripHorizontal, X, User } from 'lucide-react';
import { useDevStore } from '@/store/devStore';
import { cn } from '@/lib/utils';

const DEBUG_MODE = process.env.NEXT_PUBLIC_DEBUG_MODE === 'true';

export function DevTools() {
  if (!DEBUG_MODE) return null;

  return <DevToolsPanel />;
}

function DevToolsPanel() {
  const {
    isOpen,
    toggleOpen,
    showGrid,
    toggleGrid,
    cardScale,
    setCardScale,
    pileOffsetX,
    pileOffsetY,
    setPileOffset,
    handGap,
    setHandGap,
    playerOffsetX,
    playerOffsetY,
    setPlayerOffset,
    resetAll,
  } = useDevStore();

  const [dragging, setDragging] = useState(false);

  return (
    <>
      {/* Grid overlay */}
      {showGrid && (
        <div className="pointer-events-none fixed inset-0 z-[9998]">
          <div
            className="h-full w-full opacity-20"
            style={{
              backgroundImage: `
                linear-gradient(hsl(var(--primary) / 0.3) 1px, transparent 1px),
                linear-gradient(90deg, hsl(var(--primary) / 0.3) 1px, transparent 1px)
              `,
              backgroundSize: '40px 40px',
            }}
          />
          {/* Center crosshair */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="h-8 w-[1px] bg-primary/50" />
            <div className="absolute left-1/2 top-1/2 h-[1px] w-8 -translate-x-1/2 -translate-y-1/2 bg-primary/50" />
          </div>
        </div>
      )}

      {/* Floating DEV button */}
      <motion.button
        drag
        dragMomentum={false}
        onDragStart={() => setDragging(true)}
        onDragEnd={() => setTimeout(() => setDragging(false), 50)}
        onClick={() => !dragging && toggleOpen()}
        className={cn(
          'fixed bottom-20 right-4 z-[9999] flex h-10 w-10 items-center justify-center rounded-full border shadow-lg',
          'font-display text-xs font-bold select-none cursor-grab active:cursor-grabbing',
          isOpen
            ? 'border-primary bg-primary text-primary-foreground'
            : 'border-border bg-card text-primary',
        )}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <Bug className="h-4 w-4" />
      </motion.button>

      {/* Dev panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="fixed bottom-32 right-4 z-[9999] w-72 rounded-xl border border-border bg-card p-3 shadow-xl max-h-[70vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Bug className="h-3.5 w-3.5 text-primary" />
                <span className="font-display text-xs font-bold text-primary">DEV TOOLS</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={resetAll}
                  className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  title="Reset all"
                >
                  <RotateCcw className="h-3 w-3" />
                </button>
                <button
                  onClick={toggleOpen}
                  className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>

            {/* Grid toggle */}
            <ToolSection icon={Grid3X3} label="Grid Overlay">
              <button
                onClick={toggleGrid}
                className={cn(
                  'rounded-md px-2.5 py-1 font-body text-xs font-semibold transition-colors',
                  showGrid
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:text-foreground',
                )}
              >
                {showGrid ? 'ON' : 'OFF'}
              </button>
            </ToolSection>

            {/* Card scale */}
            <ToolSection icon={Maximize2} label={`Card Scale: ${(cardScale * 100).toFixed(0)}%`}>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.01"
                  value={cardScale}
                  onChange={(e) => setCardScale(parseFloat(e.target.value))}
                  className="h-1.5 flex-1 cursor-pointer accent-primary"
                />
                <input
                  type="number"
                  min="0.5"
                  max="2"
                  step="0.05"
                  value={cardScale}
                  onChange={(e) => setCardScale(parseFloat(e.target.value) || 1)}
                  className="w-14 rounded-md border border-border bg-muted px-1.5 py-0.5 font-body text-[11px] text-foreground"
                />
              </div>
            </ToolSection>

            {/* Pile offset */}
            <ToolSection icon={Move} label={`Pile Offset: ${pileOffsetX}, ${pileOffsetY}`}>
              <AxisSlider
                label="X"
                value={pileOffsetX}
                min={-400}
                max={400}
                step={1}
                onChange={(v) => setPileOffset(v, pileOffsetY)}
              />
              <AxisSlider
                label="Y"
                value={pileOffsetY}
                min={-400}
                max={400}
                step={1}
                onChange={(v) => setPileOffset(pileOffsetX, v)}
              />
            </ToolSection>

            {/* Hand gap */}
            <ToolSection icon={GripHorizontal} label={`Hand Gap: ${handGap}px`}>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="24"
                  step="1"
                  value={handGap}
                  onChange={(e) => setHandGap(parseInt(e.target.value))}
                  className="h-1.5 flex-1 cursor-pointer accent-primary"
                />
                <input
                  type="number"
                  min="0"
                  max="40"
                  step="1"
                  value={handGap}
                  onChange={(e) => setHandGap(parseInt(e.target.value) || 0)}
                  className="w-14 rounded-md border border-border bg-muted px-1.5 py-0.5 font-body text-[11px] text-foreground"
                />
              </div>
            </ToolSection>

            {/* Player position */}
            <ToolSection icon={User} label={`Player Pos: ${playerOffsetX}, ${playerOffsetY}`}>
              <AxisSlider
                label="X"
                value={playerOffsetX}
                min={-400}
                max={400}
                step={1}
                onChange={(v) => setPlayerOffset(v, playerOffsetY)}
              />
              <AxisSlider
                label="Y"
                value={playerOffsetY}
                min={-200}
                max={200}
                step={1}
                onChange={(v) => setPlayerOffset(playerOffsetX, v)}
              />
            </ToolSection>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/** Reusable axis slider with label + range + number input */
function AxisSlider({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-2 mb-1 last:mb-0">
      <span className="font-body text-[10px] text-muted-foreground w-3">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="h-1.5 flex-1 cursor-pointer accent-primary"
      />
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="w-14 rounded-md border border-border bg-muted px-1.5 py-0.5 font-body text-[11px] text-foreground"
      />
    </div>
  );
}

function ToolSection({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-2.5 last:mb-0">
      <div className="mb-1.5 flex items-center gap-1.5">
        <Icon className="h-3 w-3 text-muted-foreground" />
        <span className="font-body text-[11px] font-semibold text-foreground">{label}</span>
      </div>
      <div className="pl-[18px]">{children}</div>
    </div>
  );
}
