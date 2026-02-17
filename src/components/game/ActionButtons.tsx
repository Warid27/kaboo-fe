import { motion, AnimatePresence } from 'framer-motion';
import { Flame, RefreshCw, Trash2, Layers, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { KeyHint } from './KeyHint';

import type { Player, GamePhase, TurnPhase, Card, GameSettings, TapState } from '@/types/game';

export interface ActionButtonsProps {
  turnPhase: TurnPhase;
  gamePhase: GamePhase;
  heldCard: Card | null;
  currentPlayerIndex: number;
  kabooCalled: boolean;
  selectedCards: string[];
  tapState: TapState | null;
  players: Player[];
  settings: GameSettings;
  onCallKaboo: () => void;
  onSwapCard: (cardId: string) => void;
  onDiscardHeldCard: () => void;
  onDiscardPair: (cardId1: string, cardId2: string) => void;
  onEndTurn: () => void;
  onReady: () => void;
}

export function ActionButtons(props: ActionButtonsProps) {
  const {
    turnPhase,
    gamePhase,
    heldCard,
    currentPlayerIndex,
    kabooCalled,
    selectedCards,
    tapState,
    players,
    settings,
    onCallKaboo: callKaboo,
    onSwapCard: swapCard,
    onDiscardHeldCard: discardHeldCard,
    onDiscardPair: discardPair,
    onEndTurn: endTurn,
    onReady: readyToPlay,
  } = props;

  const isPlayerTurn = currentPlayerIndex === 0;
  if ((!isPlayerTurn && gamePhase !== 'initial_look') || tapState) return null;

  // Check for valid pair (Matt's Pairs Rule)
  const canDiscardPair = settings.mattsPairsRule && turnPhase === 'action' && heldCard && selectedCards.length === 2 && (() => {
    const player = players[0];
    const card1 = player?.cards.find((c) => c.id === selectedCards[0]);
    const card2 = player?.cards.find((c) => c.id === selectedCards[1]);
    return card1 && card2 && card1.rank === card2.rank;
  })();

  // Check if current player is ready
  const isReady = players[0]?.isReady;

  return (
    <AnimatePresence mode="wait">
      {/* Initial Look - Ready Button */}
      {gamePhase === 'initial_look' && (
        <motion.div
          key="ready-container"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          className="mb-2"
        >
          {isReady ? (
            <div className="h-12 w-full flex items-center justify-center rounded-xl font-display text-lg font-bold bg-muted text-muted-foreground border-2 border-dashed border-muted-foreground/30 animate-pulse">
              <RefreshCw className="mr-2 h-5 w-5 animate-spin" /> Waiting for others...
            </div>
          ) : (
            <Button
              onClick={() => {
                readyToPlay();
              }}
              className="h-12 w-full rounded-xl font-display text-lg font-bold gradient-success text-primary-foreground glow-success hover:brightness-110 transition-all sm:h-12 min-h-[3rem]"
            >
              <Check className="mr-2 h-5 w-5" /> I&apos;m Ready
            </Button>
          )}
        </motion.div>
      )}

      {/* KABOO Button - available at start of turn during draw phase */}
      {gamePhase === 'playing' && turnPhase === 'draw' && !kabooCalled && (
        <motion.div
          key="kaboo"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          className="mb-2"
        >
          <Button
            onClick={() => callKaboo()}
            className="h-12 w-full rounded-xl font-display text-lg font-bold gradient-gold text-primary-foreground glow-gold hover:brightness-110 transition-all sm:h-12 min-h-[3rem]"
          >
            <Flame className="mr-2 h-5 w-5 fill-current" /> Call KABOO! <KeyHint action="kaboo" />
          </Button>
        </motion.div>
      )}

      {/* Action Phase - Swap or Discard */}
      {turnPhase === 'action' && heldCard && (
        <motion.div
          key="actions"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="flex flex-col gap-2"
        >
          <div className="flex gap-3">
            <Button
              onClick={() => {
                if (selectedCards.length > 0) {
                  swapCard(selectedCards[0]);
                }
              }}
              disabled={selectedCards.length === 0}
              className="flex-1 h-12 rounded-xl font-display text-base font-bold gradient-primary text-primary-foreground glow-primary hover:brightness-110 transition-all disabled:opacity-40 min-h-[3rem]"
            >
              <RefreshCw className="mr-2 h-4 w-4" /> Swap <KeyHint action="swap" />
            </Button>
            <Button
              onClick={discardHeldCard}
              className="flex-1 h-12 rounded-xl font-display text-base font-bold gradient-accent text-accent-foreground glow-accent hover:brightness-110 transition-all min-h-[3rem]"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Discard <KeyHint action="discard" />
            </Button>
          </div>

          {/* Discard Pair button (Matt's Pairs Rule) */}
          {canDiscardPair && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Button
                onClick={() => discardPair(selectedCards[0], selectedCards[1])}
                className="w-full h-12 rounded-xl font-display text-base font-bold bg-secondary text-secondary-foreground hover:bg-secondary/90 transition-all min-h-[3rem]"
              >
                <Layers className="mr-2 h-4 w-4" /> Discard Pair
              </Button>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* End Turn */}
      {turnPhase === 'end_turn' && (
        <motion.div
          key="end-turn"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
        >
          <Button
            onClick={endTurn}
            className="h-12 w-full rounded-xl font-display text-base font-bold bg-muted text-foreground hover:bg-muted/80 transition-all min-h-[3rem]"
          >
            <Check className="mr-2 h-4 w-4" /> End Turn <KeyHint action="endTurn" />
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
