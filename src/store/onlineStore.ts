import { create } from 'zustand';
import { 
  Card, Player, GameSettings, GamePhase, TurnPhase, 
  EffectType, TurnLogEntry, Screen, GameState, RemotePlayer,
  AVATAR_COLORS
} from '@/types/game';
import { gameApi, GameActionPayload } from '@/services/gameApi';
import { kabooSocket, WSMessage } from '@/services/kabooSocket';
import { toast } from '@/components/ui/use-toast';

interface OnlineStore {
  // Navigation & Connection
  screen: Screen;
  gameId: string;
  roomCode: string;
  myPlayerId: string;
  
  // Game State
  players: Player[];
  settings: GameSettings;
  gamePhase: GamePhase;
  turnPhase: TurnPhase;
  currentPlayerIndex: number;
  drawPile: Card[];
  discardPile: Card[];
  heldCard: Card | null;
  kabooCalled: boolean;
  kabooCallerIndex: number | null;
  finalRoundTurnsLeft: number;
  
  // UI state
  showKabooAnnouncement: boolean;
  isActionLocked: boolean;
  turnLog: TurnLogEntry[];
  effectType: EffectType | null;
  effectStep: 'select' | 'preview' | null;
  showEffectOverlay: boolean;

  // Actions
  setMyPlayerId: (id: string) => void;
  syncFromRemote: (state: GameState) => void;
  createGame: (playerName: string) => Promise<void>;
  joinGame: (roomCode: string, playerName: string) => Promise<void>;
  playMove: (action: GameActionPayload) => Promise<void>;
  leaveGame: () => Promise<void>;
  endGame: () => Promise<void>;
  toggleReady: () => Promise<void>;
  kickPlayer: (playerId: string) => Promise<void>;
  resetStore: () => void;
  updateSettings: (partial: Partial<GameSettings>) => Promise<void>;
  startGame: () => Promise<void>;
}

const INITIAL_ONLINE_STATE = {
  gameId: '',
  roomCode: '',
  players: [],
  settings: {
    turnTimer: '30',
    mattsPairsRule: false,
    useEffectCards: true,
    numPlayers: 4,
    botDifficulty: 'medium',
    targetScore: '100',
  } as GameSettings,
  gamePhase: 'waiting' as GamePhase,
  turnPhase: 'draw' as TurnPhase,
  currentPlayerIndex: 0,
  drawPile: [],
  discardPile: [],
  heldCard: null,
  kabooCalled: false,
  kabooCallerIndex: null,
  finalRoundTurnsLeft: 0,
  showKabooAnnouncement: false,
  isActionLocked: false,
  turnLog: [],
  effectType: null as EffectType | null,
  effectStep: null as 'select' | 'preview' | null,
  showEffectOverlay: false,
};

function actionToWSMsg(action: GameActionPayload): WSMessage {
  switch (action.type) {
    case 'INITIAL_PEEK': return { t: 'initial-peek', cardIndex: action.cardIndex! };
    case 'READY_TO_PLAY': return { t: 'ready' };
    case 'DRAW_FROM_DECK': return { t: 'draw-deck' };
    case 'DRAW_FROM_DISCARD': return { t: 'draw-discard' };
    case 'DISCARD_DRAWN': return { t: 'discard' };
    case 'SWAP_WITH_OWN': return { t: 'swap', cardIndex: action.cardIndex! };
    case 'CALL_KABOO': return { t: 'call-kaboo' };
    case 'SNAP': return { t: 'snap', cardIndex: action.cardIndex! };
    case 'PEEK_OWN': return { t: 'peek-own', cardIndex: action.cardIndex! };
    case 'SPY_OPPONENT': return { t: 'spy-opponent', targetPlayerId: action.targetPlayerId!, cardIndex: action.cardIndex! };
    case 'SWAP_ANY': return { t: 'swap-any', card1: action.card1!, card2: action.card2! };
    default: throw new Error(`Unknown action type: ${(action as any).type}`);
  }
}

