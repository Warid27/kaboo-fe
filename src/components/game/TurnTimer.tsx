import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface TurnTimerProps {
  timeRemaining: number;
  maxTime: number;
  isActive: boolean;
}

export function TurnTimer({ timeRemaining, maxTime }: TurnTimerProps) {
  const progress = timeRemaining / maxTime;
  const circumference = 2 * Math.PI * 20;
  const strokeDashoffset = circumference * (1 - progress);
  const isLow = timeRemaining <= 5;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn('relative flex items-center justify-center', isLow && 'animate-pulse')}
    >
      <svg width="52" height="52" viewBox="0 0 52 52" className="-rotate-90">
        <circle
          cx="26"
          cy="26"
          r="20"
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth="3"
        />
        <circle
          cx="26"
          cy="26"
          r="20"
          fill="none"
          stroke={isLow ? 'hsl(var(--destructive))' : 'hsl(var(--primary))'}
          strokeWidth="3"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000"
        />
      </svg>
      <span
        className={cn(
          'absolute font-display text-sm font-bold',
          isLow ? 'text-destructive' : 'text-primary',
        )}
      >
        {timeRemaining}
      </span>
    </motion.div>
  );
}
