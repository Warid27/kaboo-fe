import { motion } from 'framer-motion';
import type { Player } from '@/types/game';
import { PlayingCard } from './PlayingCard';
import { DifficultyBadge } from './DifficultyBadge';
import { useAnimationConfig } from '@/hooks/useAnimationConfig';

interface OpponentHandProps {
  player: Player;
  isCurrentTurn: boolean;
  selectedCards: string[];
  peekedCards?: string[];
  highlightAll?: boolean;
  onCardClick?: (cardId: string) => void;
  position: 'top' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  isOffline: boolean;
  botDifficulty?: string;
}

const positionClasses: Record<string, string> = {
  top: '-top-2 left-1/2',
  left: 'left-32 -bottom-1/2',
  right: 'right-32 -bottom-1/2',
  'top-left': 'top-4 left-32',
  'top-right': 'top-4 right-32',
  'bottom-left': 'bottom-14 left-2',
  'bottom-right': 'bottom-14 right-2', 

};

export function OpponentHand({
  player,
  isCurrentTurn,
  selectedCards,
  peekedCards = [],
  highlightAll = false,
  onCardClick,
  position,
  isOffline,
  botDifficulty,
}: OpponentHandProps) {
  const anim = useAnimationConfig();

  // Determine transform values based on position
  const getTransforms = (pos: string) => {
    if (pos === 'top') return { x: '-50%', y: 0 };
    if (pos === 'left' || pos === 'right') return { x: 0, y: '-50%' };
    return { x: 0, y: 0 };
  };

  const transforms = getTransforms(position);

  return (
    <motion.div
      initial={anim.initial({ opacity: 0, scale: 0.8, ...transforms })}
      animate={{ opacity: 1, scale: 1, ...transforms }}
      transition={anim.spring}
      className={`absolute ${positionClasses[position]} z-10`}
    >
      {/* Player name badge */}
      <div className="mb-1 flex items-center justify-center gap-1.5">
        <div
          className="h-5 w-5 rounded-full flex items-center justify-center font-display text-[10px] font-bold text-primary-foreground"
          style={{ backgroundColor: player.avatarColor }}
        >
          {player.name.charAt(0)}
        </div>
        <span className="font-body text-xs font-semibold text-foreground/70">{player.name}</span>
        {isOffline && botDifficulty && (
          <DifficultyBadge difficulty={botDifficulty as any} size="sm" />
        )}
        {isCurrentTurn && (
          <motion.div
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="h-2 w-2 rounded-full bg-primary"
          />
        )}
      </div>

      {/* Cards */}
      <div className="grid grid-cols-2 gap-1">
        {player.cards.map((card) => (
          <PlayingCard
            key={card.id}
            card={card}
            isFaceUp={card.faceUp}
            isPeeked={peekedCards.includes(card.id)}
            isSelected={selectedCards.includes(card.id)}
            isHighlighted={highlightAll}
            onClick={onCardClick ? () => onCardClick(card.id) : undefined}
            size="sm"
          />
        ))}
      </div>
    </motion.div>
  );
}
