import { describe, test, expect, beforeEach } from 'vitest';
import { useGameStore } from '../../store/gameStore';
import { resetStore } from '../testHelpers';

describe('Scenario 28: Window Resize During Effect Selection', () => {
  beforeEach(() => {
    resetStore();
  });

  test('Selection state should persist through window resize events', async () => {
    const store = useGameStore.getState();

    // 1. Setup: King effect active (full_vision_swap)
    useGameStore.setState({
      gameMode: 'offline',
      gamePhase: 'playing',
      currentPlayerIndex: 0,
      effectType: 'full_vision_swap',
      effectStep: 'select',
      players: [
        { id: 'p1', name: 'Player 1', avatarColor: '#FF0000', cards: [
          { id: 'c1', rank: 'A' as const, suit: 'hearts' as const, faceUp: false },
          { id: 'c2', rank: '2' as const, suit: 'hearts' as const, faceUp: false }
        ], score: 0, totalScore: 0, isHost: true, isReady: true },
        { id: 'bot1', name: 'Bot', avatarColor: '#00FF00', cards: [
          { id: 'c3', rank: '3' as const, suit: 'hearts' as const, faceUp: false },
          { id: 'c4', rank: '4' as const, suit: 'hearts' as const, faceUp: false }
        ], score: 0, totalScore: 0, isHost: false, isReady: true },
      ],
      selectedCards: [],
      settings: {
        numPlayers: 2,
        turnTimer: '30' as const,
        mattsPairsRule: true,
        useEffectCards: true,
        botDifficulty: 'medium' as const,
        targetScore: '100' as const,
      },
    });

    // 2. Select first card
    await store.resolveEffect('c1');
    expect(useGameStore.getState().selectedCards).toHaveLength(1);
    expect(useGameStore.getState().selectedCards[0]).toBe('c1');

    // 3. Simulate Window Resize
    global.dispatchEvent(new Event('resize'));
    
    // Assert: Selection state is still there
    expect(useGameStore.getState().selectedCards).toHaveLength(1);
    expect(useGameStore.getState().selectedCards[0]).toBe('c1');

    // 4. Select second card
    await store.resolveEffect('c3');
    
    // Assert: Effect continues normally
    expect(useGameStore.getState().selectedCards).toHaveLength(2);
    expect(useGameStore.getState().effectStep).toBe('preview');
  });
});
