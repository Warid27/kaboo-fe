import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useGameStore } from '@/store/gameStore';
import { resetStore } from '../testHelpers';
import { Rank, Suit, Card } from '@/types/game';

function createMockCard(rank: Rank, suit: Suit, id: string): Card {
  return { id, rank, suit, faceUp: false };
}

describe('Scenario 10: Snap Penalty (Draw No Swap)', () => {
  beforeEach(() => {
    resetStore();
    vi.useFakeTimers();
  });

  it('should give a penalty card when Tapping incorrectly and NOT allow swapping it', async () => {
    const store = useGameStore.getState();
    
    const p1Card = createMockCard('2', 'hearts', 'p1-c1');
    const botCard = createMockCard('10', 'diamonds', 'bot-c1');
    const penaltyCard = createMockCard('K', 'spades', 'penalty-c');
    const topDiscard = createMockCard('5', 'clubs', 'discard-c');
    
    useGameStore.setState({
      gamePhase: 'playing',
      turnPhase: 'tap_window',
      tapState: { phase: 'window', selectedCardIds: [], swapTargets: [], swapsRemaining: 0 },
      players: [
        { id: 'p1', name: 'Player 1', cards: [p1Card], score: 0, totalScore: 0, avatarColor: '', isHost: true, isReady: true },
        { id: 'bot', name: 'Bot', cards: [botCard], score: 0, totalScore: 0, avatarColor: '', isHost: false, isReady: true }
      ],
      discardPile: [topDiscard],
      drawPile: [penaltyCard],
      currentPlayerIndex: 0
    });

    // 1. Activate Tap and select wrong card
    // Ensure tap window is open
    useGameStore.setState({ 
      turnPhase: 'tap_window', 
      tapState: { 
        phase: 'window', 
        discarderIndex: 1, 
        selectedCardIds: [], 
        swapTargets: [], 
        swapsRemaining: 0 
      } 
    });

    let state = useGameStore.getState();
    const botCardId = state.players[1].cards[0].id;
    store.activateTap();
    store.tapSelectCard(botCardId); // Bot's card (Rank 10) != Discard Rank 5
    await store.confirmTapDiscard();

    state = useGameStore.getState();
    // ✅ Penalty card should be added
    expect(state.players[0].cards.length).toBe(2);
    expect(state.players[0].cards).toContainEqual(expect.objectContaining({ id: 'penalty-c' }));
    
    // ✅ No swap phase should trigger (penalty === draw without swap)
    // In current implementation, finalizeTap is called immediately
    // For human players, finalizeTap sets turnPhase to 'end_turn'
    expect(state.tapState).toBeNull();
    expect(state.turnPhase).toBe('end_turn');
  });
});
