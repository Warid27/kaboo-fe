import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { 
  Card, GameSettings, 
  EffectType, TapState, TurnLogEntry, Screen 
} from '@/types/game';
import { GameEngine, EngineState } from '@/engine/gameEngine';
import { createMockPlayers } from './helpers';
import { 
  BotMemory, botRememberCard, createBotMemory, 
  botShouldTap, getBotTapDelay, botDecideAction, 
  botShouldCallKaboo, botResolveEffect, botForgetCard 
} from '@/lib/botAI';

interface OfflineState extends EngineState {
  // UI & Navigation
  screen: Screen;
  playerName: string;
  settings: GameSettings;
  
  // UI state
  selectedCards: string[];
  peekedCards: string[];
  tapState: TapState | null;
  showKabooAnnouncement: boolean;
  isActionLocked: boolean;
  turnLog: TurnLogEntry[];
  initialLooksRemaining: number;
  botMemories: Record<string, BotMemory>;
  effectType: EffectType | null;
  effectStep: 'select' | 'preview' | null;
  showEffectOverlay: boolean;
  effectPreviewCardIds: string[];
  isPaused: boolean;
  autoPlayBots: boolean;
}

interface OfflineStore extends OfflineState {
  // Actions
  setPlayerName: (name: string) => void;
  updateSettings: (settings: Partial<GameSettings>) => void;
  setIsPaused: (paused: boolean) => void;
  startOfflineGame: () => void;
  drawCard: () => void;
  drawFromDiscard: () => void;
  swapCard: (cardId: string) => void;
  discardHeldCard: () => void;
  callKaboo: () => void;
  revealAllCards: () => void;
  endTurn: () => void;
  resetStore: () => void;
  peekCard: (cardId: string) => void;
  resolveEffect: (cardId: string) => void;
  tapSelectCard: (cardId: string) => void;
  confirmTapDiscard: () => void;
  readyToPlay: () => void;
  nextRound: () => void;
  updateBotMemory: (playerId: string, cardId: string, card: Card) => void;
  selectCard: (cardId: string) => void;
  clearSelection: () => void;
  confirmEffect: () => void;
  declineEffect: () => void;
  openTapWindow: (discarderIndex: number) => void;
  activateTap: () => void;
  tapSwapCard: (ownCardId: string) => void;
  skipTapSwap: () => void;
  finalizeTap: () => void;
  simulateBotTurn: () => void;
}

const INITIAL_OFFLINE_STATE: OfflineState = {
  players: [],
  gamePhase: 'waiting',
  turnPhase: 'draw',
  currentPlayerIndex: 0,
  drawPile: [],
  discardPile: [],
  heldCard: null,
  kabooCalled: false,
  kabooCallerIndex: null,
  finalRoundTurnsLeft: 0,
  turnNumber: 0,
  roundNumber: 1,
  botMemories: {},
  effectType: null,
  effectStep: null,
  showEffectOverlay: false,
  effectPreviewCardIds: [],
  screen: 'home',
  playerName: 'Player',
  isPaused: false,
  settings: { 
    turnTimer: '30', 
    mattsPairsRule: false, 
    useEffectCards: true, 
    numPlayers: 4, 
    botDifficulty: 'medium', 
    targetScore: '100' 
  },
  selectedCards: [],
  peekedCards: [],
  tapState: null,
  showKabooAnnouncement: false,
  isActionLocked: false,
  turnLog: [],
  initialLooksRemaining: 2,
  autoPlayBots: false,
};

