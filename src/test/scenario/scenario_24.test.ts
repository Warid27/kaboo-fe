import { describe, test, expect, beforeEach, vi } from 'vitest';
import { useGameStore } from '../../store/gameStore';
import { resetStore } from '../testHelpers';
import { Rank, Suit } from '@/types/game';

function createCard(rank: Rank, suit: Suit, id?: string) {
  return { id: id || `${rank}-${suit}-${Math.random()}`, rank, suit, faceUp: false };
}

describe('Scenario 24: Bot Memory Corruption (Hard Mode)', () => {
  beforeEach(() => {
    resetStore();
    vi.useFakeTimers();
    
    // Setup: 1 Player, 1 Hard Bot
    useGameStore.setState({
      players: [
        {
          id: 'p1',
          name: 'Player 1',
          cards: [createCard('2', 'hearts'), createCard('3', 'hearts')],
          avatarColor: 'red',
          isHost: true,
          isReady: true,
          score: 0,
          totalScore: 0,
        },
        {
          id: 'bot1',
          name: 'Bot 1',
          cards: [
            { ...createCard('3', 'clubs'), id: 'bot-card-1' }, // Value 3
            { ...createCard('10', 'clubs'), id: 'bot-card-2' },
          ],
          avatarColor: 'blue',
          isHost: false,
          isReady: true,
          score: 0,
          totalScore: 0,
        },
      ],
      gamePhase: 'playing',
      currentPlayerIndex: 0,
      turnPhase: 'draw',
      settings: {
        numPlayers: 2,
        turnTimer: '30' as const,
        mattsPairsRule: true,
        useEffectCards: true,
        botDifficulty: 'hard' as const,
        targetScore: '100' as const,
      },
      botMemories: {
        'bot1': {
          knownCards: {
            'bot-card-1': { value: 3, turnLearned: 0 }, // Bot knows its first card is a 3
          }
        }
      },
      discardPile: [createCard('5', 'diamonds')],
      drawPile: [createCard('J', 'spades'), createCard('4', 'hearts')], // Jack for blind swap
    });
  });

  test('Bot should forget swapped positions after a blind swap', async () => {
    const store = useGameStore.getState();

    // 1. Player draws Jack
    await store.drawCard();
    expect(useGameStore.getState().heldCard?.rank).toBe('J');

    // 2. Player discards Jack to trigger blind swap
    await store.discardHeldCard();
    expect(useGameStore.getState().effectType).toBe('blind_swap');

    // 3. Player swaps Bot's card #1 and card #2 blindly
    await store.resolveEffect('bot-card-1');
    await store.resolveEffect('bot-card-2');
    await store.confirmEffect();

    const stateAfterSwap = useGameStore.getState();
    const botMemory = stateAfterSwap.botMemories['bot1'];

    // Expected: Bot should have forgotten BOTH card IDs involved in the blind swap
    expect(botMemory.knownCards['bot-card-1']).toBeUndefined();
    expect(botMemory.knownCards['bot-card-2']).toBeUndefined();

    // Verify positions in hand are actually swapped
    const bot = stateAfterSwap.players[1];
    expect(bot.cards[0].id).toBe('bot-card-2');
    expect(bot.cards[1].id).toBe('bot-card-1');

    // 4. End player's turn and let bot play
    store.endTurn();
    vi.runAllTimers();
    
    // Bot's turn starts. It should not "know" it has a 3 anymore.
    const stateBotTurn = useGameStore.getState();
    expect(stateBotTurn.currentPlayerIndex).toBe(1);
    
    // If bot knew it had a 3, it might decide to Kaboo or keep it.
    // But since it forgot, it will treat both as unknown (estimate 7 for hard bot).
  });
});
