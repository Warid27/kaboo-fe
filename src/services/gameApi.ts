import { supabase } from '@/lib/supabase';
import type { GameState } from '@/types/game'; // You might need to adjust this type to match backend exactly

// Backend Action Types
export type ApiActionType =
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
}

export const gameApi = {
  /**
   * Creates a new game room
   */
  async createGame() {
    const { data: { session } } = await supabase.auth.getSession();
    
    // Debug logging for Auth issues
    console.log('[GameAPI] Creating game...');
    console.log('[GameAPI] Session User ID:', session?.user?.id);
    console.log('[GameAPI] Access Token Present:', !!session?.access_token);
    if (session?.access_token) {
      console.log('[GameAPI] Token Prefix:', session.access_token.substring(0, 10) + '...');
    }

    const headers = session?.access_token 
      ? { Authorization: `Bearer ${session.access_token}` } 
      : undefined;

    const { data, error } = await supabase.functions.invoke('create-game', {
      body: {},
      headers,
    });
    
    if (error) {
      console.error('[GameAPI] create-game error:', error);
      // Pass the raw error context if available
      if (error instanceof Error && 'context' in error) {
         console.error('[GameAPI] Error Context:', (error as any).context);
      }
      throw error;
    }
    return data as { gameId: string; roomCode: string };
  },

  /**
   * Joins an existing game using a room code
   */
  async joinGame(roomCode: string) {
    const { data: { session } } = await supabase.auth.getSession();
    const headers = session?.access_token 
      ? { Authorization: `Bearer ${session.access_token}` } 
      : undefined;

    const { data, error } = await supabase.functions.invoke('join-game', {
      body: { roomCode },
      headers,
    });
    if (error) throw error;
    return data as { gameId: string };
  },

  /**
   * Starts the game (Host only)
   */
  async startGame(gameId: string) {
    const { data: { session } } = await supabase.auth.getSession();
    const headers = session?.access_token 
      ? { Authorization: `Bearer ${session.access_token}` } 
      : undefined;

    const { data, error } = await supabase.functions.invoke('start-game', {
      body: { gameId },
      headers,
    });
    if (error) throw error;
    return data as { success: boolean; state: any };
  },

  /**
   * Retrieves the current game state, sanitized for the requesting user
   */
  async getGameState(gameId: string) {
    const { data: { session } } = await supabase.auth.getSession();
    const headers = session?.access_token 
      ? { Authorization: `Bearer ${session.access_token}` } 
      : undefined;

    const { data, error } = await supabase.functions.invoke('get-game-state', {
      body: { gameId },
      headers,
    });
    if (error) throw error;
    return data as { game_state: any };
  },

  /**
   * Executes a game action
   */
  async playMove(gameId: string, action: GameActionPayload) {
    const { data: { session } } = await supabase.auth.getSession();
    const headers = session?.access_token 
      ? { Authorization: `Bearer ${session.access_token}` } 
      : undefined;

    const { data, error } = await supabase.functions.invoke('play-move', {
      body: { gameId, action },
      headers,
    });
    if (error) throw error;
    return data as { success: boolean; game_state: any; result: any };
  },
};
