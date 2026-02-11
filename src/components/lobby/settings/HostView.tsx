import { motion } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { TIMER_OPTIONS, TARGET_SCORE_OPTIONS, PLAYER_COUNTS } from './constants';

export function HostView() {
  const { settings, updateSettings } = useGameStore();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="space-y-4"
    >
      {/* Turn Timer */}
      <div>
        <label className="mb-2 block font-display text-sm font-semibold text-muted-foreground">
          Turn Timer
        </label>
        <div className="flex gap-2">
          {TIMER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => updateSettings({ turnTimer: opt.value })}
              className={`flex-1 rounded-lg px-3 py-2 font-display text-sm font-bold transition-all ${
                settings.turnTimer === opt.value
                  ? 'gradient-primary text-primary-foreground glow-primary'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Target Score */}
      <div>
        <label className="mb-2 block font-display text-sm font-semibold text-muted-foreground">
          Target Score
        </label>
        <div className="flex gap-2">
          {TARGET_SCORE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => updateSettings({ targetScore: opt.value })}
              className={`flex-1 rounded-lg px-3 py-2 font-display text-sm font-bold transition-all ${
                settings.targetScore === opt.value
                  ? 'gradient-gold text-primary-foreground glow-gold'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Number of Players */}
      <div>
        <label className="mb-2 block font-display text-sm font-semibold text-muted-foreground">
          Players
        </label>
        <div className="flex flex-wrap gap-2">
          {PLAYER_COUNTS.map((count) => (
            <button
              key={count}
              onClick={() => updateSettings({ numPlayers: count })}
              className={`h-9 w-9 rounded-lg font-display text-sm font-bold transition-all ${
                settings.numPlayers === count
                  ? 'gradient-accent text-accent-foreground glow-accent'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {count}
            </button>
          ))}
        </div>
      </div>

      {/* Use Effect Cards */}
      <div className="flex items-center justify-between rounded-lg bg-muted px-4 py-3">
        <div>
          <span className="font-display text-sm font-semibold text-foreground">Use Effect Cards</span>
          <p className="font-body text-[11px] text-muted-foreground">7–K trigger special abilities when discarded</p>
        </div>
        <button
          onClick={() => updateSettings({ useEffectCards: !settings.useEffectCards })}
          className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
            settings.useEffectCards ? 'bg-primary' : 'bg-border'
          }`}
        >
          <motion.div
            animate={{ x: settings.useEffectCards ? 20 : 2 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="absolute top-1 h-5 w-5 rounded-full bg-foreground"
          />
        </button>
      </div>

      {/* Matt's Pairs Rule */}
      <div className="flex items-center justify-between rounded-lg bg-muted px-4 py-3">
        <div>
          <span className="font-display text-sm font-semibold text-foreground">Matt&apos;s Pairs Rule</span>
          <p className="font-body text-[11px] text-muted-foreground">Discard matching rank pairs from your hand</p>
        </div>
        <button
          onClick={() => updateSettings({ mattsPairsRule: !settings.mattsPairsRule })}
          className={`relative h-7 w-12 rounded-full transition-colors ${
            settings.mattsPairsRule ? 'bg-primary' : 'bg-border'
          }`}
        >
          <motion.div
            animate={{ x: settings.mattsPairsRule ? 20 : 2 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="absolute top-1 h-5 w-5 rounded-full bg-foreground"
          />
        </button>
      </div>
    </motion.div>
  );
}
