import { describe, test, expect, beforeEach, vi } from 'vitest';
import { useOfflineStore, resetStore } from '../../store/offlineStore';
import { createCard } from '../../lib/cardUtils';

describe('Scenario 4: The "Hostile Swap" (Strategy: Queen/King Effects)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useOfflineStore.setState({
      players: [],
      gamePhase: 'waiting',
      discardPile: [],
      drawPile: [],
      heldCard: null,
    });
  });

  test('should simulate Match 4 correctly with King effect', () => {
    const store = useOfflineStore.getState();

    // 1. Setup specific hands
    const player1Cards = [
      createCard('10', 'hearts'),  // Will swap this
      createCard('2', 'clubs'),
      createCard('3', 'diamonds'),
      createCard('4', 'spades'),
    ];
    const botCards = [
      createCard('3', 'hearts'),   // Bot's card that player wants
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
      currentPlayerIndex: 0, // Player's turn
      drawPile: [
        createCard('K', 'clubs'),
        createCard('9', 'clubs'),
      ],
      discardPile: [createCard('5', 'hearts')],
    });

    // 2. Player draws King and discards it
    store.drawCard();
    store.discardHeldCard();
    
    let state = useOfflineStore.getState();
    expect(state.effectType).toBe('full_vision_swap');
    
    // 3. Player uses King effect: Peek at Bot's 3 and own 10, then swap
    store.selectCard(botCards[0].id); // Bot's 3
    store.selectCard(player1Cards[0].id); // Player's 10
    store.confirmEffect();
    
    state = useOfflineStore.getState();
    expect(state.players[1].cards.find(c => c.rank === '10')).toBeDefined();
    expect(state.players[0].cards.find(c => c.rank === '3')).toBeDefined();

    vi.clearAllTimers();
    resetStore();

    const nextStore = useOfflineStore.getState();
    useOfflineStore.setState({
      players: [
        { id: 'p1', name: 'Player 1', avatarColor: '#FF0000', cards: player1Cards, isHost: true, isReady: true, score: 0, totalScore: 0 },
        { id: 'bot', name: 'Bot', avatarColor: '#00FF00', cards: botCards, isHost: false, isReady: true, score: 0, totalScore: 0 },
      ],
      settings: { ...nextStore.settings, numPlayers: 2, botDifficulty: 'medium', targetScore: '100', useEffectCards: true, mattsPairsRule: false, turnTimer: '30' },
      currentPlayerIndex: 1,
      gamePhase: 'playing',
      kabooCalled: false,
      kabooCallerIndex: null,
      finalRoundTurnsLeft: 2,
      drawPile: [createCard('5', 'hearts')],
      discardPile: [],
    });
    nextStore.callKaboo(); 
    
    vi.advanceTimersByTime(3500); 
    
    state = useOfflineStore.getState();
    expect(state.kabooCalled).toBe(true);
    expect(state.gamePhase).toBe('kaboo_final');
    expect(state.currentPlayerIndex).toBe(0);
    expect(state.finalRoundTurnsLeft).toBe(1);
  });
});
