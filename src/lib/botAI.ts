import type { Card, Player, EffectType, BotDifficulty } from '@/types/game';
import { getKabooCardValue, getEffectType } from '@/lib/cardUtils';

/** Tracks what each bot knows about cards on the table */
export interface BotMemory {
  /** Card IDs this bot has seen and remembers, mapped to their known value */
  knownCards: Record<string, number>;
}

export function createBotMemory(): BotMemory {
  return { knownCards: {} };
}

// ── Difficulty Config ──

interface DifficultyConfig {
  initialPeekCount: number;
  memoryReliability: number;
  lowCardSwapMax: number;
  effectUseChance: number;
  kabooMinTurn: number;
  kabooKnownAllThreshold: number;
  kabooPartialThreshold: number;
  tapChance: number;
  unknownCardEstimate: number;
}

const DIFFICULTY_CONFIGS: Record<BotDifficulty, DifficultyConfig> = {
  easy: {
    initialPeekCount: 1,
    memoryReliability: 0.6,
    lowCardSwapMax: 2,
    effectUseChance: 0.4,
    kabooMinTurn: 6,
    kabooKnownAllThreshold: 6,
    kabooPartialThreshold: 3,
    tapChance: 0.5,
    unknownCardEstimate: 5,
  },
  medium: {
    initialPeekCount: 2,
    memoryReliability: 1.0,
    lowCardSwapMax: 3,
    effectUseChance: 0.7,
    kabooMinTurn: 3,
    kabooKnownAllThreshold: 8,
    kabooPartialThreshold: 5,
    tapChance: 0.8,
    unknownCardEstimate: 6,
  },
  hard: {
    initialPeekCount: 2,
    memoryReliability: 1.0,
    lowCardSwapMax: 4,
    effectUseChance: 0.9,
    kabooMinTurn: 2,
    kabooKnownAllThreshold: 10,
    kabooPartialThreshold: 7,
    tapChance: 0.95,
    unknownCardEstimate: 7,
  },
};

function getConfig(difficulty: BotDifficulty): DifficultyConfig {
  return DIFFICULTY_CONFIGS[difficulty];
}

/** Apply memory reliability — easy bots may "forget" known cards */
function applyMemoryFilter(memory: BotMemory, config: DifficultyConfig): BotMemory {
  if (config.memoryReliability >= 1.0) return memory;
  const filtered: Record<string, number> = {};
  for (const [id, val] of Object.entries(memory.knownCards)) {
    if (Math.random() < config.memoryReliability) {
      filtered[id] = val;
    }
  }
  return { knownCards: filtered };
}

// ── Bot Functions ──

/** Bot peeks at cards during initial look */
export function botInitialPeek(bot: Player, difficulty: BotDifficulty = 'medium'): string[] {
  const config = getConfig(difficulty);
  return bot.cards.slice(0, config.initialPeekCount).map((c) => c.id);
}

/** Record that the bot saw a card's value */
export function botRememberCard(memory: BotMemory, cardId: string, card: Card): BotMemory {
  return {
    ...memory,
    knownCards: {
      ...memory.knownCards,
      [cardId]: getKabooCardValue(card),
    },
  };
}

/** Remove a card from memory (it was swapped or removed) */
export function botForgetCard(memory: BotMemory, cardId: string): BotMemory {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { [cardId]: _, ...rest } = memory.knownCards;
  return { knownCards: rest };
}

export interface BotDecision {
  action: 'swap' | 'discard';
  /** If swapping, which of the bot's own cards to replace */
  swapCardId?: string;
}

/** Bot decides what to do with the drawn card */
export function botDecideAction(
  bot: Player,
  drawnCard: Card,
  memory: BotMemory,
  difficulty: BotDifficulty = 'medium',
): BotDecision {
  const config = getConfig(difficulty);
  const effectiveMemory = applyMemoryFilter(memory, config);
  const drawnValue = getKabooCardValue(drawnCard);
  const effect = getEffectType(drawnCard.rank);

  // Find the worst known card in hand
  let worstKnownId: string | null = null;
  let worstKnownValue = -1;

  for (const card of bot.cards) {
    const known = effectiveMemory.knownCards[card.id];
    if (known !== undefined && known > worstKnownValue) {
      worstKnownValue = known;
      worstKnownId = card.id;
    }
  }

  // Very low card: swap with worst card
  if (drawnValue <= config.lowCardSwapMax) {
    if (worstKnownId && worstKnownValue > drawnValue) {
      return { action: 'swap', swapCardId: worstKnownId };
    }
    // Hard bots gamble on unknown cards more aggressively
    const unknownCards = bot.cards.filter((c) => effectiveMemory.knownCards[c.id] === undefined);
    if (unknownCards.length > 0 && (difficulty === 'hard' || drawnValue <= 1)) {
      return { action: 'swap', swapCardId: unknownCards[Math.floor(Math.random() * unknownCards.length)].id };
    }
    if (unknownCards.length > 0 && drawnValue <= 3) {
      return { action: 'swap', swapCardId: unknownCards[Math.floor(Math.random() * unknownCards.length)].id };
    }
    return { action: 'discard' };
  }

  // Low-medium card: swap if we know of a worse card
  if (drawnValue <= 6) {
    const threshold = difficulty === 'hard' ? 1 : 2;
    if (worstKnownId && worstKnownValue > drawnValue + threshold) {
      return { action: 'swap', swapCardId: worstKnownId };
    }
    return { action: 'discard' };
  }

  // Effect cards: decide based on difficulty
  if (effect) {
    if (Math.random() < config.effectUseChance || !worstKnownId || worstKnownValue <= 8) {
      return { action: 'discard' };
    }
    return { action: 'swap', swapCardId: worstKnownId };
  }

  // High non-effect card: discard
  return { action: 'discard' };
}

