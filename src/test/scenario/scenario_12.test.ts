import { describe, test, expect, beforeEach, vi } from 'vitest';
import { useGameStore } from '../../store/gameStore';
import { resetStore } from '../testHelpers';

describe('Scenario 12: Jack -> Queen -> King Chain (Swap Hell)', () => {
  beforeEach(() => {
    resetStore();
    vi.useFakeTimers();
  });

  test('should resolve nested swap effects correctly without duplication', () => {
    const store = useGameStore.getState();
    
    // Setup: 2 players, each with 2 cards.
    // P1: [A, 2]
    // Bot: [3, 4]
    useGameStore.setState({
      players: [
        { id: 'p1', name: 'Player 1', avatarColor: '#FF0000', cards: [
          { id: 'c-A', rank: 'A' as const, suit: 'hearts' as const, faceUp: false },
          { id: 'c-2', rank: '2' as const, suit: 'hearts' as const, faceUp: false }
        ], isHost: true, isReady: true, score: 0, totalScore: 0 },
        { id: 'bot', name: 'Bot', avatarColor: '#00FF00', cards: [
          { id: 'c-3', rank: '3' as const, suit: 'hearts' as const, faceUp: false },
          { id: 'c-4', rank: '4' as const, suit: 'hearts' as const, faceUp: false }
        ], isHost: false, isReady: true, score: 0, totalScore: 0 },
      ],
      gamePhase: 'playing',
      currentPlayerIndex: 0,
      turnPhase: 'draw',
      settings: { turnTimer: '30', mattsPairsRule: false, useEffectCards: true, numPlayers: 2, botDifficulty: 'medium', targetScore: '100' },
      drawPile: [
        { id: 'c-J', rank: 'J' as const, suit: 'spades' as const, faceUp: false },
        { id: 'c-Q', rank: 'Q' as const, suit: 'spades' as const, faceUp: false },
        { id: 'c-K', rank: 'K' as const, suit: 'spades' as const, faceUp: false }
      ]
    });

    // 1. Turn 1: Player discards Jack (Blind Swap)
    store.drawCard();
    store.discardHeldCard();
    expect(useGameStore.getState().effectType).toBe('blind_swap');
    
    // Select two cards to swap: P1 card #2 and Bot card #1
    store.resolveEffect('c-3');
    store.resolveEffect('c-2');
    store.confirmEffect();
    
    // Verify swap: P1 now has [A, 3], Bot has [2, 4]
    let state = useGameStore.getState();
    expect(state.players[0].cards[1].id).toBe('c-3');
    expect(state.players[1].cards[0].id).toBe('c-2');
    expect(state.turnPhase).toBe('end_turn');
    store.endTurn();

    // 2. Turn 2: Bot discards Queen (Semi-Blind Swap)
    // We skip the bot's actual turn logic and just force the state
    useGameStore.setState({
        currentPlayerIndex: 1,
        heldCard: { id: 'c-Q', rank: 'Q' as const, suit: 'spades' as const, faceUp: true },
        turnPhase: 'action'
    });
    store.discardHeldCard();
    expect(useGameStore.getState().effectType).toBe('semi_blind_swap');
    
    // Bot peeks P1 card #1 (c-A), then swaps it with Bot's own card #2 (c-4)
    store.resolveEffect('c-A'); // Peek
    store.resolveEffect('c-4'); // Target
    store.confirmEffect();

    // Verify swap: P1 now has [4, 3], Bot has [2, A]
    state = useGameStore.getState();
    expect(state.players[0].cards[0].id).toBe('c-4');
    expect(state.players[1].cards[1].id).toBe('c-A');
    store.endTurn();

    // 3. Turn 3: Player discards King (Full Vision Swap)
    useGameStore.setState({
        currentPlayerIndex: 0,
        heldCard: { id: 'c-K', rank: 'K' as const, suit: 'spades' as const, faceUp: true },
        turnPhase: 'action'
    });
    store.discardHeldCard();
    expect(useGameStore.getState().effectType).toBe('full_vision_swap');

    // Player peeks Bot card #1 (c-2) and Bot card #2 (c-A), then swaps them
    store.resolveEffect('c-2');
    store.resolveEffect('c-A');
    store.confirmEffect();

    // Verify swap: Bot now has [A, 2]
    state = useGameStore.getState();
    expect(state.players[1].cards[0].id).toBe('c-A');
    expect(state.players[1].cards[1].id).toBe('c-2');
  });
});
