import { motion } from 'framer-motion';
import { X, RotateCcw, Trophy, Target, Zap, Hash } from 'lucide-react';
import { useStatsStore } from '@/store/statsStore';
import { Button } from '@/components/ui/button';

interface StatsModalProps {
  open: boolean;
  onClose: () => void;
}

export function StatsModal({ open, onClose }: StatsModalProps) {
  const {
    totalRoundsPlayed,
    gamesWon,
    bestScore,
    kaboosCalled,
    kaboosSuccessful,
    lifetimeScore,
    resetStats,
  } = useStatsStore();

  if (!open) return null;

  const winRate = totalRoundsPlayed > 0 ? Math.round((gamesWon / totalRoundsPlayed) * 100) : 0;
  const avgScore = totalRoundsPlayed > 0 ? Math.round(lifetimeScore / totalRoundsPlayed) : 0;
  const kabooRate = kaboosCalled > 0 ? Math.round((kaboosSuccessful / kaboosCalled) * 100) : 0;

  const stats = [
    { icon: Hash, label: 'Rounds Played', value: totalRoundsPlayed, color: 'text-primary' },
    { icon: Trophy, label: 'Rounds Won', value: gamesWon, color: 'text-[hsl(45,90%,55%)]' },
    { icon: Target, label: 'Win Rate', value: `${winRate}%`, color: 'text-primary' },
    { icon: Zap, label: 'Best Score', value: bestScore ?? '—', color: 'text-[hsl(45,90%,55%)]' },
    { icon: Hash, label: 'Avg Score', value: avgScore, color: 'text-muted-foreground' },
    { icon: Zap, label: 'KABOOs Called', value: kaboosCalled, color: 'text-accent' },
    { icon: Target, label: 'KABOO Success', value: `${kabooRate}%`, color: 'text-accent' },
  ];

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[60] bg-background/70 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 30 }}
        transition={{ type: 'spring', stiffness: 350, damping: 25 }}
        className="fixed z-[60] flex flex-col overflow-hidden rounded-2xl border border-border/40 bg-card shadow-card inset-x-4 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-sm top-1/2 -translate-y-1/2"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/30 px-4 py-3">
          <h2 className="font-display text-lg font-bold text-foreground">📊 Lifetime Stats</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Stats grid */}
        <div className="px-5 py-4 space-y-2">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2.5"
            >
              <div className="flex items-center gap-2">
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
                <span className="font-body text-sm text-foreground">{stat.label}</span>
              </div>
              <span className={`font-display text-lg font-bold ${stat.color}`}>
                {stat.value}
              </span>
            </div>
          ))}
        </div>

        {/* Reset */}
        <div className="border-t border-border/30 px-5 py-3">
          <Button
            onClick={() => {
              resetStats();
              onClose();
            }}
            variant="outline"
            size="sm"
            className="w-full rounded-xl font-display text-xs font-bold"
          >
            <RotateCcw className="mr-1.5 h-3 w-3" />
            Reset Stats
          </Button>
        </div>
      </motion.div>
    </>
  );
}
