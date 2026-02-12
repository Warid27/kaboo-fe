import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useGameStore } from '@/store/gameStore';
import { resetStore } from '../testHelpers';
import { Rank, Suit, Card } from '@/types/game';

function createMockCard(rank: Rank, suit: Suit, id: string): Card {
  return { id, rank, suit, faceUp: false };
}

describe('Scenario 15: Queen Effect Expanded (Peek ANY)', () => {
  beforeEach(() => {
    resetStore();
    vi.useFakeTimers();
  });

  it('should allow peeking at ANY card (own or opponent) with Queen effect', () => {
    const store = useGameStore.getState();
    
    const p1Card = createMockCard('2', 'hearts', 'p1-c1');
    const botCard = createMockCard('5', 'spades', 'bot-c1');
    
    useGameStore.setState({
      gamePhase: 'playing',
      turnPhase: 'effect',
      effectType: 'semi_blind_swap',
      effectStep: 'select',
      players: [
        { id: 'p1', name: 'Player 1', cards: [p1Card], score: 0, totalScore: 0, avatarColor: '', isHost: true, isReady: true },
        { id: 'bot', name: 'Bot', cards: [botCard], score: 0, totalScore: 0, avatarColor: '', isHost: false, isReady: true }
      ],
      currentPlayerIndex: 0
    });

    // 1. Peek at OWN card
    store.resolveEffect('p1-c1');
    expect(useGameStore.getState().effectStep).toBe('preview');
    expect(useGameStore.getState().effectPreviewCardIds).toContain('p1-c1');

    // Reset for next check
    useGameStore.setState({ effectStep: 'select', effectPreviewCardIds: [] });

    // 2. Peek at OPPONENT card
    store.resolveEffect('bot-c1');
    expect(useGameStore.getState().effectStep).toBe('preview');
    expect(useGameStore.getState().effectPreviewCardIds).toContain('bot-c1');
  });
});
