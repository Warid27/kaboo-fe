import { useGameStore } from '@/store/gameStore';
import type { vi as ViType } from 'vitest';

export function resetStore() {
  useGameStore.setState({
    screen: 'home',
    gameMode: 'offline',
    playerName: '',
    roomCode: '',
    players: [],
    settings: { turnTimer: '30', mattsPairsRule: false, useEffectCards: true, numPlayers: 2, botDifficulty: 'medium', targetScore: '100' },
    gamePhase: 'waiting',
    turnPhase: 'draw',
    currentPlayerIndex: 0,
    drawPile: [],
    discardPile: [],
    heldCard: null,
    effectType: null,
    turnTimeRemaining: 30,
    initialLooksRemaining: 2,
    turnNumber: 0,
    selectedCards: [],
    peekedCards: [],
    memorizedCards: [],
    tapState: null,
    penaltySkipTurn: false,
    showKabooAnnouncement: false,
    showEffectOverlay: false,
    dealtCardIds: [],
    botMemories: {},
    kabooCalled: false,
    kabooCallerIndex: null,
    finalRoundTurnsLeft: 0,
    roundScores: [],
    turnLog: [],
    flyingCards: [],
  });
}

export function setupDrawPhase(vi: typeof ViType) {
  const store = useGameStore.getState();
  store.setPlayerName('TestPlayer');
  store.updateSettings({ numPlayers: 2 });
  store.startOffline();
  store.startGame();
  vi.advanceTimersByTime(2500);

  let state = useGameStore.getState();
  const cards = state.players[0].cards;
  state.peekCard(cards[0].id);
  vi.advanceTimersByTime(2500);
  state = useGameStore.getState();
  state.peekCard(cards[1].id);
  vi.advanceTimersByTime(2500);
  vi.advanceTimersByTime(1000);
  return useGameStore.getState();
}