export const useOnlineStore = create<OnlineStore>((set, get) => ({
  ...INITIAL_ONLINE_STATE,
  screen: 'home',
  myPlayerId: '',

  setMyPlayerId: (id) => set({ myPlayerId: id }),

  syncFromRemote: (remoteState: GameState) => {
    const { myPlayerId } = get();
    const rawOrder = remoteState.playerOrder || [];

    if (myPlayerId && !rawOrder.includes(myPlayerId)) {
      kabooSocket.disconnect();
      set({ ...INITIAL_ONLINE_STATE, screen: 'home' });
      return;
    }

    let rotatedOrder = [...rawOrder];
    const myIndex = rawOrder.indexOf(myPlayerId);
    if (myIndex > -1) {
      rotatedOrder = [...rawOrder.slice(myIndex), ...rawOrder.slice(0, myIndex)];
    }

    const players: Player[] = rotatedOrder.map((pid) => {
      const p = remoteState.players[pid] as RemotePlayer;
      const originalIndex = rawOrder.indexOf(pid);
      return {
        id: pid,
        name: p?.name || 'Unknown',
        avatarColor: AVATAR_COLORS[originalIndex % AVATAR_COLORS.length],
        cards: p?.cards || [],
        isHost: originalIndex === 0,
        isReady: p?.isReady || false,
        score: p?.score || 0,
        totalScore: p?.score || 0,
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

    // Map Effects
    let effectType: EffectType | null = null;
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

    // Determine correct screen
    let screen: Screen = 'lobby';
    if (gamePhase === 'waiting' || remotePhase === 'lobby') {
      screen = 'lobby';
    } else if (gamePhase === 'reveal' || remotePhase === 'scoring' || remotePhase === 'finished') {
      screen = 'scoring';
    } else {
      screen = 'game';
    }

    set({
      roomCode: remoteState.roomCode,
      players,
      settings: remoteState.settings || get().settings,
      currentPlayerIndex: rotatedOrder.indexOf(remoteState.currentTurnUserId),
      gamePhase,
      turnPhase,
      drawPile: remoteState.deck || [],
      discardPile: remoteState.discardPile || [],
      heldCard: remoteState.drawnCard || null,
      kabooCalled: !!remoteState.kabooCallerId,
      kabooCallerIndex: remoteState.kabooCallerId ? rotatedOrder.indexOf(remoteState.kabooCallerId) : null,
      finalRoundTurnsLeft: remoteState.turnsLeftAfterKaboo ?? 0,
      effectType,
      effectStep,
      showEffectOverlay,
      screen
    });
  },

  createGame: async (playerName) => {
    if (!playerName?.trim()) return;
    try {
      const me = await gameApi.getMe();
      if (me) set({ myPlayerId: me.userId });

      const { code } = await gameApi.createRoom();

      kabooSocket.on('state', (state) => get().syncFromRemote(state));
      kabooSocket.on('kicked', () => {
        toast({ title: 'Kicked from game', description: 'You have been removed', variant: 'destructive' });
        get().resetStore();
      });
      kabooSocket.on('error', (payload) => {
        toast({ title: 'Server error', description: payload.message, variant: 'destructive' });
      });
      kabooSocket.connect(code, get().myPlayerId);

      set({ roomCode: code, screen: 'lobby' });
    } catch (createError) {
      toast({
        title: 'Failed to create game',
        description: createError instanceof Error ? createError.message : 'Please try again.',
        variant: 'destructive',
      });
    }
  },

  joinGame: async (roomCode, playerName) => {
    if (!playerName?.trim()) return;
    try {
      const me = await gameApi.getMe();
      if (me) set({ myPlayerId: me.userId });

      await gameApi.joinRoom(roomCode);

      kabooSocket.on('state', (state) => get().syncFromRemote(state));
      kabooSocket.on('kicked', () => {
        toast({ title: 'Kicked from game', description: 'You have been removed', variant: 'destructive' });
        get().resetStore();
      });
      kabooSocket.on('error', (payload) => {
        toast({ title: 'Server error', description: payload.message, variant: 'destructive' });
      });
      kabooSocket.connect(roomCode, get().myPlayerId);

      set({ roomCode, screen: 'lobby' });
    } catch (joinError) {
      toast({
        title: 'Failed to join game',
        description: joinError instanceof Error ? joinError.message : 'Please try again.',
        variant: 'destructive',
      });
    }
  },

  playMove: async (action) => {
    const { roomCode } = get();
    if (!roomCode) return;
    set({ isActionLocked: true });
    try {
      kabooSocket.send(actionToWSMsg(action));
    } catch (error) {
      toast({
        title: 'Move failed',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      set({ isActionLocked: false });
    }
  },

  updateSettings: async (partial) => {
    const { settings } = get();
    const nextSettings = { ...settings, ...partial };
    set({ settings: nextSettings });
  },

  startGame: async () => {
    const { roomCode, screen } = get();
    if (!roomCode) return;
    if (screen !== 'game') {
      set({ screen: 'game' });
    }
    try {
      await gameApi.startRoom(roomCode);
    } catch {
      toast({ title: 'Failed to start game', variant: 'destructive' });
    }
  },

  toggleReady: async () => {
    const { roomCode, players, myPlayerId } = get();
    if (!roomCode) return;
    const me = players.find(p => p.id === myPlayerId);
    if (!me) return;
    try {
      await gameApi.readyRoom(roomCode);
    } catch {
      toast({ title: 'Failed to toggle ready state', variant: 'destructive' });
    }
  },

  kickPlayer: async (playerId) => {
    const { roomCode } = get();
    if (!roomCode) return;
    try {
      await gameApi.kickPlayer(roomCode, playerId);
    } catch {
      toast({ title: 'Failed to kick player', variant: 'destructive' });
    }
  },

  endGame: async () => {
    const { roomCode } = get();
    if (!roomCode) return;
    try {
      await gameApi.leaveRoom(roomCode);
      kabooSocket.disconnect();
      set({ ...INITIAL_ONLINE_STATE, screen: 'home' });
    } catch {
      toast({ title: 'Failed to end game', variant: 'destructive' });
    }
  },

  leaveGame: async () => {
    const { roomCode } = get();
    if (roomCode) await gameApi.leaveRoom(roomCode);
    kabooSocket.disconnect();
    set({ ...INITIAL_ONLINE_STATE, screen: 'home' });
  },

  resetStore: () => {
    kabooSocket.disconnect();
    set({ ...INITIAL_ONLINE_STATE, screen: 'home' });
  },
}));