import type { StoreGet, StoreSet } from '../helpers';
import { addLog } from '../helpers';
import { getEffectType, getSuitSymbol } from '@/lib/cardUtils';
import { createBotMemory, botRememberCard, botForgetCard } from '@/lib/botAI';
import { playDrawSound, playSwapSound, playDiscardSound, playEffectSound, playPeekSound } from '@/lib/sounds';
import { useReplayStore } from '../replayStore';
import { captureSnapshot } from '../snapshotHelper';

export function createCardActions(set: StoreSet, get: StoreGet) {
  return {
    peekCard: (cardId: string) => {
      const { initialLooksRemaining, gamePhase, peekedCards, memorizedCards } = get();

      if (peekedCards.includes(cardId)) return;

      if (gamePhase === 'initial_look' && initialLooksRemaining > 0) {
        if (peekedCards.length > 0) return;
        if (memorizedCards.includes(cardId)) return;

        playPeekSound();
        set({
          peekedCards: [...peekedCards, cardId],
          initialLooksRemaining: initialLooksRemaining - 1,
        });

        setTimeout(() => {
          const current = get();
          set({
            peekedCards: current.peekedCards.filter((id) => id !== cardId),
            memorizedCards: [...current.memorizedCards, cardId],
          });

          if (current.initialLooksRemaining <= 0) {
            setTimeout(() => {
              set({ gamePhase: 'playing', turnPhase: 'draw' });
            }, 500);
          }
        }, 2000);
      } else if (gamePhase === 'playing' || gamePhase === 'kaboo_final') {
        set({ peekedCards: [...peekedCards, cardId] });
        setTimeout(() => {
          const current = get();
          set({
            peekedCards: current.peekedCards.filter((id) => id !== cardId),
            showEffectOverlay: false,
            effectType: null,
            turnPhase: 'end_turn',
          });
        }, 2000);
      }
    },

    drawCard: () => {
      const { drawPile, turnPhase, currentPlayerIndex } = get();
      if (turnPhase !== 'draw' || drawPile.length === 0) return;

      const drawnCard = { ...drawPile[0], faceUp: true };
      get().addFlyingCard(drawnCard, 'draw-pile', 'held-card');
      set({
        heldCard: drawnCard,
        drawPile: drawPile.slice(1),
        turnPhase: 'action',
      });
      addLog(get, set, currentPlayerIndex, `drew a card`);
      playDrawSound();
      useReplayStore.getState().pushSnapshot('draw', captureSnapshot(get()));
    },

    swapCard: (playerCardId: string) => {
      const { heldCard, players, currentPlayerIndex, discardPile, botMemories, gameMode } = get();
      if (!heldCard) return;

      const player = players[currentPlayerIndex];
      const cardIndex = player.cards.findIndex((c) => c.id === playerCardId);
      if (cardIndex === -1) return;

      const oldCard = { ...player.cards[cardIndex], faceUp: true };
      get().addFlyingCard(oldCard, `card-${playerCardId}`, 'discard-pile');
      const newCard = { ...heldCard, faceUp: false };

      const updatedCards = [...player.cards];
      updatedCards[cardIndex] = newCard;

      const updatedPlayers = players.map((p, i) =>
        i === currentPlayerIndex ? { ...p, cards: updatedCards } : p
      );

      const updatedMemories = { ...botMemories };
      if (gameMode === 'offline' && currentPlayerIndex > 0) {
        const botId = player.id;
        let mem = updatedMemories[botId] ?? createBotMemory();
        mem = botForgetCard(mem, playerCardId);
        mem = botRememberCard(mem, newCard.id, heldCard);
        updatedMemories[botId] = mem;
      }

      const effect = get().settings.useEffectCards ? getEffectType(oldCard.rank) : null;

      addLog(get, set, currentPlayerIndex, `swapped → discarded ${oldCard.rank}${getSuitSymbol(oldCard.suit)}`);
      playSwapSound();
      if (effect && currentPlayerIndex === 0) {
        set({
          players: updatedPlayers,
          discardPile: [...discardPile, oldCard],
          heldCard: null,
          effectType: effect,
          effectStep: (effect === 'peek_own' || effect === 'peek_opponent') ? null : 'select',
          showEffectOverlay: true,
          turnPhase: 'effect',
          effectTimeRemaining: 10,
          selectedCards: [],
          effectPreviewCardIds: [],
          botMemories: updatedMemories,
        });
      } else {
        set({
          players: updatedPlayers,
          discardPile: [...discardPile, oldCard],
          heldCard: null,
          botMemories: updatedMemories,
        });
        get().openTapWindow();
      }
      useReplayStore.getState().pushSnapshot('swap', captureSnapshot(get()));
    },

    discardHeldCard: () => {
      const { heldCard, discardPile, currentPlayerIndex } = get();
      if (!heldCard) return;

      const discarded = { ...heldCard, faceUp: true };
      get().addFlyingCard(discarded, 'held-card', 'discard-pile');
      const effect = get().settings.useEffectCards ? getEffectType(discarded.rank) : null;

      addLog(get, set, currentPlayerIndex, `discarded ${discarded.rank}${getSuitSymbol(discarded.suit)}`);
      playDiscardSound();
      if (effect) {
        playEffectSound();
        set({
          discardPile: [...discardPile, discarded],
          heldCard: null,
          effectType: effect,
          effectStep: (effect === 'peek_own' || effect === 'peek_opponent') ? null : 'select',
          showEffectOverlay: true,
          turnPhase: 'effect',
          effectTimeRemaining: 10,
          selectedCards: [],
          effectPreviewCardIds: [],
        });
        const effectNames: Record<string, string> = {
          peek_own: '👁 peeked at own card',
          peek_opponent: '🔍 peeking at opponent card',
          blind_swap: '🔀 blind swap activated',
          semi_blind_swap: '🃏 semi-blind swap activated',
          full_vision_swap: '👑 full vision swap activated',
        };
        addLog(get, set, currentPlayerIndex, effectNames[effect] ?? 'used an effect');
      } else {
        set({
          discardPile: [...discardPile, discarded],
          heldCard: null,
        });
        get().openTapWindow();
      }
      useReplayStore.getState().pushSnapshot('discard', captureSnapshot(get()));
    },

    discardPair: (cardId1: string, cardId2: string) => {
      const { players, currentPlayerIndex, discardPile, settings, turnPhase, heldCard } = get();
      if (!settings.mattsPairsRule) return;
      if (turnPhase !== 'action' || currentPlayerIndex !== 0 || !heldCard) return;

      const player = players[0];
      const card1 = player.cards.find((c) => c.id === cardId1);
      const card2 = player.cards.find((c) => c.id === cardId2);
      if (!card1 || !card2 || card1.rank !== card2.rank) return;

      const discardedCards = [
        { ...card1, faceUp: true },
        { ...card2, faceUp: true },
      ];

      const updatedPlayers = players.map((p, i) =>
        i === 0
          ? { ...p, cards: p.cards.filter((c) => c.id !== cardId1 && c.id !== cardId2) }
          : p
      );

      addLog(get, set, 0, `🃏 discarded pair of ${card1.rank}s`);
      playDiscardSound();

      set({
        players: updatedPlayers,
        discardPile: [...discardPile, ...discardedCards],
        selectedCards: [],
        memorizedCards: get().memorizedCards.filter((id) => id !== cardId1 && id !== cardId2),
      });
      useReplayStore.getState().pushSnapshot('discardPair', captureSnapshot(get()));
    },

    selectCard: (cardId: string) =>
      set((state) => ({
        selectedCards: state.selectedCards.includes(cardId)
          ? state.selectedCards.filter((id) => id !== cardId)
          : [...state.selectedCards, cardId],
      })),

    clearSelection: () => set({ selectedCards: [] }),
  };
}
