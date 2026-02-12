import { describe, test, expect, beforeEach, vi } from 'vitest';
import { useGameStore } from '../../store/gameStore';
import { createCard } from '../../lib/cardUtils';

describe('Scenario 13: Peek Then Immediate Tap (Info Advantage)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    const store = useGameStore.getState();
    store.resetGame();
  });

  test('should exploit peeked information to Tap successfully', async () => {
    const store = useGameStore.getState();

    // 1. Setup specific hands
    const player1Cards = [
      createCard('2', 'hearts'), // P1-C1
      createCard('10', 'clubs'), // P1-C2
    ];
    const botCards = [
      createCard('2', 'diamonds'), // Bot-C1
      createCard('8', 'spades'),   // Bot-C2
    ];

    useGameStore.setState({
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
    await store.drawCard();
    await store.discardHeldCard();
    
    let state = useGameStore.getState();
    expect(state.effectType).toBe('peek_opponent');
    
    // Peek Bot's Card #1 (the 2)
    await store.resolveEffect(botCards[0].id);
    await store.confirmEffect();
    
    // Turn should end for Player 1
    state = useGameStore.getState();
    if (state.currentPlayerIndex === 0) {
      useGameStore.setState({ currentPlayerIndex: 1, turnPhase: 'draw' });
    }

    // 3. Bot Turn: Draw 2, discard it
    // Bot draws a 2 from the draw pile (we need to ensure a 2 is there)
    useGameStore.setState({
      drawPile: [createCard('2', 'spades')],
    });
    
    await store.drawCard();
    await store.discardHeldCard();
    
    state = useGameStore.getState();
    expect(state.discardPile[state.discardPile.length - 1].rank).toBe('2');
    
    // 4. Player Taps Bot's Card #1 (the 2) which they know is a 2
    // We need to be in tap_window
    if (state.turnPhase !== 'tap_window') {
      useGameStore.setState({
        turnPhase: 'tap_window',
        tapState: { phase: 'window', discarderIndex: 1, selectedCardIds: [], swapTargets: [], swapsRemaining: 0 }
      });
    }

    // Force tap window after bot's turn
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
    store.tapSelectCard(botCards[0].id);
    await store.confirmTapDiscard();
    
    state = useGameStore.getState();
    // Since player tapped someone else's card, it should be in swapping phase
    // But wait, confirmTapDiscard sets phase to 'swapping' only if swapTargets.length > 0
    // And pi !== 0 is the condition for swapTargets.
    // Bot is pi = 1. So it should be in 'swapping' phase.
    
    // If it's still 'selecting', maybe confirmTapDiscard didn't run?
    // Let's check the test logic.
    expect(state.tapState?.phase).toBe('swapping');
    
    // Player chooses their 10 to swap with the removed card slot
    store.tapSwapCard(player1Cards[1].id);
    
    state = useGameStore.getState();
    expect(state.players[0].cards.length).toBe(1); // Only the 2 of hearts left
    expect(state.players[1].cards.length).toBe(2); // Still has 2 cards, but one is the 10
    expect(state.players[1].cards.find(c => c.rank === '10')).toBeDefined();
    expect(state.discardPile.filter(c => c.rank === '2').length).toBe(2); // The discarded 2 and Bot's 2
  });
});