import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useOfflineStore, resetStore } from '@/store/offlineStore';
import { Rank, Suit, Card } from '@/types/game';

function createMockCard(rank: Rank, suit: Suit, id: string): Card {
  return { id, rank, suit, faceUp: false };
}

describe('Scenario 6: Empty Deck (Auto-Kaboo)', () => {
  beforeEach(() => {
    resetStore();
    vi.useFakeTimers();
  });

  it('should trigger Auto-Kaboo when the deck is exhausted at end of turn', () => {
    const store = useOfflineStore.getState();
    
    // Setup: 2 players, 1 card in drawPile
    store.updateSettings({ numPlayers: 2 });
    store.startOfflineGame();
    
    const lastCard = createMockCard('5', 'hearts', 'last-card');
    useOfflineStore.setState({
      gamePhase: 'playing',
      turnPhase: 'draw',
      drawPile: [lastCard],
      players: [
        { id: 'p1', name: 'Player 1', cards: [createMockCard('2', 'clubs', 'c1')], score: 0, totalScore: 0, avatarColor: '', isHost: true, isReady: true },
        { id: 'bot', name: 'Bot', cards: [createMockCard('3', 'diamonds', 'c2')], score: 0, totalScore: 0, avatarColor: '', isHost: false, isReady: true }
      ],
      currentPlayerIndex: 0
    });

    // 1. Player draws the final card
    store.drawCard();
    expect(useOfflineStore.getState().heldCard?.id).toBe('last-card');
    expect(useOfflineStore.getState().drawPile.length).toBe(0);

    // 2. Player discards it
    store.discardHeldCard();
    expect(useOfflineStore.getState().discardPile[useOfflineStore.getState().discardPile.length - 1].id).toBe('last-card');

    // 3. End turn - system should detect empty drawPile
    store.endTurn();

    expect(useOfflineStore.getState().gamePhase).toBe('reveal');
    expect(useOfflineStore.getState().kabooCalled).toBe(true);
    expect(useOfflineStore.getState().kabooCallerIndex).toBe(-1); // SYSTEM / Auto-Kaboo
  });
});
