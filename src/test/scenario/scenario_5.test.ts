import { describe, test, expect, beforeEach, vi } from 'vitest';
import { useGameStore } from '../../store/gameStore';
import { createCard } from '../../lib/cardUtils';

describe('Scenario 5: The "Kaboo Gamble" (Strategy: Bluffing)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    const store = useGameStore.getState();
    store.resetGame();
  });

  test('should simulate Match 5 correctly where player wins Kaboo with high points', async () => {
    const store = useGameStore.getState();

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

    useGameStore.setState({
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
    await store.callKaboo();
    vi.advanceTimersByTime(3100); // Announcement + turn end
    
    let state = useGameStore.getState();
    expect(state.kabooCalled).toBe(true);
    expect(state.kabooCallerIndex).toBe(0);

    // 3. Final round: Bot's last turn
    // Bot draws and discards
    expect(state.currentPlayerIndex).toBe(1);
    await store.drawCard();
    await store.discardHeldCard();
    
    // Auto-close tap window if it opens
    state = useGameStore.getState();
    if (state.turnPhase === 'tap_window') {
      vi.advanceTimersByTime(5100);
    }
    
    state = useGameStore.getState();
    expect(state.gamePhase).toBe('reveal');
    
    // 4. Verification
    // Player sum = 15, Bot sum = 20
    // Player wins because 15 < 20
    // Strictly lowest score gets 0
    state = useGameStore.getState();
    const p1Score = state.players[0].score;
    const botScore = state.players[1].score;
    
    // In our revealAllCards logic, if p1Score < botScore, p1 gets 0?
    // Wait, let's check revealAllCards in turnActions.ts.
    // It says: if (callerScore < minOtherScore) { /* Success: No penalty */ }
    // It DOES NOT say caller gets 0. It just says they don't get the +20 penalty.
    // So p1Score should be 15.
    
    expect(p1Score).toBe(15); 
    expect(botScore).toBe(20);
    expect(p1Score).toBeLessThan(botScore);
  });
});
