'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useOnlineStore } from '@/store/onlineStore';
import { useOfflineStore } from '@/store/offlineStore';
import { useStatsStore } from '@/store/statsStore';
import { gameApi, RoomListItem } from '@/services/gameApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FloatingCard } from './FloatingCard';
import { StatsModal } from './StatsModal';
import { Bot, Gamepad2, Users, BarChart3, RefreshCw } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';

export function HomeScreen() {
  const router = useRouter();
  const { createGame, joinGame } = useOnlineStore();
  const { playerName, setPlayerName } = useOfflineStore();
  const setOfflinePlayerName = useOfflineStore((state) => state.setPlayerName);
  const { totalRoundsPlayed, gamesWon, bestScore } = useStatsStore();
  const [showJoinInput, setShowJoinInput] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [showStats, setShowStats] = useState(false);
  const [rooms, setRooms] = useState<RoomListItem[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const isOnline = process.env.NEXT_PUBLIC_IS_ONLINE === 'true';
  const { profile } = useProfile();

  const fetchRooms = useCallback(async () => {
    if (!isOnline) return;
    setLoadingRooms(true);
    try {
      const list = await gameApi.listRooms();
      setRooms(list);
    } catch {
    } finally {
      setLoadingRooms(false);
    }
  }, [isOnline]);

  useEffect(() => {
    fetchRooms();
    const interval = setInterval(fetchRooms, 5000);
    return () => clearInterval(interval);
  }, [fetchRooms]);

  useEffect(() => {
    if (!profile) return;

    const current = playerName.trim();
    if (current && current !== 'Player') return;

    const username = profile.username?.trim() ?? '';
    if (!username) return;

    const truncated = username.slice(0, 16);
    setPlayerName(truncated);
  }, [profile, playerName, setPlayerName]);

  const handleCreate = async () => {
    if (!playerName.trim()) return;
    await createGame(playerName.trim());
    router.push('/multiplayer');
  };

  const handleJoin = async () => {
    if (!playerName.trim()) return;
    try {
      await joinGame(joinCode, playerName.trim());
      router.push('/multiplayer');
    } catch {
      // Toast is handled in the store action
    }
  };

  const handleOffline = () => {
    if (playerName.trim()) {
      setOfflinePlayerName(playerName);
    }
    router.push('/single');
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-4">
      {/* Floating background cards */}
      <div className="pointer-events-none absolute inset-0">
        <FloatingCard suit="hearts" rank="K" delay={0} x={-120} y={-80} rotation={-15} />
        <FloatingCard suit="spades" rank="A" delay={0.3} x={130} y={-120} rotation={12} />
        <FloatingCard suit="diamonds" rank="Q" delay={0.6} x={-160} y={100} rotation={-25} />
        <FloatingCard suit="clubs" rank="J" delay={0.9} x={170} y={80} rotation={20} />
        <FloatingCard suit="hearts" rank="7" delay={1.2} x={-80} y={180} rotation={-10} />
        <FloatingCard suit="spades" rank="10" delay={1.5} x={100} y={-200} rotation={8} />
      </div>

      {/* Logo */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
        className="relative z-10 mb-8"
      >
        <h1 className="font-display text-7xl font-bold tracking-tight text-gradient-primary sm:text-8xl">
          KABOO
        </h1>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-2 text-center font-body text-lg text-muted-foreground"
        >
          The Card Game of Memory & Strategy
        </motion.div>
      </motion.div>

      {/* Stats summary */}
      {totalRoundsPlayed > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="relative z-10 mb-4"
        >
          <button
            onClick={() => setShowStats(true)}
            className="flex items-center gap-3 rounded-xl bg-card/60 border border-border/30 px-4 py-2 backdrop-blur-sm transition-colors hover:bg-card/80"
          >
            <BarChart3 className="h-4 w-4 text-primary" />
            <span className="font-body text-xs text-muted-foreground">
              {totalRoundsPlayed} rounds • {gamesWon} wins
              {bestScore !== null && ` • Best: ${bestScore}`}
            </span>
          </button>
        </motion.div>
      )}

      {/* Name input */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, type: 'spring', stiffness: 150 }}
        className="relative z-10 mb-6 w-full max-w-xs"
      >
        <Input
          placeholder="Enter your name..."
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          className="h-12 rounded-xl border-2 border-primary/30 bg-card text-center font-body text-lg font-semibold text-foreground placeholder:text-muted-foreground focus:border-primary focus:glow-primary"
          maxLength={16}
        />
      </motion.div>

      {/* Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, type: 'spring', stiffness: 150 }}
        className="relative z-10 flex flex-col gap-3 w-full max-w-xs"
      >
        {/* Offline vs Bots — prominent */}
        <Button
          onClick={handleOffline}
          className="h-14 rounded-xl font-display text-lg font-bold gradient-gold text-primary-foreground glow-gold hover:brightness-110 transition-all gap-2"
        >
          <Bot className="h-6 w-6" /> Play vs Bots
        </Button>

        <div className="flex gap-2">
          <Button
            onClick={handleCreate}
            disabled={!playerName.trim() || !isOnline}
            title={!isOnline ? 'Online mode is disabled' : undefined}
            className="flex-1 h-12 rounded-xl font-display text-sm font-bold gradient-primary text-primary-foreground hover:brightness-110 transition-all disabled:opacity-40 gap-2"
          >
            <Gamepad2 className="h-4 w-4" /> Create Game
          </Button>

          {!showJoinInput ? (
            <Button
              onClick={() => setShowJoinInput(true)}
              disabled={!playerName.trim() || !isOnline}
              title={!isOnline ? 'Online mode is disabled' : undefined}
              className="flex-1 h-12 rounded-xl font-display text-sm font-bold gradient-accent text-accent-foreground hover:brightness-110 transition-all disabled:opacity-40 gap-2"
            >
              <Users className="h-4 w-4" /> Join Game
            </Button>
          ) : null}
        </div>

        <AnimatePresence>
          {showJoinInput && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-col gap-2"
            >
              <Input
                placeholder="Room code..."
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                className="h-12 rounded-xl border-2 border-accent/30 bg-card text-center font-display text-lg font-bold tracking-widest text-foreground uppercase"
                maxLength={5}
              />
              <div className="flex gap-2">
                <Button
                  onClick={() => setShowJoinInput(false)}
                  variant="outline"
                  className="flex-1 h-12 rounded-xl font-body font-semibold"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleJoin}
                  disabled={joinCode.length < 4}
                  className="flex-1 h-12 rounded-xl font-display font-bold gradient-accent text-accent-foreground hover:brightness-110 transition-all disabled:opacity-40"
                >
                  Join
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {isOnline && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="mt-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-body text-xs text-muted-foreground">Open Rooms</span>
              <button onClick={fetchRooms} className="text-muted-foreground hover:text-foreground transition-colors">
                <RefreshCw className={`h-3 w-3 ${loadingRooms ? 'animate-spin' : ''}`} />
              </button>
            </div>
            {rooms.length === 0 ? (
              <p className="font-body text-xs text-muted-foreground text-center py-2">No rooms available</p>
            ) : (
              <div className="flex flex-col gap-1.5">
                {rooms.map((room) => (
                  <div
                    key={room.code}
                    className="flex items-center justify-between rounded-lg bg-card/60 border border-border/20 px-3 py-2 backdrop-blur-sm"
                  >
                    <div className="flex flex-col">
                      <span className="font-display text-sm font-bold tracking-wider text-foreground">
                        {room.code}
                      </span>
                      <span className="font-body text-xs text-muted-foreground">
                        {room.host} • {room.playerCount} player{room.playerCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <Button
                      onClick={() => {
                        setJoinCode(room.code);
                        setShowJoinInput(true);
                      }}
                      disabled={!playerName.trim()}
                      size="sm"
                      className="h-8 rounded-lg font-display text-xs font-bold gradient-accent text-accent-foreground hover:brightness-110 transition-all disabled:opacity-40"
                    >
                      Join
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </motion.div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        className="absolute bottom-4 flex items-center gap-3"
      >
        <span className={`font-body text-xs text-muted-foreground`}>v{process.env.NEXT_PUBLIC_APP_VERSION} — {process.env.NEXT_PUBLIC_APP_DESCRIPTION}</span>
        <Link
          href="/docs"
          className="font-body text-xs text-primary/70 underline-offset-2 hover:text-primary hover:underline transition-colors"
        >
          Docs
        </Link>
      </motion.div>

      {/* Stats Modal */}
      <StatsModal open={showStats} onClose={() => setShowStats(false)} />
    </div>
  );
}
