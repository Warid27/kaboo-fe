import { describe, test, expect, beforeEach, vi } from 'vitest';
import { useOfflineStore } from '../../store/offlineStore';
import { resetStore } from '../../store/offlineStore';

describe('Scenario 18: All Red Royals (Score = 0 Race)', () => {
  beforeEach(() => {
    resetStore();
    vi.useFakeTimers();
  });

  test('should calculate 0 points for a hand full of red royals', () => {
    const store = useOfflineStore.getState();
    
    // Setup: Player 1 has Red King, Red Queen, Red Jack, and another Red King
    useOfflineStore.setState({
      players: [
        {
          id: 'p1',
          name: 'Player 1',
          avatarColor: '#FF0000',
          cards: [
            { id: 'rk', rank: 'K' as const, suit: 'hearts' as const, faceUp: true },
            { id: 'rq', rank: 'Q' as const, suit: 'diamonds' as const, faceUp: true },
            { id: 'rj', rank: 'J' as const, suit: 'hearts' as const, faceUp: true },
            { id: 'rk2', rank: 'K' as const, suit: 'diamonds' as const, faceUp: true },
          ],
          isHost: true,
          isReady: true,
          score: 0,
          totalScore: 0,
        },
        {
          id: 'bot',
          name: 'Bot',
          avatarColor: '#00FF00',
          cards: [
            { id: 'b1', rank: '2' as const, suit: 'clubs' as const, faceUp: true },
          ],
          isHost: false,
          isReady: true,
          score: 0,
          totalScore: 0,
        }
      ],
      settings: { turnTimer: '30', mattsPairsRule: false, useEffectCards: true, numPlayers: 2, botDifficulty: 'medium', targetScore: '100' },
      gamePhase: 'playing',
      currentPlayerIndex: 0,
      kabooCalled: false,
    });

    // Manually trigger reveal all cards to check scoring
    store.revealAllCards();

    const state = useOfflineStore.getState();
    // Player 1 score should be 0 (0 + 0 + 0 + 0)
    expect(state.players[0].score).toBe(0);
    // Bot score should be 2
    expect(state.players[1].score).toBe(2);
  });
});
