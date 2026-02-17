import { describe, test, expect, beforeEach, vi } from 'vitest';
import { useOfflineStore } from '../../store/offlineStore';
import { resetStore } from '../../store/offlineStore';

describe('Scenario 19: All Black Royals (Worst Possible Hand)', () => {
  beforeEach(() => {
    resetStore();
    vi.useFakeTimers();
  });

  test('should calculate correct high points for black royals', () => {
    const store = useOfflineStore.getState();
    
    // Setup: Player 1 has Black King (13), Black King (13), Black Queen (12), Black Jack (11)
    // Total = 13 + 13 + 12 + 11 = 49
    useOfflineStore.setState({
      players: [
        {
          id: 'p1',
          name: 'Player 1',
          avatarColor: '#FF0000',
          cards: [
            { id: 'bk1', rank: 'K' as const, suit: 'spades' as const, faceUp: true },
            { id: 'bk2', rank: 'K' as const, suit: 'clubs' as const, faceUp: true },
            { id: 'bq', rank: 'Q' as const, suit: 'spades' as const, faceUp: true },
            { id: 'bj', rank: 'J' as const, suit: 'clubs' as const, faceUp: true },
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

    store.revealAllCards();

    const state = useOfflineStore.getState();
    // Player 1 score should be 49
    expect(state.players[0].score).toBe(49);
  });
});
