import { describe, test, expect, beforeEach, vi } from 'vitest';
import { useOfflineStore } from '../../store/offlineStore';
import { resetStore } from '../../store/offlineStore';
import { createCard } from '../../lib/cardUtils';

describe('Scenario 2: The "Effect Chain" (Strategy: Information War)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetStore();
  });

  test('should simulate Match 2 correctly with effect chain and snap', () => {
    const store = useOfflineStore.getState();

    // 1. Setup specific hands
    // Player Hand: unknown 10, unknown 2, unknown 3, unknown 4
    // Bot Hand: unknown 5, unknown 8, unknown 6, unknown 7
    const player1Cards = [
      createCard('10', 'hearts'),  // Card #1
      createCard('2', 'clubs'),
      createCard('3', 'diamonds'),
      createCard('4', 'spades'),
    ];
    const botCards = [
      createCard('5', 'hearts'),   // Card #1
      createCard('8', 'clubs'),    // Card #2
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
      currentPlayerIndex: 1, // Start with Bot's turn
      drawPile: [
        createCard('J', 'spades'),    // Player's draw (Jack - Blind Swap)
        createCard('10', 'diamonds'), // Bot's draw
      ],
      discardPile: [createCard('2', 'hearts')],
    });

    // --- Turn 1: Bot discards an 8 (Peek Own) ---
    store.drawFromDiscard();
    store.swapCard(botCards[1].id);
    
    // Force turn end for test
    useOfflineStore.setState({ currentPlayerIndex: 0, turnPhase: 'draw' });
    
    let state = useOfflineStore.getState();
    expect(state.discardPile[state.discardPile.length - 1].rank).toBe('8');
    expect(state.currentPlayerIndex).toBe(0); // Player's turn

    // Trigger effect
    store.resolveEffect(botCards[1].id);
    store.confirmEffect();

    // --- Turn 2: Player draws a Jack (Blind Swap) ---
    store.drawCard();
    state = useOfflineStore.getState();
    expect(state.heldCard?.rank).toBe('J');
    
    store.discardHeldCard();
    state = useOfflineStore.getState();
    expect(state.effectType).toBe('blind_swap');
    
    // Player swaps Bot's card #1 (the 5) with Player's card #1 (the 10)
    store.selectCard(botCards[0].id); // Bot's 5
    store.selectCard(player1Cards[0].id); // Player's 10
    store.confirmEffect();
    
    state = useOfflineStore.getState();
    // Check swap happened
    expect(state.players[1].cards.find(c => c.rank === '10')).toBeDefined();
    expect(state.players[0].cards.find(c => c.rank === '5')).toBeDefined();

    // --- Turn 3: Bot draws a 10, tries to discard it ---
    useOfflineStore.setState({ currentPlayerIndex: 1, turnPhase: 'draw' });
    store.drawCard();
    state = useOfflineStore.getState();
    expect(state.heldCard?.rank).toBe('10');
    
    store.discardHeldCard();
    state = useOfflineStore.getState();
    expect(state.discardPile[state.discardPile.length - 1].rank).toBe('10');

    // --- Player Snaps (Tap) with the 10 they just gave to the bot ---
    const botTenCard = state.players[1].cards.find(c => c.rank === '10');
    expect(botTenCard).toBeDefined();
    if (botTenCard) {
      store.tapSelectCard(botTenCard.id);
      store.confirmTapDiscard();
      
      state = useOfflineStore.getState();
      // Card should be gone from bot's hand
      expect(state.players[1].cards.find(c => c.id === botTenCard.id)).toBeUndefined();
      expect(state.players[1].cards).toHaveLength(3);
    }
  });
});
