import { useEffect } from 'react';
import { useOfflineStore } from '@/store/offlineStore';
import { 
  botDecideAction, 
  botInitialPeek, 
  botResolveEffect, 
  botShouldCallKaboo 
} from '@/lib/botAI';

export const useOfflineGame = () => {
  const state = useOfflineStore();
  
  // 1. Initial Look Bot Logic
  useEffect(() => {
    if (state.gamePhase === 'initial_look') {
      state.players.slice(1).forEach((bot) => {
        const peekedIds = botInitialPeek(bot, state.settings.botDifficulty);
        peekedIds.forEach((cardId) => {
          const card = bot.cards.find(c => c.id === cardId);
          if (card) state.updateBotMemory(bot.id, cardId, card);
        });
      });
    }
  }, [state.gamePhase]);

  // 2. Bot Turn Logic
  useEffect(() => {
    if (state.gamePhase === 'playing' && state.currentPlayerIndex > 0 && !state.isPaused) {
      const currentPlayer = state.players[state.currentPlayerIndex];
      const botMemory = state.botMemories[currentPlayer.id];
      if (!botMemory) return;

      const runBotTurn = async () => {
        // Wait a bit for natural feel
        await new Promise(r => setTimeout(r, 1000 + Math.random() * 1000));
        
        // Re-check pause state after delay
        if (useOfflineStore.getState().isPaused) return;

        // a. Maybe call Kaboo
        if (!state.kabooCalled && botShouldCallKaboo(currentPlayer, botMemory, state.turnNumber, state.settings.botDifficulty)) {
          state.callKaboo();
          await new Promise(r => setTimeout(r, 1000));
          if (useOfflineStore.getState().isPaused) return;
        }

        // b. Draw card
        state.drawCard();
        await new Promise(r => setTimeout(r, 1000));
        if (useOfflineStore.getState().isPaused) return;

        // Refresh state after draw
        const { heldCard } = useOfflineStore.getState();
        if (!heldCard) return;

        // c. Decide action
        const decision = botDecideAction(
          currentPlayer, 
          heldCard, 
          botMemory, 
          state.turnNumber, 
          state.settings.botDifficulty
        );

        if (decision.action === 'swap' && decision.swapCardId) {
          state.swapCard(decision.swapCardId);
        } else {
          state.discardHeldCard();
          
          // d. Handle effect if discarded card has one
          const updatedState = useOfflineStore.getState();
          if (updatedState.turnPhase === 'effect' && updatedState.effectType) {
            await new Promise(r => setTimeout(r, 1000));
            if (useOfflineStore.getState().isPaused) return;
            
            const effectDecision = botResolveEffect(
              currentPlayer,
              state.players.filter(p => p.id !== currentPlayer.id),
              updatedState.effectType,
              botMemory,
              state.turnNumber,
              state.settings.botDifficulty
            );
            
            if (effectDecision.targetCardIds.length > 0) {
              state.resolveEffect(effectDecision.targetCardIds[0]);
            }
          }
        }

        // e. End turn
        await new Promise(r => setTimeout(r, 1000));
        if (useOfflineStore.getState().isPaused) return;
        state.endTurn();
      };

      runBotTurn();
    }
  }, [state.gamePhase, state.currentPlayerIndex, state.isPaused]);

  return state;
};
