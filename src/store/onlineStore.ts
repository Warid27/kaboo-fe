import { create } from 'zustand';
import { 
  Card, Player, GameSettings, GamePhase, TurnPhase, 
  EffectType, TurnLogEntry, Screen, GameState, RemotePlayer,
  AVATAR_COLORS
} from '@/types/game';
import { gameApi, GameActionPayload } from '@/services/gameApi';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';

interface OnlineStore {
  // Navigation & Connection
  screen: Screen;
  gameId: string;
  roomCode: string;
  myPlayerId: string;
  subscription: RealtimeChannel | null;
  
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
  subscription: null,
  effectType: null as EffectType | null,
  effectStep: null as 'select' | 'preview' | null,
  showEffectOverlay: false,
};

export const useOnlineStore = create<OnlineStore>((set, get) => ({
  ...INITIAL_ONLINE_STATE,
  screen: 'home',
  myPlayerId: '',

  setMyPlayerId: (id) => set({ myPlayerId: id }),

  syncFromRemote: (remoteState: GameState) => {
    const { myPlayerId, subscription } = get();
    const rawOrder = remoteState.playerOrder || [];

    if (myPlayerId && !rawOrder.includes(myPlayerId)) {
      if (subscription) subscription.unsubscribe();
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
      let { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        const { data, error: authError } = await supabase.auth.signInAnonymously();
        if (authError) throw authError;
        session = data.session;
      }
      
      if (session?.user?.id) {
        set({ myPlayerId: session.user.id });
      }

      const { gameId, roomCode } = await gameApi.createGame(playerName);
      
      const subscription = gameApi.subscribeToGame(
        gameId, 
        (state) => get().syncFromRemote(state),
        (subscriptionError) => {
          if (subscriptionError.message === 'You are not in this game') {
            toast({ title: 'Kicked from game', description: 'You have been removed', variant: 'destructive' });
            get().resetStore();
          }
        }
      );

      set({ gameId, roomCode, screen: 'lobby', subscription });
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
      let { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        const { data, error: authError } = await supabase.auth.signInAnonymously();
        if (authError) throw authError;
        session = data.session;
      }
      
      if (session?.user?.id) {
        set({ myPlayerId: session.user.id });
      }

      const { gameId } = await gameApi.joinGame(roomCode, playerName);
      
      const subscription = gameApi.subscribeToGame(
        gameId, 
        (state) => get().syncFromRemote(state),
        (subscriptionError) => {
          if (subscriptionError.message === 'You are not in this game') {
            toast({ title: 'Kicked from game', description: 'You have been removed', variant: 'destructive' });
            get().resetStore();
          }
        }
      );

      set({ gameId, roomCode, screen: 'lobby', subscription });
    } catch (joinError) {
      toast({
        title: 'Failed to join game',
        description: joinError instanceof Error ? joinError.message : 'Please try again.',
        variant: 'destructive',
      });
    }
  },

  playMove: async (action) => {
    const { gameId } = get();
    if (!gameId) return;
    set({ isActionLocked: true });
    try {
      await gameApi.playMove(gameId, action);
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
    const { gameId, settings } = get();
    if (!gameId) return;
    const nextSettings = { ...settings, ...partial };
    set({ settings: nextSettings });
    try {
      await gameApi.updateSettings(gameId, partial);
    } catch {
      toast({ title: 'Failed to update settings', variant: 'destructive' });
    }
  },

  startGame: async () => {
    const { gameId, screen } = get();
    if (!gameId) return;
    if (screen !== 'game') {
      set({ screen: 'game' });
    }
    try {
      await gameApi.startGame(gameId);
    } catch {
      toast({ title: 'Failed to start game', variant: 'destructive' });
    }
  },

  toggleReady: async () => {
    const { gameId, players, myPlayerId } = get();
    if (!gameId) return;
    const me = players.find(p => p.id === myPlayerId);
    if (!me) return;
    try {
      await gameApi.toggleReady(gameId, !me.isReady);
    } catch {
      toast({ title: 'Failed to toggle ready state', variant: 'destructive' });
    }
  },

  kickPlayer: async (playerId) => {
    const { gameId } = get();
    if (!gameId) return;
    try {
      await gameApi.kickPlayer(gameId, playerId);
    } catch {
      toast({ title: 'Failed to kick player', variant: 'destructive' });
    }
  },

  endGame: async () => {
    const { gameId } = get();
    if (!gameId) return;
    try {
      await gameApi.endGame(gameId);
    } catch {
      toast({ title: 'Failed to end game', variant: 'destructive' });
    }
  },

  leaveGame: async () => {
    const { gameId, subscription } = get();
    if (gameId) await gameApi.leaveGame(gameId);
    if (subscription) subscription.unsubscribe();
    set({ ...INITIAL_ONLINE_STATE, screen: 'home' });
  },

  resetStore: () => {
    const { subscription } = get();
    if (subscription) subscription.unsubscribe();
    set({ ...INITIAL_ONLINE_STATE, screen: 'home' });
  },
}));
