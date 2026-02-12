'use client';

import { useEffect, useRef } from 'react';
import { useGameStore } from '@/store/gameStore';
import { GameBoardLayout } from './GameBoardLayout';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useGameInstruction } from './useGameInstruction';

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
    effectTimeRemaining,
    settings,
    turnTimeRemaining,
    kabooCalled,
    kabooCallerIndex,
    showKabooAnnouncement,
    finalRoundTurnsLeft,
    tapState,
    showEffectOverlay,
    roundNumber,
    turnLog,
    flyingCards,
    drawCard,
    drawFromDiscard,
    peekCard,
    selectCard,
    resolveEffect,
    tapSelectCard,
    tapSwapCard,
    isPaused,
    callKaboo,
    swapCard,
    discardHeldCard,
    discardPair,
    endTurn,
    checkGameState,
    backToLobby,
    endGame,
  } = useGameStore();

  const instruction = useGameInstruction();
  useKeyboardShortcuts();

  // Polling for game state updates (especially for being kicked)
  useEffect(() => {
    const { gameMode } = useGameStore.getState();
    if (gameMode === 'offline') return;
    
    // Initial check
    checkGameState();

    const interval = setInterval(() => {
        checkGameState();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [checkGameState]);

  // Turn timer countdown (pauses during effects)
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  useEffect(() => {
    if (currentPlayerIndex === 0 && gamePhase === 'playing' && turnPhase !== 'effect' && !tapState && !isPaused) {
      timerRef.current = setInterval(() => {
        useGameStore.setState((state) => ({
          turnTimeRemaining: Math.max(0, state.turnTimeRemaining - 1),
        }));
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentPlayerIndex, gamePhase, turnPhase, tapState, isPaused]);

  // Effect timer countdown — auto-declines when it reaches 0
  const effectTimerRef = useRef<ReturnType<typeof setInterval>>();
  useEffect(() => {
    if (currentPlayerIndex === 0 && turnPhase === 'effect' && !isPaused) {
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
  }, [currentPlayerIndex, turnPhase, isPaused]);

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
    } else if (turnPhase === 'action' && currentPlayerIndex === 0) {
      selectCard(cardId);
    } else if (turnPhase === 'effect' && currentPlayerIndex === 0) {
      resolveEffect(cardId);
    }
  };

  const handleOpponentCardClick = (cardId: string) => {
    if (tapState?.phase === 'selecting') {
      tapSelectCard(cardId);
      return;
    }
    if (turnPhase === 'effect' && currentPlayerIndex === 0) {
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
      backToLobby();
    }
  };

  const handleEndGame = () => {
    if (confirm('Are you sure you want to end the game for everyone?')) {
      endGame();
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
      memorizedCards={memorizedCards}
      selectedCards={selectedCards}
      effectType={effectType}
      effectStep={effectStep}
      effectPreviewCardIds={effectPreviewCardIds}
      effectTimeRemaining={effectTimeRemaining}
      settings={settings}
      turnTimeRemaining={turnTimeRemaining}
      kabooCalled={kabooCalled}
      kabooCallerIndex={kabooCallerIndex}
      showKabooAnnouncement={showKabooAnnouncement}
      finalRoundTurnsLeft={finalRoundTurnsLeft}
      tapState={tapState}
      showEffectOverlay={showEffectOverlay}
      instruction={instruction}
      roundNumber={roundNumber}
      turnLog={turnLog}
      flyingCards={flyingCards}
      onPlayerCardClick={handlePlayerCardClick}
      onOpponentCardClick={handleOpponentCardClick}
      onDrawClick={handleDrawClick}
      onDrawFromDiscard={handleDrawFromDiscard}
      onCallKaboo={callKaboo}
      onSwapCard={swapCard}
      onDiscardHeldCard={discardHeldCard}
      onDiscardPair={discardPair}
      onEndTurn={endTurn}
      onLeaveGame={handleLeaveGame}
      onEndGame={handleEndGame}
    />
  );
}
