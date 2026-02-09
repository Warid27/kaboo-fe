import type { GameStore } from './gameStore';
import type { StateSnapshot } from './replayStore';

export function captureSnapshot(state: GameStore): StateSnapshot {
  return {
    players: state.players.map((p) => ({ ...p, cards: [...p.cards] })),
    drawPile: [...state.drawPile],
    discardPile: [...state.discardPile],
    heldCard: state.heldCard ? { ...state.heldCard } : null,
    gamePhase: state.gamePhase,
    turnPhase: state.turnPhase,
    currentPlayerIndex: state.currentPlayerIndex,
    effectType: state.effectType,
    kabooCalled: state.kabooCalled,
    kabooCallerIndex: state.kabooCallerIndex,
    finalRoundTurnsLeft: state.finalRoundTurnsLeft,
    selectedCards: [...state.selectedCards],
    peekedCards: [...state.peekedCards],
    memorizedCards: [...state.memorizedCards],
    tapState: state.tapState ? { ...state.tapState } : null,
    turnNumber: state.turnNumber,
  };
}
