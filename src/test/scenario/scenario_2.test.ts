import { describe, test, expect, beforeEach, vi } from 'vitest';
import { useGameStore } from '../../store/gameStore';
import { createCard } from '../../lib/cardUtils';

describe('Scenario 2: The "Effect Chain" (Strategy: Information War)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    const store = useGameStore.getState();
    store.resetGame();
  });

  test('should simulate Match 2 correctly with effect chain and snap', async () => {
    const store = useGameStore.getState();

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

    useGameStore.setState({
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
    await store.drawFromDiscard();
    await store.swapCard(botCards[1].id);
    
    // Force turn end for test
    useGameStore.setState({ currentPlayerIndex: 0, turnPhase: 'draw' });
    
    let state = useGameStore.getState();
    expect(state.discardPile[state.discardPile.length - 1].rank).toBe('8');
    expect(state.currentPlayerIndex).toBe(0); // Player's turn

    // Trigger effect
    await store.resolveEffect(botCards[1].id); // Resolve effect of the discarded 8 (Peek Own)
    await store.confirmEffect();

    // --- Turn 2: Player draws a Jack (Blind Swap) ---
    await store.drawCard();
    state = useGameStore.getState();
    expect(state.heldCard?.rank).toBe('J');
    
    await store.discardHeldCard();
    state = useGameStore.getState();
    expect(state.effectType).toBe('blind_swap');
    
    // Player swaps Bot's card #1 (the 5) with Player's card #1 (the 10)
    // In blind swap, we don't know the values, but we resolve by IDs
    await store.resolveEffect(botCards[0].id); // Bot's 5
    await store.resolveEffect(player1Cards[0].id); // Player's 10
    await store.confirmEffect();
    
    state = useGameStore.getState();
    // Check swap happened - Bot's card #1 is now 10, Player's card #1 is now 5
    expect(state.players[1].cards.find(c => c.id === botCards[0].id)).toBeUndefined();
    expect(state.players[0].cards.find(c => c.id === player1Cards[0].id)).toBeUndefined();
    
    // The cards have swapped places in the players' cards arrays
    expect(state.players[1].cards.find(c => c.rank === '10')).toBeDefined();
    expect(state.players[0].cards.find(c => c.rank === '5')).toBeDefined();

    // --- Turn 3: Bot draws a 10, tries to discard it ---
    useGameStore.setState({ currentPlayerIndex: 1, turnPhase: 'draw' });
    await store.drawCard();
    state = useGameStore.getState();
    expect(state.heldCard?.rank).toBe('10');
    
    await store.discardHeldCard();
    state = useGameStore.getState();
    expect(state.discardPile[state.discardPile.length - 1].rank).toBe('10');

    // --- Player Snaps (Tap) with the 10 they just gave to the bot ---
    // Wait, the scenario says "Player Snaps with the 10 they just got FROM the bot"
    // But Player got a 5 from the bot. Bot got the 10 from the player.
    // Let's adjust the test to match the logic: Bot discards a 10, Player snaps their own 10? 
    // No, the bot has the 10 now. So Player snaps Bot's 10.
    
    // Force tap window
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
    // Bot's card #1 is now the 10
    const botTenId = state.players[1].cards.find(c => c.rank === '10')?.id;
    store.tapSelectCard(botTenId!); 
    await store.confirmTapDiscard();
    
    state = useGameStore.getState();
    // Since player tapped bot's card, they must swap one of their own to that slot
    expect(state.tapState?.phase).toBe('swapping');
    
    // Player swaps their last card (rank 4)
    const playerCardToSwap = state.players[0].cards[3];
    store.tapSwapCard(playerCardToSwap.id);
    
    state = useGameStore.getState();
    expect(state.players[0].cards.length).toBe(3);
    expect(state.players[1].cards.length).toBe(4);
    expect(state.players[1].cards.find(c => c.id === playerCardToSwap.id)).toBeDefined();
  });
});
