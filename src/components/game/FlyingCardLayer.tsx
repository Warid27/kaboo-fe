import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore, type FlyingCardEntry } from '@/store/gameStore';
import type { Card } from '@/types/game';
import { isRedSuit } from '@/lib/cardUtils';
import { cn } from '@/lib/utils';
import { useAnimationConfig } from '@/hooks/useAnimationConfig';
import { SuitIcon } from './SuitIcon';

interface ActiveFlyingCard {
  id: string;
  card: Card;
  from: { x: number; y: number };
  to: { x: number; y: number };
}

export interface FlyingCardLayerProps {
  flyingCards?: FlyingCardEntry[];
  onRemoveFlyingCard?: (id: string) => void;
}

export function FlyingCardLayer(props: FlyingCardLayerProps) {
  const store = useGameStore();
  const flyingCards = props.flyingCards ?? store.flyingCards;
  const removeFlyingCard = props.onRemoveFlyingCard ?? store.removeFlyingCard;
  
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

  // Card dimensions match 'lg' size (mobile): w-20 (80px), h-28 (112px)
  const halfW = 40;
  const halfH = 56;

  return (
    <div className="pointer-events-none fixed inset-0 z-[100]">
      {active.map((fc) => {
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
            <div className="h-28 w-20 flex flex-col items-center justify-center rounded-xl border-2 border-border/30 bg-foreground shadow-lg">
              <span
                className={cn(
                  'font-display text-sm font-bold leading-none',
                  isRed ? 'text-[hsl(var(--suit-red))]' : 'text-background',
                )}
              >
                {fc.card.rank}
              </span>
              <SuitIcon
                suit={fc.card.suit}
                className={cn(
                  'h-6 w-6',
                  isRed ? 'text-[hsl(var(--suit-red))]' : 'text-background',
                )}
              />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
