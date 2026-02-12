'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { Button } from '@/components/ui/button';
import { Confetti } from './Confetti';
import { Crown, Trophy, Home, RefreshCw } from 'lucide-react';
import { SuitIcon } from '../game/SuitIcon';

export function ScoringScreen() {
  const { players, kabooCallerIndex, playAgain, backToLobby, matchOver, roundNumber, settings } = useGameStore();

  const handlePlayAgain = () => {
    playAgain();
    // In unified mode, the screen state handles navigation
  };

  const handleBackToLobby = () => {
    backToLobby();
  };

  const sortedPlayers = useMemo(() => {
    return [...players].sort((a, b) => a.score - b.score);
  }, [players]);

  // For match over, sort by total score
  const sortedByTotal = useMemo(() => {
    return [...players].sort((a, b) => a.totalScore - b.totalScore);
  }, [players]);

  const winnerId = sortedPlayers[0]?.id;
  // const lowestScore = sortedPlayers[0]?.score ?? 0;
  const matchWinnerId = matchOver ? sortedByTotal[0]?.id : null;
  const targetScore = parseInt(settings.targetScore);

  return (
    <div className="flex min-h-screen flex-col items-center bg-background px-4 py-8">
      <Confetti />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 text-center"
      >
        <motion.div
          animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="mb-2 flex justify-center"
        >
          {matchOver ? (
            <Crown className="h-16 w-16 text-[hsl(45,90%,55%)] fill-[hsl(45,90%,55%)]" />
          ) : (
            <Trophy className="h-16 w-16 text-[hsl(45,90%,55%)] fill-[hsl(45,90%,55%)]" />
          )}
        </motion.div>
        <h1 className="font-display text-4xl font-bold text-gradient-gold">
          {matchOver ? 'Match Over!' : `Round ${roundNumber} Complete`}
        </h1>
        {!matchOver && (
          <p className="mt-1 font-body text-sm text-muted-foreground">
            Target: {targetScore} pts
          </p>
        )}
      </motion.div>

      {/* Scoreboard */}
      <div className="w-full max-w-md space-y-3">
        {(matchOver ? sortedByTotal : sortedPlayers).map((player, index) => {
          const isRoundWinner = player.id === winnerId;
          const isMatchWinner = matchOver && player.id === matchWinnerId;
          const isKabooCaller = players.indexOf(player) === kabooCallerIndex;
          // const gotPenalty = isKabooCaller && player.score > lowestScore + 20;

          return (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.15, type: 'spring' }}
              className={`flex items-center gap-3 rounded-2xl border-2 p-4 ${
                (matchOver ? isMatchWinner : isRoundWinner)
                  ? 'border-[hsl(45,90%,55%)] bg-[hsl(45,90%,55%,0.1)] glow-gold'
                  : 'border-border bg-card'
              }`}
            >
              {/* Rank */}
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full font-display text-lg font-bold ${
                  index === 0
                    ? 'gradient-gold text-primary-foreground'
                    : index === 1
                    ? 'bg-muted text-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {index + 1}
              </div>

              {/* Player info */}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div
                    className="h-6 w-6 rounded-full flex items-center justify-center font-display text-xs font-bold text-primary-foreground"
                    style={{ backgroundColor: player.avatarColor }}
                  >
                    {player.name.charAt(0)}
                  </div>
                  <span className="font-display text-base font-bold text-foreground">
                    {player.name}
                  </span>
                  {isMatchWinner && (
                    <span className="rounded-md bg-[hsl(45,90%,55%,0.2)] px-2 py-0.5 font-display text-xs font-bold text-[hsl(45,90%,55%)]">
                      CHAMPION
                    </span>
                  )}
                  {!matchOver && isRoundWinner && (
                    <span className="rounded-md bg-[hsl(45,90%,55%,0.2)] px-2 py-0.5 font-display text-xs font-bold text-[hsl(45,90%,55%)]">
                      WINNER
                    </span>
                  )}
                  {isKabooCaller && (
                    <span className="rounded-md bg-destructive/20 px-2 py-0.5 font-display text-xs font-bold text-destructive">
                      KABOO
                    </span>
                  )}
                </div>

                {/* Card values breakdown */}
                <div className="mt-1 flex gap-1">
                  {player.cards.map((card) => (
                    <span
                      key={card.id}
                      className="flex items-center gap-0.5 rounded bg-muted px-1.5 py-0.5 font-body text-xs text-muted-foreground"
                    >
                      {card.rank}
                      <SuitIcon suit={card.suit} className="h-3 w-3" />
                    </span>
                  ))}
                </div>
              </div>

              {/* Score */}
              <div className="text-right">
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.15 + 0.3, type: 'spring' }}
                  className={`font-display text-2xl font-bold ${
                    (matchOver ? isMatchWinner : isRoundWinner) ? 'text-[hsl(45,90%,55%)]' : 'text-foreground'
                  }`}
                >
                  {matchOver ? player.totalScore : player.score}
                </motion.span>
                {!matchOver && (
                  <p className="font-body text-xs text-muted-foreground">
                    Total: {player.totalScore}
                  </p>
                )}
                {matchOver && (
                  <p className="font-body text-xs text-muted-foreground">
                    Round: {player.score}
                  </p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Progress bar (when not match over) */}
      {!matchOver && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-6 w-full max-w-md"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="font-body text-xs text-muted-foreground">Closest to target</span>
            <span className="font-display text-xs font-bold text-foreground">
              {Math.max(...players.map((p) => p.totalScore))} / {targetScore}
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, (Math.max(...players.map((p) => p.totalScore)) / targetScore) * 100)}%` }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="h-full rounded-full gradient-gold"
            />
          </div>
        </motion.div>
      )}

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="mt-8 flex w-full max-w-md gap-3"
      >
        <Button
          onClick={handlePlayAgain}
          className="flex-1 h-14 rounded-xl font-display text-lg font-bold gradient-primary text-primary-foreground glow-primary hover:brightness-110 transition-all gap-2"
        >
          {matchOver ? (
            <>
              <Home className="h-5 w-5" /> New Match
            </>
          ) : (
            <>
              <RefreshCw className="h-5 w-5" /> Next Round
            </>
          )}
        </Button>
        <Button
          onClick={handleBackToLobby}
          variant="outline"
          className="flex-1 h-14 rounded-xl font-display text-lg font-bold gap-2"
        >
          <Home className="h-5 w-5" /> Home
        </Button>
      </motion.div>
    </div>
  );
}
