import { describe, it, expect, beforeEach, vi } from 'vitest';
import { gameApi } from '@/services/gameApi';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

function url(path: string) {
  return `${API_BASE}${path}`;
}

function okResponse(body: unknown, status = 200) {
  return {
    ok: true,
    status,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(typeof body === 'string' ? body : JSON.stringify(body)),
  };
}

function errorResponse(status: number, body: unknown) {
  return {
    ok: false,
    status,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(''),
  };
}

beforeEach(() => {
  mockFetch.mockReset();
  vi.unstubAllGlobals();
  vi.stubGlobal('fetch', mockFetch);
});

describe('gameApi.register', () => {
  it('calls POST /auth/register with correct body then logs in', async () => {
    mockFetch.mockResolvedValue(okResponse({ userId: 'u1' }));

    const result = await gameApi.register('a@b.com', 'pass');

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch).toHaveBeenNthCalledWith(1, url('/auth/register'), {
      method: 'POST',
      body: JSON.stringify({ email: 'a@b.com', password: 'pass' }),
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    expect(mockFetch).toHaveBeenNthCalledWith(2, url('/auth/session'), {
      method: 'POST',
      body: JSON.stringify({ email: 'a@b.com', password: 'pass' }),
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    expect(result).toEqual({ userId: 'u1' });
  });
});

describe('gameApi.login', () => {
  it('calls POST /auth/session with correct body', async () => {
    mockFetch.mockResolvedValue(okResponse(undefined, 204));

    await gameApi.login('a@b.com', 'pass');

    expect(mockFetch).toHaveBeenCalledWith(url('/auth/session'), {
      method: 'POST',
      body: JSON.stringify({ email: 'a@b.com', password: 'pass' }),
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
  });
});

describe('gameApi.logout', () => {
  it('calls DELETE /auth/session', async () => {
    mockFetch.mockResolvedValue(okResponse(undefined, 204));

    await gameApi.logout();

    expect(mockFetch).toHaveBeenCalledWith(url('/auth/session'), {
      method: 'DELETE',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
  });
});

describe('gameApi.getMe', () => {
  it('calls GET /auth/me and returns user object', async () => {
    mockFetch.mockResolvedValue(okResponse({ userId: 'u1', email: 'a@b.com' }));

    const result = await gameApi.getMe();

    expect(mockFetch).toHaveBeenCalledWith(url('/auth/me'), {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    expect(result).toEqual({ userId: 'u1', email: 'a@b.com' });
  });

  it('returns null on error', async () => {
    mockFetch.mockResolvedValue(errorResponse(401, { error: 'Unauthorized' }));

    const result = await gameApi.getMe();

    expect(result).toBeNull();
  });
});

describe('gameApi.createRoom', () => {
  it('calls POST /rooms with settings and returns {code, host}', async () => {
    mockFetch.mockResolvedValue(okResponse({ code: 'ROOM', host: 'h1' }));

    const result = await gameApi.createRoom({ numPlayers: 4 });

    expect(mockFetch).toHaveBeenCalledWith(url('/rooms'), {
      method: 'POST',
      body: JSON.stringify({ settings: { numPlayers: 4 } }),
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    expect(result).toEqual({ code: 'ROOM', host: 'h1' });
  });
});

describe('gameApi.listRooms', () => {
  it('calls GET /rooms and returns array', async () => {
    const rooms = [
      { code: 'ROOM', host: 'h1', playerCount: 1, players: {}, status: 'waiting' },
    ];
    mockFetch.mockResolvedValue(okResponse(rooms));

    const result = await gameApi.listRooms();

    expect(mockFetch).toHaveBeenCalledWith(url('/rooms'), {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    expect(result).toEqual(rooms);
  });
});

describe('gameApi.joinRoom', () => {
  it('calls POST /rooms/join with code', async () => {
    mockFetch.mockResolvedValue(okResponse({ code: 'ROOM', players: {}, status: 'waiting' }));

    const result = await gameApi.joinRoom('ROOM');

    expect(mockFetch).toHaveBeenCalledWith(url('/rooms/join'), {
      method: 'POST',
      body: JSON.stringify({ code: 'ROOM' }),
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    expect(result).toEqual({ code: 'ROOM', players: {}, status: 'waiting' });
  });
});

describe('gameApi.leaveRoom', () => {
  it('calls POST /rooms/:code/leave', async () => {
    mockFetch.mockResolvedValue(okResponse(undefined, 204));

    await gameApi.leaveRoom('ROOM');

    expect(mockFetch).toHaveBeenCalledWith(url('/rooms/ROOM/leave'), {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
  });
});

describe('gameApi.readyRoom', () => {
  it('calls POST /rooms/:code/ready', async () => {
    mockFetch.mockResolvedValue(okResponse(undefined, 204));

    await gameApi.readyRoom('ROOM');

    expect(mockFetch).toHaveBeenCalledWith(url('/rooms/ROOM/ready'), {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
  });
});

describe('gameApi.startRoom', () => {
  it('calls POST /rooms/:code/start', async () => {
    mockFetch.mockResolvedValue(okResponse(undefined, 204));

    await gameApi.startRoom('ROOM');

    expect(mockFetch).toHaveBeenCalledWith(url('/rooms/ROOM/start'), {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
  });
});

describe('gameApi.kickPlayer', () => {
  it('calls POST /rooms/:code/kick with targetUserId', async () => {
    mockFetch.mockResolvedValue(okResponse(undefined, 204));

    await gameApi.kickPlayer('ROOM', 'u2');

    expect(mockFetch).toHaveBeenCalledWith(url('/rooms/ROOM/kick'), {
      method: 'POST',
      body: JSON.stringify({ targetUserId: 'u2' }),
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
  });
});

describe('gameApi error handling', () => {
  it('throws Error with error field from body on non-ok response', async () => {
    mockFetch.mockResolvedValue(errorResponse(400, { error: 'Room is full' }));

    await expect(gameApi.joinRoom('ROOM')).rejects.toThrow('Room is full');
  });

  it('throws Error with message field from body on non-ok response', async () => {
    mockFetch.mockResolvedValue(errorResponse(500, { message: 'Internal server error' }));

    await expect(gameApi.listRooms()).rejects.toThrow('Internal server error');
  });

  it('throws Error with status fallback when body has no message', async () => {
    mockFetch.mockResolvedValue(errorResponse(500, {}));

    await expect(gameApi.listRooms()).rejects.toThrow('Request failed with status 500');
  });
});
