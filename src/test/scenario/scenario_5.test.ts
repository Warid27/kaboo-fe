import { describe, test, expect, beforeEach, vi } from 'vitest';
import { useOfflineStore, resetStore } from '../../store/offlineStore';
import { createCard } from '../../lib/cardUtils';

describe('Scenario 5: The "Kaboo Gamble" (Strategy: Bluffing)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetStore();
  });

  test('should simulate Match 5 correctly where player wins Kaboo with high points', () => {
    const store = useOfflineStore.getState();

    // 1. Setup specific hands
    const player1Cards = [
      createCard('10', 'hearts'), // 10
      createCard('5', 'clubs'),   // 5
      // Total: 15
    ];
    const botCards = [
      createCard('J', 'spades'),   // 11 (Black Jack)
      createCard('9', 'diamonds'), // 9
      // Total: 20
    ];

    useOfflineStore.setState({
      players: [
        { id: 'p1', name: 'Player 1', avatarColor: '#FF0000', cards: player1Cards, isHost: true, isReady: true, score: 0, totalScore: 0 },
        { id: 'bot', name: 'Bot', avatarColor: '#00FF00', cards: botCards, isHost: false, isReady: true, score: 0, totalScore: 0 },
      ],
      settings: { turnTimer: '30', mattsPairsRule: false, useEffectCards: true, numPlayers: 2, botDifficulty: 'medium', targetScore: '100' },
      gamePhase: 'playing',
      currentPlayerIndex: 0,
      drawPile: [createCard('2', 'hearts')],
      discardPile: [createCard('A', 'spades')],
    });

    // 2. Player calls Kaboo with 15 points
    store.callKaboo();
    vi.advanceTimersByTime(3100); // Announcement + turn end
    
    let state = useOfflineStore.getState();
    expect(state.kabooCalled).toBe(true);
    expect(state.kabooCallerIndex).toBe(0);

    // 3. Final round: Bot's last turn
    expect(state.currentPlayerIndex).toBe(1);
    store.drawCard();
    store.discardHeldCard();
    
    // In offline mode, endTurn is needed to finalize the round if it's the last turn
    store.endTurn();
    
    state = useOfflineStore.getState();
    expect(state.gamePhase).toBe('reveal');
    
    // 4. Verification
    const p1Score = state.players[0].score;
    const botScore = state.players[1].score;
    
    expect(p1Score).toBe(15); 
    expect(botScore).toBe(20);
    expect(p1Score).toBeLessThan(botScore);
  });
});
