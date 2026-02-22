import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { GameState } from '@/types/game';

const mockAuth = {
  getSession: vi.fn(),
  refreshSession: vi.fn(),
};

const mockFunctions = {
  invoke: vi.fn(),
};

const mockChannelInstance = {
  on: vi.fn(),
  subscribe: vi.fn(),
};

const mockChannel = vi.fn(() => mockChannelInstance);

const mockSupabase = {
  auth: mockAuth,
  functions: mockFunctions,
  channel: mockChannel,
} as unknown as SupabaseClient;

import { gameApi } from '@/services/gameApi';

describe('gameApi basic actions', () => {
  beforeEach(() => {
    vi.resetAllMocks();

    mockAuth.getSession.mockResolvedValue({
      data: { session: { access_token: 'token' } },
      error: null,
    });

    mockAuth.refreshSession.mockResolvedValue({
      data: { session: { access_token: 'refreshed' } },
      error: null,
    });
  });

  it('createGame invokes create-game function with playerName', async () => {
    mockFunctions.invoke.mockResolvedValue({
      data: { gameId: 'g1', roomCode: 'ROOM' },
      error: null,
    });

    const result = await gameApi.createGame('Alice', mockSupabase);

    expect(mockFunctions.invoke).toHaveBeenCalledWith('create-game', {
      body: { playerName: 'Alice' },
      headers: { Authorization: 'Bearer token' },
    });
    expect(result).toEqual({ gameId: 'g1', roomCode: 'ROOM' });
  });

  it('kickPlayer invokes kick-player with gameId and playerId', async () => {
    mockFunctions.invoke.mockResolvedValue({
      data: { success: true, kickedPlayerId: 'p2' },
      error: null,
    });

    const result = await gameApi.kickPlayer('g1', 'p2', mockSupabase);

    expect(mockFunctions.invoke).toHaveBeenCalledWith('kick-player', {
      body: { gameId: 'g1', playerId: 'p2' },
      headers: { Authorization: 'Bearer token' },
    });
    expect(result).toEqual({ success: true, kickedPlayerId: 'p2' });
  });

  it('joinGame invokes join-game with roomCode and playerName', async () => {
    mockFunctions.invoke.mockResolvedValue({
      data: { gameId: 'g2' },
      error: null,
    });

    const result = await gameApi.joinGame('ROOM', 'Bob', mockSupabase);

    expect(mockFunctions.invoke).toHaveBeenCalledWith('join-game', {
      body: { roomCode: 'ROOM', playerName: 'Bob' },
      headers: { Authorization: 'Bearer token' },
    });
    expect(result).toEqual({ gameId: 'g2' });
  });

  it('createGame surfaces backend error messages from Supabase context', async () => {
    const mockResponse = {
      clone: () => ({
        text: async () => JSON.stringify({ message: 'Game is full' }),
      }),
    };

    mockFunctions.invoke.mockResolvedValue({
      data: null,
      error: { context: mockResponse },
    });

    await expect(gameApi.createGame('Alice', mockSupabase)).rejects.toThrow('Game is full');
  });
});

describe('gameApi.subscribeToGame', () => {
  beforeEach(() => {
    vi.resetAllMocks();

    mockAuth.getSession.mockResolvedValue({
      data: { session: { access_token: 'token' } },
      error: null,
    });

    mockFunctions.invoke.mockResolvedValue({
      data: { game_state: { id: 'g1' } as GameState },
      error: null,
    });

    mockChannelInstance.on.mockImplementation((_event, _filter, cb) => {
      (mockChannelInstance as any).__callback = cb;
      return mockChannelInstance;
    });

    mockChannelInstance.subscribe.mockReturnValue(mockChannelInstance);
  });

  it('subscribes to postgres UPDATE events and fetches latest game state', async () => {
    const updates: GameState[] = [];

    const channel = gameApi.subscribeToGame(
      'g1',
      (state) => {
        updates.push(state);
      },
      undefined,
      mockSupabase
    );

    expect(mockChannel).toHaveBeenCalledWith('game:g1');
    expect(mockChannelInstance.on).toHaveBeenCalledTimes(1);
    expect(mockChannelInstance.subscribe).toHaveBeenCalledTimes(1);
    expect(channel).toBe(mockChannelInstance);

    const callback = (mockChannelInstance as any).__callback as () => Promise<void>;
    await callback();

    expect(mockFunctions.invoke).toHaveBeenCalledWith('get-game-state', {
      body: { gameId: 'g1' },
      headers: { Authorization: 'Bearer token' },
    });
    expect(updates).toHaveLength(1);
    expect(updates[0]).toEqual({ id: 'g1' });
  });

  it('calls onError when getGameState throws', async () => {
    const errors: Error[] = [];

    mockFunctions.invoke.mockResolvedValue({
      data: null,
      error: new Error('You are not in this game'),
    });

    const channel = gameApi.subscribeToGame(
      'g1',
      () => {},
      (err) => errors.push(err),
      mockSupabase
    );

    expect(channel).toBe(mockChannelInstance);

    const callback = (mockChannelInstance as any).__callback as () => Promise<void>;
    await callback();

    expect(errors).toHaveLength(1);
    expect(errors[0]).toBeInstanceOf(Error);
    expect(errors[0].message).toBe('You are not in this game');
  });
});