/** Bot decides whether to call KABOO at the start of its turn */
export function botShouldCallKaboo(
  bot: Player,
  memory: BotMemory,
  turnNumber: number,
  difficulty: BotDifficulty = 'medium',
): boolean {
  const config = getConfig(difficulty);
  if (turnNumber < config.kabooMinTurn) return false;

  const effectiveMemory = applyMemoryFilter(memory, config);

  let estimatedTotal = 0;
  let unknownCount = 0;

  for (const card of bot.cards) {
    const known = effectiveMemory.knownCards[card.id];
    if (known !== undefined) {
      estimatedTotal += known;
    } else {
      unknownCount++;
      estimatedTotal += config.unknownCardEstimate;
    }
  }

  // More aggressive if we know all our cards
  if (unknownCount === 0 && estimatedTotal <= config.kabooKnownAllThreshold) {
    const chance = difficulty === 'hard' ? 0.8 : difficulty === 'easy' ? 0.3 : 0.6;
    return Math.random() < chance;
  }

  // Conservative if we have unknown cards
  if (unknownCount <= 1 && estimatedTotal <= config.kabooPartialThreshold) {
    const chance = difficulty === 'hard' ? 0.5 : difficulty === 'easy' ? 0.1 : 0.3;
    return Math.random() < chance;
  }

  return false;
}

/** Bot decides which effect to resolve */
export function botResolveEffect(
  bot: Player,
  opponents: Player[],
  effectType: EffectType,
  memory: BotMemory,
  difficulty: BotDifficulty = 'medium',
): { targetCardIds: string[] } {
  const config = getConfig(difficulty);
  const effectiveMemory = applyMemoryFilter(memory, config);

  switch (effectType) {
    case 'peek_own': {
      const unknownCards = bot.cards.filter((c) => effectiveMemory.knownCards[c.id] === undefined);
      if (unknownCards.length > 0) {
        return { targetCardIds: [unknownCards[Math.floor(Math.random() * unknownCards.length)].id] };
      }
      return { targetCardIds: [bot.cards[0]?.id].filter(Boolean) };
    }

    case 'peek_opponent': {
      const opponent = opponents[Math.floor(Math.random() * opponents.length)];
      if (opponent && opponent.cards.length > 0) {
        const card = opponent.cards[Math.floor(Math.random() * opponent.cards.length)];
        return { targetCardIds: [card.id] };
      }
      return { targetCardIds: [] };
    }

    case 'blind_swap': {
      const worstOwn = bot.cards.reduce((worst, card) => {
        const val = effectiveMemory.knownCards[card.id] ?? config.unknownCardEstimate;
        const worstVal = effectiveMemory.knownCards[worst.id] ?? config.unknownCardEstimate;
        return val > worstVal ? card : worst;
      }, bot.cards[0]);

      const opponent = opponents[Math.floor(Math.random() * opponents.length)];
      const oppCard = opponent?.cards[Math.floor(Math.random() * (opponent?.cards.length ?? 0))];

      if (worstOwn && oppCard) {
        return { targetCardIds: [worstOwn.id, oppCard.id] };
      }
      return { targetCardIds: [] };
    }

    case 'semi_blind_swap':
    case 'full_vision_swap': {
      const worstOwn2 = bot.cards.reduce((worst, card) => {
        const val = effectiveMemory.knownCards[card.id] ?? config.unknownCardEstimate;
        const worstVal = effectiveMemory.knownCards[worst.id] ?? config.unknownCardEstimate;
        return val > worstVal ? card : worst;
      }, bot.cards[0]);

      const opp = opponents[Math.floor(Math.random() * opponents.length)];
      const oCard = opp?.cards[Math.floor(Math.random() * (opp?.cards.length ?? 0))];

      if (worstOwn2 && oCard) {
        return { targetCardIds: [worstOwn2.id, oCard.id] };
      }
      return { targetCardIds: [] };
    }

    default:
      return { targetCardIds: [] };
  }
}

/** Bot decides whether to tap during tap window */
export function botShouldTap(
  bot: Player,
  discardTopRank: string,
  memory: BotMemory,
  difficulty: BotDifficulty = 'medium',
): string | null {
  const config = getConfig(difficulty);
  for (const card of bot.cards) {
    const known = memory.knownCards[card.id];
    if (known !== undefined && card.rank === discardTopRank) {
      if (Math.random() < config.tapChance) {
        return card.id;
      }
    }
  }
  return null;
}
