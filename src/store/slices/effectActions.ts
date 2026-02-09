import type { StoreGet, StoreSet } from '../helpers';

export function createEffectActions(set: StoreSet, get: StoreGet) {
  return {
    resolveEffect: (targetCardId: string) => {
      const { effectType, effectStep, players } = get();
      if (!effectType) return;

      if (effectType === 'peek_own') {
        const isOwnCard = players[0].cards.some((c) => c.id === targetCardId);
        if (!isOwnCard) return;
        get().peekCard(targetCardId);
        return;
      }

      if (effectType === 'peek_opponent') {
        const isOwnCard = players[0].cards.some((c) => c.id === targetCardId);
        if (isOwnCard) return;
        get().peekCard(targetCardId);
        return;
      }

      if (effectType === 'blind_swap') {
        const current = get().selectedCards;
        if (current.includes(targetCardId)) {
          set({ selectedCards: current.filter((id) => id !== targetCardId) });
        } else if (current.length < 2) {
          set({ selectedCards: [...current, targetCardId] });
        }
        return;
      }

      if (effectType === 'semi_blind_swap') {
        if (effectStep === 'select') {
          const isOwnCard = players[0].cards.some((c) => c.id === targetCardId);
          if (isOwnCard) return;
          set({
            effectPreviewCardIds: [targetCardId],
            effectStep: 'preview',
            selectedCards: [],
          });
        } else if (effectStep === 'preview') {
          const isOwnCard = players[0].cards.some((c) => c.id === targetCardId);
          if (!isOwnCard) return;
          const current = get().selectedCards;
          if (current.includes(targetCardId)) {
            set({ selectedCards: [] });
          } else {
            set({ selectedCards: [targetCardId] });
          }
        }
        return;
      }

      if (effectType === 'full_vision_swap') {
        if (effectStep === 'select') {
          const current = get().selectedCards;
          if (current.includes(targetCardId)) {
            set({ selectedCards: current.filter((id) => id !== targetCardId) });
          } else if (current.length < 2) {
            const updated = [...current, targetCardId];

            // Validate: must have one own card and one opponent card
            if (updated.length >= 2) {
              const ownCardIds = new Set(players[0].cards.map((c) => c.id));
              const hasOwn = updated.some((id) => ownCardIds.has(id));
              const hasOpponent = updated.some((id) => !ownCardIds.has(id));

              if (!hasOwn || !hasOpponent) {
                // Invalid selection — don't advance
                set({ selectedCards: updated });
                return;
              }

              set({
                selectedCards: updated,
                effectPreviewCardIds: [...updated],
                effectStep: 'preview',
              });
            } else {
              set({ selectedCards: updated });
            }
          }
        }
        return;
      }
    },

    confirmEffect: () => {
      const { effectType, selectedCards, effectPreviewCardIds, players, memorizedCards } = get();

      let card1Id: string | undefined;
      let card2Id: string | undefined;

      if (effectType === 'blind_swap') {
        if (selectedCards.length < 2) return;
        card1Id = selectedCards[0];
        card2Id = selectedCards[1];
      } else if (effectType === 'semi_blind_swap') {
        if (effectPreviewCardIds.length < 1 || selectedCards.length < 1) return;
        card1Id = effectPreviewCardIds[0];
        card2Id = selectedCards[0];
      } else if (effectType === 'full_vision_swap') {
        if (effectPreviewCardIds.length < 2) return;
        card1Id = effectPreviewCardIds[0];
        card2Id = effectPreviewCardIds[1];
      } else {
        return;
      }

      const updatedPlayers = [...players];
      let c1Info: { playerIdx: number; cardIdx: number } | null = null;
      let c2Info: { playerIdx: number; cardIdx: number } | null = null;

      for (let pi = 0; pi < updatedPlayers.length; pi++) {
        const player = updatedPlayers[pi];
        for (let ci = 0; ci < player.cards.length; ci++) {
          const card = player.cards[ci];
          if (card.id === card1Id) c1Info = { playerIdx: pi, cardIdx: ci };
          if (card.id === card2Id) c2Info = { playerIdx: pi, cardIdx: ci };
        }
      }

      if (c1Info && c2Info) {
        const temp = updatedPlayers[c1Info.playerIdx].cards[c1Info.cardIdx];
        updatedPlayers[c1Info.playerIdx] = {
          ...updatedPlayers[c1Info.playerIdx],
          cards: updatedPlayers[c1Info.playerIdx].cards.map((c, i) =>
            i === c1Info!.cardIdx
              ? { ...updatedPlayers[c2Info!.playerIdx].cards[c2Info!.cardIdx], faceUp: false }
              : c
          ),
        };
        updatedPlayers[c2Info.playerIdx] = {
          ...updatedPlayers[c2Info.playerIdx],
          cards: updatedPlayers[c2Info.playerIdx].cards.map((c, i) =>
            i === c2Info!.cardIdx ? { ...temp, faceUp: false } : c
          ),
        };
      }

      let updatedMemorized = memorizedCards;
      if (effectType === 'blind_swap' && card1Id && card2Id) {
        updatedMemorized = memorizedCards.filter((id) => id !== card1Id && id !== card2Id);
      }

      set({
        players: updatedPlayers,
        effectType: null,
        effectStep: null,
        showEffectOverlay: false,
        selectedCards: [],
        peekedCards: [],
        effectPreviewCardIds: [],
        memorizedCards: updatedMemorized,
        turnPhase: 'end_turn',
      });
    },

    declineEffect: () => {
      set({
        effectType: null,
        effectStep: null,
        showEffectOverlay: false,
        selectedCards: [],
        peekedCards: [],
        effectPreviewCardIds: [],
        turnPhase: 'end_turn',
      });
    },
  };
}
