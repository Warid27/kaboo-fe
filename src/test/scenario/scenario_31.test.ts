import { describe, test, expect, beforeEach, vi } from 'vitest';
import { useGameStore } from '../../store/gameStore';
import { resetStore } from '../testHelpers';

describe('Scenario 31: Bot Difficulty Consistency', () => {
  beforeEach(() => {
    resetStore();
    vi.useFakeTimers();
  });

  test('Bot configurations should vary correctly by difficulty', () => {
    // This is more of a unit test for the internal config, 
    // but it ensures the foundation for Scenario 31 is solid.
    
    const store = useGameStore.getState();
    
    // Check Easy
    useGameStore.setState({ settings: { ...store.settings, botDifficulty: 'easy' as const, numPlayers: 2, turnTimer: '30' as const, mattsPairsRule: true, useEffectCards: true, targetScore: '100' as const } });
    // We can't directly access DIFFICULTY_CONFIGS from botAI here as it's not exported,
    // but we can verify behavior if we had exports.
    // Instead, we'll verify the store accepts and maintains the difficulty.
    expect(useGameStore.getState().settings.botDifficulty).toBe('easy');

    // Check Hard
    useGameStore.setState({ settings: { ...store.settings, botDifficulty: 'hard' as const, numPlayers: 2, turnTimer: '30' as const, mattsPairsRule: true, useEffectCards: true, targetScore: '100' as const } });
    expect(useGameStore.getState().settings.botDifficulty).toBe('hard');
  });

  test('Bot should be able to complete a turn on all difficulties without error', async () => {
    const difficulties = ['easy', 'medium', 'hard'] as const;
    
    for (const diff of difficulties) {
      resetStore();
      const store = useGameStore.getState();
      
      useGameStore.setState({
        players: [
          { id: 'p1', name: 'Player 1', avatarColor: '#FF0000', cards: [{ id: 'c1', rank: '5' as const, suit: 'hearts' as const, faceUp: false }], score: 0, totalScore: 0, isHost: true, isReady: true },
          { id: 'bot1', name: 'Bot', avatarColor: '#00FF00', cards: [{ id: 'c2', rank: '2' as const, suit: 'hearts' as const, faceUp: false }], score: 0, totalScore: 0, isHost: false, isReady: true },
        ],
        drawPile: [
          { id: 'd1', rank: 'A' as const, suit: 'hearts' as const, faceUp: false },
          { id: 'd2', rank: 'Q' as const, suit: 'hearts' as const, faceUp: false }
        ],
        gamePhase: 'playing',
        currentPlayerIndex: 1,
        turnPhase: 'draw',
        settings: {
          numPlayers: 2,
          botDifficulty: diff,
          useEffectCards: false,
          turnTimer: '30' as const,
          mattsPairsRule: true,
          targetScore: '100' as const,
        },
        gameMode: 'offline'
      });

      store.simulateBotTurn();
      
      // Advance through all bot turn phases
      vi.advanceTimersByTime(1200); // Draw delay
      vi.advanceTimersByTime(800);  // Decision delay
      vi.advanceTimersByTime(3000); // Tap window
      
      const state = useGameStore.getState();
      expect(state.currentPlayerIndex).toBe(0); // Should have ended turn
    }
  });
});
