import { motion } from 'framer-motion';
import type { Player } from '@/types/game';
import { useGameStore } from '@/store/gameStore';
import { DifficultyBadge } from '@/components/game/DifficultyBadge';

interface PlayerListProps {
  players: Player[];
  isOffline?: boolean;
}

export function PlayerList({ players, isOffline = false }: PlayerListProps) {
  return (
    <div className="space-y-2">
      <h3 className="font-display text-sm font-semibold text-muted-foreground">
        Players ({players.length})
      </h3>
      <div className="flex flex-wrap gap-2">
        {players.map((player, index) => (
          <motion.div
            key={player.id}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 20,
              delay: index * 0.15,
            }}
            className="flex items-center gap-2 rounded-xl bg-muted px-3 py-2"
          >
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full font-display text-sm font-bold text-primary-foreground"
              style={{ backgroundColor: player.avatarColor }}
            >
              {player.name.charAt(0).toUpperCase()}
            </div>
            <span className="font-body text-sm font-semibold text-foreground">
              {player.name}
            </span>
            {player.isHost && !isOffline && (
              <span className="rounded-md bg-primary/20 px-1.5 py-0.5 font-display text-xs font-bold text-primary">
                HOST
              </span>
            )}
            {index === 0 && isOffline && (
              <span className="rounded-md bg-primary/20 px-1.5 py-0.5 font-display text-xs font-bold text-primary">
                YOU
              </span>
            )}
            {index > 0 && isOffline && (
              <DifficultyBadge difficulty={useGameStore.getState().settings.botDifficulty} />
            )}
            {player.totalScore > 0 && (
              <span className="rounded-md bg-accent/20 px-1.5 py-0.5 font-display text-xs font-bold text-accent">
                {player.totalScore} pts
              </span>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
