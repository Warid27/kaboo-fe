import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useGameStore } from '@/store/gameStore';
import { resetStore } from '../testHelpers';
import { Rank, Suit, Card } from '@/types/game';

function createMockCard(rank: Rank, suit: Suit, id: string): Card {
  return { id, rank, suit, faceUp: false };
}

describe('Scenario 16: Jack/Queen/King All-to-All Swaps', () => {
  beforeEach(() => {
    resetStore();
    vi.useFakeTimers();
  });

  it('should allow Opponent-to-Opponent swaps with Jack effect', () => {
    const store = useGameStore.getState();
    
    const bot1Card = createMockCard('3', 'hearts', 'b1-c1');
    const bot2Card = createMockCard('9', 'spades', 'b2-c1');
    
    useGameStore.setState({
      gamePhase: 'playing',
      turnPhase: 'effect',
      effectType: 'blind_swap',
      players: [
        { id: 'p1', name: 'Player 1', cards: [], score: 0, totalScore: 0, avatarColor: '', isHost: true, isReady: true },
        { id: 'bot1', name: 'Bot 1', cards: [bot1Card], score: 0, totalScore: 0, avatarColor: '', isHost: false, isReady: true },
        { id: 'bot2', name: 'Bot 2', cards: [bot2Card], score: 0, totalScore: 0, avatarColor: '', isHost: false, isReady: true }
      ],
      currentPlayerIndex: 0,
      selectedCards: []
    });

    // Select two opponent cards
    store.resolveEffect('b1-c1');
    store.resolveEffect('b2-c1');
    
    expect(useGameStore.getState().selectedCards).toContain('b1-c1');
    expect(useGameStore.getState().selectedCards).toContain('b2-c1');

    // Confirm swap
    store.confirmEffect();

    const state = useGameStore.getState();
    expect(state.players[1].cards[0].id).toBe('b2-c1');
    expect(state.players[2].cards[0].id).toBe('b1-c1');
  });
});
