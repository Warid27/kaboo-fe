import { motion } from 'framer-motion';
import type { Card } from '@/types/game';
import { PlayingCard } from './PlayingCard';
import { useAnimationConfig } from '@/hooks/useAnimationConfig';

interface PlayerHandProps {
  cards: Card[];
  peekedCards: string[];
  memorizedCards: string[];
  selectedCards: string[];
  highlightAll?: boolean;
  onCardClick?: (cardId: string) => void;
  handGap?: number;
}

export function PlayerHand({
  cards,
  peekedCards,
  memorizedCards,
  selectedCards,
  highlightAll = false,
  onCardClick,
  handGap = 8,
}: PlayerHandProps) {
  const anim = useAnimationConfig();

  return (
    <motion.div
      initial={anim.initial({ opacity: 0, y: 30 })}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...anim.spring, delay: anim.enabled ? 0.5 : 0 }}
      className="grid grid-cols-2"
      style={{
        gap: `${handGap}px`,
      }}
    >
      {cards.map((card) => (
        <PlayingCard
          key={card.id}
          card={card}
          isFaceUp={card.faceUp}
          isPeeked={peekedCards.includes(card.id)}
          isMemorized={memorizedCards.includes(card.id)}
          isSelected={selectedCards.includes(card.id)}
          isHighlighted={highlightAll}
          isDealing
          onClick={onCardClick ? () => onCardClick(card.id) : undefined}
          size="lg"
        />
      ))}
    </motion.div>
  );
}
