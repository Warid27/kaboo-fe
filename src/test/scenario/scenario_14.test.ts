import { describe, test, expect, beforeEach, vi } from 'vitest';
import { useGameStore } from '../../store/gameStore';
import { createCard } from '../../lib/cardUtils';

describe('Scenario 14: King Effect on Last Two Cards', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    const store = useGameStore.getState();
    store.resetGame();
  });

  test('should handle King effect when only two cards remain on table', () => {
    const store = useGameStore.getState();

    // 1. Setup: Each player has 1 card
    const player1Cards = [createCard('10', 'hearts')];
    const botCards = [createCard('2', 'diamonds')];

    useGameStore.setState({
      players: [
        { id: 'p1', name: 'Player 1', avatarColor: '#FF0000', cards: player1Cards, isHost: true, isReady: true, score: 0, totalScore: 0 },
        { id: 'bot', name: 'Bot', avatarColor: '#00FF00', cards: botCards, isHost: false, isReady: true, score: 0, totalScore: 0 },
      ],
      settings: { turnTimer: '30', mattsPairsRule: false, useEffectCards: true, numPlayers: 2, botDifficulty: 'medium', targetScore: '100' },
      gamePhase: 'playing',
      currentPlayerIndex: 0,
      drawPile: [createCard('K', 'hearts')], // Red King (Effect: Full Vision Swap)
      discardPile: [createCard('5', 'clubs')],
    });

    // 2. Player draws King and discards it
    store.drawCard();
    store.discardHeldCard();
    
    let state = useGameStore.getState();
    expect(state.effectType).toBe('full_vision_swap');
    
    // 3. Player uses King effect: Peek and Swap the only two cards
    store.resolveEffect(player1Cards[0].id);
    store.resolveEffect(botCards[0].id);
    
    state = useGameStore.getState();
    expect(state.effectPreviewCardIds).toContain(player1Cards[0].id);
    expect(state.effectPreviewCardIds).toContain(botCards[0].id);
    
    store.confirmEffect();
    
    state = useGameStore.getState();
    expect(state.players[0].cards[0].rank).toBe('2');
    expect(state.players[1].cards[0].rank).toBe('10');
  });
});
