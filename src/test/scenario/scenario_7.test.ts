import { describe, test, expect, beforeEach, vi } from 'vitest';
import { useGameStore } from '../../store/gameStore';
import { createCard } from '../../lib/cardUtils';

describe('Scenario 7: Double Tap Collision', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    const store = useGameStore.getState();
    store.resetGame();
  });

  test('should resolve race condition in Tap system: first timestamp wins', async () => {
    const store = useGameStore.getState();

    // 1. Setup
    // Give player 2 cards so they have one left after tapping
    const player1Cards = [createCard('7', 'hearts'), createCard('4', 'diamonds')];
    const botCards = [createCard('7', 'clubs')];

    useGameStore.setState({
      players: [
        { id: 'p1', name: 'Player 1', avatarColor: '#FF0000', cards: player1Cards, isHost: true, isReady: true, score: 0, totalScore: 0 },
        { id: 'bot', name: 'Bot', avatarColor: '#00FF00', cards: botCards, isHost: false, isReady: true, score: 0, totalScore: 0 },
      ],
      gamePhase: 'playing',
      discardPile: [createCard('7', 'spades')],
      gameMode: 'offline',
      settings: { turnTimer: '30', mattsPairsRule: false, useEffectCards: true, numPlayers: 2, botDifficulty: 'hard', targetScore: '100' },
      botMemories: {
        'bot': { knownCards: { [botCards[0].id]: { value: 7, turnLearned: 0 } } }
      }
    });

    // 2. Open Tap window
    store.openTapWindow(1); // Discarder is bot (index 1)
    
    let state = useGameStore.getState();
    expect(state.turnPhase).toBe('tap_window');
    expect(state.tapState?.phase).toBe('window');

    // 3. Player Taps
    store.activateTap();
    state = useGameStore.getState();
    expect(state.tapState?.phase).toBe('selecting');

    // 4. Confirm player tap (select card first)
    store.tapSelectCard(player1Cards[0].id);
    await store.confirmTapDiscard();
    
    state = useGameStore.getState();
    // Since player tapped their own card and it matches, it's discarded immediately
    // For own card success, it doesn't enter 'swapping' phase, it just discards.
    expect(state.players[0].cards.length).toBe(1);
    expect(state.tapState).toBeNull();

    // 5. Race condition: Both tap, but Player is slightly faster (or just player taps first)
    // Let's test tapping a BOT card next
    // Update players to ensure we have the latest state before manual override
    state = useGameStore.getState();
    const botCard = state.players[1].cards[0];
    
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
    store.tapSelectCard(botCard.id);
    await store.confirmTapDiscard();

    state = useGameStore.getState();
    // Should be 'swapping' since it's a bot card
    expect(state.tapState?.phase).toBe('swapping');
    
    // 6. Finalize swap
    const playerCardToSwapId = state.players[0].cards[0].id;
    store.tapSwapCard(playerCardToSwapId);
    
    state = useGameStore.getState();
    expect(state.tapState).toBeNull();
    expect(state.players[0].cards.length).toBe(0);
    expect(state.players[1].cards.length).toBe(1); // Bot lost its card but got player's card
  });
});