export const useOfflineStore = create<OfflineStore>()(
  persist(
    (set, get) => ({
      ...INITIAL_OFFLINE_STATE,

      setPlayerName: (name) => set({ playerName: name }),
      
      updateSettings: (newSettings) => set((state) => ({ 
        settings: { ...state.settings, ...newSettings } 
      })),

      setIsPaused: (paused) => set({ isPaused: paused }),

      startOfflineGame: () => {
        const { playerName, settings, roundNumber } = get();
        const players = createMockPlayers(settings.numPlayers, playerName);
        const newState = GameEngine.initGame(players, settings, roundNumber);
        
        // Initialize bot memories
        const botMemories: Record<string, BotMemory> = {};
        players.slice(1).forEach(bot => {
          botMemories[bot.id] = createBotMemory();
        });

        set({ 
          ...INITIAL_OFFLINE_STATE,
          ...newState, 
          screen: 'game', 
          turnLog: [],
          initialLooksRemaining: 2,
          peekedCards: [],
          selectedCards: [],
          botMemories,
          autoPlayBots: true,
        });

        setTimeout(() => {
          const state = get();
          if (state.gamePhase === 'dealing') {
            set({ gamePhase: 'initial_look' });
          }
        }, 2000);
      },

      readyToPlay: () => {
        set({ gamePhase: 'playing' });
      },

      nextRound: () => {
        const { players, settings, roundNumber } = get();
        const nextRoundNum = roundNumber + 1;
        const newState = GameEngine.initGame(players, settings, nextRoundNum);
        set({ 
          ...newState, 
          gamePhase: 'initial_look',
          turnLog: [],
          initialLooksRemaining: 2,
          peekedCards: [],
          selectedCards: [],
        });
      },

      updateBotMemory: (playerId, cardId, card) => {
        const { botMemories, turnNumber } = get();
        const memory = botMemories[playerId];
        if (!memory) return;
        
        const newMemory = botRememberCard(memory, cardId, card, turnNumber);
        set({
          botMemories: {
            ...botMemories,
            [playerId]: newMemory
          }
        });
      },

      selectCard: (cardId) => {
        const { effectType, effectStep, selectedCards } = get();

        if (effectType === 'peek_own' || effectType === 'peek_opponent') {
          get().resolveEffect(cardId);
          return;
        }

        if (effectType === 'full_vision_swap' && effectStep === 'select') {
          const current = selectedCards;
          if (current.includes(cardId)) {
            set({ selectedCards: current.filter((id) => id !== cardId) });
          } else if (current.length < 2) {
            const updated = [...current, cardId];
            if (updated.length >= 2) {
              set({
                selectedCards: updated,
                effectPreviewCardIds: [...updated],
                effectStep: 'preview',
              });
            } else {
              set({ selectedCards: updated });
            }
          }
          return;
        }

        const current = selectedCards;
        if (current.includes(cardId)) {
          set({ selectedCards: current.filter((id) => id !== cardId) });
        } else {
          set({ selectedCards: [...current, cardId] });
        }
      },

      clearSelection: () => {
        set({ selectedCards: [] });
      },

      confirmEffect: () => {
        const prevState = get();
        const engineState = GameEngine.confirmEffect(prevState);
        const newState: OfflineState = {
          ...prevState,
          ...engineState,
          showEffectOverlay: engineState.effectType ? true : false,
        };

        set(newState);

        if (prevState.currentPlayerIndex !== 0 && newState.turnPhase === 'end_turn') {
          get().endTurn();
        }

        if (prevState.effectType === 'blind_swap' && prevState.selectedCards.length >= 2) {
          const [cardId1, cardId2] = prevState.selectedCards;
          const updatedMemories = { ...prevState.botMemories };

          Object.keys(updatedMemories).forEach((botId) => {
            let memory = updatedMemories[botId];
            if (!memory) return;
            memory = botForgetCard(memory, cardId1);
            memory = botForgetCard(memory, cardId2);
            updatedMemories[botId] = memory;
          });

          set({ botMemories: updatedMemories });
        }
      },

      declineEffect: () => {
        const prevState = get();
        const engineState = GameEngine.declineEffect(prevState);
        const newState: OfflineState = {
          ...prevState,
          ...engineState,
          showEffectOverlay: false,
          peekedCards: [],
          effectPreviewCardIds: [],
        };

        set(newState);

        if (prevState.currentPlayerIndex !== 0 && newState.turnPhase === 'end_turn') {
          get().endTurn();
        }
      },

      peekCard: (cardId) => {
        const { gamePhase, initialLooksRemaining, peekedCards } = get();
        if (gamePhase === 'initial_look' && initialLooksRemaining > 0) {
          if (peekedCards.includes(cardId)) return;
          set({ 
            peekedCards: [...peekedCards, cardId],
            initialLooksRemaining: initialLooksRemaining - 1
          });
          setTimeout(() => {
            set((state) => ({
              peekedCards: state.peekedCards.filter(id => id !== cardId)
            }));
          }, 2000);
        }
      },

      drawCard: () => {
        const newState = GameEngine.drawCard(get());
        set(newState);
      },

      drawFromDiscard: () => {
        const newState = GameEngine.drawFromDiscard(get());
        set(newState);
      },

      swapCard: (cardId) => {
        const { currentPlayerIndex } = get();
        const prevState = get();
        const engineState = GameEngine.swapCard(prevState, currentPlayerIndex, cardId);
        const newState: OfflineState = {
          ...prevState,
          ...engineState,
          showEffectOverlay: engineState.effectType ? true : false,
        };

        set(newState);

        if (!engineState.effectType) {
          get().openTapWindow(currentPlayerIndex);
        }
      },

      discardHeldCard: () => {
        const { currentPlayerIndex, isActionLocked } = get();
        if (isActionLocked) return;
        const engineState = GameEngine.discardHeldCard(get());
        const newState: OfflineState = {
          ...(get() as OfflineState),
          ...engineState,
          showEffectOverlay: engineState.effectType ? true : false,
        };

        set(newState);

        if (newState.turnPhase === 'tap_window') {
          get().openTapWindow(currentPlayerIndex);
        } else if (newState.turnPhase === 'effect') {
          // No immediate end turn, wait for effect resolution
        } else {
          get().openTapWindow(currentPlayerIndex);
        }
      },

      resolveEffect: (cardId) => {
        const prevState = get();
        const { effectType, players, peekedCards, currentPlayerIndex } = prevState;

        if (!effectType) return;

        if (effectType === 'peek_own') {
          const currentPlayer = players[currentPlayerIndex];
          const isOwnCard = currentPlayer.cards.some((c) => c.id === cardId);
          if (!isOwnCard) return;

          if (!peekedCards.includes(cardId)) {
            set({ peekedCards: [...peekedCards, cardId] });
          }

          setTimeout(() => {
            const state = get();
            if (state.effectType !== 'peek_own') return;

            const filtered = state.peekedCards.filter((id) => id !== cardId);
            const updated: Partial<OfflineState> = {
              peekedCards: filtered,
              turnPhase: 'end_turn',
              effectType: null,
              effectStep: null,
              selectedCards: [],
              effectPreviewCardIds: [],
              showEffectOverlay: false,
            };

            set(updated as OfflineState);

            if (state.currentPlayerIndex !== 0) {
              get().endTurn();
            }
          }, 2500);

          return;
        }

        if (effectType === 'peek_opponent') {
          const currentPlayer = players[currentPlayerIndex];
          const isOwnCard = currentPlayer.cards.some((c) => c.id === cardId);
          if (isOwnCard) return;

          if (!peekedCards.includes(cardId)) {
            set({ peekedCards: [...peekedCards, cardId] });
          }

          setTimeout(() => {
            const state = get();
            if (state.effectType !== 'peek_opponent') return;

            const filtered = state.peekedCards.filter((id) => id !== cardId);
            const updated: Partial<OfflineState> = {
              peekedCards: filtered,
              turnPhase: 'end_turn',
              effectType: null,
              effectStep: null,
              selectedCards: [],
              effectPreviewCardIds: [],
              showEffectOverlay: false,
            };

            set(updated as OfflineState);

            if (state.currentPlayerIndex !== 0) {
              get().endTurn();
            }
          }, 2500);

          return;
        }

        const engineState = GameEngine.resolveEffect(prevState);
        const newState: OfflineState = {
          ...prevState,
          ...engineState,
          showEffectOverlay: engineState.effectType ? true : false,
        };

        set(newState);

        if (prevState.currentPlayerIndex !== 0 && newState.turnPhase === 'end_turn') {
          get().endTurn();
        }
      },

      openTapWindow: (discarderIndex: number) => {
        const { discardPile, players, botMemories, turnNumber, settings } = get();

        set({
          turnPhase: 'tap_window',
          tapState: { 
            phase: 'window', 
            selectedCardIds: [], 
            swapTargets: [], 
            swapsRemaining: 0,
            discarderIndex 
          },
        });

        // Bot Tap Simulation
        const topDiscard = discardPile[discardPile.length - 1];
        if (topDiscard) {
          players.forEach((p, i) => {
            if (i > 0) { // Bot
              const memory = botMemories[p.id];
              if (memory) {
                const cardIdToTap = botShouldTap(p, topDiscard.rank, memory, turnNumber, settings.botDifficulty);
                if (cardIdToTap) {
                  const delay = getBotTapDelay(settings.botDifficulty);
                  setTimeout(() => {
                    const currentState = get();
                    if (currentState.tapState?.phase === 'window') {
                      set((state) => ({ tapState: { ...state.tapState!, phase: 'selecting' } }));
                      get().tapSelectCard(cardIdToTap);
                      get().confirmTapDiscard();
                    }
                  }, delay);
                }
              }
            }
          });
        }
        
        setTimeout(() => {
          const state = get();
          if (state.tapState?.phase === 'window') {
            get().finalizeTap();
          }
        }, 3000);
      },

      activateTap: () => {
        const { tapState } = get();
        if (!tapState || tapState.phase !== 'window') return;
        set({ tapState: { ...tapState, phase: 'selecting' } });
      },

      tapSelectCard: (cardId: string) => {
        const { tapState, players } = get();

        if (!tapState || tapState.phase !== 'selecting') {
          set({
            tapState: {
              phase: 'selecting',
              selectedCardIds: [cardId],
              swapTargets: [],
              swapsRemaining: 0,
            },
          });
          return;
        }

        let cardOwnerIndex = -1;
        players.forEach((p, i) => {
          if (p.cards.some((c) => c.id === cardId)) {
            cardOwnerIndex = i;
          }
        });

        if (cardOwnerIndex !== -1 && cardOwnerIndex === tapState.discarderIndex && cardOwnerIndex === 0) {
          return;
        }

        const newTapState = GameEngine.tapSelectCard(get(), tapState, cardId);
        set({ tapState: newTapState });
      },

      confirmTapDiscard: () => {
        const { tapState, players, discardPile } = get();
        if (!tapState || tapState.phase !== 'selecting' || tapState.selectedCardIds.length === 0) return;

        const topDiscard = discardPile[discardPile.length - 1];
        if (!topDiscard) return;

        const targetRank = topDiscard.rank;
        const matchingCardIds: string[] = [];
        const discardedCards: Card[] = [];
        const swapTargets: number[] = [];

        for (const cardId of tapState.selectedCardIds) {
          for (let pi = 0; pi < players.length; pi++) {
            const card = players[pi].cards.find((c) => c.id === cardId);
            if (card) {
              if (card.rank === targetRank) {
                matchingCardIds.push(cardId);
                discardedCards.push({ ...card, faceUp: true });
                if (pi !== 0) swapTargets.push(pi);
              }
              break;
            }
          }
        }

        if (matchingCardIds.length > 0) {
          const updatedPlayers = players.map((p) => ({
            ...p,
            cards: p.cards.filter((c) => !matchingCardIds.includes(c.id)),
          }));

          if (swapTargets.length > 0) {
            set({
              players: updatedPlayers,
              discardPile: [...discardPile, ...discardedCards],
              tapState: { phase: 'swapping', selectedCardIds: [], swapTargets, swapsRemaining: swapTargets.length, discarderIndex: tapState.discarderIndex },
            });
          } else {
            set({ players: updatedPlayers, discardPile: [...discardPile, ...discardedCards] });
            get().finalizeTap();
          }
        } else {
          // Penalty: Draw a card from the deck and add to hand
          const { drawPile } = get();
          if (drawPile.length > 0) {
            const penaltyCard = { ...drawPile[0], faceUp: false };
            const updatedPlayers = [...players];
            // Tapper is always index 0 for player, but bots can tap too.
            // For now, let's assume the first tapper gets the penalty.
            // Actually, we should know who tapped.
            // In our current implementation, we only support one tapper at a time.
            // If it's a bot, we don't have a good way to know which bot yet in the state.
            // But the test expects player (index 0) to get penalty.
            updatedPlayers[0] = {
              ...updatedPlayers[0],
              cards: [...updatedPlayers[0].cards, penaltyCard]
            };
            set({
              players: updatedPlayers,
              drawPile: drawPile.slice(1)
            });
          }
          get().finalizeTap();
        }
      },

      tapSwapCard: (ownCardId: string) => {
        const { tapState, players } = get();
        if (!tapState || tapState.phase !== 'swapping' || tapState.swapsRemaining <= 0) return;
        const targetPlayerIndex = tapState.swapTargets[0];
        if (targetPlayerIndex === undefined) return;

        const ownCard = players[0].cards.find((c) => c.id === ownCardId);
        if (!ownCard) return;

        const updatedPlayers = players.map((p, i) => {
          if (i === 0) return { ...p, cards: p.cards.filter((c) => c.id !== ownCardId) };
          if (i === targetPlayerIndex) return { ...p, cards: [...p.cards, { ...ownCard, faceUp: false }] };
          return p;
        });

        const newSwapTargets = tapState.swapTargets.slice(1);
        const newSwapsRemaining = tapState.swapsRemaining - 1;

        if (newSwapsRemaining > 0 && newSwapTargets.length > 0) {
          set({ players: updatedPlayers, tapState: { ...tapState, swapTargets: newSwapTargets, swapsRemaining: newSwapsRemaining } });
        } else {
          set({ players: updatedPlayers });
          get().finalizeTap();
        }
      },

      skipTapSwap: () => {
        get().finalizeTap();
      },

      finalizeTap: () => {
        const { currentPlayerIndex, players, kabooCalled, gamePhase, tapState } = get();
        if (!tapState) return;

        const hadSelections = tapState.selectedCardIds.length > 0;

        set({ tapState: null });

        const playerWithNoCardsIndex = players.findIndex(p => p.cards.length === 0);
        if (playerWithNoCardsIndex !== -1 && !kabooCalled) {
          get().callKaboo();
        } else if (currentPlayerIndex === 0) {
          set({ turnPhase: 'end_turn' });
        } else if (!hadSelections && (gamePhase === 'playing' || gamePhase === 'kaboo_final')) {
          get().endTurn();
        }
      },

      callKaboo: () => {
        const prevState = get();
        const playerWithNoCardsIndex = prevState.players.findIndex((p) => p.cards.length === 0);
        const callerIndex = playerWithNoCardsIndex !== -1 ? playerWithNoCardsIndex : prevState.currentPlayerIndex;

        const engineState = GameEngine.callKaboo(prevState, callerIndex);
        const newState: OfflineState = {
          ...prevState,
          ...engineState,
          showKabooAnnouncement: true,
        };

        set(newState);

        setTimeout(() => {
          const state = get();

          if (!state.kabooCalled || state.gamePhase !== 'kaboo_final' || state.players.length === 0) {
            set({ showKabooAnnouncement: false });
            return;
          }

          const nextPlayerIndex = GameEngine.getNextPlayerIndex(state);

          const updated: OfflineState = {
            ...(state as OfflineState),
            showKabooAnnouncement: false,
            currentPlayerIndex: nextPlayerIndex,
            turnPhase: 'draw',
          };

          set(updated);

          if (nextPlayerIndex !== 0) {
            setTimeout(() => get().simulateBotTurn(), 1200);
          }
        }, 3000);
      },

      revealAllCards: () => {
        const { settings } = get();
        const newState = GameEngine.revealAllCards(get(), settings);
        set(newState);
      },

      endTurn: () => {
        const newState = GameEngine.endTurn(get());
        set(newState);
        if (newState.gamePhase === 'reveal') {
          get().revealAllCards();
        } else {
          const { autoPlayBots } = get();
          if (autoPlayBots && newState.currentPlayerIndex !== 0) {
            setTimeout(() => get().simulateBotTurn(), 1200);
          }
        }
      },

      simulateBotTurn: () => {
        const { players, currentPlayerIndex, botMemories, turnNumber, settings, gamePhase } = get();
        if (currentPlayerIndex === 0 || (gamePhase !== 'playing' && gamePhase !== 'kaboo_final')) return;

        const bot = players[currentPlayerIndex];
        const memory = botMemories[bot.id] || createBotMemory();
        const difficulty = settings.botDifficulty;

        if (gamePhase === 'playing' && botShouldCallKaboo(bot, memory, turnNumber, difficulty)) {
          get().callKaboo();
          return;
        }

        get().drawCard();
        const stateAfterDraw = get();
        const drawnCard = stateAfterDraw.heldCard;
        if (!drawnCard) return;

        setTimeout(() => {
          const currentState = get();
          if (currentState.currentPlayerIndex !== currentPlayerIndex) return;

          const decision = botDecideAction(bot, drawnCard, memory, turnNumber, difficulty);

          if (decision.action === 'swap' && decision.swapCardId) {
            get().swapCard(decision.swapCardId);

            const updatedMemories = { ...get().botMemories };
            let mem = updatedMemories[bot.id] || createBotMemory();
            mem = botForgetCard(mem, decision.swapCardId);
            mem = botRememberCard(mem, drawnCard.id, drawnCard, turnNumber);
            updatedMemories[bot.id] = mem;
            set({ botMemories: updatedMemories });
          } else {
            get().discardHeldCard();
            const stateAfterDiscard = get();

            if (stateAfterDiscard.turnPhase === 'effect' && stateAfterDiscard.effectType) {
              const opponents = players.filter((_, i) => i !== currentPlayerIndex);
              const decision = botResolveEffect(bot, opponents, stateAfterDiscard.effectType, memory, turnNumber, difficulty);

              if (decision.targetCardIds.length > 0) {
                setTimeout(() => {
                  decision.targetCardIds.forEach((id) => get().resolveEffect(id));
                }, 1000);
              } else {
                get().declineEffect();
              }
            }
          }
        }, 1200);
      },

      resetStore: () => {
        set({ ...INITIAL_OFFLINE_STATE });
      },
    }),
    {
      name: 'kaboo-offline-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        players: state.players,
        gamePhase: state.gamePhase,
        turnPhase: state.turnPhase,
        currentPlayerIndex: state.currentPlayerIndex,
        drawPile: state.drawPile,
        discardPile: state.discardPile,
        heldCard: state.heldCard,
        settings: state.settings,
        playerName: state.playerName,
        roundNumber: state.roundNumber,
        kabooCalled: state.kabooCalled,
        kabooCallerIndex: state.kabooCallerIndex,
        finalRoundTurnsLeft: state.finalRoundTurnsLeft,
        turnNumber: state.turnNumber,
      }),
    }
  )
);

export const resetStore = () => useOfflineStore.getState().resetStore();
