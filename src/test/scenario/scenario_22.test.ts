import { describe, test, expect, beforeEach, vi } from 'vitest';
import { useGameStore } from '../../store/gameStore';
import { resetStore } from '../testHelpers';

describe('Scenario 22: Tap Blocked After Auto-Kaboo (Deck Exhaustion)', () => {
  beforeEach(() => {
    resetStore();
    vi.useFakeTimers();
  });

  test('should not open tap window and transition to reveal when deck is exhausted', async () => {
    // Setup: 1 card in deck, player has matching card for what will be discarded
    useGameStore.setState({
      players: [
        { id: 'p1', name: 'Player 1', avatarColor: '#FF0000', cards: [
          { id: 'p1-c1', rank: '5' as const, suit: 'hearts' as const, faceUp: false }
        ], score: 0, totalScore: 0, isHost: true, isReady: true },
        { id: 'bot', name: 'Bot', avatarColor: '#00FF00', cards: [
          { id: 'bot-c1', rank: '2' as const, suit: 'hearts' as const, faceUp: false }
        ], score: 0, totalScore: 0, isHost: false, isReady: true },
      ],
      drawPile: [{ id: 'd1', rank: '8' as const, suit: 'diamonds' as const, faceUp: false }],
      discardPile: [{ id: 'dp1', rank: '5' as const, suit: 'spades' as const, faceUp: true }],
      gamePhase: 'playing',
      currentPlayerIndex: 0,
      turnPhase: 'draw',
      settings: {
        numPlayers: 2,
        turnTimer: '30' as const,
        mattsPairsRule: true,
        useEffectCards: true,
        botDifficulty: 'medium' as const,
        targetScore: '100' as const,
      },
    });

    // 1. Player draws the final card
    await useGameStore.getState().drawCard();
    expect(useGameStore.getState().drawPile.length).toBe(0);
    expect(useGameStore.getState().heldCard?.id).toBe('d1');

    // 2. Player discards the drawn card (Rank 8, which has an effect, but we check if turn ends)
    await useGameStore.getState().discardHeldCard();
    
    // Peek effect triggers. Resolve it.
    if (useGameStore.getState().turnPhase === 'effect') {
      await useGameStore.getState().resolveEffect('p1-c1');
    }

    // Advance timers for the peek animation
    vi.runAllTimers();

    // Now turnPhase should be 'end_turn'. We need to call endTurn() to trigger deck check.
    expect(useGameStore.getState().turnPhase).toBe('end_turn');
    useGameStore.getState().endTurn();

    // After endTurn, it should detect empty deck and go to reveal
    const state = useGameStore.getState();
    expect(state.gamePhase).toBe('reveal');
    expect(state.tapState).toBeNull();
  });
});
