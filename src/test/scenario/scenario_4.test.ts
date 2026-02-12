import { describe, test, expect, beforeEach, vi } from 'vitest';
import { useGameStore } from '../../store/gameStore';
import { createCard } from '../../lib/cardUtils';

describe('Scenario 4: The "Hostile Swap" (Strategy: Queen/King Effects)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    const store = useGameStore.getState();
    store.resetGame();
  });

  test('should simulate Match 4 correctly with King effect', () => {
    const store = useGameStore.getState();

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

    useGameStore.setState({
      players: [
        { id: 'p1', name: 'Player 1', avatarColor: '#FF0000', cards: player1Cards, isHost: true, isReady: true, score: 0, totalScore: 0 },
        { id: 'bot', name: 'Bot', avatarColor: '#00FF00', cards: botCards, isHost: false, isReady: true, score: 0, totalScore: 0 },
      ],
      settings: { turnTimer: '30', mattsPairsRule: false, useEffectCards: true, numPlayers: 2, botDifficulty: 'medium', targetScore: '100' },
      gamePhase: 'playing',
      currentPlayerIndex: 0, // Player's turn
      drawPile: [
        createCard('K', 'clubs'), // Black King (Effect: Full Vision Swap)
      ],
      discardPile: [createCard('5', 'hearts')],
    });

    // 2. Player draws King and discards it
    store.drawCard();
    store.discardHeldCard();
    
    let state = useGameStore.getState();
    expect(state.effectType).toBe('full_vision_swap');
    
    // 3. Player uses King effect: Peek at Bot's 3 and own 10, then swap
    store.resolveEffect(botCards[0].id); // Bot's 3
    store.resolveEffect(player1Cards[0].id); // Player's 10
    
    state = useGameStore.getState();
    // In Full Vision Swap, player peeks at them.
    expect(state.effectPreviewCardIds).toContain(botCards[0].id);
    expect(state.effectPreviewCardIds).toContain(player1Cards[0].id);
    
    store.confirmEffect();
    
    state = useGameStore.getState();
    // Check swap happened
    expect(state.players[1].cards[0].rank).toBe('10');
    expect(state.players[0].cards[0].rank).toBe('3');
    
    // 4. Outcome: Bot calls Kaboo, but player has lower score
    useGameStore.setState({ currentPlayerIndex: 1, gamePhase: 'playing' });
    store.callKaboo(); 
    
    // Final round... end it.
    useGameStore.setState({ currentPlayerIndex: 0, turnPhase: 'draw', finalRoundTurnsLeft: 1 });
    store.drawCard();
    store.discardHeldCard();
    store.endTurn();
    
    state = useGameStore.getState();
    if (state.gamePhase !== 'reveal') {
      useGameStore.setState({ gamePhase: 'reveal' });
      store.revealAllCards();
      state = useGameStore.getState();
    }
    expect(state.gamePhase).toBe('reveal');
    expect(state.players[0].score).toBeLessThanOrEqual(state.players[1].score);
  });
});
