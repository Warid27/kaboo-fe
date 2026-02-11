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
  
  const MAX_STACK = 5;
  // Calculate visual stack size based on remaining cards (max 5 cards shown)
  // Shows 1 card for 1-9 remaining
  // Shows 2 cards for 10-19 remaining (10 starts the next "chunk")
  // Formula: 1 base card + 1 for each full 10 cards
  const visualStackSize = cardsRemaining === 0 
    ? 0 
    : Math.min(MAX_STACK, Math.floor(cardsRemaining / 10) + 1);
  
  // Create array of offsets anchored to the top (0 is top card)
  // This ensures we always have a "top" card (0), and add cards below it (1, 2, etc.)
  const stackOffsets = Array.from({ length: visualStackSize }, (_, i) => i);

  return (
    <div className="relative h-32 w-22" style={{ perspective: '1200px' }}>
      <motion.div
        data-card-anchor="draw-pile"
        initial={{ rotateX: 30, rotateZ: -12, rotateY: 4 }}
        whileHover={onClick ? { scale: 1.05, rotateX: 35, rotateZ: -10, rotateY: 4, y: -10 } : undefined}
        whileTap={onClick ? { scale: 0.95, y: 0 } : undefined}
        onClick={onClick}
        className={cn(
          'relative h-full w-full cursor-pointer select-none',
          isHighlighted && 'animate-pulse',
        )}
        style={{ 
          transformStyle: 'preserve-3d', 
        }}
      >
      {/* 3D stacked cards effect */}
      {stackOffsets.map((offset, index) => {
        // Calculate physical position to anchor stack to the bottom
        // Size 1: index 0 -> Pos 4
        // Size 5: index 0 -> Pos 0
        const positionIndex = (MAX_STACK - visualStackSize) + index;
        const isTop = offset === 0;

        return (
          <div
            key={offset}
            className={cn(
              'absolute rounded border-2 bg-muted',
              isHighlighted ? 'border-primary/40' : 'border-border/20',
            )}
            style={{
              width: '5rem',
              height: '7rem',
              transform: `translateZ(${positionIndex * -12}px) translateX(${positionIndex * 1}px) translateY(${positionIndex * 1}px)`,
              zIndex: MAX_STACK - positionIndex,
              boxShadow:
                isTop
                  ? `0 8px 24px hsl(228 40% 4% / 0.6), 0 2px 8px hsl(228 40% 4% / 0.4), inset 0 1px 0 hsl(174 80% 42% / 0.1)`
                  : `-1px 1px 4px hsl(228 40% 4% / 0.6)`,
              backgroundColor: isTop ? undefined : 'hsl(var(--card-stack))',
              filter: !isTop ? `brightness(${0.95 - positionIndex * 0.05})` : undefined,
            }}
          >
            {isTop && (
              <div className="flex h-full w-full items-center justify-center rounded-lg bg-muted">
                <CardBackPattern />
              </div>
            )}
          </div>
        );
      })}

      {/* Empty pile placeholder */}
      {cardsRemaining === 0 && (
        <div
          className="absolute rounded-xl border-2 border-white/10 bg-white/5"
          style={{ 
            width: '5rem', 
            height: '7rem',
            transform: `translateZ(${(MAX_STACK - 1) * -12}px) translateX(${(MAX_STACK - 1) * 1}px) translateY(${(MAX_STACK - 1) * 1}px)`,
          }}
        />
      )}

      {/* Subtle table shadow beneath the stack */}
      <div
        className="absolute top-full left-1/2 -translate-x-1/2 rounded-[100%]"
        style={{
          width: '120%',
          height: '24px',
          background: 'radial-gradient(ellipse, hsl(228 40% 4% / 0.4) 0%, transparent 70%)',
          filter: 'blur(8px)',
          transform: 'translateZ(-80px) rotateX(-30deg)',
          pointerEvents: 'none',
        }}
      />

      </motion.div>

      {/* Card count badge */}
      <div className="absolute -bottom-12 left-1/2 z-10 -translate-x-1/2 flex items-center gap-1 rounded-full border border-border/30 bg-muted px-2.5 py-0.5 shadow-card">
        <span className="font-display text-xs font-bold text-muted-foreground">
          {cardsRemaining}
        </span>
        {isHighlighted && (
          <kbd className="inline-flex h-4 min-w-[1rem] items-center justify-center rounded border border-primary/30 bg-primary/10 px-1 font-body text-[9px] font-bold leading-none text-primary">
            {getKeyDisplayName(drawKey)}
          </kbd>
        )}
      </div>
    </div>
  );
}
