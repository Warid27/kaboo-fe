import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useGameStore } from '@/store/gameStore';
import { resetStore } from '../testHelpers';
import { Rank, Suit, Card } from '@/types/game';

function createMockCard(rank: Rank, suit: Suit, id: string): Card {
  return { id, rank, suit, faceUp: false };
}

describe('Scenario 11: The -2 Score (Negative Boundary)', () => {
  beforeEach(() => {
    resetStore();
    vi.useFakeTimers();
  });

  it('should calculate -2 score for a hand with 2 Jokers', () => {
    const store = useGameStore.getState();
    
    const joker1 = createMockCard('joker', 'joker', 'j1');
    const joker2 = createMockCard('joker', 'joker', 'j2');
    
    useGameStore.setState({
      players: [
        { 
          id: 'p1', 
          name: 'Player 1', 
          cards: [joker1, joker2], 
          score: 0, 
          totalScore: 0, 
          avatarColor: '', 
          isHost: true, 
          isReady: true 
        }
      ]
    });

    // We trigger the reveal/scoring logic
    store.revealAllCards();

    const state = useGameStore.getState();
    expect(state.players[0].score).toBe(-2);
  });
});
