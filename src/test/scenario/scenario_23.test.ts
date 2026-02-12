import { describe, test, expect, beforeEach, vi } from 'vitest';
import { useGameStore } from '../../store/gameStore';
import { resetStore } from '../testHelpers';

describe('Scenario 23: Effect During Kaboo Final Round', () => {
  beforeEach(() => {
    resetStore();
    vi.useFakeTimers();
  });

  test('should allow special effects to trigger during the final round after Kaboo is called', () => {
    const store = useGameStore.getState();
    
    // Setup: 3 players. P3 called Kaboo. It is now P1's turn in the final round.
    useGameStore.setState({
      players: [
        { id: 'p1', name: 'Player 1', avatarColor: '#FF0000', cards: [
          { id: 'p1-c1', rank: '5' as const, suit: 'hearts' as const, faceUp: false }
        ], score: 0, totalScore: 0, isHost: true, isReady: true },
        { id: 'p2', name: 'Player 2', avatarColor: '#00FF00', cards: [
          { id: 'p2-c1', rank: '2' as const, suit: 'hearts' as const, faceUp: false }
        ], score: 0, totalScore: 0, isHost: false, isReady: true },
        { id: 'p3', name: 'Player 3', avatarColor: '#0000FF', cards: [
          { id: 'p3-c1', rank: 'A' as const, suit: 'hearts' as const, faceUp: false }
        ], score: 0, totalScore: 0, isHost: false, isReady: true },
      ],
      drawPile: [{ id: 'c-J', rank: 'J' as const, suit: 'spades' as const, faceUp: false }],
      gamePhase: 'playing',
      currentPlayerIndex: 0,
      turnPhase: 'draw',
      kabooCalled: true,
      kabooCallerIndex: 2,
      finalRoundTurnsLeft: 2,
      settings: {
        numPlayers: 3,
        turnTimer: '30' as const,
        mattsPairsRule: true,
        useEffectCards: true,
        botDifficulty: 'medium' as const,
        targetScore: '100' as const,
      },
    });

    // 1. P1 draws a Jack (Blind Swap)
    store.drawCard();
    expect(useGameStore.getState().turnPhase).toBe('action');
    expect(useGameStore.getState().heldCard?.rank).toBe('J');

    // 2. P1 discards the Jack
    store.discardHeldCard();
    
    // 3. Verify effect triggers
    expect(useGameStore.getState().effectType).toBe('blind_swap');
    expect(useGameStore.getState().turnPhase).toBe('effect');

    // 4. Resolve effect: swap P1-c1 with P3-c1
    store.resolveEffect('p1-c1');
    store.resolveEffect('p3-c1');
    store.confirmEffect();

    // 5. Verify swap happened
    const state = useGameStore.getState();
    expect(state.players[0].cards[0].id).toBe('p3-c1');
    expect(state.players[2].cards[0].id).toBe('p1-c1');
    expect(state.turnPhase).toBe('end_turn');
  });
});
