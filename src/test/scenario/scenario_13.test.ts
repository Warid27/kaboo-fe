import { describe, test, expect, beforeEach, vi } from 'vitest';
import { useOfflineStore, resetStore } from '../../store/offlineStore';
import { createCard } from '../../lib/cardUtils';

describe('Scenario 13: Peek Then Immediate Tap (Info Advantage)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetStore();
  });

  test('should exploit peeked information to Tap successfully', () => {
    const store = useOfflineStore.getState();

    // 1. Setup specific hands
    const player1Cards = [
      createCard('2', 'hearts'), // P1-C1
      createCard('10', 'clubs'), // P1-C2
    ];
    const botCards = [
      createCard('2', 'diamonds'), // Bot-C1
      createCard('8', 'spades'),   // Bot-C2
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
        createCard('9', 'hearts'), // Effect: Peek Opponent
      ],
      discardPile: [createCard('5', 'clubs')],
    });

    // 2. Player Turn: Draw 9 (Peek Other), discard it to peek at Bot's first card
    store.drawCard();
    store.discardHeldCard();
    
    let state = useOfflineStore.getState();
    expect(state.effectType).toBe('peek_opponent');
    
    // Peek Bot's Card #1 (the 2)
    store.selectCard(botCards[0].id);
    store.confirmEffect();
    
    // Turn ends for Player 1
    store.endTurn();

    // 3. Bot Turn: Draw 2, discard it
    useOfflineStore.setState({
      currentPlayerIndex: 1,
      drawPile: [createCard('2', 'spades')],
      turnPhase: 'draw',
    });
    
    store.drawCard();
    store.discardHeldCard();
    
    state = useOfflineStore.getState();
    expect(state.discardPile[state.discardPile.length - 1].rank).toBe('2');
    
    // 4. Player Taps Bot's Card #1 (the 2) which they know is a 2
    store.openTapWindow(1); // Bot just discarded

    store.activateTap();
    store.tapSelectCard(botCards[0].id);
    store.confirmTapDiscard();
    
    state = useOfflineStore.getState();
    // Since player tapped someone else's card, it should be in swapping phase
    expect(state.tapState?.phase).toBe('swapping');
    
    // Player chooses their 10 to swap with the removed card slot
    store.tapSwapCard(player1Cards[1].id);
    
    state = useOfflineStore.getState();
    expect(state.players[0].cards.length).toBe(1); // Only the 2 of hearts left
    expect(state.players[1].cards.length).toBe(2); // Still has 2 cards, but one is the 10
    expect(state.players[1].cards.find(c => c.rank === '10')).toBeDefined();
    expect(state.discardPile.filter(c => c.rank === '2').length).toBe(2); // The discarded 2 and Bot's 2
  });
});