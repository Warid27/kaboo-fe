import { motion, AnimatePresence } from 'framer-motion';
import { Hand, RefreshCw } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import { Button } from '@/components/ui/button';
import { isRedSuit } from '@/lib/cardUtils';
import { cn } from '@/lib/utils';
import { SuitIcon } from './SuitIcon';
import { KeyHint } from './KeyHint';
import type { Card, Player, TapState } from '@/types/game';

export interface TapWindowProps {
  tapState?: TapState | null;
  discardPile?: Card[];
  players?: Player[];
  onActivateTap?: () => void;
  onConfirmTapDiscard?: () => void;
  onSkipTapSwap?: () => void;
  onFinalizeTap?: () => void;
}

export function TapWindow(props: TapWindowProps) {
  const store = useGameStore();
  
  const tapState = props.tapState ?? store.tapState;
  const discardPile = props.discardPile ?? store.discardPile;
  const players = props.players ?? store.players;

  const activateTap = props.onActivateTap ?? store.activateTap;
  const confirmTapDiscard = props.onConfirmTapDiscard ?? store.confirmTapDiscard;
  const skipTapSwap = props.onSkipTapSwap ?? store.skipTapSwap;
  const finalizeTap = props.onFinalizeTap ?? store.finalizeTap;

  if (!tapState) return null;

  const topDiscard = discardPile[discardPile.length - 1];
  const topIsRed = topDiscard ? isRedSuit(topDiscard.suit) : false;

  return (
    <AnimatePresence mode="wait">
      {/* Phase 1: TAP button */}
      {tapState.phase === 'window' && (
        <motion.div
          key="tap-window"
          initial={{ opacity: 0, scale: 2, x: '-50%' }}
          animate={{ opacity: 1, scale: 1, x: '-50%' }}
          exit={{ opacity: 0, scale: 0.5, x: '-50%' }}
          transition={{ type: 'spring', stiffness: 500, damping: 25 }}
          className="fixed bottom-1/3 left-1/2 z-50 flex flex-col items-center gap-2"
        >
          <motion.button
            onClick={activateTap}
            animate={{
              scale: [1, 1.1, 1],
              boxShadow: [
                '0 0 10px hsl(330 80% 58% / 0.3)',
                '0 0 30px hsl(330 80% 58% / 0.6)',
                '0 0 10px hsl(330 80% 58% / 0.3)',
              ],
            }}
            transition={{ duration: 0.6, repeat: Infinity }}
            className="rounded-2xl gradient-accent px-8 py-4 font-display text-2xl font-bold text-accent-foreground flex items-center gap-3"
          >
            TAP! <Hand className="h-8 w-8" /> <KeyHint action="tap" />
          </motion.button>
          {topDiscard && (
            <div className="flex items-center gap-1 rounded-full bg-card/90 px-3 py-1 backdrop-blur-sm border border-border/30">
              <span className="font-body text-xs text-muted-foreground">Match:</span>
              <span
                className={cn(
                  'font-display text-sm font-bold flex items-center gap-1',
                  topIsRed ? 'text-[hsl(var(--suit-red))]' : 'text-foreground',
                )}
              >
                {topDiscard.rank}
                <SuitIcon suit={topDiscard.suit} className="h-3.5 w-3.5" />
              </span>
            </div>
          )}
        </motion.div>
      )}

      {/* Phase 2: Select matching cards */}
      {tapState.phase === 'selecting' && (
        <motion.div
          key="tap-selecting"
          initial={{ opacity: 0, y: 20, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: 20, x: '-50%' }}
          className="fixed bottom-36 left-1/2 z-50 flex flex-col items-center gap-2"
        >
          <div className="rounded-xl bg-card/95 backdrop-blur-sm border border-border/30 px-6 py-3 text-center shadow-lg">
            <p className="font-display text-sm font-bold text-foreground flex items-center justify-center gap-1">
              Tap cards matching{' '}
              <span className={cn('flex items-center gap-0.5', topIsRed ? 'text-[hsl(var(--suit-red))]' : '')}>
                {topDiscard?.rank}
                {topDiscard && <SuitIcon suit={topDiscard.suit} className="h-3.5 w-3.5" />}
              </span>
            </p>
            <p className="font-body text-xs text-muted-foreground mt-0.5">
              {tapState.selectedCardIds.length} card(s) selected — from any player
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={confirmTapDiscard}
              disabled={tapState.selectedCardIds.length === 0}
              className="rounded-xl font-display text-sm font-bold gradient-primary text-primary-foreground glow-primary hover:brightness-110 transition-all disabled:opacity-40"
            >
              ✓ Confirm Tap <KeyHint action="confirm" />
            </Button>
            <Button
              onClick={finalizeTap}
              variant="outline"
              className="rounded-xl font-display text-sm font-bold"
            >
              Cancel <KeyHint action="skip" />
            </Button>
          </div>
        </motion.div>
      )}

      {/* Phase 3: Swap privilege */}
      {tapState.phase === 'swapping' && (
        <motion.div
          key="tap-swapping"
          initial={{ opacity: 0, y: 20, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: 20, x: '-50%' }}
          className="fixed bottom-36 left-1/2 z-50 flex flex-col items-center gap-2"
        >
          <div className="rounded-xl bg-card/95 backdrop-blur-sm border border-border/30 px-6 py-3 text-center shadow-lg">
            <p className="font-display text-sm font-bold text-foreground flex items-center justify-center gap-2">
              <RefreshCw className="h-4 w-4" /> Swap Privilege!
            </p>
            <p className="font-body text-xs text-muted-foreground mt-0.5">
              Select your card to place in{' '}
              <span className="font-semibold text-foreground">
                {players[tapState.swapTargets[0]]?.name ?? 'opponent'}&apos;s
              </span>{' '}
              hand ({tapState.swapsRemaining} left)
            </p>
          </div>
          <Button
            onClick={skipTapSwap}
            variant="outline"
            className="rounded-xl font-display text-sm font-bold"
          >
            Skip Swaps <KeyHint action="skip" />
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
