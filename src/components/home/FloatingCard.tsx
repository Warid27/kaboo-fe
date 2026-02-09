import { motion } from 'framer-motion';
import type { Suit, Rank } from '@/types/game';
import { getSuitSymbol, isRedSuit } from '@/lib/cardUtils';

interface FloatingCardProps {
  suit: Suit;
  rank: Rank;
  delay: number;
  x: number;
  y: number;
  rotation: number;
}

export function FloatingCard({ suit, rank, delay, x, y, rotation }: FloatingCardProps) {
  const symbol = getSuitSymbol(suit);
  const isRed = isRedSuit(suit);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5, x: 0, y: 0, rotate: 0 }}
      animate={{
        opacity: [0, 0.25, 0.15],
        scale: [0.5, 1, 1],
        x,
        y,
        rotate: rotation,
      }}
      transition={{
        delay,
        duration: 2,
        ease: 'easeOut',
      }}
      className="absolute left-1/2 top-1/2"
    >
      <motion.div
        animate={{
          y: [0, -8, 0, 8, 0],
          rotate: [rotation, rotation + 2, rotation, rotation - 2, rotation],
        }}
        transition={{
          duration: 6 + delay,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="flex h-28 w-20 flex-col items-center justify-center rounded-xl border border-border/20 bg-card/60 backdrop-blur-sm shadow-card"
      >
        <span className={`font-display text-xl font-bold ${isRed ? 'text-suit-red' : 'text-suit-black'}`}>
          {rank}
        </span>
        <span className={`text-2xl ${isRed ? 'text-suit-red' : 'text-suit-black'}`}>
          {symbol}
        </span>
      </motion.div>
    </motion.div>
  );
}
