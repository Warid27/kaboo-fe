import { useGameStore } from '@/store/gameStore';

export function useGameInstruction(): string {
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
      return `TAP if you have a matching ${topDiscard?.rank ?? ''} card! 🫳`;
    }
    if (tapState.phase === 'selecting') {
      const topDiscard = discardPile[discardPile.length - 1];
      return `Select cards matching ${topDiscard?.rank ?? '?'} — then confirm 🎯`;
    }
    if (tapState.phase === 'swapping') {
      return `Select your card to give to opponent (${tapState.swapsRemaining} left) 🔄`;
    }
  }

  if (gamePhase === 'dealing') return 'Dealing cards...';

  if (gamePhase === 'initial_look') {
    return `Peek at your cards! (${useGameStore.getState().initialLooksRemaining} looks left)`;
  }

  if (!isPlayerTurn) {
    return `${players[currentPlayerIndex]?.name}'s turn...`;
  }

  if (turnPhase === 'draw') return 'Draw a card from the pile ⬆';

  if (turnPhase === 'action') {
    return heldCard ? 'Tap a card to select it, then Swap — or Discard' : 'Choose an action';
  }

  if (turnPhase === 'effect') {
    if (effectType === 'peek_own') return 'Tap one of your cards to peek 👁';
    if (effectType === 'peek_opponent') return "Tap an opponent's card to peek 🔍";
    if (effectType === 'blind_swap') return `Select 2 cards to swap blindly (${selectedCards.length}/2) 🔀`;
    if (effectType === 'semi_blind_swap') {
      return effectStep === 'select'
        ? "Select an opponent's card to reveal 🃏"
        : 'Select your card to swap with, or skip';
    }
    if (effectType === 'full_vision_swap') {
      return effectStep === 'select'
        ? `Select 2 cards to reveal (${selectedCards.length}/2) 👑`
        : 'Swap these cards, or skip?';
    }
  }

  if (turnPhase === 'end_turn') return 'Tap End Turn to continue ↓';

  return '';
}
