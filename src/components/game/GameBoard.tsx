'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { useDevStore } from '@/store/devStore';
import { PlayerHand } from './PlayerHand';
import { OpponentHand } from './OpponentHand';
import { DrawPile } from './DrawPile';
import { DiscardPile } from './DiscardPile';
import { HeldCard } from './HeldCard';
import { TurnTimer } from './TurnTimer';
import { ActionButtons } from './ActionButtons';
import { EffectOverlay } from './EffectOverlay';
import { TapWindow } from './TapWindow';
import { KabooAnnouncement } from './KabooAnnouncement';
import { TurnLog } from './TurnLog';
import { FlyingCardLayer } from './FlyingCardLayer';
import { useGameInstruction } from './useGameInstruction';
import { OptionsMenu } from './OptionsMenu';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { DevTools } from './DevTools';
import { useAnimationConfig } from '@/hooks/useAnimationConfig';

const OPPONENT_POSITIONS = [
  ['top'],
  ['top-left', 'top-right'],
  ['left', 'top', 'right'],
  ['top-left', 'top', 'top-right', 'right'],
  ['top-left', 'top', 'top-right', 'right', 'left'],
  ['top-left', 'top', 'top-right', 'right', 'bottom-right', 'left'],
  ['top-left', 'top', 'top-right', 'right', 'bottom-right', 'bottom-left', 'left'],
] as const;

