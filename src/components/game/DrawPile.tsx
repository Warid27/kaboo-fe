import { motion } from 'framer-motion';
import { CardBackPattern } from './CardBackPattern';
import { cn } from '@/lib/utils';
import { useSettingsStore, getKeyDisplayName } from '@/store/settingsStore';

interface DrawPileProps {
  cardsRemaining: number;
  isHighlighted: boolean;
  onClick?: () => void;
}

export function DrawPile({ cardsRemaining, isHighlighted, onClick }: DrawPileProps) {
  const drawKey = useSettingsStore((s) => s.keyBindings.draw);
  return (
    <motion.div
      data-card-anchor="draw-pile"
      whileHover={onClick ? { scale: 1.05, rotateX: -2 } : undefined}
      whileTap={onClick ? { scale: 0.95 } : undefined}
      onClick={onClick}
      className={cn(
        'relative h-32 w-22 cursor-pointer select-none',
        isHighlighted && 'animate-pulse',
      )}
      style={{ perspective: '800px' }}
    >
      {/* 3D stacked cards effect */}
      {[4, 3, 2, 1, 0].map((offset) => (
        <div
          key={offset}
          className={cn(
            'absolute rounded-xl border-2 bg-muted',
            isHighlighted ? 'border-primary/40' : 'border-border/20',
          )}
          style={{
            width: '5rem',
            height: '7rem',
            transform: `translateZ(${offset * -3}px) translateY(${offset * -3}px)`,
            zIndex: 5 - offset,
            boxShadow:
              offset === 0
                ? `0 8px 24px hsl(228 40% 4% / 0.6), 0 2px 8px hsl(228 40% 4% / 0.4), inset 0 1px 0 hsl(174 80% 42% / 0.1)`
                : `0 ${2 + offset * 2}px ${8 + offset * 4}px hsl(228 40% 4% / ${0.3 + offset * 0.05})`,
            opacity: offset === 0 ? 1 : 1 - offset * 0.12,
          }}
        >
          {offset === 0 && (
            <div className="flex h-full w-full items-center justify-center rounded-lg">
              <CardBackPattern />
            </div>
          )}
        </div>
      ))}

      {/* Subtle table shadow beneath the stack */}
      <div
        className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full"
        style={{
          width: '90%',
          height: '8px',
          background: 'radial-gradient(ellipse, hsl(228 40% 4% / 0.5) 0%, transparent 70%)',
          filter: 'blur(3px)',
        }}
      />

      {/* Card count badge */}
      <div className="absolute -bottom-4 left-1/2 z-10 -translate-x-1/2 flex items-center gap-1 rounded-full border border-border/30 bg-muted px-2.5 py-0.5 shadow-card">
        <span className="font-display text-xs font-bold text-muted-foreground">
          {cardsRemaining}
        </span>
        {isHighlighted && (
          <kbd className="inline-flex h-4 min-w-[1rem] items-center justify-center rounded border border-primary/30 bg-primary/10 px-1 font-body text-[9px] font-bold leading-none text-primary">
            {getKeyDisplayName(drawKey)}
          </kbd>
        )}
      </div>
    </motion.div>
  );
}
