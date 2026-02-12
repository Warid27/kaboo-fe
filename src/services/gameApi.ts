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
    } catch {
        // Ignore parsing errors
      }
  }
  
  return 'Server error. Please try again.';
}

/**
 * Shared helper to invoke Supabase functions with automatic session refresh and retry
 */
async function invokeFunction(
  functionName: string, 
  body: Record<string, unknown>, 
  client: SupabaseClient = supabase
) {
  // Helper to refresh session
  const ensureValidSession = async () => {
    const { data: { session }, error: sessionError } = await client.auth.getSession();
    
    // If no session or error, try to refresh
    if (sessionError || !session || !session.access_token) {
      const { data: refreshData, error: refreshError } = await client.auth.refreshSession();
      if (refreshError || !refreshData.session) {
        throw new Error('Session expired. Please refresh the page.');
      }
      return refreshData.session;
    }
    return session;
  };

  const session = await ensureValidSession();

  const invoke = async (token: string) => {
    return await client.functions.invoke(functionName, {
      body,
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  };

  let { data, error } = await invoke(session.access_token);

  // If 401, try one refresh and retry
  const is401 = error && (
    ('status' in error && error.status === 401) || 
    ('context' in error && (error as { context: { status?: number } }).context?.status === 401)
  );

  if (is401) {
    try {
      const { data: refreshData } = await client.auth.refreshSession();
      if (refreshData.session) {
        const retry = await invoke(refreshData.session.access_token);
        data = retry.data;
        error = retry.error;
      }
    } catch {
        // Silent fail
      }
  }

  if (error) {
    const errorMessage = await parseSupabaseError(error);
    throw new Error(errorMessage);
  }

  return data;
}

export const gameApi = {
  /**
   * Creates a new game room
   */
  async createGame(playerName?: string, client: SupabaseClient = supabase) {
    return await invokeFunction('create-game', { playerName }, client) as { gameId: string; roomCode: string };
  },

  /**
   * Joins an existing game using a room code
   */
  async joinGame(roomCode: string, playerName?: string, client: SupabaseClient = supabase) {
    return await invokeFunction('join-game', { roomCode, playerName }, client) as { gameId: string };
  },

  /**
   * Leaves the current game
   */
  async leaveGame(gameId: string, client: SupabaseClient = supabase) {
    return await invokeFunction('leave-game', { gameId }, client);
  },

  /**
   * Ends the current game (Host only)
   */
  async endGame(gameId: string, client: SupabaseClient = supabase) {
    return await invokeFunction('end-game', { gameId }, client);
  },

  async toggleReady(gameId: string, isReady: boolean, client: SupabaseClient = supabase) {
    return await invokeFunction('toggle-ready', { gameId, isReady }, client);
  },

  /**
   * Updates game settings (Host only)
   */
  async updateSettings(gameId: string, settings: Partial<GameState['settings']>, client: SupabaseClient = supabase) {
    return await invokeFunction('update-settings', { gameId, settings }, client) as { success: boolean; settings: GameState['settings'] };
  },

  /**
   * Starts the game (Host only)
   */
  async startGame(gameId: string, client: SupabaseClient = supabase) {
    return await invokeFunction('start-game', { gameId }, client) as { success: boolean; state: GameState };
  },

  /**
   * Kicks a player from the game (Host only)
   */
  async kickPlayer(gameId: string, playerId: string, client: SupabaseClient = supabase) {
    return await invokeFunction('kick-player', { gameId, playerId }, client) as { success: boolean; kickedPlayerId: string };
  },

  /**
   * Retrieves the current game state, sanitized for the requesting user
   */
  async getGameState(gameId: string, client: SupabaseClient = supabase) {
    return await invokeFunction('get-game-state', { gameId }, client) as { game_state: GameState };
  },

  /**
   * Executes a game action
   */
  async playMove(gameId: string, action: GameActionPayload, client: SupabaseClient = supabase) {
    return await invokeFunction('play-move', { gameId, action }, client) as { success: boolean; game_state: GameState; result: unknown };
  },

  /**
   * Subscribes to game updates
   */
  subscribeToGame(
    gameId: string, 
    onUpdate: (state: GameState) => void, 
    onError?: (error: Error) => void,
    client: SupabaseClient = supabase
  ) {
    const channel = client.channel(`game:${gameId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'games',
          filter: `id=eq.${gameId}`,
        },
        async () => {
          // When game updates, fetch the latest state
          try {
            const { game_state } = await this.getGameState(gameId, client);
            onUpdate(game_state);
          } catch (error) {
            if (onError && error instanceof Error) {
              onError(error);
            }
          }
        }
      )
      .subscribe();
      
    return channel;
  }
};
