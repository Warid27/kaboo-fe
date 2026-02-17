import { describe, test, expect, beforeEach, vi } from 'vitest';
import { useOfflineStore } from '../../store/offlineStore';
import { resetStore } from '../../store/offlineStore';

describe('Scenario 26: Rapid Click Spam', () => {
  beforeEach(() => {
    resetStore();
    vi.useFakeTimers();
  });

  test('should only process drawCard once even if called multiple times rapidly', async () => {
    // Setup: 2 players, P1's turn to draw
    useOfflineStore.setState({
      players: [
        { id: 'p1', name: 'Player 1', avatarColor: '#FF0000', cards: [], score: 0, totalScore: 0, isHost: true, isReady: true },
        { id: 'bot', name: 'Bot', avatarColor: '#00FF00', cards: [], score: 0, totalScore: 0, isHost: false, isReady: true },
      ],
      drawPile: [
        { id: 'd1', rank: '5' as const, suit: 'hearts' as const, faceUp: false },
        { id: 'd2', rank: '6' as const, suit: 'hearts' as const, faceUp: false },
      ],
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

    // 1. Spam click drawCard 5 times
    useOfflineStore.getState().drawCard();
    useOfflineStore.getState().drawCard();
    useOfflineStore.getState().drawCard();
    useOfflineStore.getState().drawCard();
    useOfflineStore.getState().drawCard();

    // 2. Verify only 1 card was drawn
    const state = useOfflineStore.getState();
    expect(state.heldCard?.id).toBe('d1');
    expect(state.drawPile.length).toBe(1);
    expect(state.drawPile[0].id).toBe('d2');
    expect(state.turnPhase).toBe('action');
  });

  test('should not allow discard if another action is locked', async () => {
    // Setup: P1 has a held card, turnPhase is action
    useOfflineStore.setState({
      players: [
        { id: 'p1', name: 'Player 1', avatarColor: '#FF0000', cards: [
          { id: 'p1-c1', rank: '2' as const, suit: 'hearts' as const, faceUp: false }
        ], score: 0, totalScore: 0, isHost: true, isReady: true },
      ],
      heldCard: { id: 'd1', rank: '5' as const, suit: 'hearts' as const, faceUp: true },
      gamePhase: 'playing',
      currentPlayerIndex: 0,
      turnPhase: 'action',
      isActionLocked: true, // Manually lock
      settings: {
        numPlayers: 1,
        turnTimer: '30' as const,
        mattsPairsRule: true,
        useEffectCards: true,
        botDifficulty: 'medium' as const,
        targetScore: '100' as const,
      },
    });

    // Try to discard
    useOfflineStore.getState().discardHeldCard();

    // Verify it didn't happen
    const state = useOfflineStore.getState();
    expect(state.heldCard).not.toBeNull();
    expect(state.heldCard?.id).toBe('d1');
  });
});
