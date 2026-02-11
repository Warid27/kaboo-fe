import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

export async function getSessionTokens() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;
  return { 
    access_token: session.access_token, 
    refresh_token: session.refresh_token,
    user: session.user 
  };
}

export async function signInAnon() {
  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) throw error;
  return {
    user: data.user,
    session: data.session
  };
}

export async function setSession(tokens: { access_token: string; refresh_token: string; user: User } | null) {
  if (!tokens) {
    await supabase.auth.signOut();
    return;
  }
  
  const { error } = await supabase.auth.setSession({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
  });

  if (error) {
    throw error;
  }
}

export async function signOut() {
  await supabase.auth.signOut();
}

export function hasSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return !!url && !!anon && !url.includes('placeholder') && !anon.includes('placeholder');
}
