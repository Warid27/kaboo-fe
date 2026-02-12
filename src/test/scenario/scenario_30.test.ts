import { describe, test, expect, beforeEach } from 'vitest';
import { useGameStore } from '../../store/gameStore';
import { resetStore } from '../testHelpers';

describe('Scenario 30: Multiple Offline Games Simultaneously (Multi-Tab)', () => {
  beforeEach(() => {
    resetStore();
    localStorage.clear();
  });

  test('Game state should not be persisted to localStorage (ensuring isolation between tabs)', () => {
    // 1. Setup: Start an offline game
    useGameStore.setState({
      gameMode: 'offline',
      gamePhase: 'playing',
      currentPlayerIndex: 0,
      players: [
        { id: 'p1', name: 'Player 1', avatarColor: '#FF0000', cards: [{ id: 'c1', rank: '5' as const, suit: 'hearts' as const, faceUp: false }], score: 0, totalScore: 0, isHost: true, isReady: true },
        { id: 'bot1', name: 'Bot', avatarColor: '#00FF00', cards: [], score: 0, totalScore: 0, isHost: false, isReady: true },
      ],
      settings: {
        numPlayers: 2,
        turnTimer: '30' as const,
        mattsPairsRule: true,
        useEffectCards: true,
        botDifficulty: 'medium' as const,
        targetScore: '100' as const,
      },
    });

    // 2. Check localStorage
    // Since we don't use persist middleware for gameStore, it should be empty (or at least not contain game state)
    const keys = Object.keys(localStorage);
    const gameKeys = keys.filter(k => k.includes('game') || k.includes('kaboo-state'));
    
    expect(gameKeys.length).toBe(0);
  });

  test('Independent store instances (simulated) should not interfere', () => {
    // Note: In our current setup, useGameStore is a singleton.
    // However, we can simulate multiple tabs by manually resetting and verifying state.
    
    // Tab 1 state
    useGameStore.setState({ playerName: 'Tab 1 Player' });
    expect(useGameStore.getState().playerName).toBe('Tab 1 Player');
    
    // Tab 2 "reloads" (resetStore)
    resetStore();
    expect(useGameStore.getState().playerName).not.toBe('Tab 1 Player');
  });
});
