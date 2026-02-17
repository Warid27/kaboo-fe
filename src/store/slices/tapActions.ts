import type { Card } from '@/types/game';
import type { StoreGet, StoreSet } from '../helpers';
import { addLog } from '../helpers';
import { playTapSuccessSound, playTapPenaltySound } from '@/lib/sounds';
import { gameApi } from '@/services/gameApi';
import { toast } from '@/components/ui/use-toast';
import { botShouldTap, getBotTapDelay } from '@/lib/botAI';

export function createTapActions(set: StoreSet<any>, get: StoreGet<any>) {
  return {
    openTapWindow: (discarderIndex: number) => {
      const { turnPhase, players, discardPile, botMemories, turnNumber, settings, gameMode } = get() as any;
      if (turnPhase === 'effect') return; // Don't interrupt effects

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
      if (gameMode === 'offline') {
        const topDiscard = discardPile[discardPile.length - 1];
        if (topDiscard) {
          players.forEach((p: any, i: number) => {
            if (i > 0) { // Bot
              const memory = botMemories[p.id];
              if (memory) {
                const cardIdToTap = botShouldTap(p, topDiscard.rank, memory, turnNumber, settings.botDifficulty);
                if (cardIdToTap) {
                  // Bot decided to tap!
                  // Use reaction time based on difficulty
                  const delay = getBotTapDelay(settings.botDifficulty);
                  setTimeout(() => {
                    const currentState = get() as any;
                    if (currentState.tapState?.phase === 'window') {
                      // Actually perform the tap
                      set(s => ({
                        tapState: {
                          ...s.tapState!,
                          phase: 'selecting',
                          selectedCardIds: [cardIdToTap]
                        }
                      }));
                      get().confirmTapDiscard();
                    }
                  }, delay);
                }
              }
            }
          });
        }
      }

      setTimeout(() => {
        const state = get();
        if (state.tapState?.phase === 'window') {
          get().finalizeTap();
        }
      }, 3000);
    },

    activateTap: () => {
      const { tapState } = get() as any;
      if (!tapState || tapState.phase !== 'window') return;
      set({ tapState: { ...tapState, phase: 'selecting' } });
    },

    tapSelectCard: (cardId: string) => {
      const { tapState, players } = get() as any;
      if (!tapState || tapState.phase !== 'selecting') return;

      // Prevent tapping if you were the discarder
      let cardOwnerIndex = -1;
      players.forEach((p: any, i: number) => {
        if (p.cards.some((c: any) => c.id === cardId)) {
          cardOwnerIndex = i;
        }
      });

      // Prevent tapping if you were the discarder and trying to tap your own card
      // In standard Kaboo, the discarder CANNOT snap their own cards in the window they created.
      if (cardOwnerIndex !== -1 && cardOwnerIndex === tapState.discarderIndex && cardOwnerIndex === 0) {
        toast({
          title: 'Invalid Action',
          description: 'You cannot snap your own cards if you were the discarder.',
          variant: 'destructive',
        });
        return;
      }

      const current = tapState.selectedCardIds;
      set({
        tapState: {
          ...tapState,
          selectedCardIds: current.includes(cardId)
            ? current.filter((id: string) => id !== cardId)
            : [...current, cardId],
        },
      });
    },

    confirmTapDiscard: async () => {
      const { tapState, players, discardPile, drawPile, gameMode, gameId } = get() as any;
      if (!tapState || tapState.phase !== 'selecting' || tapState.selectedCardIds.length === 0) return;

      if (gameMode === 'online') {
          // Process snaps sequentially
          for (const cardId of tapState.selectedCardIds) {
              // Find the card index for this player
              // In online mode, we assume 'players' state is synced.
              // We need to find which player owns this card and the index.
              let targetPlayerId: string | undefined;
              let cardIndex = -1;
              
              players.forEach((p: any) => {
                  const idx = p.cards.findIndex((c: any) => c.id === cardId);
                  if (idx !== -1) {
                      targetPlayerId = p.id;
                      cardIndex = idx;
                  }
              });

              if (targetPlayerId && cardIndex !== -1) {
                  // Only allow snapping if it's the current user?
                  // Backend 'snapCard' takes userId.
                  // If I am snapping my own card: OK.
                  // If I am snapping someone else's card?
                  // Kaboo rules: You can snap ANY matching card if you are the fastest.
                  // But 'snapCard' in backend implementation (line 265):
                  // snapCard(state, userId, cardIndex) -> "const player = state.players[userId]"
                  // It implies you can only snap YOUR OWN cards in the current backend logic?
                  // Let's re-read backend rule: "const player = state.players[userId]; if (!player.cards[cardIndex]) throw..."
                  // YES. The current backend implementation ONLY allows snapping your OWN cards.
                  // Frontend logic allows selecting any card?
                  // Frontend: "for (let pi = 0; pi < players.length; pi++) ... if (pi !== 0) swapTargets.push(pi)"
                  // Frontend supports snapping others' cards (and then swapping).
                  // Backend Limitation: The current backend `snapCard` function seems to assume `userId` is the owner of the card.
                  
                  // Wait, if I snap someone else's card, I need to provide THEIR userId?
                  // But `processMove` calls `snapCard(state, userId, action.cardIndex)`.
                  // And `snapCard` uses `state.players[userId]`.
                  // So `userId` is the caller (me).
                  // So I can only snap MY OWN cards with the current backend.
                  // This is a discrepancy or a simplified rule in backend.
                  // However, let's implement what we can: Snapping OWN cards.
                  
                  const { myPlayerId } = get() as any;
                  if (targetPlayerId === myPlayerId) {
                      try {
                          await gameApi.playMove(gameId, { type: 'SNAP', cardIndex });
                      } catch {
                          toast({ title: 'Action Failed', description: 'Failed to snap card.', variant: 'destructive' });
                      }
                  } else {
                      toast({ title: 'Not Supported', description: 'Can only snap your own cards online currently.', variant: 'destructive' });
                  }
              }
          }
          // Reset tap state handled by subscription or manually
          set({ tapState: null });
          return;
      }

      const topDiscard = discardPile[discardPile.length - 1];
      if (!topDiscard) return;

      const targetRank = topDiscard.rank;
      const matchingCardIds: string[] = [];
      const discardedCards: Card[] = [];
      const swapTargets: number[] = [];

      for (const cardId of tapState.selectedCardIds) {
        for (let pi = 0; pi < players.length; pi++) {
          const card = players[pi].cards.find((c: any) => c.id === cardId);
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
        const updatedPlayers = players.map((p: any) => ({
          ...p,
          cards: p.cards.filter((c: any) => !matchingCardIds.includes(c.id)),
        }));
        addLog(get, set, 0, `[HAND] tapped ${matchingCardIds.length} matching card(s)`);
        playTapSuccessSound();

        if (swapTargets.length > 0) {
          set({
            players: updatedPlayers,
            discardPile: [...discardPile, ...discardedCards],
            tapState: { phase: 'swapping', selectedCardIds: [], swapTargets, swapsRemaining: swapTargets.length },
          });
        } else {
          set({ players: updatedPlayers, discardPile: [...discardPile, ...discardedCards] });
          get().finalizeTap();
        }
      } else {
        if (drawPile.length > 0) {
          const penaltyCard = drawPile[0];
          const updatedPlayers = players.map((p: any, i: number) =>
            i === 0 ? { ...p, cards: [...p.cards, { ...penaltyCard, faceUp: false }] } : p
          );
          set({ players: updatedPlayers, drawPile: drawPile.slice(1) });
        }
        addLog(get, set, 0, '[CROSS] wrong tap! Penalty card');
        playTapPenaltySound();
        get().finalizeTap();
      }
    },

    tapSwapCard: (ownCardId: string) => {
      const { tapState, players } = get() as any;
      if (!tapState || tapState.phase !== 'swapping' || tapState.swapsRemaining <= 0) return;
      const targetPlayerIndex = tapState.swapTargets[0];
      if (targetPlayerIndex === undefined) return;

      const ownCard = players[0].cards.find((c: any) => c.id === ownCardId);
      if (!ownCard) return;

      const updatedPlayers = players.map((p: any, i: number) => {
        if (i === 0) return { ...p, cards: p.cards.filter((c: any) => c.id !== ownCardId) };
        if (i === targetPlayerIndex) return { ...p, cards: [...p.cards, { ...ownCard, faceUp: false }] };
        return p;
      });

      const newSwapTargets = tapState.swapTargets.slice(1);
      const newSwapsRemaining = tapState.swapsRemaining - 1;
      addLog(get, set, 0, `[REFRESH] placed card in ${players[targetPlayerIndex].name}'s hand`);

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
      const { currentPlayerIndex, players, kabooCalled } = get() as any;
      set({ tapState: null });

      // Check if any player has 0 cards and trigger auto-Kaboo if not already called
      const playerWithNoCardsIndex = players.findIndex((p: any) => p.cards.length === 0);
      if (playerWithNoCardsIndex !== -1 && !kabooCalled) {
        get().callKaboo();
        return;
      }

      if (currentPlayerIndex === 0) {
        set({ turnPhase: 'end_turn' });
      } else {
        get().endTurn();
      }
    },
  };
}
