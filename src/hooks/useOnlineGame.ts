import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useGameStore } from '@/store/gameStore';
import { gameApi } from '@/services/gameApi';

export function useOnlineGame() {
  const { gameMode, gameId, syncFromRemote, setMyPlayerId } = useGameStore();

  useEffect(() => {
    if (gameMode !== 'online') return;
    
    const ensureAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setMyPlayerId(user.id);
      } else {
        const { data: { user: newUser }, error } = await supabase.auth.signInAnonymously();
        if (newUser) setMyPlayerId(newUser.id);
        if (error) {
          // eslint-disable-next-line no-console
          console.error('Auth failed:', error);
        }
      }
    };
    ensureAuth();
  }, [gameMode, setMyPlayerId]);

  useEffect(() => {
    if (gameMode !== 'online' || !gameId) return;

    const channel = supabase
      .channel('game_updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'games',
          filter: `id=eq.${gameId}`,
        },
        () => {
          // Trigger a fetch when 'updated_at' changes
          fetchGameState(gameId);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_players',
          filter: `game_id=eq.${gameId}`,
        },
        () => {
           fetchGameState(gameId);
         }
      )
      .subscribe();

    const fetchGameState = async (id: string) => {
      try {
        const { game_state } = await gameApi.getGameState(id);
        syncFromRemote(game_state);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to fetch game state:', error);
      }
    };

    // Fetch immediately on mount/reconnect
    fetchGameState(gameId);

    return () => {
      supabase.removeChannel(channel);
    };
  }, [gameMode, gameId, syncFromRemote]);
}
