'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useOnlineStore } from '@/store/onlineStore';
import { GameBoardLayout } from './GameBoardLayout';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { getInstruction } from './useGameInstruction';

export function OnlineGameBoard() {
  const store = useOnlineStore();
  const {
    players,
    currentPlayerIndex,
    myPlayerId,
    gamePhase,
    turnPhase,
    drawPile,
    discardPile,
    heldCard,
    settings,
    kabooCalled,
    kabooCallerIndex,
    showKabooAnnouncement,
    finalRoundTurnsLeft,
    turnLog,
    effectType,
    effectStep,
    showEffectOverlay,
    playMove,
    leaveGame,
  } = store;

  const [peekedCards] = useState<string[]>([]);
  const [selectedCards] = useState<string[]>([]);

  const isMyTurn = currentPlayerIndex === 0;

  const instruction = useMemo(() => getInstruction(store as any), [store]);

  useKeyboardShortcuts('online');

  // Turn timer countdown (visual only for now in online mode, backend handles actual timeout)
  const [turnTimeRemaining, setTurnTimeRemaining] = useState(30);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  
  useEffect(() => {
    setTurnTimeRemaining(parseInt(settings.turnTimer) || 30);
  }, [currentPlayerIndex, turnPhase]);

  useEffect(() => {
    if (isMyTurn && gamePhase === 'playing' && turnPhase !== 'effect') {
      timerRef.current = setInterval(() => {
        setTurnTimeRemaining(prev => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isMyTurn, gamePhase, turnPhase]);

  const handlePlayerCardClick = (cardId: string) => {
    if (gamePhase === 'initial_look') {
      playMove({ type: 'PEEK_OWN', cardIndex: getCardIndex(cardId, myPlayerId) });
    } else if (turnPhase === 'action' && isMyTurn) {
      playMove({ type: 'SWAP_WITH_OWN', ownCardIndex: getCardIndex(cardId, myPlayerId) });
    } else if (turnPhase === 'effect' && isMyTurn && effectType === 'peek_own') {
      playMove({ type: 'PEEK_OWN', cardIndex: getCardIndex(cardId, myPlayerId) });
    }
  };

  const handleOpponentCardClick = (cardId: string) => {
    const targetPlayer = players.find(p => p.cards.some(c => c.id === cardId));
    if (!targetPlayer) return;

    if (turnPhase === 'effect' && isMyTurn) {
      if (effectType === 'peek_opponent') {
        playMove({ 
          type: 'SPY_OPPONENT', 
          targetPlayerId: targetPlayer.id, 
          cardIndex: getCardIndex(cardId, targetPlayer.id) 
        });
      } else if (effectType === 'blind_swap' || effectType === 'semi_blind_swap' || effectType === 'full_vision_swap') {
        // This usually requires two cards. For now, we'll just send the target card.
        // The backend might expect a different payload for swaps.
        // Based on gameApi.ts: card1 and card2
        // We'll need local state to track the first card selected for a swap.
      }
    }
  };

  const getCardIndex = (cardId: string, playerId: string) => {
    const player = players.find(p => p.id === playerId);
    return player?.cards.findIndex(c => c.id === cardId) ?? 0;
  };

  const handleDrawClick = () => {
    if (isMyTurn && turnPhase === 'draw' && gamePhase === 'playing') {
      playMove({ type: 'DRAW_FROM_DECK' });
    }
  };

  const handleDrawFromDiscard = () => {
    if (isMyTurn && turnPhase === 'draw' && gamePhase === 'playing') {
      playMove({ type: 'DRAW_FROM_DISCARD' });
    }
  };

  const handleLeaveGame = () => {
    if (confirm('Are you sure you want to leave?')) {
      leaveGame();
    }
  };

  const [isPaused, setIsPaused] = useState(false);
  const isHost = players.find(p => p.id === myPlayerId)?.isHost ?? false;

  const handleEndTurn = () => {
    if (gamePhase === 'initial_look') {
      playMove({ type: 'READY_TO_PLAY' });
    } else if (isMyTurn && turnPhase === 'action') {
      // In online mode, discarding the drawn card ends the turn if not swapping
      playMove({ type: 'DISCARD_DRAWN' });
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
      effectPreviewCardIds={[]}
      effectTimeRemaining={0}
      settings={settings}
      turnTimeRemaining={turnTimeRemaining}
      kabooCalled={kabooCalled}
      kabooCallerIndex={kabooCallerIndex}
      showKabooAnnouncement={showKabooAnnouncement}
      finalRoundTurnsLeft={finalRoundTurnsLeft}
      tapState={null}
      showEffectOverlay={showEffectOverlay}
      instruction={instruction}
      roundNumber={1}
      turnLog={turnLog}
      flyingCards={[]}
      isPaused={isPaused}
      setIsPaused={setIsPaused}
      isHost={isHost}
      isOffline={false}
      onPlayerCardClick={handlePlayerCardClick}
      onOpponentCardClick={handleOpponentCardClick}
      onDrawClick={handleDrawClick}
      onDrawFromDiscard={handleDrawFromDiscard}
      onCallKaboo={() => playMove({ type: 'CALL_KABOO' })}
      onSwapCard={(cardId) => handlePlayerCardClick(cardId)}
      onDiscardHeldCard={() => playMove({ type: 'DISCARD_DRAWN' })}
      onDiscardPair={() => {}}
      onEndTurn={handleEndTurn}
      onLeaveGame={handleLeaveGame}
      onEndGame={() => {}}
      onDeclineEffect={() => {}}
      onConfirmEffect={() => {}} // Usually triggered by card selection
    />
  );
}
