import type { Card } from '@/types/game';
import type { StoreGet, StoreSet } from '../helpers';
import { addLog } from '../helpers';
import { playTapSuccessSound, playTapPenaltySound } from '@/lib/sounds';

export function createTapActions(set: StoreSet, get: StoreGet) {
  return {
    openTapWindow: () => {
      set({
        turnPhase: 'tap_window',
        tapState: { phase: 'window', selectedCardIds: [], swapTargets: [], swapsRemaining: 0 },
      });
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
      const { tapState } = get();
      if (!tapState || tapState.phase !== 'selecting') return;
      const current = tapState.selectedCardIds;
      set({
        tapState: {
          ...tapState,
          selectedCardIds: current.includes(cardId)
            ? current.filter((id) => id !== cardId)
            : [...current, cardId],
        },
      });
    },

    confirmTapDiscard: () => {
      const { tapState, players, discardPile, drawPile } = get();
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
          const updatedPlayers = players.map((p, i) =>
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
      const { currentPlayerIndex } = get();
      set({ tapState: null });
      if (currentPlayerIndex === 0) {
        set({ turnPhase: 'end_turn' });
      } else {
        get().endTurn();
      }
    },
  };
}
