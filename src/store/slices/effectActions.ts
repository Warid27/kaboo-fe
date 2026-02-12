import type { StoreGet, StoreSet } from '../helpers';
import { gameApi } from '@/services/gameApi';
import { toast } from '@/components/ui/use-toast';
import { botForgetCard } from '@/lib/botAI';

export function createEffectActions(set: StoreSet, get: StoreGet) {
  return {
    resolveEffect: async (targetCardId: string) => {
      const { effectType, effectStep, players, gameMode, gameId } = get();
      if (!effectType) return;

      if (gameMode === 'online') {
          // PEEK OWN
          if (effectType === 'peek_own') {
              const player = players[0];
              const cardIndex = player.cards.findIndex(c => c.id === targetCardId);
              if (cardIndex !== -1) {
                  try {
                    await gameApi.playMove(gameId, { type: 'PEEK_OWN', cardIndex });
                    // If successful, frontend knows the card, just trigger peek animation
                    get().peekCard(targetCardId); 
                  } catch {
                    toast({ title: 'Effect Failed', description: 'Failed to peek own card.', variant: 'destructive' });
                  }
              }
              return;
          }
          // PEEK OPPONENT
          if (effectType === 'peek_opponent') {
              // Find target player and card index
              let targetPlayerId: string | undefined;
              let cardIndex = -1;
              
              players.forEach(p => {
                  const idx = p.cards.findIndex(c => c.id === targetCardId);
                  if (idx !== -1) {
                      targetPlayerId = p.id;
                      cardIndex = idx;
                  }
              });

              if (targetPlayerId && cardIndex !== -1 && targetPlayerId !== players[0].id) {
                   try {
                     await gameApi.playMove(gameId, { type: 'SPY_OPPONENT', targetPlayerId, cardIndex });
                     // If result contains card info, we could show it.
                     // For now, trigger peek animation (might show card back if value not present)
                     get().peekCard(targetCardId);
                   } catch {
                     toast({ title: 'Effect Failed', description: 'Failed to peek opponent card.', variant: 'destructive' });
                   }
              }
              return;
          }
          
          // For Swaps, we continue to use local selection logic until confirmEffect is called.
          // Fall through to existing selection logic below.
      }

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
        const { effectPreviewCardIds } = get();
        if (effectStep === 'select') {
          // Can peek at ANY card on the table (own or opponent)
          set({
            effectPreviewCardIds: [targetCardId],
            effectStep: 'preview',
            selectedCards: [],
          });
        } else if (effectStep === 'preview') {
          // Can swap the peeked card with ANY other card on the table (own or another opponent)
          const peekedId = effectPreviewCardIds[0];
          if (targetCardId === peekedId) return; // Can't swap with itself
          
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

            if (updated.length >= 2) {
              // Full vision swap allows any two cards on the table
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

    confirmEffect: async () => {
      const { effectType, selectedCards, effectPreviewCardIds, players, memorizedCards, gameMode, gameId } = get();

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

      if (gameMode === 'online') {
          // Identify players and indices for card1 and card2
          let c1Info: { playerId: string; cardIndex: number } | null = null;
          let c2Info: { playerId: string; cardIndex: number } | null = null;

          players.forEach(p => {
              p.cards.forEach((c, i) => {
                  if (c.id === card1Id) c1Info = { playerId: p.id, cardIndex: i };
                  if (c.id === card2Id) c2Info = { playerId: p.id, cardIndex: i };
              });
          });

          if (c1Info && c2Info) {
              try {
                  await gameApi.playMove(gameId, { 
                      type: 'SWAP_ANY', 
                      card1: c1Info, 
                      card2: c2Info 
                  });
              } catch {
                  toast({ title: 'Effect Failed', description: 'Failed to perform swap.', variant: 'destructive' });
              }
          }
          // Reset local selection state is handled by subscription updates usually,
          // but we should clear selection overlays locally.
           set({
            effectType: null,
            effectStep: null,
            showEffectOverlay: false,
            selectedCards: [],
            peekedCards: [],
            effectPreviewCardIds: [],
          });
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
      const updatedMemories = { ...get().botMemories };

      if (card1Id && card2Id) {
        if (effectType === 'blind_swap') {
          updatedMemorized = memorizedCards.filter((id) => id !== card1Id && id !== card2Id);
        }

        if (gameMode === 'offline') {
          Object.keys(updatedMemories).forEach((botId) => {
            let mem = updatedMemories[botId];
            // Bots forget cards involved in any swap performed by the player
            mem = botForgetCard(mem, card1Id);
            mem = botForgetCard(mem, card2Id);
            updatedMemories[botId] = mem;
          });
        }
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
        botMemories: updatedMemories,
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
