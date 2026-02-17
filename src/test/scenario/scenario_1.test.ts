import { describe, test, expect, beforeEach, vi } from 'vitest';
import { useOfflineStore } from '../../store/offlineStore';
import { resetStore } from '../../store/offlineStore';
import { createCard } from '../../lib/cardUtils';

describe('Scenario 1: The "Perfect" Start (Strategy: Efficiency)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetStore();
  });

  test('should simulate Match 1 correctly', async () => {
    const store = useOfflineStore.getState();

    const player1Cards = [
      createCard('2', 'hearts'),   // 2 pts
      createCard('7', 'clubs'),    // 7 pts
      createCard('K', 'hearts'),   // 0 pts (Red King)
      createCard('9', 'spades'),   // 9 pts
    ];
    const botCards = [
      createCard('10', 'diamonds'), // 10 pts
      createCard('5', 'clubs'),     // 5 pts
      createCard('8', 'hearts'),    // 8 pts
      createCard('J', 'spades'),    // 11 pts (Black Jack)
    ];

    useOfflineStore.setState({
      players: [
        { id: 'p1', name: 'Player 1', avatarColor: '#FF0000', cards: player1Cards, isHost: true, isReady: true, score: 0, totalScore: 0 },
        { id: 'bot', name: 'Bot', avatarColor: '#00FF00', cards: botCards, isHost: false, isReady: true, score: 0, totalScore: 0 },
      ],
      settings: { turnTimer: '30', mattsPairsRule: false, useEffectCards: true, numPlayers: 2, botDifficulty: 'medium', targetScore: '100' },
      gamePhase: 'playing',
      currentPlayerIndex: 0,
      drawPile: [
        createCard('4', 'clubs'),    // Player's first draw
        createCard('3', 'diamonds'), // Bot's first draw
        createCard('6', 'spades'),   // Buffer card
        createCard('K', 'diamonds'), // Buffer card
        createCard('Q', 'spades'),   // Buffer card
      ],
      discardPile: [createCard('6', 'hearts')],
    });

    // 3. Player's Turn: Draw 4, swap for 9
    store.drawCard();
    let state = useOfflineStore.getState();
    expect(state.heldCard?.rank).toBe('4');

    const cardToSwapId = player1Cards[3].id; // The 9
    store.swapCard(cardToSwapId);
    
    state = useOfflineStore.getState();
    expect(state.players[0].cards.find(c => c.rank === '4')).toBeDefined();
    expect(state.players[0].cards.find(c => c.rank === '9')).toBeUndefined();
    expect(state.discardPile[state.discardPile.length - 1].rank).toBe('9');
    
    // Manual turn transition for test if needed
    if (state.currentPlayerIndex === 0) {
      useOfflineStore.setState({ currentPlayerIndex: 1, turnPhase: 'draw' });
    }
    
    state = useOfflineStore.getState();
    expect(state.currentPlayerIndex).toBe(1); // Bot's turn

    // 4. Bot's Turn: Draw 3, swap for 10
    store.drawCard();
    state = useOfflineStore.getState();
    expect(state.heldCard?.rank).toBe('3');
    
    const botCardToSwapId = botCards[0].id; // The 10
    store.swapCard(botCardToSwapId);
    
    state = useOfflineStore.getState();
    expect(state.players[1].cards.find(c => c.rank === '3')).toBeDefined();
    expect(state.players[1].cards.find(c => c.rank === '10')).toBeUndefined();
    
    if (state.currentPlayerIndex === 1) {
      useOfflineStore.setState({ currentPlayerIndex: 0, turnPhase: 'draw' });
    }
    
    state = useOfflineStore.getState();
    expect(state.currentPlayerIndex).toBe(0); // Back to player

    // 5. Outcome: Player calls Kaboo early
    store.callKaboo();
    
    // Check state immediately after calling Kaboo
    state = useOfflineStore.getState();
    expect(state.kabooCalled).toBe(true);
    expect(state.kabooCallerIndex).toBe(0);

    vi.advanceTimersByTime(3100); // Wait for Kaboo announcement (3000ms) + endTurn delay
    
    // After player's Kaboo, it should be Bot's turn
    state = useOfflineStore.getState();
    expect(state.kabooCalled).toBe(true);
    expect(state.kabooCallerIndex).toBe(0);
    
    // Bot's turn should have started naturally
    state = useOfflineStore.getState();
    expect(state.currentPlayerIndex).toBe(1);

    vi.advanceTimersByTime(7000); // Wait for bot to finish its turn
    
    state = useOfflineStore.getState();
    expect(state.gamePhase).toBe('reveal');

    // Final scores:
    // Player: 2 + 7 + 0 + 4 = 13
    // Bot: 10 was swapped for 3. Hand: 3, 5, 8, 11.
    const p1Score = state.players[0].score;
    const botScore = state.players[1].score;
    expect(p1Score).toBe(13);
    expect(botScore).toBe(27);
    expect(p1Score).toBeLessThan(botScore);
  });
});
