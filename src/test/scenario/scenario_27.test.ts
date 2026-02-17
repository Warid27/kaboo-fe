import { describe, test, expect, beforeEach, vi } from 'vitest';
import { useOfflineStore } from '../../store/offlineStore';
import { resetStore } from '../../store/offlineStore';

describe('Scenario 27: Tab Switch During Bot Turn', () => {
  beforeEach(() => {
    resetStore();
    vi.useFakeTimers();
  });

  test('Bot turn should complete regardless of focus/timers', async () => {
    const store = useOfflineStore.getState();

    // Setup: 2 players, Bot's turn
    useOfflineStore.setState({
      players: [
        { id: 'p1', name: 'Player 1', avatarColor: '#FF0000', cards: [{ id: 'c1', rank: '5' as const, suit: 'hearts' as const, faceUp: false }], score: 0, totalScore: 0, isHost: true, isReady: true },
        { id: 'bot1', name: 'Bot', avatarColor: '#00FF00', cards: [{ id: 'c2', rank: '2' as const, suit: 'hearts' as const, faceUp: false }], score: 0, totalScore: 0, isHost: false, isReady: true },
      ],
      drawPile: [
        { id: 'd1', rank: 'A' as const, suit: 'hearts' as const, faceUp: false },
        { id: 'd2', rank: 'Q' as const, suit: 'hearts' as const, faceUp: false }
      ],
      gamePhase: 'playing',
      currentPlayerIndex: 1,
      turnPhase: 'draw',
      settings: {
        numPlayers: 2,
        botDifficulty: 'hard' as const,
        useEffectCards: false,
        turnTimer: '30' as const,
        mattsPairsRule: true,
        targetScore: '100' as const,
      },
    });

    // 1. Bot starts turn
    store.simulateBotTurn();
    
    // Phase should be 'action' after drawing
    expect(useOfflineStore.getState().turnPhase).toBe('action');
    expect(useOfflineStore.getState().heldCard).not.toBeNull();
    
    // Bot draws card immediately, then has a setTimeout for decision (1200ms)
    vi.advanceTimersByTime(1200);
    
    // Decision runs. It should set heldCard to null and set turnPhase to 'tap_window' after 800ms
    vi.advanceTimersByTime(800);
    
    expect(useOfflineStore.getState().turnPhase).toBe('tap_window');
    expect(useOfflineStore.getState().heldCard).toBeNull();
    
    // Now openTapWindow() is called.
    // openTapWindow sets a 3000ms timeout for finalizeTap().
    vi.advanceTimersByTime(3000);
    
    // Now finalizeTap() is called.
    // Since currentPlayerIndex is 1 (Bot), it calls endTurn() immediately.
    
    const state = useOfflineStore.getState();
    expect(state.currentPlayerIndex).toBe(0); // Back to Player 1
    expect(state.turnPhase).toBe('draw');
  });
});
