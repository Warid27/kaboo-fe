import type { GameStore } from '../gameStore';
import type { StoreGet, StoreSet } from '../helpers';
import { createMockPlayers, generateRoomCode } from '../helpers';
import { createDeck, shuffleDeck, dealCards } from '@/lib/cardUtils';
import { createBotMemory, botInitialPeek, botRememberCard } from '@/lib/botAI';
import { INITIAL_STATE } from '../gameStore';
import { useReplayStore } from '../replayStore';
import { gameApi } from '@/services/gameApi';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';

export function createLobbyActions(set: StoreSet, get: StoreGet) {
  return {
    updateSettings: (partial: Partial<GameStore['settings']>) =>
      set((state) => {
        const newSettings = { ...state.settings, ...partial };
        if (partial.numPlayers !== undefined && state.gameMode === 'offline' && state.screen === 'lobby') {
          const players = createMockPlayers(partial.numPlayers, state.playerName || 'You');
          const updatedPlayers = players.map((p) => {
            const prev = state.players.find((sp) => sp.id === p.id);
            return prev ? { ...p, totalScore: prev.totalScore } : p;
          });
          return { settings: newSettings, players: updatedPlayers };
        }
        return { settings: newSettings };
      }),

    createGame: async () => {
      const { playerName } = get();
      if (!playerName) return;

      try {
        // Ensure Auth with robust session check
        let { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          console.log('[Lobby] No session, signing in anonymously...');
          const { data, error } = await supabase.auth.signInAnonymously();
          if (error) throw error;
          session = data.session;
        } else {
          // Optional: Refresh session to ensure token is fresh
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          if (!refreshError && refreshData.session) {
            session = refreshData.session;
          }
        }
        
        if (session?.user?.id) {
          set({ myPlayerId: session.user.id });
        }

        const { gameId, roomCode } = await gameApi.createGame();
        set({
          screen: 'lobby',
          gameMode: 'online',
          roomCode,
          gameId,
          players: [], // Will be synced via subscription
        });
      } catch (error) {
        console.error('Failed to create game:', error);
        toast({
          title: 'Failed to create game',
          description: error instanceof Error ? error.message : 'Please try again.',
          variant: 'destructive',
        });
      }
    },

    joinGame: async (roomCode: string) => {
      const { playerName } = get();
      if (!playerName) return;

      // Ensure Auth
      let userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) {
        const { data, error } = await supabase.auth.signInAnonymously();
        if (error) {
          console.error('Auth failed:', error);
          return;
        }
        userId = data.user?.id;
      }

      if (userId) {
        set({ myPlayerId: userId });
      }

      try {
        const { gameId } = await gameApi.joinGame(roomCode);
        set({
          screen: 'lobby',
          gameMode: 'online',
          roomCode, // Use the provided room code
          gameId,
          players: [], // Will be synced via subscription
        });
      } catch (error) {
        console.error('Failed to join game:', error);
        toast({
          title: 'Failed to join game',
          description: error instanceof Error ? error.message : 'Please check the room code.',
          variant: 'destructive',
        });
      }
    },

    startOffline: () => {
      const { playerName, settings } = get();
      const players = createMockPlayers(settings.numPlayers, playerName || 'You');
      set({
        screen: 'lobby',
        gameMode: 'offline',
        roomCode: '',
        players,
      });
    },

    startGame: () => {
      const { players, settings, gameMode } = get();
      const deck = shuffleDeck(createDeck());
      const { hands, remaining } = dealCards(deck, players.length, 4);

      const firstDiscard = { ...remaining[0], faceUp: true };
      const drawPile = remaining.slice(1);

      const updatedPlayers = players.map((p, i) => ({
        ...p,
        cards: hands[i],
        score: 0,
      }));

      const allDealtCardIds = hands.flat().map((c) => c.id);

      const botMemories: Record<string, ReturnType<typeof createBotMemory>> = {};
      if (gameMode === 'offline') {
        updatedPlayers.forEach((p, i) => {
          if (i > 0) {
            botMemories[p.id] = createBotMemory();
          }
        });
      }

      useReplayStore.getState().clearHistory();

      set({
        screen: 'game',
        ...INITIAL_STATE,
        gamePhase: 'dealing',
        players: updatedPlayers,
        drawPile,
        discardPile: [firstDiscard],
        dealtCardIds: allDealtCardIds,
        initialLooksRemaining: 2,
        turnTimeRemaining: parseInt(settings.turnTimer),
        botMemories,
        turnNumber: 0,
        roundNumber: get().roundNumber,
      });

      setTimeout(() => {
        const state = get();
        if (state.gameMode === 'offline') {
          const updatedMemories = { ...state.botMemories };
          state.players.forEach((player, i) => {
            if (i > 0 && updatedMemories[player.id]) {
              const peekIds = botInitialPeek(player, settings.botDifficulty);
              let mem = updatedMemories[player.id];
              peekIds.forEach((cardId) => {
                const card = player.cards.find((c) => c.id === cardId);
                if (card) {
                  mem = botRememberCard(mem, cardId, card);
                }
              });
              updatedMemories[player.id] = mem;
            }
          });
          set({ gamePhase: 'initial_look', dealtCardIds: [], botMemories: updatedMemories });
        } else {
          set({ gamePhase: 'initial_look', dealtCardIds: [] });
        }
      }, 2000);
    },

    playAgain: () => {
      const { players, matchOver } = get();
      if (matchOver) {
        // Match is over — reset everything
        const resetPlayers = players.map((p) => ({ ...p, cards: [], score: 0, totalScore: 0 }));
        set({
          players: resetPlayers,
          screen: 'lobby',
          ...INITIAL_STATE,
          roundNumber: 1,
        });
      } else {
        // Next round — preserve totalScore
        const resetPlayers = players.map((p) => ({ ...p, cards: [], score: 0 }));
        set({
          players: resetPlayers,
          screen: 'lobby',
          ...INITIAL_STATE,
          roundNumber: get().roundNumber + 1,
        });
        // Re-set players after INITIAL_STATE spread
        set({ players: resetPlayers });
      }
    },

    backToLobby: () => {
      set({
        screen: 'home',
        players: [],
        roomCode: '',
        ...INITIAL_STATE,
        roundNumber: 1,
      });
    },
  };
}
