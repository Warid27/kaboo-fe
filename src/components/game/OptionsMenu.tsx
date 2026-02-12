'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Settings, Pause, Play, LogOut, Undo2 } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import { useReplayStore } from '@/store/replayStore';
import { SettingsModal } from './SettingsModal';
import { Button } from '@/components/ui/button';

export interface OptionsMenuProps {
  onLeave?: () => void;
  onEndGame?: () => void;
}

export function OptionsMenu({ onLeave, onEndGame }: OptionsMenuProps) {
  const [open, setOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const isPaused = useGameStore((s) => s.isPaused);
  const setIsPaused = useGameStore((s) => s.setIsPaused);
  const gameMode = useGameStore((s) => s.gameMode);
  const backToLobby = useGameStore((s) => s.backToLobby);
  const endGame = useGameStore((s) => s.endGame);
  const players = useGameStore((s) => s.players);
  const myPlayerId = useGameStore((s) => s.myPlayerId);
  const router = useRouter();

  const isOffline = gameMode === 'offline';
  const me = players.find(p => p.id === myPlayerId);
  const isHost = isOffline || (me?.isHost ?? false);

  const canUndo = useReplayStore((s) => s.canUndo);

  const handlePause = () => {
    setIsPaused(!isPaused);
    setOpen(false);
  };

  const handleSettings = () => {
    setOpen(false);
    setShowSettings(true);
  };

  const handleUndo = () => {
    const snapshot = useReplayStore.getState().undo();
    if (snapshot) {
      useGameStore.setState({
        players: snapshot.players,
        drawPile: snapshot.drawPile,
        discardPile: snapshot.discardPile,
        heldCard: snapshot.heldCard,
        gamePhase: snapshot.gamePhase,
        turnPhase: snapshot.turnPhase,
        currentPlayerIndex: snapshot.currentPlayerIndex,
        effectType: snapshot.effectType,
        kabooCalled: snapshot.kabooCalled,
        kabooCallerIndex: snapshot.kabooCallerIndex,
        finalRoundTurnsLeft: snapshot.finalRoundTurnsLeft,
        selectedCards: snapshot.selectedCards,
        peekedCards: snapshot.peekedCards,
        memorizedCards: snapshot.memorizedCards,
        tapState: snapshot.tapState,
        turnNumber: snapshot.turnNumber,
      });
    }
    setOpen(false);
  };

  const handleExit = () => {
    setShowExitConfirm(true);
  };

  const confirmExit = () => {
    setOpen(false);
    setShowExitConfirm(false);
    setIsPaused(false);
    if (onLeave) {
      onLeave();
    } else {
      backToLobby();
    }
    router.push('/');
  };

  const handleEndGame = () => {
    if (onEndGame) {
      onEndGame();
      setOpen(false);
      setIsPaused(false);
      router.push('/');
    } else if (confirm('Are you sure you want to end the game for everyone?')) {
      setOpen(false);
      setIsPaused(false);
      endGame();
      router.push('/');
    }
  };

  const closeAll = () => {
    setOpen(false);
    setShowExitConfirm(false);
  };

  return (
    <>
      {/* Gear button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setOpen(true)}
        className="flex h-8 w-8 items-center justify-center rounded-full border border-border/40 bg-card/80 text-muted-foreground backdrop-blur-sm transition-colors hover:bg-card hover:text-foreground"
      >
        <Settings className="h-4 w-4" />
      </motion.button>

      {/* Options popup */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              role="dialog"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeAll}
              className="fixed inset-0 z-50 bg-background/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="fixed right-4 top-12 z-50 w-52 rounded-2xl border border-border/40 bg-card p-2 shadow-card"
            >
              {!showExitConfirm ? (
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={handleSettings}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 font-body text-sm font-semibold text-foreground transition-colors hover:bg-muted"
                  >
                    <Settings className="h-4 w-4 text-muted-foreground" />
                    Settings
                  </button>
                  <button
                    onClick={handlePause}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 font-body text-sm font-semibold text-foreground transition-colors hover:bg-muted"
                  >
                    {isPaused ? (
                      <Play className="h-4 w-4 text-primary" />
                    ) : (
                      <Pause className="h-4 w-4 text-muted-foreground" />
                    )}
                    {isPaused ? 'Resume' : 'Pause'}
                  </button>

                  {/* Undo (offline only) */}
                  {gameMode === 'offline' && (
                    <button
                      onClick={handleUndo}
                      disabled={!canUndo}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 font-body text-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Undo2 className="h-4 w-4 text-muted-foreground" />
                      Undo
                    </button>
                  )}

                  <div className="mx-2 my-1 h-px bg-border/30" />
                  
                  {isHost && !isOffline && (
                    <button
                      onClick={handleEndGame}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 font-body text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10"
                    >
                      <LogOut className="h-4 w-4" />
                      End Game
                    </button>
                  )}

                  <button
                    onClick={handleExit}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 font-body text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10"
                  >
                    <LogOut className="h-4 w-4" />
                    {isOffline ? 'Exit Game' : 'Leave Game'}
                  </button>
                </div>
              ) : (
                <div className="p-2 text-center">
                  <p className="font-display text-sm font-bold text-foreground">
                    Exit game?
                  </p>
                  <p className="mt-1 font-body text-xs text-muted-foreground">
                    Progress will be lost.
                  </p>
                  <div className="mt-3 flex gap-2">
                    <Button
                      onClick={confirmExit}
                      size="sm"
                      className="flex-1 rounded-xl font-display text-xs font-bold bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Exit
                    </Button>
                    <Button
                      onClick={() => setShowExitConfirm(false)}
                      variant="outline"
                      size="sm"
                      className="flex-1 rounded-xl font-display text-xs font-bold"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Settings modal */}
      <SettingsModal open={showSettings} onClose={() => setShowSettings(false)} />

      {/* Pause overlay */}
      <AnimatePresence>
        {isPaused && !open && !showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex items-center justify-center bg-background/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="text-center"
            >
              <h2 className="font-display text-3xl font-bold text-foreground">
                Game Paused
              </h2>
              <p className="mt-2 font-body text-sm text-muted-foreground">
                Take your time
              </p>
              <Button
                onClick={() => setIsPaused(false)}
                className="mt-6 rounded-xl font-display font-bold gradient-primary text-primary-foreground glow-primary"
              >
                <Play className="mr-2 h-4 w-4" /> Resume
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
