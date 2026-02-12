import { describe, test, expect, vi } from 'vitest';
import { botShouldCallKaboo, createBotMemory, botRememberCard } from '../../lib/botAI';
import type { Player, Card } from '../../types/game';

describe('Scenario 32: Bot Never Calls Kaboo (Conservative AI)', () => {
  test('Easy bot should not call Kaboo if uncertain or score above threshold', () => {
    const cards: Card[] = [
      { id: 'c1', rank: '5' as const, suit: 'hearts' as const, faceUp: false },
      { id: 'c2', rank: '8' as const, suit: 'diamonds' as const, faceUp: false },
      { id: 'c3', rank: '10' as const, suit: 'clubs' as const, faceUp: false },
      { id: 'c4', rank: '2' as const, suit: 'spades' as const, faceUp: false },
    ];
    
    const bot: Player = {
      id: 'bot1',
      name: 'Easy Bot',
      avatarColor: '#00FF00',
      cards: cards,
      score: 0,
      totalScore: 0,
      isHost: false,
      isReady: true
    };

    let memory = createBotMemory();
    // Bot knows only one card
    memory = botRememberCard(memory, 'c1', cards[0], 1);

    // Current turn 7 (min turn for easy is 6)
    // estimatedTotal = 5 (known) + 3*5 (unknown estimate for easy) = 20.
    // kabooPartialThreshold for easy is 3. 20 > 3 -> Should NOT call.
    
    vi.spyOn(Math, 'random').mockReturnValue(0); // Force success if it were to call
    
    expect(botShouldCallKaboo(bot, memory, 7, 'easy')).toBe(false);

    // Even if it knows all cards but they are high
    memory = botRememberCard(memory, 'c2', cards[1], 1);
    memory = botRememberCard(memory, 'c3', cards[2], 1);
    memory = botRememberCard(memory, 'c4', cards[3], 1);
    // estimatedTotal = 5+8+10+2 = 25.
    // kabooKnownAllThreshold for easy is 6. 25 > 6 -> Should NOT call.
    
    expect(botShouldCallKaboo(bot, memory, 7, 'easy')).toBe(false);

    vi.restoreAllMocks();
  });
});
