import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { getSessionTokens, signInAnon, setSession, signOut } from './apiTestHelpers';

describe('auth helpers', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('getSessionTokens returns null when no session', async () => {
    const getSessionMock = vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
      data: { session: null },
      error: null,
    } as any);

    const result = await getSessionTokens();

    expect(getSessionMock).toHaveBeenCalledTimes(1);
    expect(result).toBeNull();
  });

  it('getSessionTokens returns tokens when session exists', async () => {
    const session = {
      access_token: 'access',
      refresh_token: 'refresh',
      user: { id: 'user-id' },
    };

    vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
      data: { session },
      error: null,
    } as any);

    const result = await getSessionTokens();

    expect(result).not.toBeNull();
    expect(result?.access_token).toBe('access');
    expect(result?.refresh_token).toBe('refresh');
    expect(result?.user.id).toBe('user-id');
  });

  it('signInAnon returns user and session on success', async () => {
    const user = { id: 'user-id' };
    const session = { access_token: 'access' };

    const signInMock = vi.spyOn(supabase.auth, 'signInAnonymously').mockResolvedValue({
      data: { user, session },
      error: null,
    } as any);

    const result = await signInAnon();

    expect(signInMock).toHaveBeenCalledTimes(1);
    expect(result.user).toBe(user);
    expect(result.session).toBe(session);
  });

  it('signInAnon throws on error', async () => {
    const signInError = new Error('sign-in failed');

    vi.spyOn(supabase.auth, 'signInAnonymously').mockResolvedValue({
      data: { user: null, session: null },
      error: signInError,
    } as any);

    await expect(signInAnon()).rejects.toThrow('sign-in failed');
  });

  it('setSession(null) signs out', async () => {
    const signOutMock = vi.spyOn(supabase.auth, 'signOut').mockResolvedValue({
      error: null,
    } as any);

    await setSession(null);

    expect(signOutMock).toHaveBeenCalledTimes(1);
  });

  it('setSession sets session tokens', async () => {
    const setSessionMock = vi.spyOn(supabase.auth, 'setSession').mockResolvedValue({
      data: { session: {} },
      error: null,
    } as any);

    const mockUser: User = {
      id: 'user-id',
      aud: 'authenticated',
      created_at: new Date().toISOString(),
      app_metadata: {},
      user_metadata: {},
    };

    const tokens = {
      access_token: 'access',
      refresh_token: 'refresh',
      user: mockUser,
    };

    await setSession(tokens);

    expect(setSessionMock).toHaveBeenCalledTimes(1);
    expect(setSessionMock).toHaveBeenCalledWith({
      access_token: 'access',
      refresh_token: 'refresh',
    });
  });

  it('setSession throws when setSession returns error', async () => {
    const error = new Error('setSession failed');

    vi.spyOn(supabase.auth, 'setSession').mockResolvedValue({
      data: { session: null },
      error,
    } as any);

    const mockUser: User = {
      id: 'user-id',
      aud: 'authenticated',
      created_at: new Date().toISOString(),
      app_metadata: {},
      user_metadata: {},
    };

    const tokens = {
      access_token: 'access',
      refresh_token: 'refresh',
      user: mockUser,
    };

    await expect(setSession(tokens)).rejects.toThrow('setSession failed');
  });

  it('signOut calls supabase auth signOut', async () => {
    const signOutMock = vi.spyOn(supabase.auth, 'signOut').mockResolvedValue({
      error: null,
    } as any);

    await signOut();

    expect(signOutMock).toHaveBeenCalledTimes(1);
  });
});

