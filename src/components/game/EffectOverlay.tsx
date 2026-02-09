import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { getEffectName, getEffectDescription } from '@/lib/cardUtils';
import { Button } from '@/components/ui/button';
import { KeyHint } from './KeyHint';

export function EffectOverlay() {
  const {
    showEffectOverlay,
    effectType,
    effectStep,
    selectedCards,
    effectPreviewCardIds,
    effectTimeRemaining,
    declineEffect,
    confirmEffect,
    players,
  } = useGameStore();

  if (!showEffectOverlay || !effectType) return null;

  const name = getEffectName(effectType);
  const description = getEffectDescription(effectType);

  const emoji =
    effectType === 'peek_own' ? '👁' :
    effectType === 'peek_opponent' ? '🔍' :
    effectType === 'blind_swap' ? '🔀' :
    effectType === 'semi_blind_swap' ? '🃏' :
    effectType === 'full_vision_swap' ? '👑' : '✨';

  // Step-specific instruction
  let instruction = '';
  let canConfirm = false;

  if (effectType === 'peek_own') {
    instruction = 'Tap one of your cards to look at it.';
  } else if (effectType === 'peek_opponent') {
    instruction = "Tap an opponent's card to look at it.";
  } else if (effectType === 'blind_swap') {
    instruction = `Select 2 cards to swap blindly. (${selectedCards.length}/2)`;
    canConfirm = selectedCards.length >= 2;
  } else if (effectType === 'semi_blind_swap') {
    if (effectStep === 'select') {
      instruction = "Select an opponent's card to reveal.";
    } else if (effectStep === 'preview') {
      instruction = selectedCards.length > 0
        ? 'Ready to swap! Confirm or skip.'
        : 'Card revealed! Select one of your cards to swap with, or skip.';
      canConfirm = selectedCards.length >= 1;
    }
  } else if (effectType === 'full_vision_swap') {
    if (effectStep === 'select') {
      // Validate selection state for guidance
      const ownCardIds = new Set(players[0]?.cards.map((c) => c.id) ?? []);
      const hasOwn = selectedCards.some((id) => ownCardIds.has(id));
      const hasOpponent = selectedCards.some((id) => !ownCardIds.has(id));

      if (selectedCards.length === 1) {
        instruction = hasOwn
          ? "Now select an opponent's card to reveal. (1/2)"
          : 'Now select one of your cards to reveal. (1/2)';
      } else if (selectedCards.length === 2 && (!hasOwn || !hasOpponent)) {
        instruction = 'Pick one of YOUR cards and one OPPONENT card. (1 own + 1 opponent)';
      } else {
        instruction = 'Select one of your cards and one opponent card to reveal. (0/2)';
      }
    } else if (effectStep === 'preview') {
      instruction = 'Cards revealed! Swap them, or skip?';
      canConfirm = true;
    }
  }

  const showDecline = effectType !== 'peek_own' && effectType !== 'peek_opponent';
  const isUrgent = effectTimeRemaining <= 3;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -60 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -60 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className="fixed left-4 right-4 top-14 z-40 mx-auto max-w-sm rounded-2xl border border-border bg-card/95 p-4 shadow-card backdrop-blur-md sm:p-4"
      >
        <div className="flex items-start gap-3">
          <span className="text-3xl">{emoji}</span>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-bold text-gradient-accent">
                {name}
              </h2>
              {/* Effect timer */}
              <span
                className={`font-display text-sm font-bold ${
                  isUrgent ? 'text-destructive animate-pulse' : 'text-muted-foreground'
                }`}
              >
                {effectTimeRemaining}s
              </span>
            </div>
            <p className="mt-0.5 font-body text-xs text-muted-foreground">
              {description}
            </p>
            <p className="mt-1 font-body text-xs font-semibold text-primary">
              {instruction}
            </p>
          </div>
        </div>

        {/* Preview indicator for semi/full vision */}
        {effectPreviewCardIds.length > 0 && (effectStep === 'preview') && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-2 rounded-lg bg-muted/50 px-3 py-1.5 text-center"
          >
            <span className="font-body text-xs text-foreground/80">
              {effectPreviewCardIds.length === 1 ? '1 card revealed' : `${effectPreviewCardIds.length} cards revealed`}
              {' — look at the board!'}
            </span>
          </motion.div>
        )}

        <div className="mt-3 flex gap-2">
          {canConfirm && (
            <Button
              onClick={confirmEffect}
              size="sm"
              className="flex-1 rounded-xl font-display font-bold gradient-primary text-primary-foreground glow-primary min-h-[2.75rem]"
            >
              ✓ Confirm Swap <KeyHint action="confirm" />
            </Button>
          )}
          {showDecline && (
            <Button
              onClick={declineEffect}
              variant="outline"
              size="sm"
              className="flex-1 rounded-xl font-display font-bold min-h-[2.75rem]"
            >
              Skip <KeyHint action="skip" />
            </Button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
