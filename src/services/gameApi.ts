import type { GameSettings } from '@/types/game';

export type ApiActionType =
  | 'READY_TO_PLAY'
  | 'INITIAL_PEEK'
  | 'DRAW_FROM_DECK'
  | 'DRAW_FROM_DISCARD'
  | 'DISCARD_DRAWN'
  | 'SWAP_WITH_OWN'
  | 'CALL_KABOO'
  | 'SNAP'
  | 'PEEK_OWN'
  | 'SPY_OPPONENT'
  | 'SWAP_ANY';

export interface GameActionPayload {
  type: ApiActionType;
  cardIndex?: number;
  targetPlayerId?: string;
  ownCardIndex?: number;
  card1?: { playerId: string; cardIndex: number };
  card2?: { playerId: string; cardIndex: number };
}

export interface RoomListItem {
  code: string;
  host: string;
  playerCount: number;
  players: Record<string, { name: string; isReady: boolean }>;
  status: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!res.ok) {
    let message = `Request failed with status ${res.status}`;
    try {
      const body = await res.json();
      if (body && typeof body === 'object') {
        if (typeof (body as { error?: unknown }).error === 'string') {
          message = (body as { error: string }).error;
        } else if (typeof (body as { message?: unknown }).message === 'string') {
          message = (body as { message: string }).message;
        }
      }
    } catch {
    }
    throw new Error(message);
  }

  if (res.status === 204) return undefined as T;
  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

export const gameApi = {
  async register(email: string, password: string): Promise<{ userId: string }> {
    const result = await request<{ userId: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    await this.login(email, password);
    return result;
  },

  async login(email: string, password: string): Promise<void> {
    await request<void>('/auth/session', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  async logout(): Promise<void> {
    await request<void>('/auth/session', { method: 'DELETE' });
  },

  async getMe(): Promise<{ userId: string; email: string } | null> {
    try {
      return await request<{ userId: string; email: string }>('/auth/me');
    } catch {
      return null;
    }
  },

  async createRoom(settings?: Partial<GameSettings>): Promise<{ code: string; host: string }> {
    return await request<{ code: string; host: string }>('/rooms', {
      method: 'POST',
      body: JSON.stringify({ settings }),
    });
  },

  async listRooms(): Promise<RoomListItem[]> {
    return await request<RoomListItem[]>('/rooms');
  },

  async joinRoom(code: string): Promise<{ code: string; players: Record<string, unknown>; status: string }> {
    return await request<{ code: string; players: Record<string, unknown>; status: string }>('/rooms/join', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  },

  async leaveRoom(code: string): Promise<void> {
    await request<void>(`/rooms/${encodeURIComponent(code)}/leave`, { method: 'POST' });
  },

  async readyRoom(code: string): Promise<void> {
    await request<void>(`/rooms/${encodeURIComponent(code)}/ready`, { method: 'POST' });
  },

  async startRoom(code: string): Promise<void> {
    await request<void>(`/rooms/${encodeURIComponent(code)}/start`, { method: 'POST' });
  },

  async kickPlayer(code: string, targetUserId: string): Promise<void> {
    await request<void>(`/rooms/${encodeURIComponent(code)}/kick`, {
      method: 'POST',
      body: JSON.stringify({ targetUserId }),
    });
  },

  async getProfile(): Promise<unknown> {
    return await request<unknown>('/profile');
  },

  async updateProfile(data: { username?: string; avatarUrl?: string | null }): Promise<unknown> {
    return await request<unknown>('/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async createGame(_playerName: string): Promise<{ gameId: string; roomCode: string }> {
    const result = await request<{ code: string; host: string }>('/rooms', {
      method: 'POST',
    });
    return { gameId: result.code, roomCode: result.code };
  },

  async joinGame(roomCode: string, _playerName: string): Promise<{ gameId: string }> {
    const result = await request<{ code: string }>('/rooms/join', {
      method: 'POST',
      body: JSON.stringify({ code: roomCode }),
    });
    return { gameId: result.code };
  },

  async endGame(gameId: string): Promise<void> {
    await request<void>(`/rooms/${encodeURIComponent(gameId)}/leave`, { method: 'POST' });
  },

  async leaveGame(gameId: string): Promise<void> {
    await request<void>(`/rooms/${encodeURIComponent(gameId)}/leave`, { method: 'POST' });
  },

  async toggleReady(gameId: string, isReady: boolean): Promise<void> {
    if (isReady) {
      await request<void>(`/rooms/${encodeURIComponent(gameId)}/ready`, { method: 'POST' });
    }
  },

  async startGame(gameId: string): Promise<void> {
    await request<void>(`/rooms/${encodeURIComponent(gameId)}/start`, { method: 'POST' });
  },

  async getGameState(_gameId: string): Promise<{ game_state: unknown }> {
    return await request<{ game_state: unknown }>(`/rooms`);
  },

  async playMove(_gameId: string, _action: unknown): Promise<void> {
  },

  async updateSettings(_gameId: string, _settings: unknown): Promise<void> {
  },

  subscribeToGame(_gameId: string, _onState: (state: unknown) => void, _onError: (error: Error) => void): { unsubscribe: () => void } {
    return { unsubscribe: () => {} };
  },
};