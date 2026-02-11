import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

const isTest = process.env.NODE_ENV === 'test';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: !isTest,
    autoRefreshToken: !isTest,
    detectSessionInUrl: !isTest,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});
