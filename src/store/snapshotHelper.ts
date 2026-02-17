import type { StateSnapshot } from './replayStore';

type SnapshotSource = {
  players: StateSnapshot['players'];
  drawPile: StateSnapshot['drawPile'];
  discardPile: StateSnapshot['discardPile'];
  heldCard: StateSnapshot['heldCard'];
  gamePhase: StateSnapshot['gamePhase'];
  turnPhase: StateSnapshot['turnPhase'];
  currentPlayerIndex: StateSnapshot['currentPlayerIndex'];
  effectType: StateSnapshot['effectType'];
  kabooCalled: StateSnapshot['kabooCalled'];
  kabooCallerIndex: StateSnapshot['kabooCallerIndex'];
  finalRoundTurnsLeft: StateSnapshot['finalRoundTurnsLeft'];
  selectedCards?: StateSnapshot['selectedCards'];
  peekedCards?: StateSnapshot['peekedCards'];
  memorizedCards?: StateSnapshot['memorizedCards'];
  tapState: StateSnapshot['tapState'];
  turnNumber: StateSnapshot['turnNumber'];
};

export function captureSnapshot(state: SnapshotSource): StateSnapshot {
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
    selectedCards: [...(state.selectedCards ?? [])],
    peekedCards: [...(state.peekedCards ?? [])],
    memorizedCards: [...(state.memorizedCards ?? [])],
    tapState: state.tapState ? { ...state.tapState } : null,
    turnNumber: state.turnNumber,
  };
}
