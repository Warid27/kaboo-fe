import { describe, test, expect, beforeEach, vi } from 'vitest';
import { useOfflineStore } from '../../store/offlineStore';
import { resetStore } from '../../store/offlineStore';
import { createCard } from '../../lib/cardUtils';

describe('Scenario 3: The "Blunder" (Strategy: Risk Failure)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetStore();
  });

  test('should simulate Match 3 correctly with wrong tap penalty', () => {
    const store = useOfflineStore.getState();

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

    useOfflineStore.setState({
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
    store.openTapWindow(1); // Bot just discarded a 5
    store.activateTap();
    store.tapSelectCard(player1Cards[0].id);
    store.confirmTapDiscard(); // Tapping the 6
    
    const state = useOfflineStore.getState();
    expect(state.players[0].cards.length).toBe(5);
    const lastCard = state.players[0].cards[state.players[0].cards.length - 1];
    expect(lastCard.rank).toBe('K');
    expect(lastCard.suit).toBe('spades');
    expect(state.tapState).toBeNull();
    expect(state.currentPlayerIndex).toBe(1);
  });
});
