import { describe, test, expect, beforeEach, vi } from 'vitest';
import { resetStore } from '../../store/offlineStore';
import { applyMemoryFilter, createBotMemory, botRememberCard } from '../../lib/botAI';

describe('Scenario 35: Bot Memory Decay (Easy Mode Over Time)', () => {
  beforeEach(() => {
    resetStore();
    vi.useFakeTimers();
  });

  test('Easy bot should forget a peeked card after 10 turns', async () => {
    const config = {
      initialPeekCount: 1,
      memoryReliability: 1.0, // Set to 1.0 for testing decay specifically
      memoryDecayTurns: 10,
      lowCardSwapMax: 2,
      effectUseChance: 0.4,
      kabooMinTurn: 6,
      kabooKnownAllThreshold: 6,
      kabooPartialThreshold: 3,
      tapChance: 0.5,
      tapMinDelay: 2000,
      tapMaxDelay: 3000,
      unknownCardEstimate: 5,
    };

    let memory = createBotMemory();
    const card6 = { id: 'p1-c1', rank: '6' as const, suit: 'hearts' as const, faceUp: false };
    
    // 1. Bot learns the card at Turn 5
    memory = botRememberCard(memory, 'p1-c1', card6, 5);
    expect(memory.knownCards['p1-c1']).toBeDefined();

    // 2. Advance to Turn 10 (5 turns since learned) - Should still remember
    let filtered = applyMemoryFilter(memory, config, 10);
    expect(filtered.knownCards['p1-c1']).toBeDefined();

    // 3. Advance to Turn 15 (10 turns since learned) - Threshold is inclusive?
    // In our code: if (currentTurn - info.turnLearned > config.memoryDecayTurns) continue;
    // 15 - 5 = 10. 10 is not > 10. So it should still remember at Turn 15.
    filtered = applyMemoryFilter(memory, config, 15);
    expect(filtered.knownCards['p1-c1']).toBeDefined();

    // 4. Advance to Turn 16 (11 turns since learned) - Should forget
    // 16 - 5 = 11. 11 > 10.
    filtered = applyMemoryFilter(memory, config, 16);
    expect(filtered.knownCards['p1-c1']).toBeUndefined();
  });

  test('Hard bot should NEVER forget', () => {
    const config = {
      initialPeekCount: 2,
      memoryReliability: 1.0,
      memoryDecayTurns: null, // Hard bot never forgets
      lowCardSwapMax: 4,
      effectUseChance: 0.9,
      kabooMinTurn: 2,
      kabooKnownAllThreshold: 10,
      kabooPartialThreshold: 7,
      tapChance: 0.95,
      tapMinDelay: 200,
      tapMaxDelay: 800,
      unknownCardEstimate: 7,
    };

    let memory = createBotMemory();
    const card6 = { id: 'p1-c1', rank: '6' as const, suit: 'hearts' as const, faceUp: false };
    
    // 1. Bot learns at Turn 1
    memory = botRememberCard(memory, 'p1-c1', card6, 1);
    
    // 2. Advance 100 turns
    const filtered = applyMemoryFilter(memory, config, 101);
    expect(filtered.knownCards['p1-c1']).toBeDefined();
  });
});
