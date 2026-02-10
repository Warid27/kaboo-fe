import { motion } from 'framer-motion';
import { Eye } from 'lucide-react';
import type { Card } from '@/types/game';
import { isRedSuit } from '@/lib/cardUtils';
import { CardBackPattern } from './CardBackPattern';
import { SuitIcon } from './SuitIcon';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAnimationConfig } from '@/hooks/useAnimationConfig';

interface PlayingCardProps {
  card: Card;
  isFaceUp?: boolean;
  isHighlighted?: boolean;
  isSelected?: boolean;
  isPeeked?: boolean;
  isMemorized?: boolean;
  isDealing?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'h-12 w-8 md:h-16 md:w-11',
  md: 'h-16 w-11 md:h-24 md:w-16',
  lg: 'h-28 w-20 md:h-32 md:w-[5.5rem]',
};

const radiusClasses = {
  sm: 'rounded-md',
  md: 'rounded-lg',
  lg: 'rounded-xl',
};

export function PlayingCard({
  card,
  isFaceUp = false,
  isHighlighted = false,
  isSelected = false,
  isPeeked = false,
  isMemorized = false,
  isDealing = false,
  onClick,
  size = 'md',
  className,
}: PlayingCardProps) {
  const showFace = isFaceUp || isPeeked;
  const isRed = isRedSuit(card.suit);
  const isMobile = useIsMobile();
  const anim = useAnimationConfig();

  return (
    <motion.div
      data-card-anchor={`card-${card.id}`}
      layout
      initial={anim.initial(isDealing ? { opacity: 0, scale: 0.3, y: -100 } : {})}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={anim.spring}
      onClick={onClick}
      draggable={false}
      onDragStart={(e) => e.preventDefault()}
      className={cn(
        'relative cursor-pointer select-none touch-manipulation',
        sizeClasses[size],
        className,
      )}
      style={{ perspective: 600 }}
      whileHover={onClick && !isMobile ? { scale: 1.08, y: -4 } : undefined}
      whileTap={onClick ? { scale: 0.95 } : undefined}
    >
      <motion.div
        animate={{ rotateY: showFace ? 0 : 180 }}
        transition={anim.springStiff}
        className="relative h-full w-full"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Front face */}
        <div
          className={cn(
            'absolute inset-0 flex flex-col items-center justify-center bg-foreground',
            radiusClasses[size],
            isSelected && 'ring-2 ring-primary ring-offset-1 ring-offset-background',
            isHighlighted && 'ring-2 ring-primary/50 ring-offset-1 ring-offset-background',
          )}
          style={{ backfaceVisibility: 'hidden' }}
        >
          <span
            className={cn(
              'font-display font-bold leading-none',
              isRed ? 'text-[hsl(var(--suit-red))]' : 'text-background',
              size === 'sm' ? 'text-[10px] md:text-xs' : size === 'md' ? 'text-xs md:text-sm' : 'text-sm md:text-lg',
            )}
          >
            {card.rank}
          </span>
          <SuitIcon
            suit={card.suit}
            className={cn(
              isRed ? 'text-[hsl(var(--suit-red))]' : 'text-background',
              size === 'sm' ? 'h-3 w-3 md:h-3.5 md:w-3.5' : size === 'md' ? 'h-3.5 w-3.5 md:h-5 md:w-5' : 'h-5 w-5 md:h-6 md:w-6',
            )}
          />
        </div>

        {/* Back face */}
        <div
          className={cn(
          'absolute inset-0 flex items-center justify-center bg-muted',
            radiusClasses[size],
            isSelected && 'ring-2 ring-primary ring-offset-1 ring-offset-background',
            isHighlighted && !showFace && 'ring-2 ring-accent/60 ring-offset-1 ring-offset-background animate-pulse',
          )}
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          {/* Card back pattern */}
          <CardBackPattern />

          {/* Memorized indicator */}
          {isMemorized && (
            <motion.div
              initial={anim.initial({ scale: 0 })}
              animate={{ scale: 1 }}
              className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground"
            >
              <Eye className="h-3 w-3" />
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
