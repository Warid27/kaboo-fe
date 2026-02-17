import { motion } from 'framer-motion';
import { GameSettings } from '@/types/game';
import { TIMER_OPTIONS, TARGET_SCORE_OPTIONS } from './constants';

interface PlayerViewProps {
  settings: GameSettings;
}

export function PlayerView({ settings }: PlayerViewProps) {

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
        <div className="rounded-lg bg-muted px-3 py-2 font-display text-sm font-bold text-foreground">
          {TIMER_OPTIONS.find(o => o.value === settings.turnTimer)?.label || settings.turnTimer}
        </div>
      </div>

      {/* Target Score */}
      <div>
        <label className="mb-2 block font-display text-sm font-semibold text-muted-foreground">
          Target Score
        </label>
        <div className="rounded-lg bg-muted px-3 py-2 font-display text-sm font-bold text-foreground">
          {TARGET_SCORE_OPTIONS.find(o => o.value === settings.targetScore)?.label || settings.targetScore}
        </div>
      </div>

      {/* Players */}
      <div>
        <label className="mb-2 block font-display text-sm font-semibold text-muted-foreground">
          Players
        </label>
        <div className="rounded-lg bg-muted px-3 py-2 font-display text-sm font-bold text-foreground">
          {settings.numPlayers}
        </div>
      </div>

      {/* Use Effect Cards */}
      <div className="flex items-center justify-between rounded-lg bg-muted px-4 py-3">
        <div>
          <span className="font-display text-sm font-semibold text-foreground">Use Effect Cards</span>
          <p className="font-body text-[11px] text-muted-foreground">7–K trigger special abilities when discarded</p>
        </div>
        <div className={`relative h-5 w-5 rounded-full border-2 ${settings.useEffectCards ? 'bg-primary border-primary' : 'border-muted-foreground'}`}>
          {settings.useEffectCards && <div className="absolute inset-0 flex items-center justify-center text-[10px] text-primary-foreground">✓</div>}
        </div>
      </div>

      {/* Matt's Pairs Rule */}
      <div className="flex items-center justify-between rounded-lg bg-muted px-4 py-3">
        <div>
          <span className="font-display text-sm font-semibold text-foreground">Matt&apos;s Pairs Rule</span>
          <p className="font-body text-[11px] text-muted-foreground">Discard matching rank pairs from your hand</p>
        </div>
        <div className={`relative h-5 w-5 rounded-full border-2 ${settings.mattsPairsRule ? 'bg-primary border-primary' : 'border-muted-foreground'}`}>
          {settings.mattsPairsRule && <div className="absolute inset-0 flex items-center justify-center text-[10px] text-primary-foreground">✓</div>}
        </div>
      </div>
    </motion.div>
  );
}
