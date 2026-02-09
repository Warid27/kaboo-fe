import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import type { Card } from '@/types/game';
import { getSuitSymbol, isRedSuit } from '@/lib/cardUtils';
import { cn } from '@/lib/utils';
import { useAnimationConfig } from '@/hooks/useAnimationConfig';

interface ActiveFlyingCard {
  id: string;
  card: Card;
  from: { x: number; y: number };
  to: { x: number; y: number };
}

export function FlyingCardLayer() {
  const flyingCards = useGameStore((s) => s.flyingCards);
  const removeFlyingCard = useGameStore((s) => s.removeFlyingCard);
  const [active, setActive] = useState<ActiveFlyingCard[]>([]);
  const processedIds = useRef(new Set<string>());
  const anim = useAnimationConfig();

  useEffect(() => {
    flyingCards.forEach((fc) => {
      if (processedIds.current.has(fc.id)) return;
      processedIds.current.add(fc.id);

      const fromEl = document.querySelector(`[data-card-anchor="${fc.fromAnchor}"]`);
      const toEl = document.querySelector(`[data-card-anchor="${fc.toAnchor}"]`);

      if (!fromEl || !toEl) {
        removeFlyingCard(fc.id);
        return;
      }

      const fromRect = fromEl.getBoundingClientRect();
      const toRect = toEl.getBoundingClientRect();

      setActive((prev) => [
        ...prev,
        {
          id: fc.id,
          card: fc.card,
          from: {
            x: fromRect.left + fromRect.width / 2,
            y: fromRect.top + fromRect.height / 2,
          },
          to: {
            x: toRect.left + toRect.width / 2,
            y: toRect.top + toRect.height / 2,
          },
        },
      ]);
    });
  }, [flyingCards, removeFlyingCard]);

  const handleComplete = (id: string) => {
    setActive((prev) => prev.filter((c) => c.id !== id));
    processedIds.current.delete(id);
    removeFlyingCard(id);
  };

  if (active.length === 0) return null;

  // Card dimensions match 'md' size: w-16 (64px), h-24 (96px)
  const halfW = 32;
  const halfH = 48;

  return (
    <div className="pointer-events-none fixed inset-0 z-[100]">
      {active.map((fc) => {
        const symbol = getSuitSymbol(fc.card.suit);
        const isRed = isRedSuit(fc.card.suit);

        return (
          <motion.div
            key={fc.id}
            style={{ position: 'absolute', left: 0, top: 0 }}
            initial={{
              x: fc.from.x - halfW,
              y: fc.from.y - halfH,
              scale: 0.8,
              rotate: 0,
            }}
            animate={{
              x: fc.to.x - halfW,
              y: fc.to.y - halfH,
              scale: 1,
              rotate: anim.enabled ? [0, -8, 5, 0] : 0,
            }}
            transition={anim.enabled ? {
              type: 'spring',
              stiffness: 180,
              damping: 22,
              rotate: { duration: 0.4 },
            } : { duration: 0 }}
            onAnimationComplete={() => handleComplete(fc.id)}
          >
            <div className="h-24 w-16 flex flex-col items-center justify-center rounded-xl border-2 border-border/30 bg-foreground shadow-lg">
              <span
                className={cn(
                  'font-display text-sm font-bold leading-none',
                  isRed ? 'text-[hsl(var(--suit-red))]' : 'text-background',
                )}
              >
                {fc.card.rank}
              </span>
              <span
                className={cn(
                  'text-lg',
                  isRed ? 'text-[hsl(var(--suit-red))]' : 'text-background',
                )}
              >
                {symbol}
              </span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
