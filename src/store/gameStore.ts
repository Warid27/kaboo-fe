import { create } from 'zustand';
import type {
  Screen, GamePhase, TurnPhase, EffectType,
  Card, Player, GameSettings, TurnLogEntry, TapState,
} from '@/types/game';
import type { BotMemory } from '@/lib/botAI';
import { createLobbyActions } from './slices/lobbyActions';
import { createCardActions } from './slices/cardActions';
import { createEffectActions } from './slices/effectActions';
import { createTapActions } from './slices/tapActions';
import { createTurnActions } from './slices/turnActions';

type GameMode = 'online' | 'offline';

export interface FlyingCardEntry {
  id: string;
  card: Card;
  fromAnchor: string;
  toAnchor: string;
}

export interface GameStore {
  // Navigation
  screen: Screen;
  navigateTo: (screen: Screen) => void;

  // Mode
  gameMode: GameMode;

  // Player
  playerName: string;
  setPlayerName: (name: string) => void;

  // Lobby
  roomCode: string;
  players: Player[];
  settings: GameSettings;
  updateSettings: (settings: Partial<GameSettings>) => void;

  // Game state
  gamePhase: GamePhase;
  turnPhase: TurnPhase;
  currentPlayerIndex: number;
  drawPile: Card[];
  discardPile: Card[];
  heldCard: Card | null;
  effectType: EffectType;
  effectStep: 'select' | 'preview' | null;
  effectPreviewCardIds: string[];
  effectTimeRemaining: number;
  turnTimeRemaining: number;
  initialLooksRemaining: number;
  turnNumber: number;

  // UI state
  selectedCards: string[];
  peekedCards: string[];
  memorizedCards: string[];
  tapState: TapState | null;
  penaltySkipTurn: boolean;
  showKabooAnnouncement: boolean;
  showEffectOverlay: boolean;
  dealtCardIds: string[];
  isPaused: boolean;

  // Bot state
  botMemories: Record<string, BotMemory>;

  // KABOO
  kabooCalled: boolean;
  kabooCallerIndex: number | null;
  finalRoundTurnsLeft: number;

  // Turn log
  turnLog: TurnLogEntry[];

  // Card animations
  flyingCards: FlyingCardEntry[];
  addFlyingCard: (card: Card, fromAnchor: string, toAnchor: string) => void;
  removeFlyingCard: (id: string) => void;

  // Scoring
  roundScores: { playerId: string; score: number }[];
  matchOver: boolean;
  roundNumber: number;

  // Actions
  createGame: () => void;
  joinGame: () => void;
  startOffline: () => void;
  startGame: () => void;
  peekCard: (cardId: string) => void;
  drawCard: () => void;
  swapCard: (playerCardId: string) => void;
  discardHeldCard: () => void;
  discardPair: (cardId1: string, cardId2: string) => void;
  resolveEffect: (targetCardId: string) => void;
  confirmEffect: () => void;
  declineEffect: () => void;
  openTapWindow: () => void;
  activateTap: () => void;
  tapSelectCard: (cardId: string) => void;
  confirmTapDiscard: () => void;
  tapSwapCard: (ownCardId: string) => void;
  skipTapSwap: () => void;
  finalizeTap: () => void;
  callKaboo: () => void;
  endTurn: () => void;
  playAgain: () => void;
  backToLobby: () => void;
  selectCard: (cardId: string) => void;
  clearSelection: () => void;
  revealAllCards: () => void;
  simulateBotTurn: () => void;
  setIsPaused: (paused: boolean) => void;
}

export const INITIAL_STATE = {
  gamePhase: 'waiting' as GamePhase,
  turnPhase: 'draw' as TurnPhase,
  currentPlayerIndex: 0,
  drawPile: [] as Card[],
  discardPile: [] as Card[],
  heldCard: null as Card | null,
  effectType: null as EffectType,
  effectStep: null as 'select' | 'preview' | null,
  effectPreviewCardIds: [] as string[],
  effectTimeRemaining: 10,
  turnTimeRemaining: 30,
  initialLooksRemaining: 2,
  turnNumber: 0,
  selectedCards: [] as string[],
  peekedCards: [] as string[],
  memorizedCards: [] as string[],
  tapState: null as TapState | null,
  penaltySkipTurn: false,
  showKabooAnnouncement: false,
  showEffectOverlay: false,
  dealtCardIds: [] as string[],
  isPaused: false,
  botMemories: {} as Record<string, BotMemory>,
  kabooCalled: false,
  kabooCallerIndex: null as number | null,
  finalRoundTurnsLeft: 0,
  roundScores: [] as { playerId: string; score: number }[],
  turnLog: [] as TurnLogEntry[],
  flyingCards: [] as FlyingCardEntry[],
  matchOver: false,
  roundNumber: 1,
};

let flyIdCounter = 0;

export const useGameStore = create<GameStore>((set, get) => ({
  // Initial state
  screen: 'home',
  gameMode: 'offline',
  playerName: '',
  roomCode: '',
  players: [],
  settings: { turnTimer: '30', mattsPairsRule: false, useEffectCards: true, numPlayers: 4, botDifficulty: 'medium', targetScore: '100' },
  ...INITIAL_STATE,

  navigateTo: (screen) => set({ screen }),
  setPlayerName: (playerName) => set({ playerName }),
  setIsPaused: (isPaused) => set({ isPaused }),

  addFlyingCard: (card, fromAnchor, toAnchor) => {
    const id = `fly-${++flyIdCounter}`;
    set((state) => ({
      flyingCards: [...state.flyingCards, { id, card, fromAnchor, toAnchor }],
    }));
  },

  removeFlyingCard: (id) =>
    set((state) => ({
      flyingCards: state.flyingCards.filter((fc) => fc.id !== id),
    })),

  // Compose all slices
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ...createLobbyActions(set as any, get),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ...createCardActions(set as any, get),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ...createEffectActions(set as any, get),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ...createTapActions(set as any, get),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ...createTurnActions(set as any, get),
}));
