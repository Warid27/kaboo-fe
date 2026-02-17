import { describe, test, expect, beforeEach, vi } from 'vitest';
import { useOfflineStore, resetStore } from '../../store/offlineStore';
import { createCard } from '../../lib/cardUtils';

describe('Scenario 8: Tap During Effect Resolution', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetStore();
  });

  test('should block Tap attempts during effect resolution UI', () => {
    const store = useOfflineStore.getState();

    // 1. Setup: Player discards a Jack (Blind Swap)
    const player1Cards = [createCard('5', 'hearts'), createCard('2', 'clubs')];
    const botCards = [createCard('10', 'diamonds')];

    useOfflineStore.setState({
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
    
    let state = useOfflineStore.getState();
    expect(state.effectType).toBe('blind_swap');
    expect(state.turnPhase).toBe('effect');

    // 3. Bot "discards" a 5 (simulated)
    useOfflineStore.setState({
      discardPile: [...state.discardPile, createCard('5', 'clubs')],
    });

    // 4. Player tries to Tap while in effect mode
    store.activateTap();
    
    state = useOfflineStore.getState();
    // Tap should NOT be active because turnPhase is 'effect'
    expect(state.tapState).toBeNull();
  });
});
