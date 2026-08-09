import { gameApi } from '@/services/gameApi';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

export async function getSessionTokens() {
  const me = await gameApi.getMe();
  if (!me) return null;
  return {
    userId: me.userId,
    email: me.email,
  };
}

export async function signInWithCredentials(email: string, password: string) {
  await gameApi.login(email, password);
  const me = await gameApi.getMe();
  return me;
}

export async function registerUser(email: string, password: string) {
  const result = await gameApi.register(email, password);
  return result;
}

export async function signOut() {
  await gameApi.logout();
}

export function hasApiEnv() {
  const url = process.env.NEXT_PUBLIC_API_URL;
  return !!url && !url.includes('placeholder');
}
