import { describe, test, expect, beforeEach, vi } from 'vitest';
import { useGameStore } from '../../store/gameStore';
import { resetStore } from '../testHelpers';

describe('Scenario 25: Negative Score (-2)', () => {
  beforeEach(() => {
    resetStore();
    vi.useFakeTimers();
  });

  test('should allow a player to reach -2 score with two Jokers', () => {
    const store = useGameStore.getState();
    
    // Setup: Player 1 has two Jokers
    useGameStore.setState({
      players: [
        {
          id: 'p1',
          name: 'Player 1',
          avatarColor: '#FF0000',
          cards: [
            { id: 'j1', rank: 'joker' as const, suit: 'joker' as const, faceUp: false },
            { id: 'j2', rank: 'joker' as const, suit: 'joker' as const, faceUp: false },
          ],
          score: 0,
          totalScore: 0,
          isHost: true,
          isReady: true,
        },
        {
          id: 'bot',
          name: 'Bot',
          avatarColor: '#00FF00',
          cards: [
            { id: 'b1', rank: '2' as const, suit: 'clubs' as const, faceUp: false },
          ],
          score: 0,
          totalScore: 0,
          isHost: false,
          isReady: true,
        }
      ],
      settings: {
        numPlayers: 2,
        turnTimer: '30' as const,
        mattsPairsRule: true,
        useEffectCards: true,
        botDifficulty: 'medium' as const,
        targetScore: '100' as const,
      },
      gamePhase: 'playing',
      currentPlayerIndex: 0,
      kabooCalled: false,
    });

    store.revealAllCards();

    const state = useGameStore.getState();
    // Player 1 score should be -2
    expect(state.players[0].score).toBe(-2);
  });
});
