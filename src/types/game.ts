import { z } from 'zod';

// ── Card Schemas ──

export const SuitSchema = z.enum(['hearts', 'diamonds', 'clubs', 'spades', 'joker']);
export type Suit = z.infer<typeof SuitSchema>;

export const RankSchema = z.enum(['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'joker']);
export type Rank = z.infer<typeof RankSchema>;

export const CardSchema = z.object({
  id: z.string(),
  suit: SuitSchema,
  rank: RankSchema,
  faceUp: z.boolean().default(false),
});
export type Card = z.infer<typeof CardSchema>;

// ── Player Schema ──

export const PlayerSchema = z.object({
  id: z.string(),
  name: z.string(),
  avatarColor: z.string(),
  cards: z.array(CardSchema),
  isHost: z.boolean().default(false),
  isReady: z.boolean().default(false),
  score: z.number().default(0),
  totalScore: z.number().default(0),
});
export type Player = z.infer<typeof PlayerSchema>;

// ── Game Settings ──

export const TimerOptionSchema = z.enum(['15', '30', '60']);
export type TimerOption = z.infer<typeof TimerOptionSchema>;

export const BotDifficultySchema = z.enum(['easy', 'medium', 'hard']);
export type BotDifficulty = z.infer<typeof BotDifficultySchema>;

export const TargetScoreSchema = z.enum(['50', '100', '150', '200']);
export type TargetScore = z.infer<typeof TargetScoreSchema>;

export const GameSettingsSchema = z.object({
  turnTimer: TimerOptionSchema.default('30'),
  mattsPairsRule: z.boolean().default(false),
  useEffectCards: z.boolean().default(true),
  numPlayers: z.number().min(2).max(8).default(4),
  botDifficulty: BotDifficultySchema.default('medium'),
  targetScore: TargetScoreSchema.default('100'),
});
export type GameSettings = z.infer<typeof GameSettingsSchema>;

// ── Game State Enums ──

export type Screen = 'home' | 'lobby' | 'game' | 'scoring';

export type GamePhase =
  | 'waiting'
  | 'dealing'
  | 'initial_look'
  | 'playing'
  | 'kaboo_final'
  | 'reveal';

export type TurnPhase =
  | 'draw'
  | 'action'
  | 'effect'
  | 'tap_window'
  | 'end_turn';

export type EffectType =
  | 'peek_own'
  | 'peek_opponent'
  | 'blind_swap'
  | 'semi_blind_swap'
  | 'full_vision_swap'
  | null;

// ── Game Action Schemas ──

export const GameActionSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('ready') }), // Signal finished peeking
  z.object({ type: z.literal('draw'), playerId: z.string() }),
  z.object({ type: z.literal('swap'), playerId: z.string(), playerCardId: z.string() }),
  z.object({ type: z.literal('discard'), playerId: z.string() }),
  z.object({ type: z.literal('peek'), playerId: z.string(), cardId: z.string() }),
  z.object({ type: z.literal('blind_swap'), playerId: z.string(), card1Id: z.string(), card2Id: z.string() }),
  z.object({ type: z.literal('tap'), playerId: z.string(), cardId: z.string() }),
  z.object({ type: z.literal('kaboo'), playerId: z.string() }),
  z.object({ type: z.literal('counter_kaboo'), playerId: z.string() }),
  z.object({ type: z.literal('end_turn'), playerId: z.string() }),
]);
export type GameAction = z.infer<typeof GameActionSchema>;

export interface FlyingCardEntry {
  id: string;
  card: Card;
  fromAnchor: string;
  toAnchor: string;
}

// ── Avatar Colors ──

export const AVATAR_COLORS = [
  'hsl(174 80% 42%)',   // teal
  'hsl(270 60% 55%)',   // purple
  'hsl(25 90% 55%)',    // orange
  'hsl(330 80% 58%)',   // pink
  'hsl(45 90% 55%)',    // gold
  'hsl(200 80% 50%)',   // blue
  'hsl(140 60% 45%)',   // green
  'hsl(0 75% 55%)',     // red
] as const;

export const MOCK_PLAYER_NAMES = [
  'Luna', 'Rex', 'Ziggy', 'Momo', 'Pip', 'Nova', 'Blix', 'Coco',
] as const;

// ── Turn Log ──

export interface TurnLogEntry {
  id: string;
  playerName: string;
  playerColor: string;
  message: string;
}

export interface TapState {
  phase: 'window' | 'selecting' | 'swapping';
  selectedCardIds: string[];
  swapTargets: number[];
  swapsRemaining: number;
  discarderIndex?: number;
}

// ── Game State ──
export interface RemotePlayer {
  id: string;
  name: string;
  cards?: Card[];
  score?: number;
  isReady?: boolean;
}

export interface GameState {
  roomCode: string;
  phase: string;
  turnPhase: string;
  currentTurnUserId: string;
  settings?: GameSettings;
  playerOrder: string[];
  players: Record<string, RemotePlayer>;
  deck?: Card[];
  discardPile?: Card[];
  drawnCard?: Card | null;
  pendingEffect?: {
    type: 'PEEK_OWN' | 'PEEK_OTHER' | 'SWAP_EITHER' | 'LOOK_AND_SWAP' | 'FULL_VISION_SWAP';
    sourceCardRank?: Rank;
  } | null;
  kabooCallerId?: string | null;
  turnsLeftAfterKaboo?: number | null;
}
