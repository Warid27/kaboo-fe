import { supabase } from '@/lib/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { GameState } from '@/types/game'; // You might need to adjust this type to match backend exactly

// Backend Action Types
export type ApiActionType =
  | 'READY_TO_PLAY'
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

// Helper to extract error message from Supabase Functions response
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function parseSupabaseError(error: any): Promise<string> {
  // If it's already a clean Error with a custom message, return it
  if (error instanceof Error && error.message !== 'Edge Function returned a non-2xx status code') {
    return error.message;
  }

  // Check for context in Supabase error (FunctionsHttpError)
  if (error && typeof error === 'object' && 'context' in error) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = (error as any).context as Response;
    try {
      // Clone response to avoid consuming the body if it's needed elsewhere (unlikely here)
      const text = await res.clone().text();
      try {
        const json = JSON.parse(text);
        if (json.error) return json.error;
        if (json.message) return json.message;
      } catch {
        // If text but not JSON, and short enough, it might be the error message
        if (text && text.length < 200) return text;
      }
    } catch (e) {
      console.error('Error parsing response body:', e);
    }
  }
  
  return 'Server error. Please try again.';
}

export const gameApi = {
  /**
   * Creates a new game room
   */
  async createGame(playerName?: string, client: SupabaseClient = supabase) {
    await client.auth.getSession();
    
    // Debug logging for Auth issues
    console.log('[Kaboo Debug] Creating game...', { playerName });
    
    const { data, error } = await client.functions.invoke('create-game', {
      body: { playerName },
    });
    
    if (error) {
      console.error('[Kaboo Debug] create-game error:', error);
      const errorMessage = await parseSupabaseError(error);
      throw new Error(errorMessage);
    }
    console.log('[Kaboo Debug] Game created:', data);
    return data as { gameId: string; roomCode: string };
  },

  /**
   * Joins an existing game using a room code
   */
  async joinGame(roomCode: string, playerName?: string, client: SupabaseClient = supabase) {
    const { data, error } = await client.functions.invoke('join-game', {
      body: { roomCode, playerName },
    });
    
    if (error) {
      const errorMessage = await parseSupabaseError(error);
      throw new Error(errorMessage);
    }
    return data as { gameId: string };
  },

  /**
   * Leaves the current game
   */
  async leaveGame(gameId: string, client: SupabaseClient = supabase) {
    const { data, error } = await client.functions.invoke('leave-game', {
      body: { gameId },
    });
    if (error) {
      const errorMessage = await parseSupabaseError(error);
      throw new Error(errorMessage);
    }
    return data;
  },

  async toggleReady(gameId: string, isReady: boolean, client: SupabaseClient = supabase) {
    // Check session logic - force refresh if expired
    let { data: { session }, error: sessionError } = await client.auth.getSession();
    
    // Helper to refresh session
    const ensureValidSession = async () => {
        const { data: refreshData, error: refreshError } = await client.auth.refreshSession();
        if (refreshError || !refreshData.session) {
             throw new Error('Session expired. Please refresh the page.');
        }
        return refreshData.session;
    };

    if (sessionError || !session || !session.access_token) {
        console.log('[GameAPI] No valid session, attempting refresh...');
        session = await ensureValidSession();
    }

    // Try invoke
    const invoke = async (token: string) => {
        console.log('[GameAPI] Invoking toggle-ready with token length:', token.length);
        return await client.functions.invoke('toggle-ready', {
            body: { gameId, isReady },
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
    };

    let { data, error } = await invoke(session.access_token);

    // If 401, try one refresh and retry
    const is401 = error && (
        (error as any).status === 401 || 
        (error as any).context?.status === 401
    );

    if (is401) {
         console.warn('[GameAPI] 401 received, attempting token refresh and retry...');
         try {
             session = await ensureValidSession();
             const retry = await invoke(session.access_token);
             data = retry.data;
             error = retry.error;
         } catch (refreshErr) {
             console.error('[GameAPI] Refresh failed during retry:', refreshErr);
         }
    }

    if (error) {
      console.error('[GameAPI] toggleReady error:', error);
      const errorMessage = await parseSupabaseError(error);
      throw new Error(errorMessage);
    }
    return data;
  },

  /**
   * Starts the game (Host only)
   */
  async startGame(gameId: string, client: SupabaseClient = supabase) {
    const { data, error } = await client.functions.invoke('start-game', {
      body: { gameId },
    });
    if (error) throw error;
    return data as { success: boolean; state: GameState };
  },

  /**
   * Kicks a player from the game (Host only)
   */
  async kickPlayer(gameId: string, playerId: string, client: SupabaseClient = supabase) {
    const { data, error } = await client.functions.invoke('kick-player', {
      body: { gameId, playerId },
    });
    if (error) {
      const errorMessage = await parseSupabaseError(error);
      throw new Error(errorMessage);
    }
    return data as { success: boolean; kickedPlayerId: string };
  },

  /**
   * Retrieves the current game state, sanitized for the requesting user
   */
  async getGameState(gameId: string, client: SupabaseClient = supabase) {
    const { data, error } = await client.functions.invoke('get-game-state', {
      body: { gameId },
    });
    if (error) throw error;
    return data as { game_state: GameState };
  },

  /**
   * Executes a game action
   */
  async playMove(gameId: string, action: GameActionPayload, client: SupabaseClient = supabase) {
    const { data, error } = await client.functions.invoke('play-move', {
      body: { gameId, action },
    });
    
    if (error) {
      // console.error('[GameAPI] play-move error:', error);
      if (error instanceof Error && 'context' in error) {
         const res = (error as { context: Response }).context;
         try {
           await res.clone().text(); 
           // console.error('[GameAPI] play-move Error Body:', text);
         } catch {
            // console.error('[GameAPI] Could not read error body:', e);
         }
      }
      throw error;
    }
    return data as { success: boolean; game_state: GameState; result: unknown };
  },

  /**
   * Subscribes to game updates
   */
  subscribeToGame(gameId: string, onUpdate: (state: GameState) => void, client: SupabaseClient = supabase) {
    console.log('[Kaboo Debug] Subscribing to game:', gameId);
    const channel = client.channel(`game:${gameId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'games',
          filter: `id=eq.${gameId}`,
        },
        async (payload) => {
          console.log('[Kaboo Debug] Update received:', payload);
          // When game updates, fetch the latest state
          try {
            const { game_state } = await this.getGameState(gameId, client);
            console.log('[Kaboo Debug] Fetched fresh state:', game_state);
            onUpdate(game_state);
          } catch (error) {
            console.error('[Kaboo Debug] Failed to sync state:', error);
          }
        }
      )
      .subscribe((status) => {
        console.log('[Kaboo Debug] Subscription status:', status);
      });
      
    return channel;
  }
};
