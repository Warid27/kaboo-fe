import { ReactNode } from 'react';
import { useGameStore } from '@/store/gameStore';
import { Hand, Target, RefreshCw, ArrowUp, Eye, Search, Shuffle, ScanEye, Crown, ArrowDown } from 'lucide-react';

export interface GameInstruction {
  id: string;
  content: ReactNode;
}

export function useGameInstruction(): GameInstruction | null {
  const {
    gamePhase,
    turnPhase,
    currentPlayerIndex,
    players,
    heldCard,
    effectType,
    effectStep,
    selectedCards,
    tapState,
    discardPile,
  } = useGameStore();

  const isPlayerTurn = currentPlayerIndex === 0;

  // Tap state overrides all other instructions
  if (tapState) {
    if (tapState.phase === 'window') {
      const topDiscard = discardPile[discardPile.length - 1];
      return {
        id: 'tap-window',
        content: (
          <span className="flex items-center justify-center gap-1.5">
            TAP if you have a matching {topDiscard?.rank ?? ''} card! <Hand className="h-4 w-4" />
          </span>
        ),
      };
    }
    if (tapState.phase === 'selecting') {
      const topDiscard = discardPile[discardPile.length - 1];
      return {
        id: 'tap-selecting',
        content: (
          <span className="flex items-center justify-center gap-1.5">
            Select cards matching {topDiscard?.rank ?? '?'} — then confirm <Target className="h-4 w-4" />
          </span>
        ),
      };
    }
    if (tapState.phase === 'swapping') {
      return {
        id: 'tap-swapping',
        content: (
          <span className="flex items-center justify-center gap-1.5">
            Select your card to give to opponent ({tapState.swapsRemaining} left) <RefreshCw className="h-4 w-4" />
          </span>
        ),
      };
    }
  }

  if (gamePhase === 'dealing') return { id: 'dealing', content: 'Dealing cards...' };

  if (gamePhase === 'initial_look') {
    return {
      id: 'initial-look',
      content: `Peek at your cards! (${useGameStore.getState().initialLooksRemaining} looks left)`,
    };
  }

  if (!isPlayerTurn) {
    return {
      id: `opponent-turn-${currentPlayerIndex}`,
      content: `${players[currentPlayerIndex]?.name}'s turn...`,
    };
  }

  if (turnPhase === 'draw') {
    return {
      id: 'draw',
      content: (
        <span className="flex items-center justify-center gap-1.5">
          Draw a card from the pile <ArrowUp className="h-4 w-4" />
        </span>
      ),
    };
  }

  if (turnPhase === 'action') {
    return heldCard
      ? { id: 'action-held', content: 'Tap a card to select it, then Swap — or Discard' }
      : { id: 'action-choose', content: 'Choose an action' };
  }

  if (turnPhase === 'effect') {
    if (effectType === 'peek_own') {
      return {
        id: 'peek-own',
        content: (
          <span className="flex items-center justify-center gap-1.5">
            Tap one of your cards to peek <Eye className="h-4 w-4" />
          </span>
        ),
      };
    }
    if (effectType === 'peek_opponent') {
      return {
        id: 'peek-opponent',
        content: (
          <span className="flex items-center justify-center gap-1.5">
            Tap an opponent's card to peek <Search className="h-4 w-4" />
          </span>
        ),
      };
    }
    if (effectType === 'blind_swap') {
      return {
        id: 'blind-swap',
        content: (
          <span className="flex items-center justify-center gap-1.5">
            Select 2 cards to swap blindly ({selectedCards.length}/2) <Shuffle className="h-4 w-4" />
          </span>
        ),
      };
    }
    if (effectType === 'semi_blind_swap') {
      return effectStep === 'select'
        ? {
            id: 'semi-blind-swap-select',
            content: (
              <span className="flex items-center justify-center gap-1.5">
                Select an opponent's card to reveal <ScanEye className="h-4 w-4" />
              </span>
            ),
          }
        : { id: 'semi-blind-swap-action', content: 'Select your card to swap with, or skip' };
    }
    if (effectType === 'full_vision_swap') {
      return effectStep === 'select'
        ? {
            id: 'full-vision-swap-select',
            content: (
              <span className="flex items-center justify-center gap-1.5">
                Select 2 cards to reveal ({selectedCards.length}/2) <Crown className="h-4 w-4" />
              </span>
            ),
          }
        : { id: 'full-vision-swap-action', content: 'Swap these cards, or skip?' };
    }
  }

  if (turnPhase === 'end_turn') {
    return {
      id: 'end-turn',
      content: (
        <span className="flex items-center justify-center gap-1.5">
          Tap End Turn to continue <ArrowDown className="h-4 w-4" />
        </span>
      ),
    };
  }

  return null;
}
