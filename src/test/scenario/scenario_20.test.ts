import { describe, test, expect, beforeEach, vi } from 'vitest';
import { useGameStore } from '../../store/gameStore';
import { createCard } from '../../lib/cardUtils';

describe('Scenario 20: Simultaneous Kaboo Calls', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    const store = useGameStore.getState();
    store.resetGame();
  });

  test('should only process the first Kaboo call and ignore subsequent ones', () => {
    const store = useGameStore.getState();

    // 1. Setup
    useGameStore.setState({
      players: [
        { id: 'p1', name: 'Player 1', avatarColor: '#FF0000', cards: [createCard('2' as const, 'hearts' as const)], score: 0, totalScore: 0, isHost: true, isReady: true },
        { id: 'bot', name: 'Bot', avatarColor: '#00FF00', cards: [createCard('10' as const, 'diamonds' as const)], score: 0, totalScore: 0, isHost: false, isReady: true },
      ],
      settings: {
        turnTimer: '30' as const,
        mattsPairsRule: true,
        useEffectCards: true,
        botDifficulty: 'medium' as const,
        targetScore: '100' as const,
        numPlayers: 2
      },
      gamePhase: 'playing',
      currentPlayerIndex: 0,
    });

    // 2. Player calls Kaboo
    store.callKaboo();
    
    let state = useGameStore.getState();
    expect(state.kabooCalled).toBe(true);
    expect(state.kabooCallerIndex).toBe(0);
    expect(state.gamePhase).toBe('kaboo_final');

    // 3. Attempt another Kaboo call (simulating race condition)
    // In our implementation, callKaboo should check if kabooCalled is already true.
    store.callKaboo();
    
    state = useGameStore.getState();
    // Caller index should still be 0
    expect(state.kabooCallerIndex).toBe(0);
  });
});
