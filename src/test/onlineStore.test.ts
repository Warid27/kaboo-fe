import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useOnlineStore } from '@/store/onlineStore';
import type { GameState } from '@/types/game';
import { supabase } from '@/lib/supabase';
import { gameApi } from '@/services/gameApi';
import { toast } from '@/components/ui/use-toast';

vi.mock('@/services/gameApi', () => ({
  gameApi: {
    createGame: vi.fn(),
    joinGame: vi.fn(),
    playMove: vi.fn(),
    updateSettings: vi.fn(),
    startGame: vi.fn(),
    toggleReady: vi.fn(),
    leaveGame: vi.fn(),
    endGame: vi.fn(),
    kickPlayer: vi.fn(),
    subscribeToGame: vi.fn(),
  },
}));

vi.mock('@/components/ui/use-toast', () => ({
  toast: vi.fn(),
}));

describe('onlineStore core state and syncFromRemote', () => {
  beforeEach(() => {
    useOnlineStore.setState((state) => ({
      ...state,
      screen: 'home',
      gameId: '',
      roomCode: '',
      myPlayerId: '',
      players: [],
      settings: {
        turnTimer: '30',
        mattsPairsRule: false,
        useEffectCards: true,
        numPlayers: 4,
        botDifficulty: 'medium',
        targetScore: '100',
      },
      gamePhase: 'waiting',
      turnPhase: 'draw',
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
      effectType: null,
      effectStep: null,
      showEffectOverlay: false,
    }));
    vi.restoreAllMocks();
  });

  it('exposes the expected initial state shape', () => {
    const state = useOnlineStore.getState();

    expect(state.screen).toBe('home');
    expect(state.gameId).toBe('');
    expect(state.roomCode).toBe('');
    expect(state.myPlayerId).toBe('');
    expect(state.players).toEqual([]);
    expect(state.settings).toEqual({
      turnTimer: '30',
      mattsPairsRule: false,
      useEffectCards: true,
      numPlayers: 4,
      botDifficulty: 'medium',
      targetScore: '100',
    });
    expect(state.gamePhase).toBe('waiting');
    expect(state.turnPhase).toBe('draw');
    expect(state.currentPlayerIndex).toBe(0);
    expect(state.kabooCalled).toBe(false);
    expect(state.effectType).toBeNull();
    expect(state.effectStep).toBeNull();
    expect(state.showEffectOverlay).toBe(false);
  });

  it('resetStore clears state and unsubscribes from subscription', () => {
    const unsubscribe = vi.fn();

    useOnlineStore.setState({
      ...useOnlineStore.getState(),
      screen: 'game',
      gameId: 'game-1',
      roomCode: 'ABCD',
      myPlayerId: 'me',
      players: [
        {
          id: 'me',
          name: 'Me',
          avatarColor: '#fff',
          cards: [],
          isHost: true,
          isReady: true,
          score: 0,
          totalScore: 0,
        },
      ],
      subscription: { unsubscribe } as any,
    });

    useOnlineStore.getState().resetStore();

    const state = useOnlineStore.getState();
    expect(unsubscribe).toHaveBeenCalledTimes(1);
    expect(state.screen).toBe('home');
    expect(state.gameId).toBe('');
    expect(state.roomCode).toBe('');
    expect(state.players).toEqual([]);
  });

  it('syncFromRemote rotates players so current user is index 0 and maps fields', () => {
    useOnlineStore.setState({
      ...useOnlineStore.getState(),
      myPlayerId: 'p2',
    });

    const remoteState: GameState = {
      roomCode: 'ROOM',
      phase: 'playing',
      turnPhase: 'action',
      currentTurnUserId: 'p2',
      settings: {
        turnTimer: '60',
        mattsPairsRule: true,
        useEffectCards: true,
        numPlayers: 3,
        botDifficulty: 'hard',
        targetScore: '150',
      },
      playerOrder: ['p1', 'p2', 'p3'],
      players: {
        p1: { id: 'p1', name: 'Alice', score: 10 },
        p2: { id: 'p2', name: 'Bob', score: 20 },
        p3: { id: 'p3', name: 'Cara', score: 30 },
      },
      deck: [],
      discardPile: [],
      drawnCard: null,
      pendingEffect: null,
      kabooCallerId: null,
      turnsLeftAfterKaboo: null,
    };

    useOnlineStore.getState().syncFromRemote(remoteState);

    const state = useOnlineStore.getState();

    expect(state.roomCode).toBe('ROOM');
    expect(state.players.map((p) => p.id)).toEqual(['p2', 'p3', 'p1']);
    expect(state.players[0].id).toBe('p2');
    expect(state.currentPlayerIndex).toBe(0);
    expect(state.settings.turnTimer).toBe('60');
    expect(state.gamePhase).toBe('playing');
    expect(state.turnPhase).toBe('action');
    expect(state.screen).toBe('game');
  });

  it('syncFromRemote maps effect fields when pendingEffect present', () => {
    useOnlineStore.setState({
      ...useOnlineStore.getState(),
      myPlayerId: 'p1',
    });

    const remoteState: GameState = {
      roomCode: 'ROOM_EFFECT',
      phase: 'playing',
      turnPhase: 'effect',
      currentTurnUserId: 'p2',
      settings: undefined,
      playerOrder: ['p1', 'p2'],
      players: {
        p1: { id: 'p1', name: 'Alice' },
        p2: { id: 'p2', name: 'Bob' },
      },
      deck: [],
      discardPile: [],
      drawnCard: null,
      pendingEffect: {
        type: 'SWAP_EITHER',
      },
      kabooCallerId: null,
      turnsLeftAfterKaboo: null,
    };

    useOnlineStore.getState().syncFromRemote(remoteState);

    const state = useOnlineStore.getState();
    expect(state.effectType).toBe('blind_swap');
    expect(state.effectStep).toBe('select');
    expect(state.showEffectOverlay).toBe(true);
  });

  it('syncFromRemote handles missing playerOrder without crashing', () => {
    useOnlineStore.setState({
      ...useOnlineStore.getState(),
      myPlayerId: 'p1',
    });

    const remoteState = {
      roomCode: 'ROOM2',
      phase: 'lobby',
      turnPhase: 'draw',
      currentTurnUserId: 'p1',
      players: {
        p1: { id: 'p1', name: 'Solo' },
      },
      deck: [],
      discardPile: [],
      drawnCard: null,
    } as unknown as GameState;

    useOnlineStore.getState().syncFromRemote(remoteState);

    const state = useOnlineStore.getState();
    expect(state.players.length).toBe(0);
  });

  it('syncFromRemote resets store and unsubscribes when myPlayerId not in playerOrder', () => {
    const unsubscribe = vi.fn();

    useOnlineStore.setState({
      ...useOnlineStore.getState(),
      myPlayerId: 'ghost',
      subscription: { unsubscribe } as any,
    });

    const remoteState: GameState = {
      roomCode: 'ROOM3',
      phase: 'playing',
      turnPhase: 'draw',
      currentTurnUserId: 'p1',
      settings: undefined,
      playerOrder: ['p1', 'p2'],
      players: {
        p1: { id: 'p1', name: 'Alice' },
        p2: { id: 'p2', name: 'Bob' },
      },
      deck: [],
      discardPile: [],
      drawnCard: null,
      pendingEffect: null,
      kabooCallerId: null,
      turnsLeftAfterKaboo: null,
    };

    useOnlineStore.getState().syncFromRemote(remoteState);

    const state = useOnlineStore.getState();
    expect(unsubscribe).toHaveBeenCalledTimes(1);
    expect(state.screen).toBe('home');
    expect(state.gameId).toBe('');
    expect(state.roomCode).toBe('');
    expect(state.players).toEqual([]);
  });
});

