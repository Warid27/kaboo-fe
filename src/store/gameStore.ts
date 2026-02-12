import type { RealtimeChannel } from '@supabase/supabase-js';
import { create } from 'zustand';
import {
  Screen, GamePhase, TurnPhase, EffectType,
  Card, Player, GameSettings, TurnLogEntry, TapState, GameState, RemotePlayer,
  AVATAR_COLORS
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
  gameId: string;
  syncFromRemote: (state: GameState) => void;
  setMyPlayerId: (id: string) => void;

  // Player
  playerName: string;
  myPlayerId: string;
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
  isActionLocked: boolean;

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
  resetGame: () => void;
  backToLobby: () => void;

  // Subscription
  subscription: RealtimeChannel | null;
  
  // Scoring
  roundScores: { playerId: string; score: number }[];
  matchOver: boolean;
  roundNumber: number;

  // Actions
  createGame: () => Promise<void>;
  endGame: () => Promise<void>;
  joinGame: (roomCode: string) => Promise<void>;
  toggleReady: () => Promise<void>;
  kickPlayer: (playerId: string) => Promise<void>;
  checkGameState: () => Promise<void>;
  startOffline: () => void;
  startGame: () => Promise<void>;
  readyToPlay: () => Promise<void>;
  peekCard: (cardId: string) => void;
  drawCard: () => Promise<void>;
  drawFromDiscard: () => Promise<void>;
  swapCard: (playerCardId: string) => Promise<void>;
  discardHeldCard: () => Promise<void>;
  discardPair: (cardId1: string, cardId2: string) => void;
  resolveEffect: (targetCardId: string) => Promise<void>;
  confirmEffect: () => Promise<void>;
  declineEffect: () => void;
  openTapWindow: (discarderIndex: number) => void;
  activateTap: () => void;
  tapSelectCard: (cardId: string) => void;
  confirmTapDiscard: () => Promise<void>;
  tapSwapCard: (ownCardId: string) => void;
  skipTapSwap: () => void;
  finalizeTap: () => void;
  callKaboo: (overrideCallerIndex?: number | null) => Promise<void>;
  endTurn: () => void;
  playAgain: () => void;
  exitToHome: () => void;
  selectCard: (cardId: string) => void;
  clearSelection: () => void;
  revealAllCards: () => void;
  simulateBotTurn: () => void;
  nextRound: () => void;
  setIsPaused: (paused: boolean) => void;
  lockAction: () => void;
  unlockAction: () => void;
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
  isActionLocked: false,
  botMemories: {} as Record<string, BotMemory>,
  kabooCalled: false,
  kabooCallerIndex: null as number | null,
  finalRoundTurnsLeft: 0,
  roundScores: [] as { playerId: string; score: number }[],
  turnLog: [] as TurnLogEntry[],
  flyingCards: [] as FlyingCardEntry[],
  subscription: null as RealtimeChannel | null,
  matchOver: false,
  roundNumber: 1,
};

let flyIdCounter = 0;