export function GameBoard() {
  const {
    players,
    currentPlayerIndex,
    gamePhase,
    turnPhase,
    drawPile,
    discardPile,
    heldCard,
    peekedCards,
    memorizedCards,
    selectedCards,
    effectType,
    effectStep,
    effectPreviewCardIds,
    settings,
    turnTimeRemaining,
    kabooCalled,
    finalRoundTurnsLeft,
    tapState,
    drawCard,
    peekCard,
    selectCard,
    resolveEffect,
    tapSelectCard,
    tapSwapCard,
    isPaused,
    roundNumber,
  } = useGameStore();

  const instruction = useGameInstruction();
  useKeyboardShortcuts();
  const anim = useAnimationConfig();

  const { cardScale, pileOffsetX, pileOffsetY, handGap, playerOffsetX, playerOffsetY } = useDevStore();

  const currentPlayer = players[0]; // Human player is always index 0
  const opponents = players.slice(1);
  const isPlayerTurn = currentPlayerIndex === 0;
  const positions = opponents.length > 0 ? OPPONENT_POSITIONS[Math.min(opponents.length - 1, 6)] : [];

  // Merge tap selections with regular selections for visual highlighting
  const effectiveSelectedCards = [
    ...selectedCards,
    ...(tapState?.selectedCardIds ?? []),
  ];

  // Turn timer countdown (pauses during effects)
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  useEffect(() => {
    if (isPlayerTurn && gamePhase === 'playing' && turnPhase !== 'effect' && !tapState && !isPaused) {
      timerRef.current = setInterval(() => {
        useGameStore.setState((state) => ({
          turnTimeRemaining: Math.max(0, state.turnTimeRemaining - 1),
        }));
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlayerTurn, gamePhase, turnPhase, tapState, isPaused]);

  // Effect timer countdown — auto-declines when it reaches 0
  const effectTimerRef = useRef<ReturnType<typeof setInterval>>();
  useEffect(() => {
    if (isPlayerTurn && turnPhase === 'effect' && !isPaused) {
      effectTimerRef.current = setInterval(() => {
        const remaining = useGameStore.getState().effectTimeRemaining;
        if (remaining <= 0) {
          useGameStore.getState().declineEffect();
        } else {
          useGameStore.setState({ effectTimeRemaining: remaining - 1 });
        }
      }, 1000);
    }
    return () => {
      if (effectTimerRef.current) clearInterval(effectTimerRef.current);
    };
  }, [isPlayerTurn, turnPhase, isPaused]);

  // Handle card clicks based on current phase
  const handlePlayerCardClick = (cardId: string) => {
    if (tapState?.phase === 'selecting') {
      tapSelectCard(cardId);
      return;
    }
    if (tapState?.phase === 'swapping') {
      tapSwapCard(cardId);
      return;
    }
    if (gamePhase === 'initial_look') {
      peekCard(cardId);
    } else if (turnPhase === 'action' && isPlayerTurn) {
      selectCard(cardId);
    } else if (turnPhase === 'effect' && isPlayerTurn) {
      resolveEffect(cardId);
    }
  };

  const handleOpponentCardClick = (cardId: string) => {
    if (tapState?.phase === 'selecting') {
      tapSelectCard(cardId);
      return;
    }
    if (turnPhase === 'effect' && isPlayerTurn) {
      resolveEffect(cardId);
    }
  };

  const handleDrawClick = () => {
    if (isPlayerTurn && turnPhase === 'draw' && gamePhase === 'playing') {
      drawCard();
    }
  };


  return (
    <div className="relative flex h-screen max-h-screen flex-col overflow-hidden bg-background touch-manipulation select-none">
      {/* Top bar */}
      <div className="flex shrink-0 items-center justify-between px-4 py-1">
        <div className="flex items-center gap-2">
          <span className="font-display text-sm font-bold text-primary">KABOO</span>
          {roundNumber > 1 && (
            <span className="rounded-full bg-muted px-2 py-0.5 font-display text-xs font-bold text-muted-foreground">
              R{roundNumber}
            </span>
          )}
          {kabooCalled && (
            <motion.span
              initial={anim.initial({ scale: 0 })}
              animate={{ scale: 1 }}
              className="rounded-full bg-destructive/20 px-2 py-0.5 font-display text-xs font-bold text-destructive"
            >
              FINAL ROUND • {finalRoundTurnsLeft} left
            </motion.span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isPlayerTurn && gamePhase === 'playing' && (
            <TurnTimer
              timeRemaining={turnTimeRemaining}
              maxTime={parseInt(settings.turnTimer)}
              isActive={isPlayerTurn}
            />
          )}
          <OptionsMenu />
        </div>
      </div>

      {/* Instruction banner */}
      <AnimatePresence mode="wait">
        <motion.div
          key={instruction}
          initial={anim.initial({ opacity: 0, y: -10 })}
          animate={{ opacity: 1, y: 0 }}
          exit={anim.enabled ? { opacity: 0, y: 10 } : undefined}
          transition={anim.fade}
          className="shrink-0 px-4 py-0.5 text-center"
        >
          <span className="font-body text-sm font-semibold text-muted-foreground">
            {instruction}
          </span>
        </motion.div>
      </AnimatePresence>

      {/* Game table area — fills remaining space */}
      <div className="relative flex min-h-0 flex-1 items-center justify-center p-4">
        {/* Table surface */}
        <div
          className="relative h-full w-full max-w-6xl"
          style={{
            transform: `scale(${cardScale})`,
            transformOrigin: 'center center',
          }}
        >
          {/* Opponents */}
          {opponents.map((opponent, i) => (
            <OpponentHand
              key={opponent.id}
              player={opponent}
              isCurrentTurn={currentPlayerIndex === i + 1}
              selectedCards={effectiveSelectedCards}
              peekedCards={[...peekedCards, ...effectPreviewCardIds]}
              highlightAll={
                (isPlayerTurn &&
                turnPhase === 'effect' &&
                (
                  effectType === 'peek_opponent' ||
                  effectType === 'blind_swap' ||
                  (effectType === 'semi_blind_swap' && effectStep === 'select') ||
                  (effectType === 'full_vision_swap' && effectStep === 'select')
                )) ||
                tapState?.phase === 'selecting'
              }
              onCardClick={handleOpponentCardClick}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              position={positions[i] as any}
            />
          ))}

          {/* Center: Draw pile + Discard pile — 3D perspective container */}
          <div
            className="absolute left-1/2 top-1/2 z-20 flex -translate-x-1/2 -translate-y-1/2 items-end gap-10"
            style={{
              perspective: '1000px',
              transformStyle: 'preserve-3d',
              transform: `translate(calc(-50% + ${pileOffsetX}px), calc(-50% + ${pileOffsetY}px))`,
            }}
          >
            <DrawPile
              cardsRemaining={drawPile.length}
              isHighlighted={isPlayerTurn && turnPhase === 'draw' && gamePhase === 'playing'}
              onClick={handleDrawClick}
            />
            <DiscardPile cards={discardPile} />
          </div>

          {/* Held card — positioned above center, with a clear background to avoid overlap confusion */}
          {heldCard && (
            <div data-card-anchor="held-card" className="absolute left-1/2 top-[20%] z-30 -translate-x-1/2">
              <HeldCard card={heldCard} />
            </div>
          )}
        </div>
      </div>

      {/* Player's hand at bottom */}
      <div
        className="flex shrink-0 flex-col items-center gap-2 px-4 pb-3"
        style={{
          transform: `translate(${playerOffsetX}px, ${playerOffsetY}px)`,
        }}
      >
        {currentPlayer && (
          <>
            <div className="flex items-center gap-2">
              <div
                className="h-5 w-5 rounded-full flex items-center justify-center font-display text-[10px] font-bold text-primary-foreground"
                style={{ backgroundColor: currentPlayer.avatarColor }}
              >
                {currentPlayer.name.charAt(0)}
              </div>
              <span className="font-body text-xs font-semibold text-foreground">
                {currentPlayer.name}
              </span>
              {isPlayerTurn && (
                <motion.div
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="h-2 w-2 rounded-full bg-primary"
                />
              )}
            </div>

            <PlayerHand
              cards={currentPlayer.cards}
              peekedCards={[...peekedCards, ...effectPreviewCardIds]}
              memorizedCards={memorizedCards}
              selectedCards={effectiveSelectedCards}
              highlightAll={
                (gamePhase === 'initial_look') ||
                (isPlayerTurn && turnPhase === 'action') ||
                (isPlayerTurn && turnPhase === 'effect' && effectType === 'peek_own') ||
                (isPlayerTurn && turnPhase === 'effect' && effectType === 'blind_swap') ||
                (isPlayerTurn && turnPhase === 'effect' && effectType === 'semi_blind_swap' && effectStep === 'preview') ||
                (isPlayerTurn && turnPhase === 'effect' && effectType === 'full_vision_swap' && effectStep === 'select') ||
                tapState?.phase === 'selecting' ||
                tapState?.phase === 'swapping'
              }
              onCardClick={handlePlayerCardClick}
              handGap={handGap}
            />

            <ActionButtons />
          </>
        )}
      </div>

      {/* Overlays */}
      <EffectOverlay />
      <TapWindow />
      <KabooAnnouncement />
      <TurnLog />
      <FlyingCardLayer />
      <DevTools />
    </div>
  );
}
