import { motion } from 'framer-motion';
import type { Player, GameSettings } from '@/types/game';
import { DifficultyBadge } from '@/components/game/DifficultyBadge';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface PlayerListProps {
  players: Player[];
  isOffline?: boolean;
  settings: GameSettings;
  myPlayerId: string;
  onKickPlayer?: (id: string) => void;
}

export function PlayerList({ players, isOffline = false, settings, myPlayerId, onKickPlayer }: PlayerListProps) {
  const MAX_PLAYERS = settings.numPlayers || 4;
  const emptySlots = Math.max(0, MAX_PLAYERS - players.length);

  const me = players.find(p => p.id === myPlayerId);
  const isHost = isOffline || (me?.isHost ?? false);

  return (
    <div className="space-y-2">
      <h3 className="font-display text-sm font-semibold text-muted-foreground">
        Players ({players.length}/{MAX_PLAYERS})
      </h3>
      <div className="flex flex-col gap-2">
        {players.map((player, index) => (
          <motion.div
            key={player.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 20,
              delay: index * 0.1,
            }}
            className="flex items-center gap-3 rounded-xl bg-muted/50 p-2"
          >
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full font-display text-lg font-bold text-primary-foreground shadow-sm"
              style={{ backgroundColor: player.avatarColor }}
            >
              {player.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-body text-base font-semibold text-foreground">
                  {player.name}
                </span>
                {player.isHost && !isOffline ? (
                  <span className="rounded-md bg-primary/10 px-1.5 py-0.5 font-display text-[10px] font-bold uppercase tracking-wider text-primary">
                    Host
                  </span>
                ) : !isOffline && (
                  <span className="rounded-md bg-secondary/20 px-1.5 py-0.5 font-display text-[10px] font-bold uppercase tracking-wider text-secondary-foreground">
                    Player
                  </span>
                )}
                {index === 0 && isOffline && (
                  <span className="rounded-md bg-primary/10 px-1.5 py-0.5 font-display text-[10px] font-bold uppercase tracking-wider text-primary">
                    You
                  </span>
                )}
              </div>
              {player.totalScore > 0 && (
                <span className="text-xs text-muted-foreground">
                  Score: {player.totalScore}
                </span>
              )}
            </div>
            
            {!isOffline && (
              <div className="ml-auto flex items-center gap-2">
                {!player.isHost && (
                  player.isReady ? (
                    <span className="text-green-500 font-bold text-xs mr-2">READY</span>
                  ) : (
                    <span className="text-muted-foreground font-bold text-xs opacity-50 mr-2">NOT READY</span>
                  )
                )}

                {isHost && !player.isHost && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => onKickPlayer?.(player.id)}
                    title="Kick player"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}

            {index > 0 && isOffline && (
              <div className="ml-auto">
                <DifficultyBadge difficulty={settings.botDifficulty} />
              </div>
            )}
          </motion.div>
        ))}

        {/* Empty Slots */}
        {!isOffline && Array.from({ length: emptySlots }).map((_, i) => (
          <div
            key={`empty-${i}`}
            className="flex items-center gap-3 rounded-xl border-2 border-dashed border-muted p-2 opacity-50"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted font-display text-lg font-bold text-muted-foreground">
              ?
            </div>
            <span className="font-body text-base text-muted-foreground">
              Waiting for player...
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