export const useGameStore = create<GameStore>((set, get) => ({
  // Initial state
  screen: 'home',
  gameMode: 'offline',
  gameId: '',
  playerName: '',
  myPlayerId: '',
  roomCode: '',
  players: [],
  settings: { turnTimer: '30', mattsPairsRule: false, useEffectCards: true, numPlayers: 4, botDifficulty: 'medium', targetScore: '100' },
  ...INITIAL_STATE,

  navigateTo: (screen) => set({ screen }),
  setPlayerName: (playerName) => set({ playerName }),
  setIsPaused: (isPaused) => set({ isPaused }),
  lockAction: () => set({ isActionLocked: true }),
  unlockAction: () => set({ isActionLocked: false }),
  syncFromRemote: (remoteState: GameState) => {
    // 1. Get current player ID (User ID)
    const { myPlayerId, gameMode, subscription } = get();
    
    // 2. Get raw order from backend
    const rawOrder = remoteState.playerOrder || [];

    // 3. Check if I am still in the game
    if (gameMode === 'online' && myPlayerId && !rawOrder.includes(myPlayerId)) {
        if (subscription) subscription.unsubscribe();
        set({
            ...INITIAL_STATE,
            screen: 'home',
            gameId: '',
            roomCode: '',
            players: [],
        });
        return;
    }
    
    // 4. Rotate order so "Me" is at index 0
    //    If myPlayerId is not in the list (e.g. spectator or error), keep original order
    let rotatedOrder = [...rawOrder];
    const myIndex = rawOrder.indexOf(myPlayerId);
    
    if (myIndex > -1) {
        rotatedOrder = [
            ...rawOrder.slice(myIndex),
            ...rawOrder.slice(0, myIndex)
        ];
    }
    
    // 4. Map Players based on Rotated Order
    const players: Player[] = rotatedOrder.map((pid: string, index: number) => {
      const p = remoteState.players[pid] as RemotePlayer;
      
      // Safety check for missing player data
      if (!p) {
          return {
              id: pid,
              name: 'Unknown',
              avatarColor: AVATAR_COLORS[index % AVATAR_COLORS.length],
              cards: [],
              isHost: false,
              isReady: false,
              score: 0,
              totalScore: 0
          };
      }

      // Use original index for consistent coloring across clients
      const originalIndex = rawOrder.indexOf(pid);
      const color = AVATAR_COLORS[originalIndex % AVATAR_COLORS.length];
      
      return {
        id: p.id,
        name: p.name,
        avatarColor: color, 
        cards: p.cards || [],
        isHost: originalIndex === 0, // Host is always the first in the RAW order (usually)
        isReady: p.isReady || false,
        score: p.score || 0,
        totalScore: p.score || 0
      };
    });

    // Map Phases
    let gamePhase: GamePhase = 'waiting';
    const remotePhase = remoteState.phase?.toLowerCase();
    
    if (remotePhase === 'playing') gamePhase = 'playing';
    if (remotePhase === 'peeking' || remotePhase === 'initial_look') gamePhase = 'initial_look';
    if (remotePhase === 'scoring' || remotePhase === 'finished') gamePhase = 'reveal';
    if (remotePhase === 'lobby') gamePhase = 'waiting';

    // Map Turn Phase
    let turnPhase: TurnPhase = 'draw';
    if (remoteState.turnPhase === 'action') turnPhase = 'action';
    if (remoteState.turnPhase === 'effect') turnPhase = 'effect';

    // Map Effect Type
    let effectType: EffectType = null;
    let showEffectOverlay = false;
    let effectStep: 'select' | 'preview' | null = null;

    if (turnPhase === 'effect' && remoteState.pendingEffect) {
        const remoteType = remoteState.pendingEffect.type;
        if (remoteType === 'PEEK_OWN') effectType = 'peek_own';
        else if (remoteType === 'PEEK_OTHER') effectType = 'peek_opponent';
        else if (remoteType === 'SWAP_EITHER') {
            effectType = 'blind_swap';
            effectStep = 'select';
        }
        else if (remoteType === 'LOOK_AND_SWAP') {
            effectType = 'semi_blind_swap';
            effectStep = 'select';
        }
        else if (remoteType === 'FULL_VISION_SWAP') {
            effectType = 'full_vision_swap';
            effectStep = 'select';
        }
        showEffectOverlay = true;
    }
    
    // Calculate indices based on Rotated Order
    const currentPlayerIndex = rotatedOrder.indexOf(remoteState.currentTurnUserId);
    const kabooCallerIndex = remoteState.kabooCallerId ? rotatedOrder.indexOf(remoteState.kabooCallerId) : null;

    // 5. Determine correct screen
    let screen: Screen = 'lobby';
    if (gamePhase === 'waiting' || remotePhase === 'lobby') {
        screen = 'lobby';
    } else if (gamePhase === 'reveal' || remotePhase === 'scoring' || remotePhase === 'finished') {
        screen = 'scoring';
    } else {
        screen = 'game';
    }

    set({
      gameMode: 'online',
      roomCode: remoteState.roomCode || get().roomCode,
      players,
      settings: remoteState.settings || get().settings,
      currentPlayerIndex: currentPlayerIndex === -1 ? 0 : currentPlayerIndex,
      gamePhase,
      turnPhase,
      effectType,
      effectStep,
      showEffectOverlay,
      
      drawPile: remoteState.deck || [],
      discardPile: remoteState.discardPile || [],
      heldCard: remoteState.drawnCard || null,
      
      kabooCalled: !!remoteState.kabooCallerId,
      kabooCallerIndex,
      finalRoundTurnsLeft: remoteState.turnsLeftAfterKaboo ?? 0,
      
      // Update screen based on derived logic
      screen
    });
  },
  setMyPlayerId: (id) => set({ myPlayerId: id }),

  resetGame: () => {
    set({ ...INITIAL_STATE });
  },

  backToLobby: () => {
    set({
      screen: 'lobby',
      ...INITIAL_STATE,
    });
  },

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
