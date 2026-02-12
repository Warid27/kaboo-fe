import { motion, AnimatePresence } from 'framer-motion';
import type { Card } from '@/types/game';
import { PlayingCard } from './PlayingCard';

interface HeldCardProps {
  card: Card | null;
}

export function HeldCard({ card }: HeldCardProps) {
  return (
    <AnimatePresence>
      {card && (
        <motion.div
          initial={{ opacity: 0, y: -40, scale: 0.5 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.5 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="flex flex-col items-center gap-1"
        >
          <span className="font-display text-xs font-bold text-primary rounded-full bg-card/90 px-3 py-0.5 backdrop-blur-sm border border-primary/30">
            Drawn Card
          </span>
          <div className="rounded-2xl bg-card/80 p-1 backdrop-blur-sm shadow-card border border-border/30">
            <PlayingCard card={card} isFaceUp={card.faceUp} size="lg" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
