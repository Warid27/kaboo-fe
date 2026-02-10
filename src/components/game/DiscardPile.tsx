import { motion, AnimatePresence } from 'framer-motion';
import type { Card } from '@/types/game';
import { isRedSuit } from '@/lib/cardUtils';
import { SuitIcon } from './SuitIcon';
import { cn } from '@/lib/utils';

interface DiscardPileProps {
  cards: Card[];
}

export function DiscardPile({ cards }: DiscardPileProps) {
  const topCards = cards.slice(-8);
  const topCard = cards[cards.length - 1];

  return (
    <div className="relative h-32 w-22 select-none" style={{ perspective: '1200px' }}>
      <motion.div
        data-card-anchor="discard-pile"
        initial={{ rotateX: 30, rotateZ: -12, rotateY: 4 }}
        className="relative h-full w-full"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Fanned-out previous cards with 3D depth */}
      {topCards.slice(0, -1).map((card, i) => (
        <div
          key={card.id}
          className="absolute rounded-xl border border-border/10 bg-foreground/90"
          style={{
            width: '5rem',
            height: '7rem',
            transform: `rotate(${(i - 1) * 8}deg) translate(${(i - 1) * 3}px, 0) translateZ(-${(topCards.slice(0, -1).length - i) * 12}px)`,
            zIndex: i,
            boxShadow: `0 ${4 + i * 2}px ${10 + i * 3}px hsl(228 40% 4% / 0.4)`,
          }}
        />
      ))}

      {/* Top card with 3D entrance */}
      <AnimatePresence>
        {topCard && (
          <motion.div
            key={topCard.id}
            initial={{ scale: 0.5, opacity: 0, y: -60, rotateX: 30, z: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0, rotateX: 0, z: 0 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="absolute z-10 flex flex-col items-center justify-center rounded-xl border-2 border-border/30 bg-foreground"
            style={{
              width: '5rem',
              height: '7rem',
              boxShadow: `
                0 8px 24px hsl(228 40% 4% / 0.6),
                0 2px 8px hsl(228 40% 4% / 0.4),
                inset 0 1px 0 hsl(40 20% 95% / 0.08)
              `,
            }}
          >
            <span
              className={cn(
                'font-display text-lg font-bold leading-none',
                isRedSuit(topCard.suit) ? 'text-[hsl(var(--suit-red))]' : 'text-background',
              )}
            >
              {topCard.rank}
            </span>
            <SuitIcon
              suit={topCard.suit}
              className={cn(
                'h-6 w-6',
                isRedSuit(topCard.suit) ? 'text-[hsl(var(--suit-red))]' : 'text-background',
              )}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty pile placeholder */}
      {cards.length === 0 && (
        <div
          className="absolute rounded-xl border-2 border-white/10 bg-white/5"
          style={{ width: '5rem', height: '7rem' }}
        />
      )}

      {/* Subtle table shadow */}
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

      {/* Label badge */}
      <div className="absolute -bottom-12 left-1/2 z-10 -translate-x-1/2 rounded-full border border-border/30 bg-muted px-2.5 py-0.5 shadow-card">
        <span className="whitespace-nowrap font-display text-[10px] font-bold text-muted-foreground">
          Discard {cards.length > 0 && `(${cards.length})`}
        </span>
      </div>
    </div>
  );
}
