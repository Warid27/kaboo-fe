import type { GameStore } from '../gameStore';
import type { StoreGet, StoreSet } from '../helpers';
import { createMockPlayers, generateRoomCode } from '../helpers';
import { createDeck, shuffleDeck, dealCards } from '@/lib/cardUtils';
import { createBotMemory, botInitialPeek, botRememberCard } from '@/lib/botAI';
import { INITIAL_STATE } from '../gameStore';
import { useReplayStore } from '../replayStore';

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

    createGame: () => {
      const { playerName, settings } = get();
      const players = createMockPlayers(settings.numPlayers, playerName);
      set({
        screen: 'lobby',
        gameMode: 'online',
        roomCode: generateRoomCode(),
        players,
      });
    },

    joinGame: () => {
      const { playerName, settings } = get();
      const players = createMockPlayers(settings.numPlayers, playerName);
      set({
        screen: 'lobby',
        gameMode: 'online',
        roomCode: generateRoomCode(),
        players: players.map((p, i) => ({ ...p, isHost: i !== 0 ? p.isHost : false })),
      });
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
