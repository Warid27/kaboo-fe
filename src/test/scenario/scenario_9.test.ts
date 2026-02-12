import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useGameStore } from '@/store/gameStore';
import { resetStore } from '../testHelpers';
import { Rank, Suit, Card } from '@/types/game';

function createMockCard(rank: Rank, suit: Suit, id: string): Card {
  return { id, rank, suit, faceUp: false };
}

describe('Scenario 9: Kaboo Call with Tied Scores', () => {
  beforeEach(() => {
    resetStore();
    vi.useFakeTimers();
  });

  it('should penalize the Kaboo caller if they tie with another player', async () => {
    const store = useGameStore.getState();
    
    // Setup: 2 players with 10 points each
    // Player 1: [3, 2, 5] = 10
    // Bot: [4, 6] = 10
    const p1Cards = [
      createMockCard('3', 'hearts', 'p1-c1'),
      createMockCard('2', 'clubs', 'p1-c2'),
      createMockCard('5', 'spades', 'p1-c3'),
    ];
    const botCards = [
      createMockCard('4', 'diamonds', 'b1-c1'),
      createMockCard('6', 'hearts', 'b1-c2'),
    ];

    useGameStore.setState({
      gamePhase: 'playing',
      players: [
        { id: 'p1', name: 'Player 1', cards: p1Cards, score: 0, totalScore: 0, avatarColor: '', isHost: true, isReady: true },
        { id: 'bot', name: 'Bot', cards: botCards, score: 0, totalScore: 0, avatarColor: '', isHost: false, isReady: true }
      ],
      currentPlayerIndex: 0,
      settings: { ...useGameStore.getState().settings, targetScore: '100' }
    });

    // Player 1 calls Kaboo
    useGameStore.setState({
      kabooCalled: true,
      kabooCallerIndex: 0,
      gamePhase: 'kaboo_final',
      finalRoundTurnsLeft: 1
    });

    // Verify kabooCallerIndex is set
    expect(useGameStore.getState().kabooCallerIndex).toBe(0);

    // Final round proceeds... for this test we jump to reveal
    store.revealAllCards();

    const state = useGameStore.getState();
    // Player 1 score should be 10 + 20 (penalty) = 30
    expect(state.players[0].score).toBe(30);
    // Bot score should be 10
    expect(state.players[1].score).toBe(10);
  });
});
