import { Heart, Diamond, Club, Spade } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Suit } from '@/types/game';

interface SuitIconProps {
  suit: Suit;
  className?: string;
  fill?: boolean;
}

export function SuitIcon({ suit, className, fill = true }: SuitIconProps) {
  const commonClasses = cn('inline-block', className);
  const fillClass = fill ? 'fill-current' : '';

  switch (suit) {
    case 'hearts':
      return <Heart className={cn(commonClasses, fillClass)} />;
    case 'diamonds':
      return <Diamond className={cn(commonClasses, fillClass)} />;
    case 'clubs':
      return <Club className={cn(commonClasses, fillClass)} />;
    case 'spades':
      return <Spade className={cn(commonClasses, fillClass)} />;
  }
}
