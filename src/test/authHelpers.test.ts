import { describe, it, expect, vi, beforeEach } from 'vitest';
import { gameApi } from '@/services/gameApi';
import { getSessionTokens, signInWithCredentials, registerUser, signOut } from './apiTestHelpers';

vi.mock('@/services/gameApi', () => ({
  gameApi: {
    getMe: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
  },
}));

describe('auth helpers', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('getSessionTokens returns null when not authenticated', async () => {
    vi.mocked(gameApi.getMe).mockResolvedValue(null);

    const result = await getSessionTokens();

    expect(result).toBeNull();
  });

  it('getSessionTokens returns user info when authenticated', async () => {
    vi.mocked(gameApi.getMe).mockResolvedValue({ userId: 'user-id', email: 'test@example.com' });

    const result = await getSessionTokens();

    expect(result).not.toBeNull();
    expect(result?.userId).toBe('user-id');
    expect(result?.email).toBe('test@example.com');
  });

  it('signInWithCredentials calls login and returns user', async () => {
    vi.mocked(gameApi.login).mockResolvedValue(undefined);
    vi.mocked(gameApi.getMe).mockResolvedValue({ userId: 'user-id', email: 'test@example.com' });

    const result = await signInWithCredentials('test@example.com', 'password');

    expect(gameApi.login).toHaveBeenCalledWith('test@example.com', 'password');
    expect(result?.userId).toBe('user-id');
  });

  it('registerUser calls register and returns userId', async () => {
    vi.mocked(gameApi.register).mockResolvedValue({ userId: 'new-user-id' });

    const result = await registerUser('test@example.com', 'password');

    expect(gameApi.register).toHaveBeenCalledWith('test@example.com', 'password');
    expect(result?.userId).toBe('new-user-id');
  });

  it('signOut calls logout', async () => {
    vi.mocked(gameApi.logout).mockResolvedValue(undefined);

    await signOut();

    expect(gameApi.logout).toHaveBeenCalledTimes(1);
  });
});

