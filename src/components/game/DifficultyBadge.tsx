import { cn } from '@/lib/utils';
import type { BotDifficulty } from '@/types/game';

const config: Record<BotDifficulty, { stars: number; label: string; className: string }> = {
  easy: { stars: 1, label: 'Easy', className: 'bg-primary/20 text-primary' },
  medium: { stars: 2, label: 'Med', className: 'bg-[hsl(var(--kaboo-gold))]/20 text-[hsl(var(--kaboo-gold))]' },
  hard: { stars: 3, label: 'Hard', className: 'bg-destructive/20 text-destructive' },
};

interface DifficultyBadgeProps {
  difficulty: BotDifficulty;
  size?: 'sm' | 'md';
}

export function DifficultyBadge({ difficulty, size = 'md' }: DifficultyBadgeProps) {
  const { stars, label, className } = config[difficulty];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 rounded-md font-display font-bold',
        size === 'sm' ? 'px-1 py-px text-[8px]' : 'px-1.5 py-0.5 text-xs',
        className,
      )}
    >
      {'★'.repeat(stars)} {size === 'md' && label}
    </span>
  );
}
