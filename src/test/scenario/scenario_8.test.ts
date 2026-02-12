import { describe, test, expect, beforeEach, vi } from 'vitest';
import { useGameStore } from '../../store/gameStore';
import { createCard } from '../../lib/cardUtils';

describe('Scenario 8: Tap During Effect Resolution', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    const store = useGameStore.getState();
    store.resetGame();
  });

  test('should block Tap attempts during effect resolution UI', () => {
    const store = useGameStore.getState();

    // 1. Setup: Player discards a Jack (Blind Swap)
    const player1Cards = [createCard('5', 'hearts'), createCard('2', 'clubs')];
    const botCards = [createCard('10', 'diamonds')];

    useGameStore.setState({
      players: [
        { id: 'p1', name: 'Player 1', avatarColor: '#FF0000', cards: player1Cards, isHost: true, isReady: true, score: 0, totalScore: 0 },
        { id: 'bot', name: 'Bot', avatarColor: '#00FF00', cards: botCards, isHost: false, isReady: true, score: 0, totalScore: 0 },
      ],
      settings: { turnTimer: '30', mattsPairsRule: false, useEffectCards: true, numPlayers: 2, botDifficulty: 'medium', targetScore: '100' },
      gamePhase: 'playing',
      currentPlayerIndex: 0,
      drawPile: [createCard('J', 'spades')],
      discardPile: [createCard('5', 'spades')],
    });

    // 2. Player discards Jack, enters swap selection mode
    store.drawCard();
    store.discardHeldCard();
    
    let state = useGameStore.getState();
    expect(state.effectType).toBe('blind_swap');
    // The store automatically sets gamePhase to 'playing' but turnPhase to 'effect'
    // Let's check turnPhase instead of gamePhase if gamePhase is too broad
    expect(state.turnPhase).toBe('effect');

    // 3. Bot "discards" a 5 (simulated)
    // Actually, in our offline mode, bot turn won't trigger while effect is active.
    // But let's say a 5 appears on discard pile somehow.
    useGameStore.setState({
      discardPile: [...state.discardPile, createCard('5', 'clubs')],
    });

    // 4. Player tries to Tap while in effect mode
    // In our UI, the Tap button should be disabled.
    // In store, we should check if we can activate tap.
    store.activateTap();
    
    state = useGameStore.getState();
    // Tap should NOT be active because turnPhase is 'effect'
    expect(state.tapState).toBeNull();
  });
});
