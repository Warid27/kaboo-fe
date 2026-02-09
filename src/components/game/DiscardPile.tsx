import { motion, AnimatePresence } from 'framer-motion';
import type { Card } from '@/types/game';
import { getSuitSymbol, isRedSuit } from '@/lib/cardUtils';
import { cn } from '@/lib/utils';

interface DiscardPileProps {
  cards: Card[];
}

export function DiscardPile({ cards }: DiscardPileProps) {
  const topCards = cards.slice(-3);
  const topCard = cards[cards.length - 1];

  return (
    <div
      data-card-anchor="discard-pile"
      className="relative h-32 w-22 select-none"
      style={{ perspective: '800px' }}
    >
      {/* Fanned-out previous cards with 3D depth */}
      {topCards.slice(0, -1).map((card, i) => (
        <div
          key={card.id}
          className="absolute rounded-xl border border-border/10 bg-foreground/90"
          style={{
            width: '5rem',
            height: '7rem',
            transform: `rotate(${(i - 1) * 8}deg) translate(${(i - 1) * 3}px, 0) translateZ(${(i + 1) * -2}px)`,
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
            initial={{ scale: 0.5, opacity: 0, y: -60, rotateX: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0, rotateX: 0 }}
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
            <span
              className={cn(
                'text-2xl',
                isRedSuit(topCard.suit) ? 'text-[hsl(var(--suit-red))]' : 'text-background',
              )}
            >
              {getSuitSymbol(topCard.suit)}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty pile placeholder */}
      {cards.length === 0 && (
        <div
          className="absolute flex items-center justify-center rounded-xl border-2 border-dashed border-border/30"
          style={{ width: '5rem', height: '7rem' }}
        >
          <span className="font-body text-xs text-muted-foreground">Discard</span>
        </div>
      )}

      {/* Subtle table shadow */}
      <div
        className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full"
        style={{
          width: '90%',
          height: '8px',
          background: 'radial-gradient(ellipse, hsl(228 40% 4% / 0.5) 0%, transparent 70%)',
          filter: 'blur(3px)',
        }}
      />

      {/* Label badge */}
      <div className="absolute -bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-full border border-border/30 bg-muted px-2.5 py-0.5 shadow-card">
        <span className="font-display text-[10px] font-bold text-muted-foreground">
          Discard
        </span>
      </div>
    </div>
  );
}
