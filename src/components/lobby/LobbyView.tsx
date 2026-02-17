'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { GameSettings } from './GameSettings';
import { PlayerList } from './PlayerList';
import { Bot, Zap } from 'lucide-react';
import type { Player, GameSettings as IGameSettings } from '@/types/game';

interface LobbyViewProps {
  roomCode: string;
  players: Player[];
  isOffline: boolean;
  isHost: boolean;
  isReady: boolean;
  canStart: boolean;
  onStart: () => void;
  onLeave: () => void;
  onEndGame?: () => void;
  onToggleReady: () => void;
  onBack: () => void;
  settings: IGameSettings;
  updateSettings: (partial: Partial<IGameSettings>) => void;
  myPlayerId: string;
  onKickPlayer?: (id: string) => void;
}

export function LobbyView({
  roomCode,
  players,
  isOffline,
  isHost,
  isReady,
  canStart,
  onStart,
  onLeave,
  onEndGame,
  onToggleReady,
  onBack,
  settings,
  updateSettings,
  myPlayerId,
  onKickPlayer,
}: LobbyViewProps) {
  return (
    <div className="flex min-h-screen flex-col items-center bg-background px-4 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 text-center"
      >
        <button
          onClick={onBack}
          className="mb-4 font-body text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Back
        </button>
        <h1 className="font-display text-4xl font-bold text-gradient-primary">
          {isOffline ? 'vs Bots' : 'Game Lobby'}
        </h1>
        {isOffline && (
          <p className="mt-1 font-body text-sm text-muted-foreground">
            Offline mode — play against AI opponents
          </p>
        )}
      </motion.div>

      {/* Room Code — only for online */}
      {!isOffline && roomCode && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
          className="mb-6 rounded-2xl border-2 border-dashed border-primary/30 bg-card px-8 py-4 text-center"
        >
          <p className="font-body text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Room Code
          </p>
          <p className="font-display text-4xl font-bold tracking-[0.3em] text-primary">
            {roomCode}
          </p>
          <p className="mt-1 font-body text-xs text-muted-foreground">
            Share this code with friends
          </p>
        </motion.div>
      )}

      {/* Offline mode badge */}
      {isOffline && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
          className="mb-6 flex items-center gap-2 rounded-xl bg-muted px-5 py-3"
        >
          <Bot className="h-6 w-6 text-primary" />
          <div>
            <p className="font-display text-sm font-bold text-foreground">Offline Mode</p>
            <p className="font-body text-xs text-muted-foreground">
              Bots will make smart decisions
            </p>
          </div>
        </motion.div>
      )}

      {/* Content */}
      <div className="w-full max-w-md space-y-6">
        {/* Players */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <PlayerList 
            players={players} 
            isOffline={isOffline} 
            settings={settings}
            myPlayerId={myPlayerId}
            onKickPlayer={onKickPlayer}
          />
        </motion.div>

        {/* Waiting animation */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex items-center justify-center gap-2 py-2"
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{
                y: [0, -6, 0],
                rotate: [0, 180, 360],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2,
                ease: 'easeInOut',
              }}
              className="h-3 w-2 rounded-sm gradient-card-back"
            />
          ))}
          <span className="ml-2 font-body text-sm text-muted-foreground">
            {isOffline ? 'Bots are warming up...' : 'Waiting for players...'}
          </span>
        </motion.div>

        {/* Settings */}
        <GameSettings 
          settings={settings} 
          updateSettings={updateSettings}
          isHost={isHost}
          isOffline={isOffline}
        />

        {/* Start Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, type: 'spring' }}
          className="space-y-3"
        >
          {isHost ? (
            <>
              <Button
                onClick={onStart}
                disabled={!canStart}
                className={`h-14 w-full rounded-xl font-display text-xl font-bold transition-all gap-2 ${
                  canStart
                    ? 'gradient-gold text-primary-foreground glow-gold hover:brightness-110'
                    : 'bg-muted text-muted-foreground cursor-not-allowed opacity-70'
                }`}
              >
                {isOffline ? (
                  <>
                    <Bot className="h-6 w-6" /> Start vs Bots
                  </>
                ) : (
                  <>
                    <Zap className={`h-6 w-6 ${canStart ? 'fill-current' : ''}`} />
                    {canStart 
                      ? 'Start Game' 
                      : players.length < 2 
                        ? 'Waiting for players...' 
                        : 'Player Not Ready'}
                  </>
                )}
              </Button>
              
              {!isOffline && onEndGame && (
                <Button
                  onClick={onEndGame}
                  variant="outline"
                  className="w-full border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  End Game for Everyone
                </Button>
              )}
            </>
          ) : (
            <>
              <Button
                onClick={onToggleReady}
                className={`h-14 w-full rounded-xl font-display text-xl font-bold transition-all gap-2 ${
                    isReady 
                    ? 'bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/20' 
                    : 'bg-muted text-muted-foreground border-2 border-border/50 hover:bg-muted/80'
                }`}
              >
                {isReady ? "Ready!" : "Not Ready"}
              </Button>
              
              <Button
                onClick={onLeave}
                variant="outline"
                className="w-full border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                Leave Game
              </Button>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