describe('onlineStore actions', () => {
  beforeEach(() => {
    useOnlineStore.setState((state) => ({
      ...state,
      screen: 'home',
      gameId: '',
      roomCode: '',
      myPlayerId: '',
      players: [],
      subscription: null,
    }));
    vi.restoreAllMocks();
  });

  it('createGame uses existing session and sets myPlayerId, state, and subscription', async () => {
    const session = { user: { id: 'user-1' } } as any;

    vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
      data: { session },
      error: null,
    } as any);

    const createMock = vi.mocked(gameApi.createGame);
    const subscribeMock = vi.mocked(gameApi.subscribeToGame);

    createMock.mockResolvedValue({ gameId: 'g-1', roomCode: 'ABCD' } as any);
    subscribeMock.mockReturnValue({ unsubscribe: vi.fn() } as any);

    const store = useOnlineStore.getState();
    await store.createGame('Player');

    const state = useOnlineStore.getState();

    expect(supabase.auth.getSession).toHaveBeenCalledTimes(1);
    expect(state.myPlayerId).toBe('user-1');
    expect(createMock).toHaveBeenCalledWith('Player');
    expect(subscribeMock).toHaveBeenCalledTimes(1);
    expect(state.gameId).toBe('g-1');
    expect(state.roomCode).toBe('ABCD');
    expect(state.screen).toBe('lobby');
    expect(state.subscription).not.toBeNull();
  });

  it('createGame signs in anonymously when no session exists', async () => {
    vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
      data: { session: null },
      error: null,
    } as any);

    vi.spyOn(supabase.auth, 'signInAnonymously').mockResolvedValue({
      data: {
        session: { user: { id: 'anon-user' } },
      },
      error: null,
    } as any);

    vi.mocked(gameApi.createGame).mockResolvedValue({ gameId: 'g-2', roomCode: 'WXYZ' } as any);
    vi.mocked(gameApi.subscribeToGame).mockReturnValue({ unsubscribe: vi.fn() } as any);

    await useOnlineStore.getState().createGame('Anon');

    const state = useOnlineStore.getState();
    expect(supabase.auth.signInAnonymously).toHaveBeenCalledTimes(1);
    expect(state.myPlayerId).toBe('anon-user');
  });

  it('createGame no-ops when playerName is empty', async () => {
    const createMock = vi.mocked(gameApi.createGame);

    await useOnlineStore.getState().createGame('');

    expect(createMock).not.toHaveBeenCalled();
  });

  it('createGame shows toast and keeps screen when API fails', async () => {
    vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
      data: { session: { user: { id: 'user-1' } } },
      error: null,
    } as any);

    vi.mocked(gameApi.createGame).mockRejectedValue(new Error('Network error'));

    const store = useOnlineStore.getState();
    await store.createGame('Player');

    const state = useOnlineStore.getState();
    expect(state.screen).toBe('home');
    expect(vi.mocked(toast)).toHaveBeenCalled();
  });

  it('subscription error "You are not in this game" kicks player back to home', async () => {
    vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
      data: { session: { user: { id: 'user-4' } } },
      error: null,
    } as any);

    vi.mocked(gameApi.createGame).mockResolvedValue({ gameId: 'g-sub', roomCode: 'ROOM' } as any);

    const unsubscribe = vi.fn();
    let errorHandler: ((err: Error) => void) | undefined;

    vi.mocked(gameApi.subscribeToGame).mockImplementation((_gameId, _onUpdate, onError) => {
      errorHandler = onError;
      return { unsubscribe } as any;
    });

    await useOnlineStore.getState().createGame('Player');

    const lobbyState = useOnlineStore.getState();
    expect(lobbyState.screen).toBe('lobby');
    expect(lobbyState.gameId).toBe('g-sub');

    errorHandler?.(new Error('You are not in this game'));

    const state = useOnlineStore.getState();
    expect(state.screen).toBe('home');
    expect(state.gameId).toBe('');
    expect(state.roomCode).toBe('');
    expect(unsubscribe).toHaveBeenCalledTimes(1);
    expect(vi.mocked(toast)).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Kicked from game',
      })
    );
  });

  it('joinGame no-ops when playerName is empty', async () => {
    const joinMock = vi.mocked(gameApi.joinGame);

    await useOnlineStore.getState().joinGame('ROOM', '');

    expect(joinMock).not.toHaveBeenCalled();
  });

  it('joinGame sets myPlayerId, screen, and subscription on success', async () => {
    vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
      data: { session: { user: { id: 'user-2' } } },
      error: null,
    } as any);

    vi.mocked(gameApi.joinGame).mockResolvedValue({ gameId: 'g-3' } as any);
    vi.mocked(gameApi.subscribeToGame).mockReturnValue({ unsubscribe: vi.fn() } as any);

    await useOnlineStore.getState().joinGame('ROOM', 'Player');

    const state = useOnlineStore.getState();
    expect(state.myPlayerId).toBe('user-2');
    expect(state.gameId).toBe('g-3');
    expect(state.roomCode).toBe('ROOM');
    expect(state.screen).toBe('lobby');
    expect(state.subscription).not.toBeNull();
  });

  it('joinGame shows error toast and keeps previous state when API fails', async () => {
    vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
      data: { session: { user: { id: 'user-3' } } },
      error: null,
    } as any);

    vi.mocked(gameApi.joinGame).mockRejectedValue(new Error('Invalid room'));

    await useOnlineStore.getState().joinGame('ROOM', 'Player');

    const state = useOnlineStore.getState();
    expect(state.screen).toBe('home');
    expect(vi.mocked(toast)).toHaveBeenCalled();
  });

  it('playMove no-ops when gameId is empty', async () => {
    const playMock = vi.mocked(gameApi.playMove);

    await useOnlineStore.getState().playMove({ type: 'READY_TO_PLAY' } as any);

    expect(playMock).not.toHaveBeenCalled();
  });

  it('playMove locks UI during request and unlocks afterward', async () => {
    useOnlineStore.setState({
      ...useOnlineStore.getState(),
      gameId: 'g-4',
    });

    const playMock = vi.mocked(gameApi.playMove);
    playMock.mockResolvedValue({} as any);

    const promise = useOnlineStore.getState().playMove({ type: 'READY_TO_PLAY' } as any);

    expect(useOnlineStore.getState().isActionLocked).toBe(true);

    await promise;

    expect(playMock).toHaveBeenCalledWith('g-4', { type: 'READY_TO_PLAY' });
    expect(useOnlineStore.getState().isActionLocked).toBe(false);
  });

  it('updateSettings applies local changes immediately and calls backend', async () => {
    useOnlineStore.setState({
      ...useOnlineStore.getState(),
      gameId: 'g-5',
      settings: {
        turnTimer: '30',
        mattsPairsRule: false,
        useEffectCards: true,
        numPlayers: 4,
        botDifficulty: 'medium',
        targetScore: '100',
      },
    });

    const updateMock = vi.mocked(gameApi.updateSettings);
    updateMock.mockResolvedValue({ success: true, settings: {} as any });

    await useOnlineStore.getState().updateSettings({ numPlayers: 3 });

    const state = useOnlineStore.getState();
    expect(state.settings.numPlayers).toBe(3);
    expect(updateMock).toHaveBeenCalledWith('g-5', { numPlayers: 3 });
  });

  it('startGame switches screen to game and calls backend when gameId exists', async () => {
    useOnlineStore.setState({
      ...useOnlineStore.getState(),
      gameId: 'g-6',
      screen: 'lobby',
    });

    const startMock = vi.mocked(gameApi.startGame);
    startMock.mockResolvedValue({ success: true, state: {} as any });

    await useOnlineStore.getState().startGame();

    const state = useOnlineStore.getState();
    expect(state.screen).toBe('game');
    expect(startMock).toHaveBeenCalledWith('g-6');
  });

  it('leaveGame calls API when gameId exists, unsubscribes, and resets state', async () => {
    const unsubscribe = vi.fn();

    useOnlineStore.setState({
      ...useOnlineStore.getState(),
      gameId: 'g-7',
      screen: 'game',
      subscription: { unsubscribe } as any,
    });

    const leaveMock = vi.mocked(gameApi.leaveGame);
    leaveMock.mockResolvedValue({} as any);

    await useOnlineStore.getState().leaveGame();

    const state = useOnlineStore.getState();
    expect(leaveMock).toHaveBeenCalledWith('g-7');
    expect(unsubscribe).toHaveBeenCalledTimes(1);
    expect(state.screen).toBe('home');
    expect(state.gameId).toBe('');
    expect(state.subscription).toBeNull();
  });

  it('kickPlayer calls backend when gameId exists and ignores when missing', async () => {
    const kickMock = vi.mocked(gameApi.kickPlayer);

    useOnlineStore.setState({
      ...useOnlineStore.getState(),
      gameId: 'g-8',
    });

    await useOnlineStore.getState().kickPlayer('p1');

    expect(kickMock).toHaveBeenCalledWith('g-8', 'p1');

    useOnlineStore.setState({
      ...useOnlineStore.getState(),
      gameId: '',
    });

    await useOnlineStore.getState().kickPlayer('p2');

    expect(kickMock).toHaveBeenCalledTimes(1);
  });

  it('endGame calls backend when gameId exists and ignores when missing', async () => {
    const endMock = vi.mocked(gameApi.endGame);

    useOnlineStore.setState({
      ...useOnlineStore.getState(),
      gameId: 'g-9',
    });

    await useOnlineStore.getState().endGame();

    expect(endMock).toHaveBeenCalledWith('g-9');

    useOnlineStore.setState({
      ...useOnlineStore.getState(),
      gameId: '',
    });

    await useOnlineStore.getState().endGame();

    expect(endMock).toHaveBeenCalledTimes(1);
  });
});
