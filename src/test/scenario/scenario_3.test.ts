import { describe, test, expect, beforeEach, vi } from 'vitest';
import { useGameStore } from '../../store/gameStore';
import { createCard } from '../../lib/cardUtils';

describe('Scenario 3: The "Blunder" (Strategy: Risk Failure)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    const store = useGameStore.getState();
    store.resetGame();
  });

  test('should simulate Match 3 correctly with wrong tap penalty', async () => {
    const store = useGameStore.getState();

    // 1. Setup specific hands
    const player1Cards = [
      createCard('6', 'hearts'),   // Player thinks this is a 5
      createCard('2', 'clubs'),
      createCard('3', 'diamonds'),
      createCard('4', 'spades'),
    ];
    const botCards = [
      createCard('10', 'hearts'),
      createCard('8', 'clubs'),
      createCard('6', 'diamonds'),
      createCard('7', 'spades'),
    ];

    useGameStore.setState({
      players: [
        { id: 'p1', name: 'Player 1', avatarColor: '#FF0000', cards: player1Cards, isHost: true, isReady: true, score: 0, totalScore: 0 },
        { id: 'bot', name: 'Bot', avatarColor: '#00FF00', cards: botCards, isHost: false, isReady: true, score: 0, totalScore: 0 },
      ],
      settings: { turnTimer: '30', mattsPairsRule: false, useEffectCards: true, numPlayers: 2, botDifficulty: 'medium', targetScore: '100' },
      gamePhase: 'playing',
      currentPlayerIndex: 1, // Bot's turn
      drawPile: [
        createCard('K', 'spades'), // Penalty card (Black King - 13 pts)
      ],
      discardPile: [createCard('5', 'hearts')], // Top discard is a 5
    });

    // 2. Player attempts to Snap the 5 with their 6
    // Ensure tap window is open
    useGameStore.setState({ 
      turnPhase: 'tap_window', 
      tapState: { 
        phase: 'window', 
        discarderIndex: 1, 
        selectedCardIds: [], 
        swapTargets: [], 
        swapsRemaining: 0 
      } 
    });

    store.activateTap();
    store.tapSelectCard(player1Cards[0].id);
    await store.confirmTapDiscard(); // Tapping the 6
    
    // The penalty card is added via setTimeout if using finalizeTap? 
    // No, confirmTapDiscard calls finalizeTap synchronously if not online.
    // Wait, let's check confirmTapDiscard again.
    
    let state = useGameStore.getState();
    // Expected: Penalty triggered
    // In our implementation, wrong tap adds a card to hand and ends tap phase
    // If it's still 4, maybe we need to advance timers if there's any delay?
    // Looking at confirmTapDiscard: it's synchronous for offline.
    
    if (state.players[0].cards.length === 4) {
      vi.advanceTimersByTime(100);
      state = useGameStore.getState();
    }

    expect(state.players[0].cards.length).toBe(5);
    // The penalty card is added to the player's cards array.
    // Let's check if 'penalty-c' or similar is there, or just check the last card added.
    const lastCard = state.players[0].cards[state.players[0].cards.length - 1];
    expect(lastCard.rank).toBe('K');
    expect(lastCard.suit).toBe('spades');
    expect(state.tapState).toBeNull();
    
    // Check that player can't swap or discard the penalty card immediately
    // The turn should still be with whoever it was (Bot) or continue
    expect(state.currentPlayerIndex).toBe(1);
  });
});
