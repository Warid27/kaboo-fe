import { createMockPlayers, StoreGet, StoreSet } from '../helpers';
import { createDeck, shuffleDeck, dealCards } from '@/lib/cardUtils';
import { createBotMemory, botInitialPeek, botRememberCard } from '@/lib/botAI';
import { useReplayStore } from '../replayStore';
import { gameApi } from '@/services/gameApi';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';
import type { GameSettings } from '@/types/game';

const INITIAL_STATE = {} as any;

export function createLobbyActions(set: StoreSet<any>, get: StoreGet<any>) {
  return {
    updateSettings: (partial: Partial<GameSettings>) => {
      const state = get() as any;
      const { gameMode, gameId } = state;
      
      set((storeState) => {
        const state = storeState as {
          settings: GameSettings;
          gameMode: 'online' | 'offline';
          screen: string;
          playerName: string;
          players: { id: string; totalScore: number }[];
        };

        const newSettings: GameSettings = { ...state.settings, ...partial };

        if (partial.numPlayers !== undefined && state.gameMode === 'offline' && state.screen === 'lobby') {
          const players = createMockPlayers(partial.numPlayers, state.playerName || 'You');
          const updatedPlayers = players.map((p) => {
            const prev = state.players.find((sp) => sp.id === p.id);
            return prev ? { ...p, totalScore: prev.totalScore } : p;
          });
          return { settings: newSettings, players: updatedPlayers };
        }

        return { settings: newSettings };
      });

      // If online, sync to backend
      if (gameMode === 'online' && gameId) {
        gameApi.updateSettings(gameId, partial).catch((error) => {
          toast({
            title: 'Failed to update settings',
            description: error instanceof Error ? error.message : 'Please try again.',
            variant: 'destructive',
          });
        });
      }
    },

    createGame: async () => {
      const { playerName } = get() as any;
      if (!playerName) return;

      try {
        // Ensure Auth with robust session check
        let { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
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

        const { gameId, roomCode } = await gameApi.createGame(playerName);
        
        // Subscribe to game updates
        const subscription = gameApi.subscribeToGame(
          gameId, 
          (state) => {
            get().syncFromRemote(state);
          },
          (error) => {
            if (error.message === 'You are not in this game') {
              toast({
                title: 'Kicked from game',
                description: 'You have been removed from the game.',
                variant: 'destructive',
              });
              get().exitToHome();
            }
          }
        );

        set({
          screen: 'lobby',
          gameMode: 'online',
          roomCode,
          gameId,
          players: [], // Will be synced via subscription
          subscription,
        });

        // Initial state fetch
        get().checkGameState();
      } catch (error) {
        toast({
          title: 'Failed to create game',
          description: error instanceof Error ? error.message : 'Please try again.',
          variant: 'destructive',
        });
      }
    },

    endGame: async () => {
      const { gameId } = get();
      if (!gameId) return;

      try {
        await gameApi.endGame(gameId);
        get().exitToHome(); // Cleanup local state
      } catch (error) {
        toast({
          title: 'Failed to end game',
          description: error instanceof Error ? error.message : 'Please try again.',
          variant: 'destructive',
        });
      }
    },

    joinGame: async (roomCode: string) => {
      const { playerName } = get() as any;
      if (!playerName) return;

      // Ensure Auth
      let userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) {
        const { data, error } = await supabase.auth.signInAnonymously();
        if (error) {
          return;
        }
        userId = data.user?.id;
      }

      if (userId) {
        set({ myPlayerId: userId });
      }

      try {
        const { gameId } = await gameApi.joinGame(roomCode, playerName);
        
        // Subscribe to game updates
        const subscription = gameApi.subscribeToGame(
          gameId, 
          (state) => {
            get().syncFromRemote(state);
          },
          (error) => {
            if (error.message === 'You are not in this game') {
              toast({
                title: 'Kicked from game',
                description: 'You have been removed from the game.',
                variant: 'destructive',
              });
              get().exitToHome();
            }
          }
        );

        set({
          screen: 'lobby',
          gameMode: 'online',
          roomCode,
          gameId,
          players: [], // Will be synced via subscription
          subscription,
        });

        // Initial state fetch
        get().checkGameState();
      } catch (error) {
        toast({
          title: 'Failed to join game',
          description: error instanceof Error ? error.message : 'Please try again.',
          variant: 'destructive',
        });
      }
    },

    toggleReady: async () => {
      const { gameId, myPlayerId, players } = get() as any;
      if (!gameId || !myPlayerId) return;

      const me = players.find((p: any) => p.id === myPlayerId);
      const newStatus = !me?.isReady;

      // Optimistic update
      set(state => ({
        players: state.players.map((p: any) => 
          p.id === myPlayerId ? { ...p, isReady: newStatus } : p
        )
      }));

      try {
        await gameApi.toggleReady(gameId, newStatus);
      } catch (error) {
        // Revert
        set(state => ({
          players: state.players.map((p: any) => 
            p.id === myPlayerId ? { ...p, isReady: !newStatus } : p
          )
        }));
        toast({
          title: 'Error updating ready status',
          description: error instanceof Error ? error.message : 'Please try again.',
          variant: 'destructive'
        });
      }
    },

    kickPlayer: async (playerId: string) => {
      const { gameId } = get() as any;
      if (!gameId) return;

      try {
        await gameApi.kickPlayer(gameId, playerId);
        toast({
          title: 'Player kicked',
          description: 'The player has been removed from the game.',
        });
        // We don't need to manually update state here as the subscription will handle it
      } catch (error) {
        toast({
          title: 'Failed to kick player',
          description: error instanceof Error ? error.message : 'Please try again.',
          variant: 'destructive'
        });
      }
    },

    checkGameState: async () => {
        const { gameId } = get() as any;
        if (!gameId) return;
        try {
            const { game_state } = await gameApi.getGameState(gameId);
            get().syncFromRemote(game_state);
        } catch (e) {
            if (e instanceof Error && e.message === 'You are not in this game') {
                toast({
                    title: 'Kicked from game',
                    description: 'You have been removed from the game.',
                    variant: 'destructive',
                });
                get().exitToHome();
            }
        }
    },

    startOffline: () => {
      const { playerName, settings } = get() as any;
      const players = createMockPlayers(settings.numPlayers, playerName || 'You');
      set({
        screen: 'lobby',
        gameMode: 'offline',
        roomCode: '',
        players,
      });
    },

    startGame: async () => {
      const { players, settings, gameMode, gameId } = get() as any;

      if (gameMode === 'online') {
        if (!gameId) return;
        try {
          await gameApi.startGame(gameId);
          // Set local screen immediately to avoid flicker, though syncFromRemote will also set it
          set({ screen: 'game' });
        } catch {
          toast({
            title: 'Failed to start game',
            description: 'Could not start the game on server.',
            variant: 'destructive',
          });
        }
        return;
      }

      const deck = shuffleDeck(createDeck());
      const { hands, remaining } = dealCards(deck, players.length, 4);

      const firstDiscard = { ...remaining[0], faceUp: true };
      const drawPile = remaining.slice(1);

      const updatedPlayers = players.map((p: any, i: number) => ({
        ...p,
        cards: hands[i],
        score: 0,
        isReady: false,
      }));

      const allDealtCardIds = hands.flat().map((c: any) => c.id);

      const botMemories: Record<string, ReturnType<typeof createBotMemory>> = {};
      if (gameMode === 'offline') {
        updatedPlayers.forEach((p: any, i: number) => {
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
          const updatedMemories = { ...state.botMemories } as any;
          state.players.forEach((player: any, i: number) => {
            if (i > 0 && updatedMemories[player.id]) {
              const peekIds = botInitialPeek(player, settings.botDifficulty);
              let mem = updatedMemories[player.id];
              peekIds.forEach((cardId: string) => {
                const card = player.cards.find((c: any) => c.id === cardId);
                if (card) {
                  mem = botRememberCard(mem, cardId, card, 0);
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

    readyToPlay: async () => {
      const { gameId, gameMode, myPlayerId } = get() as any;
      if (gameMode === 'online') {
        if (!gameId) return;

        // Optimistic update
        set((state) => ({
          players: state.players.map((p: any) =>
            p.id === myPlayerId ? { ...p, isReady: true } : p
          ),
        }));

        try {
          await gameApi.playMove(gameId, { type: 'READY_TO_PLAY' });
        } catch {
          // Revert optimistic update
          set((state) => ({
            players: state.players.map((p: any) =>
              p.id === myPlayerId ? { ...p, isReady: false } : p
            ),
          }));
          toast({
            title: 'Action Failed',
            description: 'Failed to set ready state. Please try again.',
            variant: 'destructive',
          });
        }
        return;
      }

      // Offline mode logic (auto-transition)
      set({ gamePhase: 'playing', turnPhase: 'draw' });
    },

    playAgain: () => {
      const { players, matchOver } = get() as any;
      if (matchOver) {
        // Match is over — reset everything
        const resetPlayers = players.map((p: any) => ({ ...p, cards: [], score: 0, totalScore: 0 }));
        set({
          players: resetPlayers,
          screen: 'lobby',
          ...INITIAL_STATE,
          roundNumber: 1,
        });
      } else {
        // Next round — preserve totalScore
        const resetPlayers = players.map((p: any) => ({ ...p, cards: [], score: 0 }));
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

    exitToHome: () => {
      const { gameId, gameMode, subscription } = get() as any;

      if (subscription) {
        subscription.unsubscribe();
      }
      
      if (gameMode === 'online' && gameId) {
        gameApi.leaveGame(gameId).catch(() => {});
      }
      
      set({
        screen: 'home',
        players: [],
        roomCode: '',
        ...INITIAL_STATE,
        roundNumber: 1,
        subscription: null,
      });
    },
  };
}
