'use client';

import { motion, AnimatePresence } from 'framer-motion';
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
import { OptionsMenu } from './OptionsMenu';
import { DevTools } from './DevTools';
import { useAnimationConfig } from '@/hooks/useAnimationConfig';
import { useDevStore } from '@/store/devStore';
import { GameInstruction } from './useGameInstruction';
import type { Player, Card, GamePhase, TurnPhase, EffectType, GameSettings, TurnLogEntry, TapState } from '@/types/game';
import type { FlyingCardEntry } from '@/store/gameStore';

const OPPONENT_POSITIONS = [
  ['top'],
  ['top-left', 'top-right'],
  ['left', 'top', 'right'],
  ['left', 'top', 'top-right', 'right'],
  ['top-left', 'top', 'top-right', 'right', 'left'],
  ['top-left', 'top', 'top-right', 'right', 'bottom-right', 'left'],
  ['top-left', 'top', 'top-right', 'right', 'bottom-right', 'bottom-left', 'left'],
] as const;

export interface GameBoardLayoutProps {
  players: Player[];
  currentPlayerIndex: number;
  gamePhase: GamePhase;
  turnPhase: TurnPhase;
  drawPile: Card[];
  discardPile: Card[];
  heldCard: Card | null;
  peekedCards: string[];
  memorizedCards: string[];
  selectedCards: string[];
  effectType: EffectType;
  effectStep: 'select' | 'preview' | 'resolve' | null;
  effectPreviewCardIds: string[];
  effectTimeRemaining?: number;
  settings: GameSettings;
  turnTimeRemaining: number;
  kabooCalled: boolean;
  kabooCallerIndex?: number | null;
  showKabooAnnouncement?: boolean;
  finalRoundTurnsLeft: number | null;
  tapState: TapState | null;
  showEffectOverlay?: boolean;
  instruction: GameInstruction | null;
  roundNumber: number;
  turnLog?: TurnLogEntry[];
  flyingCards?: FlyingCardEntry[];
  onPlayerCardClick: (cardId: string) => void;
  onOpponentCardClick: (cardId: string) => void;
  onDrawClick: () => void;
  onDrawFromDiscard?: () => void;
  onCallKaboo?: () => void;
  onSwapCard?: (cardId: string) => void;
  onDiscardHeldCard?: () => void;
  onDiscardPair?: (cardId1: string, cardId2: string) => void;
  onEndTurn?: () => void;
  onLeaveGame?: () => void;
  onEndGame?: () => void;
}

export function GameBoardLayout({
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
  effectTimeRemaining,
  settings,
  turnTimeRemaining,
  kabooCalled,
  kabooCallerIndex,
  showKabooAnnouncement,
  finalRoundTurnsLeft,
  tapState,
  showEffectOverlay,
  instruction,
  roundNumber,
  turnLog,
  flyingCards,
  onPlayerCardClick,
  onOpponentCardClick,
  onDrawClick,
  onDrawFromDiscard,
  onCallKaboo,
  onSwapCard,
  onDiscardHeldCard,
  onDiscardPair,
  onEndTurn,
  onLeaveGame,
  onEndGame,
}: GameBoardLayoutProps) {
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
          <OptionsMenu 
            onLeave={onLeaveGame} 
            onEndGame={onEndGame} 
          />
        </div>
      </div>

      {/* Instruction banner */}
      <AnimatePresence mode="wait">
        {instruction && (
          <motion.div
            key={instruction.id}
            initial={anim.initial({ opacity: 0, y: -10 })}
            animate={{ opacity: 1, y: 0 }}
            exit={anim.enabled ? { opacity: 0, y: 10 } : undefined}
            transition={anim.fade}
            className="shrink-0 px-4 py-0.5 text-center"
          >
            <span className="font-body text-sm font-semibold text-muted-foreground">
              {instruction.content}
            </span>
          </motion.div>
        )}
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
              onCardClick={onOpponentCardClick}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              position={positions[i] as any}
            />
          ))}

          {/* Center: Draw pile + Discard pile */}
          <div
            className="absolute left-1/2 top-2/3 z-20 flex -translate-x-[80%] -translate-y-1/2 items-end gap-32"
            style={{
              marginLeft: pileOffsetX,
              marginTop: pileOffsetY,
            }}
          >
            <DrawPile
              cardsRemaining={drawPile.length}
              isHighlighted={isPlayerTurn && turnPhase === 'draw' && gamePhase === 'playing'}
              onClick={onDrawClick}
            />
            <DiscardPile 
                cards={discardPile} 
                onClick={onDrawFromDiscard}
                isHighlighted={isPlayerTurn && turnPhase === 'draw' && gamePhase === 'playing'}
            />
          </div>

          {/* Held card — positioned above center, with a clear background to avoid overlap confusion */}
          {heldCard && (
            <div data-card-anchor="held-card" className="absolute left-1/3 top-1/2 z-30 -translate-x-1/2">
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
              peekedCards={[
                ...peekedCards,
                ...effectPreviewCardIds,
              ]}
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
              onCardClick={onPlayerCardClick}
              handGap={handGap}
            />

            <ActionButtons 
              turnPhase={turnPhase}
              gamePhase={gamePhase}
              heldCard={heldCard}
              currentPlayerIndex={currentPlayerIndex}
              kabooCalled={kabooCalled}
              selectedCards={selectedCards}
              tapState={tapState}
              players={players}
              settings={settings}
              onCallKaboo={onCallKaboo}
              onSwapCard={onSwapCard}
              onDiscardHeldCard={onDiscardHeldCard}
              onDiscardPair={onDiscardPair}
              onEndTurn={onEndTurn}
            />
          </>
        )}
      </div>

      {/* Overlays */}
      <EffectOverlay 
        showEffectOverlay={showEffectOverlay}
        effectType={effectType}
        effectStep={effectStep}
        selectedCards={selectedCards}
        effectPreviewCardIds={effectPreviewCardIds}
        effectTimeRemaining={effectTimeRemaining}
        players={players}
      />
      <TapWindow 
        tapState={tapState}
        discardPile={discardPile}
        players={players}
      />
      <KabooAnnouncement 
        showKabooAnnouncement={showKabooAnnouncement}
        kabooCallerIndex={kabooCallerIndex}
        players={players}
      />
      <TurnLog turnLog={turnLog} />
      <FlyingCardLayer flyingCards={flyingCards} />
      <DevTools />
    </div>
  );
}
