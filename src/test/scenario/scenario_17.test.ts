import { describe, test, expect, beforeEach, vi } from 'vitest';
import { useOfflineStore, resetStore } from '../../store/offlineStore';

describe('Scenario 17: Rapid Fire Taps (Hand size 0)', () => {
  beforeEach(() => {
    resetStore();
    vi.useFakeTimers();
  });

  test('should allow a player to reach 0 cards via Taps and trigger auto-Kaboo', () => {
    const store = useOfflineStore.getState();
    
    // 1. Setup: Player 1 has 4 cards, all Rank '5'
    // Bot has Rank '7's
    useOfflineStore.setState({
      players: [
        {
          id: 'p1',
          name: 'Player 1',
          avatarColor: '#FF0000',
          cards: [
            { id: 'p1-c1', rank: '5' as const, suit: 'hearts' as const, faceUp: false },
            { id: 'p1-c2', rank: '5' as const, suit: 'diamonds' as const, faceUp: false },
            { id: 'p1-c3', rank: '5' as const, suit: 'clubs' as const, faceUp: false },
            { id: 'p1-c4', rank: '5' as const, suit: 'spades' as const, faceUp: false },
          ],
          isHost: true,
          isReady: true,
          score: 20,
          totalScore: 0,
        },
        {
          id: 'bot',
          name: 'Bot',
          avatarColor: '#00FF00',
          cards: [
            { id: 'bot-c1', rank: '7' as const, suit: 'hearts' as const, faceUp: false },
            { id: 'bot-c2', rank: '7' as const, suit: 'diamonds' as const, faceUp: false },
          ],
          isHost: false,
          isReady: true,
          score: 14,
          totalScore: 0,
        }
      ],
      settings: { turnTimer: '30', mattsPairsRule: false, useEffectCards: true, numPlayers: 2, botDifficulty: 'medium', targetScore: '100' },
      discardPile: [{ id: 'top', rank: '5' as const, suit: 'spades' as const, faceUp: true }],
      drawPile: [
        { id: 'd1', rank: 'A' as const, suit: 'hearts' as const, faceUp: false },
        { id: 'd2', rank: '2' as const, suit: 'hearts' as const, faceUp: false },
        { id: 'd3', rank: '3' as const, suit: 'hearts' as const, faceUp: false },
        { id: 'd4', rank: '4' as const, suit: 'hearts' as const, faceUp: false },
      ],
      gamePhase: 'playing',
      currentPlayerIndex: 1, // Bot's turn
      turnPhase: 'draw',
      kabooCalled: false,
    });

    // 2. Player 1 Taps the '5' discard with their first card
    store.openTapWindow(1);
    store.activateTap();
    store.tapSelectCard('p1-c1');
    store.confirmTapDiscard();
    
    expect(useOfflineStore.getState().players[0].cards.length).toBe(3);

    // 3. Repeat for remaining 3 cards
    const ranks = ['5', '5', '5'];
    ranks.forEach((rank, i) => {
      useOfflineStore.setState({
        discardPile: [...useOfflineStore.getState().discardPile, { id: `extra-${i}`, rank: '5' as const, suit: 'hearts' as const, faceUp: true }]
      });
      store.openTapWindow(1);
      store.activateTap();
      store.tapSelectCard(`p1-c${i+2}`);
      store.confirmTapDiscard();
    });

    const state = useOfflineStore.getState();
    expect(state.players[0].cards.length).toBe(0);
    
    // 4. Verify auto-Kaboo triggered
    expect(state.kabooCalled).toBe(true);
    expect(state.kabooCallerIndex).toBe(0);
  });
});
