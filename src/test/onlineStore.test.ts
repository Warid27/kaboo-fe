import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useOnlineStore } from '@/store/onlineStore';
import type { GameState } from '@/types/game';
import { kabooSocket } from '@/services/kabooSocket';
import { gameApi } from '@/services/gameApi';
import { toast } from '@/components/ui/use-toast';

vi.mock('@/services/kabooSocket', () => ({
  kabooSocket: {
    connect: vi.fn(),
    disconnect: vi.fn(),
    send: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  },
}));

vi.mock('@/services/gameApi', () => ({
  gameApi: {
    getMe: vi.fn(),
    createRoom: vi.fn(),
    joinRoom: vi.fn(),
    leaveRoom: vi.fn(),
    startRoom: vi.fn(),
    readyRoom: vi.fn(),
    kickPlayer: vi.fn(),
    listRooms: vi.fn(),
    register: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
  },
}));

vi.mock('@/components/ui/use-toast', () => ({
  toast: vi.fn(),
}));

const INITIAL_ONLINE_STATE: Partial<ReturnType<typeof useOnlineStore.getState>> = {
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
  effectType: null,
  effectStep: null,
  showEffectOverlay: false,
};

describe('onlineStore core state and syncFromRemote', () => {
  beforeEach(() => {
    useOnlineStore.setState({ ...INITIAL_ONLINE_STATE, screen: 'home', myPlayerId: '' });
    vi.resetAllMocks();
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

  it('syncFromRemote rotates players so current user is index 0', () => {
    useOnlineStore.setState({ ...useOnlineStore.getState(), myPlayerId: 'p2' });

    const remoteState: GameState = {
      roomCode: 'ROOM',
      phase: 'playing',
      turnPhase: 'action',
      currentTurnUserId: 'p2',
      settings: {
        turnTimer: '60',
        mattsPairsRule: false,
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
    useOnlineStore.setState({ ...useOnlineStore.getState(), myPlayerId: 'p1' });

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
    useOnlineStore.setState({ ...useOnlineStore.getState(), myPlayerId: 'p1' });

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

  it('syncFromRemote resets store and disconnects socket when myPlayerId not in playerOrder', () => {
    useOnlineStore.setState({ ...useOnlineStore.getState(), myPlayerId: 'ghost' });

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
    expect(kabooSocket.disconnect).toHaveBeenCalledTimes(1);
    expect(state.screen).toBe('home');
    expect(state.gameId).toBe('');
    expect(state.roomCode).toBe('');
    expect(state.players).toEqual([]);
  });

  it('resetStore clears state and calls kabooSocket.disconnect', () => {
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
    });

    useOnlineStore.getState().resetStore();

    const state = useOnlineStore.getState();
    expect(kabooSocket.disconnect).toHaveBeenCalledTimes(1);
    expect(state.screen).toBe('home');
    expect(state.gameId).toBe('');
    expect(state.roomCode).toBe('');
    expect(state.players).toEqual([]);
  });
});

describe('onlineStore actions', () => {
  beforeEach(() => {
    useOnlineStore.setState({ ...INITIAL_ONLINE_STATE, screen: 'home', myPlayerId: '' });
    vi.resetAllMocks();
  });

  it('setMyPlayerId updates myPlayerId', () => {
    useOnlineStore.getState().setMyPlayerId('user-9');
    expect(useOnlineStore.getState().myPlayerId).toBe('user-9');
  });

  it('createGame no-ops when playerName is empty', async () => {
    await useOnlineStore.getState().createGame('');

    expect(gameApi.getMe).not.toHaveBeenCalled();
    expect(gameApi.createRoom).not.toHaveBeenCalled();
    expect(kabooSocket.connect).not.toHaveBeenCalled();
  });

  it('createGame shows toast and keeps screen when API fails', async () => {
    vi.mocked(gameApi.getMe).mockResolvedValue({ userId: 'user-1', email: 'a@b.com' });
    vi.mocked(gameApi.createRoom).mockRejectedValue(new Error('Network error'));

    await useOnlineStore.getState().createGame('Player');

    const state = useOnlineStore.getState();
    expect(state.screen).toBe('home');
    expect(toast).toHaveBeenCalled();
  });

  it('createGame sets roomCode and screen to lobby on success', async () => {
    vi.mocked(gameApi.getMe).mockResolvedValue({ userId: 'user-1', email: 'a@b.com' });
    vi.mocked(gameApi.createRoom).mockResolvedValue({ code: 'ABCD', host: 'user-1' });

    await useOnlineStore.getState().createGame('Player');

    const state = useOnlineStore.getState();
    expect(gameApi.getMe).toHaveBeenCalledTimes(1);
    expect(gameApi.createRoom).toHaveBeenCalledTimes(1);
    expect(kabooSocket.on).toHaveBeenCalledWith('state', expect.any(Function));
    expect(kabooSocket.on).toHaveBeenCalledWith('kicked', expect.any(Function));
    expect(kabooSocket.on).toHaveBeenCalledWith('error', expect.any(Function));
    expect(kabooSocket.connect).toHaveBeenCalledWith('ABCD', 'user-1');
    expect(state.myPlayerId).toBe('user-1');
    expect(state.roomCode).toBe('ABCD');
    expect(state.screen).toBe('lobby');
  });

  it('joinGame no-ops when playerName is empty', async () => {
    await useOnlineStore.getState().joinGame('ROOM', '');

    expect(gameApi.getMe).not.toHaveBeenCalled();
    expect(gameApi.joinRoom).not.toHaveBeenCalled();
    expect(kabooSocket.connect).not.toHaveBeenCalled();
  });

  it('joinGame sets roomCode and screen to lobby on success', async () => {
    vi.mocked(gameApi.getMe).mockResolvedValue({ userId: 'user-2', email: 'b@c.com' });
    vi.mocked(gameApi.joinRoom).mockResolvedValue({ code: 'ROOM', players: {}, status: 'waiting' });

    await useOnlineStore.getState().joinGame('ROOM', 'Player');

    const state = useOnlineStore.getState();
    expect(gameApi.joinRoom).toHaveBeenCalledWith('ROOM');
    expect(kabooSocket.connect).toHaveBeenCalledWith('ROOM', 'user-2');
    expect(state.myPlayerId).toBe('user-2');
    expect(state.roomCode).toBe('ROOM');
    expect(state.screen).toBe('lobby');
  });

  it('joinGame shows error toast when API fails', async () => {
    vi.mocked(gameApi.getMe).mockResolvedValue({ userId: 'user-3', email: 'c@d.com' });
    vi.mocked(gameApi.joinRoom).mockRejectedValue(new Error('Invalid room'));

    await useOnlineStore.getState().joinGame('ROOM', 'Player');

    const state = useOnlineStore.getState();
    expect(state.screen).toBe('home');
    expect(toast).toHaveBeenCalled();
  });

  it('playMove no-ops when roomCode is empty', async () => {
    await useOnlineStore.getState().playMove({ type: 'READY_TO_PLAY' });

    expect(kabooSocket.send).not.toHaveBeenCalled();
    expect(useOnlineStore.getState().isActionLocked).toBe(false);
  });

  it('playMove calls kabooSocket.send with correct WS message', async () => {
    useOnlineStore.setState({ ...useOnlineStore.getState(), roomCode: 'ABCD' });

    await useOnlineStore.getState().playMove({ type: 'READY_TO_PLAY' });

    expect(kabooSocket.send).toHaveBeenCalledWith({ t: 'ready' });
    expect(useOnlineStore.getState().isActionLocked).toBe(false);
  });

  it('updateSettings applies local changes', async () => {
    useOnlineStore.setState({
      ...useOnlineStore.getState(),
      settings: {
        turnTimer: '30',
        mattsPairsRule: false,
        useEffectCards: true,
        numPlayers: 4,
        botDifficulty: 'medium',
        targetScore: '100',
      },
    });

    await useOnlineStore.getState().updateSettings({ numPlayers: 3 });

    const state = useOnlineStore.getState();
    expect(state.settings.numPlayers).toBe(3);
    expect(state.settings.turnTimer).toBe('30');
  });

  it('startGame switches screen to game and calls gameApi.startRoom', async () => {
    useOnlineStore.setState({ ...useOnlineStore.getState(), roomCode: 'ABCD', screen: 'lobby' });
    vi.mocked(gameApi.startRoom).mockResolvedValue(undefined);

    await useOnlineStore.getState().startGame();

    const state = useOnlineStore.getState();
    expect(state.screen).toBe('game');
    expect(gameApi.startRoom).toHaveBeenCalledWith('ABCD');
  });

  it('startGame no-ops when no roomCode', async () => {
    await useOnlineStore.getState().startGame();

    expect(gameApi.startRoom).not.toHaveBeenCalled();
    expect(useOnlineStore.getState().screen).toBe('home');
  });

  it('leaveGame calls gameApi.leaveRoom, disconnects socket, resets state', async () => {
    useOnlineStore.setState({ ...useOnlineStore.getState(), roomCode: 'ABCD', screen: 'game' });
    vi.mocked(gameApi.leaveRoom).mockResolvedValue(undefined);

    await useOnlineStore.getState().leaveGame();

    const state = useOnlineStore.getState();
    expect(gameApi.leaveRoom).toHaveBeenCalledWith('ABCD');
    expect(kabooSocket.disconnect).toHaveBeenCalledTimes(1);
    expect(state.screen).toBe('home');
    expect(state.roomCode).toBe('');
    expect(state.players).toEqual([]);
  });

  it('endGame calls gameApi.leaveRoom, disconnects socket, resets state', async () => {
    useOnlineStore.setState({ ...useOnlineStore.getState(), roomCode: 'ABCD', screen: 'game' });
    vi.mocked(gameApi.leaveRoom).mockResolvedValue(undefined);

    await useOnlineStore.getState().endGame();

    const state = useOnlineStore.getState();
    expect(gameApi.leaveRoom).toHaveBeenCalledWith('ABCD');
    expect(kabooSocket.disconnect).toHaveBeenCalledTimes(1);
    expect(state.screen).toBe('home');
    expect(state.roomCode).toBe('');
    expect(state.players).toEqual([]);
  });

  it('kickPlayer calls gameApi.kickPlayer', async () => {
    useOnlineStore.setState({ ...useOnlineStore.getState(), roomCode: 'ABCD' });
    vi.mocked(gameApi.kickPlayer).mockResolvedValue(undefined);

    await useOnlineStore.getState().kickPlayer('p1');

    expect(gameApi.kickPlayer).toHaveBeenCalledWith('ABCD', 'p1');
  });

  it('kickPlayer no-ops when no roomCode', async () => {
    await useOnlineStore.getState().kickPlayer('p1');

    expect(gameApi.kickPlayer).not.toHaveBeenCalled();
  });

  it('toggleReady calls gameApi.readyRoom', async () => {
    useOnlineStore.setState({
      ...useOnlineStore.getState(),
      roomCode: 'ABCD',
      myPlayerId: 'me',
      players: [
        {
          id: 'me',
          name: 'Me',
          avatarColor: '#fff',
          cards: [],
          isHost: true,
          isReady: false,
          score: 0,
          totalScore: 0,
        },
      ],
    });
    vi.mocked(gameApi.readyRoom).mockResolvedValue(undefined);

    await useOnlineStore.getState().toggleReady();

    expect(gameApi.readyRoom).toHaveBeenCalledWith('ABCD');
  });
});