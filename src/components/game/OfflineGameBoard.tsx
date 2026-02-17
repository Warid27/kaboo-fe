'use client';

import { useEffect, useRef, useMemo, useState } from 'react';
import { GameBoardLayout } from './GameBoardLayout';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useOfflineGame } from '@/hooks/useOfflineGame';
import { getInstruction } from './useGameInstruction';

export function OfflineGameBoard() {
  const store = useOfflineGame();
  const {
    players,
    currentPlayerIndex,
    gamePhase,
    turnPhase,
    drawPile,
    discardPile,
    heldCard,
    peekedCards,
    selectedCards,
    settings,
    kabooCalled,
    kabooCallerIndex,
    showKabooAnnouncement,
    finalRoundTurnsLeft,
    tapState,
    roundNumber,
    turnLog,
    effectType,
    effectStep,
    effectPreviewCardIds,
    isPaused,
    setIsPaused,
    drawCard,
    drawFromDiscard,
    swapCard,
    discardHeldCard,
    callKaboo,
    endTurn,
    resetStore,
    peekCard,
    resolveEffect,
    readyToPlay,
    activateTap,
    confirmTapDiscard,
    skipTapSwap,
    finalizeTap,
    declineEffect,
    confirmEffect,
  } = store;

  const instruction = useMemo(() => getInstruction(store), [store]);

  useKeyboardShortcuts('offline');

  // Turn timer countdown
  const [turnTimeRemaining, setTurnTimeRemaining] = useState(30);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    setTurnTimeRemaining(parseInt(settings.turnTimer) || 30);
  }, [currentPlayerIndex, turnPhase]);

  useEffect(() => {
    if (currentPlayerIndex === 0 && gamePhase === 'playing' && turnPhase !== 'effect' && !tapState && !isPaused) {
      timerRef.current = setInterval(() => {
        setTurnTimeRemaining(prev => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentPlayerIndex, gamePhase, turnPhase, tapState, isPaused]);

  const handlePlayerCardClick = (cardId: string) => {
    if (gamePhase === 'initial_look') {
      peekCard(cardId);
    } else if (turnPhase === 'action' && currentPlayerIndex === 0) {
      swapCard(cardId);
    } else if (turnPhase === 'effect' && currentPlayerIndex === 0 && effectType === 'peek_own') {
      resolveEffect(cardId);
    }
  };

  const handleOpponentCardClick = (cardId: string) => {
    if (turnPhase === 'effect' && currentPlayerIndex === 0 && 
       (effectType === 'peek_opponent' || effectType === 'blind_swap' || effectType === 'semi_blind_swap' || effectType === 'full_vision_swap')) {
      resolveEffect(cardId);
    }
  };

  const handleDrawClick = () => {
    if (currentPlayerIndex === 0 && turnPhase === 'draw' && gamePhase === 'playing') {
      drawCard();
    }
  };

  const handleDrawFromDiscard = () => {
    if (currentPlayerIndex === 0 && turnPhase === 'draw' && gamePhase === 'playing') {
      drawFromDiscard();
    }
  };

  const handleLeaveGame = () => {
    if (confirm('Are you sure you want to leave?')) {
      resetStore();
    }
  };

  const handleEndTurn = () => {
    if (gamePhase === 'initial_look') {
      readyToPlay();
    } else {
      endTurn();
    }
  };

  return (
    <GameBoardLayout
      players={players}
      currentPlayerIndex={currentPlayerIndex}
      gamePhase={gamePhase}
      turnPhase={turnPhase}
      drawPile={drawPile}
      discardPile={discardPile}
      heldCard={heldCard}
      peekedCards={peekedCards}
      memorizedCards={[]}
      selectedCards={selectedCards}
      effectType={effectType}
      effectStep={effectStep}
      effectPreviewCardIds={effectPreviewCardIds}
      effectTimeRemaining={0}
      settings={settings}
      turnTimeRemaining={turnTimeRemaining}
      kabooCalled={kabooCalled}
      kabooCallerIndex={kabooCallerIndex}
      showKabooAnnouncement={showKabooAnnouncement}
      finalRoundTurnsLeft={finalRoundTurnsLeft}
      tapState={tapState}
      showEffectOverlay={!!effectType}
      instruction={instruction}
      roundNumber={roundNumber}
      turnLog={turnLog}
      isPaused={isPaused}
      setIsPaused={setIsPaused}
      isHost={true}
      isOffline={true}
      canUndo={false} // TODO: Add undo support for offline
      onPlayerCardClick={handlePlayerCardClick}
      onOpponentCardClick={handleOpponentCardClick}
      onDrawClick={handleDrawClick}
      onDrawFromDiscard={handleDrawFromDiscard}
      onCallKaboo={callKaboo}
      onSwapCard={swapCard}
      onDiscardHeldCard={discardHeldCard}
      onDiscardPair={() => {}}
      onEndTurn={handleEndTurn}
      onLeaveGame={handleLeaveGame}
      onEndGame={() => {}}
      onActivateTap={activateTap}
      onConfirmTapDiscard={confirmTapDiscard}
      onSkipTapSwap={skipTapSwap}
      onFinalizeTap={finalizeTap}
      onDeclineEffect={declineEffect}
      onConfirmEffect={confirmEffect}
    />
  );
}
