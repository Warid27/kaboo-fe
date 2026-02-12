import { describe, test, expect, vi } from 'vitest';
import { botShouldCallKaboo, createBotMemory, botRememberCard } from '../../lib/botAI';
import type { Player, Card } from '../../types/game';

describe('Scenario 33: Bot Instant Kaboo (Aggressive AI)', () => {
  test('Hard bot should call Kaboo if it knows its score is very low', () => {
    // In our system, Ranks are 'A', '2', '3'..., 'J', 'Q', 'K', 'Joker'.
    // Red King (King of Hearts/Diamonds) is 0.
    // Joker is -1.
    
    const lowCards: Card[] = [
      { id: 'c1', rank: 'K' as const, suit: 'hearts' as const, faceUp: false }, // 0
      { id: 'c2', rank: 'A' as const, suit: 'diamonds' as const, faceUp: false }, // 1
      { id: 'c3', rank: '2' as const, suit: 'clubs' as const, faceUp: false }, // 2
      { id: 'c4', rank: 'K' as const, suit: 'diamonds' as const, faceUp: false }, // 0
    ];

    const bot: Player = {
      id: 'bot1',
      name: 'Hard Bot',
      avatarColor: '#00FF00',
      cards: lowCards,
      score: 0,
      totalScore: 0,
      isHost: false,
      isReady: true
    };

    let memory = createBotMemory();
    // Hard bot knows all cards
    memory = botRememberCard(memory, 'c1', lowCards[0], 1);
    memory = botRememberCard(memory, 'c2', lowCards[1], 1);
    memory = botRememberCard(memory, 'c3', lowCards[2], 1);
    memory = botRememberCard(memory, 'c4', lowCards[3], 1);

    // Turn 2 (min turn for hard is 2)
    // estimatedTotal = 0 + 1 + 2 + 0 = 3.
    // kabooKnownAllThreshold for hard is 10. 3 <= 10 -> Should call!
    
    vi.spyOn(Math, 'random').mockReturnValue(0.1); // Success (chance 0.8 for hard)
    
    expect(botShouldCallKaboo(bot, memory, 2, 'hard')).toBe(true);

    vi.restoreAllMocks();
  });
});
