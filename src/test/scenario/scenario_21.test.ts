import { describe, test, expect, beforeEach, vi } from 'vitest';
import { useGameStore } from '../../store/gameStore';
import { resetStore } from '../testHelpers';

describe('Scenario 21: Tap Your Own Discard (Self-Steal?)', () => {
  beforeEach(() => {
    resetStore();
    vi.useFakeTimers();
  });

  test('should disallow a player from tapping their own discard', () => {
    const store = useGameStore.getState();
    
    // Setup: 2 players. P1 has a card matching the discard.
    // P1 just discarded a card (Rank '5').
    useGameStore.setState({
      players: [
        { id: 'p1', name: 'Player 1', avatarColor: '#FF0000', cards: [
          { id: 'p1-c1', rank: '5' as const, suit: 'hearts' as const, faceUp: false }
        ], score: 0, totalScore: 0, isHost: true, isReady: true },
        { id: 'bot', name: 'Bot', avatarColor: '#00FF00', cards: [
          { id: 'bot-c1', rank: '2' as const, suit: 'hearts' as const, faceUp: false }
        ], score: 0, totalScore: 0, isHost: false, isReady: true },
      ],
      discardPile: [{ id: 'd1', rank: '5' as const, suit: 'diamonds' as const, faceUp: true }],
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

    // 1. P1 discards a card (simulated by openTapWindow with discarderIndex 0)
    store.openTapWindow(0);
    
    // 2. P1 tries to activate tap and select their own card
    store.activateTap();
    store.tapSelectCard('p1-c1');
    
    const state = useGameStore.getState();
    // Verify that the card was NOT selected
    expect(state.tapState?.selectedCardIds).not.toContain('p1-c1');
    expect(state.tapState?.selectedCardIds.length).toBe(0);
  });
});
