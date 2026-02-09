import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { ChevronUp, ChevronDown, ScrollText } from 'lucide-react';
import type { TurnLogEntry } from '@/types/game';

export interface TurnLogProps {
  turnLog?: TurnLogEntry[];
}

export function TurnLog(props: TurnLogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const store = useGameStore();
  const turnLog = props.turnLog ?? store.turnLog;

  if (turnLog.length === 0) return null;

  const recentLogs = turnLog.slice(-20).reverse();

  return (
    <div className="absolute bottom-2 left-2 z-40 w-56">
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center gap-1.5 rounded-lg bg-card/90 backdrop-blur-sm border border-border/30 px-2.5 py-1.5 font-body text-xs font-semibold text-foreground/80 hover:bg-card transition-colors"
      >
        <ScrollText className="h-3.5 w-3.5 text-primary" />
        <span>Turn Log</span>
        <span className="ml-auto rounded-full bg-primary/20 px-1.5 py-0.5 font-display text-[10px] text-primary">
          {turnLog.length}
        </span>
        {isOpen ? (
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        ) : (
          <ChevronUp className="h-3 w-3 text-muted-foreground" />
        )}
      </button>

      {/* Log entries */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="overflow-hidden"
          >
            <div className="mt-1 max-h-48 overflow-y-auto rounded-lg border border-border/30 bg-card/95 backdrop-blur-sm">
              {recentLogs.map((entry, i) => (
                <motion.div
                  key={entry.id}
                  initial={i === 0 ? { opacity: 0, x: -10 } : false}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-start gap-2 border-b border-border/10 px-2.5 py-1.5 last:border-b-0"
                >
                  <div
                    className="mt-0.5 h-4 w-4 shrink-0 rounded-full flex items-center justify-center font-display text-[8px] font-bold text-primary-foreground"
                    style={{ backgroundColor: entry.playerColor }}
                  >
                    {entry.playerName.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <span className="font-body text-[11px] leading-tight text-foreground/70">
                      <span className="font-semibold text-foreground/90">{entry.playerName}</span>{' '}
                      {entry.message}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
